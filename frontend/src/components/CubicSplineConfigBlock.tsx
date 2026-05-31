import * as React from "react"

import { Input } from "@/components/ui/input"
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
   * The current boundary condition. Values match the backend schema.
   */
  boundaryCondition: SplineBoundaryCondition
  /**
   * Emit a new boundary condition when the user changes the selection.
   */
  onBoundaryConditionChange: (next: SplineBoundaryCondition) => void
  /** Clamped left endpoint first-derivative string. */
  leftDerivative: string
  /** Clamped right endpoint first-derivative string. */
  rightDerivative: string
  /** Emit clamped left endpoint derivative edits. */
  onLeftDerivativeChange: (next: string) => void
  /** Emit clamped right endpoint derivative edits. */
  onRightDerivativeChange: (next: string) => void
  /** Optional class applied to the outer wrapper. */
  className?: string
}

/**
 * Method-aware configuration block for `cubic_spline`. Renders only
 * when `cubic_spline` is selected; the gating is the responsibility
 * of `InputPanel.tsx`. The component does no spline math.
 */
export default function CubicSplineConfigBlock({
  boundaryCondition,
  onBoundaryConditionChange,
  leftDerivative,
  rightDerivative,
  onLeftDerivativeChange,
  onRightDerivativeChange,
  className,
}: CubicSplineConfigBlockProps) {
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value
    if (
      next === "natural" ||
      next === "clamped" ||
      next === "not-a-knot" ||
      next === "periodic"
    ) {
      onBoundaryConditionChange(next)
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
          <option value="clamped">Clamped</option>
          <option value="not-a-knot">Not-a-Knot</option>
          <option value="periodic">Periodic</option>
        </Select>
      </div>

      {boundaryCondition === "clamped" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="cubic-spline-left-derivative"
              className="font-label text-muted-foreground"
            >
              Left endpoint derivative
            </Label>
            <Input
              id="cubic-spline-left-derivative"
              value={leftDerivative}
              onChange={(e) => onLeftDerivativeChange(e.target.value)}
              className="font-numeric h-8 text-sm"
              aria-label="Left endpoint derivative"
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="cubic-spline-right-derivative"
              className="font-label text-muted-foreground"
            >
              Right endpoint derivative
            </Label>
            <Input
              id="cubic-spline-right-derivative"
              value={rightDerivative}
              onChange={(e) => onRightDerivativeChange(e.target.value)}
              className="font-numeric h-8 text-sm"
              aria-label="Right endpoint derivative"
            />
          </div>
        </div>
      )}

      <p
        id="cubic-spline-boundary-help"
        className="text-xs text-muted-foreground leading-relaxed"
      >
        Boundary settings are sent to the backend; spline coefficients are
        computed by the API.
      </p>
    </div>
  )
}
