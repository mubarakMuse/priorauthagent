from unittest.mock import patch

import pytest

from priorauth.jobs.service import create_pipeline_job, get_job_status, process_job_payload
from priorauth.models.jobs import JobPayload, JobStatus
from priorauth.models.clinical import ClinicalExtraction
from priorauth.models.pipeline import PipelineResponse


def test_create_and_get_job(spine_injection_note):
    submit = create_pipeline_job(spine_injection_note)
    assert submit.status == JobStatus.QUEUED

    status = get_job_status(submit.job_id)
    assert status is not None
    assert status.status == JobStatus.QUEUED


def test_process_job_payload_success(spine_injection_note, sample_extraction_dict):
    extraction = ClinicalExtraction.model_validate(sample_extraction_dict)
    mock_result = PipelineResponse(extraction=extraction, matched_rules=[])

    submit = create_pipeline_job(spine_injection_note)
    payload = JobPayload(job_id=submit.job_id, clinical_note=spine_injection_note)

    with patch("priorauth.jobs.service.run_pipeline", return_value=mock_result):
        result = process_job_payload(payload)

    assert result.extraction.patient_summary

    status = get_job_status(submit.job_id)
    assert status is not None
    assert status.status == JobStatus.COMPLETED
    assert status.result is not None


def test_process_job_payload_failure(spine_injection_note):
    submit = create_pipeline_job(spine_injection_note)
    payload = JobPayload(job_id=submit.job_id, clinical_note=spine_injection_note)

    with patch("priorauth.jobs.service.run_pipeline", side_effect=RuntimeError("LLM failed")):
        with pytest.raises(RuntimeError):
            process_job_payload(payload)

    status = get_job_status(submit.job_id)
    assert status is not None
    assert status.status == JobStatus.FAILED
    assert "LLM failed" in (status.error or "")
