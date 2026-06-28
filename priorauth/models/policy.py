from pydantic import BaseModel, Field


class RuleCriterion(BaseModel):
    id: str
    type: str
    description: str
    required: bool = True
    allowed_icd10: list[str] = Field(default_factory=list)


class PolicyRuleDetail(BaseModel):
    id: str
    procedure_cpt: str
    description: str
    category: str
    requires_prior_auth: bool
    criteria: list[RuleCriterion]
    typical_turnaround_days: int | None = None
    auto_approve_if_all_met: bool | None = None
    requires_medical_director_review: bool | None = None


class PolicyOverview(BaseModel):
    payer: str
    plan_type: str
    ruleset_version: str
    last_updated: str
    rules: list[PolicyRuleDetail]
    demo_matching_note: str
