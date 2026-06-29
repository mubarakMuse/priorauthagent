import { DEMO_SCENARIOS } from "../../constants/demoScenarios"
import type { DemoScenario } from "../../types/policy"
import type { PolicyOverview } from "../../types/policy"
import { SimplePolicySummary } from "./SimplePolicySummary"

type SimpleDemoPanelProps = {
  policy: PolicyOverview | null
  note: string
  selectedScenarioId: string | null
  onNoteChange: (note: string) => void
  onLoadScenario: (scenario: DemoScenario) => void
  onSubmit: () => void
  rulesValid: boolean
}

export const SimpleDemoPanel = ({
  policy,
  note,
  selectedScenarioId,
  onNoteChange,
  onLoadScenario,
  onSubmit,
  rulesValid,
}: SimpleDemoPanelProps) => {
  const canSubmit = rulesValid && note.trim().length > 0

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50 to-white px-5 py-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Try the prior auth demo</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          We preloaded a sample clinical note. Pick another case, skim the payer rules below,
          then run the pipeline — no setup required.
        </p>
      </div>

      {policy && <SimplePolicySummary policy={policy} />}

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/50">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-900">Sample clinical note</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Switch cases or edit the note, then run the demo.
          </p>
        </div>

        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Pick a case
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          {DEMO_SCENARIOS.map((scenario) => {
            const isSelected = selectedScenarioId === scenario.id

            return (
              <button
                key={scenario.id}
                type="button"
                onClick={() => onLoadScenario(scenario)}
                title={scenario.subtitle}
                aria-pressed={isSelected}
                className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
                  isSelected
                    ? "border-blue-400 bg-blue-50 ring-2 ring-blue-500/20"
                    : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/60"
                }`}
              >
                <span className="font-medium text-slate-800">{scenario.title}</span>
                <span className="mt-0.5 block text-[11px] text-slate-500">{scenario.subtitle}</span>
              </button>
            )
          })}
        </div>

        <label htmlFor="simple-clinical-note" className="sr-only">
          Clinical note
        </label>
        <textarea
          id="simple-clinical-note"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          rows={9}
          className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />

        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          aria-label="Run prior authorization demo"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-base font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Run demo
        </button>
      </div>
    </div>
  )
}
