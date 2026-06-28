import { useMemo, useState } from "react"
import { processClinicalNote, processPdf } from "./api/client"
import { PipelineProgress, usePipelineProgress } from "./components/demo/PipelineProgress"
import { PolicyConfigModal } from "./components/demo/PolicyConfigModal"
import { WorkflowExplainerModal } from "./components/demo/WorkflowExplainerModal"
import { InputPanel } from "./components/input/InputPanel"
import { RulesEditor } from "./components/input/RulesEditor"
import { Header } from "./components/layout/Header"
import { ResultsView } from "./components/results/ResultsView"
import { DEFAULT_RULES_JSON } from "./constants/defaultRules"
import type { InputMode, PipelineResponse } from "./types"
import type { DemoScenario, PolicyOverview } from "./types/policy"
import { parseRulesJson } from "./utils/parseRulesJson"

type DemoPhase = "input" | "running" | "results"

const App = () => {
  const initialRules = useMemo(() => parseRulesJson(DEFAULT_RULES_JSON), [])

  const [phase, setPhase] = useState<DemoPhase>("input")
  const [mode, setMode] = useState<InputMode>("note")
  const [note, setNote] = useState("")
  const [expectedRuleId, setExpectedRuleId] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [result, setResult] = useState<PipelineResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [rulesJson, setRulesJson] = useState(DEFAULT_RULES_JSON)
  const [policy, setPolicy] = useState<PolicyOverview | null>(initialRules.policy)
  const [rulesError, setRulesError] = useState<string | null>(null)
  const rulesValid = rulesError === null && policy !== null

  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showPolicyModal, setShowPolicyModal] = useState(false)
  const [explainStep, setExplainStep] = useState<number | null>(null)

  const activeProgressStep = usePipelineProgress(phase === "running")

  const activeRulesData = useMemo(() => {
    if (!rulesValid) return null
    try {
      return parseRulesJson(rulesJson).data
    } catch {
      return null
    }
  }, [rulesJson, rulesValid])

  const handleLoadScenario = (scenario: DemoScenario) => {
    setNote(scenario.note)
    setExpectedRuleId(scenario.expectedRuleId)
    setMode("note")
    setSelectedFile(null)
    setError(null)
  }

  const handleTryAgain = () => {
    setPhase("input")
    setResult(null)
    setError(null)
    setNote("")
    setSelectedFile(null)
    setExpectedRuleId(null)
  }

  const handleSubmitNote = async () => {
    if (!activeRulesData) return

    setPhase("running")
    setError(null)
    setResult(null)

    try {
      const data = await processClinicalNote(note, activeRulesData)
      setResult(data)
      if (data.policy) setPolicy(data.policy)
      setPhase("results")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setPhase("input")
    }
  }

  const handleSubmitPdf = async () => {
    if (!selectedFile || !activeRulesData) return

    setPhase("running")
    setError(null)
    setResult(null)
    setExpectedRuleId(null)

    try {
      const data = await processPdf(selectedFile, activeRulesData)
      setResult(data)
      if (data.policy) setPolicy(data.policy)
      setPhase("results")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setPhase("input")
    }
  }

  const handleExplainStep = (step: number) => {
    setExplainStep(step)
    setShowHelpModal(true)
  }

  return (
    <div className="gradient-bg min-h-screen">
      <Header
        onOpenHelp={() => {
          setExplainStep(null)
          setShowHelpModal(true)
        }}
        onOpenPolicy={() => setShowPolicyModal(true)}
      />

      <main className="mx-auto max-w-3xl space-y-5 px-4 py-8 sm:px-6">
        {error && phase === "input" && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800"
          >
            <div>
              <p className="font-semibold">Something went wrong</p>
              <p className="mt-1 text-red-700">{error}</p>
            </div>
          </div>
        )}

        {phase === "input" && (
          <>
            <RulesEditor
              rulesJson={rulesJson}
              onRulesJsonChange={setRulesJson}
              onPolicyChange={setPolicy}
              rulesError={rulesError}
              onRulesErrorChange={setRulesError}
            />
            <InputPanel
              mode={mode}
              onModeChange={setMode}
              note={note}
              onNoteChange={(value) => {
                setNote(value)
                setExpectedRuleId(null)
              }}
              selectedFile={selectedFile}
              onFileChange={setSelectedFile}
              onSubmitNote={handleSubmitNote}
              onSubmitPdf={handleSubmitPdf}
              onLoadScenario={handleLoadScenario}
              rulesValid={rulesValid}
            />
          </>
        )}

        {phase === "running" && (
          <PipelineProgress
            activeStep={activeProgressStep}
            onExplainStep={handleExplainStep}
          />
        )}

        {phase === "results" && result && (
          <ResultsView
            result={result}
            policy={result.policy ?? policy}
            expectedRuleId={expectedRuleId}
            onExplainStep={handleExplainStep}
            onTryAgain={handleTryAgain}
          />
        )}
      </main>

      <WorkflowExplainerModal
        isOpen={showHelpModal}
        onClose={() => {
          setShowHelpModal(false)
          setExplainStep(null)
        }}
        highlightStep={explainStep}
      />

      <PolicyConfigModal
        isOpen={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        policy={policy}
        rulesSource={
          rulesValid && rulesJson.trim() === DEFAULT_RULES_JSON.trim() ? "sample" : "custom"
        }
      />

      <footer className="border-t border-slate-200/80 bg-white/60 py-4 text-center text-xs text-slate-500">
        Demo environment · Review outputs before clinical use
      </footer>
    </div>
  )
}

export default App
