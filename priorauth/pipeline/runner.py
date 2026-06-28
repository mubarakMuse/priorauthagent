from priorauth.config import get_settings
from priorauth.models.pipeline import PipelineResponse, PriorAuthRequest
from priorauth.services.evaluation import evaluate_pipeline
from priorauth.services.extraction import extract_clinical_data
from priorauth.services.generation import generate_prior_auth_request
from priorauth.services.rules import load_rules, match_rules


def run_pipeline(clinical_note: str) -> PipelineResponse:
    """Orchestrate extract → match rules → generate → evaluate, with retry on low confidence."""
    settings = get_settings()

    extraction = extract_clinical_data(clinical_note)
    matched = match_rules(extraction, load_rules())

    prior_auth: PriorAuthRequest | None = None
    evaluation = None
    feedback: str | None = None
    attempts = 0

    if matched:
        for attempt in range(settings.max_generation_retries + 1):
            attempts = attempt + 1
            prior_auth = generate_prior_auth_request(
                extraction,
                matched,
                feedback=feedback,
            )
            evaluation = evaluate_pipeline(clinical_note, extraction, prior_auth)

            if evaluation.confidence_score >= settings.confidence_threshold:
                break

            feedback = evaluation.retry_feedback
            if not feedback:
                break
    else:
        evaluation = evaluate_pipeline(clinical_note, extraction, None)

    return PipelineResponse(
        extraction=extraction,
        matched_rules=matched,
        prior_auth_request=prior_auth,
        evaluation=evaluation,
        generation_attempts=attempts,
    )
