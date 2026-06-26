import json
from pathlib import Path

from models import ClinicalExtraction, PayerRule


def load_rules(path: str = "rules.json") -> list[PayerRule]:
    data = json.loads(Path(path).read_text())

    # Handle both formats
    if isinstance(data, list):
        raw_rules = data
        default_payer = "Unknown"
    else:
        raw_rules = data["rules"]
        default_payer = data.get("payer", "Unknown")

    payer_rules = []
    for rule in raw_rules:
        # Pull first diagnosis criterion's ICD if present n
        required_icd = None
        for c in rule.get("criteria", []):
            if c.get("type") == "diagnosis" and c.get("allowed_icd10"):
                required_icd = c["allowed_icd10"][0]  # match any one for now
                break

        payer_rules.append(PayerRule(
            id=rule["rule_id"],
            payer=default_payer,
            description=rule.get("procedure_description", ""),
            procedure_cpt=rule["procedure_code"],
            required_diagnosis_icd10=required_icd,
            requires_prior_auth=rule["requires_prior_auth"],
        ))

    return payer_rules

def match_rules(extraction: ClinicalExtraction, rules: list[PayerRule]) -> list[PayerRule]:
    """Return rules that apply to the extracted clinical data."""
    matched: list[PayerRule] = []

    # Collect codes from extraction (ignore None)
    procedure_codes = {p.cpt_code for p in extraction.procedures if p.cpt_code}
    diagnosis_codes = {d.icd10_code for d in extraction.diagnoses if d.icd10_code}

    for rule in rules:
        # Rule only applies if the procedure code is in the extraction
        if rule.procedure_cpt not in procedure_codes:
            continue

        # If rule requires a specific diagnosis, check it's present
        if rule.required_diagnosis_icd10 is not None:
            if rule.required_diagnosis_icd10 not in diagnosis_codes:
                continue

        matched.append(rule)

    return matched