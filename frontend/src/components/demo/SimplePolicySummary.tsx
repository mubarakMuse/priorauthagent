import { useState } from "react"
import type { PolicyOverview } from "../../types/policy"
import {
  buildPlainEnglishPolicy,
  buildPolicyIntro,
} from "../../utils/formatPolicyPlainEnglish"
import { Badge } from "../ui/Badge"

type SimplePolicySummaryProps = {
  policy: PolicyOverview
  defaultExpanded?: boolean
  embedded?: boolean
}

export const SimplePolicySummary = ({
  policy,
  defaultExpanded = false,
  embedded = false,
}: SimplePolicySummaryProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const sections = buildPlainEnglishPolicy(policy)
  const intro = buildPolicyIntro(policy)

  return (
    <section
      className={
        embedded
          ? "space-y-3"
          : "rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/50"
      }
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className={`flex w-full items-start justify-between gap-4 text-left ${
          embedded ? "pb-2" : "px-5 py-4"
        }`}
      >
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Payer policy in plain English</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">{intro}</p>
        </div>
        <span className="shrink-0 text-xs font-medium text-blue-600">
          {expanded ? "Hide" : "Show rules"}
        </span>
      </button>

      {expanded && (
        <div
          className={`space-y-3 ${embedded ? "" : "border-t border-slate-100 px-5 py-4"}`}
        >
          {sections.map((section) => (
            <article
              key={section.ruleId}
              className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">{section.title}</h3>
                <Badge variant={section.requiresPriorAuth ? "warning" : "success"}>
                  {section.requiresPriorAuth ? "Auth required" : "No auth"}
                </Badge>
                <span className="text-xs text-slate-500">{section.category}</span>
              </div>
              <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-700">
                {section.summaryLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </article>
          ))}
          <p className="text-xs leading-relaxed text-slate-500">
            {policy.demo_matching_note}
          </p>
        </div>
      )}
    </section>
  )
}
