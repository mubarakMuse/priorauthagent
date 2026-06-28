type ConfidenceRingProps = {
  score: number
  size?: "sm" | "lg"
}

export const ConfidenceRing = ({ score, size = "lg" }: ConfidenceRingProps) => {
  const pct = Math.round(score * 100)
  const radius = size === "lg" ? 36 : 24
  const stroke = size === "lg" ? 6 : 4
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score * circumference)
  const dimension = (radius + stroke) * 2

  const color =
    score >= 0.8 ? "text-emerald-500" : score >= 0.5 ? "text-amber-500" : "text-red-500"

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: dimension, height: dimension }}>
      <svg width={dimension} height={dimension} className="-rotate-90">
        <circle
          cx={radius + stroke}
          cy={radius + stroke}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-slate-100"
        />
        <circle
          cx={radius + stroke}
          cy={radius + stroke}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${color} transition-all duration-700`}
        />
      </svg>
      <span className={`absolute font-semibold text-slate-900 ${size === "lg" ? "text-sm" : "text-xs"}`}>
        {pct}%
      </span>
    </div>
  )
}
