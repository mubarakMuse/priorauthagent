import { HARDCODED_CONFIG } from "../../constants/hardcodedConfig"
import type { PolicyOverview } from "../../types/policy"
import { Modal } from "../ui/Modal"
import { PolicyReference } from "./PolicyReference"

type PolicyConfigModalProps = {
  isOpen: boolean
  onClose: () => void
  policy: PolicyOverview | null
  rulesSource?: "sample" | "custom" | "invalid"
}

export const PolicyConfigModal = ({
  isOpen,
  onClose,
  policy,
  rulesSource = "sample",
}: PolicyConfigModalProps) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="Policy & configuration"
    description={
      rulesSource === "custom"
        ? "Your configured payer rules and other hardcoded demo settings."
        : "The payer rules used in this demo and other hardcoded settings."
    }
    wide
  >
    {policy ? (
      <div className="mb-8">
        {rulesSource === "custom" && (
          <p className="mb-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
            Using rules you pasted or loaded in the setup panel.
          </p>
        )}
        <PolicyReference policy={policy} embedded />
      </div>
    ) : (
      <p className="mb-8 text-sm text-slate-500">
        No valid rules loaded — paste or load a sample policy in the setup panel.
      </p>
    )}

    <div>
      <h3 className="text-sm font-semibold text-slate-900">Hardcoded in this demo</h3>
      <p className="mt-1 text-xs text-slate-500">
        Production would pull live payer policies from a database or payer API.
      </p>
      <ul className="mt-4 space-y-3">
        {HARDCODED_CONFIG.map((item) => (
          <li
            key={item.area}
            className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3"
          >
            <p className="text-sm font-medium text-slate-900">{item.area}</p>
            <p className="mt-0.5 font-mono text-xs text-blue-600">{item.location}</p>
            <p className="mt-1 text-xs text-slate-600">{item.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  </Modal>
)
