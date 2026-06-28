import { useState } from "react"
import type { PipelineResponse } from "../../types"
import type { PolicyOverview } from "../../types/policy"
import { downloadPortfolioPdf } from "../../utils/exportPortfolioPdf"
import { CriteriaCard, PolicyRetrievalNote } from "./CriteriaCard"
import { ExtractionCard } from "./ExtractionCard"
import { EvaluationCard } from "./EvaluationCard"
import { PriorAuthCard } from "./PriorAuthCard"
import { RulesCard } from "./RulesCard"

type ResultsViewProps = {
  result: PipelineResponse
  policy: PolicyOverview | null
  expectedRuleId?: string | null
  onExplainStep: (step: number) => void
  onTryAgain: () => void
}

const ResultSummary = ({
  result,
  expectedRuleId,
}: {
  result: PipelineResponse
  expectedRuleId?: string | null
}) => {
  const matchedIds = result.matched_rules.map((rule) => rule.id)
  const hasAuthDraft = Boolean(result.prior_auth_request)
  const confidence = result.evaluation?.confidence_score ?? 0

  let headline = "Pipeline complete"
  let detail = "Review each section below."

  if (matchedIds.length === 0) {
    headline = "No payer rules matched"
    detail = "Extraction succeeded but no procedures matched the loaded policy."
  } else if (hasAuthDraft) {
    headline = `Prior auth draft generated`
    detail = `Matched ${matchedIds.join(", ")} · ${Math.round(confidence * 100)}% confidence`
  } else {
    headline = "Rule matched — no auth required"
    detail = `Matched ${matchedIds.join(", ")} but prior auth is not required.`
  }

  const expectedMatch =
    expectedRuleId && expectedRuleId !== "—" && matchedIds.includes(expectedRuleId)
  const expectedMiss =
    expectedRuleId && expectedRuleId !== "—" && !matchedIds.includes(expectedRuleId)

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-5 py-4">
      <h2 className="text-base font-semibold text-emerald-900">{headline}</h2>
      <p className="mt-1 text-sm text-emerald-800/90">{detail}</p>
      {expectedMatch && (
        <p className="mt-2 text-xs font-medium text-emerald-700">
          ✓ Expected rule {expectedRuleId}
        </p>
      )}
      {expectedMiss && (
        <p className="mt-2 text-xs font-medium text-amber-800">
          Expected {expectedRuleId} · got {matchedIds.join(", ") || "none"}
        </p>
      )}
    </div>
  )
}

export const ResultsView = ({
  result,
  policy,
  expectedRuleId,
  onExplainStep,
  onTryAgain,
}: ResultsViewProps) => {
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const handleExportPdf = async () => {
    setIsExporting(true)
    setExportError(null)
    try {
      await downloadPortfolioPdf(result)
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Failed to export PDF")
    } finally {
      setIsExporting(false)
    }
  }

  return (
  <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-semibold text-slate-900">Results</h2>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={isExporting}
          aria-label="Export prior authorization portfolio as PDF"
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {isExporting ? "Generating PDF…" : "Export PDF"}
        </button>
        <button
          type="button"
          onClick={onTryAgain}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-600"
        >
          Try again
        </button>
      </div>
    </div>

    {exportError && (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {exportError}
      </div>
    )}

    <ResultSummary result={result} expectedRuleId={expectedRuleId} />

    <ExtractionCard
      extraction={result.extraction}
      stepLabel="Step 2 · Extract"
      stepNumber={2}
      onExplainStep={onExplainStep}
    />
    <RulesCard
      rules={result.matched_rules}
      policy={policy}
      stepLabel="Step 3 · Match rules"
      stepNumber={3}
      onExplainStep={onExplainStep}
    />
    {result.criteria_validation && (
      <CriteriaCard
        criteriaValidation={result.criteria_validation}
        stepLabel="Step 3b · Validate criteria"
        stepNumber={3}
        onExplainStep={onExplainStep}
      />
    )}
    <PolicyRetrievalNote chunks={result.retrieved_policy_chunks} />
    <PriorAuthCard
      request={result.prior_auth_request}
      stepLabel="Step 4 · Generate"
      stepNumber={4}
      onExplainStep={onExplainStep}
    />
    {result.evaluation && (
      <EvaluationCard
        evaluation={result.evaluation}
        generationAttempts={result.generation_attempts}
        stepLabel="Step 5 · Evaluate"
        stepNumber={5}
        onExplainStep={onExplainStep}
      />
    )}
  </div>
  )
}
