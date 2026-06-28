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

export interface ClinicalExtraction {
  diagnoses: Diagnosis[]
  procedures: Procedure[]
  medications: Medication[]
  patient_summary: string
}

export interface PayerRule {
  id: string
  payer: string
  description: string
  procedure_cpt: string
  required_diagnosis_icd10: string | null
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

export interface PipelineResponse {
  extraction: ClinicalExtraction
  matched_rules: PayerRule[]
  prior_auth_request: PriorAuthRequest | null
  evaluation: PipelineEval | null
  generation_attempts: number
}

export type InputMode = "note" | "pdf"
