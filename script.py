import json
import os

from generate import generate_prior_auth_request
from models import ClinicalExtraction
from anthropic import Anthropic
from rules import load_rules, match_rules

# 1. Hardcoded clinical note (replace or edit this)
CLINICAL_NOTE = """
Patient: 58yo male
Chief complaint: Progressive knee pain, 6 months

Assessment:
- Primary osteoarthritis of right knee (M17.11)
- Failed conservative management (NSAIDs, PT x 8 weeks)

Plan:
- Refer for total knee arthroplasty, right knee (CPT 27447)
- Continue meloxicam 15mg daily until surgery
"""

# 2. System prompt = the "contract" (what shape the output must have)
SYSTEM_PROMPT = """
You are a clinical data extraction assistant.

Extract structured information from the clinical note.

Return ONLY valid JSON matching this schema:
{
  "diagnoses": [
    {"description": "string", "icd10_code": "string or null"}
  ],
  "procedures": [
    {"description": "string", "cpt_code": "string or null"}
  ],
  "medications": [
    {"name": "string", "dosage": "string or null"}
  ],
  "patient_summary": "string"
}

Rules:
- Only extract information explicitly stated in the note
- Use null for codes you cannot infer from the text
- Do not invent diagnoses, procedures, or codes
- patient_summary: 1-2 factual sentences only
- Return raw JSON only. No markdown, no explanation.
"""


def extract_clinical_data(note: str) -> ClinicalExtraction:
    """Call Claude once and return parsed JSON."""
    client = Anthropic()  # reads ANTHROPIC_API_KEY from environment

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        temperature=0,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": f"Extract structured clinical data from this note:\n\n{note}",
            }
        ],
    )

    # Claude's reply is in response.content[0].text
    raw_text = response.content[0].text.strip()

    # Sometimes models wrap JSON in ```json ... ``` — strip that if present
    if raw_text.startswith("```"):
        raw_text = raw_text.split("```")[1]
        if raw_text.startswith("json"):
            raw_text = raw_text[4:]
        raw_text = raw_text.strip()

    return ClinicalExtraction.model_validate_json(raw_text)


if __name__ == "__main__":
    extraction = extract_clinical_data(CLINICAL_NOTE)
    rules = load_rules()
    matched = match_rules(extraction, rules)

    print("=== EXTRACTION ===")
    print(extraction.model_dump_json(indent=2))

    print("\n=== MATCHED RULES ===")
    for rule in matched:
        print(f"- [{rule.id}] {rule.description} (prior auth: {rule.requires_prior_auth})")

    if matched:
        prior_auth = generate_prior_auth_request(extraction, matched)

        print("\n=== PRIOR AUTH REQUEST ===")
        print(prior_auth.model_dump_json(indent=2))
    else:
        print("\nNo prior auth needed — no rules matched.")