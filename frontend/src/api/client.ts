import type { PipelineResponse } from "../types"
import type { PolicyOverview } from "../types/policy"

const API_BASE = import.meta.env.VITE_API_BASE ?? ""

const parseErrorDetail = async (
  response: Response,
  fallback: string
): Promise<string> => {
  const contentType = response.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    const err = await response.json()
    return err.detail || fallback
  }

  const text = await response.text()
  const lower = text.toLowerCase()

  if (
    response.status === 504 ||
    lower.includes("504 gateway time-out") ||
    lower.includes("error: the request could not be satisfied")
  ) {
    return "The request timed out. The AI pipeline can take up to 2 minutes — please try again."
  }

  if (response.status === 502 || lower.includes("502 bad gateway")) {
    return "The API is temporarily unavailable. Wait a moment and try again."
  }

  if (text.trim().startsWith("<!") || text.trim().startsWith("<HTML")) {
    return `${fallback} (HTTP ${response.status}). The server returned an HTML error page instead of JSON.`
  }

  return text.slice(0, 200) || `${fallback} (HTTP ${response.status})`
}

export const processClinicalNote = async (
  clinicalNote: string,
  rules?: unknown
): Promise<PipelineResponse> => {
  const response = await fetch(`${API_BASE}/api/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clinical_note: clinicalNote,
      rules: rules ?? undefined,
    }),
  })

  if (!response.ok) {
    throw new Error(await parseErrorDetail(response, "Request failed"))
  }

  return response.json()
}

export const processPdf = async (
  file: File,
  rules?: unknown
): Promise<PipelineResponse> => {
  const formData = new FormData()
  formData.append("file", file)
  if (rules !== undefined) {
    formData.append("rules_json", JSON.stringify(rules))
  }

  const response = await fetch(`${API_BASE}/api/process-pdf`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error(await parseErrorDetail(response, "PDF upload failed"))
  }

  return response.json()
}

export const fetchPolicy = async (): Promise<PolicyOverview> => {
  const response = await fetch(`${API_BASE}/api/policy`)
  if (!response.ok) {
    throw new Error("Failed to load payer policy")
  }
  return response.json()
}

export const previewPolicy = async (rules: unknown): Promise<PolicyOverview> => {
  const response = await fetch(`${API_BASE}/api/policy/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rules),
  })

  if (!response.ok) {
    throw new Error(await parseErrorDetail(response, "Invalid rules JSON"))
  }

  return response.json()
}
