import pytest

def test_pdf_and_csv_export_endpoints(client):
    # Load demo dataset first
    load_res = client.post("/api/load-demo")
    assert load_res.status_code == 200
    dataset_id = load_res.json()["dataset_id"]

    # Test PDF download
    pdf_res = client.get(f"/api/reports/download/pdf?dataset_id={dataset_id}")
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert len(pdf_res.content) > 1000
    assert pdf_res.content[:4] == b"%PDF"

    # Test CSV download
    csv_res = client.get(f"/api/reports/download/csv?dataset_id={dataset_id}")
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    assert len(csv_res.content) > 500
    assert b"Case_ID" in csv_res.content

