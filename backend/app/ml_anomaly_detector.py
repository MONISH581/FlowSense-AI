import numpy as np
import pandas as pd
from typing import Dict, Any, List
from sklearn.ensemble import IsolationForest

def detect_workflow_anomalies(events_df: pd.DataFrame, contamination: float = 0.05) -> Dict[str, Any]:
    """
    Applies Isolation Forest to detect abnormal workflow execution, extreme delays,
    and irregular processing or waiting times.
    """
    if len(events_df) < 20:
        return {"anomalies": [], "total_anomalies": 0, "contamination_rate": contamination}

    # Features for Isolation Forest
    cost_col = "Cost" if "Cost" in events_df.columns else ("cost" if "cost" in events_df.columns else None)
    features = [
        "duration_minutes",
        "waiting_time_minutes",
        "step_sequence"
    ]
    if cost_col:
        features.append(cost_col)

    X = events_df[features].fillna(0.0).copy()

    iso_forest = IsolationForest(
        n_estimators=100,
        contamination=contamination,
        random_state=42
    )

    preds = iso_forest.fit_predict(X)
    scores = iso_forest.decision_function(X)

    # Calculate activity-level baseline medians for explainability
    act_medians = events_df.groupby("Activity")["duration_minutes"].median().to_dict()
    act_wait_medians = events_df.groupby("Activity")["waiting_time_minutes"].median().to_dict()

    anomaly_indices = np.where(preds == -1)[0]
    
    anomalies_list = []
    anomaly_id = 1

    for idx in anomaly_indices:
        row = events_df.iloc[idx]
        case_id = str(row["Case_ID"])
        act = str(row["Activity"])
        dept = str(row.get("Department", "Operations"))
        dur = float(row["duration_minutes"])
        wait = float(row["waiting_time_minutes"])
        seq = int(row["step_sequence"])
        raw_score = float(scores[idx])

        # Normalize anomaly score from [-0.5, 0] to [0.0, 1.0]
        norm_score = round(min(1.0, max(0.0, abs(raw_score) * 4.0)), 3)

        expected_dur = float(act_medians.get(act, dur))
        expected_wait = float(act_wait_medians.get(act, wait))

        # Severity
        if norm_score >= 0.75 or dur > (expected_dur * 4.0) or wait > 240.0:
            severity = "Severe"
        elif norm_score >= 0.50 or dur > (expected_dur * 2.5):
            severity = "High"
        else:
            severity = "Moderate"

        # Generate contextual explanation
        reasons = []
        if dur > expected_dur * 2.5:
            ratio = round(dur / (expected_dur or 1.0), 1)
            reasons.append(f"Execution time ({round(dur, 1)}m) is {ratio}x higher than stage median ({round(expected_dur, 1)}m)")
        if wait > expected_wait * 2.5 and wait > 60.0:
            w_ratio = round(wait / (expected_wait or 1.0), 1)
            reasons.append(f"Excessive transition queue waiting ({round(wait, 1)}m, {w_ratio}x typical)")
        if seq > 7:
            reasons.append(f"High sequence position (Step #{seq}), indicating multiple circular rework passes")
        if not reasons:
            reasons.append(f"Multivariate outlier deviation across time, cost (${round(float(row.get('Cost', 0)), 1)}), and sequence")

        explanation = ". ".join(reasons) + "."

        anomalies_list.append({
            "anomaly_id": anomaly_id,
            "case_id": case_id,
            "activity": act,
            "department": dept,
            "actual_time_min": round(dur, 1),
            "expected_time_min": round(expected_dur, 1),
            "waiting_time_min": round(wait, 1),
            "anomaly_score": norm_score,
            "severity": severity,
            "explanation": explanation,
            "timestamp": str(row["Timestamp"])
        })
        anomaly_id += 1

    # Sort anomalies by score descending
    anomalies_list = sorted(anomalies_list, key=lambda a: a["anomaly_score"], reverse=True)

    # Department breakdown
    dept_counts = {}
    for a in anomalies_list:
        d = a["department"]
        dept_counts[d] = dept_counts.get(d, 0) + 1
    anomalies_by_dept = [{"department": k, "count": v} for k, v in dept_counts.items()]

    # Activity breakdown
    act_counts = {}
    for a in anomalies_list:
        ac = a["activity"]
        act_counts[ac] = act_counts.get(ac, 0) + 1
    anomalies_by_act = [{"activity": k, "count": v} for k, v in act_counts.items()]

    return {
        "anomalies": anomalies_list[:80],  # Return top 80 most notable anomalies
        "total_anomalies": len(anomalies_list),
        "contamination_rate": contamination,
        "anomalies_by_department": anomalies_by_dept,
        "anomalies_by_activity": anomalies_by_act
    }
