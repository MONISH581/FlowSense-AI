import json
import datetime
from typing import Dict, Any, List, Optional, Tuple
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import desc

from .models import (
    UploadedDataset, ProcessEvent, ProcessCase, BottleneckResult,
    AnomalyResult, ClusteringResult, DelayPrediction, SimulationRecord, UserSettings
)
from .bottleneck_engine import analyze_bottlenecks
from .process_mining import discover_process_flow
from .ml_delay_predictor import delay_predictor_instance
from .ml_anomaly_detector import detect_workflow_anomalies
from .ml_clustering import cluster_process_cases
from .ai_insights import generate_ai_insights

DEFAULT_SETTINGS = {
    "sla_high_hours": 14.0,
    "sla_medium_hours": 24.0,
    "sla_low_hours": 48.0,
    "anomaly_contamination": 0.05,
    "clustering_k": 4,
    "min_edge_pct": 0.0
}

def get_active_dataset(db: Session, dataset_id: Optional[int] = None, user_id: Optional[int] = None) -> Optional[UploadedDataset]:
    """
    Retrieves the target dataset by ID, or the currently active dataset,
    falling back to the most recent dataset.
    """
    query = db.query(UploadedDataset)
    if user_id:
        # If user is specified, allow datasets owned by user or shared/demo datasets (user_id is None)
        query = query.filter((UploadedDataset.user_id == user_id) | (UploadedDataset.user_id == None))

    if dataset_id:
        return query.filter(UploadedDataset.id == dataset_id).first()

    # Look for active dataset
    active = query.filter(UploadedDataset.is_active == True).order_by(desc(UploadedDataset.id)).first()
    if active:
        return active

    # Fallback to latest
    return query.order_by(desc(UploadedDataset.id)).first()

def list_datasets(db: Session, user_id: Optional[int] = None) -> List[UploadedDataset]:
    """Lists all uploaded datasets."""
    query = db.query(UploadedDataset)
    if user_id:
        query = query.filter((UploadedDataset.user_id == user_id) | (UploadedDataset.user_id == None))
    return query.order_by(desc(UploadedDataset.id)).all()

def activate_dataset(db: Session, dataset_id: int, user_id: Optional[int] = None) -> Optional[UploadedDataset]:
    """Marks a specific dataset as active and deactivates all others."""
    target = get_active_dataset(db, dataset_id=dataset_id, user_id=user_id)
    if not target:
        return None

    # Deactivate all
    db.query(UploadedDataset).update({"is_active": False})
    target.is_active = True
    db.commit()
    db.refresh(target)
    return target

def delete_dataset(db: Session, dataset_id: int, user_id: Optional[int] = None) -> bool:
    """Deletes a dataset and all cascading related records."""
    target = get_active_dataset(db, dataset_id=dataset_id, user_id=user_id)
    if not target:
        return False

    was_active = target.is_active
    db.delete(target)
    db.commit()

    # If the deleted dataset was active, make the latest one active
    if was_active:
        latest = db.query(UploadedDataset).order_by(desc(UploadedDataset.id)).first()
        if latest:
            latest.is_active = True
            db.commit()

    return True

