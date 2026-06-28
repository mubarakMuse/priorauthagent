import { useEffect, useState } from "react"

const PROGRESS_STEPS = [
  { step: 1, label: "Ingest", detail: "Clinical note received" },
  { step: 2, label: "Extract", detail: "Pulling diagnoses, procedures, medications" },
  { step: 3, label: "Match rules", detail: "Checking against payer policy" },
  { step: 4, label: "Generate", detail: "Drafting prior auth request" },
  { step: 5, label: "Evaluate", detail: "Scoring groundedness & quality" },
]

const STEP_DELAYS_MS = [0, 6000, 18000, 35000, 55000]

export const usePipelineProgress = (isRunning: boolean) => {
  const [activeStep, setActiveStep] = useState(1)

  useEffect(() => {
    if (!isRunning) {
      setActiveStep(1)
      return
    }

    setActiveStep(2)
    const timers = STEP_DELAYS_MS.slice(1).map((delay, index) =>
      window.setTimeout(() => setActiveStep(index + 2), delay)
    )

    return () => timers.forEach(clearTimeout)
  }, [isRunning])

  return activeStep
}

type PipelineProgressProps = {
  activeStep: number
  onExplainStep: (step: number) => void
}

export const PipelineProgress = ({
  activeStep,
  onExplainStep,
}: PipelineProgressProps) => (
  <div className="mx-auto w-full max-w-xl">
    <div className="mb-8 text-center">
      <div className="relative mx-auto mb-4 h-14 w-14">
        <div className="absolute inset-0 animate-ping rounded-full bg-blue-400/20" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30">
          <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
      <h2 className="text-xl font-semibold text-slate-900">Running pipeline</h2>
      <p className="mt-1 text-sm text-slate-500">Usually takes 30–90 seconds</p>
    </div>

    <ol className="space-y-0" aria-label="Pipeline progress">
      {PROGRESS_STEPS.map(({ step, label, detail }, index) => {
        const isComplete = step < activeStep
        const isActive = step === activeStep
        const isPending = step > activeStep

        return (
          <li key={step} className="relative flex gap-4 pb-8 last:pb-0">
            {index < PROGRESS_STEPS.length - 1 && (
              <div
                className={`absolute left-5 top-10 h-[calc(100%-2rem)] w-0.5 ${
                  isComplete ? "bg-blue-500" : "bg-slate-200"
                }`}
                aria-hidden="true"
              />
            )}
            <div
              className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                isComplete
                  ? "bg-blue-600 text-white"
                  : isActive
                    ? "bg-blue-100 text-blue-700 ring-2 ring-blue-500 ring-offset-2"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              {isComplete ? "✓" : step}
            </div>
            <div className="flex flex-1 items-start justify-between gap-2 pt-1.5">
              <div>
                <p className={`font-medium ${isPending ? "text-slate-400" : "text-slate-900"}`}>
                  {label}
                  {isActive && (
                    <span className="ml-2 text-xs font-normal text-blue-600">In progress…</span>
                  )}
                </p>
                <p className={`text-sm ${isPending ? "text-slate-300" : "text-slate-500"}`}>
                  {detail}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onExplainStep(step)}
                aria-label={`Explain step ${step}: ${label}`}
                className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </li>
        )
      })}
    </ol>
  </div>
)
