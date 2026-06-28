import json
from pathlib import Path

import pytest

from priorauth.models.clinical import ClinicalExtraction, ImagingStudy
from priorauth.services.rules import (
    load_policy_overview,
    load_policy_overview_from_data,
    load_rules,
    load_rules_from_data,
    match_rules,
)

RULES_PATH = Path(__file__).resolve().parents[1] / "priorauth" / "data" / "rules.json"


def test_load_rules_returns_four_rules():
    rules = load_rules(RULES_PATH)
    assert len(rules) == 4
    assert rules[0].id == "PA-SPINE-001"


def test_load_policy_overview_metadata():
    policy = load_policy_overview(RULES_PATH)
    assert policy.payer == "Meridian Health Plan"
    assert len(policy.rules) == 4


def test_load_rules_from_data(rules_data):
    rules = load_rules_from_data(rules_data)
    assert len(rules) == 4


def test_match_rules_spine_injection(sample_extraction_dict, rules_data):
    extraction = ClinicalExtraction.model_validate(sample_extraction_dict)
    rules = load_rules_from_data(rules_data)
    matched = match_rules(extraction, rules)

    assert len(matched) == 1
    assert matched[0].id == "PA-SPINE-001"
    assert matched[0].procedure_cpt == "62323"


def test_match_rules_no_procedure_match(sample_extraction_dict, rules_data):
    extraction = ClinicalExtraction.model_validate(sample_extraction_dict)
    extraction.procedures[0].cpt_code = "27447"
    rules = load_rules_from_data(rules_data)
    matched = match_rules(extraction, rules)
    assert matched == []


def test_match_rules_icd10_required(sample_extraction_dict, rules_data):
    extraction = ClinicalExtraction.model_validate(sample_extraction_dict)
    extraction.diagnoses[0].icd10_code = "M17.11"
    rules = load_rules_from_data(rules_data)
    matched = match_rules(extraction, rules)
    assert matched == []


def test_invalid_rules_json_raises():
    with pytest.raises(ValueError, match="rules"):
        load_policy_overview_from_data({"payer": "Test"})


def test_parse_rules_list_format():
    raw = json.loads(RULES_PATH.read_text())["rules"]
    policy = load_policy_overview_from_data(raw)
    assert policy.payer == "Unknown"
    assert len(policy.rules) == 4
