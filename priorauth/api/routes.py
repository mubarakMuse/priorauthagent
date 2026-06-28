from fastapi import APIRouter, File, HTTPException, UploadFile

from priorauth.models.pipeline import PipelineRequest, PipelineResponse
from priorauth.pipeline import run_pipeline
from priorauth.services.ingest import extract_text_from_pdf

router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/api/process", response_model=PipelineResponse)
def process_clinical_note(request: PipelineRequest) -> PipelineResponse:
    if not request.clinical_note.strip():
        raise HTTPException(status_code=400, detail="clinical_note cannot be empty")

    try:
        return run_pipeline(request.clinical_note)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/api/process-pdf", response_model=PipelineResponse)
async def process_pdf(file: UploadFile = File(...)) -> PipelineResponse:
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must have .pdf extension")

    try:
        file_bytes = await file.read()
        clinical_note = extract_text_from_pdf(file_bytes)

        if not clinical_note.strip():
            raise HTTPException(
                status_code=400,
                detail="PDF contained no extractable text",
            )

        return run_pipeline(clinical_note)

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
