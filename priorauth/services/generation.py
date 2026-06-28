import json

from priorauth.config import get_settings
from priorauth.llm.client import get_client, parse_json_response
from priorauth.llm.prompts import GENERATION_SYSTEM_PROMPT
from priorauth.models.clinical import ClinicalExtraction
from priorauth.models.pipeline import PriorAuthRequest
from priorauth.models.rules import PayerRule


def generate_prior_auth_request(
    extraction: ClinicalExtraction,
    matched_rules: list[PayerRule],
    feedback: str | None = None,
) -> PriorAuthRequest:
    """Draft a prior-auth request from extraction and matched payer rules."""
    if not matched_rules:
        raise ValueError("No matched rules — cannot generate prior auth request")

    settings = get_settings()
    client = get_client()

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
        model=settings.anthropic_model,
        max_tokens=1024,
        temperature=0,
        system=GENERATION_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
    )

    raw_text = parse_json_response(response.content[0].text)
    return PriorAuthRequest.model_validate_json(raw_text)
