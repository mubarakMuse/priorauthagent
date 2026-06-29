from langchain_core.prompts import ChatPromptTemplate

from priorauth.llm.model import get_chat_model
from priorauth.llm.prompts import LLM_EVAL_SYSTEM_PROMPT
from priorauth.models.pipeline import LLMEvalResult, PriorAuthRequest

_EVALUATION_PROMPT = ChatPromptTemplate.from_messages(
    [
        ("system", "{system_prompt}"),
        (
            "human",
            """Source clinical note:
{source_note}

Prior authorization request to evaluate:
- Justification: {justification}
- Supporting facts: {supporting_facts}
- CPT: {cpt_code}
- ICD-10: {icd10_code}

Score how grounded this request is in the source note.""",
        ),
    ]
)


def run_evaluation_chain(
    source_note: str,
    prior_auth: PriorAuthRequest,
) -> LLMEvalResult:
    llm = get_chat_model().with_structured_output(LLMEvalResult)
    chain = _EVALUATION_PROMPT | llm
    return chain.invoke(
        {
            "system_prompt": LLM_EVAL_SYSTEM_PROMPT,
            "source_note": source_note,
            "justification": prior_auth.clinical_justification,
            "supporting_facts": prior_auth.supporting_facts,
            "cpt_code": prior_auth.cpt_code,
            "icd10_code": prior_auth.icd10_code,
        }
    )
