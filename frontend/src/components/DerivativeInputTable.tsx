import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/**
 * Props for {@link DerivativeInputTable}. The component is purely
 * presentational — it does not own state, does not call the API, and
 * does no math. All numeric values stay as strings at the API
 * boundary (R1.4). The parent (`InputPanel.tsx`) is responsible for
 * keeping `derivatives` in lockstep with `xs` across node add/remove
 * operations; this component cooperates by always emitting an
 * `onChange` payload of length `xs.length`.
 */
export interface DerivativeInputTableProps {
  /**
   * Read-only x values for each node, in row order. Strings as the
   * user typed them in `PointsInput` / `XValuesInput` — preserved
   * verbatim at the API boundary.
   */
  xs: string[]
  /**
   * Current derivative entries. Length should match `xs.length`; the
   * parent is responsible for keeping the array in lockstep with
   * `xs`. Shorter arrays render as empty `value` cells; entries past
   * `xs.length` are ignored.
   */
  derivatives: Array<{ x: string; value: string }>
  /**
   * Called with the next derivatives array when the user edits a
   * `value` cell. The emitted array always has length `xs.length`.
   */
  onChange: (next: Array<{ x: string; value: string }>) => void
  /** Optional class for the outermost wrapper. */
  className?: string
}

/**
 * Adaptive Input Panel block (R5.3, R5.4) that lets the user enter
 * `f'(x_i)` per node for the Derivative-Data Family methods
 * (`hermite_divided_difference`, `hermite`, and the deferred
 * `osculating`). Layout mirrors the labelled-grid conventions in
 * `PointsInput` and the index/numeric voice used by
 * `BarycentricDetails`'s weights table — no new design tokens are
 * introduced (R13).
 *
 * Rendered cells:
 * - `i`: row index in numeric voice (read-only).
 * - `x_i`: corresponding entry from `xs`, also in numeric voice
 *   (read-only display).
 * - `f'(x_i)`: editable string input bound to `derivatives[i].value`.
 *
 * Lockstep behavior (R5.3 acceptance): when the user edits row `i`,
 * `onChange` is called with a fresh array of length `xs.length`. The
 * edited row carries `{ x: xs[i], value: <new string> }`; non-edited
 * rows reuse the existing derivative entry when present and fall
 * back to `{ x: xs[k], value: "" }` when missing. Entries past
 * `xs.length` are dropped, which honors the "removing a node row
 * updates the derivative rows in lockstep" acceptance criterion.
 *
 * The helper paragraph reflects the current backend posture: only
 * first-derivative data is supported, so `order = 1` is injected by
 * the request builder (`buildDerivatives` in `App.tsx`). The
 * component itself does not surface or accept an `order` field.
 *
 * Default-exported to match the convention used by
 * `EqualSpacingHint`.
 */
export default function DerivativeInputTable({
  xs,
  derivatives,
  onChange,
  className,
}: DerivativeInputTableProps) {
  function handleValueChange(index: number, nextValue: string) {
    const next: Array<{ x: string; value: string }> = []
    for (let k = 0; k < xs.length; k += 1) {
      if (k === index) {
        next.push({ x: xs[k] ?? "", value: nextValue })
      } else if (k < derivatives.length) {
        next.push(derivatives[k])
      } else {
        next.push({ x: xs[k] ?? "", value: "" })
      }
    }
    onChange(next)
  }

  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="font-label text-foreground">Derivative Data</h3>
      <p className="text-xs text-muted-foreground">
        Hermite currently supports first-derivative data only (order = 1).
      </p>

      {xs.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Add at least one node above to enter a derivative.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead
                  className="font-label text-muted-foreground px-3 py-2"
                  aria-label="row index"
                >
                  i
                </TableHead>
                <TableHead
                  className="font-label text-muted-foreground px-3 py-2"
                  aria-label="x sub i (input value)"
                >
                  x<sub aria-hidden="true">i</sub>
                </TableHead>
                <TableHead
                  className="font-label text-muted-foreground px-3 py-2"
                  aria-label="f prime of x sub i (first derivative)"
                >
                  f&prime;(x<sub aria-hidden="true">i</sub>)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {xs.map((x, i) => {
                const entry = i < derivatives.length ? derivatives[i] : undefined
                const value = entry?.value ?? ""
                return (
                  <TableRow key={i}>
                    <TableCell className="font-numeric tabular-nums text-[11px] py-2 px-3 text-muted-foreground">
                      {i}
                    </TableCell>
                    <TableCell className="font-numeric tabular-nums text-[11px] py-2 px-3">
                      {x ?? ""}
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <Input
                        value={value}
                        onChange={(e) => handleValueChange(i, e.target.value)}
                        className="font-numeric text-sm h-8"
                        aria-label={`Derivative value for node ${i}`}
                        placeholder=""
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
