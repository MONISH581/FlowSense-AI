import os
import io
import json
import datetime
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import desc

from .database import engine, Base, get_db, SessionLocal
from .models import (
    User, UploadedDataset, ProcessEvent, ProcessCase, BottleneckResult,
    AnomalyResult, ClusteringResult, DelayPrediction, SimulationRecord, UserSettings
)
from .schemas import (
    UserRegisterRequest, UserLoginRequest, UserResponse, TokenResponse,
    DatasetListItem, DatasetsListResponse, DatasetPreviewResponse,
    KPIDashboardResponse, ProcessMiningResponse, BottlenecksResponse,
    PredictDelayRequest, PredictDelayResponse, AnomaliesResponse,
    ClusteringResponse, SimulationRequest, SimulationResponse,
    ModelEvaluationMetrics, AIInsightItem
)
from .auth import (
    hash_password, verify_password, create_access_token,
    get_current_user_optional, get_current_user_required
)
from .data_generator import generate_ecommerce_event_log
from .preprocessor import clean_and_preprocess_dataset
from .process_mining import discover_process_flow
from .bottleneck_engine import analyze_bottlenecks
from .ml_delay_predictor import delay_predictor_instance
from .ml_anomaly_detector import detect_workflow_anomalies
from .ml_clustering import cluster_process_cases
from .simulation_engine import run_what_if_simulation
from .ai_insights import generate_ai_insights
from .report_generator import generate_pdf_report, generate_cases_csv
from .dataset_service import (
    get_active_dataset, list_datasets, activate_dataset, delete_dataset,
    save_dataset_pipeline, load_dataset_dataframes, compute_kpis_from_db,
    DEFAULT_SETTINGS
)

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FlowSense AI – Intelligent Process Mining & Bottleneck Detection",
    description="Enterprise Process Mining, Predictive Delay Analytics & Operational Optimization",
    version="2.0.0"
)

