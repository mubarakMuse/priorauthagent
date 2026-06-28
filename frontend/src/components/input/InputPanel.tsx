import { DEMO_SCENARIOS } from "../../constants/demoScenarios"
import type { InputMode } from "../../types"
import type { DemoScenario } from "../../types/policy"

type InputPanelProps = {
  mode: InputMode
  onModeChange: (mode: InputMode) => void
  note: string
  onNoteChange: (note: string) => void
  selectedFile: File | null
  onFileChange: (file: File | null) => void
  onSubmitNote: () => void
  onSubmitPdf: () => void
  onLoadScenario: (scenario: DemoScenario) => void
  rulesValid: boolean
}

const modes: { id: InputMode; label: string }[] = [
  { id: "note", label: "Paste note" },
  { id: "pdf", label: "Upload PDF" },
]

export const InputPanel = ({
  mode,
  onModeChange,
  note,
  onNoteChange,
  selectedFile,
  onFileChange,
  onSubmitNote,
  onSubmitPdf,
  onLoadScenario,
  rulesValid,
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

  const canSubmitNote = rulesValid && note.trim().length > 0
  const canSubmitPdf = rulesValid && selectedFile !== null

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/50">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">2. Clinical note</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Paste a note, upload a PDF, or pick a sample case for each rule.
        </p>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Sample cases
        </p>
        <div className="flex flex-wrap gap-2">
          {DEMO_SCENARIOS.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              onClick={() => onLoadScenario(scenario)}
              title={scenario.subtitle}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-left text-xs transition hover:border-blue-300 hover:bg-blue-50"
            >
              <span className="font-medium text-slate-800">{scenario.title}</span>
              <span className="mt-0.5 block font-mono text-[10px] text-slate-500">
                {scenario.expectedRuleId}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div
        className="mb-5 flex rounded-xl bg-slate-100 p-1"
        role="tablist"
        aria-label="Input method"
      >
        {modes.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => onModeChange(id)}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              mode === id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
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
            rows={10}
            placeholder="Paste clinical note here..."
            className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <button
            type="button"
            onClick={onSubmitNote}
            disabled={!canSubmitNote}
            aria-label="Run prior authorization pipeline"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Run pipeline
          </button>
          {!rulesValid && (
            <p className="mt-2 text-center text-xs text-amber-700">
              Fix payer rules above before running.
            </p>
          )}
        </div>
      ) : (
        <div role="tabpanel">
          <label
            htmlFor="pdf-upload"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 transition hover:border-blue-400 hover:bg-blue-50/30"
          >
            <p className="text-sm font-medium text-slate-900">Drop PDF or click to browse</p>
            <p className="mt-1 text-xs text-slate-500">Extractable text only</p>
            <input
              id="pdf-upload"
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileInput}
              className="sr-only"
            />
          </label>
          {selectedFile && (
            <p className="mt-3 truncate text-center text-sm text-slate-600">{selectedFile.name}</p>
          )}
          <button
            type="button"
            onClick={onSubmitPdf}
            disabled={!canSubmitPdf}
            className="mt-4 flex w-full items-center justify-center rounded-xl bg-teal-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-teal-600/25 transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
          >
            Process PDF
          </button>
          {!rulesValid && (
            <p className="mt-2 text-center text-xs text-amber-700">
              Fix payer rules above before running.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
