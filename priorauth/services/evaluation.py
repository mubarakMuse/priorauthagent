from priorauth.models.clinical import ClinicalExtraction
from priorauth.models.pipeline import FactEval, PipelineEval, PriorAuthRequest
from priorauth.services.llm_judge import evaluate_with_llm

_STOP_WORDS = {"with", "the", "and", "for", "from", "patient"}


def _normalize(text: str) -> str:
    return text.lower().strip()


def _code_in_source(code: str, source_note: str) -> bool:
    return code.lower() in _normalize(source_note)


def _fact_grounded_in_source(fact: str, source_note: str) -> tuple[bool, str]:
    fact_words = [
        word
        for word in _normalize(fact).replace("(", " ").replace(")", " ").split()
        if len(word) > 3 and word not in _STOP_WORDS
    ]

    if not fact_words:
        return False, "Fact too short to verify"

    source = _normalize(source_note)
    matches = sum(1 for word in fact_words if word in source)
    ratio = matches / len(fact_words)

    if ratio >= 0.5:
        return True, f"{matches}/{len(fact_words)} key terms found in source"
    return False, f"Only {matches}/{len(fact_words)} key terms found in source"


def _collect_code_grounding(
    extraction: ClinicalExtraction,
    source_note: str,
) -> tuple[list[str], list[str]]:
    codes_found: list[str] = []
    codes_missing: list[str] = []

    for diagnosis in extraction.diagnoses:
        if not diagnosis.icd10_code:
            continue
        if _code_in_source(diagnosis.icd10_code, source_note):
            codes_found.append(diagnosis.icd10_code)
        else:
            codes_missing.append(diagnosis.icd10_code)

    for procedure in extraction.procedures:
        if not procedure.cpt_code:
            continue
        if _code_in_source(procedure.cpt_code, source_note):
            codes_found.append(procedure.cpt_code)
        else:
            codes_missing.append(procedure.cpt_code)

    return codes_found, codes_missing


def _evaluate_supporting_facts(
    prior_auth: PriorAuthRequest,
    source_note: str,
) -> list[FactEval]:
    fact_evals: list[FactEval] = []
    for fact in prior_auth.supporting_facts:
        grounded, reason = _fact_grounded_in_source(fact, source_note)
        fact_evals.append(FactEval(fact=fact, grounded=grounded, reason=reason))
    return fact_evals


def _prior_auth_is_consistent(
    extraction: ClinicalExtraction,
    prior_auth: PriorAuthRequest,
) -> bool:
    extraction_icds = {d.icd10_code for d in extraction.diagnoses if d.icd10_code}
    extraction_cpts = {p.cpt_code for p in extraction.procedures if p.cpt_code}

    if prior_auth.icd10_code and prior_auth.icd10_code not in extraction_icds:
        return False
    if prior_auth.cpt_code and prior_auth.cpt_code not in extraction_cpts:
        return False
    return True


def _code_confidence_score(
    extraction: ClinicalExtraction,
    codes_found: list[str],
    codes_missing: list[str],
    fact_evals: list[FactEval],
    prior_auth: PriorAuthRequest | None,
    prior_auth_consistent: bool,
) -> float:
    scores: list[float] = []

    if extraction.diagnoses or extraction.procedures:
        total_codes = len(codes_found) + len(codes_missing)
        scores.append(len(codes_found) / total_codes if total_codes else 1.0)
    else:
        scores.append(0.5)

    if fact_evals:
        grounded_facts = sum(1 for fact in fact_evals if fact.grounded)
        scores.append(grounded_facts / len(fact_evals))
    elif prior_auth is None:
        scores.append(1.0)

    scores.append(1.0 if prior_auth_consistent else 0.0)
    return round(sum(scores) / len(scores), 2)


def _build_retry_feedback(
    codes_missing: list[str],
    fact_evals: list[FactEval],
    llm_eval,
) -> str | None:
    parts: list[str] = []

    if codes_missing:
        parts.append(f"Remove or fix codes not in source: {', '.join(codes_missing)}")

    ungrounded_facts = [fact.fact for fact in fact_evals if not fact.grounded]
    if ungrounded_facts:
        parts.append(f"These facts are not grounded: {'; '.join(ungrounded_facts)}")

    if llm_eval and llm_eval.ungrounded_claims:
        parts.append(f"LLM flagged: {'; '.join(llm_eval.ungrounded_claims)}")

    if not parts:
        return None
    return " | ".join(parts)


def _build_summary(confidence: float, llm_eval) -> str:
    if confidence >= 0.8:
        summary = "High confidence — code + LLM eval agree outputs are grounded."
    elif confidence >= 0.5:
        summary = "Moderate confidence — review before submission."
    else:
        summary = "Low confidence — outputs may contain unsupported claims."

    if llm_eval and llm_eval.ungrounded_claims:
        summary += f" Ungrounded: {', '.join(llm_eval.ungrounded_claims[:3])}."

    return summary


def evaluate_pipeline(
    source_note: str,
    extraction: ClinicalExtraction,
    prior_auth: PriorAuthRequest | None,
) -> PipelineEval:
    """Score how well pipeline outputs are grounded in the source clinical note."""
    codes_found, codes_missing = _collect_code_grounding(extraction, source_note)
    extraction_grounded = len(codes_missing) == 0

    fact_evals = _evaluate_supporting_facts(prior_auth, source_note) if prior_auth else []
    prior_auth_consistent = (
        _prior_auth_is_consistent(extraction, prior_auth) if prior_auth else True
    )

    code_confidence = _code_confidence_score(
        extraction,
        codes_found,
        codes_missing,
        fact_evals,
        prior_auth,
        prior_auth_consistent,
    )

    llm_eval = evaluate_with_llm(source_note, prior_auth) if prior_auth else None

    if llm_eval:
        confidence = round((code_confidence * 0.4) + (llm_eval.groundedness_score * 0.6), 2)
    else:
        confidence = code_confidence

    retry_feedback = None
    if confidence < 0.8 and prior_auth:
        retry_feedback = _build_retry_feedback(codes_missing, fact_evals, llm_eval)
        if not retry_feedback:
            retry_feedback = "Improve grounding in source note only."

    return PipelineEval(
        extraction_grounded=extraction_grounded,
        codes_found_in_source=codes_found,
        codes_missing_from_source=codes_missing,
        fact_evals=fact_evals,
        prior_auth_consistent=prior_auth_consistent,
        code_confidence_score=code_confidence,
        llm_eval=llm_eval,
        confidence_score=confidence,
        summary=_build_summary(confidence, llm_eval),
        retry_feedback=retry_feedback,
    )
