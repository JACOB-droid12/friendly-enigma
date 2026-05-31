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
import EqualSpacingHint from "./EqualSpacingHint"
import DerivativeInputTable, {
  type DerivativeFormEntry,
  type OsculatingOrderFormEntry,
} from "./DerivativeInputTable"
import TaylorConfigBlock from "./TaylorConfigBlock"
import CubicSplineConfigBlock from "./CubicSplineConfigBlock"
import type { InputMode, MethodName, NodeStrategy, SplineBoundaryCondition } from "@/lib/api-types"

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
  // Phase 2 additions (R5.3, R5.4, R5.5, R5.6)
  derivatives: DerivativeFormEntry[]
  osculatingOrders: OsculatingOrderFormEntry[]
  taylorCenter: string
  taylorOrder: number
  splineBoundaryCondition: SplineBoundaryCondition
  splineLeftDerivative: string
  splineRightDerivative: string
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

  // Adaptive Input Panel (R5.1, R5.7; design.md §7.5). The shared
  // x-value array feeds both `EqualSpacingHint` (advisory only) and
  // `DerivativeInputTable` (one row per node). Strings are preserved
  // verbatim — no `parseFloat` / `Number()` at the API boundary
  // (R1.4). For `function_interval` mode the synthesized x-values
  // are out of scope per design.md §7.1, so the hint receives an
  // empty array and renders the helper's "fewer than two values"
  // copy, which is purely informational.
  const xs = (() => {
    if (form.mode === "points") {
      return form.points.map((p) => p[0])
    }
    if (form.mode === "x_values_with_function") {
      return form.xValues
    }
    return [] as string[]
  })()

  // Visibility predicates — the section is hidden entirely when no
  // Phase 2 method is selected so V1 layout is byte-identical
  // (R5.7). Each block renders only when its triggering method
  // family is present in `form.methods`, in the order documented in
  // design.md §7.5.
  const showEqualSpacing =
    form.methods.includes("newton_forward") ||
    form.methods.includes("newton_backward") ||
    form.methods.includes("stirling")
  const showHermiteDerivative =
    form.methods.includes("hermite_divided_difference") ||
    form.methods.includes("hermite")
  const showOsculating = form.methods.includes("osculating")
  const showTaylor = form.methods.includes("taylor")
  const showSpline = form.methods.includes("cubic_spline")
  const showMethodConfig =
    showEqualSpacing || showHermiteDerivative || showOsculating || showTaylor || showSpline

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

      {/* Section 3: Method Configuration (Phase 2 adaptive blocks) */}
      {showMethodConfig && (
        <section className="rounded-xl border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b bg-muted/30">
            <h2 className="text-sm font-semibold text-foreground">Method Configuration</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Method-aware inputs for Phase 2 methods</p>
          </div>
          <div className="p-5 space-y-5">
            {showEqualSpacing && <EqualSpacingHint values={xs} />}
            {showHermiteDerivative && (
              <DerivativeInputTable
                mode="first-derivative"
                xs={xs}
                derivatives={form.derivatives}
                onChange={(derivatives) => update({ derivatives })}
              />
            )}
            {showOsculating && (
              <DerivativeInputTable
                mode="osculating"
                xs={xs}
                derivatives={form.derivatives}
                onChange={(derivatives) => update({ derivatives })}
                osculatingOrders={form.osculatingOrders}
                onOsculatingOrdersChange={(osculatingOrders) =>
                  update({ osculatingOrders })
                }
                onOsculatingConfigChange={({ derivatives, osculatingOrders }) =>
                  update({ derivatives, osculatingOrders })
                }
                manualValuesRequired={form.mode === "points"}
              />
            )}
            {showTaylor && (
              <TaylorConfigBlock
                mode={form.mode}
                center={form.taylorCenter}
                order={form.taylorOrder}
                onCenterChange={(taylorCenter) => update({ taylorCenter })}
                onOrderChange={(taylorOrder) => update({ taylorOrder })}
              />
            )}
            {showSpline && (
              <CubicSplineConfigBlock
                boundaryCondition={form.splineBoundaryCondition}
                onBoundaryConditionChange={(splineBoundaryCondition) =>
                  update({ splineBoundaryCondition })
                }
                leftDerivative={form.splineLeftDerivative}
                rightDerivative={form.splineRightDerivative}
                onLeftDerivativeChange={(splineLeftDerivative) =>
                  update({ splineLeftDerivative })
                }
                onRightDerivativeChange={(splineRightDerivative) =>
                  update({ splineRightDerivative })
                }
              />
            )}
          </div>
        </section>
      )}

      {/* Section 4: Precision & Evaluation */}
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
