import type { DemoScenario } from "../types/policy"

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "spine-injection",
    title: "Epidural steroid injection",
    subtitle: "Should match PA-SPINE-001 · prior auth required",
    expectedRuleId: "PA-SPINE-001",
    expectedOutcome: "Draft prior auth request for CPT 62323",
    note: `Patient: 45yo female
Chief complaint: Left leg radicular pain, 8 weeks

Assessment:
- Lumbar radiculopathy (M54.16)
- Failed 8 weeks conservative therapy (NSAIDs + PT)

Imaging: MRI shows L4-L5 disc herniation with nerve root compression

Plan:
- Lumbar epidural steroid injection with imaging guidance (CPT 62323)`,
  },
  {
    id: "microdiscectomy",
    title: "Lumbar microdiscectomy",
    subtitle: "Should match PA-SPINE-002 · medical director review",
    expectedRuleId: "PA-SPINE-002",
    expectedOutcome: "Draft prior auth request for CPT 63030",
    note: `Patient: 52yo male
Chief complaint: Severe left leg pain and numbness

Assessment:
- Lumbar disc displacement with radiculopathy (M51.16)
- Positive straight leg raise, motor weakness
- Failed conservative therapy and prior ESI

Imaging: MRI confirms L5-S1 disc herniation with nerve root compression

Plan:
- Lumbar microdiscectomy, single level (CPT 63030)`,
  },
  {
    id: "mri-lumbar",
    title: "MRI lumbar spine",
    subtitle: "Should match PA-IMAGING-001 · prior auth required",
    expectedRuleId: "PA-IMAGING-001",
    expectedOutcome: "Draft prior auth request for CPT 72148",
    note: `Patient: 38yo male
Chief complaint: Low back pain x 6 weeks

Assessment:
- Low back pain, no red-flag symptoms
- Failed 6 weeks NSAIDs and activity modification

Plan:
- Order MRI lumbar spine without contrast (CPT 72148)`,
  },
  {
    id: "physical-therapy",
    title: "Physical therapy",
    subtitle: "Should match PA-PT-001 · no prior auth needed",
    expectedRuleId: "PA-PT-001",
    expectedOutcome: "Rule matches but no prior auth request generated",
    note: `Patient: 29yo female
Chief complaint: Shoulder impingement

Assessment:
- Rotator cuff tendinopathy
- Within first 12 PT visits this plan year

Plan:
- Therapeutic exercise / physical therapy (CPT 97110), 2x/week x 4 weeks`,
  },
  {
    id: "no-match",
    title: "Knee replacement (no rule)",
    subtitle: "No matching rule in this payer policy",
    expectedRuleId: "—",
    expectedOutcome: "Extraction only — no prior auth draft",
    note: `Patient: 58yo male
Chief complaint: Progressive knee pain, 6 months

Assessment:
- Primary osteoarthritis of right knee (M17.11)
- Failed conservative management (NSAIDs, PT x 8 weeks)

Plan:
- Refer for total knee arthroplasty, right knee (CPT 27447)
- Continue meloxicam 15mg daily until surgery`,
  },
]

export const DEFAULT_SCENARIO = DEMO_SCENARIOS[0]
