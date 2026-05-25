import * as React from "react"

import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { SplineBoundaryCondition } from "@/lib/api-types"

/**
 * Props for {@link CubicSplineConfigBlock}. The bound state lives on
 * the App-level `FormState.splineBoundaryCondition` field
 * (see `InputPanel.tsx`); this component is purely presentational.
 */
export interface CubicSplineConfigBlockProps {
  /**
   * The current boundary condition. Constrained to the narrow
   * `SplineBoundaryCondition` literal (currently only `"natural"`)
   * because that is the only value the backend accepts per
   * `docs/API_CONTRACT.md` "P2.4 Natural Cubic Spline Method".
   */
  boundaryCondition: SplineBoundaryCondition
  /**
   * Emit a new boundary condition when the user changes the
   * selection. Only `"natural"` is ever emitted today; the other
   * options in the rendered `<select>` are disabled placeholders
   * carrying a `title` tooltip explaining the deferral
   * (locked decision 5 in `tasks.md`).
   */
  onBoundaryConditionChange: (next: SplineBoundaryCondition) => void
  /** Optional class applied to the outer wrapper. */
  className?: string
}

/**
 * Method-aware configuration block for the natural `cubic_spline`
 * method. Renders only when `cubic_spline` is selected; the gating is
 * the responsibility of `InputPanel.tsx`.
 *
 * Per locked decision 5 in `.kiro/specs/phase-2-frontend-workbench/tasks.md`,
 * the boundary-condition selector keeps non-natural options visible as
 * `disabled` `<option>` placeholders, each carrying a `title`
 * attribute that explains why the value cannot be selected today.
 * This documents the deferred surface in-place without inventing a
 * frontend feature flag and without hiding what the backend already
 * advertises in the contract.
 *
 * The component does no math (R9.6) and introduces no new design
 * tokens, palette, or typographic primitives (R13). It uses the
 * existing native `<Select>` wrapper from `@/components/ui/select`
 * and the existing `<Label>` component for consistency with the
 * other input editors (`FunctionIntervalInput.tsx`, etc.).
 */
export default function CubicSplineConfigBlock({
  boundaryCondition,
  onBoundaryConditionChange,
  className,
}: CubicSplineConfigBlockProps) {
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    // The disabled options use values that are not part of the
    // `SplineBoundaryCondition` literal union, so we narrow defensively
    // before emitting. In practice the browser will never fire a change
    // event for a `disabled` option, but this guard keeps the type
    // boundary honest if the markup is ever edited.
    if (e.target.value === "natural") {
      onBoundaryConditionChange("natural")
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="font-label text-foreground">Cubic Spline Configuration</h3>

      <div className="space-y-1.5">
        <Label
          htmlFor="cubic-spline-boundary"
          className="font-label text-muted-foreground"
        >
          Boundary Condition
        </Label>
        <Select
          id="cubic-spline-boundary"
          value={boundaryCondition}
          onChange={handleChange}
          className="h-8 text-sm"
          aria-describedby="cubic-spline-boundary-help"
        >
          <option value="natural">Natural</option>
          <option
            value="clamped"
            disabled
            title="Backend currently accepts only natural; clamped is deferred."
          >
            Clamped (deferred)
          </option>
          <option
            value="not-a-knot"
            disabled
            title="Backend currently accepts only natural; not-a-knot is deferred."
          >
            Not-a-Knot (deferred)
          </option>
          <option
            value="periodic"
            disabled
            title="Backend currently accepts only natural; periodic is deferred."
          >
            Periodic (deferred)
          </option>
        </Select>
      </div>

      <p
        id="cubic-spline-boundary-help"
        className="text-xs text-muted-foreground leading-relaxed"
      >
        Natural cubic spline ties the second derivative to zero at the
        interval ends.
      </p>
    </div>
  )
}
