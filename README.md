# Prior Auth Agent

An AI assistant that helps clinical teams prepare **prior authorization (prior auth)** requests from clinical notes.

**Live demo:** https://d7m3su8sqzqgt.cloudfront.net

Paste a clinical note (or upload a PDF), configure payer rules, run the pipeline, review the results, and **export a PDF** to send to a payer or for internal review.

---

## What it does (in plain English)

1. **Reads the note** — Extracts diagnoses, procedures, medications, and clinical evidence (therapy weeks, imaging, exam findings).
2. **Finds the right payer rule** — Matches CPT codes and ICD-10 codes against your policy.
3. **Checks policy criteria** — Validates things like conservative therapy duration, imaging, and diagnosis against the note.
4. **Drafts a prior auth request** — Generates clinical justification and supporting facts.
5. **Scores quality** — Checks that the draft is grounded in the source note (not invented).
6. **Exports a PDF** — Downloads a portfolio you can review or attach for submission.

This is a **demo / prototype**, not a certified medical device. Always have a clinician review outputs before sending anything to a payer.

---

## How the pipeline works

```
Clinical note (paste / PDF)
        │
        ▼
   Extract (LLM) ──► Match rules (CPT + ICD-10)
        │                    │
        │                    ▼
        │           Validate criteria (therapy, imaging, exam…)
        │                    │
        └──────────► Generate PA draft (LLM + policy context)
                           │
                           ▼
                    Evaluate (groundedness + retry if low confidence)
                           │
                           ▼
                    Results + Export PDF
```

| Step | Who decides | What happens |
|------|-------------|--------------|
| Extract | LLM | Pull structured data from free text |
| Match rules | Code | CPT + allowed ICD-10 from policy |
| Validate criteria | Code | Check each policy requirement against extracted evidence |
| Retrieve policy (RAG-lite) | Code | Pull relevant policy chunks for generation |
| Generate | LLM | Draft prior auth letter from extraction + rules |
| Evaluate | Code + LLM judge | Score confidence; retry up to 2 times if below 80% |

---

## Demo features

- **Configurable rules** — Paste your own payer policy JSON or load the built-in Meridian Health Plan sample.
- **Sample cases** — One-click notes for spine injection, MRI, PT, surgery, and no-match scenarios.
- **Criteria validation** — See which policy requirements are met, missing, or need external data (claims history).
- **Pop-up explainers** — “How it works” and “Policy & config” modals keep the main demo clean.
- **PDF export** — Download a payer-ready portfolio from the results screen.

---

## Project structure

```
priorAuth/
├── priorauth/              # Python backend (FastAPI)
│   ├── api/routes.py       # HTTP endpoints
│   ├── pipeline/runner.py  # Orchestrates the full flow
│   ├── services/           # Extraction, rules, criteria, generation, PDF export…
│   ├── models/             # Pydantic schemas
│   ├── llm/prompts.py      # LLM prompt templates
│   └── data/rules.json     # Default payer rules (Meridian Health Plan)
├── frontend/               # React + TypeScript + Tailwind
├── infra/terraform/        # AWS infrastructure (ECS, ALB, CloudFront, S3…)
└── scripts/                # deploy-api.sh, deploy-frontend.sh
```

---

## Run locally

### 1. Backend

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export ANTHROPIC_API_KEY="your-key-here"
uvicorn priorauth.main:app --reload
```

API: http://localhost:8000 · Docs: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173). The dev server proxies `/api` to the backend.

---

## Deploy to AWS

Infrastructure is managed with Terraform. See [infra/README.md](infra/README.md) for full details.

**Quick deploy (after `terraform apply`):**

```bash
# API (builds linux/amd64 image, pushes to ECR, redeploys ECS)
./scripts/deploy-api.sh us-east-1 \
  <account>.dkr.ecr.us-east-1.amazonaws.com/priorauth-prod-api \
  priorauth-prod-cluster priorauth-prod-api

# Frontend (builds React app, syncs to S3, invalidates CloudFront)
./scripts/deploy-frontend.sh priorauth-prod-frontend-<account-id> <cloudfront-distribution-id>
```

Get the exact commands from Terraform output:

```bash
cd infra/terraform
terraform output deploy_api_command
terraform output deploy_frontend_command
```

**Required secret:** Set `anthropic_api_key` in `terraform.tfvars` (gitignored). Never commit API keys.

---

## Background jobs (async pipeline)

Long-running LLM calls no longer block HTTP. The API returns immediately; a worker processes jobs in the background.

```
Browser ──POST /api/jobs──► API (returns job_id in ~100ms)
              │
              ▼
         SQS queue ──► Worker ECS task ──► DynamoDB (status + result)
              │
