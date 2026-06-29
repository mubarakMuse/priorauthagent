import type { DemoExperienceMode } from "../../constants/demoMode"
import { DEMO_MODE_LABELS } from "../../constants/demoMode"

type DemoModeToggleProps = {
  mode: DemoExperienceMode
  onModeChange: (mode: DemoExperienceMode) => void
}

export const DemoModeToggle = ({ mode, onModeChange }: DemoModeToggleProps) => (
  <div
    className="flex rounded-xl bg-slate-100 p-1"
    role="radiogroup"
    aria-label="Demo experience mode"
  >
    {(["simple", "advanced"] as const).map((option) => {
      const { label } = DEMO_MODE_LABELS[option]
      const isActive = mode === option

      return (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={isActive}
          title={DEMO_MODE_LABELS[option].description}
          onClick={() => onModeChange(option)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all sm:px-4 sm:text-sm ${
            isActive
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {label}
        </button>
      )
    })}
  </div>
)
