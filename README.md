# priorauthagent

An agentic prior-authorization assistant. It ingests a clinical note (pasted text or PDF), uses an LLM to extract structured clinical data, matches it against payer prior-auth rules with deterministic code, drafts a prior-authorization request, and evaluates the output for groundedness — retrying generation when confidence is low.

## Architecture

```
Clinical note (paste / PDF)
        │
        ▼
   Ingest  ──►  Extract (LLM)  ──►  Match rules (code)  ──►  Generate (LLM)
                                                                   │
                                                                   ▼
                                              Evaluate (code checks + LLM judge)
                                                                   │
                                            confidence < 0.8 ? ──► retry with feedback
                                                                   │ (max 3 attempts)
                                                                   ▼
                                                        Full result → React UI
```

- **LLM where language matters:** extraction and request generation.
- **Deterministic code where policy matters:** payer rule matching and code/fact grounding checks.
- **Eval + retry loop:** an LLM-as-judge plus deterministic checks produce a blended confidence score; low scores feed feedback back into generation.

## Project layout

| File | Purpose |
|------|---------|
| `app.py` | FastAPI app — `/api/process` (text) and `/api/process-pdf` (upload) |
| `pipeline.py` | Orchestrates the stages and the retry loop |
| `script.py` | Clinical-data extraction (LLM call) + CLI entry point |
| `rules.py` / `rules.json` | Payer rule loading and matching |
| `generate.py` | Drafts the prior-auth request (LLM call) |
| `eval.py` | Deterministic grounding checks |
| `llm_eval.py` | LLM-as-judge groundedness scoring |
| `models.py` | Pydantic models (the typed contracts) |
| `ingest.py` | PDF → text (pypdf) |
| `frontend/` | React + TypeScript UI |

## Running it

### Backend

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export ANTHROPIC_API_KEY="your-key-here"
uvicorn app:app --reload
```

Backend runs on `http://localhost:8000` (interactive docs at `/docs`).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Production next steps

- Run the pipeline in a background worker (async jobs) instead of blocking HTTP.
- Persist cases, versioned payer rules, and an audit trail in PostgreSQL.
- Pull clinical data from the EHR via FHIR instead of paste/PDF.
- Add SSO/RBAC, PHI-safe logging, and a human approval step before submission.
