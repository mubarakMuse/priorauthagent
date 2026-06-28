from pydantic import BaseModel, Field

from priorauth.models.clinical import ClinicalExtraction
from priorauth.models.criteria import CriteriaValidationResult
from priorauth.models.policy import PolicyOverview
from priorauth.models.rules import PayerRule


class PipelineRequest(BaseModel):
    clinical_note: str
    rules: dict | list | None = None


class PriorAuthRequest(BaseModel):
    payer: str
    procedure_description: str
    cpt_code: str
    diagnosis_description: str
    icd10_code: str
    clinical_justification: str
    supporting_facts: list[str] = Field(default_factory=list)


class FactEval(BaseModel):
    fact: str
    grounded: bool
    reason: str


class LLMEvalResult(BaseModel):
    groundedness_score: float
    ungrounded_claims: list[str] = Field(default_factory=list)
    reasoning: str


class PipelineEval(BaseModel):
    extraction_grounded: bool
    codes_found_in_source: list[str]
    codes_missing_from_source: list[str]
    fact_evals: list[FactEval] = Field(default_factory=list)
    prior_auth_consistent: bool
    code_confidence_score: float
    llm_eval: LLMEvalResult | None = None
    confidence_score: float
    summary: str
    retry_feedback: str | None = None


class PipelineResponse(BaseModel):
    extraction: ClinicalExtraction
    matched_rules: list[PayerRule]
    prior_auth_request: PriorAuthRequest | None = None
    evaluation: PipelineEval | None = None
    generation_attempts: int = 1
    policy: PolicyOverview | None = None
    criteria_validation: CriteriaValidationResult | None = None
    retrieved_policy_chunks: list[dict] = Field(default_factory=list)
