from __future__ import annotations

import logging
import uuid

from priorauth.jobs.queue import get_job_queue
from priorauth.jobs.store import get_job_store
from priorauth.models.jobs import (
    JobPayload,
    JobRecord,
    JobStatus,
    JobStatusResponse,
    JobSubmitResponse,
)
from priorauth.models.pipeline import PipelineResponse
from priorauth.pipeline import run_pipeline

logger = logging.getLogger(__name__)


def create_pipeline_job(
    clinical_note: str,
    rules_data: dict | list | None = None,
) -> JobSubmitResponse:
    job_id = str(uuid.uuid4())
    store = get_job_store()
    queue = get_job_queue()

    store.create(job_id)
    queue.enqueue(
        JobPayload(
            job_id=job_id,
            clinical_note=clinical_note,
            rules=rules_data,
        )
    )

    return JobSubmitResponse(job_id=job_id, status=JobStatus.QUEUED)


def get_job_status(job_id: str) -> JobStatusResponse | None:
    record = get_job_store().get(job_id)
    if record is None:
        return None
    return _to_status_response(record)


def process_job_payload(payload: JobPayload) -> PipelineResponse:
    store = get_job_store()
    store.update_status(payload.job_id, JobStatus.RUNNING)

    try:
        result = run_pipeline(payload.clinical_note, rules_data=payload.rules)
        store.update_status(payload.job_id, JobStatus.COMPLETED, result=result)
        return result
    except Exception as exc:
        logger.exception("Job %s failed", payload.job_id)
        store.update_status(payload.job_id, JobStatus.FAILED, error=str(exc))
        raise


def _to_status_response(record: JobRecord) -> JobStatusResponse:
    return JobStatusResponse(
        job_id=record.job_id,
        status=record.status,
        error=record.error,
        result=record.result,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )
