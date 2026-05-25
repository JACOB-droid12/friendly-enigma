import { Badge } from "@/components/ui/badge"
import type { InterpolateResponse, MethodName } from "@/lib/api-types"

interface SummaryCardProps {
  data: InterpolateResponse
}

/**
 * Per-method role taxonomy. Mirrors the role taxonomy in MethodSelector so
 * the badge color a user picked methods with is the same color the result
 * summary echoes back.
 *
 *   Construction methods build the polynomial and read as neutral. They
 *   are the most common selections; tinting them would amplify the wrong
 *   row of the summary.
 *
 *   Barycentric is the unique source of graph data and gets the
 *   interactive primary tint, the same accent used for the active tab and
 *   the selected method card. Phase 2 (per design.md §10.3) preserves
 *   this exactly: Barycentric stays "default" (primary tint) and remains
 *   tagged as Stable Evaluator and graph support — no Phase 2 method is
 *   reframed as a primary classroom construction method.
 *
 *   Neville is target-specific and informational, so it carries the cyan
 *   info tint; this is the same hue used for "nodes reordered" and other
 *   non-error notices, keeping cyan's meaning consistent app-wide.
 *
 *   Phase 2 methods all reuse `secondary` so they read as additional
 *   methods, not as primary or info-tinted accents (per design.md §10.3
 *   and R12.1 / R13.4). The deferred chip for `osculating` is rendered
 *   on the Method Selector card, not here (R10.1, design.md §8.4).
 */
type BadgeVariant = "default" | "secondary" | "info"

const METHOD_BADGE: Record<MethodName, BadgeVariant> = {
  // V1 — preserved exactly per R12.1.
  lagrange: "secondary",
  newton: "secondary",
  barycentric: "default",
  neville: "info",
  // Phase 2 — all reuse `secondary` per design.md §10.3.
  newton_forward: "secondary",
  newton_backward: "secondary",
  stirling: "secondary",
  hermite_divided_difference: "secondary",
  hermite: "secondary",
  osculating: "secondary",
  taylor: "secondary",
  cubic_spline: "secondary",
}

/**
 * Family taxonomy used to group the methods row by family per design.md
 * §8.2 and §10.3. The same taxonomy lives on `MethodSelector` and will be
 * consolidated into a shared `MethodSelector.catalog.ts` once that file
 * lands (task 1.14). Until then this is a local source of truth.
 *
 * TODO(phase-2-frontend-workbench): once
 * `frontend/src/components/MethodSelector.catalog.ts` exists, import
 * `MethodFamily`, `FAMILY_ORDER`, `FAMILY_LABEL`, and `METHOD_FAMILY`
 * from there instead of redeclaring them here.
 */
type MethodFamily =
  | "construction"
  | "stable_evaluator"
  | "target_specific"
  | "equal_spacing"
  | "derivative_data"
  | "function_derivative"
  | "piecewise"

const FAMILY_ORDER: MethodFamily[] = [
  "construction",
  "stable_evaluator",
  "target_specific",
  "equal_spacing",
  "derivative_data",
  "function_derivative",
  "piecewise",
]

const FAMILY_LABEL: Record<MethodFamily, string> = {
  construction: "Construction",
  stable_evaluator: "Stable Evaluator",
  target_specific: "Target-Specific",
  equal_spacing: "Equal Spacing",
  derivative_data: "Derivative Data",
  function_derivative: "Function Derivative",
  piecewise: "Piecewise",
}

const METHOD_FAMILY: Record<MethodName, MethodFamily> = {
  lagrange: "construction",
  newton: "construction",
  barycentric: "stable_evaluator",
  neville: "target_specific",
  newton_forward: "equal_spacing",
  newton_backward: "equal_spacing",
  stirling: "equal_spacing",
  hermite_divided_difference: "derivative_data",
  hermite: "derivative_data",
  osculating: "derivative_data",
  taylor: "function_derivative",
  cubic_spline: "piecewise",
}

