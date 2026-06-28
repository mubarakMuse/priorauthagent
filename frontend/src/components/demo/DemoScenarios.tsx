import type { DemoScenario } from "../../types/policy"

type DemoScenariosProps = {
  scenarios: DemoScenario[]
  activeScenarioId: string | null
  onSelect: (scenario: DemoScenario) => void
}

export const DemoScenarios = ({
  scenarios,
  activeScenarioId,
  onSelect,
}: DemoScenariosProps) => (
  <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/50">
    <h2 className="text-sm font-semibold text-slate-900">Try a demo scenario</h2>
    <p className="mt-1 text-xs text-slate-500">
      Each example uses the loaded payer policy. Pick one to load a note and see what should happen.
    </p>
    <ul className="mt-4 space-y-2">
      {scenarios.map((scenario) => {
        const isActive = activeScenarioId === scenario.id
        return (
          <li key={scenario.id}>
            <button
              type="button"
              onClick={() => onSelect(scenario)}
              aria-pressed={isActive}
              className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                isActive
                  ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500/30"
                  : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white"
              }`}
            >
              <p className="text-sm font-medium text-slate-900">{scenario.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">{scenario.subtitle}</p>
              <p className="mt-2 text-xs text-blue-700">
                <span className="font-medium">Expect:</span> {scenario.expectedOutcome}
              </p>
            </button>
          </li>
        )
      })}
    </ul>
  </section>
)
