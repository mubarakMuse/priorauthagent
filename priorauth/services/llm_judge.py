from priorauth.llm.chains.evaluation import run_evaluation_chain
from priorauth.models.pipeline import LLMEvalResult, PriorAuthRequest


def evaluate_with_llm(
    source_note: str,
    prior_auth: PriorAuthRequest,
) -> LLMEvalResult:
    """LLM-as-judge groundedness scoring via LangChain."""
    return run_evaluation_chain(source_note, prior_auth)
