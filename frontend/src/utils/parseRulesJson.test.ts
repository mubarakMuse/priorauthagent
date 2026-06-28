import { describe, expect, it } from "vitest"
import { DEFAULT_RULES_JSON } from "../constants/defaultRules"
import { parseRulesJson } from "./parseRulesJson"

describe("parseRulesJson", () => {
  it("parses the default sample policy", () => {
    const parsed = parseRulesJson(DEFAULT_RULES_JSON)
    expect(parsed.policy.payer).toBe("Meridian Health Plan")
    expect(parsed.policy.rules.length).toBe(4)
  })

  it("rejects invalid JSON", () => {
    expect(() => parseRulesJson("{ bad json")).toThrow()
  })

  it("rejects empty input", () => {
    expect(() => parseRulesJson("")).toThrow()
  })

  it("rejects missing rules array", () => {
    expect(() => parseRulesJson('{"payer":"Test"}')).toThrow()
  })
})
