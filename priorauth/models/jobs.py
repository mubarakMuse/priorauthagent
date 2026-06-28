from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field

from priorauth.models.pipeline import PipelineResponse


class JobStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class JobPayload(BaseModel):
    job_id: str
    clinical_note: str
    rules: dict | list | None = None


class JobRecord(BaseModel):
    job_id: str
    status: JobStatus
    created_at: datetime
    updated_at: datetime
    error: str | None = None
    result: PipelineResponse | None = None


class JobSubmitResponse(BaseModel):
    job_id: str
    status: JobStatus


class JobStatusResponse(BaseModel):
    job_id: str
    status: JobStatus
    error: str | None = None
    result: PipelineResponse | None = None
    created_at: datetime
    updated_at: datetime


class QueueMessage(BaseModel):
    receipt_handle: str | None = None
    payload: JobPayload
