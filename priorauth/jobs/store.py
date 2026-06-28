from __future__ import annotations

import json
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from threading import Lock

from priorauth.models.jobs import JobRecord, JobStatus
from priorauth.models.pipeline import PipelineResponse


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class JobStore(ABC):
    @abstractmethod
    def create(self, job_id: str) -> JobRecord:
        ...

    @abstractmethod
    def get(self, job_id: str) -> JobRecord | None:
        ...

    @abstractmethod
    def update_status(
        self,
        job_id: str,
        status: JobStatus,
        *,
        error: str | None = None,
        result: PipelineResponse | None = None,
    ) -> JobRecord:
        ...


class MemoryJobStore(JobStore):
    def __init__(self) -> None:
        self._jobs: dict[str, JobRecord] = {}
        self._lock = Lock()

    def create(self, job_id: str) -> JobRecord:
        now = _utc_now()
        record = JobRecord(
            job_id=job_id,
            status=JobStatus.QUEUED,
            created_at=now,
            updated_at=now,
        )
        with self._lock:
            self._jobs[job_id] = record
        return record

    def get(self, job_id: str) -> JobRecord | None:
        with self._lock:
            return self._jobs.get(job_id)

    def update_status(
        self,
        job_id: str,
        status: JobStatus,
        *,
        error: str | None = None,
        result: PipelineResponse | None = None,
    ) -> JobRecord:
        with self._lock:
            record = self._jobs.get(job_id)
            if record is None:
                raise KeyError(f"Job not found: {job_id}")

            updated = record.model_copy(
                update={
                    "status": status,
                    "updated_at": _utc_now(),
                    "error": error,
                    "result": result if result is not None else record.result,
                }
            )
            self._jobs[job_id] = updated
            return updated


class DynamoDBJobStore(JobStore):
    def __init__(self, table_name: str, region: str) -> None:
        import boto3

        self._table = boto3.resource("dynamodb", region_name=region).Table(table_name)

    def create(self, job_id: str) -> JobRecord:
        now = _utc_now()
        self._table.put_item(
            Item={
                "job_id": job_id,
                "status": JobStatus.QUEUED.value,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat(),
            }
        )
        return JobRecord(
            job_id=job_id,
            status=JobStatus.QUEUED,
            created_at=now,
            updated_at=now,
        )

    def get(self, job_id: str) -> JobRecord | None:
        response = self._table.get_item(Key={"job_id": job_id})
        item = response.get("Item")
        if not item:
            return None
        return _item_to_record(item)

    def update_status(
        self,
        job_id: str,
        status: JobStatus,
        *,
        error: str | None = None,
        result: PipelineResponse | None = None,
    ) -> JobRecord:
        now = _utc_now()
        update_expr = "SET #status = :status, updated_at = :updated_at"
        expr_names = {"#status": "status"}
        expr_values: dict = {
            ":status": status.value,
            ":updated_at": now.isoformat(),
        }

        if error is not None:
            update_expr += ", #error = :error"
            expr_names["#error"] = "error"
            expr_values[":error"] = error

        if result is not None:
            update_expr += ", #result = :result"
            expr_names["#result"] = "result"
            expr_values[":result"] = json.dumps(result.model_dump(mode="json"))

        self._table.update_item(
            Key={"job_id": job_id},
            UpdateExpression=update_expr,
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_values,
        )
        record = self.get(job_id)
        if record is None:
            raise KeyError(f"Job not found after update: {job_id}")
        return record


def _item_to_record(item: dict) -> JobRecord:
    result = None
    if item.get("result"):
        raw = item["result"]
        if isinstance(raw, str):
            raw = json.loads(raw)
        result = PipelineResponse.model_validate(raw)

    return JobRecord(
        job_id=item["job_id"],
        status=JobStatus(item["status"]),
        created_at=datetime.fromisoformat(item["created_at"]),
        updated_at=datetime.fromisoformat(item["updated_at"]),
        error=item.get("error"),
        result=result,
    )


_store: JobStore | None = None


def get_job_store() -> JobStore:
    global _store
    if _store is not None:
        return _store

    from priorauth.config import get_settings

    settings = get_settings()
    if settings.job_store_backend == "dynamodb":
        if not settings.job_table_name:
            raise RuntimeError("JOB_TABLE_NAME required for dynamodb job store")
        _store = DynamoDBJobStore(settings.job_table_name, settings.aws_region)
    else:
        _store = MemoryJobStore()
    return _store


def reset_job_store() -> None:
    global _store
    _store = None
