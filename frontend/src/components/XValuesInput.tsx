import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ErrorNotice } from "@/components/ErrorNotice"
import { useNewlyAddedIndex } from "@/lib/use-newly-added-index"
import { CheckCircle, Plus, X } from "lucide-react"

interface XValuesInputProps {
  xValues: string[]
  functionExpr: string
  onXValuesChange: (values: string[]) => void
  onFunctionChange: (fn: string) => void
  functionError?: { code?: string; message: string } | null
  validationSuccess?: string | null
}

export function XValuesInput({
  xValues,
  functionExpr,
  onXValuesChange,
  onFunctionChange,
  functionError,
  validationSuccess,
}: XValuesInputProps) {
  const freshIndex = useNewlyAddedIndex(xValues.length)

  function addValue() {
    onXValuesChange([...xValues, ""])
  }

  function removeValue(index: number) {
    if (xValues.length <= 2) return
    onXValuesChange(xValues.filter((_, i) => i !== index))
  }

  function updateValue(index: number, value: string) {
    onXValuesChange(xValues.map((v, i) => (i === index ? value : v)))
  }

  const showSuccess = !functionError && !!validationSuccess
  const describedBy = functionError
    ? "function-error"
    : showSuccess
    ? "function-success"
    : undefined

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="function-expr">Function f(x)</Label>
        <Input
          id="function-expr"
          placeholder="e.g. 1/x, sin(x), exp(-x^2)"
          value={functionExpr}
          onChange={(e) => onFunctionChange(e.target.value)}
          className="font-numeric"
          aria-invalid={!!functionError}
          aria-describedby={describedBy}
        />
        {functionError && (
          <ErrorNotice
            id="function-error"
            code={functionError.code}
            message={functionError.message}
            severity="error"
            layout="inline"
          />
        )}
        {showSuccess && (
          <p
            id="function-success"
            className="flex items-center gap-1.5 text-xs text-primary animate-in-results"
          >
            <CheckCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="font-numeric">{validationSuccess}</span>
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Allowed: sin, cos, tan, exp, log, ln, sqrt, abs, asin, acos, atan, sinh, cosh, tanh, pi, E
        </p>
      </div>

      <div className="space-y-3">
        <Label>X-Values</Label>
        <div className="space-y-2">
          {xValues.map((val, i) => (
            <div
              key={i}
              className={`grid grid-cols-[2rem_1fr_2rem] gap-2 items-center${
                i === freshIndex ? " animate-row-enter" : ""
              }`}
            >
              <span className="text-xs text-muted-foreground text-center font-numeric tabular-nums">
                {i}
              </span>
              <Input
                placeholder="x-value"
                value={val}
                onChange={(e) => updateValue(i, e.target.value)}
                className="font-numeric md:min-w-[10rem]"
                aria-label={`X-value ${i}`}
              />
              <button
                type="button"
                onClick={() => removeValue(i)}
                disabled={xValues.length <= 2}
                className="flex items-center justify-center w-6 h-6 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-muted-foreground disabled:hover:bg-transparent transition-subtle outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                aria-label={`Remove x-value ${i}`}
                title={xValues.length <= 2 ? "At least 2 x-values are required" : undefined}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addValue}>
          <Plus className="h-4 w-4 mr-1" /> Add X-Value
        </Button>
      </div>
    </div>
  )
}