def save_dataset_pipeline(
    db: Session,
    filename: str,
    events_df: pd.DataFrame,
    cases_df: pd.DataFrame,
    quality: Dict[str, Any],
    user_id: Optional[int] = None,
    settings: Optional[Dict[str, Any]] = None
) -> UploadedDataset:
    """
    Executes the analytical pipeline and persists all datasets, events, cases,
    bottlenecks, anomaly results, clustering results, and AI insights into SQLite.
    """
    if settings is None:
        settings = DEFAULT_SETTINGS.copy()

    # 1. Create dataset record and mark active
    db.query(UploadedDataset).update({"is_active": False})
    dataset = UploadedDataset(
        filename=filename,
        row_count=len(events_df),
        case_count=len(cases_df),
        user_id=user_id,
        is_active=True,
        status="processing",
        data_quality_json=json.dumps(quality)
    )
    db.add(dataset)
    db.flush() # Obtain dataset.id

    dataset_id = dataset.id

    # 2. Bulk insert ProcessEvents
    events_to_insert = []
    for _, row in events_df.iterrows():
        events_to_insert.append({
            "dataset_id": dataset_id,
            "case_id": str(row["Case_ID"]),
            "activity": str(row["Activity"]),
            "timestamp": pd.to_datetime(row["Timestamp"]).to_pydatetime(),
            "department": str(row.get("Department", "Operations")),
            "employee": str(row.get("Employee", "System")),
            "status": str(row.get("Status", "Completed")),
            "priority": str(row.get("Priority", "Medium")),
            "process_type": str(row.get("Process_Type", "Standard")),
            "cost": float(row.get("Cost", 0.0)),
            "sla_hours": float(row.get("SLA_Hours", 24.0)),
            "duration_minutes": float(row.get("duration_minutes", 0.0)),
            "waiting_time_minutes": float(row.get("waiting_time_minutes", 0.0)),
            "step_sequence": int(row.get("step_sequence", 1))
        })
    # Batch insert events in chunks of 2000
    for i in range(0, len(events_to_insert), 2000):
        db.bulk_insert_mappings(ProcessEvent, events_to_insert[i:i + 2000])

    # 3. Bulk insert ProcessCases
    cases_to_insert = []
    for _, row in cases_df.iterrows():
        dur_h = float(row["total_duration_hours"])
        sla_h = float(row["sla_hours"])
        risk_cat = "High" if dur_h > sla_h else ("Medium" if dur_h > sla_h * 0.75 else "Low")
        
        cases_to_insert.append({
            "dataset_id": dataset_id,
            "case_id": str(row["Case_ID"]),
            "start_time": pd.to_datetime(row["start_time"]).to_pydatetime() if pd.notnull(row.get("start_time")) else None,
            "end_time": pd.to_datetime(row["end_time"]).to_pydatetime() if pd.notnull(row.get("end_time")) else None,
            "total_duration_hours": dur_h,
            "total_waiting_hours": float(row["total_waiting_hours"]),
            "activity_count": int(row["activity_count"]),
            "rework_count": int(row["rework_count"]),
            "sla_hours": float(row.get("sla_hours", 24.0)),
            "is_delayed": bool(row["is_delayed"]),
            "is_sla_breached": bool(row["is_sla_breached"]),
            "priority": str(row["priority"]),
            "current_status": str(row.get("current_status", "Completed")),
            "last_activity": str(row.get("last_activity", "")),
            "first_department": str(row.get("first_department", "Operations")),
            "risk_category": risk_cat
        })
    for i in range(0, len(cases_to_insert), 2000):
        db.bulk_insert_mappings(ProcessCase, cases_to_insert[i:i + 2000])

    # 4. Bottleneck Detection
    bottlenecks = analyze_bottlenecks(events_df, cases_df)
    b_dict = {b["activity"]: b for b in bottlenecks}
    for b in bottlenecks:
        db.add(BottleneckResult(
            dataset_id=dataset_id,
            activity=b["activity"],
            department=b["department"],
            avg_processing_time_min=b["avg_processing_time_min"],
            median_processing_time_min=b["median_processing_time_min"],
            max_processing_time_min=b["max_processing_time_min"],
            min_processing_time_min=b["min_processing_time_min"],
            avg_waiting_time_min=b["avg_waiting_time_min"],
            cases_affected=b["cases_affected"],
            delay_frequency=b["delay_frequency"],
            delay_percentage=b["delay_percentage"],
            sla_violation_rate=b["sla_violation_rate"],
            bottleneck_score=b["bottleneck_score"],
            severity=b["severity"],
            possible_reason=b["possible_reason"],
            suggested_action=b["suggested_action"]
        ))

    # 5. Process Mining (PM4Py)
    pm_result = discover_process_flow(
        events_df, cases_df, b_dict,
        min_edge_pct=float(settings.get("min_edge_pct", 0.0))
    )
    dataset.process_mining_json = json.dumps(pm_result)

    # 6. ML Delay Predictor Training & Model Persistence
    ml_metrics = delay_predictor_instance.train(events_df, cases_df)
    dataset.ml_metrics_json = json.dumps(ml_metrics)

    # 7. Anomaly Detection (Isolation Forest)
    anomalies = detect_workflow_anomalies(
        events_df,
        contamination=float(settings.get("anomaly_contamination", 0.05))
    )
    for a in anomalies.get("anomalies", []):
        ts_val = pd.to_datetime(a["timestamp"]).to_pydatetime() if a.get("timestamp") else None
        db.add(AnomalyResult(
            dataset_id=dataset_id,
            case_id=a["case_id"],
            activity=a["activity"],
            department=a["department"],
            actual_time_min=a["actual_time_min"],
            expected_time_min=a["expected_time_min"],
            waiting_time_min=a["waiting_time_min"],
            anomaly_score=a["anomaly_score"],
            severity=a["severity"],
            explanation=a["explanation"],
            timestamp=ts_val
        ))

    # 8. Clustering (K-Means)
    clusters = cluster_process_cases(
        cases_df,
        n_clusters=int(settings.get("clustering_k", 4))
    )
    for c in clusters.get("clusters", []):
        db.add(ClusteringResult(
            dataset_id=dataset_id,
            case_id=c["case_id"],
            cluster_id=c["cluster_id"],
            cluster_label=c["cluster_label"],
            duration_hours=c["total_duration_hours"],
            waiting_hours=c["total_waiting_hours"],
            rework_count=c["rework_count"],
            activity_count=c["activity_count"],
            sla_breached=c["sla_breached"],
            pca_x=c["pca_x"],
            pca_y=c["pca_y"]
        ))

    # 9. AI Insights Engine
    insights = generate_ai_insights(
        bottlenecks, cases_df, events_df,
        pm_result.get("rework_activities", [])
    )
    dataset.ai_insights_json = json.dumps(insights)

    dataset.status = "processed"
    db.commit()
    db.refresh(dataset)
    return dataset

