import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen } from "lucide-react"
import type { FormState } from "./InputPanel"

type ExampleCategory = "lagrange" | "function" | "table"

const CATEGORY_LABEL: Record<ExampleCategory, string> = {
  lagrange: "Lagrange",
  function: "Function",
  table: "Table",
}

const CATEGORY_BADGE: Record<ExampleCategory, "default" | "info" | "secondary"> = {
  lagrange: "default",
  function: "info",
  table: "secondary",
}

interface Example {
  id: string
  title: string
  subtitle: string
  category: ExampleCategory
  sourceNote: string
  form: Partial<FormState>
}

const EXAMPLES: Example[] = [
  {
    id: "linear-lagrange",
    title: "Linear Lagrange",
    subtitle: "Points (2, 4), (5, 1); evaluate at x = 3",
    category: "lagrange",
    sourceNote: "Lecture note: expected P(x) = 6 - x.",
    form: {
      mode: "points",
      points: [["2", "4"], ["5", "1"]],
      methods: ["lagrange"],
      precision: 50,
      exact: true,
      evaluationX: ["3"],
      graph: false,
    },
  },
  {
    id: "reciprocal-function",
    title: "Second-Degree Lagrange",
    subtitle: "f(x) = 1/x at 2, 2.75, 4; evaluate at x = 3",
    category: "function",
    sourceNote: "Lecture example approximates f(3) from three nodes.",
    form: {
      mode: "x_values_with_function",
      xValues: ["2", "2.75", "4"],
      functionExpr: "1/x",
      methods: ["lagrange"],
      precision: 50,
      exact: true,
      evaluationX: ["3"],
      graph: false,
    },
  },
  {
    id: "neville-table",
    title: "Neville Table",
    subtitle: "Five lecture points; evaluate at x = 1.5",
    category: "table",
    sourceNote: "Useful methods: Neville, Lagrange, Newton.",
    form: {
      mode: "points",
      points: [
        ["1.0", "0.7651977"],
        ["1.3", "0.6200860"],
        ["1.6", "0.4554022"],
        ["1.9", "0.2818186"],
        ["2.2", "0.1103623"],
      ],
      methods: ["neville", "lagrange", "newton"],
      precision: 50,
      exact: false,
      evaluationX: ["1.5"],
      graph: false,
    },
  },
  {
    id: "newton-divided-difference",
    title: "Newton Divided Difference",
    subtitle: "Same five-point table; focus on Newton form",
    category: "table",
    sourceNote: "Lecture emphasis: divided-difference table and Newton form.",
    form: {
      mode: "points",
      points: [
        ["1.0", "0.7651977"],
        ["1.3", "0.6200860"],
        ["1.6", "0.4554022"],
        ["1.9", "0.2818186"],
        ["2.2", "0.1103623"],
      ],
      methods: ["newton"],
      precision: 50,
      exact: false,
      evaluationX: ["1.5"],
      graph: false,
    },
  },
  {
    id: "newton-forward-cos",
    title: "Newton Forward (cos x at 1.0…2.2)",
    subtitle: "f(x) = cos(x) at 1.0, 1.3, 1.6, 1.9, 2.2; evaluate at x = 1.5",
    category: "table",
    sourceNote: "Forward differences with five equally spaced cos(x) samples.",
    form: {
      mode: "x_values_with_function",
      xValues: ["1.0", "1.3", "1.6", "1.9", "2.2"],
      functionExpr: "cos(x)",
      methods: ["newton_forward"],
      precision: 50,
      exact: true,
      evaluationX: ["1.5"],
      graph: false,
    },
  },
  {
    id: "newton-backward-cos",
    title: "Newton Backward (cos x)",
    subtitle: "Same five cos(x) nodes; evaluate at x = 1.5",
    category: "table",
    sourceNote: "Backward differences anchored at the last node.",
    form: {
      mode: "x_values_with_function",
      xValues: ["1.0", "1.3", "1.6", "1.9", "2.2"],
      functionExpr: "cos(x)",
      methods: ["newton_backward"],
      precision: 50,
      exact: true,
      evaluationX: ["1.5"],
      graph: false,
    },
  },
  {
    id: "stirling-cos",
    title: "Stirling (cos x, centered)",
    subtitle: "Same five cos(x) nodes; evaluate at x = 1.5",
    category: "table",
    sourceNote: "Centered differences around the middle of five equally spaced nodes.",
    form: {
      mode: "x_values_with_function",
      xValues: ["1.0", "1.3", "1.6", "1.9", "2.2"],
      functionExpr: "cos(x)",
      methods: ["stirling"],
      precision: 50,
      exact: true,
      evaluationX: ["1.5"],
      graph: false,
    },
  },
  {
    id: "hermite-divided-difference-bessel",
    title: "Hermite Divided Difference (Bessel-style)",
    subtitle: "Three Bessel-style points with first derivatives; evaluate at x = 1.5",
    category: "table",
    sourceNote: "Repeated-node divided differences using f'(xᵢ).",
    form: {
      mode: "points",
      points: [
        ["1.3", "0.6200860"],
        ["1.6", "0.4554022"],
        ["1.9", "0.2818186"],
      ],
      methods: ["hermite_divided_difference"],
      precision: 50,
      exact: false,
      evaluationX: ["1.5"],
      graph: false,
      derivatives: [
        { x: "1.3", value: "-0.52202324741466" },
        { x: "1.6", value: "-0.56989593526168" },
        { x: "1.9", value: "-0.581157072713434" },
      ],
    },
  },
  {
    id: "hermite-basis-form-bessel",
    title: "Hermite (Basis Form)",
    subtitle: "Same three Bessel-style points; surfaces the basis-form output when the backend includes it.",
    category: "table",
    sourceNote: "Hermite construction with optional basis form output.",
    form: {
      mode: "points",
      points: [
        ["1.3", "0.6200860"],
        ["1.6", "0.4554022"],
        ["1.9", "0.2818186"],
      ],
      methods: ["hermite"],
      precision: 50,
      exact: false,
      evaluationX: ["1.5"],
      graph: false,
      derivatives: [
        { x: "1.3", value: "-0.52202324741466" },
        { x: "1.6", value: "-0.56989593526168" },
        { x: "1.9", value: "-0.581157072713434" },
      ],
    },
  },
  {
    id: "taylor-cos-order-3",
    title: "Taylor (cos x, order 3)",
    subtitle: "f(x) = cos(x), center 0, order 3; evaluate at x = 1/2",
    category: "function",
    sourceNote: "Maclaurin polynomial of cos(x) truncated at order 3.",
    form: {
      mode: "x_values_with_function",
      xValues: ["0", "1"],
      functionExpr: "cos(x)",
      methods: ["taylor"],
      taylorCenter: "0",
      taylorOrder: 3,
      precision: 50,
      exact: true,
      evaluationX: ["1/2"],
      graph: false,
    },
  },
  {
    id: "cubic-spline-three-point",
    title: "Cubic Spline (lecture three-point)",
    subtitle: "Points (1, 2), (2, 3), (3, 5); natural boundary; evaluate at x = 5/2",
    category: "table",
    sourceNote: "Natural cubic spline tied to second-derivative-zero at the boundary.",
    form: {
      mode: "points",
      points: [["1", "2"], ["2", "3"], ["3", "5"]],
      methods: ["cubic_spline"],
      splineBoundaryCondition: "natural",
      precision: 50,
      exact: true,
      evaluationX: ["5/2"],
      graph: true,
    },
  },
  {
    id: "osculating-deferred",
    title: "Deferred — Osculating (Bessel-style)",
    subtitle: "Same Bessel-style points and derivatives as Hermite; surfaces the deferred backend state",
    category: "table",
    sourceNote: "Backend returns method_not_implemented; the frontend renders the deferred state.",
    form: {
      mode: "points",
      points: [
        ["1.3", "0.6200860"],
        ["1.6", "0.4554022"],
        ["1.9", "0.2818186"],
      ],
      methods: ["osculating"],
      precision: 50,
      exact: false,
      evaluationX: ["1.5"],
      graph: false,
      derivatives: [
        { x: "1.3", value: "-0.52202324741466" },
        { x: "1.6", value: "-0.56989593526168" },
        { x: "1.9", value: "-0.581157072713434" },
      ],
    },
  },
]

interface ExamplesPanelProps {
  onLoadExample: (form: Partial<FormState>) => void
}

export function ExamplesPanel({ onLoadExample }: ExamplesPanelProps) {
  return (
    <section className="rounded-xl border bg-card overflow-hidden">
      <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-foreground">Lecture Examples</h2>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
          {EXAMPLES.map((ex) => (
            <div
              key={ex.id}
              className="group rounded-lg border border-border p-3 space-y-3 hover:border-primary/30 hover:bg-muted/30 transition-subtle"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">{ex.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                    {ex.subtitle}
                  </p>
                </div>
                <Badge
                  variant={CATEGORY_BADGE[ex.category]}
                  className="font-label shrink-0 h-[18px] px-1.5 rounded"
                >
                  {CATEGORY_LABEL[ex.category]}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{ex.sourceNote}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-[11px] h-6 px-2"
                onClick={() => onLoadExample(ex.form)}
                aria-label={`Load ${ex.title} example`}
              >
                Load Example
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
