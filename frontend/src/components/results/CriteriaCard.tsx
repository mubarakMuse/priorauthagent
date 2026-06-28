import type { PipelineResponse } from "../../types"
import { Badge } from "../ui/Badge"
import { Card } from "../ui/Card"

type CriteriaCardProps = {
  criteriaValidation: NonNullable<PipelineResponse["criteria_validation"]>
  stepLabel?: string
  stepNumber?: number
  onExplainStep?: (step: number) => void
}

const statusVariant = (status: string): "success" | "warning" | "danger" | "neutral" => {
  if (status === "met") return "success"
  if (status === "partial") return "warning"
  if (status === "needs_external_data") return "neutral"
  return "danger"
}

const readinessLabel = (readiness: string): string => {
  if (readiness === "ready") return "Criteria ready"
  if (readiness === "gaps") return "Gaps — review before submit"
  return "Blocked — missing required evidence"
}

export const CriteriaCard = ({
  criteriaValidation,
  stepLabel,
  stepNumber,
  onExplainStep,
}: CriteriaCardProps) => (
  <Card
    title="Criteria validation"
    subtitle="Policy requirements checked against extracted clinical evidence"
    stepLabel={stepLabel}
    stepNumber={stepNumber}
    onExplainStep={onExplainStep}
    icon={
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    }
  >
    <p className="mb-4 text-sm text-slate-600">{criteriaValidation.summary}</p>
    <ul className="space-y-4">
      {criteriaValidation.rules.map((ruleResult) => (
        <li key={ruleResult.rule_id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold text-blue-600">{ruleResult.rule_id}</span>
            <Badge
              variant={
                ruleResult.readiness === "ready"
                  ? "success"
                  : ruleResult.readiness === "gaps"
                    ? "warning"
                    : "danger"
              }
            >
              {readinessLabel(ruleResult.readiness)}
            </Badge>
            <span className="text-xs text-slate-500">
              {ruleResult.required_met}/{ruleResult.required_total} required met
            </span>
          </div>
          <ul className="mt-3 space-y-2">
            {ruleResult.criteria.map((criterion) => (
              <li key={criterion.criterion_id} className="rounded-lg bg-white px-3 py-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-slate-500">{criterion.criterion_id}</span>
                  <Badge variant={statusVariant(criterion.status)}>{criterion.status.replace(/_/g, " ")}</Badge>
                  {criterion.required && <Badge variant="brand">Required</Badge>}
                </div>
                <p className="mt-1 text-slate-700">{criterion.description}</p>
                <p className="mt-1 text-slate-500">{criterion.detail}</p>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  </Card>
)

type PolicyRetrievalNoteProps = {
  chunks: PipelineResponse["retrieved_policy_chunks"]
}

export const PolicyRetrievalNote = ({ chunks }: PolicyRetrievalNoteProps) => {
  if (!chunks || chunks.length === 0) return null

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/60 px-4 py-3 text-xs text-violet-900">
      <p className="font-semibold">RAG — retrieved policy context</p>
      <p className="mt-1 text-violet-800/90">
        {chunks.length} payer policy chunk{chunks.length === 1 ? "" : "s"} retrieved for generation:{" "}
        {chunks.map((c) => c.rule_id).join(", ")}. Production would use vector search over payer policy PDFs.
      </p>
    </div>
  )
}
