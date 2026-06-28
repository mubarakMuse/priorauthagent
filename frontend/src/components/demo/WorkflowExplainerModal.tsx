import { WORKFLOW_STEPS } from "../../constants/workflow"
import { Modal } from "../ui/Modal"

type WorkflowExplainerModalProps = {
  isOpen: boolean
  onClose: () => void
  highlightStep?: number | null
}

export const WorkflowExplainerModal = ({
  isOpen,
  onClose,
  highlightStep,
}: WorkflowExplainerModalProps) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="How the pipeline works"
    description="What each step does in this demo vs. a production prior auth workflow."
    wide
  >
    <ol className="space-y-4">
      {WORKFLOW_STEPS.map(({ step, title, demo, production }) => {
        const highlighted = highlightStep === step
        return (
          <li
            key={step}
            className={`rounded-xl border p-4 ${
              highlighted
                ? "border-blue-300 bg-blue-50 ring-1 ring-blue-200"
                : "border-slate-200 bg-slate-50/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                {step}
              </span>
              <h3 className="font-semibold text-slate-900">{title}</h3>
            </div>
            <p className="mt-3 text-sm text-slate-700">
              <span className="font-medium text-blue-700">This demo:</span> {demo}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              <span className="font-medium">Production:</span> {production}
            </p>
          </li>
        )
      })}
    </ol>
  </Modal>
)
