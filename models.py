from pydantic import BaseModel, Field


class Diagnosis(BaseModel):
    description: str
    icd10_code: str | None = None


class Procedure(BaseModel):
    description: str
    cpt_code: str | None = None


class Medication(BaseModel):
    name: str
    dosage: str | None = None


class ClinicalExtraction(BaseModel):
    diagnoses: list[Diagnosis] = Field(default_factory=list)
    procedures: list[Procedure] = Field(default_factory=list)
    medications: list[Medication] = Field(default_factory=list)
    patient_summary: str

class PayerRule(BaseModel):
    id: str
    payer: str
    description: str
    procedure_cpt: str
    required_diagnosis_icd10: str | None = None
    requires_prior_auth: bool

class PriorAuthRequest(BaseModel):
    payer: str
    procedure_description: str
    cpt_code: str
    diagnosis_description: str
    icd10_code: str
    clinical_justification: str
    supporting_facts: list[str] = Field(default_factory=list)

class PipelineRequest(BaseModel):
    clinical_note: str


class FactEval(BaseModel):  
    fact: str
    grounded: bool
    reason: str


class LLMEvalResult(BaseModel):
    groundedness_score: float  # 0.0 to 1.0
    ungrounded_claims: list[str] = Field(default_factory=list)
    reasoning: str


class PipelineEval(BaseModel):
    extraction_grounded: bool
    codes_found_in_source: list[str]
    codes_missing_from_source: list[str]
    fact_evals: list[FactEval] = Field(default_factory=list)
    prior_auth_consistent: bool
    code_confidence_score: float       # rename from confidence_score
    llm_eval: LLMEvalResult | None = None
    confidence_score: float            # blended final score
    summary: str
    retry_feedback: str | None = None  # fed back into generate on retry

class PipelineResponse(BaseModel):
    extraction: ClinicalExtraction
    matched_rules: list[PayerRule]
    prior_auth_request: PriorAuthRequest | None = None
    evaluation: PipelineEval | None = None
    generation_attempts: int = 1