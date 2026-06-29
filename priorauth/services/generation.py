from priorauth.llm.chains.generation import run_generation_chain
from priorauth.models.clinical import ClinicalExtraction
from priorauth.models.criteria import CriteriaValidationResult
from priorauth.models.pipeline import PriorAuthRequest
from priorauth.models.rules import PayerRule


def generate_prior_auth_request(
    extraction: ClinicalExtraction,
    matched_rules: list[PayerRule],
    policy_chunks: list[dict] | None = None,
    criteria_validation: CriteriaValidationResult | None = None,
    feedback: str | None = None,
) -> PriorAuthRequest:
    """Draft a prior-auth request from extraction and matched payer rules via LangChain."""
    return run_generation_chain(
        extraction,
        matched_rules,
        policy_chunks=policy_chunks,
        criteria_validation=criteria_validation,
        feedback=feedback,
    )
