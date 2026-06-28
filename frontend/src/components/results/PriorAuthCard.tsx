import type { PriorAuthRequest } from "../../types"
import { Card } from "../ui/Card"

type PriorAuthCardProps = {
  request: PriorAuthRequest | null
  stepLabel?: string
  stepNumber?: number
  onExplainStep?: (step: number) => void
}

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
    <dd className="mt-1 text-sm font-medium text-slate-900">{value}</dd>
  </div>
)

export const PriorAuthCard = ({
  request,
  stepLabel,
  stepNumber,
  onExplainStep,
}: PriorAuthCardProps) => (
  <Card
    title="Prior authorization request"
    subtitle="Draft ready for clinical review"
    stepLabel={stepLabel}
    stepNumber={stepNumber}
    onExplainStep={onExplainStep}
    icon={
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    }
  >
    {!request ? (
      <div className="rounded-xl bg-slate-50 px-4 py-8 text-center">
        <p className="text-sm text-slate-500">
          No prior auth request was generated — no matching rules required one.
        </p>
      </div>
    ) : (
      <div className="space-y-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Field label="Payer" value={request.payer} />
          <Field label="Procedure" value={`${request.procedure_description} (CPT ${request.cpt_code})`} />
          <Field label="Diagnosis" value={`${request.diagnosis_description} (ICD-10 ${request.icd10_code})`} />
        </dl>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Clinical justification
          </h3>
          <p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
            {request.clinical_justification}
          </p>
        </div>

        {request.supporting_facts.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Supporting facts
            </h3>
            <ul className="mt-2 space-y-2">
              {request.supporting_facts.map((fact, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 rounded-lg bg-emerald-50/60 px-3 py-2 text-sm text-slate-700"
                >
                  <span className="mt-0.5 text-emerald-600" aria-hidden="true">✓</span>
                  {fact}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )}
  </Card>
)
