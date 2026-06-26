from generate import generate_prior_auth_request
from models import PipelineResponse, PriorAuthRequest
from rules import load_rules, match_rules
from script import extract_clinical_data
from eval import evaluate_pipeline

MAX_GENERATION_RETRIES = 2
CONFIDENCE_THRESHOLD = 0.8


def run_pipeline(clinical_note: str) -> PipelineResponse:
  extraction = extract_clinical_data(clinical_note)
  rules = load_rules()
  matched = match_rules(extraction, rules)

  prior_auth: PriorAuthRequest | None = None
  evaluation = None
  feedback: str | None = None
  attempts = 0

  if matched:
      for attempt in range(MAX_GENERATION_RETRIES + 1):
          attempts = attempt + 1
          prior_auth = generate_prior_auth_request(
              extraction, matched, feedback=feedback
          )
          evaluation = evaluate_pipeline(clinical_note, extraction, prior_auth)

          if evaluation.confidence_score >= CONFIDENCE_THRESHOLD:
              break

          feedback = evaluation.retry_feedback
          if not feedback:
              break  # nothing to improve on — stop looping

  else:
      evaluation = evaluate_pipeline(clinical_note, extraction, None)

  return PipelineResponse(
      extraction=extraction,
      matched_rules=matched,
      prior_auth_request=prior_auth,
      evaluation=evaluation,
      generation_attempts=attempts,
  )