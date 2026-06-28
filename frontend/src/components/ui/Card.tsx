type CardProps = {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  badge?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export const Card = ({
  title,
  subtitle,
  icon,
  badge,
  children,
  className = "",
}: CardProps) => (
  <section
    className={`rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 ${className}`}
  >
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
