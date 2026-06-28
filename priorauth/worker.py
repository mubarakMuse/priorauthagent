"""Background worker — polls SQS (or in-memory queue) and runs the pipeline."""

from __future__ import annotations

import logging
import signal
import sys
import time

from priorauth.jobs.queue import get_job_queue
from priorauth.jobs.service import process_job_payload

logger = logging.getLogger(__name__)

_shutdown = False


def _handle_signal(signum: int, frame: object) -> None:
    global _shutdown
    logger.info("Shutdown signal received (%s)", signum)
    _shutdown = True


def run_worker(*, poll_wait_seconds: int = 20) -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    signal.signal(signal.SIGTERM, _handle_signal)
    signal.signal(signal.SIGINT, _handle_signal)

    queue = get_job_queue()
    logger.info("Worker started — polling for pipeline jobs")

    while not _shutdown:
        messages = queue.receive(max_messages=1, wait_seconds=poll_wait_seconds)
        if not messages:
            continue

        for message in messages:
            if _shutdown:
                break
            try:
                process_job_payload(message.payload)
                logger.info("Job %s completed", message.payload.job_id)
            except Exception:
                logger.exception("Job %s failed", message.payload.job_id)
            finally:
                queue.delete(message)

    logger.info("Worker stopped")


def main() -> None:
    try:
        run_worker()
    except KeyboardInterrupt:
        pass
    sys.exit(0)


if __name__ == "__main__":
    main()
