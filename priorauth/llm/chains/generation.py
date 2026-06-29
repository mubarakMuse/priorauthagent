import json

from langchain_core.prompts import ChatPromptTemplate

from priorauth.llm.model import get_chat_model
from priorauth.llm.prompts import GENERATION_SYSTEM_PROMPT
from priorauth.models.clinical import ClinicalExtraction
from priorauth.models.criteria import CriteriaValidationResult
from priorauth.models.pipeline import PriorAuthRequest
from priorauth.models.rules import PayerRule


def _build_generation_context(
    extraction: ClinicalExtraction,
    matched_rules: list[PayerRule],
    policy_chunks: list[dict] | None,
    criteria_validation: CriteriaValidationResult | None,
    feedback: str | None,
) -> dict[str, str]:
    feedback_block = ""
    if feedback:
        feedback_block = f"""
IMPORTANT — previous attempt failed quality check:
{feedback}

Fix these issues. Use ONLY information from the extraction and source note.
"""

    rag_block = ""
    if policy_chunks:
        rag_block = f"""
Retrieved payer policy context (RAG — relevant policy chunks for this case):
{json.dumps(policy_chunks, indent=2)}
"""

    criteria_block = ""
    if criteria_validation and criteria_validation.rules:
        criteria_block = f"""
Criteria validation results — address documented gaps; do not claim unmet criteria as met:
{json.dumps([r.model_dump() for r in criteria_validation.rules], indent=2)}
"""

    return {
        "extraction_json": extraction.model_dump_json(indent=2),
        "matched_rules_json": json.dumps([rule.model_dump() for rule in matched_rules], indent=2),
        "rag_block": rag_block,
        "criteria_block": criteria_block,
        "feedback_block": feedback_block,
    }


_GENERATION_PROMPT = ChatPromptTemplate.from_messages(
    [
        ("system", "{system_prompt}"),
        (
            "human",
            """Extracted clinical data:
{extraction_json}

Matched payer rules:
{matched_rules_json}
{rag_block}{criteria_block}{feedback_block}
Draft the prior authorization request.""",
        ),
    ]
)


def run_generation_chain(
    extraction: ClinicalExtraction,
    matched_rules: list[PayerRule],
    policy_chunks: list[dict] | None = None,
    criteria_validation: CriteriaValidationResult | None = None,
    feedback: str | None = None,
) -> PriorAuthRequest:
    if not matched_rules:
        raise ValueError("No matched rules — cannot generate prior auth request")

    llm = get_chat_model().with_structured_output(PriorAuthRequest)
    chain = _GENERATION_PROMPT | llm
    context = _build_generation_context(
        extraction,
        matched_rules,
        policy_chunks,
        criteria_validation,
        feedback,
    )
    context["system_prompt"] = GENERATION_SYSTEM_PROMPT
    return chain.invoke(context)
