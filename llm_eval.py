from anthropic import Anthropic

from models import LLMEvalResult, PriorAuthRequest

LLM_EVAL_SYSTEM_PROMPT = """
You are a clinical AI evaluator. Judge whether a prior authorization request
is grounded in the source clinical note.

Return ONLY valid JSON:
{
  "groundedness_score": 0.0 to 1.0,
  "ungrounded_claims": ["list of claims NOT supported by the source note"],
  "reasoning": "1-2 sentence explanation"
}

Rules:
- groundedness_score: 1.0 = every claim is in the source note, 0.0 = fully invented
- Flag any diagnosis, procedure, medication, or history not in the source
- Be strict — clinical hallucinations are dangerous
- Return raw JSON only. No markdown.
"""


def _strip_markdown_json(raw_text: str) -> str:
    if raw_text.startswith("```"):
        raw_text = raw_text.split("```")[1]
        if raw_text.startswith("json"):
            raw_text = raw_text[4:]
        raw_text = raw_text.strip()
    return raw_text


def evaluate_with_llm(
    source_note: str,
    prior_auth: PriorAuthRequest,
) -> LLMEvalResult:
    """LLM-as-judge: score whether prior auth is grounded in source note."""
    client = Anthropic()

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
        model="claude-sonnet-4-6",
        max_tokens=512,
        temperature=0,
        system=LLM_EVAL_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
    )

    raw_text = _strip_markdown_json(response.content[0].text.strip())
    return LLMEvalResult.model_validate_json(raw_text)