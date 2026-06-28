import re

from priorauth.models.clinical import ClinicalExtraction
from priorauth.models.criteria import CriteriaValidationResult, CriterionEval, RuleCriteriaResult
from priorauth.models.policy import PolicyRuleDetail, RuleCriterion
from priorauth.models.rules import PayerRule

RED_FLAG_KEYWORDS = (
    "cauda equina",
    "progressive neuro",
    "malignancy",
    "infection",
    "trauma",
    "red-flag",
    "red flag",
)

IMAGING_MODALITIES = ("mri", "ct", "x-ray", "xray", "ultrasound", "pet")


def _parse_min_weeks(description: str, default: int = 6) -> int:
    match = re.search(r"(\d+)\s*weeks?", description.lower())
    if match:
        return int(match.group(1))
    return default


def _diagnosis_codes(extraction: ClinicalExtraction) -> set[str]:
    return {d.icd10_code for d in extraction.diagnoses if d.icd10_code}


def _evaluate_criterion(
    criterion: RuleCriterion,
    extraction: ClinicalExtraction,
    source_note: str,
) -> CriterionEval:
    evidence = extraction.clinical_evidence
    note_lower = source_note.lower()
    diagnosis_codes = _diagnosis_codes(extraction)

    if criterion.type == "diagnosis":
        if not criterion.allowed_icd10:
            met = len(diagnosis_codes) > 0
            detail = "Diagnosis documented in note" if met else "No diagnosis codes extracted"
        else:
            matched = diagnosis_codes.intersection(set(criterion.allowed_icd10))
            met = len(matched) > 0
            detail = (
                f"Matched ICD-10: {', '.join(sorted(matched))}"
                if met
                else f"Need one of: {', '.join(criterion.allowed_icd10)}"
            )
        return CriterionEval(
            criterion_id=criterion.id,
            criterion_type=criterion.type,
            description=criterion.description,
            required=criterion.required,
            status="met" if met else "not_met",
            detail=detail,
        )

    if criterion.type == "conservative_therapy":
        min_weeks = _parse_min_weeks(criterion.description)
        weeks = evidence.conservative_therapy_weeks
        if weeks is not None:
            met = weeks >= min_weeks
            detail = f"Documented {weeks} weeks (requires {min_weeks}+)"
        else:
            met = any(
                token in note_lower
                for token in ("conservative", "physical therapy", "pt", "nsaid", "analgesic")
            ) and any(str(min_weeks) in note_lower or "week" in note_lower for _ in [1])
            detail = (
                "Conservative therapy mentioned in note"
                if met
                else f"Need {min_weeks}+ weeks of conservative therapy documented"
            )
        return CriterionEval(
            criterion_id=criterion.id,
            criterion_type=criterion.type,
            description=criterion.description,
            required=criterion.required,
            status="met" if met else "not_met",
            detail=detail,
        )

    if criterion.type == "imaging":
        if evidence.imaging_studies:
            modalities = ", ".join(s.modality for s in evidence.imaging_studies)
            met = True
            detail = f"Imaging documented: {modalities}"
        else:
            met = any(mod in note_lower for mod in IMAGING_MODALITIES)
            detail = "Imaging referenced in note" if met else "No imaging study documented"
        return CriterionEval(
            criterion_id=criterion.id,
            criterion_type=criterion.type,
            description=criterion.description,
            required=criterion.required,
            status="met" if met else "not_met",
            detail=detail,
        )

    if criterion.type == "clinical_exam":
        if evidence.clinical_findings:
            met = True
            detail = f"Exam findings: {'; '.join(evidence.clinical_findings[:3])}"
        else:
            exam_terms = (
                "straight leg raise",
                "motor",
                "sensory",
                "reflex",
                "neurological",
                "weakness",
                "numbness",
            )
            met = any(term in note_lower for term in exam_terms)
            detail = "Objective exam findings in note" if met else "No objective exam findings documented"
        return CriterionEval(
            criterion_id=criterion.id,
            criterion_type=criterion.type,
            description=criterion.description,
            required=criterion.required,
            status="met" if met else "not_met",
            detail=detail,
        )

    if criterion.type == "red_flag_exception":
        if evidence.red_flag_symptoms:
            met = True
            detail = f"Red flags noted: {'; '.join(evidence.red_flag_symptoms)}"
        else:
            met = any(flag in note_lower for flag in RED_FLAG_KEYWORDS)
            detail = "Red-flag symptoms documented — auth may be waived" if met else "No red-flag symptoms documented"
        return CriterionEval(
            criterion_id=criterion.id,
            criterion_type=criterion.type,
            description=criterion.description,
            required=criterion.required,
            status="met" if met else "partial",
            detail=detail,
        )

    if criterion.type == "failed_injection":
        if evidence.prior_treatments_failed:
            met = True
            detail = f"Prior failed treatments: {'; '.join(evidence.prior_treatments_failed)}"
        else:
            met = any(
                term in note_lower
                for term in ("failed esi", "failed injection", "prior esi", "prior injection", "progressive")
            )
            detail = "Prior injection failure or progression noted" if met else "Not documented in note"
        return CriterionEval(
            criterion_id=criterion.id,
            criterion_type=criterion.type,
            description=criterion.description,
            required=criterion.required,
            status="met" if met else "partial",
            detail=detail,
        )

    if criterion.type == "visit_limit":
        if evidence.pt_visit_count is not None:
            met = evidence.pt_visit_count <= 12
            detail = f"{evidence.pt_visit_count} PT visits this plan year (first 12 typically exempt)"
        else:
            met = "first 12" in note_lower or "within first" in note_lower
            detail = "Within visit limit per note" if met else "Visit count not documented — needs claims history"
        status = "met" if met else "needs_external_data"
        return CriterionEval(
            criterion_id=criterion.id,
            criterion_type=criterion.type,
            description=criterion.description,
            required=criterion.required,
            status=status,
            detail=detail,
        )

    if criterion.type == "frequency_limit":
        if evidence.prior_injection_count is not None:
            met = evidence.prior_injection_count < 3
            detail = f"{evidence.prior_injection_count} prior injections in region (limit 3 per 12 months)"
        else:
            met = False
            detail = "Injection frequency requires claims / prior procedure history (not in note alone)"
        return CriterionEval(
            criterion_id=criterion.id,
            criterion_type=criterion.type,
            description=criterion.description,
            required=criterion.required,
            status="needs_external_data" if not met else "met",
            detail=detail,
        )

    return CriterionEval(
        criterion_id=criterion.id,
        criterion_type=criterion.type,
        description=criterion.description,
        required=criterion.required,
        status="partial",
        detail=f"Criterion type '{criterion.type}' — manual review recommended",
    )


