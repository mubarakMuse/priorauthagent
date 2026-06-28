import json
from pathlib import Path

from priorauth.config import get_settings
from priorauth.models.clinical import ClinicalExtraction
from priorauth.models.policy import PolicyOverview, PolicyRuleDetail, RuleCriterion
from priorauth.models.rules import PayerRule

DEMO_MATCHING_NOTE = (
    "Rule matching uses CPT + diagnosis codes from the extraction. After a rule matches, "
    "each policy criterion is validated against structured clinical evidence (conservative therapy, "
    "imaging, exam findings, etc.). Some checks (visit limits, injection frequency) require "
    "claims/EHR data marked as needs_external_data."
)


def _parse_rules_content(data: dict | list) -> tuple[dict, list[dict]]:
    if isinstance(data, list):
        return (
            {"payer": "Unknown", "plan_type": "", "ruleset_version": "", "last_updated": ""},
            data,
        )

    if "rules" not in data or not isinstance(data["rules"], list):
        raise ValueError("Rules JSON must include a 'rules' array")

    return data, data["rules"]


def _load_rules_file(path: Path) -> tuple[dict, list[dict]]:
    data = json.loads(path.read_text())
    return _parse_rules_content(data)


def load_policy_overview_from_data(data: dict | list) -> PolicyOverview:
    metadata, raw_rules = _parse_rules_content(data)

    rules: list[PolicyRuleDetail] = []
    for rule in raw_rules:
        criteria = [
            RuleCriterion(
                id=c["id"],
                type=c["type"],
                description=c["description"],
                required=c.get("required", True),
                allowed_icd10=c.get("allowed_icd10", []),
            )
            for c in rule.get("criteria", [])
        ]

        rules.append(
            PolicyRuleDetail(
                id=rule["rule_id"],
                procedure_cpt=rule["procedure_code"],
                description=rule.get("procedure_description", ""),
                category=rule.get("category", "General"),
                requires_prior_auth=rule["requires_prior_auth"],
                criteria=criteria,
                typical_turnaround_days=rule.get("typical_turnaround_days"),
                auto_approve_if_all_met=rule.get("auto_approve_if_all_met"),
                requires_medical_director_review=rule.get("requires_medical_director_review"),
            )
        )

    return PolicyOverview(
        payer=metadata.get("payer", "Unknown"),
        plan_type=metadata.get("plan_type", ""),
        ruleset_version=metadata.get("ruleset_version", ""),
        last_updated=metadata.get("last_updated", ""),
        rules=rules,
        demo_matching_note=DEMO_MATCHING_NOTE,
    )


def load_policy_overview(path: Path | None = None) -> PolicyOverview:
    rules_path = path or get_settings().rules_path
    data = json.loads(rules_path.read_text())
    return load_policy_overview_from_data(data)


def load_rules(path: Path | None = None) -> list[PayerRule]:
    rules_path = path or get_settings().rules_path
    data = json.loads(rules_path.read_text())
    return load_rules_from_data(data)


def load_rules_from_data(data: dict | list) -> list[PayerRule]:
    _, raw_rules = _parse_rules_content(data)
    policy = load_policy_overview_from_data(data)

    payer_rules: list[PayerRule] = []
    for rule in raw_rules:
        allowed_icd: list[str] = []
        for criterion in rule.get("criteria", []):
            if criterion.get("type") == "diagnosis" and criterion.get("allowed_icd10"):
                allowed_icd = criterion["allowed_icd10"]
                break

        payer_rules.append(
            PayerRule(
                id=rule["rule_id"],
                payer=policy.payer,
                description=rule.get("procedure_description", ""),
                procedure_cpt=rule["procedure_code"],
                required_diagnosis_icd10=allowed_icd[0] if allowed_icd else None,
                allowed_icd10_codes=allowed_icd,
                requires_prior_auth=rule["requires_prior_auth"],
                criteria=rule.get("criteria", []),
            )
        )

    return payer_rules


def match_rules(
    extraction: ClinicalExtraction,
    rules: list[PayerRule],
) -> list[PayerRule]:
    """Return payer rules that apply to the extracted clinical data."""
    procedure_codes = {p.cpt_code for p in extraction.procedures if p.cpt_code}
    diagnosis_codes = {d.icd10_code for d in extraction.diagnoses if d.icd10_code}

    matched: list[PayerRule] = []
    for rule in rules:
        if rule.procedure_cpt not in procedure_codes:
            continue

        if rule.allowed_icd10_codes:
            if not diagnosis_codes.intersection(set(rule.allowed_icd10_codes)):
                continue
        elif (
            rule.required_diagnosis_icd10 is not None
            and rule.required_diagnosis_icd10 not in diagnosis_codes
        ):
            continue

        matched.append(rule)

    return matched
