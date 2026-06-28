from priorauth.models.policy import PolicyOverview
from priorauth.services.policy_retrieval import retrieve_relevant_policy_chunks


def test_retrieve_policy_chunks_for_spine_note():
    policy = PolicyOverview.model_validate(
        {
            "payer": "Test",
            "plan_type": "PPO",
            "ruleset_version": "1",
            "last_updated": "2026-01-01",
            "demo_matching_note": "test",
            "rules": [
                {
                    "id": "PA-SPINE-001",
                    "procedure_cpt": "62323",
                    "description": "Epidural injection",
                    "category": "Spine",
                    "requires_prior_auth": True,
                    "criteria": [],
                }
            ],
        }
    )

    note = "Patient with radicular pain, plan lumbar epidural steroid injection CPT 62323"
    chunks = retrieve_relevant_policy_chunks(
        policy, note, matched_rule_ids=["PA-SPINE-001"], top_k=1
    )

    assert len(chunks) == 1
    assert chunks[0]["rule_id"] == "PA-SPINE-001"
