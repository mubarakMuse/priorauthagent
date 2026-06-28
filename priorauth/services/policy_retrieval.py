"""
Policy retrieval (RAG-lite).

Production RAG would embed payer policy PDFs / medical policies in a vector store,
retrieve top-k chunks for the case (CPT, diagnosis, procedure description), and
inject them into extraction, criteria validation, and PA generation prompts.

This module demonstrates the retrieval step with keyword scoring over rule criteria —
no vector DB required for the demo.
"""

from priorauth.models.policy import PolicyOverview, PolicyRuleDetail


def _score_rule_for_query(rule: PolicyRuleDetail, query_terms: set[str]) -> float:
    if not query_terms:
        return 0.0

    haystack = " ".join(
        [
            rule.id,
            rule.procedure_cpt,
            rule.description,
            rule.category,
            " ".join(c.description for c in rule.criteria),
            " ".join(code for c in rule.criteria for code in c.allowed_icd10),
        ]
    ).lower()

    hits = sum(1 for term in query_terms if term in haystack)
    return hits / len(query_terms)


def retrieve_relevant_policy_chunks(
    policy: PolicyOverview,
    clinical_note: str,
    matched_rule_ids: list[str] | None = None,
    top_k: int = 3,
) -> list[dict]:
    """
    Return the most relevant policy rule chunks for the case.

    In production this would be replaced by vector similarity search over
    chunked payer policy documents (RAG retrieval step).
    """
    query_terms = {
        word
        for word in clinical_note.lower().replace(",", " ").replace(".", " ").split()
        if len(word) > 3
    }

    scored: list[tuple[float, PolicyRuleDetail]] = []
    for rule in policy.rules:
        if matched_rule_ids and rule.id not in matched_rule_ids:
            continue
        score = _score_rule_for_query(rule, query_terms)
        if matched_rule_ids and rule.id in matched_rule_ids:
            score += 1.0
        scored.append((score, rule))

    scored.sort(key=lambda item: item[0], reverse=True)
    selected = scored[:top_k] if scored else []

    chunks: list[dict] = []
    for score, rule in selected:
        chunks.append(
            {
                "rule_id": rule.id,
                "procedure_cpt": rule.procedure_cpt,
                "description": rule.description,
                "category": rule.category,
                "requires_prior_auth": rule.requires_prior_auth,
                "criteria": [c.model_dump() for c in rule.criteria],
                "retrieval_score": round(score, 2),
                "source": "rules.json (demo stand-in for RAG policy chunks)",
            }
        )

    return chunks
