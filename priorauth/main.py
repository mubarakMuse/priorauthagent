from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from priorauth.api import router
from priorauth.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="Prior Auth Agent",
        description="Agentic prior-authorization assistant for clinical notes.",
        version="1.0.0",
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
