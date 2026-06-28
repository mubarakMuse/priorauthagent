type BadgeVariant = "success" | "warning" | "danger" | "neutral" | "brand"

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  warning: "bg-amber-50 text-amber-800 ring-amber-600/20",
  danger: "bg-red-50 text-red-700 ring-red-600/20",
  neutral: "bg-slate-100 text-slate-700 ring-slate-500/20",
  brand: "bg-blue-50 text-blue-700 ring-blue-600/20",
}

type BadgeProps = {
  children: React.ReactNode
  variant?: BadgeVariant
}

export const Badge = ({ children, variant = "neutral" }: BadgeProps) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${variantStyles[variant]}`}
  >
    {children}
  </span>
)
