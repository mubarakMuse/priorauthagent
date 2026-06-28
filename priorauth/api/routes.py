import json
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Body, File, Form, HTTPException, UploadFile
from fastapi.responses import Response

from priorauth.config import get_settings
from priorauth.jobs.service import create_pipeline_job, get_job_status
from priorauth.models.jobs import JobStatusResponse, JobSubmitResponse
from priorauth.models.pipeline import PipelineRequest, PipelineResponse
from priorauth.models.policy import PolicyOverview
from priorauth.pipeline import run_pipeline
from priorauth.services.ingest import extract_text_from_pdf
from priorauth.services.pdf_export import build_portfolio_pdf
from priorauth.services.rules import load_policy_overview, load_policy_overview_from_data

router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/api/policy", response_model=PolicyOverview)
def get_policy() -> PolicyOverview:
    return load_policy_overview()


@router.post("/api/policy/preview", response_model=PolicyOverview)
def preview_policy(payload: Any = Body(...)) -> PolicyOverview:
    try:
        return load_policy_overview_from_data(payload)
    except (ValueError, KeyError, TypeError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/api/jobs", response_model=JobSubmitResponse)
def submit_pipeline_job(request: PipelineRequest) -> JobSubmitResponse:
    if not request.clinical_note.strip():
        raise HTTPException(status_code=400, detail="clinical_note cannot be empty")

    try:
        return create_pipeline_job(request.clinical_note, rules_data=request.rules)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/api/jobs/pdf", response_model=JobSubmitResponse)
async def submit_pdf_pipeline_job(
    file: UploadFile = File(...),
    rules_json: str | None = Form(default=None),
) -> JobSubmitResponse:
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must have .pdf extension")

    try:
        file_bytes = await file.read()
        clinical_note = extract_text_from_pdf(file_bytes)

        if not clinical_note.strip():
            raise HTTPException(status_code=400, detail="PDF contained no extractable text")

        rules_data = None
        if rules_json and rules_json.strip():
            try:
                rules_data = json.loads(rules_json)
            except json.JSONDecodeError as exc:
                raise HTTPException(status_code=400, detail="Invalid rules JSON") from exc

        return create_pipeline_job(clinical_note, rules_data=rules_data)

    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/api/jobs/{job_id}", response_model=JobStatusResponse)
def get_pipeline_job(job_id: str) -> JobStatusResponse:
    status = get_job_status(job_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return status


@router.post("/api/process", response_model=PipelineResponse)
def process_clinical_note_sync(request: PipelineRequest) -> PipelineResponse:
    """Synchronous pipeline — disabled in production; use POST /api/jobs instead."""
    if not get_settings().enable_sync_pipeline:
        raise HTTPException(
            status_code=410,
            detail="Synchronous processing disabled. Use POST /api/jobs and poll GET /api/jobs/{job_id}.",
        )

    if not request.clinical_note.strip():
        raise HTTPException(status_code=400, detail="clinical_note cannot be empty")

    try:
        return run_pipeline(request.clinical_note, rules_data=request.rules)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/api/process-pdf", response_model=PipelineResponse)
async def process_pdf_sync(
    file: UploadFile = File(...),
    rules_json: str | None = Form(default=None),
) -> PipelineResponse:
    if not get_settings().enable_sync_pipeline:
        raise HTTPException(
            status_code=410,
            detail="Synchronous processing disabled. Use POST /api/jobs/pdf and poll GET /api/jobs/{job_id}.",
        )

    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must have .pdf extension")

    try:
        file_bytes = await file.read()
        clinical_note = extract_text_from_pdf(file_bytes)

        if not clinical_note.strip():
            raise HTTPException(status_code=400, detail="PDF contained no extractable text")

        rules_data = None
        if rules_json and rules_json.strip():
            try:
                rules_data = json.loads(rules_json)
            except json.JSONDecodeError as exc:
                raise HTTPException(status_code=400, detail="Invalid rules JSON") from exc

        return run_pipeline(clinical_note, rules_data=rules_data)

    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/api/export-pdf")
def export_portfolio_pdf(result: PipelineResponse = Body(...)) -> Response:
    try:
        pdf_bytes = build_portfolio_pdf(result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d")
    payer_slug = "prior-auth"
    if result.prior_auth_request:
        payer_slug = result.prior_auth_request.payer.lower().replace(" ", "-")[:30]
    elif result.matched_rules:
        payer_slug = result.matched_rules[0].id.lower()

    filename = f"{payer_slug}-portfolio-{timestamp}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
