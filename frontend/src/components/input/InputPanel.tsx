import type { InputMode } from "../../types"

type InputPanelProps = {
  mode: InputMode
  onModeChange: (mode: InputMode) => void
  note: string
  onNoteChange: (note: string) => void
  selectedFile: File | null
  onFileChange: (file: File | null) => void
  loading: boolean
  onSubmitNote: () => void
  onSubmitPdf: () => void
}

const modes: { id: InputMode; label: string; icon: string }[] = [
  { id: "note", label: "Paste note", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
  { id: "pdf", label: "Upload PDF", icon: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
]

export const InputPanel = ({
  mode,
  onModeChange,
  note,
  onNoteChange,
  selectedFile,
  onFileChange,
  loading,
  onSubmitNote,
  onSubmitPdf,
}: InputPanelProps) => {
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileChange(e.target.files?.[0] ?? null)
  }

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file?.type === "application/pdf") {
      onFileChange(file)
      onModeChange("pdf")
    }
  }

  const canSubmitNote = !loading && note.trim().length > 0
  const canSubmitPdf = !loading && selectedFile !== null

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Clinical input</h2>
        <p className="mt-1 text-sm text-slate-500">
          Provide a clinical note to start the prior authorization pipeline.
        </p>
      </div>

      <div
        className="mb-6 flex rounded-xl bg-slate-100 p-1"
        role="tablist"
        aria-label="Input method"
      >
        {modes.map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => onModeChange(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              mode === id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
            </svg>
            {label}
          </button>
        ))}
      </div>

      {mode === "note" ? (
        <div role="tabpanel">
          <label htmlFor="clinical-note" className="sr-only">
            Clinical note
          </label>
          <textarea
            id="clinical-note"
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            rows={14}
            placeholder="Paste the clinical note here — include diagnoses, procedures, medications, and plan..."
            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <button
            type="button"
            onClick={onSubmitNote}
            disabled={!canSubmitNote}
            aria-label="Run prior authorization pipeline"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-300 disabled:shadow-none"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Processing...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Run pipeline
              </>
            )}
          </button>
        </div>
      ) : (
        <div role="tabpanel">
          <label
            htmlFor="pdf-upload"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 transition hover:border-blue-400 hover:bg-blue-50/30"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-900">
              Drop PDF here or click to browse
            </p>
            <p className="mt-1 text-xs text-slate-500">PDF with extractable text only</p>
            <input
              id="pdf-upload"
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileInput}
              className="sr-only"
            />
          </label>

          {selectedFile && (
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
              <svg className="h-5 w-5 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
              <span className="truncate text-sm font-medium text-slate-700">{selectedFile.name}</span>
            </div>
          )}

          <button
            type="button"
            onClick={onSubmitPdf}
            disabled={!canSubmitPdf}
            aria-label="Process PDF through pipeline"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-teal-600/25 transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-teal-300 disabled:shadow-none"
          >
            {loading ? "Processing..." : "Process PDF"}
          </button>
        </div>
      )}
    </div>
  )
}
