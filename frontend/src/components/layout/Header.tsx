const WORKFLOW_STEPS = [
  { label: "Ingest", desc: "Paste or upload" },
  { label: "Extract", desc: "Structured data" },
  { label: "Match", desc: "Payer rules" },
  { label: "Generate", desc: "Auth request" },
  { label: "Evaluate", desc: "Quality check" },
]

export const Header = () => (
  <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-600/25"
            aria-hidden="true"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Prior Auth Agent
            </h1>
            <p className="text-sm text-slate-500">
              AI-assisted prior authorization for clinical teams
            </p>
          </div>
        </div>

        <nav aria-label="Pipeline workflow" className="hidden md:flex items-center gap-1">
          {WORKFLOW_STEPS.map((step, index) => (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center px-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                  {index + 1}
                </span>
                <span className="mt-1 text-xs font-medium text-slate-700">{step.label}</span>
              </div>
              {index < WORKFLOW_STEPS.length - 1 && (
                <div className="mb-4 h-px w-6 bg-slate-200" aria-hidden="true" />
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  </header>
)
