from pydantic import BaseModel, Field


class PayerRule(BaseModel):
    id: str
    payer: str
    description: str
    procedure_cpt: str
    required_diagnosis_icd10: str | None = None
    allowed_icd10_codes: list[str] = Field(default_factory=list)
    requires_prior_auth: bool
    criteria: list[dict] = Field(default_factory=list)
