import type { PipelineResponse } from "../../types"
import { ExtractionCard } from "./ExtractionCard"
import { EvaluationCard } from "./EvaluationCard"
import { PriorAuthCard } from "./PriorAuthCard"
import { RulesCard } from "./RulesCard"

type ResultsViewProps = {
  result: PipelineResponse
}

export const ResultsView = ({ result }: ResultsViewProps) => (
  <div className="space-y-6">
    <div className="flex items-center gap-2">
      <div className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
      <h2 className="text-lg font-semibold text-slate-900">Pipeline results</h2>
    </div>

    <ExtractionCard extraction={result.extraction} />
    <RulesCard rules={result.matched_rules} />
    <PriorAuthCard request={result.prior_auth_request} />
    {result.evaluation && (
      <EvaluationCard
        evaluation={result.evaluation}
        generationAttempts={result.generation_attempts}
      />
    )}
  </div>
)