Browser ──GET /api/jobs/{id}──► poll until completed
```

| Environment | Queue | Store | Worker |
|-------------|-------|-------|--------|
| **Local** | In-memory | In-memory | In-process thread (auto-starts with API) |
| **AWS** | SQS | DynamoDB | ECS Fargate worker service |

---

## Testing

### Backend (pytest)

```bash
pip install -r requirements-dev.txt
pytest --cov=priorauth --cov-report=term-missing
```

27 tests covering rules matching, criteria validation, jobs, API routes, PDF export, and evaluation.

### Frontend (vitest)

```bash
cd frontend && npm run test
```

---

## CI/CD

GitHub Actions workflows in `.github/workflows/`:

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| **ci.yml** | Push / PR to `main` | Backend tests + coverage, frontend tests + build, Docker build |
| **deploy.yml** | Push to `main` | Runs tests, then deploys API + worker + frontend to AWS |

**Deploy secrets required** (GitHub → Settings → Secrets):

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

After adding SQS/DynamoDB/worker via Terraform, run:

```bash
cd infra/terraform && terraform apply
```

---

## API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Health check |
| GET | `/api/policy` | Default payer policy |
| POST | `/api/policy/preview` | Validate custom rules JSON |
| **POST** | **`/api/jobs`** | **Submit pipeline job (async)** |
| **POST** | **`/api/jobs/pdf`** | **Submit PDF pipeline job (async)** |
| **GET** | **`/api/jobs/{job_id}`** | **Poll job status / result** |
| POST | `/api/export-pdf` | Generate PDF portfolio from results |
| POST | `/api/process` | Sync pipeline (disabled in production) |

---

## Production improvements (roadmap)

What you have now is a strong **demo**. To move toward real clinical use, prioritize these in order:

### Must-have before real PHI

| Priority | Improvement | Why |
|----------|-------------|-----|
| 1 | **Authentication & RBAC** | SSO (Okta/Azure AD), role-based access — no open public URL with patient data |
| 2 | **PHI-safe logging** | Never log clinical notes or API keys; redact in CloudWatch; BAA with vendors |
| 3 | **Async job queue** | ✅ SQS + DynamoDB + ECS worker implemented |
| 4 | **Database** | PostgreSQL for cases, audit trail, versioned rules — not stateless requests |
| 5 | **Human approval gate** | Clinician must sign off before PDF is “submission ready” |

### Core product (real prior auth workflow)

| Priority | Improvement | Why |
|----------|-------------|-----|
| 6 | **EHR integration (FHIR)** | Pull notes, diagnoses, imaging from Epic/Cerner — not paste-only |
| 7 | **Eligibility check** | Verify member/plan via payer 270/271 before matching rules |
| 8 | **Claims / history lookup** | Injection frequency, PT visit counts need claims data, not notes alone |
| 9 | **Live payer policies** | Replace static `rules.json` with payer API or curated policy database |
| 10 | **Vector RAG** | Embed payer policy PDFs; retrieve relevant sections per case (replace keyword demo) |
| 11 | **Payer submission** | X12 278, Availity/Change Healthcare portal, or fax integration |
| 12 | **Denial & appeals** | Track auth status, store denial reasons, support rework |

### Infrastructure & ops

| Priority | Improvement | Why |
|----------|-------------|-----|
| 13 | **Custom domain + HTTPS on ALB** | Professional URL, stricter TLS |
| 14 | **WAF on CloudFront** | Rate limiting, bot protection |
| 15 | **CI/CD (GitHub Actions)** | ✅ Tests on PR; auto-deploy on push to main |
| 16 | **Monitoring & alerts** | Datadog/CloudWatch alarms on errors, latency, ECS health |
| 17 | **Multi-environment** | Separate dev / staging / prod with isolated secrets |
| 18 | **Cost controls** | Right-size ECS tasks, consider NAT gateway alternatives |

### AI quality

| Priority | Improvement | Why |
|----------|-------------|-----|
| 19 | **Structured criteria via LLM** | Hybrid: code for codes, LLM for narrative criteria with citations |
| 20 | **Evaluation dataset** | Golden test cases with expected rule matches and criteria outcomes |
| 21 | **Prompt versioning** | Track which prompt version produced each draft (audit) |

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | — | Required. Anthropic API key |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-6` | LLM model |
| `CONFIDENCE_THRESHOLD` | `0.8` | Retry generation if below this |
| `MAX_GENERATION_RETRIES` | `2` | Max retry attempts |
| `RULES_PATH` | `priorauth/data/rules.json` | Server-side default rules file |
| `JOB_STORE_BACKEND` | `memory` | `memory` or `dynamodb` |
| `JOB_QUEUE_BACKEND` | `memory` | `memory` or `sqs` |
| `JOB_TABLE_NAME` | — | DynamoDB table (AWS) |
| `JOB_QUEUE_URL` | — | SQS queue URL (AWS) |
| `AWS_REGION` | `us-east-1` | AWS region for SQS/DynamoDB |
| `ENABLE_SYNC_PIPELINE` | `false` | Enable blocking `/api/process` (dev only) |

---

## Tech stack

- **Backend:** Python 3.12, FastAPI, Pydantic, Anthropic Claude, ReportLab (PDF)
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4
- **AWS:** ECS Fargate, ALB, ECR, S3, CloudFront, Secrets Manager, VPC + NAT
- **IaC:** Terraform

---

## License

Demo / internal use. Review compliance requirements before handling real patient data.
