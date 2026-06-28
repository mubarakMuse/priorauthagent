import type { PayerRule } from "../../types"
import { Badge } from "../ui/Badge"
import { Card } from "../ui/Card"

type RulesCardProps = {
  rules: PayerRule[]
}

export const RulesCard = ({ rules }: RulesCardProps) => (
  <Card
    title="Matched payer rules"
    subtitle={`${rules.length} rule${rules.length === 1 ? "" : "s"} apply to this case`}
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
        <p className="text-sm text-slate-500">No payer rules matched the extracted procedures.</p>
      </div>
    ) : (
      <ul className="space-y-3">
        {rules.map((rule) => (
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
            </p>
          </li>
        ))}
      </ul>
    )}
  </Card>
)
