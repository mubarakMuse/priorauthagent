from priorauth.config import get_settings
from priorauth.models.pipeline import PipelineResponse, PriorAuthRequest
from priorauth.services.criteria_validation import validate_criteria_for_rules
from priorauth.services.evaluation import evaluate_pipeline
from priorauth.services.extraction import extract_clinical_data
from priorauth.services.generation import generate_prior_auth_request
from priorauth.services.policy_retrieval import retrieve_relevant_policy_chunks
from priorauth.services.rules import load_policy_overview, load_policy_overview_from_data, load_rules, load_rules_from_data, match_rules


def run_pipeline(
    clinical_note: str,
    rules_data: dict | list | None = None,
) -> PipelineResponse:
    """Orchestrate extract → match rules → generate → evaluate, with retry on low confidence."""
    settings = get_settings()

    extraction = extract_clinical_data(clinical_note)

    if rules_data is not None:
        rules = load_rules_from_data(rules_data)
        policy = load_policy_overview_from_data(rules_data)
    else:
        rules = load_rules()
        policy = load_policy_overview()

    matched = match_rules(extraction, rules)
    matched_ids = [rule.id for rule in matched]

    criteria_validation = validate_criteria_for_rules(
        matched,
        policy.rules,
        extraction,
        clinical_note,
    )

    policy_chunks = retrieve_relevant_policy_chunks(
        policy,
        clinical_note,
        matched_rule_ids=matched_ids,
    )

    prior_auth: PriorAuthRequest | None = None
    evaluation = None
    feedback: str | None = None
    attempts = 0

    should_generate = False
    for rule in matched:
        if not rule.requires_prior_auth:
            continue
        result = next((r for r in criteria_validation.rules if r.rule_id == rule.id), None)
        if result is None or result.readiness != "blocked":
            should_generate = True
            break

    if should_generate:
        for attempt in range(settings.max_generation_retries + 1):
            attempts = attempt + 1
            prior_auth = generate_prior_auth_request(
                extraction,
                matched,
                policy_chunks=policy_chunks,
                criteria_validation=criteria_validation,
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
        policy=policy,
        criteria_validation=criteria_validation if matched else None,
        retrieved_policy_chunks=policy_chunks,
    )
