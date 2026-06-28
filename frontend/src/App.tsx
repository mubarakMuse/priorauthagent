import { useState } from "react"
import { processClinicalNote, processPdf } from "./api/client"
import { InputPanel } from "./components/input/InputPanel"
import { Header } from "./components/layout/Header"
import { ResultsView } from "./components/results/ResultsView"
import { LoadingState } from "./components/ui/LoadingState"
import { SAMPLE_NOTE } from "./constants/sampleNote"
import type { InputMode, PipelineResponse } from "./types"

const App = () => {
  const [mode, setMode] = useState<InputMode>("note")
  const [note, setNote] = useState(SAMPLE_NOTE)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [result, setResult] = useState<PipelineResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmitNote = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = await processClinicalNote(note)
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitPdf = async () => {
    if (!selectedFile) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = await processPdf(selectedFile)
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="gradient-bg min-h-screen">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <InputPanel
            mode={mode}
            onModeChange={setMode}
            note={note}
            onNoteChange={setNote}
            selectedFile={selectedFile}
            onFileChange={setSelectedFile}
            loading={loading}
            onSubmitNote={handleSubmitNote}
            onSubmitPdf={handleSubmitPdf}
          />

          <div className="min-h-[200px]">
            {error && (
              <div
                role="alert"
                className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800"
              >
                <svg className="mt-0.5 h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold">Something went wrong</p>
                  <p className="mt-1 text-red-700">{error}</p>
                </div>
              </div>
            )}

            {loading && <LoadingState />}

            {!loading && result && <ResultsView result={result} />}

            {!loading && !result && !error && (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 px-8 py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-slate-700">Results will appear here</h3>
                <p className="mt-2 max-w-xs text-sm text-slate-500">
                  Paste a clinical note or upload a PDF, then run the pipeline to see extraction, rules, and your draft request.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200/80 bg-white/60 py-6 text-center text-xs text-slate-500">
        Prior Auth Agent · For clinical workflow assistance · Review all outputs before submission
      </footer>
    </div>
  )
}

export default App
