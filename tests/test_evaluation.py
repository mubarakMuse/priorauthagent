from unittest.mock import patch

from priorauth.models.clinical import ClinicalExtraction, Diagnosis, Procedure
from priorauth.models.pipeline import LLMEvalResult, PriorAuthRequest
from priorauth.services.evaluation import evaluate_pipeline


def test_evaluation_codes_grounded(sample_extraction_dict, spine_injection_note):
    extraction = ClinicalExtraction.model_validate(sample_extraction_dict)
    prior_auth = PriorAuthRequest(
        payer="Meridian Health Plan",
        procedure_description="ESI",
        cpt_code="62323",
        diagnosis_description="Radiculopathy",
        icd10_code="M54.16",
        clinical_justification="Test justification from note with radicular pain.",
        supporting_facts=["Failed 8 weeks conservative therapy including NSAIDs and PT"],
    )

    mock_llm_eval = LLMEvalResult(
        groundedness_score=0.9,
        ungrounded_claims=[],
        reasoning="All claims supported.",
    )

    with patch("priorauth.services.evaluation.evaluate_with_llm", return_value=mock_llm_eval):
        evaluation = evaluate_pipeline(spine_injection_note, extraction, prior_auth)

    assert evaluation.extraction_grounded is True
    assert "M54.16" in evaluation.codes_found_in_source
    assert "62323" in evaluation.codes_found_in_source
    assert evaluation.prior_auth_consistent is True


def test_evaluation_detects_missing_codes(spine_injection_note):
    extraction = ClinicalExtraction(
        diagnoses=[Diagnosis(description="Test", icd10_code="Z99.99")],
        procedures=[Procedure(description="Test", cpt_code="99999")],
        patient_summary="Test",
    )

    evaluation = evaluate_pipeline(spine_injection_note, extraction, None)

    assert evaluation.extraction_grounded is False
    assert len(evaluation.codes_missing_from_source) >= 1
