type CardProps = {
  title: string
  subtitle?: string
  stepLabel?: string
  stepNumber?: number
  onExplainStep?: (step: number) => void
  icon?: React.ReactNode
  badge?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export const Card = ({
  title,
  subtitle,
  stepLabel,
  stepNumber,
  onExplainStep,
  icon,
  badge,
  children,
  className = "",
}: CardProps) => (
  <section
    className={`rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 ${className}`}
  >
    {stepLabel && (
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
          {stepLabel}
        </p>
        {stepNumber && onExplainStep && (
          <button
            type="button"
            onClick={() => onExplainStep(stepNumber)}
            aria-label={`Explain ${stepLabel}`}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}
      </div>
    )}
    <div className="mb-5 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
      </div>
      {badge}
    </div>
    {children}
  </section>
)
