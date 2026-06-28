import os

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from ingest import extract_text_from_pdf
from models import PipelineRequest, PipelineResponse
from pipeline import run_pipeline

app = FastAPI(title="Prior Auth Agent")

_default_origins = "http://localhost:5173,http://localhost:5174,http://localhost:3000"
_allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", _default_origins).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/process", response_model=PipelineResponse)
def process_clinical_note(request: PipelineRequest):
    if not request.clinical_note.strip():
        raise HTTPException(status_code=400, detail="clinical_note cannot be empty")

    try:
        return run_pipeline(request.clinical_note)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/process-pdf", response_model=PipelineResponse)
async def process_pdf(file: UploadFile = File(...)):
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must have .pdf extension")

    try:
        file_bytes = await file.read()
        clinical_note = extract_text_from_pdf(file_bytes)

        if not clinical_note.strip():
            raise HTTPException(status_code=400, detail="PDF contained no extractable text")

        return run_pipeline(clinical_note)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))