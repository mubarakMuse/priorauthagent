import json
import os
from pathlib import Path

import pytest

# Force in-memory job backend for all tests
os.environ.setdefault("JOB_STORE_BACKEND", "memory")
os.environ.setdefault("JOB_QUEUE_BACKEND", "memory")
os.environ.setdefault("ENABLE_SYNC_PIPELINE", "false")
os.environ.setdefault("ANTHROPIC_API_KEY", "test-key-not-used")

RULES_PATH = Path(__file__).resolve().parents[1] / "priorauth" / "data" / "rules.json"


@pytest.fixture
def rules_data() -> dict:
    return json.loads(RULES_PATH.read_text())


@pytest.fixture
def spine_injection_note() -> str:
    return """Patient: 45yo female
Chief complaint: Left leg radicular pain, 8 weeks

Assessment:
- Lumbar radiculopathy (M54.16)
- Failed 8 weeks conservative therapy (NSAIDs + PT)

Imaging: MRI shows L4-L5 disc herniation with nerve root compression

Plan:
- Lumbar epidural steroid injection with imaging guidance (CPT 62323)"""


@pytest.fixture
def sample_extraction_dict() -> dict:
    return {
        "diagnoses": [{"description": "Lumbar radiculopathy", "icd10_code": "M54.16"}],
        "procedures": [
            {"description": "Lumbar epidural steroid injection", "cpt_code": "62323"}
        ],
        "medications": [{"name": "NSAIDs", "dosage": None}],
        "patient_summary": "45yo female with radicular pain.",
        "clinical_evidence": {
            "conservative_therapy_weeks": 8,
            "conservative_therapy_types": ["NSAIDs", "PT"],
            "imaging_studies": [
                {
                    "modality": "MRI",
                    "body_part": "lumbar",
                    "finding": "disc herniation",
                }
            ],
            "clinical_findings": ["Left leg radicular pain"],
            "red_flag_symptoms": [],
            "prior_treatments_failed": ["NSAIDs", "PT"],
            "pt_visit_count": None,
            "prior_injection_count": 0,
        },
    }


@pytest.fixture(autouse=True)
def reset_job_backends():
    from priorauth.jobs.queue import reset_job_queue
    from priorauth.jobs.store import reset_job_store

    reset_job_store()
    reset_job_queue()
    yield
    reset_job_store()
    reset_job_queue()
