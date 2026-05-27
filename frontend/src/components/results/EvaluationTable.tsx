import { useMemo } from "react"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useDisplayDigits } from "@/lib/display-digits"
import {
  methodBadgeVariant,
  methodLabel,
  methodShortLabel,
} from "@/lib/method-metadata"
import type { EvaluationEntry, MethodName } from "@/lib/api-types"

interface EvaluationTableProps {
  evaluations: EvaluationEntry[]
  methodsRequested: MethodName[]
}

interface FormattedRow {
  x: string
  bestPx: string
  bestMethod: string
  bestMethodRationale: string
  methodValues: Record<string, string | null>
  fx: string | null
  absoluteError: string | null
}

export function EvaluationTable({ evaluations, methodsRequested }: EvaluationTableProps) {
  const { format, digits } = useDisplayDigits()

  // Format every cell once per (evaluations, digits) tuple. Switching the
  // Display digits ladder previously re-formatted on every render including
  // tooltip hover; now it only fires when the inputs actually change.
  const rows: FormattedRow[] = useMemo(() => {
    return evaluations.map((ev) => {
      const methodValues: Record<string, string | null> = {}
      for (const m of methodsRequested) {
        const v = ev.method_values[m]
        methodValues[m] = v != null ? format(v) : null
      }
      return {
        x: format(ev.x),
        bestPx: format(ev.best_P_x),
        bestMethod: ev.best_method,
        bestMethodRationale: bestMethodRationale(ev.best_method),
        methodValues,
        fx: ev.f_x != null ? format(ev.f_x) : null,
        absoluteError: ev.absolute_error != null ? format(ev.absolute_error) : null,
      }
    })
    // `format` closes over `digits` and is recreated when it changes; depend
    // on `digits` directly so the memo invalidates predictably.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluations, methodsRequested, digits])

  if (evaluations.length === 0) return null

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-5 py-3 border-b bg-muted/30">
        <h2 className="text-sm font-semibold text-foreground">Evaluation Comparison</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          P(x) values across methods with error analysis (absolute error).
        </p>
      </div>
      <div className="p-5">
        <div className="overflow-x-auto rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-label text-muted-foreground">x</TableHead>
                <TableHead className="font-label text-muted-foreground">Best P(x)</TableHead>
                <TableHead className="font-label text-muted-foreground">Method</TableHead>
                {methodsRequested.map((m) => (
                  <TableHead
                    key={m}
                    className="font-label text-muted-foreground"
                    title={methodLabel(m)}
                  >
                    {methodShortLabel(m)}
                  </TableHead>
                ))}
                <TableHead className="font-label text-muted-foreground">f(x)</TableHead>
                <TableHead
                  className="font-label text-muted-foreground"
                  aria-label="absolute error"
                >
                  |Error|
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="font-numeric text-xs font-medium">{row.x}</TableCell>
                  <TableCell className="font-numeric text-xs font-semibold text-primary">
                    {row.bestPx}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={methodBadgeVariant(row.bestMethod)}
                      className="text-[10px]"
                      title={row.bestMethodRationale}
                      aria-label={`${methodLabel(row.bestMethod)}. ${row.bestMethodRationale}`}
                    >
                      {methodLabel(row.bestMethod)}
                    </Badge>
                  </TableCell>
                  {methodsRequested.map((m) => (
                    <TableCell key={m} className="font-numeric text-[11px] text-muted-foreground">
                      {row.methodValues[m] != null ? (
                        row.methodValues[m]
                      ) : (
                        <span className="text-muted-foreground/40" aria-label="not available">·</span>
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="font-numeric text-[11px] text-muted-foreground">
                    {row.fx != null ? row.fx : (
                      <span className="text-muted-foreground/40" aria-label="not available">·</span>
                    )}
                  </TableCell>
                  <TableCell className="font-numeric text-[11px] text-muted-foreground">
                    {row.absoluteError != null ? row.absoluteError : (
                      <span className="text-muted-foreground/40" aria-label="not available">·</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

function bestMethodRationale(method: string): string {
  switch (method) {
    case "barycentric":
      return "Stable evaluator; avoids rebuilding the polynomial at each x."
    case "neville":
      return "Target-specific table; useful when only this x is needed."
    case "newton":
      return "Nested divided differences; efficient once coefficients are known."
    case "lagrange":
      return "Direct basis form; clear construction from the supplied nodes."
    case "newton_forward":
      return "Forward differences fit equally spaced nodes near the first node."
    case "newton_backward":
      return "Backward differences fit equally spaced nodes near the last node."
    case "stirling":
      return "Centered differences fit equally spaced nodes near the midpoint."
    case "hermite_divided_difference":
    case "hermite":
      return "Uses derivative data to match both values and slopes."
    case "taylor":
      return "Local series method; best near the expansion center."
    case "cubic_spline":
      return "Piecewise cubic; smooth between neighboring knots."
    default:
      return "Selected by the backend as the preferred value for this x."
  }
}
