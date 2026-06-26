from models import ClinicalExtraction, FactEval, PipelineEval, PriorAuthRequest
from llm_eval import evaluate_with_llm
from models import LLMEvalResult

def _normalize(text: str) -> str:
    return text.lower().strip()


def _code_in_source(code: str, source_note: str) -> bool:
    """Check if a clinical code appears in the original note."""
    return code.lower() in _normalize(source_note)


def _fact_grounded_in_source(fact: str, source_note: str) -> tuple[bool, str]:
    """
    Simple grounding check: do enough keywords from the fact appear in the note?
  """
    fact_words = [
        w for w in _normalize(fact).replace("(", " ").replace(")", " ").split()
        if len(w) > 3 and w not in {"with", "the", "and", "for", "from", "patient"}
    ]

    if not fact_words:
        return False, "Fact too short to verify"

    source = _normalize(source_note)
    matches = sum(1 for w in fact_words if w in source)
    ratio = matches / len(fact_words)

    if ratio >= 0.5:
        return True, f"{matches}/{len(fact_words)} key terms found in source"
    return False, f"Only {matches}/{len(fact_words)} key terms found in source"


def evaluate_pipeline(
    source_note: str,
    extraction: ClinicalExtraction,
    prior_auth: PriorAuthRequest | None,
) -> PipelineEval:
    """Score how well pipeline outputs are grounded in the source note."""
    source = _normalize(source_note)

    # --- 1. Check extraction codes against source ---
    codes_found: list[str] = []
    codes_missing: list[str] = []

    for d in extraction.diagnoses:
        if d.icd10_code:
            if _code_in_source(d.icd10_code, source_note):
                codes_found.append(d.icd10_code)
            else:
                codes_missing.append(d.icd10_code)

    for p in extraction.procedures:
        if p.cpt_code:
            if _code_in_source(p.cpt_code, source_note):
                codes_found.append(p.cpt_code)
            else:
                codes_missing.append(p.cpt_code)

    extraction_grounded = len(codes_missing) == 0

    # --- 2. Check supporting facts (if prior auth was generated) ---
    fact_evals: list[FactEval] = []
    if prior_auth:
        for fact in prior_auth.supporting_facts:
            grounded, reason = _fact_grounded_in_source(fact, source_note)
            fact_evals.append(FactEval(fact=fact, grounded=grounded, reason=reason))

    grounded_facts = sum(1 for f in fact_evals if f.grounded)
    total_facts = len(fact_evals)

    # --- 3. Check prior auth codes match extraction ---
    prior_auth_consistent = True
    if prior_auth:
        extraction_icds = {d.icd10_code for d in extraction.diagnoses if d.icd10_code}
        extraction_cpts = {p.cpt_code for p in extraction.procedures if p.cpt_code}

        if prior_auth.icd10_code and prior_auth.icd10_code not in extraction_icds:
            prior_auth_consistent = False
        if prior_auth.cpt_code and prior_auth.cpt_code not in extraction_cpts:
            prior_auth_consistent = False

    # --- 4. Compute confidence score ---
    scores: list[float] = []

    if extraction.diagnoses or extraction.procedures:
        total_codes = len(codes_found) + len(codes_missing)
        scores.append(len(codes_found) / total_codes if total_codes else 1.0)
    else:
        scores.append(0.5)

    if total_facts > 0:
        scores.append(grounded_facts / total_facts)
    elif prior_auth is None:
        scores.append(1.0)  # no prior auth needed — nothing to verify

    scores.append(1.0 if prior_auth_consistent else 0.0)

    confidence = round(sum(scores) / len(scores), 2)

    # --- 5. Human-readable summary ---
    if confidence >= 0.8:
        summary = "High confidence — outputs appear well grounded in source note."
    elif confidence >= 0.5:
        summary = "Moderate confidence — some claims may not be fully supported."
    else:
        summary = "Low confidence — review outputs before submission."

    if codes_missing:
        summary += f" Missing codes in source: {', '.join(codes_missing)}."

    code_confidence = round(sum(scores) / len(scores), 2)

    # --- 6. LLM judge (only if prior auth was generated) ---
    llm_eval: LLMEvalResult | None = None
    if prior_auth:
        llm_eval = evaluate_with_llm(source_note, prior_auth)

    # --- 7. Blend code + LLM scores ---
    if llm_eval:
        confidence = round((code_confidence * 0.4) + (llm_eval.groundedness_score * 0.6), 2)
    else:
        confidence = code_confidence

    # --- 8. Build retry feedback for the loop ---
    retry_feedback: str | None = None
    if confidence < 0.8 and prior_auth:
        parts = []
        if codes_missing:
            parts.append(f"Remove or fix codes not in source: {', '.join(codes_missing)}")
        ungrounded = [f.fact for f in fact_evals if not f.grounded]
        if ungrounded:
            parts.append(f"These facts are not grounded: {'; '.join(ungrounded)}")
        if llm_eval and llm_eval.ungrounded_claims:
            parts.append(f"LLM flagged: {'; '.join(llm_eval.ungrounded_claims)}")
        retry_feedback = " | ".join(parts) if parts else "Improve grounding in source note only."

    # --- 9. Summary ---
    if confidence >= 0.8:
        summary = "High confidence — code + LLM eval agree outputs are grounded."
    elif confidence >= 0.5:
        summary = "Moderate confidence — review before submission."
    else:
        summary = "Low confidence — outputs may contain unsupported claims."

    if llm_eval and llm_eval.ungrounded_claims:
        summary += f" Ungrounded: {', '.join(llm_eval.ungrounded_claims[:3])}."

    return PipelineEval(
        extraction_grounded=extraction_grounded,
        codes_found_in_source=codes_found,
        codes_missing_from_source=codes_missing,
        fact_evals=fact_evals,
        prior_auth_consistent=prior_auth_consistent,
        code_confidence_score=code_confidence,
        llm_eval=llm_eval,
        confidence_score=confidence,
        summary=summary,
        retry_feedback=retry_feedback,
    )