#!/usr/bin/env python3
"""CLI for running the pipeline locally without the HTTP server."""

from priorauth.services.extraction import extract_clinical_data
from priorauth.services.generation import generate_prior_auth_request
from priorauth.services.rules import load_rules, match_rules

SAMPLE_NOTE = """
Patient: 58yo male
Chief complaint: Progressive knee pain, 6 months

Assessment:
- Primary osteoarthritis of right knee (M17.11)
- Failed conservative management (NSAIDs, PT x 8 weeks)

Plan:
- Refer for total knee arthroplasty, right knee (CPT 27447)
- Continue meloxicam 15mg daily until surgery
"""


def main() -> None:
    extraction = extract_clinical_data(SAMPLE_NOTE)
    matched = match_rules(extraction, load_rules())

    print("=== EXTRACTION ===")
    print(extraction.model_dump_json(indent=2))

    print("\n=== MATCHED RULES ===")
    for rule in matched:
        print(f"- [{rule.id}] {rule.description} (prior auth: {rule.requires_prior_auth})")

    if not matched:
        print("\nNo prior auth needed — no rules matched.")
        return

    prior_auth = generate_prior_auth_request(extraction, matched)

    print("\n=== PRIOR AUTH REQUEST ===")
    print(prior_auth.model_dump_json(indent=2))


if __name__ == "__main__":
    main()
