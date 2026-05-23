/**
 * Shared warning catalog.
 *
 * The backend is the source of truth for warning codes and messages. This
 * module is the display-layer companion: it maps codes to a short label
 * (label voice, uppercase) and to a severity (info vs warning vs error).
 *
 * Keep this in sync with docs/API_CONTRACT.md when codes change.
 */

export type WarningSeverity = "info" | "warning" | "error"

interface WarningMeta {
  label: string
  severity: WarningSeverity
}

const CATALOG: Record<string, WarningMeta> = {
  // Informational notices (cyan): pedagogical or process-level signals.
  nodes_reordered: { label: "Nodes Reordered", severity: "info" },
  expanded_polynomial_omitted: { label: "Polynomial Omitted", severity: "info" },
  neville_requires_evaluation_x: { label: "Neville Info", severity: "info" },

  // Numerical caution (amber): the result is valid but flagged.
  high_degree_warning: { label: "High Degree", severity: "warning" },
  runge_warning: { label: "Runge Phenomenon", severity: "warning" },
  close_x_warning: { label: "Close X-Values", severity: "warning" },
  extrapolation_warning: { label: "Extrapolation", severity: "warning" },
  method_disagreement_warning: { label: "Method Disagreement", severity: "warning" },
  graph_sampling_domain_error: { label: "Graph Domain Error", severity: "warning" },

  // Method-level failure surfaced as a warning on the response (the rest
  // of the response can still be partial). Use coral but route through the
  // warning channel because the response has status "ok" or "partial".
  method_failed: { label: "Method Failed", severity: "error" },
}

export function getWarningMeta(code: string): WarningMeta {
  return CATALOG[code] ?? { label: code, severity: "warning" }
}

export function getWarningLabel(code: string): string {
  return getWarningMeta(code).label
}

export function getWarningSeverity(code: string): WarningSeverity {
  return getWarningMeta(code).severity
}
