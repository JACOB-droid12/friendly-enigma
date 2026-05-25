import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ErrorNotice } from "@/components/ErrorNotice"
import { cn } from "@/lib/utils"
import type { InputMode } from "@/lib/api-types"

/**
 * Props for {@link TaylorConfigBlock}. The component is purely
 * presentational — no state, no fetches, no math. All numeric values
 * stay as strings at the API boundary (R1.4); the request builder in
 * `App.tsx` packages `center` (string) and `order` (integer) into
 * `method_options.taylor` exactly as the backend contract documents.
 */
export interface TaylorConfigBlockProps {
  /**
   * Current input mode from `FormState.mode`. When `"points"`, this
   * block surfaces a body-voice disabled hint instead of the
   * `center` / `order` inputs (R5.5; design.md §7.3) because Taylor
   * requires a function-backed mode per
   * `docs/API_CONTRACT.md` "P2.3 Taylor Method".
   */
  mode: InputMode
  /**
   * Current `method_options.taylor.center` string. Strings are
   * preserved at the API boundary (R1.4); any text is accepted here
   * so the backend can do precise rational/mpmath parsing.
   */
  center: string
  /**
   * Current `method_options.taylor.order` integer (0..20 per the
   * contract).
   */
  order: number
  /**
   * Called when the user edits the `Center` input. Always invoked
   * with the raw string value the user typed — no `parseFloat` /
   * `Number()` is applied at the boundary.
   */
  onCenterChange: (next: string) => void
  /**
   * Called when the user edits the `Order` input. The component
   * forwards `Number(e.target.value)` so the parent can detect
   * non-integer / NaN / out-of-range values via the same
   * `Number.isInteger` + bounds check this component uses to render
   * the inline notice.
   */
  onOrderChange: (next: number) => void
  /** Optional class for the outermost wrapper. */
  className?: string
}

/**
 * Adaptive Input Panel block (R5.5; design.md §7.3) that exposes the
 * `method_options.taylor` configuration: a `center` string and an
 * integer `order` in the range 0..20. The function expression itself
 * is bound to the existing `function` field already rendered by
 * `XValuesInput` / `FunctionIntervalInput`; this block intentionally
 * does NOT introduce a second function input (R5.5 acceptance).
 *
 * Layout follows the side-by-side labelled-grid convention used
 * throughout the input panel (`grid grid-cols-1 sm:grid-cols-2
 * gap-3`); the out-of-range notice mirrors the convention
 * `FunctionIntervalInput.tsx` uses for its node-count input by
 * reusing the shared `ErrorNotice` component with `severity="error"`
 * and `layout="inline"`.
 *
 * Default-exported to match the convention used by
 * `EqualSpacingHint` and `DerivativeInputTable`.
 */
export default function TaylorConfigBlock({
  mode,
  center,
  order,
  onCenterChange,
  onOrderChange,
  className,
}: TaylorConfigBlockProps) {
  // R5.5 / design.md §7.3: in `points` mode Taylor cannot be computed
  // because no function expression is in scope. Surface a small
  // disabled-state hint and short-circuit before rendering the
  // `center` / `order` inputs so the user is not invited to fill in
  // values that the request builder would have to drop.
  if (mode === "points") {
    return (
      <div className={cn("space-y-2", className)}>
        <h3 className="font-label text-foreground">Taylor Configuration</h3>
        <p className="text-xs text-muted-foreground italic">
          Taylor needs a function expression. Switch to X + f(x) or Interval
          mode.
        </p>
      </div>
    )
  }

  // The notice covers three failure modes: non-integer (typed `3.5`),
  // out-of-range below (negative), and out-of-range above (>20). NaN
  // is treated as out-of-range here on purpose so an empty input
  // surfaces the constraint while the user is typing — consistent
  // with how the parent always receives a `number` (which may be NaN).
  const isOrderOutOfRange =
    !Number.isInteger(order) || order < 0 || order > 20

  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="font-label text-foreground">Taylor Configuration</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label
            htmlFor="taylor-center"
            className="font-label text-muted-foreground"
          >
            Center
          </Label>
          <Input
            id="taylor-center"
            value={center}
            onChange={(e) => onCenterChange(e.target.value)}
            className="font-numeric text-sm h-8"
            placeholder="0"
            inputMode="decimal"
            aria-label="Taylor center"
          />
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="taylor-order"
            className="font-label text-muted-foreground"
          >
            Order
          </Label>
          <Input
            id="taylor-order"
            type="number"
            min={0}
            max={20}
            step={1}
            inputMode="numeric"
            value={Number.isFinite(order) ? order : ""}
            onChange={(e) => onOrderChange(Number(e.target.value))}
            className="font-numeric text-sm h-8"
            aria-invalid={isOrderOutOfRange}
            aria-describedby={
              isOrderOutOfRange ? "taylor-order-error" : undefined
            }
          />
        </div>
      </div>
      {isOrderOutOfRange && (
        <ErrorNotice
          id="taylor-order-error"
          code="taylor_order_out_of_range"
          message="Order must be an integer between 0 and 20."
          severity="error"
          layout="inline"
        />
      )}
    </div>
  )
}
