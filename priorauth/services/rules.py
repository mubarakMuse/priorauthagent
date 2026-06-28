import json
from pathlib import Path

from priorauth.config import get_settings
from priorauth.models.clinical import ClinicalExtraction
from priorauth.models.rules import PayerRule


def load_rules(path: Path | None = None) -> list[PayerRule]:
    rules_path = path or get_settings().rules_path
    data = json.loads(rules_path.read_text())

    if isinstance(data, list):
        raw_rules = data
        default_payer = "Unknown"
    else:
        raw_rules = data["rules"]
        default_payer = data.get("payer", "Unknown")

    payer_rules: list[PayerRule] = []
    for rule in raw_rules:
        required_icd = None
        for criterion in rule.get("criteria", []):
            if criterion.get("type") == "diagnosis" and criterion.get("allowed_icd10"):
                required_icd = criterion["allowed_icd10"][0]
                break

        payer_rules.append(
            PayerRule(
                id=rule["rule_id"],
                payer=default_payer,
                description=rule.get("procedure_description", ""),
                procedure_cpt=rule["procedure_code"],
                required_diagnosis_icd10=required_icd,
                requires_prior_auth=rule["requires_prior_auth"],
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

        if (
            rule.required_diagnosis_icd10 is not None
            and rule.required_diagnosis_icd10 not in diagnosis_codes
        ):
            continue

        matched.append(rule)

    return matched
