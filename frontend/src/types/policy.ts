export interface RuleCriterion {
  id: string
  type: string
  description: string
  required: boolean
  allowed_icd10: string[]
}

export interface PolicyRuleDetail {
  id: string
  procedure_cpt: string
  description: string
  category: string
  requires_prior_auth: boolean
  criteria: RuleCriterion[]
  typical_turnaround_days: number | null
  auto_approve_if_all_met: boolean | null
  requires_medical_director_review: boolean | null
}

export interface PolicyOverview {
  payer: string
  plan_type: string
  ruleset_version: string
  last_updated: string
  rules: PolicyRuleDetail[]
  demo_matching_note: string
}

export type DemoScenario = {
  id: string
  title: string
  subtitle: string
  expectedRuleId: string
  expectedOutcome: string
  note: string
}
