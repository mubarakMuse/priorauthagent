import type { PipelineEval } from "../../types"
import { Badge } from "../ui/Badge"
import { Card } from "../ui/Card"
import { ConfidenceRing } from "../ui/ConfidenceRing"

type EvaluationCardProps = {
  evaluation: PipelineEval
  generationAttempts: number
  stepLabel?: string
  stepNumber?: number
  onExplainStep?: (step: number) => void
}

const StatusRow = ({ label, ok }: { label: string; ok: boolean }) => (
  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
    <span className="text-sm text-slate-600">{label}</span>
    <Badge variant={ok ? "success" : "danger"}>{ok ? "Pass" : "Review"}</Badge>
  </div>
)

export const EvaluationCard = ({
  evaluation,
  generationAttempts,
  stepLabel,
  stepNumber,
  onExplainStep,
}: EvaluationCardProps) => {
  const scoreVariant =
    evaluation.confidence_score >= 0.8
      ? "success"
      : evaluation.confidence_score >= 0.5
        ? "warning"
        : "danger"

  return (
    <Card
      title="Quality evaluation"
      subtitle="Groundedness and consistency checks"
      stepLabel={stepLabel}
      stepNumber={stepNumber}
      onExplainStep={onExplainStep}
      icon={
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      }
      badge={<Badge variant={scoreVariant}>Confidence score</Badge>}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <ConfidenceRing score={evaluation.confidence_score} />
        <div className="flex-1">
          <p className="text-sm leading-relaxed text-slate-700">{evaluation.summary}</p>
          <p className="mt-2 text-xs text-slate-500">
            Generation attempts: {generationAttempts} · Code confidence:{" "}
            {Math.round(evaluation.code_confidence_score * 100)}%
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <StatusRow label="Extraction grounded" ok={evaluation.extraction_grounded} />
        <StatusRow label="Prior auth consistent" ok={evaluation.prior_auth_consistent} />
      </div>

      {evaluation.fact_evals.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Supporting facts verification
          </h3>
          <ul className="space-y-2">
            {evaluation.fact_evals.map((fact, i) => (
              <li
                key={i}
                className={`rounded-lg px-3 py-2 text-sm ${
                  fact.grounded ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"
                }`}
              >
                <span className="font-medium">{fact.grounded ? "✓" : "✗"}</span> {fact.fact}
                <span className="mt-0.5 block text-xs opacity-70">{fact.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {evaluation.llm_eval && (
        <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              LLM judge
            </h3>
            <Badge variant="brand">
              {Math.round(evaluation.llm_eval.groundedness_score * 100)}% grounded
            </Badge>
          </div>
          <p className="mt-2 text-sm italic text-slate-600">{evaluation.llm_eval.reasoning}</p>
          {evaluation.llm_eval.ungrounded_claims.length > 0 && (
            <ul className="mt-3 space-y-1">
              {evaluation.llm_eval.ungrounded_claims.map((claim, i) => (
                <li key={i} className="text-sm text-red-700">• {claim}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  )
}
