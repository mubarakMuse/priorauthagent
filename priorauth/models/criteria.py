from pydantic import BaseModel, Field

from priorauth.models.policy import RuleCriterion


class CriterionEval(BaseModel):
    criterion_id: str
    criterion_type: str
    description: str
    required: bool
    status: str  # met | not_met | partial | needs_external_data
    detail: str


class RuleCriteriaResult(BaseModel):
    rule_id: str
    criteria: list[CriterionEval] = Field(default_factory=list)
    required_met: int = 0
    required_total: int = 0
    optional_met: int = 0
    optional_total: int = 0
    readiness: str  # ready | gaps | blocked


class CriteriaValidationResult(BaseModel):
    rules: list[RuleCriteriaResult] = Field(default_factory=list)
    summary: str
