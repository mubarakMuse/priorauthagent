export interface Diagnosis {
  description: string
  icd10_code: string | null
}

export interface Procedure {
  description: string
  cpt_code: string | null
}

export interface Medication {
  name: string
  dosage: string | null
}

export interface ClinicalEvidence {
  conservative_therapy_weeks: number | null
  conservative_therapy_types: string[]
  imaging_studies: { modality: string; body_part: string | null; finding: string | null }[]
  clinical_findings: string[]
  red_flag_symptoms: string[]
  prior_treatments_failed: string[]
  pt_visit_count: number | null
  prior_injection_count: number | null
}

export interface ClinicalExtraction {
  diagnoses: Diagnosis[]
  procedures: Procedure[]
  medications: Medication[]
  patient_summary: string
  clinical_evidence?: ClinicalEvidence
}

export interface PayerRule {
  id: string
  payer: string
  description: string
  procedure_cpt: string
  required_diagnosis_icd10: string | null
  allowed_icd10_codes?: string[]
  requires_prior_auth: boolean
}

export interface PriorAuthRequest {
  payer: string
  procedure_description: string
  cpt_code: string
  diagnosis_description: string
  icd10_code: string
  clinical_justification: string
  supporting_facts: string[]
}

export interface LLMEvalResult {
  groundedness_score: number
  ungrounded_claims: string[]
  reasoning: string
}

export interface FactEval {
  fact: string
  grounded: boolean
  reason: string
}

export interface PipelineEval {
  extraction_grounded: boolean
  codes_found_in_source: string[]
  codes_missing_from_source: string[]
  fact_evals: FactEval[]
  prior_auth_consistent: boolean
  code_confidence_score: number
  llm_eval: LLMEvalResult | null
  confidence_score: number
  summary: string
  retry_feedback: string | null
}

export interface CriterionEval {
  criterion_id: string
  criterion_type: string
  description: string
  required: boolean
  status: string
  detail: string
}

export interface RuleCriteriaResult {
  rule_id: string
  criteria: CriterionEval[]
  required_met: number
  required_total: number
  optional_met: number
  optional_total: number
  readiness: string
}

export interface CriteriaValidationResult {
  rules: RuleCriteriaResult[]
  summary: string
}

export interface RetrievedPolicyChunk {
  rule_id: string
  procedure_cpt: string
  description: string
  retrieval_score: number
  source: string
}

import type { PolicyOverview } from "./types/policy"

export interface PipelineResponse {
  extraction: ClinicalExtraction
  matched_rules: PayerRule[]
  prior_auth_request: PriorAuthRequest | null
  evaluation: PipelineEval | null
  generation_attempts: number
  policy?: PolicyOverview | null
  criteria_validation?: CriteriaValidationResult | null
  retrieved_policy_chunks?: RetrievedPolicyChunk[]
}

export type InputMode = "note" | "pdf"

export type JobStatus = "queued" | "running" | "completed" | "failed"

export interface JobStatusResponse {
  job_id: string
  status: JobStatus
  error: string | null
  result: PipelineResponse | null
  created_at: string
  updated_at: string
}
