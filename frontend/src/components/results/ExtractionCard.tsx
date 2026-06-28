import type { ClinicalExtraction } from "../../types"
import { Badge } from "../ui/Badge"
import { Card } from "../ui/Card"

type ExtractionCardProps = {
  extraction: ClinicalExtraction
  stepLabel?: string
  stepNumber?: number
  onExplainStep?: (step: number) => void
}

const ListSection = ({
  title,
  items,
  emptyText,
}: {
  title: string
  items: React.ReactNode[]
  emptyText: string
}) => (
  <div>
    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {title}
    </h3>
    {items.length === 0 ? (
      <p className="text-sm text-slate-400 italic">{emptyText}</p>
    ) : (
      <ul className="space-y-2">{items}</ul>
    )}
  </div>
)

export const ExtractionCard = ({
  extraction,
  stepLabel,
  stepNumber,
  onExplainStep,
}: ExtractionCardProps) => (
  <Card
    title="Clinical extraction"
    subtitle="Structured data pulled from the note"
    stepLabel={stepLabel}
    stepNumber={stepNumber}
    onExplainStep={onExplainStep}
    icon={
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    }
  >
    <blockquote className="mb-6 rounded-xl border-l-4 border-blue-500 bg-blue-50/50 px-4 py-3 text-sm italic text-slate-700">
      {extraction.patient_summary}
    </blockquote>

    <div className="grid gap-6 sm:grid-cols-3">
      <ListSection
        title="Diagnoses"
        emptyText="None extracted"
        items={extraction.diagnoses.map((d, i) => (
          <li key={i} className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <span className="text-slate-800">{d.description}</span>
            {d.icd10_code && <Badge variant="brand">{d.icd10_code}</Badge>}
          </li>
        ))}
      />
      <ListSection
        title="Procedures"
        emptyText="None extracted"
        items={extraction.procedures.map((p, i) => (
          <li key={i} className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <span className="text-slate-800">{p.description}</span>
            {p.cpt_code && <Badge variant="neutral">CPT {p.cpt_code}</Badge>}
          </li>
        ))}
      />
      <ListSection
        title="Medications"
        emptyText="None extracted"
        items={extraction.medications.map((m, i) => (
          <li key={i} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-800">
            {m.name}
            {m.dosage && <span className="text-slate-500"> — {m.dosage}</span>}
          </li>
        ))}
      />
    </div>
  </Card>
)
