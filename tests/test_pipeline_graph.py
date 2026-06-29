from unittest.mock import patch

import pytest

from priorauth.models.clinical import ClinicalExtraction
from priorauth.models.pipeline import LLMEvalResult, PipelineEval, PriorAuthRequest
from priorauth.pipeline.graph import build_pipeline_graph
from priorauth.pipeline.runner import run_pipeline


@pytest.fixture
def mock_prior_auth() -> PriorAuthRequest:
    return PriorAuthRequest(
        payer="Meridian Health Plan",
        procedure_description="Lumbar epidural steroid injection",
        cpt_code="62323",
        diagnosis_description="Lumbar radiculopathy",
        icd10_code="M54.16",
        clinical_justification="Patient failed 8 weeks conservative therapy with documented MRI.",
        supporting_facts=["Failed 8 weeks conservative therapy", "MRI shows disc herniation"],
    )


@pytest.fixture
def mock_llm_eval() -> LLMEvalResult:
    return LLMEvalResult(
        groundedness_score=0.9,
        ungrounded_claims=[],
        reasoning="Supported by note.",
    )


def test_pipeline_graph_routes_to_generation(
    sample_extraction_dict,
    spine_injection_note,
    mock_prior_auth,
    mock_llm_eval,
):
    extraction = ClinicalExtraction.model_validate(sample_extraction_dict)
    evaluation = PipelineEval(
        extraction_grounded=True,
        codes_found_in_source=["M54.16", "62323"],
        codes_missing_from_source=[],
        prior_auth_consistent=True,
        code_confidence_score=1.0,
        confidence_score=0.9,
        summary="ok",
    )

    with (
        patch("priorauth.pipeline.nodes.extract_clinical_data", return_value=extraction),
        patch("priorauth.pipeline.nodes.generate_prior_auth_request", return_value=mock_prior_auth),
        patch("priorauth.pipeline.nodes.evaluate_pipeline", return_value=evaluation),
    ):
        graph = build_pipeline_graph()
        final_state = graph.invoke(
            {
                "clinical_note": spine_injection_note,
                "rules_data": None,
                "matched_rules": [],
                "policy_chunks": [],
                "attempts": 0,
            }
        )

    response = final_state["response"]
    assert response.prior_auth_request is not None
    assert response.prior_auth_request.cpt_code == "62323"
    assert response.matched_rules
    assert response.matched_rules[0].id == "PA-SPINE-001"
    assert final_state["attempts"] == 1


def test_pipeline_graph_skips_generation_for_pt_rule(sample_extraction_dict):
    pt_note = """Patient: 29yo female
Assessment: Rotator cuff tendinopathy
Plan: Therapeutic exercise / physical therapy (CPT 97110)"""

    extraction = ClinicalExtraction(
        diagnoses=[{"description": "Rotator cuff tendinopathy", "icd10_code": None}],
        procedures=[{"description": "Physical therapy", "cpt_code": "97110"}],
        patient_summary="29yo with shoulder impingement.",
    )
    evaluation = PipelineEval(
        extraction_grounded=True,
        codes_found_in_source=["97110"],
        codes_missing_from_source=[],
        prior_auth_consistent=True,
        code_confidence_score=1.0,
        confidence_score=0.85,
        summary="No auth required.",
    )

    with (
        patch("priorauth.pipeline.nodes.extract_clinical_data", return_value=extraction),
        patch("priorauth.pipeline.nodes.generate_prior_auth_request") as mock_generate,
        patch("priorauth.pipeline.nodes.evaluate_pipeline", return_value=evaluation),
    ):
        response = run_pipeline(pt_note)

    mock_generate.assert_not_called()
    assert response.prior_auth_request is None
    assert response.matched_rules[0].id == "PA-PT-001"
    assert response.generation_attempts == 0


def test_pipeline_graph_retries_generation_on_low_confidence(
    sample_extraction_dict,
    spine_injection_note,
    mock_prior_auth,
):
    extraction = ClinicalExtraction.model_validate(sample_extraction_dict)
    low_eval = PipelineEval(
        extraction_grounded=True,
        codes_found_in_source=["M54.16", "62323"],
        codes_missing_from_source=[],
        prior_auth_consistent=True,
        code_confidence_score=1.0,
        confidence_score=0.5,
        summary="Low confidence.",
        retry_feedback="Add more supporting facts from the note.",
    )
    high_eval = PipelineEval(
        extraction_grounded=True,
        codes_found_in_source=["M54.16", "62323"],
        codes_missing_from_source=[],
        prior_auth_consistent=True,
        code_confidence_score=1.0,
        confidence_score=0.92,
        summary="High confidence.",
    )

    with (
        patch("priorauth.pipeline.nodes.extract_clinical_data", return_value=extraction),
        patch(
            "priorauth.pipeline.nodes.generate_prior_auth_request",
            return_value=mock_prior_auth,
        ) as mock_generate,
        patch(
            "priorauth.pipeline.nodes.evaluate_pipeline",
            side_effect=[low_eval, high_eval],
        ),
    ):
        response = run_pipeline(spine_injection_note)

    assert mock_generate.call_count == 2
    assert response.generation_attempts == 2
    assert response.evaluation is not None
    assert response.evaluation.confidence_score == 0.92
