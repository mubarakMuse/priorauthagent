import type { PolicyOverview, PolicyRuleDetail } from "../types/policy"

const formatRuleSummary = (rule: PolicyRuleDetail): string[] => {
  const lines: string[] = []

  const authLabel = rule.requires_prior_auth
    ? "Prior authorization required before the procedure"
    : "No prior authorization needed for this procedure"

  lines.push(authLabel)

  const requiredCriteria = rule.criteria.filter((c) => c.required)
  const optionalCriteria = rule.criteria.filter((c) => !c.required)

  if (requiredCriteria.length > 0) {
    lines.push("To get approved, the note must show:")
    requiredCriteria.forEach((c) => {
      lines.push(`• ${c.description}`)
    })
  }

  if (optionalCriteria.length > 0) {
    lines.push("Good to know (optional checks):")
    optionalCriteria.forEach((c) => {
      lines.push(`• ${c.description}`)
    })
  }

  if (rule.typical_turnaround_days !== null && rule.typical_turnaround_days > 0) {
    lines.push(`Typical payer response time: about ${rule.typical_turnaround_days} business days.`)
  }

  if (rule.requires_medical_director_review) {
    lines.push("A medical director must review this request even if criteria are met.")
  }

  if (rule.auto_approve_if_all_met && rule.requires_prior_auth) {
    lines.push("If all required criteria are documented, the payer may auto-approve.")
  }

  return lines
}

export type PlainEnglishPolicySection = {
  ruleId: string
  title: string
  category: string
  requiresPriorAuth: boolean
  summaryLines: string[]
}

export const buildPlainEnglishPolicy = (
  policy: PolicyOverview
): PlainEnglishPolicySection[] =>
  policy.rules.map((rule) => ({
    ruleId: rule.id,
    title: rule.description,
    category: rule.category,
    requiresPriorAuth: rule.requires_prior_auth,
    summaryLines: formatRuleSummary(rule),
  }))

export const buildPolicyIntro = (policy: PolicyOverview): string => {
  const authCount = policy.rules.filter((r) => r.requires_prior_auth).length
  const payer = policy.payer || "This payer"
  const plan = policy.plan_type ? ` (${policy.plan_type})` : ""

  return `${payer}${plan} has ${policy.rules.length} procedure rules in this demo — ${authCount} require prior authorization. When you run the demo, we read your clinical note, find the matching procedure code, and check whether the note satisfies each policy requirement.`
}
