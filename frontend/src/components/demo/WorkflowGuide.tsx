import { WORKFLOW_STEPS } from "../../constants/workflow"

export const WorkflowGuide = () => (
  <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
    <h2 className="text-sm font-semibold text-blue-900">How this demo maps to production</h2>
    <p className="mt-1 text-xs text-blue-800/80">
      Each step below is what you are watching live. The right column shows what a care team would do in a real workflow.
    </p>
    <ol className="mt-4 space-y-3">
      {WORKFLOW_STEPS.map(({ step, title, demo, production }) => (
        <li key={step} className="grid gap-1 sm:grid-cols-[auto_1fr] sm:gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
            {step}
          </span>
          <div>
            <p className="text-sm font-medium text-slate-900">{title}</p>
            <p className="text-xs text-slate-600">
              <span className="font-medium text-blue-700">Demo:</span> {demo}
            </p>
            <p className="text-xs text-slate-500">
              <span className="font-medium">Production:</span> {production}
            </p>
          </div>
        </li>
      ))}
    </ol>
  </section>
)
