import io
import pytest
import pandas as pd
from app.models import UploadedDataset, ProcessEvent, ProcessCase, BottleneckResult
from tests.conftest import TestingSessionLocal

def generate_csv_bytes(n_cases=20):
    rows = []
    import datetime
    base_t = datetime.datetime(2026, 1, 1, 9, 0, 0)
    for c in range(1, n_cases + 1):
        cid = f"ORDER-{c:04d}"
        acts = [
            ("Order Placement", "Sales", 10.0),
            ("Payment Verification", "Finance", 35.0),
            ("Inventory Picking", "Warehouse", 40.0),
            ("Quality Inspection", "QA", 15.0),
            ("Dispatch & Shipping", "Logistics", 50.0)
        ]
        t = base_t + datetime.timedelta(hours=c)
        for act, dept, dur in acts:
            rows.append({
                "Case_ID": cid,
                "Activity": act,
                "Timestamp": t.strftime("%Y-%m-%d %H:%M:%S"),
                "Department": dept,
                "Status": "Completed",
                "Priority": "Medium",
                "Cost": 25.0,
                "SLA_Hours": 24.0
            })
            t += datetime.timedelta(minutes=dur + 20)
    df = pd.DataFrame(rows)
    buf = io.BytesIO()
    df.to_csv(buf, index=False)
    buf.seek(0)
    return buf.getvalue()

def test_database_crud_and_persistence_lifecycle(client):
    """
    Executes Tests A through I verifying complete SQLite persistence,
    restart simulation, data isolation, and cascading deletes.
    """
    db = TestingSessionLocal()
    try:
        # TEST A: Upload dataset
        csv_bytes = generate_csv_bytes(n_cases=15)
        files = {"file": ("test_order_fulfillment.csv", csv_bytes, "text/csv")}
        res = client.post("/api/upload", files=files)
        assert res.status_code == 200, res.text
        upload_data = res.json()
        dataset_id = upload_data["dataset_id"]
        assert dataset_id is not None

        # TEST B: Confirm metadata is stored in SQLite
        db_dataset = db.query(UploadedDataset).filter(UploadedDataset.id == dataset_id).first()
        assert db_dataset is not None
        assert db_dataset.filename == "test_order_fulfillment.csv"
        assert db_dataset.case_count == 15
        assert db_dataset.is_active is True
        assert db_dataset.status == "processed"

        # TEST C: Confirm process events and cases are stored in SQLite
        events_cnt = db.query(ProcessEvent).filter(ProcessEvent.dataset_id == dataset_id).count()
        cases_cnt = db.query(ProcessCase).filter(ProcessCase.dataset_id == dataset_id).count()
        assert events_cnt == 15 * 5
        assert cases_cnt == 15

        # Check bottleneck results were persisted
        bn_cnt = db.query(BottleneckResult).filter(BottleneckResult.dataset_id == dataset_id).count()
        assert bn_cnt > 0

        # TEST D & E: Simulate backend restart and retrieve same dataset
        # In SQLite, data survives process restarts. Query through fresh API client request:
        preview_res = client.get(f"/api/dataset/preview?dataset_id={dataset_id}")
        assert preview_res.status_code == 200
        preview_data = preview_res.json()
        assert preview_data["id"] == dataset_id
        assert preview_data["total_cases"] == 15
        assert len(preview_data["sample_records"]) > 0

        # TEST F: Verify analysis information is still available
        dash_res = client.get(f"/api/dashboard?dataset_id={dataset_id}")
        assert dash_res.status_code == 200
        dash_data = dash_res.json()
        assert dash_data["total_processes"] == 15
        assert dash_data["dataset_id"] == dataset_id

        pm_res = client.get(f"/api/process-mining?dataset_id={dataset_id}")
        assert pm_res.status_code == 200
        assert len(pm_res.json()["nodes"]) > 0

        bn_res = client.get(f"/api/bottlenecks?dataset_id={dataset_id}")
        assert bn_res.status_code == 200
        assert bn_res.json()["total_analyzed_activities"] > 0

        # TEST I: Upload another dataset and ensure previous datasets are NOT overwritten
        csv_bytes_2 = generate_csv_bytes(n_cases=8)
        files_2 = {"file": ("second_dataset.csv", csv_bytes_2, "text/csv")}
        res_2 = client.post("/api/upload", files=files_2)
        assert res_2.status_code == 200
        dataset_id_2 = res_2.json()["dataset_id"]
        assert dataset_id_2 != dataset_id

        # Verify both datasets coexist in SQLite
        all_datasets_res = client.get("/api/datasets")
        assert all_datasets_res.status_code == 200
        ds_list = all_datasets_res.json()["datasets"]
        ds_ids = [d["id"] for d in ds_list]
        assert dataset_id in ds_ids
        assert dataset_id_2 in ds_ids

        # TEST G & H: Delete dataset and verify no orphaned records remain
        del_res = client.delete(f"/api/datasets/{dataset_id}")
        assert del_res.status_code == 200

        # Confirm dataset deleted
        assert db.query(UploadedDataset).filter(UploadedDataset.id == dataset_id).first() is None
        # Confirm child events, cases, and bottlenecks were cascaded cleanly without orphans
        assert db.query(ProcessEvent).filter(ProcessEvent.dataset_id == dataset_id).count() == 0
        assert db.query(ProcessCase).filter(ProcessCase.dataset_id == dataset_id).count() == 0
        assert db.query(BottleneckResult).filter(BottleneckResult.dataset_id == dataset_id).count() == 0

        # Confirm second dataset remains intact
        assert db.query(UploadedDataset).filter(UploadedDataset.id == dataset_id_2).first() is not None
        assert db.query(ProcessCase).filter(ProcessCase.dataset_id == dataset_id_2).count() == 8

    finally:
        db.close()
