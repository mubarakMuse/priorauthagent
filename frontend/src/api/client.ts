import type { JobStatus, JobStatusResponse, PipelineResponse } from "../types"
import type { PolicyOverview } from "../types/policy"

const API_BASE = import.meta.env.VITE_API_BASE ?? ""

const POLL_INTERVAL_MS = 2000
const MAX_POLL_MS = 180_000

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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const submitClinicalNoteJob = async (
  clinicalNote: string,
  rules?: unknown
): Promise<string> => {
  const response = await fetch(`${API_BASE}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clinical_note: clinicalNote,
      rules: rules ?? undefined,
    }),
  })

  if (!response.ok) {
    throw new Error(await parseErrorDetail(response, "Failed to submit job"))
  }

  const data = await response.json()
  return data.job_id as string
}

export const submitPdfJob = async (file: File, rules?: unknown): Promise<string> => {
  const formData = new FormData()
  formData.append("file", file)
  if (rules !== undefined) {
    formData.append("rules_json", JSON.stringify(rules))
  }

  const response = await fetch(`${API_BASE}/api/jobs/pdf`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error(await parseErrorDetail(response, "PDF upload failed"))
  }

  const data = await response.json()
  return data.job_id as string
}

export const getJobStatus = async (jobId: string): Promise<JobStatusResponse> => {
  const response = await fetch(`${API_BASE}/api/jobs/${jobId}`)

  if (!response.ok) {
    throw new Error(await parseErrorDetail(response, "Failed to get job status"))
  }

  return response.json()
}

export const waitForJob = async (
  jobId: string,
  onStatusChange?: (status: JobStatus) => void
): Promise<PipelineResponse> => {
  const started = Date.now()

  while Date.now() - started < MAX_POLL_MS) {
    const status = await getJobStatus(jobId)
    onStatusChange?.(status.status)

    if (status.status === "completed" && status.result) {
      return status.result
    }

    if (status.status === "failed") {
      throw new Error(status.error ?? "Pipeline job failed")
    }

    await sleep(POLL_INTERVAL_MS)
  }

  throw new Error("Pipeline timed out while waiting for results. Please try again.")
}

export const processClinicalNote = async (
  clinicalNote: string,
  rules?: unknown,
  onStatusChange?: (status: JobStatus) => void
): Promise<PipelineResponse> => {
  const jobId = await submitClinicalNoteJob(clinicalNote, rules)
  return waitForJob(jobId, onStatusChange)
}

export const processPdf = async (
  file: File,
  rules?: unknown,
  onStatusChange?: (status: JobStatus) => void
): Promise<PipelineResponse> => {
  const jobId = await submitPdfJob(file, rules)
  return waitForJob(jobId, onStatusChange)
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
