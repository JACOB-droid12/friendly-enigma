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