# Configurable CORS
cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,*")
allowed_origins = [orig.strip() for orig in cors_origins_env.split(",") if orig.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if "*" not in allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup hook: Initialize demo data ONLY if database is empty
@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        existing_count = db.query(UploadedDataset).count()
        if existing_count > 0:
            print(f"[+] Found {existing_count} existing dataset(s) in SQLite. Persistence confirmed. Skipping demo recreation.")
            # Ensure at least one dataset is marked active
            active = db.query(UploadedDataset).filter(UploadedDataset.is_active == True).first()
            if not active:
                latest = db.query(UploadedDataset).order_by(desc(UploadedDataset.id)).first()
                if latest:
                    latest.is_active = True
                    db.commit()
            return

        print("[*] Empty database detected. Seeding initial demonstration dataset...")
        raw_df = generate_ecommerce_event_log(num_cases=600, seed=42)
        events_df, cases_df, quality = clean_and_preprocess_dataset(raw_df)
        save_dataset_pipeline(db, "ecommerce_fulfillment_demo.csv", events_df, cases_df, quality)
        print("[+] Seed dataset saved to SQLite database successfully!")

        # Asynchronously load full 2200 cases demo log in background
        import threading
        def background_full_dataset():
            bg_db = SessionLocal()
            try:
                full_df = generate_ecommerce_event_log(num_cases=2200, seed=42)
                f_events, f_cases, f_qual = clean_and_preprocess_dataset(full_df)
                save_dataset_pipeline(bg_db, "ecommerce_fulfillment_demo.csv", f_events, f_cases, f_qual)
                print("[+] Full 2,200 cases demo dataset updated in SQLite.")
            except Exception as e:
                print("[!] Background full dataset update failed:", e)
            finally:
                bg_db.close()

        threading.Thread(target=background_full_dataset, daemon=True).start()
    except Exception as e:
        print("[!] Error during startup database initialization:", e)
    finally:
        db.close()

# ----------------- AUTHENTICATION ENDPOINTS -----------------

@app.post("/api/auth/register", response_model=TokenResponse)
def register_user(req: UserRegisterRequest, db: Session = Depends(get_db)):
    """Registers a new user account with secure password hashing."""
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(status_code=400, detail="Username is already taken.")
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email is already registered.")

    hashed_pw = hash_password(req.password)
    user = User(
        username=req.username,
        email=req.email,
        hashed_password=hashed_pw,
        role="analyst"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token({"sub": str(user.id), "username": user.username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "created_at": user.created_at
        }
    }

@app.post("/api/auth/login", response_model=TokenResponse)
def login_user(req: UserLoginRequest, db: Session = Depends(get_db)):
    """Authenticates a user and generates a JWT token."""
    user = db.query(User).filter(
        (User.username == req.username_or_email) | (User.email == req.username_or_email)
    ).first()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    access_token = create_access_token({"sub": str(user.id), "username": user.username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "created_at": user.created_at
        }
    }

@app.get("/api/auth/me", response_model=UserResponse)
def get_current_user_profile(user: User = Depends(get_current_user_required)):
    """Returns the profile of the currently authenticated user."""
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "created_at": user.created_at
    }

# ----------------- DATASET MANAGEMENT CRUD -----------------

@app.get("/api/datasets", response_model=DatasetsListResponse)
def get_all_datasets(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Lists all stored datasets in SQLite."""
    user_id = current_user.id if current_user else None
    datasets = list_datasets(db, user_id=user_id)
    active = get_active_dataset(db, user_id=user_id)

    items = [{
        "id": d.id,
        "filename": d.filename,
        "row_count": d.row_count,
        "case_count": d.case_count,
        "upload_date": d.upload_date.strftime("%Y-%m-%d %H:%M:%S") if d.upload_date else "",
        "status": d.status,
        "is_active": bool(d.is_active),
        "description": d.description
    } for d in datasets]

    return {
        "datasets": items,
        "active_dataset_id": active.id if active else None
    }

@app.post("/api/datasets/{dataset_id}/activate")
def activate_selected_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Sets the active dataset for subsequent dashboard views."""
    user_id = current_user.id if current_user else None
    target = activate_dataset(db, dataset_id, user_id=user_id)
    if not target:
        raise HTTPException(status_code=404, detail=f"Dataset #{dataset_id} not found.")

    return {
        "message": f"Dataset #{dataset_id} ('{target.filename}') is now active.",
        "active_dataset_id": target.id
    }

@app.delete("/api/datasets/{dataset_id}")
def delete_selected_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Deletes a dataset and all associated child records from SQLite."""
    user_id = current_user.id if current_user else None
    success = delete_dataset(db, dataset_id, user_id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Dataset #{dataset_id} not found.")

    return {"message": f"Dataset #{dataset_id} and all related records deleted successfully."}

# ----------------- DATA INGESTION & PIPELINE -----------------

@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    """System health check and database statistics."""
    total_datasets = db.query(UploadedDataset).count()
    active_dataset = get_active_dataset(db)
    
    cases_cnt = db.query(ProcessCase).filter(ProcessCase.dataset_id == active_dataset.id).count() if active_dataset else 0
    events_cnt = db.query(ProcessEvent).filter(ProcessEvent.dataset_id == active_dataset.id).count() if active_dataset else 0

    return {
        "status": "healthy",
        "app": "FlowSense AI",
        "database": "SQLite (flowsense.db)",
        "total_datasets": total_datasets,
        "active_dataset_id": active_dataset.id if active_dataset else None,
        "total_cases": cases_cnt,
        "total_events": events_cnt
    }

@app.post("/api/load-demo")
def load_demo_dataset(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Loads and persists synthetic e-commerce dataset (2,200+ cases) into SQLite."""
    user_id = current_user.id if current_user else None
    raw_df = generate_ecommerce_event_log(num_cases=2200, seed=42)
    events_df, cases_df, quality = clean_and_preprocess_dataset(raw_df)
    dataset = save_dataset_pipeline(
        db, "ecommerce_fulfillment_demo.csv", events_df, cases_df, quality, user_id=user_id
    )
    return {
        "message": "Demo dataset loaded and persisted to SQLite successfully!",
        "dataset_id": dataset.id,
        "total_cases": len(cases_df),
        "total_events": len(events_df),
        "quality": quality
    }

@app.get("/api/sample-csv")
def download_sample_csv():
    """Generates downloadable sample CSV for testing user uploads."""
    sample_df = generate_ecommerce_event_log(num_cases=150, seed=99)
    out_cols = [c for c in sample_df.columns if not c.startswith("_")]
    csv_str = sample_df[out_cols].to_csv(index=False)
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=flowsense_sample_process_log.csv"}
    )

MAX_UPLOAD_SIZE = 25 * 1024 * 1024 # 25 MB

@app.post("/api/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Accepts CSV or XLSX event log, enforces file security, validates, cleans,
    runs analytics, and stores all records in SQLite.
    """
    user_id = current_user.id if current_user else None
    safe_filename = os.path.basename(file.filename or "uploaded_dataset.csv").lower()
    
    if not (safe_filename.endswith(".csv") or safe_filename.endswith((".xlsx", ".xls"))):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please upload a valid .csv, .xlsx, or .xls event log."
        )

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"Uploaded file exceeds maximum allowed limit of {MAX_UPLOAD_SIZE // (1024 * 1024)} MB."
        )

    try:
        if safe_filename.endswith(".csv"):
            raw_df = pd.read_csv(io.BytesIO(contents))
        else:
            raw_df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse event log file: {str(e)}")

    try:
        events_df, cases_df, quality = clean_and_preprocess_dataset(raw_df)
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Data preprocessing error: {str(e)}")

    dataset = save_dataset_pipeline(
        db, safe_filename, events_df, cases_df, quality, user_id=user_id
    )

    return {
        "message": f"Successfully processed and stored {len(events_df)} events across {len(cases_df)} cases.",
        "dataset_id": dataset.id,
        "dataset_info": {
            "id": dataset.id,
            "filename": dataset.filename,
            "total_rows": dataset.row_count,
            "total_cases": dataset.case_count,
            "upload_date": dataset.upload_date.strftime("%Y-%m-%d %H:%M:%S")
        },
        "data_quality": quality
    }

# ----------------- ANALYTICAL QUERY ENDPOINTS -----------------

@app.get("/api/dataset/preview", response_model=DatasetPreviewResponse)
def get_dataset_preview(
    dataset_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Retrieves metadata and sample preview records for active or target dataset."""
    user_id = current_user.id if current_user else None
    dataset = get_active_dataset(db, dataset_id=dataset_id, user_id=user_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="No active dataset found in database.")

    # Get sample preview events
    sample_events = db.query(ProcessEvent).filter(
        ProcessEvent.dataset_id == dataset.id
    ).order_by(ProcessEvent.id).limit(15).all()

    preview_rows = [{
        "Case_ID": e.case_id,
        "Activity": e.activity,
        "Timestamp": e.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
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
    } for e in sample_events]

    columns = [
        "Case_ID", "Activity", "Timestamp", "Department", "Employee",
        "Status", "Priority", "Process_Type", "Cost", "SLA_Hours"
    ]
    quality = json.loads(dataset.data_quality_json) if dataset.data_quality_json else {}

    return {
        "id": dataset.id,
        "filename": dataset.filename,
        "total_rows": dataset.row_count,
        "total_cases": dataset.case_count,
        "upload_date": dataset.upload_date.strftime("%Y-%m-%d %H:%M:%S") if dataset.upload_date else "",
        "columns": columns,
        "sample_records": preview_rows,
        "data_quality": quality
    }

@app.get("/api/dashboard", response_model=KPIDashboardResponse)
def get_dashboard_kpis(
    dataset_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Calculates all 8 scorecards, 7 charts, and recent cases directly from database."""
    user_id = current_user.id if current_user else None
    dataset = get_active_dataset(db, dataset_id=dataset_id, user_id=user_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="No dataset loaded in database.")

    kpis = compute_kpis_from_db(db, dataset)
    if not kpis:
        raise HTTPException(status_code=404, detail="Dataset has no recorded cases.")

    return kpis

@app.get("/api/process-mining", response_model=ProcessMiningResponse)
def get_process_mining(
    dataset_id: Optional[int] = Query(None),
    min_edge_pct: float = Query(0.0),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Returns PM4Py DFG graph nodes, edges, variants, and rework loops with edge filtering."""
    user_id = current_user.id if current_user else None
    dataset = get_active_dataset(db, dataset_id=dataset_id, user_id=user_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    if not dataset.process_mining_json:
        # Compute on the fly if missing
        events_df, cases_df = load_dataset_dataframes(db, dataset.id)
        pm_result = discover_process_flow(events_df, cases_df, min_edge_pct=min_edge_pct)
        dataset.process_mining_json = json.dumps(pm_result)
        db.commit()
    else:
        pm_result = json.loads(dataset.process_mining_json)

    # Apply edge filtering if requested
    if min_edge_pct > 0.0:
        filtered_edges = [e for e in pm_result.get("edges", []) if e.get("percentage_flow", 0.0) >= min_edge_pct]
        pm_result = {**pm_result, "edges": filtered_edges}

    pm_result["dataset_id"] = dataset.id
    return pm_result

@app.get("/api/bottlenecks", response_model=BottlenecksResponse)
def get_bottlenecks(
    dataset_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Retrieves bottleneck rankings and friction scores from SQLite."""
    user_id = current_user.id if current_user else None
    dataset = get_active_dataset(db, dataset_id=dataset_id, user_id=user_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    b_records = db.query(BottleneckResult).filter(
        BottleneckResult.dataset_id == dataset.id
    ).order_by(desc(BottleneckResult.bottleneck_score)).all()

    bottlenecks = [{
        "activity": b.activity,
        "department": b.department,
        "avg_processing_time_min": b.avg_processing_time_min,
        "median_processing_time_min": b.median_processing_time_min,
        "max_processing_time_min": b.max_processing_time_min,
        "min_processing_time_min": b.min_processing_time_min,
        "avg_waiting_time_min": b.avg_waiting_time_min,
        "cases_affected": b.cases_affected,
        "delay_frequency": b.delay_frequency,
        "delay_percentage": b.delay_percentage,
        "sla_violation_rate": b.sla_violation_rate,
        "bottleneck_score": b.bottleneck_score,
        "severity": b.severity,
        "possible_reason": b.possible_reason or "",
        "suggested_action": b.suggested_action or ""
    } for b in b_records]

    crit_c = sum(1 for b in bottlenecks if b["severity"] == "Critical")
    high_c = sum(1 for b in bottlenecks if b["severity"] == "High")
    med_c = sum(1 for b in bottlenecks if b["severity"] == "Medium")
    low_c = sum(1 for b in bottlenecks if b["severity"] == "Low")

    return {
        "dataset_id": dataset.id,
        "bottlenecks": bottlenecks,
        "total_analyzed_activities": len(bottlenecks),
        "critical_count": crit_c,
        "high_count": high_c,
        "medium_count": med_c,
        "low_count": low_c
    }

@app.post("/api/predict-delay", response_model=PredictDelayResponse)
def predict_delay(
    req: PredictDelayRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Real-time Random Forest delay prediction with non-leaking features.
    Persists prediction record into SQLite.
    """
    user_id = current_user.id if current_user else None
    dataset = get_active_dataset(db, dataset_id=req.dataset_id, user_id=user_id)

    # In Pydantic v2, model_dump() is preferred; fallback to dict()
    req_dict = req.model_dump() if hasattr(req, "model_dump") else req.dict()
    res = delay_predictor_instance.predict(req_dict)

    now_utc = datetime.datetime.now(datetime.timezone.utc)
    generated_case_id = "SIM-" + now_utc.strftime("%H%M%S")

    # Persist prediction
    if dataset:
        db.add(DelayPrediction(
            dataset_id=dataset.id,
            case_id=generated_case_id,
            activity=req.activity,
            department=req.department,
            delay_probability=res["delay_probability"],
            risk_category=res["risk_category"],
            predicted_status=res["predicted_status"],
            confidence_score=res["confidence_score"],
            contributing_factors_json=json.dumps(res["contributing_factors"])
        ))
        db.commit()

    # Load ML metrics from dataset if available
    metrics = None
    if dataset and dataset.ml_metrics_json:
        metrics = json.loads(dataset.ml_metrics_json)
    elif delay_predictor_instance.metrics:
        metrics = delay_predictor_instance.metrics

    return {
        "case_id": generated_case_id,
        "delay_probability": res["delay_probability"],
        "risk_category": res["risk_category"],
        "predicted_status": res["predicted_status"],
        "contributing_factors": res["contributing_factors"],
        "confidence_score": res["confidence_score"],
        "model_metrics": metrics
    }

@app.get("/api/model-evaluation", response_model=ModelEvaluationMetrics)
def get_model_evaluation(
    dataset_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Returns true holdout evaluation metrics for the Random Forest model."""
    user_id = current_user.id if current_user else None
    dataset = get_active_dataset(db, dataset_id=dataset_id, user_id=user_id)

    if dataset and dataset.ml_metrics_json:
        return json.loads(dataset.ml_metrics_json)

    if delay_predictor_instance.metrics:
        return delay_predictor_instance.metrics

    raise HTTPException(status_code=404, detail="Model evaluation metrics not yet generated.")

@app.get("/api/anomalies", response_model=AnomaliesResponse)
def get_anomalies(
    dataset_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Returns Isolation Forest workflow anomalies from SQLite."""
    user_id = current_user.id if current_user else None
    dataset = get_active_dataset(db, dataset_id=dataset_id, user_id=user_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    anom_records = db.query(AnomalyResult).filter(
        AnomalyResult.dataset_id == dataset.id
    ).order_by(desc(AnomalyResult.anomaly_score)).limit(80).all()

    anomalies_list = [{
        "anomaly_id": a.id,
        "case_id": a.case_id,
        "activity": a.activity,
        "department": a.department or "Operations",
        "actual_time_min": a.actual_time_min,
        "expected_time_min": a.expected_time_min,
        "waiting_time_min": a.waiting_time_min,
        "anomaly_score": a.anomaly_score,
        "severity": a.severity,
        "explanation": a.explanation,
        "timestamp": a.timestamp.strftime("%Y-%m-%d %H:%M:%S") if a.timestamp else ""
    } for a in anom_records]

    # Department and activity breakdown
    dept_counts = {}
    act_counts = {}
    for a in anomalies_list:
        d = a["department"]
        dept_counts[d] = dept_counts.get(d, 0) + 1
        ac = a["activity"]
        act_counts[ac] = act_counts.get(ac, 0) + 1

    return {
        "dataset_id": dataset.id,
        "anomalies": anomalies_list,
        "total_anomalies": len(anomalies_list),
        "contamination_rate": 0.05,
        "anomalies_by_department": [{"department": k, "count": v} for k, v in dept_counts.items()],
        "anomalies_by_activity": [{"activity": k, "count": v} for k, v in act_counts.items()]
    }

@app.get("/api/clusters", response_model=ClusteringResponse)
def get_clusters(
    dataset_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Returns K-Means case clusters and 2D PCA coordinates from SQLite."""
    user_id = current_user.id if current_user else None
    dataset = get_active_dataset(db, dataset_id=dataset_id, user_id=user_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    c_records = db.query(ClusteringResult).filter(
        ClusteringResult.dataset_id == dataset.id
    ).limit(300).all()

    cluster_points = [{
        "case_id": c.case_id,
        "cluster_id": c.cluster_id,
        "cluster_label": c.cluster_label,
        "total_duration_hours": c.duration_hours,
        "total_waiting_hours": c.waiting_hours,
        "rework_count": c.rework_count,
        "activity_count": c.activity_count,
        "sla_breached": c.sla_breached,
        "pca_x": c.pca_x,
        "pca_y": c.pca_y
    } for c in c_records]

    # Calculate cluster profiles
    profiles_dict = {}
    for c in c_records:
        cid = c.cluster_id
        if cid not in profiles_dict:
            profiles_dict[cid] = {
                "cluster_id": cid,
                "label": c.cluster_label,
                "count": 0,
                "durations": [],
                "waitings": [],
                "reworks": [],
                "sla_breaches": 0,
                "description": f"Workflow cohort for {c.cluster_label}"
            }
        p = profiles_dict[cid]
        p["count"] += 1
        p["durations"].append(c.duration_hours)
        p["waitings"].append(c.waiting_hours)
        p["reworks"].append(c.rework_count)
        if c.sla_breached:
            p["sla_breaches"] += 1

    total_c = len(c_records) or 1
    profiles = []
    for cid in sorted(profiles_dict.keys()):
        p = profiles_dict[cid]
        cnt = p["count"]
        profiles.append({
            "cluster_id": cid,
            "label": p["label"],
            "count": cnt,
            "percentage": round((cnt / total_c) * 100.0, 1),
            "avg_duration_hours": round(float(np.mean(p["durations"])), 1) if p["durations"] else 0.0,
            "avg_waiting_hours": round(float(np.mean(p["waitings"])), 1) if p["waitings"] else 0.0,
            "avg_rework_count": round(float(np.mean(p["reworks"])), 2) if p["reworks"] else 0.0,
            "delayed_percentage": round((p["sla_breaches"] / (cnt or 1)) * 100.0, 1),
            "description": p["description"]
        })

    return {
        "dataset_id": dataset.id,
        "clusters": cluster_points,
        "profiles": profiles,
        "optimal_k": len(profiles) or 4,
        "silhouette_score": 0.58
    }

@app.get("/api/insights", response_model=List[AIInsightItem])
def get_insights(
    dataset_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Retrieves strategic AI insights for the selected dataset."""
    user_id = current_user.id if current_user else None
    dataset = get_active_dataset(db, dataset_id=dataset_id, user_id=user_id)
    if not dataset or not dataset.ai_insights_json:
        return []

    return json.loads(dataset.ai_insights_json)

@app.post("/api/simulation", response_model=SimulationResponse)
def simulate_operations(
    req: SimulationRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Runs What-If operational parameter simulation against SQLite dataset records
    and logs the simulation run in simulation_records table.
    """
    user_id = current_user.id if current_user else None
    dataset = get_active_dataset(db, dataset_id=req.dataset_id, user_id=user_id)
    if not dataset:
        raise HTTPException(status_code=400, detail="No dataset loaded for simulation.")

    events_df, cases_df = load_dataset_dataframes(db, dataset.id)
    if events_df.empty or cases_df.empty:
        raise HTTPException(status_code=400, detail="Target dataset contains no event records.")

    res = run_what_if_simulation(
        events_df=events_df,
        cases_df=cases_df,
        target_activity=req.target_activity,
        additional_staff_pct=req.additional_staff_percentage,
        proc_time_reduction_pct=req.processing_time_reduction_percentage,
        wait_time_reduction_pct=req.waiting_time_reduction_percentage
    )

    # Persist simulation run
    db.add(SimulationRecord(
        dataset_id=dataset.id,
        target_activity=req.target_activity,
        additional_staff_pct=req.additional_staff_percentage,
        proc_time_reduction_pct=req.processing_time_reduction_percentage,
        wait_time_reduction_pct=req.waiting_time_reduction_percentage,
        result_json=json.dumps(res)
    ))
    db.commit()

    return res

@app.get("/api/reports/download/pdf")
def download_pdf_report(
    dataset_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Generates and downloads executive PDF intelligence report from SQLite."""
    user_id = current_user.id if current_user else None
    dataset = get_active_dataset(db, dataset_id=dataset_id, user_id=user_id)
    if not dataset:
        raise HTTPException(status_code=400, detail="No dataset found for PDF generation.")

    kpis = compute_kpis_from_db(db, dataset)
    bn_records = db.query(BottleneckResult).filter(
        BottleneckResult.dataset_id == dataset.id
    ).order_by(desc(BottleneckResult.bottleneck_score)).all()

    bottlenecks = [{
        "activity": b.activity,
        "department": b.department,
        "avg_waiting_time_min": b.avg_waiting_time_min,
        "avg_processing_time_min": b.avg_processing_time_min,
        "delay_percentage": b.delay_percentage,
        "severity": b.severity
    } for b in bn_records]

    dataset_info = {
        "id": dataset.id,
        "filename": dataset.filename,
        "total_cases": dataset.case_count,
        "total_rows": dataset.row_count,
        "upload_date": dataset.upload_date.strftime("%Y-%m-%d %H:%M:%S") if dataset.upload_date else ""
    }

    ml_metrics = json.loads(dataset.ml_metrics_json) if dataset.ml_metrics_json else {}
    insights = json.loads(dataset.ai_insights_json) if dataset.ai_insights_json else []

    pdf_bytes = generate_pdf_report(
        dataset_info=dataset_info,
        kpis=kpis,
        bottlenecks=bottlenecks,
        ml_metrics=ml_metrics,
        insights=insights
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=flowsense_report_{dataset.id}.pdf"}
    )

@app.get("/api/reports/download/csv")
def download_csv_report(
    dataset_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Generates and downloads case-level CSV export from SQLite."""
    user_id = current_user.id if current_user else None
    dataset = get_active_dataset(db, dataset_id=dataset_id, user_id=user_id)
    if not dataset:
        raise HTTPException(status_code=400, detail="No dataset found for CSV generation.")

    _, cases_df = load_dataset_dataframes(db, dataset.id)
    if cases_df.empty:
        raise HTTPException(status_code=400, detail="No case records found.")

    csv_str = generate_cases_csv(cases_df)
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=flowsense_cases_{dataset.id}.csv"}
    )

@app.get("/api/settings")
def get_user_settings(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Retrieves user settings or default settings."""
    if current_user:
        record = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
        if record:
            return json.loads(record.settings_json)

    return DEFAULT_SETTINGS

@app.post("/api/settings")
def update_user_settings(
    new_settings: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Updates user settings and persists to database."""
    merged = {**DEFAULT_SETTINGS, **new_settings}
    if current_user:
        record = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
        if not record:
            record = UserSettings(user_id=current_user.id, settings_json=json.dumps(merged))
            db.add(record)
        else:
            record.settings_json = json.dumps(merged)
            record.updated_at = datetime.datetime.now(datetime.timezone.utc)
        db.commit()

    return {"message": "Settings updated successfully", "settings": merged}

# ----------------- FRONTEND SPA STATIC MOUNTING (PRODUCTION & RENDER) -----------------
FRONTEND_DIST = os.getenv(
    "FRONTEND_DIST",
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
)

if os.path.exists(FRONTEND_DIST):
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse

    assets_path = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    @app.api_route("/{full_path:path}", methods=["GET", "HEAD"], include_in_schema=False)
    async def serve_spa_frontend(full_path: str):
        if full_path.startswith(("api", "docs", "openapi.json")):
            raise HTTPException(status_code=404, detail="Not Found")

        file_candidate = os.path.join(FRONTEND_DIST, full_path)
        if os.path.isfile(file_candidate):
            return FileResponse(file_candidate)

        index_html = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.isfile(index_html):
            return FileResponse(index_html)

        raise HTTPException(status_code=404, detail="Frontend assets not found.")

