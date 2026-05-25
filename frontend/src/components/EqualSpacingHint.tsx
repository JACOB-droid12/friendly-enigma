import { assessEqualSpacing } from "@/lib/equal-spacing"
import { DEFAULT_DISPLAY_DIGITS, roundNumericString } from "@/lib/format-numeric"
import { cn } from "@/lib/utils"

/**
 * Props for {@link EqualSpacingHint}. Kept narrow on purpose — the
 * component is a leaf renderer that consumes user-entered x-value
 * strings and the helper output, and otherwise has no UI state.
 */
export interface EqualSpacingHintProps {
  /**
   * Raw user-entered x-value strings to inspect for equal spacing.
   * Passed through to `assessEqualSpacing` verbatim; this component
   * does not parse, mutate, or validate the values itself.
   */
  values: string[]
  /**
   * Optional class applied to the outermost wrapper so callers can
   * position the hint within their layout.
   */
  className?: string
}

/**
 * Body-voice eligibility hint for the Equal-Spacing Family methods
 * (`newton_forward`, `newton_backward`, `stirling`).
 *
 * Delegates entirely to `assessEqualSpacing` from
 * `lib/equal-spacing.ts`. The component is purely presentational: no
 * state, no effects, no fetches, no method auto-switching (R6.4).
 * Compute-blocking lives in `App.tsx`'s `isFormBlocked` predicate
 * (R4.5, R5.2); this hint only renders the eligibility status that the
 * helper reports.
 *
 * Numeric token (`h ≈ <value>`) renders in the existing numeric voice
 * (`font-numeric tabular-nums`) so the spacing value lines up with
 * other on-screen numeric output. The surrounding prose stays in the
 * body voice on `text-muted-foreground` to match the inline hints used
 * by `PointsInput`, `XValuesInput`, and `FunctionIntervalInput`.
 */
export default function EqualSpacingHint({
  values,
  className,
}: EqualSpacingHintProps) {
  const result = assessEqualSpacing(values)

  if (result.equallySpaced && result.spacingH !== undefined) {
    const formatted = roundNumericString(
      String(result.spacingH),
      DEFAULT_DISPLAY_DIGITS,
    )
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>
        Spacing appears equal:{" "}
        <span className="font-numeric tabular-nums">h ≈ {formatted}</span>
      </p>
    )
  }

  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      Spacing not equal: {result.reason ?? ""}
    </p>
  )
}
