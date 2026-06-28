from priorauth.config import get_settings
from priorauth.llm.client import get_client, parse_json_response
from priorauth.llm.prompts import LLM_EVAL_SYSTEM_PROMPT
from priorauth.models.pipeline import LLMEvalResult, PriorAuthRequest


def evaluate_with_llm(
    source_note: str,
    prior_auth: PriorAuthRequest,
) -> LLMEvalResult:
    """LLM-as-judge: score whether the prior-auth request is grounded in the note."""
    settings = get_settings()
    client = get_client()

    user_content = f"""
Source clinical note:
{source_note}

Prior authorization request to evaluate:
- Justification: {prior_auth.clinical_justification}
- Supporting facts: {prior_auth.supporting_facts}
- CPT: {prior_auth.cpt_code}
- ICD-10: {prior_auth.icd10_code}

Score how grounded this request is in the source note.
"""

    response = client.messages.create(
        model=settings.anthropic_model,
        max_tokens=512,
        temperature=0,
        system=LLM_EVAL_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
    )

    raw_text = parse_json_response(response.content[0].text)
    return LLMEvalResult.model_validate_json(raw_text)
