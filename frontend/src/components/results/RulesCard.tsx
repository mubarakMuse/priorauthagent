import type { PayerRule } from "../../types"
import type { PolicyOverview } from "../../types/policy"
import { Badge } from "../ui/Badge"
import { Card } from "../ui/Card"

type RulesCardProps = {
  rules: PayerRule[]
  policy: PolicyOverview | null
  stepLabel?: string
  stepNumber?: number
  onExplainStep?: (step: number) => void
}

export const RulesCard = ({
  rules,
  policy,
  stepLabel,
  stepNumber,
  onExplainStep,
}: RulesCardProps) => (
  <Card
    title="Matched payer rules"
    subtitle={`${rules.length} rule${rules.length === 1 ? "" : "s"} apply to this case`}
    stepLabel={stepLabel}
    stepNumber={stepNumber}
    onExplainStep={onExplainStep}
    icon={
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    }
    badge={
      rules.length > 0 ? (
        <Badge variant={rules.some((r) => r.requires_prior_auth) ? "warning" : "success"}>
          {rules.some((r) => r.requires_prior_auth) ? "Auth required" : "No auth needed"}
        </Badge>
      ) : undefined
    }
  >
    {rules.length === 0 ? (
      <div className="rounded-xl bg-slate-50 px-4 py-8 text-center">
        <p className="text-sm text-slate-500">
          No payer rules matched the extracted procedures.
        </p>
        {policy && (
          <p className="mt-2 text-xs text-slate-400">
            Loaded policy covers CPT codes:{" "}
            {policy.rules.map((rule) => rule.procedure_cpt).join(", ")}
          </p>
        )}
      </div>
    ) : (
      <ul className="space-y-3">
        {rules.map((rule) => {
          const policyRule = policy?.rules.find((item) => item.id === rule.id)
          return (
            <li
              key={rule.id}
              className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 transition hover:border-slate-200"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-semibold text-blue-600">{rule.id}</span>
                <Badge variant={rule.requires_prior_auth ? "warning" : "neutral"}>
                  {rule.requires_prior_auth ? "Prior auth required" : "No prior auth"}
                </Badge>
              </div>
              <p className="mt-2 text-sm font-medium text-slate-900">{rule.description}</p>
              <p className="mt-1 text-xs text-slate-500">
                Payer: {rule.payer} · CPT {rule.procedure_cpt}
                {rule.allowed_icd10_codes?.length
                  ? ` · ICD must be one of: ${rule.allowed_icd10_codes.join(", ")}`
                  : rule.required_diagnosis_icd10
                    ? ` · ICD ${rule.required_diagnosis_icd10} required for match`
                    : ""}
              </p>
              {policyRule && policyRule.criteria.length > 0 && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-medium text-blue-600">
                    View full policy criteria ({policyRule.criteria.length})
                  </summary>
                  <ul className="mt-2 space-y-1">
                    {policyRule.criteria.map((criterion) => (
                      <li key={criterion.id} className="text-xs text-slate-600">
                        <span className="font-mono text-slate-500">{criterion.id}</span> — {criterion.description}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </li>
          )
        })}
      </ul>
    )}
  </Card>
)
