from typing import TypedDict

from priorauth.models.clinical import ClinicalExtraction
from priorauth.models.criteria import CriteriaValidationResult
from priorauth.models.pipeline import PipelineEval, PipelineResponse, PriorAuthRequest
from priorauth.models.policy import PolicyOverview
from priorauth.models.rules import PayerRule


class PipelineState(TypedDict, total=False):
    clinical_note: str
    rules_data: dict | list | None
    extraction: ClinicalExtraction
    matched_rules: list[PayerRule]
    policy: PolicyOverview
    criteria_validation: CriteriaValidationResult | None
    policy_chunks: list[dict]
    prior_auth: PriorAuthRequest | None
    evaluation: PipelineEval | None
    feedback: str | None
    attempts: int
    should_generate: bool
    response: PipelineResponse