/**
 * Catalog order within each family. Matches design.md §8.2.
 * Used to keep methods inside a family in catalog order regardless of
 * the order the backend echoes them in `methods_requested`.
 */
const CATALOG_ORDER: MethodName[] = [
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
const CATALOG_INDEX: Record<MethodName, number> = CATALOG_ORDER.reduce(
  (acc, name, i) => {
    acc[name] = i
    return acc
  },
  {} as Record<MethodName, number>
)

export function SummaryCard({ data }: SummaryCardProps) {
  const { input_summary, degree, nodes, warnings } = data
  const exact = input_summary.exact

  // Bucket requested methods by family so the visual order is family-major
  // and within a family stays in catalog order (design.md §10.3).
  const byFamily = new Map<MethodFamily, MethodName[]>()
  for (const m of input_summary.methods_requested) {
    const family = METHOD_FAMILY[m]
    const existing = byFamily.get(family) ?? []
    existing.push(m)
    byFamily.set(family, existing)
  }
  for (const list of byFamily.values()) {
    list.sort((a, b) => CATALOG_INDEX[a] - CATALOG_INDEX[b])
  }

  const hasMetaChips = warnings.length > 0 || input_summary.sorted_nodes

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Result Summary</h2>
        <Badge
          variant={
            data.status === "ok" ? "success" : data.status === "partial" ? "warning" : "destructive"
          }
        >
          {data.status}
        </Badge>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1">
            <span className="font-label text-muted-foreground">Degree</span>
            <p className="text-xl font-semibold font-numeric text-foreground">{degree}</p>
          </div>
          <div className="space-y-1">
            <span className="font-label text-muted-foreground">Nodes</span>
            <p className="text-xl font-semibold font-numeric text-foreground">{nodes.length}</p>
          </div>
          <div className="space-y-1">
            <span className="font-label text-muted-foreground">Compute precision</span>
            <p className="text-xl font-semibold font-numeric text-foreground">{input_summary.precision}</p>
          </div>
          <div className="space-y-1">
            <span className="font-label text-muted-foreground">Mode</span>
            {/* Tinted chip rather than a body-voice word so the four-cell rhythm
             * stays in the numeric voice. Exact (rationals) reads as primary,
             * the same interactive indigo as Barycentric below; numeric (mpmath
             * floats) reads as info-cyan, same family as the "nodes reordered"
             * and other informational notices. */}
            <p className="leading-none pt-1.5">
              <Badge
                variant={exact ? "default" : "info"}
                className="font-label tracking-[0.05em] h-[22px] px-2"
              >
                {exact ? "Exact" : "Numeric"}
              </Badge>
            </p>
          </div>
        </div>

        {/* Methods row, grouped by family per design.md §10.3. Family
         * order matches the catalog (design.md §8.2). Within a family,
         * methods are listed in catalog order. Family group labels use
         * the existing `font-label` voice — no new typography
         * primitive (R13.3). Empty families are hidden. */}
        <div className="mt-4 space-y-3">
          {FAMILY_ORDER.map((family) => {
            const methods = byFamily.get(family)
            if (!methods || methods.length === 0) return null
            return (
              <div key={family} className="space-y-1.5">
                <span className="font-label text-muted-foreground">{FAMILY_LABEL[family]}</span>
                <div className="flex flex-wrap gap-1.5">
                  {methods.map((m) => (
                    <Badge key={m} variant={METHOD_BADGE[m]} className="capitalize text-[11px]">
                      {m}
                    </Badge>
                  ))}
                </div>
              </div>
            )
          })}
          {hasMetaChips && (
            <div className="flex flex-wrap gap-1.5">
              {warnings.length > 0 && (
                <Badge variant="warning" className="text-[11px]">
                  {warnings.length} {warnings.length === 1 ? "warning" : "warnings"}
                </Badge>
              )}
              {input_summary.sorted_nodes && (
                <Badge variant="outline" className="text-[11px]">Reordered</Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
