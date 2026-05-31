import type { MethodName } from "@/lib/api-types"

/**
 * Method metadata registry.
 *
 * Single source of truth for everything the frontend needs to know about
 * a method beyond the schema. Centralized here so MethodSelector,
 * SummaryCard, MethodDetails, EvaluationTable, GuidedExplanation, the
 * Examples panel, and the Method Configuration card all read the same
 * label, family, role, badge variant, and ordering.
 *
 * Three rules:
 *
 *   1. Every key matches the canonical `MethodName` enum from
 *      `api-types.ts`. The compiler enforces exhaustiveness on the
 *      `Record<MethodName, MethodMetadata>` below.
 *
 *   2. The `family`, `role`, `badge`, `description`, and
 *      `eligibilityHint` field preserves the wording already used by
 *      the legacy catalog at `MethodSelector.catalog.ts` so existing
 *      tests and screenshots continue to pass without copy churn.
 *
 *   3. Adding a method here is a backend-aligned schema change. Do not
 *      add UI-only methods. The order of `METHOD_ORDER` is the catalog
 *      order rendered everywhere methods appear in sequence.
 */

export type MethodFamily =
  | "construction"
  | "stable_evaluator"
  | "target_specific"
  | "equal_spacing"
  | "derivative_data"
  | "function_derivative"
  | "piecewise"

/**
 * Badge color variants permitted on method chips. A narrow union
 * matching `Badge`'s `variant` prop keeps callers honest.
 */
export type MethodBadgeVariant = "default" | "secondary" | "info"

export interface MethodMetadata {
  /** Canonical backend identifier. */
  value: MethodName
  /** Full user-facing label, e.g. "Hermite Divided Difference". */
  label: string
  /** Compact label for narrow contexts (table headers, tabs). */
  shortLabel: string
  /** Method family per design.md §8.2. */
  family: MethodFamily
  /**
   * Role tag rendered on selector cards and in the result summary
   * methods row. Same word as `FAMILY_LABEL[family]` for now, kept
   * separate so future taxonomy splits stay possible.
   */
  role: string
  /**
   * Badge variant for use in result surfaces (SummaryCard methods row,
   * EvaluationTable best-method chip, etc). Mirrors the role taxonomy:
   * Barycentric is `default` (primary, the unique source of graph
   * data), Neville is `info`, everything else is `secondary`.
   */
  badge: MethodBadgeVariant
  /** Set on Barycentric only: the unique source of graph data. */
  highlight?: boolean
  /** Set on methods intentionally exposed before their backend implementation. */
  deferred?: boolean
  /** One-sentence description rendered on the selector card. */
  description: string
  /**
   * Eligibility hint rendered on the selector card. Currently only the
   * Equal-Spacing Family carries a hint; other families omit this.
   */
  eligibilityHint?: string
  /** Companion note rendered on deferred selector cards. */
  deferredNote?: string
}

const EQUAL_SPACING_HINT = "Requires equally spaced nodes."

/**
 * Canonical catalog order for every method. Used wherever a list of
 * methods needs to render in a stable order regardless of how the
 * backend echoed them in `methods_requested`.
 */
export const METHOD_ORDER: MethodName[] = [
  "lagrange",
  "newton",
  "barycentric",
  "neville",
  "newton_forward",
  "newton_backward",
  "stirling",
  "hermite_divided_difference",
  "hermite",
  "osculating",
  "taylor",
  "cubic_spline",
]

/**
 * Family render order. Matches design.md §8.2.
 */
export const FAMILY_ORDER: MethodFamily[] = [
  "construction",
  "stable_evaluator",
  "target_specific",
  "equal_spacing",
  "derivative_data",
  "function_derivative",
  "piecewise",
]

export const FAMILY_LABEL: Record<MethodFamily, string> = {
  construction: "Construction",
  stable_evaluator: "Stable Evaluator",
  target_specific: "Target-Specific",
  equal_spacing: "Equal Spacing",
  derivative_data: "Derivative Data",
  function_derivative: "Function Derivative",
  piecewise: "Piecewise",
}

