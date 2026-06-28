from priorauth.models.clinical import ClinicalExtraction, Diagnosis, Procedure
from priorauth.models.pipeline import PipelineResponse, PriorAuthRequest
from priorauth.services.pdf_export import build_portfolio_pdf


def test_build_portfolio_pdf_returns_valid_pdf(sample_extraction_dict):
    extraction = ClinicalExtraction.model_validate(sample_extraction_dict)
    pa = PriorAuthRequest(
        payer="Meridian Health Plan",
        procedure_description="Lumbar ESI",
        cpt_code="62323",
        diagnosis_description="Radiculopathy",
        icd10_code="M54.16",
        clinical_justification="Medical necessity documented.",
        supporting_facts=["8 weeks failed conservative therapy"],
    )
    result = PipelineResponse(
        extraction=extraction,
        matched_rules=[],
        prior_auth_request=pa,
    )

    pdf = build_portfolio_pdf(result)
    assert pdf.startswith(b"%PDF")
    assert len(pdf) > 500


def test_build_portfolio_pdf_without_prior_auth(sample_extraction_dict):
    extraction = ClinicalExtraction.model_validate(sample_extraction_dict)
    result = PipelineResponse(extraction=extraction, matched_rules=[])

    pdf = build_portfolio_pdf(result)
    assert pdf.startswith(b"%PDF")
