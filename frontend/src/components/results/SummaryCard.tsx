import { Badge } from "@/components/ui/badge"
import {
  FAMILY_LABEL,
  FAMILY_ORDER,
  groupMethodsByFamily,
  methodBadgeVariant,
  methodLabel,
} from "@/lib/method-metadata"
import type { InterpolateResponse } from "@/lib/api-types"

interface SummaryCardProps {
  data: InterpolateResponse
}

/**
 * Per-method role taxonomy lives in `lib/method-metadata.ts`. SummaryCard
 * reads it through helpers (`methodBadgeVariant`, `methodLabel`,
 * `groupMethodsByFamily`) so no method label or color mapping lives in
 * this file.
 *
 * Construction methods stay neutral; Barycentric is the unique source of
 * graph data and gets the primary tint; Neville is target-specific and
 * gets info-cyan; Phase 2 methods reuse `secondary`. The deferred chip
 * for `osculating` is rendered on the Method Selector card, not here.
 *
 * Family taxonomy used to group the methods row by family per design.md
 * §8.2 and §10.3 also lives in `lib/method-metadata.ts`. Adding a new
 * family or reordering families requires editing that registry, not
 * this component.
 */

export function SummaryCard({ data }: SummaryCardProps) {
  const { input_summary, degree, nodes, warnings } = data
  const exact = input_summary.exact

  // Bucket requested methods by family in canonical catalog order
  // (design.md §10.3). The metadata registry handles ordering and family
  // resolution.
  const byFamily = groupMethodsByFamily(input_summary.methods_requested)

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
                    <Badge
                      key={m}
                      variant={methodBadgeVariant(m)}
                      className="text-[11px]"
                    >
                      {methodLabel(m)}
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
