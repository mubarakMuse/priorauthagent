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


class ImagingStudy(BaseModel):
    modality: str
    body_part: str | None = None
    finding: str | None = None


class ClinicalEvidence(BaseModel):
    """Structured evidence extracted for payer criteria validation."""

    conservative_therapy_weeks: int | None = None
    conservative_therapy_types: list[str] = Field(default_factory=list)
    imaging_studies: list[ImagingStudy] = Field(default_factory=list)
    clinical_findings: list[str] = Field(default_factory=list)
    red_flag_symptoms: list[str] = Field(default_factory=list)
    prior_treatments_failed: list[str] = Field(default_factory=list)
    pt_visit_count: int | None = None
    prior_injection_count: int | None = None


class ClinicalExtraction(BaseModel):
    diagnoses: list[Diagnosis] = Field(default_factory=list)
    procedures: list[Procedure] = Field(default_factory=list)
    medications: list[Medication] = Field(default_factory=list)
    patient_summary: str
    clinical_evidence: ClinicalEvidence = Field(default_factory=ClinicalEvidence)
