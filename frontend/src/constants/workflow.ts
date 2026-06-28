export const WORKFLOW_STEPS = [
  {
    step: 1,
    title: "Ingest",
    demo: "Paste a note or upload a PDF",
    production: "Pull chart from EHR (FHIR) or receive fax/portal upload",
  },
  {
    step: 2,
    title: "Extract",
    demo: "LLM pulls diagnoses, procedures, meds into structured JSON",
    production: "Same — becomes the source of truth for downstream checks",
  },
  {
    step: 3,
    title: "Match rules",
    demo: "CPT + allowed ICD-10 matched against payer policy",
    production: "Rules engine checks procedure/diagnosis/plan against live payer policy",
  },
  {
    step: 3,
    title: "Validate criteria",
    demo: "Each policy criterion checked vs extracted evidence (therapy, imaging, exam…)",
    production: "Automated + nurse review; claims/EHR for frequency and visit limits",
  },
  {
    step: 4,
    title: "Generate",
    demo: "RAG retrieves policy chunks; LLM drafts PA from extraction + criteria gaps",
    production: "Staff reviews/edits draft before payer submission (X12 278 / portal)",
  },
  {
    step: 5,
    title: "Evaluate",
    demo: "Code + LLM judge score groundedness; retry if confidence < 80%",
    production: "QA gate before submission; audit trail stored",
  },
]
