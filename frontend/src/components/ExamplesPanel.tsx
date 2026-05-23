import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Zap } from "lucide-react"
import type { FormState } from "./InputPanel"

/**
 * Category tints encode what each example demonstrates so a returning user
 * can read the row without rereading the subtitle:
 *
 *   "lecture"   primary (indigo)   curriculum entry, the canonical worked example
 *   "function"  info (cyan)        explores an analytic function f(x), informational
 *   "demo"      warning (amber)    a cautionary case (Runge); amber matches the
 *                                  numerical-caution semantic already used app-wide
 *                                  so the row pre-flags the warning bar that the
 *                                  Runge example will produce in the result
 *
 * This keeps the Semantic Honesty Rule intact: amber still means numerical
 * caution everywhere it appears.
 */
type ExampleCategory = "lecture" | "function" | "demo"

const CATEGORY_LABEL: Record<ExampleCategory, string> = {
  lecture: "Lecture",
  function: "Function",
  demo: "Demo",
}

const CATEGORY_BADGE: Record<ExampleCategory, "default" | "info" | "warning"> = {
  lecture: "default",
  function: "info",
  demo: "warning",
}

interface Example {
  id: string
  title: string
  subtitle: string
  category: ExampleCategory
  form: Partial<FormState>
}

const EXAMPLES: Example[] = [
  {
    id: "linear-lagrange",
    title: "Linear Lagrange",
    subtitle: "P(x) = 6 − x, evaluate at x = 3",
    category: "lecture",
    form: {
      mode: "points",
      points: [["2", "4"], ["5", "1"]],
      methods: ["lagrange", "newton", "barycentric"],
      precision: 50,
      exact: true,
      evaluationX: ["3"],
      graph: true,
    },
  },
  {
    id: "reciprocal-function",
    title: "f(x) = 1/x",
    subtitle: "Nodes at 2, 2.75, 4; evaluate at x = 3",
    category: "function",
    form: {
      mode: "x_values_with_function",
      xValues: ["2", "2.75", "4"],
      functionExpr: "1/x",
      methods: ["lagrange", "newton", "barycentric", "neville"],
      precision: 50,
      exact: true,
      evaluationX: ["3"],
      graph: true,
    },
  },
  {
    id: "runge-phenomenon",
    title: "Runge Phenomenon",
    subtitle: "f(x) = 1/(1+25x²) on [−1, 1], 11 equally spaced nodes",
    category: "demo",
    form: {
      mode: "function_interval",
      functionExpr: "1/(1+25*x^2)",
      intervalStart: "-1",
      intervalEnd: "1",
      nodeStrategy: "equally_spaced",
      nodeCount: 11,
      methods: ["lagrange", "barycentric"],
      precision: 50,
      exact: false,
      evaluationX: ["0.9", "0.95"],
      graph: true,
    },
  },
]

interface ExamplesPanelProps {
  onLoadExample: (form: Partial<FormState>) => void
  onLoadAndCompute: (form: Partial<FormState>) => void
  backendOnline: boolean
}

export function ExamplesPanel({ onLoadExample, onLoadAndCompute, backendOnline }: ExamplesPanelProps) {
  return (
    <section className="rounded-xl border bg-card overflow-hidden">
      <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-foreground">Try a Lecture Example</h2>
        </div>
        {!backendOnline && (
          <span
            role="status"
            className="text-[11px] text-muted-foreground"
          >
            Compute disabled, backend offline
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {EXAMPLES.map((ex) => (
            <div
              key={ex.id}
              className="group rounded-lg border border-border p-3 space-y-2 hover:border-primary/30 hover:bg-muted/30 transition-subtle"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{ex.title}</p>
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
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-[11px] h-6 px-2 gap-1"
                  onClick={() => onLoadExample(ex.form)}
                >
                  Load
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="text-[11px] h-6 px-2 gap-1"
                  onClick={() => onLoadAndCompute(ex.form)}
                  disabled={!backendOnline}
                  aria-disabled={!backendOnline}
                  title={backendOnline ? undefined : "Backend offline"}
                >
                  <Zap className="h-2.5 w-2.5" aria-hidden="true" />
                  Compute
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
