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
