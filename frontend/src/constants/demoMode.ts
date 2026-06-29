export type DemoExperienceMode = "simple" | "advanced"

export const DEMO_MODE_STORAGE_KEY = "priorauth-demo-mode"

export const loadDemoMode = (): DemoExperienceMode => {
  if (typeof window === "undefined") return "simple"
  const stored = window.localStorage.getItem(DEMO_MODE_STORAGE_KEY)
  if (stored === "advanced" || stored === "simple") return stored
  return "simple"
}

export const saveDemoMode = (mode: DemoExperienceMode) => {
  window.localStorage.setItem(DEMO_MODE_STORAGE_KEY, mode)
}

export const DEMO_MODE_LABELS: Record<
  DemoExperienceMode,
  { label: string; description: string }
> = {
  simple: {
    label: "Quick demo",
    description: "Preloaded note, policy in plain English, one-click run",
  },
  advanced: {
    label: "Full setup",
    description: "Edit rules JSON, upload PDFs, configure everything",
  },
}
