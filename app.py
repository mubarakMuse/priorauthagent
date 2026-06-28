"""Backward-compatible entry point. Prefer: uvicorn priorauth.main:app"""

from priorauth.main import app

__all__ = ["app"]