def _rule_readiness(required_met: int, required_total: int, required_not_met: int) -> str:
    if required_total == 0:
        return "ready"
    if required_not_met == 0:
        return "ready"
    if required_met > 0:
        return "gaps"
    return "blocked"


def validate_criteria_for_rules(
    matched_rules: list[PayerRule],
    policy_rules: list[PolicyRuleDetail],
    extraction: ClinicalExtraction,
    source_note: str,
) -> CriteriaValidationResult:
    """Validate payer policy criteria against extracted clinical evidence."""
    policy_by_id = {rule.id: rule for rule in policy_rules}
    results: list[RuleCriteriaResult] = []

    for matched in matched_rules:
        policy_rule = policy_by_id.get(matched.id)
        if not policy_rule:
            continue

        criterion_evals = [
            _evaluate_criterion(criterion, extraction, source_note)
            for criterion in policy_rule.criteria
        ]

        required = [c for c in criterion_evals if c.required]
        optional = [c for c in criterion_evals if not c.required]
        required_met = sum(1 for c in required if c.status == "met")
        required_not_met = sum(1 for c in required if c.status == "not_met")

        results.append(
            RuleCriteriaResult(
                rule_id=matched.id,
                criteria=criterion_evals,
                required_met=required_met,
                required_total=len(required),
                optional_met=sum(1 for c in optional if c.status == "met"),
                optional_total=len(optional),
                readiness=_rule_readiness(required_met, len(required), required_not_met),
            )
        )

    if not results:
        summary = "No matched rules to validate."
    else:
        ready = sum(1 for r in results if r.readiness == "ready")
        gaps = sum(1 for r in results if r.readiness == "gaps")
        blocked = sum(1 for r in results if r.readiness == "blocked")
        summary = f"{ready} rule(s) criteria-ready, {gaps} with gaps, {blocked} blocked."

    return CriteriaValidationResult(rules=results, summary=summary)
