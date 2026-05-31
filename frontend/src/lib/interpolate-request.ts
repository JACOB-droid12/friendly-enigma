import type { FormState } from "@/components/InputPanel"
import type {
  DerivativeEntry,
  InterpolateRequest,
  MethodOptions,
  OsculatingOrderOption,
} from "@/lib/api-types"

function currentXValues(form: FormState) {
  if (form.mode === "points") {
    return form.points.map((point) => point[0])
  }
  if (form.mode === "x_values_with_function") {
    return form.xValues
  }
  return []
}

function osculatingOrderForIndex(form: FormState, index: number) {
  return form.osculatingOrders[index]?.order ?? 1
}

function buildOsculatingOrders(form: FormState): OsculatingOrderOption[] {
  return currentXValues(form)
    .map((x, index) => ({
      x,
      order: osculatingOrderForIndex(form, index),
    }))
    .filter((entry) => entry.x.trim() !== "")
}

function buildMethodOptions(form: FormState): MethodOptions | undefined {
  const out: MethodOptions = {}

  if (form.methods.includes("taylor")) {
    out.taylor = {
      center: form.taylorCenter,
      order: form.taylorOrder,
    }
  }

  if (form.methods.includes("cubic_spline")) {
    out.cubic_spline = {
      boundary_condition: form.splineBoundaryCondition,
    }
    if (form.splineBoundaryCondition === "clamped") {
      out.cubic_spline.left_derivative = form.splineLeftDerivative
      out.cubic_spline.right_derivative = form.splineRightDerivative
    }
  }

  if (form.methods.includes("osculating")) {
    out.osculating = {
      orders: buildOsculatingOrders(form),
    }
  }

  return Object.keys(out).length > 0 ? out : undefined
}

function derivativeValueFor(form: FormState, x: string, index: number, order: number) {
  const byXAndOrder = form.derivatives.find(
    (entry) => entry.x === x && (entry.order ?? 1) === order,
  )
  if (byXAndOrder) return byXAndOrder.value
  if (order === 1) return form.derivatives[index]?.value ?? ""
  return ""
}

function buildDerivatives(form: FormState): DerivativeEntry[] | undefined {
  const needsHermiteDerivatives =
    form.methods.includes("hermite_divided_difference") ||
    form.methods.includes("hermite")
  const needsOsculatingPointDerivatives =
    form.methods.includes("osculating") && form.mode === "points"

  if (!needsHermiteDerivatives && !needsOsculatingPointDerivatives) return undefined

  const xs = currentXValues(form)
  const out: DerivativeEntry[] = []
  const emitted = new Set<string>()

  for (let index = 0; index < xs.length; index += 1) {
    const x = xs[index]
    if (x.trim() === "") continue

    const requiredOrders = new Set<number>()
    if (needsHermiteDerivatives) {
      requiredOrders.add(1)
    }
    if (needsOsculatingPointDerivatives) {
      const maxOrder = osculatingOrderForIndex(form, index)
      for (let order = 1; order <= maxOrder; order += 1) {
        requiredOrders.add(order)
      }
    }

    for (const order of [...requiredOrders].sort((a, b) => a - b)) {
      const key = `${x}\u0000${order}`
      if (emitted.has(key)) continue
      const value = derivativeValueFor(form, x, index, order)
      if (value.trim() !== "") {
        out.push({ x, order, value })
        emitted.add(key)
      }
    }
  }

  return out
}

export function buildRequest(form: FormState): InterpolateRequest {
  const base: InterpolateRequest = {
    mode: form.mode,
    methods: form.methods,
    precision: form.precision,
    exact: form.exact,
    evaluation_x: form.evaluationX.filter((x) => x.trim() !== ""),
    graph: form.graph,
  }

  switch (form.mode) {
    case "points":
      base.points = form.points.filter((p) => p[0].trim() !== "" || p[1].trim() !== "")
      break
    case "x_values_with_function":
      base.x_values = form.xValues.filter((x) => x.trim() !== "")
      base.function = form.functionExpr
      break
    case "function_interval":
      base.function = form.functionExpr
      base.interval = [form.intervalStart, form.intervalEnd]
      base.node_strategy = form.nodeStrategy
      base.node_count = form.nodeCount
      break
  }

  const methodOptions = buildMethodOptions(form)
  if (methodOptions) base.method_options = methodOptions

  const derivatives = buildDerivatives(form)
  if (derivatives) base.derivatives = derivatives

  return base
}
