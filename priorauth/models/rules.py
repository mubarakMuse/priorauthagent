from pydantic import BaseModel


class PayerRule(BaseModel):
    id: str
    payer: str
    description: str
    procedure_cpt: str
    required_diagnosis_icd10: str | None = None
    requires_prior_auth: bool
