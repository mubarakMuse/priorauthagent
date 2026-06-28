const STEPS = [
  "Extracting clinical data",
  "Matching payer rules",
  "Drafting prior auth request",
  "Evaluating groundedness",
]

export const LoadingState = () => (
  <div
    className="flex flex-col items-center justify-center rounded-2xl border border-blue-100 bg-blue-50/50 px-8 py-16 text-center"
    role="status"
    aria-live="polite"
    aria-label="Processing clinical note"
  >
    <div className="relative mb-6 h-14 w-14">
      <div className="absolute inset-0 animate-ping rounded-full bg-blue-400/30" />
      <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30">
        <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    </div>

    <h3 className="text-lg font-semibold text-slate-900">Analyzing clinical note</h3>
    <p className="mt-1 max-w-sm text-sm text-slate-600">
      This usually takes 30–90 seconds. We're running extraction, rule matching, and quality checks.
    </p>

    <ul className="mt-8 space-y-2 text-left text-sm text-slate-600">
      {STEPS.map((step, index) => (
        <li key={step} className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
            {index + 1}
          </span>
          {step}
        </li>
      ))}
    </ul>
  </div>
)
