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

  // Phase 2 additions. Severity is display-only per design.md §11; the
  // backend remains the source of truth for whether a code is informational,
  // a numerical caution, or a method-level failure. See requirements R1.5,
  // R11.2, R12.4.
  unequal_spacing: { label: "Unequal Spacing", severity: "warning" },
  stirling_requires_centered_nodes: { label: "Stirling Center Required", severity: "warning" },
  target_not_recommended_for_method: { label: "Target Outside Recommended Region", severity: "info" },
  missing_derivative_data: { label: "Missing Derivative Data", severity: "error" },
  invalid_derivative_order: { label: "Invalid Derivative Order", severity: "error" },
  unsupported_taylor_function: { label: "Unsupported Taylor Function", severity: "error" },
  unsupported_boundary_condition: { label: "Unsupported Boundary Condition", severity: "error" },
  piecewise_method_no_global_polynomial: { label: "Piecewise — No Global Polynomial", severity: "info" },
  method_not_implemented: { label: "Method Not Implemented", severity: "warning" },
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
