"""In-process worker for local development (memory queue)."""

from __future__ import annotations

import logging
import threading
from typing import TYPE_CHECKING

from priorauth.jobs.queue import get_job_queue
from priorauth.jobs.service import process_job_payload

if TYPE_CHECKING:
    pass

logger = logging.getLogger(__name__)

_thread: threading.Thread | None = None
_stop_event = threading.Event()


def _worker_loop() -> None:
    queue = get_job_queue()
    while not _stop_event.is_set():
        messages = queue.receive(max_messages=1, wait_seconds=1)
        for message in messages:
            if _stop_event.is_set():
                break
            try:
                process_job_payload(message.payload)
            except Exception:
                logger.exception("Memory worker: job %s failed", message.payload.job_id)
            finally:
                queue.delete(message)


def start_memory_worker() -> None:
    global _thread
    from priorauth.config import get_settings

    if get_settings().job_queue_backend != "memory":
        return

    if _thread is not None and _thread.is_alive():
        return

    _stop_event.clear()
    _thread = threading.Thread(target=_worker_loop, name="pipeline-worker", daemon=True)
    _thread.start()
    logger.info("In-process memory worker started")


def stop_memory_worker() -> None:
    _stop_event.set()
    global _thread
    if _thread is not None:
        _thread.join(timeout=5)
        _thread = None
