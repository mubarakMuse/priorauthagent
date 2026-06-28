import type { PipelineResponse } from "../types"

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
  if (text.includes("504 Gateway Time-out")) {
    return "The request timed out. The pipeline can take up to 90 seconds — please try again."
  }

  return text.slice(0, 200) || `${fallback} (HTTP ${response.status})`
}

export const processClinicalNote = async (
  clinicalNote: string
): Promise<PipelineResponse> => {
  const response = await fetch(`${API_BASE}/api/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clinical_note: clinicalNote }),
  })

  if (!response.ok) {
    throw new Error(await parseErrorDetail(response, "Request failed"))
  }

  return response.json()
}

export const processPdf = async (file: File): Promise<PipelineResponse> => {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch(`${API_BASE}/api/process-pdf`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error(await parseErrorDetail(response, "PDF upload failed"))
  }

  return response.json()
}
