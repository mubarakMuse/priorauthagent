from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from priorauth.api import router
from priorauth.config import get_settings
from priorauth.jobs.memory_worker import start_memory_worker, stop_memory_worker


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    if settings.job_queue_backend == "memory":
        start_memory_worker()
    yield
    if settings.job_queue_backend == "memory":
        stop_memory_worker()


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="Prior Auth Agent",
        description="Agentic prior-authorization assistant for clinical notes.",
        version="1.0.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.allowed_origins),
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(router)
    return app


app = create_app()
