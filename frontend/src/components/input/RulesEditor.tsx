import { DEFAULT_RULES_JSON } from "../../constants/defaultRules"
import type { PolicyOverview } from "../../types/policy"
import { parseRulesJson } from "../../utils/parseRulesJson"

type RulesEditorProps = {
  rulesJson: string
  onRulesJsonChange: (value: string) => void
  onPolicyChange: (policy: PolicyOverview | null) => void
  rulesError: string | null
  onRulesErrorChange: (error: string | null) => void
}

export const RulesEditor = ({
  rulesJson,
  onRulesJsonChange,
  onPolicyChange,
  rulesError,
  onRulesErrorChange,
}: RulesEditorProps) => {
  const handleChange = (value: string) => {
    onRulesJsonChange(value)

    if (!value.trim()) {
      onPolicyChange(null)
      onRulesErrorChange("Paste payer rules JSON or load the sample policy")
      return
    }

    try {
      const parsed = parseRulesJson(value)
      onPolicyChange(parsed.policy)
      onRulesErrorChange(null)
    } catch (err) {
      onPolicyChange(null)
      onRulesErrorChange(err instanceof Error ? err.message : "Invalid rules JSON")
    }
  }

  const handleLoadSample = () => {
    handleChange(DEFAULT_RULES_JSON)
  }

  const handleClear = () => {
    onRulesJsonChange("")
    onPolicyChange(null)
    onRulesErrorChange("Paste payer rules JSON or load the sample policy")
  }

  let policyPreview: PolicyOverview | null = null
  if (!rulesError && rulesJson.trim()) {
    try {
      policyPreview = parseRulesJson(rulesJson).policy
    } catch {
      policyPreview = null
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/50">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">1. Payer rules & policy</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Paste your own rules JSON or load our Meridian Health Plan sample.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleLoadSample}
            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
          >
            Load sample policy
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Clear
          </button>
        </div>
      </div>

      <label htmlFor="rules-json" className="sr-only">
        Payer rules JSON
      </label>
      <textarea
        id="rules-json"
        value={rulesJson}
        onChange={(e) => handleChange(e.target.value)}
        rows={10}
        spellCheck={false}
        placeholder='Paste rules JSON here — must include a "rules" array with rule_id, procedure_code, requires_prior_auth, and criteria...'
        className={`w-full resize-y rounded-xl border bg-slate-50/50 px-4 py-3 font-mono text-xs leading-relaxed text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
          rulesError
            ? "border-red-300 focus:border-red-400 focus:ring-red-500/20"
            : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
        }`}
      />

      {rulesError ? (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {rulesError}
        </p>
      ) : policyPreview ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700 ring-1 ring-emerald-200">
            {policyPreview.rules.length} rules loaded
          </span>
          <span className="text-slate-500">
            {policyPreview.payer}
            {policyPreview.plan_type ? ` · ${policyPreview.plan_type}` : ""}
            {policyPreview.ruleset_version ? ` · v${policyPreview.ruleset_version}` : ""}
          </span>
        </div>
      ) : null}

      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        Layer 1 — match: CPT + any allowed ICD-10. Layer 2 — validate each policy criterion against
        extracted clinical evidence (therapy weeks, imaging, exam findings, etc.).
      </p>
    </div>
  )
}
