from functools import lru_cache

from langgraph.graph import END, StateGraph

from priorauth.pipeline.nodes import (
    evaluate_node,
    extract_node,
    finalize_node,
    generate_node,
    match_rules_node,
    retrieve_policy_node,
    route_after_evaluate,
    route_after_validate,
    validate_criteria_node,
)
from priorauth.pipeline.state import PipelineState


def build_pipeline_graph():
    graph = StateGraph(PipelineState)

    graph.add_node("extract", extract_node)
    graph.add_node("match_rules", match_rules_node)
    graph.add_node("validate_criteria", validate_criteria_node)
    graph.add_node("retrieve_policy", retrieve_policy_node)
    graph.add_node("generate", generate_node)
    graph.add_node("evaluate", evaluate_node)
    graph.add_node("finalize", finalize_node)

    graph.set_entry_point("extract")
    graph.add_edge("extract", "match_rules")
    graph.add_edge("match_rules", "validate_criteria")
    graph.add_conditional_edges(
        "validate_criteria",
        route_after_validate,
        {
            "retrieve": "retrieve_policy",
            "evaluate_only": "evaluate",
        },
    )
    graph.add_edge("retrieve_policy", "generate")
    graph.add_edge("generate", "evaluate")
    graph.add_conditional_edges(
        "evaluate",
        route_after_evaluate,
        {
            "retry": "generate",
            "finalize": "finalize",
        },
    )
    graph.add_edge("finalize", END)

    return graph.compile()


@lru_cache
def get_pipeline_graph():
    return build_pipeline_graph()
