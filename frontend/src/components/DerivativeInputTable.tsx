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

export type DerivativeInputMode = "first-derivative" | "osculating"

export interface DerivativeFormEntry {
  x: string
  order?: number
  value: string
}

export interface OsculatingOrderFormEntry {
  x: string
  order: number
}

/**
 * Props for {@link DerivativeInputTable}. The component is purely
 * presentational — it does not own state, does not call the API, and
 * does no math. All numeric values stay as strings at the API
 * boundary (R1.4). Only osculating maximum derivative order is parsed
 * as an integer UI control.
 */
export interface DerivativeInputTableProps {
  mode: DerivativeInputMode
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
  derivatives: DerivativeFormEntry[]
  /**
   * Called with the next derivatives array when the user edits a value
   * cell. First-derivative mode emits one order-1 entry per node.
   * Osculating mode emits one entry for every requested derivative
   * order per node when manual values are required.
   */
  onChange: (next: DerivativeFormEntry[]) => void
  /**
   * Osculating maximum order per node. Required only in osculating
   * mode; entries are kept in row order and synced to the current x
   * strings whenever emitted.
   */
  osculatingOrders?: OsculatingOrderFormEntry[]
  /** Called when an osculating maximum order changes. */
  onOsculatingOrdersChange?: (next: OsculatingOrderFormEntry[]) => void
  /**
   * Whether osculating value inputs should render. Point/data mode
   * requires manual derivative values; function-backed modes derive
   * them on the backend from f(x).
   */
  manualValuesRequired?: boolean
  /** Optional class for the outermost wrapper. */
  className?: string
}

/**
 * Adaptive Input Panel block (R5.3, R5.4) for derivative-family
 * request data. Hermite mode preserves the existing one-row-per-node
 * first-derivative behavior. Osculating mode adds max-order controls
 * and, in point/data mode, one manual derivative value input per
 * requested order.
 */
export default function DerivativeInputTable({
  mode,
  xs,
  derivatives,
  onChange,
  osculatingOrders = [],
  onOsculatingOrdersChange,
  manualValuesRequired = true,
  className,
}: DerivativeInputTableProps) {
  function derivativeValue(index: number, order: number) {
    const x = xs[index] ?? ""
    const matchByXAndOrder = derivatives.find(
      (entry) => entry.x === x && (entry.order ?? 1) === order,
    )
    if (matchByXAndOrder) return matchByXAndOrder.value

    if (mode === "first-derivative" && order === 1) {
      return derivatives[index]?.value ?? ""
    }

    return ""
  }

  function maxOrderForNode(index: number) {
    return osculatingOrders[index]?.order ?? 1
  }

  function syncedOrders(overrides: Record<number, number> = {}) {
    return xs.map((x, index) => ({
      x: x ?? "",
      order: overrides[index] ?? maxOrderForNode(index),
    }))
  }

  function osculatingDerivativeEntries(
    overrides: Record<number, number> = {},
    edited?: { index: number; order: number; value: string },
  ) {
    const next: DerivativeFormEntry[] = []
    for (let index = 0; index < xs.length; index += 1) {
      const maxOrder = overrides[index] ?? maxOrderForNode(index)
      for (let order = 1; order <= maxOrder; order += 1) {
        next.push({
          x: xs[index] ?? "",
          order,
          value:
            edited?.index === index && edited.order === order
              ? edited.value
              : derivativeValue(index, order),
        })
      }
    }
    return next
  }

  function handleValueChange(index: number, nextValue: string) {
    const next: DerivativeFormEntry[] = []
    for (let k = 0; k < xs.length; k += 1) {
      if (k === index) {
        next.push({ x: xs[k] ?? "", order: 1, value: nextValue })
      } else {
        next.push({ x: xs[k] ?? "", order: 1, value: derivativeValue(k, 1) })
      }
    }
    onChange(next)
  }

  function handleOsculatingValueChange(index: number, order: number, nextValue: string) {
    onChange(osculatingDerivativeEntries({}, { index, order, value: nextValue }))
  }

  function handleMaxOrderChange(index: number, rawValue: string) {
    const parsed = Number.parseInt(rawValue, 10)
    const order = Number.isFinite(parsed) ? Math.min(10, Math.max(0, parsed)) : 0
    const overrides = { [index]: order }
    onOsculatingOrdersChange?.(syncedOrders(overrides))
    if (manualValuesRequired) {
      onChange(osculatingDerivativeEntries(overrides))
    }
  }

  const isOsculating = mode === "osculating"
  const title = isOsculating ? "Osculating Derivative Orders" : "Derivative Data"

  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="font-label text-foreground">{title}</h3>
      {isOsculating ? (
        <p className="text-xs text-muted-foreground">
          Set the maximum derivative order per node.{" "}
          {manualValuesRequired
            ? "Point mode requires a derivative value for each requested order."
            : "The backend derives derivative values from f(x) for function-backed input."}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Hermite methods use first-derivative data only (order = 1). Enter
          f&prime;(x<sub aria-hidden="true">i</sub>) per node.
        </p>
      )}

      {xs.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {isOsculating
            ? "Current nodes are generated from the interval by the backend, so explicit per-node orders are not available here."
            : "Add at least one node above to enter a derivative."}
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
                  {isOsculating ? (
                    "Maximum order"
                  ) : (
                    <>
                      f&prime;(x<sub aria-hidden="true">i</sub>)
                    </>
                  )}
                </TableHead>
                {isOsculating && manualValuesRequired && (
                  <TableHead
                    className="font-label text-muted-foreground px-3 py-2"
                    aria-label="derivative values"
                  >
                    Derivative values
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {xs.map((x, i) => {
                const maxOrder = maxOrderForNode(i)
                return (
                  <TableRow key={i}>
                    <TableCell className="font-numeric tabular-nums text-[11px] py-2 px-3 text-muted-foreground">
                      {i}
                    </TableCell>
                    <TableCell className="font-numeric tabular-nums text-[11px] py-2 px-3">
                      {x ?? ""}
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      {isOsculating ? (
                        <Input
                          type="number"
                          min={0}
                          max={10}
                          step={1}
                          value={maxOrder}
                          onChange={(e) => handleMaxOrderChange(i, e.target.value)}
                          className="font-numeric text-sm h-8 w-24"
                          aria-label={`Maximum derivative order for node ${i}`}
                        />
                      ) : (
                        <Input
                          value={derivativeValue(i, 1)}
                          onChange={(e) => handleValueChange(i, e.target.value)}
                          className="font-numeric text-sm h-8"
                          aria-label={`Derivative value for node ${i}`}
                          placeholder=""
                        />
                      )}
                    </TableCell>
                    {isOsculating && manualValuesRequired && (
                      <TableCell className="py-2 px-3">
                        <div className="grid gap-2 sm:grid-cols-2">
                          {Array.from({ length: maxOrder }, (_, orderIndex) => {
                            const order = orderIndex + 1
                            return (
                              <Input
                                key={order}
                                value={derivativeValue(i, order)}
                                onChange={(e) =>
                                  handleOsculatingValueChange(i, order, e.target.value)
                                }
                                className="font-numeric text-sm h-8 min-w-32"
                                aria-label={`Derivative order ${order} for node ${i}`}
                                placeholder={`order ${order}`}
                              />
                            )
                          })}
                        </div>
                      </TableCell>
                    )}
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