export const METHOD_METADATA: Record<MethodName, MethodMetadata> = {
  lagrange: {
    value: "lagrange",
    label: "Lagrange",
    shortLabel: "Lagrange",
    family: "construction",
    role: "Construction",
    badge: "secondary",
    description: "Lagrange shows basis polynomials and summation form.",
  },
  newton: {
    value: "newton",
    label: "Newton",
    shortLabel: "Newton",
    family: "construction",
    role: "Construction",
    badge: "secondary",
    description: "Newton shows divided-difference tables and nested form.",
  },
  barycentric: {
    value: "barycentric",
    label: "Barycentric",
    shortLabel: "Barycentric",
    family: "stable_evaluator",
    role: "Stable Evaluator",
    badge: "default",
    highlight: true,
    description:
      "Barycentric provides stable evaluation and is the source for graph data.",
  },
  neville: {
    value: "neville",
    label: "Neville",
    shortLabel: "Neville",
    family: "target_specific",
    role: "Target-Specific",
    badge: "info",
    description: "Neville produces target-specific triangular tables.",
  },
  newton_forward: {
    value: "newton_forward",
    label: "Newton Forward",
    shortLabel: "Newton Fwd",
    family: "equal_spacing",
    role: "Equal Spacing",
    badge: "secondary",
    description: "Forward differences near the first nodes.",
    eligibilityHint: EQUAL_SPACING_HINT,
  },
  newton_backward: {
    value: "newton_backward",
    label: "Newton Backward",
    shortLabel: "Newton Bwd",
    family: "equal_spacing",
    role: "Equal Spacing",
    badge: "secondary",
    description: "Backward differences near the last nodes.",
    eligibilityHint: EQUAL_SPACING_HINT,
  },
  stirling: {
    value: "stirling",
    label: "Stirling",
    shortLabel: "Stirling",
    family: "equal_spacing",
    role: "Equal Spacing",
    badge: "secondary",
    description: "Centered differences near a chosen midpoint.",
    eligibilityHint: EQUAL_SPACING_HINT,
  },
  hermite_divided_difference: {
    value: "hermite_divided_difference",
    label: "Hermite Divided Difference",
    shortLabel: "Hermite DD",
    family: "derivative_data",
    role: "Derivative Data",
    badge: "secondary",
    description: "Repeated-node divided differences using f'(x_i).",
  },
  hermite: {
    value: "hermite",
    label: "Hermite",
    shortLabel: "Hermite",
    family: "derivative_data",
    role: "Derivative Data",
    badge: "secondary",
    description: "Hermite construction with optional basis form output.",
  },
  osculating: {
    value: "osculating",
    label: "Osculating",
    shortLabel: "Osculating",
    family: "derivative_data",
    role: "Derivative Data",
    badge: "secondary",
    description: "Generalized interpolation matching selected derivative orders.",
  },
  taylor: {
    value: "taylor",
    label: "Taylor",
    shortLabel: "Taylor",
    family: "function_derivative",
    role: "Function Derivative",
    badge: "secondary",
    description: "Local Taylor / Maclaurin polynomial around a center.",
  },
  cubic_spline: {
    value: "cubic_spline",
    label: "Cubic Spline",
    shortLabel: "Cubic Spline",
    family: "piecewise",
    role: "Piecewise",
    badge: "secondary",
    description: "Natural cubic spline segments tied at interior knots.",
  },
}

/**
 * Treat unknown method strings (e.g. backend code echoed verbatim before
 * the schema is updated) by returning their snake_case as the visible
 * label. This is a safe fallback per the user direction: surface the
 * backend code instead of crashing.
 */
function fallbackMetadata(code: string): MethodMetadata {
  return {
    value: code as MethodName,
    label: code,
    shortLabel: code,
    family: "construction",
    role: "Method",
    badge: "secondary",
    description: "",
  }
}

export function getMethodMetadata(name: string): MethodMetadata {
  const meta = METHOD_METADATA[name as MethodName]
  return meta ?? fallbackMetadata(name)
}

export function methodLabel(name: string): string {
  return getMethodMetadata(name).label
}

export function methodShortLabel(name: string): string {
  return getMethodMetadata(name).shortLabel
}

export function methodBadgeVariant(name: string): MethodBadgeVariant {
  return getMethodMetadata(name).badge
}

export function methodFamily(name: string): MethodFamily | null {
  const meta = METHOD_METADATA[name as MethodName]
  return meta?.family ?? null
}

export function methodRole(name: string): string {
  return getMethodMetadata(name).role
}

/**
 * Sort an arbitrary list of method names into canonical catalog order.
 * Unknown method strings sort to the end and preserve their relative
 * order via stable sort behavior on the index lookup.
 */
const ORDER_INDEX: Record<string, number> = METHOD_ORDER.reduce(
  (acc, name, i) => {
    acc[name] = i
    return acc
  },
  {} as Record<string, number>,
)

export function methodsInOrder(names: readonly string[]): string[] {
  return [...names].sort((a, b) => {
    const ai = ORDER_INDEX[a] ?? Number.MAX_SAFE_INTEGER
    const bi = ORDER_INDEX[b] ?? Number.MAX_SAFE_INTEGER
    return ai - bi
  })
}

/**
 * Group method names by family in canonical order. Used by
 * SummaryCard's methods row.
 */
export function groupMethodsByFamily(
  names: readonly string[],
): Map<MethodFamily, string[]> {
  const out = new Map<MethodFamily, string[]>()
  for (const family of FAMILY_ORDER) {
    out.set(family, [])
  }
  for (const name of names) {
    const family = methodFamily(name)
    if (family) {
      out.get(family)!.push(name)
    }
  }
  // Preserve canonical order within each family.
  for (const [family, list] of out.entries()) {
    out.set(family, methodsInOrder(list))
  }
  return out
}
