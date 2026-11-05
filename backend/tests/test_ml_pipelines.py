import os
import pytest
import pandas as pd
import numpy as np

from app.preprocessor import clean_and_preprocess_dataset
from app.process_mining import discover_process_flow
from app.bottleneck_engine import analyze_bottlenecks
from app.ml_delay_predictor import DelayPredictorML
from app.ml_anomaly_detector import detect_workflow_anomalies
from app.ml_clustering import cluster_process_cases
from app.simulation_engine import run_what_if_simulation
from app.data_generator import generate_ecommerce_event_log

@pytest.fixture(scope="module")
def sample_dataset():
    raw_df = generate_ecommerce_event_log(num_cases=100, seed=42)
    events_df, cases_df, quality = clean_and_preprocess_dataset(raw_df)
    return events_df, cases_df, quality

def test_preprocessor(sample_dataset):
    events_df, cases_df, quality = sample_dataset
    assert not events_df.empty
    assert not cases_df.empty
    assert quality["health_score"] >= 80.0
    assert "Case_ID" in events_df.columns
    assert "Activity" in events_df.columns
    assert "duration_minutes" in events_df.columns
    assert "waiting_time_minutes" in events_df.columns

def test_process_mining_and_edge_filtering(sample_dataset):
    events_df, cases_df, _ = sample_dataset
    res_unfiltered = discover_process_flow(events_df, cases_df, min_edge_pct=0.0)
    assert len(res_unfiltered["nodes"]) > 0
    assert len(res_unfiltered["edges"]) > 0
    assert len(res_unfiltered["variants"]) > 0

    # Test edge filtering to prevent spaghetti diagrams
    res_filtered = discover_process_flow(events_df, cases_df, min_edge_pct=5.0)
    assert len(res_filtered["edges"]) <= len(res_unfiltered["edges"])

def test_bottleneck_detection(sample_dataset):
    events_df, cases_df, _ = sample_dataset
    bottlenecks = analyze_bottlenecks(events_df, cases_df)
    assert len(bottlenecks) > 0
    for b in bottlenecks:
        assert 0.0 <= b["bottleneck_score"] <= 100.0
        assert b["severity"] in ["Critical", "High", "Medium", "Low"]
        assert len(b["possible_reason"]) > 0
        assert len(b["suggested_action"]) > 0

def test_ml_delay_predictor_and_joblib_persistence(sample_dataset, tmp_path):
    events_df, cases_df, _ = sample_dataset
    predictor = DelayPredictorML()
    save_file = str(tmp_path / "test_model.joblib")

    # Train model
    metrics = predictor.train(events_df, cases_df, save_path=save_file)
    assert metrics["accuracy"] >= 0.70
    assert metrics["f1_score"] >= 0.60
    assert len(metrics["feature_importance"]) == 10
    assert os.path.exists(save_file)

    # Inference test
    pred_req = {
        "activity": "Payment Verification",
        "department": "Finance",
        "priority": "High",
        "time_spent_current_hours": 3.5,
        "previous_activity_duration_hours": 1.2,
        "rework_count": 1,
        "sla_hours": 14.0,
        "completed_stages_count": 2,
        "cumulative_waiting_hours": 2.5
    }
    pred_res = predictor.predict(pred_req)
    assert 0.0 <= pred_res["delay_probability"] <= 1.0
    assert pred_res["risk_category"] in ["Low", "Medium", "High"]
    assert len(pred_res["contributing_factors"]) > 0

    # Restoration test
    restored_predictor = DelayPredictorML()
    success = restored_predictor.load(save_file)
    assert success is True
    assert restored_predictor.is_trained is True
    restored_res = restored_predictor.predict(pred_req)
    assert restored_res["delay_probability"] == pred_res["delay_probability"]

def test_anomaly_detection(sample_dataset):
    events_df, _, _ = sample_dataset
    anomalies = detect_workflow_anomalies(events_df, contamination=0.05)
    assert "anomalies" in anomalies
    assert anomalies["total_anomalies"] > 0
    for a in anomalies["anomalies"][:5]:
        assert 0.0 <= a["anomaly_score"] <= 1.0
        assert a["severity"] in ["Severe", "High", "Moderate"]
        assert len(a["explanation"]) > 0

def test_clustering_and_optimal_k(sample_dataset):
    _, cases_df, _ = sample_dataset
    clusters = cluster_process_cases(cases_df, n_clusters=4)
    assert len(clusters["clusters"]) > 0
    assert len(clusters["profiles"]) == 4
    assert clusters["optimal_k"] >= 2
    assert -1.0 <= clusters["silhouette_score"] <= 1.0

def test_what_if_simulation(sample_dataset):
    events_df, cases_df, _ = sample_dataset
    target_act = str(events_df["Activity"].iloc[0])
    sim = run_what_if_simulation(
        events_df=events_df,
        cases_df=cases_df,
        target_activity=target_act,
        additional_staff_pct=25.0,
        proc_time_reduction_pct=30.0,
        wait_time_reduction_pct=35.0
    )
    assert sim["is_hypothetical_estimate"] is True
    assert sim["simulated_avg_duration_hours"] <= sim["original_avg_duration_hours"]
    assert sim["estimated_cost_saved_usd"] >= 0.0

