from priorauth.models.clinical import ClinicalExtraction, ClinicalEvidence, Diagnosis, ImagingStudy, Procedure
from priorauth.services.criteria_validation import validate_criteria_for_rules
from priorauth.services.rules import load_policy_overview, load_rules, match_rules


def test_criteria_ready_for_spine_injection(sample_extraction_dict, spine_injection_note):
    extraction = ClinicalExtraction.model_validate(sample_extraction_dict)
    rules = load_rules()
    policy = load_policy_overview()
    matched = match_rules(extraction, rules)

    result = validate_criteria_for_rules(
        matched, policy.rules, extraction, spine_injection_note
    )

    assert len(result.rules) == 1
    rule_result = result.rules[0]
    assert rule_result.rule_id == "PA-SPINE-001"
    assert rule_result.readiness == "ready"
    assert rule_result.required_met == rule_result.required_total


def test_conservative_therapy_not_met_when_weeks_short(spine_injection_note):
    extraction = ClinicalExtraction(
        diagnoses=[Diagnosis(description="Radiculopathy", icd10_code="M54.16")],
        procedures=[Procedure(description="ESI", cpt_code="62323")],
        patient_summary="Test",
        clinical_evidence=ClinicalEvidence(
            conservative_therapy_weeks=4,
            imaging_studies=[ImagingStudy(modality="MRI", body_part="lumbar", finding="herniation")],
        ),
    )
    rules = load_rules()
    policy = load_policy_overview()
    matched = match_rules(extraction, rules)

    result = validate_criteria_for_rules(
        matched, policy.rules, extraction, spine_injection_note
    )

    c1 = next(c for c in result.rules[0].criteria if c.criterion_id == "C1")
    assert c1.status == "not_met"


def test_frequency_limit_needs_external_data(sample_extraction_dict, spine_injection_note):
    extraction = ClinicalExtraction.model_validate(sample_extraction_dict)
    extraction.clinical_evidence.prior_injection_count = None
    rules = load_rules()
    policy = load_policy_overview()
    matched = match_rules(extraction, rules)

    result = validate_criteria_for_rules(
        matched, policy.rules, extraction, spine_injection_note
    )

    c4 = next(c for c in result.rules[0].criteria if c.criterion_id == "C4")
    assert c4.status == "needs_external_data"
