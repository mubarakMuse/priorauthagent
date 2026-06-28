import defaultRulesFile from "./defaultRules.json"
import { formatRulesJson } from "../utils/parseRulesJson"

export const DEFAULT_RULES_DATA = defaultRulesFile

export const DEFAULT_RULES_JSON = formatRulesJson(defaultRulesFile)
