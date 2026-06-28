export const HARDCODED_CONFIG = [
  {
    area: "Payer policy & rules",
    location: "Setup panel · rules JSON editor",
    detail: "Paste custom rules or load the Meridian Health Plan sample. Sent with each pipeline run.",
  },
  {
    area: "Rule matching logic",
    location: "priorauth/services/rules.py + criteria_validation.py",
    detail: "Layer 1: CPT + allowed ICD-10. Layer 2: validate conservative therapy, imaging, exam, diagnosis, etc. against extracted evidence.",
  },
  {
    area: "Policy retrieval (RAG-lite)",
    location: "priorauth/services/policy_retrieval.py",
    detail: "Keyword retrieval over rule criteria — demo stand-in for vector search over payer policy PDFs, injected into PA generation.",
  },
  {
    area: "LLM model",
    location: "priorauth/config.py",
    detail: "Defaults to claude-sonnet-4-6 via ANTHROPIC_API_KEY. Override with ANTHROPIC_MODEL env var.",
  },
  {
    area: "Extraction & generation prompts",
    location: "priorauth/llm/prompts.py",
    detail: "System prompts and JSON schemas are hardcoded in the backend.",
  },
  {
    area: "Confidence threshold",
    location: "priorauth/config.py",
    detail: "Pipeline retries generation if confidence < 0.8 (max 2 retries). Set via CONFIDENCE_THRESHOLD.",
  },
  {
    area: "Demo example cases",
    location: "frontend/src/constants/demoScenarios.ts",
    detail: "One sample clinical note per rule (plus a no-match case). Click a chip to load it.",
  },
  {
    area: "CORS allowed origins",
    location: "priorauth/config.py",
    detail: "ALLOWED_ORIGINS env var — defaults to localhost dev URLs in production Terraform sets CloudFront.",
  },
]
