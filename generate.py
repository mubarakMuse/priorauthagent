import json

from anthropic import Anthropic

from models import ClinicalExtraction, PayerRule, PriorAuthRequest

GENERATION_SYSTEM_PROMPT = """
You are a prior authorization specialist.

Given extracted clinical data and matched payer rules, draft a prior authorization request.

Return ONLY valid JSON matching this schema:
{
  "payer": "string",
  "procedure_description": "string",
  "cpt_code": "string",
  "diagnosis_description": "string",
  "icd10_code": "string",
  "clinical_justification": "string",
  "supporting_facts": ["string"]
}

Rules:
- Use ONLY information from the provided extraction and matched rules
- Do not invent patient details, codes, or clinical history
- clinical_justification: 2-4 sentences explaining medical necessity
- supporting_facts: short bullet facts pulled directly from the source note
- payer: use the payer from the matched rules
- Return raw JSON only. No markdown, no explanation.
"""


def _strip_markdown_json(raw_text: str) -> str:
    if raw_text.startswith("```"):
        raw_text = raw_text.split("```")[1]
        if raw_text.startswith("json"):
            raw_text = raw_text[4:]
        raw_text = raw_text.strip()
    return raw_text


def generate_prior_auth_request(
    extraction: ClinicalExtraction,
    matched_rules: list[PayerRule],
    feedback: str | None = None,
) -> PriorAuthRequest:
    """Draft a prior-auth request from extraction + matched rules."""
    if not matched_rules:
        raise ValueError("No matched rules — cannot generate prior auth request")

    client = Anthropic()

    feedback_block = ""
    if feedback:
        feedback_block = f"""
IMPORTANT — previous attempt failed quality check:
{feedback}

Fix these issues. Use ONLY information from the extraction and source note.
"""

    user_content = f"""
Extracted clinical data:
{extraction.model_dump_json(indent=2)}

Matched payer rules:
{json.dumps([rule.model_dump() for rule in matched_rules], indent=2)}
{feedback_block}
Draft the prior authorization request.
"""

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        temperature=0,
        system=GENERATION_SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": user_content,
            }
        ],
    )

    raw_text = _strip_markdown_json(response.content[0].text.strip())
    return PriorAuthRequest.model_validate_json(raw_text)

    