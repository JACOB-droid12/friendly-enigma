import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { PointsInput } from "./PointsInput"
import { XValuesInput } from "./XValuesInput"
import { FunctionIntervalInput } from "./FunctionIntervalInput"
import { MethodSelector } from "./MethodSelector"
import { PrecisionSettings } from "./PrecisionSettings"
import { EvaluationTargets } from "./EvaluationTargets"
import type { InputMode, MethodName, NodeStrategy } from "@/lib/api-types"

export interface FormState {
  mode: InputMode
  points: string[][]
  xValues: string[]
  functionExpr: string
  intervalStart: string
  intervalEnd: string
  nodeStrategy: NodeStrategy
  nodeCount: number
  methods: MethodName[]
  precision: number
  exact: boolean | null
  evaluationX: string[]
  graph: boolean
}

interface InputPanelProps {
  form: FormState
  onChange: (form: FormState) => void
  functionError?: { code?: string; message: string } | null
  validationSuccess?: string | null
}

export function InputPanel({ form, onChange, functionError, validationSuccess }: InputPanelProps) {
  function update(partial: Partial<FormState>) {
    onChange({ ...form, ...partial })
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Input Mode & Data */}
      <section className="rounded-xl border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b bg-muted/30">
          <h2 className="text-sm font-semibold text-foreground">Interpolation Data</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Define the nodes for polynomial construction</p>
        </div>
        <div className="p-5">
          <Tabs value={form.mode} onValueChange={(v) => update({ mode: v as InputMode })}>
            <TabsList className="w-full grid grid-cols-3 h-9">
              <TabsTrigger value="points">Points</TabsTrigger>
              <TabsTrigger value="x_values_with_function">X + f(x)</TabsTrigger>
              <TabsTrigger value="function_interval">Interval</TabsTrigger>
            </TabsList>

            <TabsContent value="points" className="mt-4">
              <PointsInput
                points={form.points}
                onChange={(points) => update({ points })}
              />
            </TabsContent>

            <TabsContent value="x_values_with_function" className="mt-4">
              <XValuesInput
                xValues={form.xValues}
                functionExpr={form.functionExpr}
                onXValuesChange={(xValues) => update({ xValues })}
                onFunctionChange={(functionExpr) => update({ functionExpr })}
                functionError={functionError}
                validationSuccess={validationSuccess}
              />
            </TabsContent>

            <TabsContent value="function_interval" className="mt-4">
              <FunctionIntervalInput
                functionExpr={form.functionExpr}
                intervalStart={form.intervalStart}
                intervalEnd={form.intervalEnd}
                nodeStrategy={form.nodeStrategy}
                nodeCount={form.nodeCount}
                onFunctionChange={(functionExpr) => update({ functionExpr })}
                onIntervalStartChange={(intervalStart) => update({ intervalStart })}
                onIntervalEndChange={(intervalEnd) => update({ intervalEnd })}
                onNodeStrategyChange={(nodeStrategy) => update({ nodeStrategy })}
                onNodeCountChange={(nodeCount) => update({ nodeCount })}
                functionError={functionError}
              />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Section 2: Methods */}
      <section className="rounded-xl border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b bg-muted/30">
          <h2 className="text-sm font-semibold text-foreground">Methods</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Select interpolation methods to compare</p>
        </div>
        <div className="p-5">
          <MethodSelector
            selected={form.methods}
            onChange={(methods) => update({ methods })}
          />
        </div>
      </section>

      {/* Section 3: Precision & Evaluation */}
      <section className="rounded-xl border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b bg-muted/30">
          <h2 className="text-sm font-semibold text-foreground">Precision & Evaluation</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Numerical settings and target values</p>
        </div>
        <div className="p-5 space-y-5">
          <PrecisionSettings
            precision={form.precision}
            exact={form.exact}
            onPrecisionChange={(precision) => update({ precision })}
            onExactChange={(exact) => update({ exact })}
          />

          <Separator />

          <EvaluationTargets
            targets={form.evaluationX}
            onChange={(evaluationX) => update({ evaluationX })}
          />

          <Separator />

          {/* Graph Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="graph-toggle" className="text-sm">Graph Output</Label>
              <p className="text-xs text-muted-foreground">
                Generate plot arrays for f(x), P(x), and error
              </p>
            </div>
            <Switch
              id="graph-toggle"
              checked={form.graph}
              onCheckedChange={(graph) => update({ graph })}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
