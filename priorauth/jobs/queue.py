from __future__ import annotations

import json
from abc import ABC, abstractmethod
from queue import Empty, Queue
from threading import Lock

from priorauth.models.jobs import JobPayload, QueueMessage


class JobQueue(ABC):
    @abstractmethod
    def enqueue(self, payload: JobPayload) -> None:
        ...

    @abstractmethod
    def receive(self, *, max_messages: int = 1, wait_seconds: int = 0) -> list[QueueMessage]:
        ...

    @abstractmethod
    def delete(self, message: QueueMessage) -> None:
        ...


class MemoryJobQueue(JobQueue):
    def __init__(self) -> None:
        self._queue: Queue[JobPayload] = Queue()
        self._lock = Lock()

    def enqueue(self, payload: JobPayload) -> None:
        self._queue.put(payload)

    def receive(self, *, max_messages: int = 1, wait_seconds: int = 0) -> list[QueueMessage]:
        messages: list[QueueMessage] = []
        timeout = wait_seconds if wait_seconds > 0 else 0.1
        for _ in range(max_messages):
            try:
                payload = self._queue.get(timeout=timeout)
                messages.append(QueueMessage(receipt_handle=payload.job_id, payload=payload))
            except Empty:
                break
        return messages

    def delete(self, message: QueueMessage) -> None:
        return


class SqsJobQueue(JobQueue):
    def __init__(self, queue_url: str, region: str) -> None:
        import boto3

        self._queue_url = queue_url
        self._client = boto3.client("sqs", region_name=region)

    def enqueue(self, payload: JobPayload) -> None:
        self._client.send_message(
            QueueUrl=self._queue_url,
            MessageBody=payload.model_dump_json(),
        )

    def receive(self, *, max_messages: int = 1, wait_seconds: int = 0) -> list[QueueMessage]:
        response = self._client.receive_message(
            QueueUrl=self._queue_url,
            MaxNumberOfMessages=min(max_messages, 10),
            WaitTimeSeconds=min(wait_seconds, 20),
            MessageAttributeNames=["All"],
        )

        messages: list[QueueMessage] = []
        for raw in response.get("Messages", []):
            body = json.loads(raw["Body"])
            messages.append(
                QueueMessage(
                    receipt_handle=raw["ReceiptHandle"],
                    payload=JobPayload.model_validate(body),
                )
            )
        return messages

    def delete(self, message: QueueMessage) -> None:
        if not message.receipt_handle:
            return
        self._client.delete_message(
            QueueUrl=self._queue_url,
            ReceiptHandle=message.receipt_handle,
        )


_queue: JobQueue | None = None


def get_job_queue() -> JobQueue:
    global _queue
    if _queue is not None:
        return _queue

    from priorauth.config import get_settings

    settings = get_settings()
    if settings.job_queue_backend == "sqs":
        if not settings.job_queue_url:
            raise RuntimeError("JOB_QUEUE_URL required for sqs job queue")
        _queue = SqsJobQueue(settings.job_queue_url, settings.aws_region)
    else:
        _queue = MemoryJobQueue()
    return _queue


def reset_job_queue() -> None:
    global _queue
    _queue = None
