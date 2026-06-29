from priorauth.models.pipeline import PipelineResponse
from priorauth.pipeline.graph import get_pipeline_graph


def run_pipeline(
    clinical_note: str,
    rules_data: dict | list | None = None,
) -> PipelineResponse:
    """Run the prior-auth pipeline via LangGraph (extract → match → validate → generate → evaluate)."""
    graph = get_pipeline_graph()
    final_state = graph.invoke(
        {
            "clinical_note": clinical_note,
            "rules_data": rules_data,
            "matched_rules": [],
            "policy_chunks": [],
            "attempts": 0,
            "feedback": None,
        }
    )

    response = final_state.get("response")
    if response is None:
        raise RuntimeError("Pipeline graph finished without a response")

    return response
