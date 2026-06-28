import os
from dataclasses import dataclass
from pathlib import Path

PACKAGE_DIR = Path(__file__).resolve().parent
DEFAULT_RULES_PATH = PACKAGE_DIR / "data" / "rules.json"
DEFAULT_CORS_ORIGINS = "http://localhost:5173,http://localhost:5174,http://localhost:3000"


@dataclass(frozen=True)
class Settings:
    anthropic_model: str
    allowed_origins: tuple[str, ...]
    max_generation_retries: int
    confidence_threshold: float
    rules_path: Path
    job_store_backend: str
    job_queue_backend: str
    job_table_name: str
    job_queue_url: str
    aws_region: str
    enable_sync_pipeline: bool


def get_settings() -> Settings:
    origins_raw = os.getenv("ALLOWED_ORIGINS", DEFAULT_CORS_ORIGINS)
    origins = tuple(o.strip() for o in origins_raw.split(",") if o.strip())

    rules_override = os.getenv("RULES_PATH")
    rules_path = Path(rules_override) if rules_override else DEFAULT_RULES_PATH

    return Settings(
        anthropic_model=os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6"),
        allowed_origins=origins,
        max_generation_retries=int(os.getenv("MAX_GENERATION_RETRIES", "2")),
        confidence_threshold=float(os.getenv("CONFIDENCE_THRESHOLD", "0.8")),
        rules_path=rules_path,
        job_store_backend=os.getenv("JOB_STORE_BACKEND", "memory"),
        job_queue_backend=os.getenv("JOB_QUEUE_BACKEND", "memory"),
        job_table_name=os.getenv("JOB_TABLE_NAME", ""),
        job_queue_url=os.getenv("JOB_QUEUE_URL", ""),
        aws_region=os.getenv("AWS_REGION", os.getenv("AWS_DEFAULT_REGION", "us-east-1")),
        enable_sync_pipeline=os.getenv("ENABLE_SYNC_PIPELINE", "false").lower() == "true",
    )
