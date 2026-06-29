from priorauth.config import get_settings
from priorauth.models.pipeline import PipelineResponse
from priorauth.pipeline.state import PipelineState
from priorauth.services.criteria_validation import validate_criteria_for_rules
from priorauth.services.evaluation import evaluate_pipeline
from priorauth.services.extraction import extract_clinical_data
from priorauth.services.generation import generate_prior_auth_request
from priorauth.services.policy_retrieval import retrieve_relevant_policy_chunks
from priorauth.services.rules import (
    load_policy_overview,
    load_policy_overview_from_data,
    load_rules,
    load_rules_from_data,
    match_rules,
)


def extract_node(state: PipelineState) -> PipelineState:
    return {"extraction": extract_clinical_data(state["clinical_note"])}


def match_rules_node(state: PipelineState) -> PipelineState:
    rules_data = state.get("rules_data")
    if rules_data is not None:
        rules = load_rules_from_data(rules_data)
        policy = load_policy_overview_from_data(rules_data)
    else:
        rules = load_rules()
        policy = load_policy_overview()

    matched = match_rules(state["extraction"], rules)
    return {"matched_rules": matched, "policy": policy}


def validate_criteria_node(state: PipelineState) -> PipelineState:
    matched = state["matched_rules"]
    policy = state["policy"]
    extraction = state["extraction"]

    criteria_validation = validate_criteria_for_rules(
        matched,
        policy.rules,
        extraction,
        state["clinical_note"],
    )

    should_generate = False
    for rule in matched:
        if not rule.requires_prior_auth:
            continue
        result = next((r for r in criteria_validation.rules if r.rule_id == rule.id), None)
        if result is None or result.readiness != "blocked":
            should_generate = True
            break

    return {
        "criteria_validation": criteria_validation,
        "should_generate": should_generate,
    }


def retrieve_policy_node(state: PipelineState) -> PipelineState:
    matched_ids = [rule.id for rule in state["matched_rules"]]
    policy_chunks = retrieve_relevant_policy_chunks(
        state["policy"],
        state["clinical_note"],
        matched_rule_ids=matched_ids,
    )
    return {"policy_chunks": policy_chunks}


def generate_node(state: PipelineState) -> PipelineState:
    prior_auth = generate_prior_auth_request(
        state["extraction"],
        state["matched_rules"],
        policy_chunks=state.get("policy_chunks"),
        criteria_validation=state.get("criteria_validation"),
        feedback=state.get("feedback"),
    )
    attempts = state.get("attempts", 0) + 1
    return {"prior_auth": prior_auth, "attempts": attempts}


def evaluate_node(state: PipelineState) -> PipelineState:
    evaluation = evaluate_pipeline(
        state["clinical_note"],
        state["extraction"],
        state.get("prior_auth"),
    )
    return {
        "evaluation": evaluation,
        "feedback": evaluation.retry_feedback if evaluation else None,
    }


def finalize_node(state: PipelineState) -> PipelineState:
    matched = state["matched_rules"]
    return {
        "response": PipelineResponse(
            extraction=state["extraction"],
            matched_rules=matched,
            prior_auth_request=state.get("prior_auth"),
            evaluation=state.get("evaluation"),
            generation_attempts=state.get("attempts", 0),
            policy=state.get("policy"),
            criteria_validation=state.get("criteria_validation") if matched else None,
            retrieved_policy_chunks=state.get("policy_chunks", []),
        )
    }


def route_after_validate(state: PipelineState) -> str:
    if state.get("should_generate"):
        return "retrieve"
    return "evaluate_only"


def route_after_evaluate(state: PipelineState) -> str:
    if not state.get("should_generate"):
        return "finalize"

    settings = get_settings()
    evaluation = state.get("evaluation")

    if evaluation is None:
        return "finalize"

    if evaluation.confidence_score >= settings.confidence_threshold:
        return "finalize"

    if not evaluation.retry_feedback:
        return "finalize"

    attempts = state.get("attempts", 0)
    if attempts > settings.max_generation_retries:
        return "finalize"

    return "retry"