def load_dataset_dataframes(db: Session, dataset_id: int) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Reconstructs clean events_df and cases_df DataFrames directly from SQLite records.
    """
    events_records = db.query(ProcessEvent).filter(ProcessEvent.dataset_id == dataset_id).all()
    cases_records = db.query(ProcessCase).filter(ProcessCase.dataset_id == dataset_id).all()

    events_data = [{
        "Case_ID": e.case_id,
        "Activity": e.activity,
        "Timestamp": e.timestamp,
        "Department": e.department,
        "Employee": e.employee,
        "Status": e.status,
        "Priority": e.priority,
        "Process_Type": e.process_type,
        "Cost": e.cost,
        "SLA_Hours": e.sla_hours,
        "duration_minutes": e.duration_minutes,
        "waiting_time_minutes": e.waiting_time_minutes,
        "step_sequence": e.step_sequence
    } for e in events_records]

    cases_data = [{
        "Case_ID": c.case_id,
        "start_time": c.start_time,
        "end_time": c.end_time,
        "total_duration_hours": c.total_duration_hours,
        "total_waiting_hours": c.total_waiting_hours,
        "activity_count": c.activity_count,
        "rework_count": c.rework_count,
        "sla_hours": getattr(c, "sla_hours", 24.0) or (14.0 if getattr(c, "priority", "") == "High" else (48.0 if getattr(c, "priority", "") == "Low" else 24.0)),
        "is_delayed": c.is_delayed,
        "is_sla_breached": c.is_sla_breached,
        "priority": c.priority,
        "current_status": c.current_status,
        "last_activity": c.last_activity,
        "first_department": c.first_department
    } for c in cases_records]

    return pd.DataFrame(events_data), pd.DataFrame(cases_data)

def compute_kpis_from_db(db: Session, dataset: UploadedDataset) -> Dict[str, Any]:
    """
    Generates all 8 scorecards, 7 chart series, and recent cases directly from database records.
    """
    events_df, cases_df = load_dataset_dataframes(db, dataset.id)
    if cases_df.empty:
        return {}

    total_p = len(cases_df)
    delayed_p = int(cases_df["is_delayed"].sum())
    delayed_pct = round((delayed_p / (total_p or 1)) * 100.0, 1)
    completed_p = total_p - delayed_p
    
    avg_dur = round(float(cases_df["total_duration_hours"].mean()), 1)
    avg_wait = round(float(cases_df["total_waiting_hours"].mean()), 1)
    
    eff_score = round(max(15.0, min(98.0, 100.0 - (delayed_pct * 0.85))), 1)
    
    sla_violations = int(cases_df["is_sla_breached"].sum())
    sla_compliance = round(((total_p - sla_violations) / (total_p or 1)) * 100.0, 1)

    crit_b = db.query(BottleneckResult).filter(
        BottleneckResult.dataset_id == dataset.id,
        BottleneckResult.severity.in_(["Critical", "High"])
    ).count()

    high_risk_cnt = int(delayed_p * 0.4)

    # 1. Completion vs Delay
    completion_vs_delay = [
        {"name": "On Time", "value": completed_p, "color": "#10b981"},
        {"name": "Delayed", "value": delayed_p, "color": "#ef4444"}
    ]

    # 2. Monthly trends
    monthly_data = []
    if not events_df.empty and "Timestamp" in events_df.columns:
        events_m = events_df.copy()
        events_m["Month"] = pd.to_datetime(events_m["Timestamp"]).dt.strftime("%b %Y")
        events_m = events_m.merge(cases_df[["Case_ID", "is_delayed"]], on="Case_ID", how="left")
        for month, grp in events_m.groupby("Month", sort=False):
            c_count = grp["Case_ID"].nunique()
            d_count = grp[grp["is_delayed"] == True]["Case_ID"].nunique()
            monthly_data.append({
                "month": month,
                "total_cases": c_count,
                "delayed_cases": d_count,
                "delay_rate": round((d_count / (c_count or 1)) * 100.0, 1)
            })

    # 3. Department performance
    dept_perf = []
    for dept, grp in events_df.groupby("Department"):
        c_ids = grp["Case_ID"].unique()
        d_cases = cases_df[cases_df["Case_ID"].isin(c_ids)]
        avg_w = float(grp["waiting_time_minutes"].mean())
        del_rate = float(d_cases["is_delayed"].mean()) * 100.0 if len(d_cases) > 0 else 0.0
        dept_perf.append({
            "department": dept,
            "avg_waiting_min": round(avg_w, 1),
            "delay_rate": round(del_rate, 1),
            "cases_handled": len(c_ids)
        })

    # 4. Activity processing times
    act_proc = []
    for act, grp in events_df.groupby("Activity"):
        act_proc.append({
            "activity": act,
            "avg_processing_min": round(float(grp["duration_minutes"].mean()), 1),
            "avg_waiting_min": round(float(grp["waiting_time_minutes"].mean()), 1)
        })
    act_proc = sorted(act_proc, key=lambda x: x["avg_processing_min"], reverse=True)

    # 5. Bottleneck distribution
    sev_counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    bn_records = db.query(BottleneckResult).filter(BottleneckResult.dataset_id == dataset.id).all()
    for b in bn_records:
        s = b.severity
        sev_counts[s] = sev_counts.get(s, 0) + 1
    bottleneck_dist = [
        {"severity": k, "count": v, "color": "#dc2626" if k == "Critical" else ("#ea580c" if k == "High" else ("#f59e0b" if k == "Medium" else "#10b981"))}
        for k, v in sev_counts.items()
    ]

    # 6. Efficiency trends (rolling splits)
    eff_trends = []
    sorted_cases = cases_df.sort_values(by="start_time")
    n_splits = min(10, max(1, len(sorted_cases)))
    chunk_size = max(1, len(sorted_cases) // n_splits)
    for idx in range(n_splits):
        chunk = sorted_cases.iloc[idx * chunk_size : (idx + 1) * chunk_size if idx < n_splits - 1 else None]
        if len(chunk) == 0:
            continue
        c_del_rate = float(chunk["is_delayed"].mean()) * 100.0
        eff = round(max(20.0, min(98.0, 100.0 - (c_del_rate * 0.85))), 1)
        eff_trends.append({
            "period": f"Wk {idx + 1}",
            "efficiency": eff,
            "avg_duration": round(float(chunk["total_duration_hours"].mean()), 1)
        })

    # 7. Delay Risk distribution
    sla_hours_series = cases_df.get("sla_hours", pd.Series([24.0] * len(cases_df)))
    risk_low = int((cases_df["total_duration_hours"] < sla_hours_series * 0.75).sum())
    risk_med = int(((cases_df["total_duration_hours"] >= sla_hours_series * 0.75) & (cases_df["total_duration_hours"] <= sla_hours_series)).sum())
    risk_high = int((cases_df["total_duration_hours"] > sla_hours_series).sum())
    delay_risk_dist = [
        {"category": "Low Risk (0-30%)", "cases": risk_low, "color": "#10b981"},
        {"category": "Medium Risk (31-65%)", "cases": risk_med, "color": "#f59e0b"},
        {"category": "High Risk (66-100%)", "cases": risk_high, "color": "#ef4444"}
    ]

    # Recent cases
    recent = []
    for _, row in cases_df.tail(12).iterrows():
        dur_h = float(row["total_duration_hours"])
        sla_h = float(row.get("sla_hours", 24.0))
        risk_cat = "High" if dur_h > sla_h else ("Medium" if dur_h > sla_h * 0.75 else "Low")
        recent.append({
            "case_id": str(row["Case_ID"]),
            "last_activity": str(row.get("last_activity", "")),
            "department": str(row.get("first_department", "Operations")),
            "total_duration_hours": round(dur_h, 1),
            "priority": str(row.get("priority", "Medium")),
            "predicted_risk": risk_cat,
            "status": "Delayed" if row["is_delayed"] else "Completed"
        })

    return {
        "dataset_id": dataset.id,
        "dataset_name": dataset.filename,
        "total_processes": total_p,
        "completed_processes": completed_p,
        "delayed_processes": delayed_p,
        "delayed_percentage": delayed_pct,
        "avg_completion_time_hours": avg_dur,
        "avg_waiting_time_hours": avg_wait,
        "overall_efficiency_score": eff_score,
        "bottlenecks_detected_count": crit_b,
        "high_risk_ongoing_count": high_risk_cnt,
        "sla_violations_count": sla_violations,
        "sla_compliance_rate": sla_compliance,
        "completion_vs_delay": completion_vs_delay,
        "monthly_trends": monthly_data,
        "department_performance": dept_perf,
        "activity_processing_times": act_proc,
        "bottleneck_distribution": bottleneck_dist,
        "efficiency_trends": eff_trends,
        "delay_risk_distribution": delay_risk_dist,
        "recent_cases": recent
    }
