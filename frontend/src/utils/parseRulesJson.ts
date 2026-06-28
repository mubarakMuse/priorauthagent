import type { PolicyOverview, PolicyRuleDetail, RuleCriterion } from "../types/policy"

export const DEMO_MATCHING_NOTE =
  "Rules match on CPT + any allowed ICD-10 from diagnosis criteria. Each criterion is then validated against structured clinical evidence. Visit limits and injection frequency need claims/EHR data (marked needs_external_data)."

type RawCriterion = {
  id: string
  type: string
  description: string
  required?: boolean
  allowed_icd10?: string[]
}

type RawRule = {
  rule_id: string
  procedure_code: string
  procedure_description?: string
  category?: string
  requires_prior_auth: boolean
  criteria?: RawCriterion[]
  typical_turnaround_days?: number | null
  auto_approve_if_all_met?: boolean | null
  requires_medical_director_review?: boolean | null
}

type RawRulesFile = {
  payer?: string
  plan_type?: string
  ruleset_version?: string
  last_updated?: string
  rules: RawRule[]
}

export type ParsedRules = {
  policy: PolicyOverview
  data: RawRulesFile | RawRule[]
}

const mapCriterion = (criterion: RawCriterion): RuleCriterion => ({
  id: criterion.id,
  type: criterion.type,
  description: criterion.description,
  required: criterion.required ?? true,
  allowed_icd10: criterion.allowed_icd10 ?? [],
})

const mapRule = (rule: RawRule): PolicyRuleDetail => ({
  id: rule.rule_id,
  procedure_cpt: rule.procedure_code,
  description: rule.procedure_description ?? "",
  category: rule.category ?? "General",
  requires_prior_auth: rule.requires_prior_auth,
  criteria: (rule.criteria ?? []).map(mapCriterion),
  typical_turnaround_days: rule.typical_turnaround_days ?? null,
  auto_approve_if_all_met: rule.auto_approve_if_all_met ?? null,
  requires_medical_director_review: rule.requires_medical_director_review ?? null,
})

const validateRule = (rule: RawRule, index: number): string | null => {
  if (!rule.rule_id) return `Rule ${index + 1}: missing rule_id`
  if (!rule.procedure_code) return `Rule ${rule.rule_id}: missing procedure_code`
  if (typeof rule.requires_prior_auth !== "boolean") {
    return `Rule ${rule.rule_id}: requires_prior_auth must be true or false`
  }
  return null
}

export const parseRulesContent = (data: unknown): ParsedRules => {
  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i += 1) {
      const error = validateRule(data[i] as RawRule, i)
      if (error) throw new Error(error)
    }

    const rules = data.map((rule) => mapRule(rule as RawRule))
    return {
      data: data as RawRule[],
      policy: {
        payer: "Unknown",
        plan_type: "",
        ruleset_version: "",
        last_updated: "",
        rules,
        demo_matching_note: DEMO_MATCHING_NOTE,
      },
    }
  }

  if (!data || typeof data !== "object") {
    throw new Error("Rules JSON must be an object or array of rules")
  }

  const file = data as RawRulesFile
  if (!Array.isArray(file.rules)) {
    throw new Error("Rules JSON must include a 'rules' array")
  }

  for (let i = 0; i < file.rules.length; i += 1) {
    const error = validateRule(file.rules[i], i)
    if (error) throw new Error(error)
  }

  const rules = file.rules.map(mapRule)
  return {
    data: file,
    policy: {
      payer: file.payer ?? "Unknown",
      plan_type: file.plan_type ?? "",
      ruleset_version: file.ruleset_version ?? "",
      last_updated: file.last_updated ?? "",
      rules,
      demo_matching_note: DEMO_MATCHING_NOTE,
    },
  }
}

export const parseRulesJson = (json: string): ParsedRules => {
  const trimmed = json.trim()
  if (!trimmed) throw new Error("Paste payer rules JSON or load the sample policy")

  let data: unknown
  try {
    data = JSON.parse(trimmed)
  } catch {
    throw new Error("Invalid JSON — check brackets, quotes, and commas")
  }

  return parseRulesContent(data)
}

export const formatRulesJson = (data: unknown): string => JSON.stringify(data, null, 2)
