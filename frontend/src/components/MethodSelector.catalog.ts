import type { MethodName } from "@/lib/api-types"

/**
 * Method catalog data for the Method Selector (Phase 2 Frontend Workbench, §8.1–§8.4).
 *
 * This file is the single source of truth for the family-grouped catalog
 * rendered by `MethodSelector.tsx`. It is data only — no React, no DOM,
 * no math. Phase 2 task A1.14 ships this catalog file independently of
 * the selector refactor (task 3.1) so the data is available to other
 * leaves without touching `MethodSelector.tsx` yet.
 *
 * Hard rules:
 *   - Field names and group order match `design.md` §8.1, §8.2, §8.3, §8.4.
 *   - V1 labels (`Lagrange`, `Newton`, `Barycentric`, `Neville`) are kept
 *     exactly as currently rendered by `MethodSelector.tsx` to avoid any
 *     visible V1 label change (R12.1).
 *   - Eligibility hints appear only on Equal-Spacing Family entries (R4.3).
 *   - The deferred badge is set only on `osculating` (R4.4, R10.1).
 *   - Barycentric is the only entry with `highlight: true` (preserved from
 *     the existing V1 selector).
 */

export type MethodFamily =
  | "construction"
  | "stable_evaluator"
  | "target_specific"
  | "equal_spacing"
  | "derivative_data"
  | "function_derivative"
  | "piecewise"

export interface MethodCatalogEntry {
  value: MethodName
  label: string
  family: MethodFamily
  role: string
  highlight?: boolean
  description: string
  eligibilityHint?: string
  deferred?: boolean
  deferredNote?: string
}

const EQUAL_SPACING_HINT = "Requires equally spaced nodes."

const OSCULATING_DEFERRED_NOTE =
  "Backend currently returns a method-level error; see Methods tab for details."

export const METHOD_CATALOG: MethodCatalogEntry[] = [
  // Construction (V1)
  {
    value: "lagrange",
    label: "Lagrange",
    family: "construction",
    role: "Construction",
    description: "Lagrange shows basis polynomials and summation form.",
  },
  {
    value: "newton",
    label: "Newton",
    family: "construction",
    role: "Construction",
    description: "Newton shows divided-difference tables and nested form.",
  },

  // Stable Evaluator (V1)
  {
    value: "barycentric",
    label: "Barycentric",
    family: "stable_evaluator",
    role: "Stable Evaluator",
    highlight: true,
    description:
      "Barycentric provides stable evaluation and is the source for graph data.",
  },

  // Target-Specific (V1)
  {
    value: "neville",
    label: "Neville",
    family: "target_specific",
    role: "Target-Specific",
    description: "Neville produces target-specific triangular tables.",
  },

  // Equal Spacing (Phase 2)
  {
    value: "newton_forward",
    label: "Newton Forward",
    family: "equal_spacing",
    role: "Equal Spacing",
    description: "Forward differences near the first nodes.",
    eligibilityHint: EQUAL_SPACING_HINT,
  },
  {
    value: "newton_backward",
    label: "Newton Backward",
    family: "equal_spacing",
    role: "Equal Spacing",
    description: "Backward differences near the last nodes.",
    eligibilityHint: EQUAL_SPACING_HINT,
  },
  {
    value: "stirling",
    label: "Stirling",
    family: "equal_spacing",
    role: "Equal Spacing",
    description: "Centered differences near a chosen midpoint.",
    eligibilityHint: EQUAL_SPACING_HINT,
  },

  // Derivative Data (Phase 2)
  {
    value: "hermite_divided_difference",
    label: "Hermite Divided Difference",
    family: "derivative_data",
    role: "Derivative Data",
    description: "Repeated-node divided differences using f'(x_i).",
  },
  {
    value: "hermite",
    label: "Hermite",
    family: "derivative_data",
    role: "Derivative Data",
    description: "Hermite construction with optional basis form output.",
  },
  {
    value: "osculating",
    label: "Osculating",
    family: "derivative_data",
    role: "Derivative Data",
    description: "Generalized derivative matching.",
    deferred: true,
    deferredNote: OSCULATING_DEFERRED_NOTE,
  },

  // Function Derivative (Phase 2)
  {
    value: "taylor",
    label: "Taylor",
    family: "function_derivative",
    role: "Function Derivative",
    description: "Local Taylor / Maclaurin polynomial around a center.",
  },

  // Piecewise (Phase 2)
  {
    value: "cubic_spline",
    label: "Cubic Spline",
    family: "piecewise",
    role: "Piecewise",
    description: "Natural cubic spline segments tied at interior knots.",
  },
]
