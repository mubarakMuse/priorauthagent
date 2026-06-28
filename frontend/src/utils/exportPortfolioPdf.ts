import type { PipelineResponse } from "../types"

const API_BASE = import.meta.env.VITE_API_BASE ?? ""

export const downloadPortfolioPdf = async (result: PipelineResponse): Promise<void> => {
  const response = await fetch(`${API_BASE}/api/export-pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result),
  })

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? ""
    if (contentType.includes("application/json")) {
      const err = await response.json()
      throw new Error(err.detail || "Failed to generate PDF")
    }
    throw new Error(`Failed to generate PDF (HTTP ${response.status})`)
  }

  const blob = await response.blob()
  const disposition = response.headers.get("Content-Disposition") ?? ""
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/)
  const filename = filenameMatch?.[1] ?? "prior-auth-portfolio.pdf"

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
