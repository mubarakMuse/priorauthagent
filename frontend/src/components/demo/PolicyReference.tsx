import { useState } from "react"
import type { PolicyOverview, PolicyRuleDetail } from "../../types/policy"
import { Badge } from "../ui/Badge"

type PolicyReferenceProps = {
  policy: PolicyOverview
  defaultExpanded?: boolean
  embedded?: boolean
}

const RuleCard = ({ rule }: { rule: PolicyRuleDetail }) => (
  <details className="group rounded-xl border border-slate-200 bg-slate-50/50">
    <summary className="cursor-pointer list-none px-4 py-3 [&::-webkit-details-marker]:hidden">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs font-semibold text-blue-600">{rule.id}</span>
        <Badge variant={rule.requires_prior_auth ? "warning" : "success"}>
          {rule.requires_prior_auth ? "Prior auth" : "No auth"}
        </Badge>
        <Badge variant="neutral">CPT {rule.procedure_cpt}</Badge>
        <span className="text-xs text-slate-500">{rule.category}</span>
      </div>
      <p className="mt-1 text-sm text-slate-800">{rule.description}</p>
    </summary>
    <div className="border-t border-slate-200 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Policy criteria ({rule.criteria.length})
      </p>
      <ul className="mt-2 space-y-2">
        {rule.criteria.map((criterion) => (
          <li key={criterion.id} className="rounded-lg bg-white px-3 py-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-medium text-slate-700">{criterion.id}</span>
              <Badge variant={criterion.required ? "brand" : "neutral"}>
                {criterion.required ? "Required" : "Optional"}
              </Badge>
              <span className="text-slate-400">{criterion.type.replace(/_/g, " ")}</span>
            </div>
            <p className="mt-1 text-slate-600">{criterion.description}</p>
            {criterion.allowed_icd10.length > 0 && (
              <p className="mt-1 text-slate-500">
                ICD-10: {criterion.allowed_icd10.join(", ")}
              </p>
            )}
          </li>
        ))}
      </ul>
      {(rule.typical_turnaround_days !== null || rule.requires_medical_director_review) && (
        <p className="mt-3 text-xs text-slate-500">
          {rule.typical_turnaround_days !== null && (
            <span>Typical turnaround: {rule.typical_turnaround_days} days · </span>
          )}
          {rule.auto_approve_if_all_met && <span>Auto-approve if criteria met · </span>}
          {rule.requires_medical_director_review && <span>Medical director review required</span>}
        </p>
      )}
    </div>
  </details>
)

export const PolicyReference = ({
  policy,
  defaultExpanded = true,
  embedded = false,
}: PolicyReferenceProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const content = (
    <>
      {!embedded && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        >
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Loaded payer policy</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {policy.payer} · {policy.plan_type} · v{policy.ruleset_version} · updated {policy.last_updated}
            </p>
          </div>
          <span className="text-xs font-medium text-blue-600">
            {policy.rules.length} rules {expanded ? "▲" : "▼"}
          </span>
        </button>
      )}

      {(embedded || expanded) && (
        <div className={`space-y-4 ${embedded ? "" : "border-t border-slate-100 px-5 py-4"}`}>
          {embedded && (
            <p className="text-xs text-slate-500">
              {policy.payer} · {policy.plan_type} · v{policy.ruleset_version} · updated {policy.last_updated}
            </p>
          )}
          <div className="rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-200/80">
            <span className="font-semibold">Demo matching logic:</span> {policy.demo_matching_note}
          </div>
          <div className="space-y-2">
            {policy.rules.map((rule) => (
              <RuleCard key={rule.id} rule={rule} />
            ))}
          </div>
        </div>
      )}
    </>
  )

  if (embedded) return content

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/50">
      {content}
    </section>
  )
}
