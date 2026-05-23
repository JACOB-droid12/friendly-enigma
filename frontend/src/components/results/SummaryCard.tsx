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
 *   the selected method card.
 *
 *   Neville is target-specific and informational, so it carries the cyan
 *   info tint; this is the same hue used for "nodes reordered" and other
 *   non-error notices, keeping cyan's meaning consistent app-wide.
 */
type BadgeVariant = "default" | "secondary" | "info"

const METHOD_BADGE: Record<MethodName, BadgeVariant> = {
  lagrange: "secondary",
  newton: "secondary",
  barycentric: "default",
  neville: "info",
}

export function SummaryCard({ data }: SummaryCardProps) {
  const { input_summary, degree, nodes, warnings } = data
  const exact = input_summary.exact

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

        <div className="mt-4 flex flex-wrap gap-1.5">
          {input_summary.methods_requested.map((m) => (
            <Badge key={m} variant={METHOD_BADGE[m]} className="capitalize text-[11px]">
              {m}
            </Badge>
          ))}
          {warnings.length > 0 && (
            <Badge variant="warning" className="text-[11px]">
              {warnings.length} {warnings.length === 1 ? "warning" : "warnings"}
            </Badge>
          )}
          {input_summary.sorted_nodes && (
            <Badge variant="outline" className="text-[11px]">Reordered</Badge>
          )}
        </div>
      </div>
    </div>
  )
}
