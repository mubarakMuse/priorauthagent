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

```
priorAuth/
├── priorauth/                  # Python backend package
│   ├── main.py                 # FastAPI app entry point
│   ├── config.py               # Environment settings
│   ├── api/routes.py           # HTTP routes (/health, /api/process, /api/process-pdf)
│   ├── pipeline/runner.py      # Orchestrates extract → match → generate → evaluate
│   ├── services/               # Business logic (one concern per file)
│   │   ├── extraction.py       # LLM clinical data extraction
│   │   ├── generation.py       # LLM prior-auth drafting
│   │   ├── evaluation.py       # Deterministic grounding checks
│   │   ├── llm_judge.py        # LLM-as-judge scoring
│   │   ├── rules.py            # Payer rule loading and matching
│   │   └── ingest.py           # PDF → text
│   ├── models/                 # Pydantic schemas (API contracts)
│   ├── llm/                    # Shared LLM client and prompts
│   └── data/rules.json         # Payer prior-auth rules
├── cli.py                      # Local CLI (no HTTP server)
├── frontend/                   # React + TypeScript UI
└── infra/                      # AWS Terraform + deploy scripts
```

| Layer | Responsibility |
|-------|----------------|
| **API** | HTTP validation, routing, error responses |
| **Pipeline** | Stage orchestration and retry loop |
| **Services** | Single-purpose business logic |
| **Models** | Typed request/response contracts |
| **LLM** | Anthropic client and prompt templates |

## Running it

### Backend

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export ANTHROPIC_API_KEY="your-key-here"
uvicorn priorauth.main:app --reload
# or: uvicorn app:app --reload  (compat shim)
```

Backend runs on `http://localhost:8000` (interactive docs at `/docs`).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). The dev server proxies `/api` to the backend.

## AWS deployment (Terraform)

See [infra/README.md](infra/README.md) for production infrastructure as code:

- **ECS Fargate** — FastAPI API container
- **ALB** — long-running LLM requests (120s timeout)
- **S3 + CloudFront** — React frontend, `/api/*` routed to the ALB
- **Secrets Manager** — `ANTHROPIC_API_KEY`
- **VPC** — private subnets + NAT for ECS tasks

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars   # set anthropic_api_key
terraform init && terraform apply
# then deploy API + frontend — see infra/README.md
```

## Production next steps

- Run the pipeline in a background worker (async jobs) instead of blocking HTTP.
- Persist cases, versioned payer rules, and an audit trail in PostgreSQL.
- Pull clinical data from the EHR via FHIR instead of paste/PDF.
- Add SSO/RBAC, PHI-safe logging, and a human approval step before submission.
