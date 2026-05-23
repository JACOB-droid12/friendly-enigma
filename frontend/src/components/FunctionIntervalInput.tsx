import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { ErrorNotice } from "@/components/ErrorNotice"
import { AlertCircle } from "lucide-react"
import type { NodeStrategy } from "@/lib/api-types"

interface FunctionIntervalInputProps {
  functionExpr: string
  intervalStart: string
  intervalEnd: string
  nodeStrategy: NodeStrategy
  nodeCount: number
  onFunctionChange: (fn: string) => void
  onIntervalStartChange: (val: string) => void
  onIntervalEndChange: (val: string) => void
  onNodeStrategyChange: (strategy: NodeStrategy) => void
  onNodeCountChange: (count: number) => void
  functionError?: { code?: string; message: string } | null
}

const STRATEGY_HELP: Record<NodeStrategy, string> = {
  equally_spaced: "Uniform spacing across the interval. Easy to set up; can oscillate at the edges (Runge phenomenon) for high degrees.",
  chebyshev_nodes: "Nodes clustered near the interval ends. Suppresses Runge oscillation; the standard choice for high-degree polynomial interpolation.",
  custom_nodes: "Provide your own x-values via the X + f(x) tab.",
}

export function FunctionIntervalInput({
  functionExpr,
  intervalStart,
  intervalEnd,
  nodeStrategy,
  nodeCount,
  onFunctionChange,
  onIntervalStartChange,
  onIntervalEndChange,
  onNodeStrategyChange,
  onNodeCountChange,
  functionError,
}: FunctionIntervalInputProps) {
  // Out-of-range only fires when the user has typed a finite number that is
  // outside [2, 50]. NaN (empty input) is treated as "not yet entered" and
  // does not trip the inline notice; App.tsx decides whether to block submit.
  const isOutOfRange =
    Number.isFinite(nodeCount) && (nodeCount < 2 || nodeCount > 50)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fn-interval-expr">Function f(x)</Label>
        <Input
          id="fn-interval-expr"
          placeholder="e.g. sin(x), 1/(1+x^2)"
          value={functionExpr}
          onChange={(e) => onFunctionChange(e.target.value)}
          className="font-numeric text-sm h-8"
          aria-invalid={!!functionError}
          aria-describedby={functionError ? "fn-interval-error" : undefined}
        />
        {functionError && (
          <ErrorNotice
            id="fn-interval-error"
            code={functionError.code}
            message={functionError.message}
            severity="error"
            layout="inline"
          />
        )}
        <p className="text-xs text-muted-foreground">
          Allowed: sin, cos, tan, exp, log, ln, sqrt, abs, asin, acos, atan, sinh, cosh, tanh, pi, E
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="interval-start" className="text-xs">
            Interval Start (<span className="font-numeric">a</span>)
          </Label>
          <Input
            id="interval-start"
            placeholder="-1"
            value={intervalStart}
            onChange={(e) => onIntervalStartChange(e.target.value)}
            className="font-numeric text-sm h-8"
            inputMode="decimal"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="interval-end" className="text-xs">
            Interval End (<span className="font-numeric">b</span>)
          </Label>
          <Input
            id="interval-end"
            placeholder="1"
            value={intervalEnd}
            onChange={(e) => onIntervalEndChange(e.target.value)}
            className="font-numeric text-sm h-8"
            inputMode="decimal"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="node-strategy" className="text-xs">Node Strategy</Label>
          <Select
            id="node-strategy"
            value={nodeStrategy}
            onChange={(e) => onNodeStrategyChange(e.target.value as NodeStrategy)}
            className="h-8 text-sm"
            aria-describedby="node-strategy-help"
          >
            <option value="equally_spaced">Equally Spaced</option>
            <option value="chebyshev_nodes">Chebyshev Nodes</option>
            <option value="custom_nodes">Custom Nodes</option>
          </Select>
          <p id="node-strategy-help" className="text-[11px] text-muted-foreground leading-relaxed">
            {STRATEGY_HELP[nodeStrategy]}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="node-count" className="text-xs">Node Count</Label>
          <Input
            id="node-count"
            type="number"
            min={2}
            max={50}
            step={1}
            inputMode="numeric"
            value={Number.isFinite(nodeCount) ? nodeCount : ""}
            onChange={(e) => onNodeCountChange(Number.parseInt(e.target.value, 10))}
            className="font-numeric text-sm h-8"
            aria-invalid={isOutOfRange}
            aria-describedby={isOutOfRange ? "node-count-error" : undefined}
          />
          {isOutOfRange && (
            <div
              id="node-count-error"
              role="alert"
              className="bg-destructive/5 ring-1 ring-inset ring-destructive/20 rounded-lg px-3 py-2 mt-1.5 flex items-start gap-2"
            >
              <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" aria-hidden="true" />
              <div>
                <span className="font-label text-destructive">Out of range</span>
                <p className="text-xs text-destructive">
                  Node count must be between 2 and 50.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
