from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from priorauth.main import create_app
from priorauth.models.clinical import ClinicalExtraction, Diagnosis, Procedure
from priorauth.models.pipeline import PipelineResponse


@pytest.fixture
def client():
    with TestClient(create_app()) as test_client:
        yield test_client


@pytest.fixture
def mock_pipeline_response(sample_extraction_dict):
    extraction = ClinicalExtraction.model_validate(sample_extraction_dict)
    return PipelineResponse(extraction=extraction, matched_rules=[], generation_attempts=1)


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_get_policy(client):
    response = client.get("/api/policy")
    assert response.status_code == 200
    assert response.json()["payer"] == "Meridian Health Plan"


def test_submit_job_returns_job_id(client, spine_injection_note, mock_pipeline_response):
    with patch("priorauth.jobs.service.run_pipeline", return_value=mock_pipeline_response):
        response = client.post(
            "/api/jobs",
            json={"clinical_note": spine_injection_note},
        )

    assert response.status_code == 200
    data = response.json()
    assert "job_id" in data
    assert data["status"] == "queued"


def test_job_completes_via_memory_worker(client, spine_injection_note, mock_pipeline_response):
    with patch("priorauth.jobs.service.run_pipeline", return_value=mock_pipeline_response):
        submit = client.post("/api/jobs", json={"clinical_note": spine_injection_note})
        job_id = submit.json()["job_id"]

        import time

        for _ in range(30):
            status = client.get(f"/api/jobs/{job_id}")
            assert status.status_code == 200
            body = status.json()
            if body["status"] in ("completed", "failed"):
                break
            time.sleep(0.2)

    assert body["status"] == "completed"
    assert body["result"] is not None


def test_get_job_not_found(client):
    response = client.get("/api/jobs/nonexistent-id")
    assert response.status_code == 404


def test_submit_job_empty_note(client):
    response = client.post("/api/jobs", json={"clinical_note": "  "})
    assert response.status_code == 400


def test_export_pdf(client, mock_pipeline_response):
    response = client.post("/api/export-pdf", json=mock_pipeline_response.model_dump(mode="json"))
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")


def test_sync_process_disabled_by_default(client, spine_injection_note):
    response = client.post("/api/process", json={"clinical_note": spine_injection_note})
    assert response.status_code == 410
