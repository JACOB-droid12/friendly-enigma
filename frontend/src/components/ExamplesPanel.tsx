import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, ChevronDown } from "lucide-react"
import type { FormState } from "./InputPanel"

/**
 * Example tier:
 *   - "quick"   -> rendered on first paint as a 4-card "Quick Start" row.
 *   - "catalog" -> hidden behind a "Show lecture catalog" disclosure.
 *
 * Tier replaces the previous flat 12-card grid that was approaching the
 * identical-card-grids ban. Quick Start cards each pick a representative
 * curriculum example; the catalog covers every Phase 2 method with the
 * same lecture data the V1 examples used.
 */
type ExampleTier = "quick" | "catalog"

/**
 * Subtle category tag rendered as a small Badge. The tag is informational
 * only; the primary navigation is "Quick Start vs Catalog", so categories
 * stay quiet.
 */
type ExampleCategory = "lecture" | "function" | "demo"

const CATEGORY_LABEL: Record<ExampleCategory, string> = {
  lecture: "Lecture",
  function: "Function",
  demo: "Demo",
}

const CATEGORY_BADGE: Record<ExampleCategory, "secondary" | "info" | "warning"> = {
  lecture: "secondary",
  function: "info",
  demo: "warning",
}

interface Example {
  id: string
  title: string
  subtitle: string
  tier: ExampleTier
  category: ExampleCategory
  sourceNote: string
  form: Partial<FormState>
}

const EXAMPLES: Example[] = [
  // -------- Quick Start (4 cards) --------
  {
    id: "linear-lagrange",
    title: "Linear Lagrange",
    subtitle: "Points (2, 4), (5, 1); evaluate at x = 3",
    tier: "quick",
    category: "lecture",
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
    id: "newton-divided-difference",
    title: "Newton Divided Difference",
    subtitle: "Five lecture points; focus on Newton form",
    tier: "quick",
    category: "lecture",
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
    id: "reciprocal-function",
    title: "Second-Degree Lagrange",
    subtitle: "f(x) = 1/x at 2, 2.75, 4; evaluate at x = 3",
    tier: "quick",
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
    id: "cubic-spline-three-point",
    title: "Cubic Spline (lecture three-point)",
    subtitle: "Points (1, 2), (2, 3), (3, 5); natural boundary; evaluate at x = 5/2",
    tier: "quick",
    category: "lecture",
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

  // -------- Lecture Catalog (everything else) --------
  {
    id: "neville-table",
    title: "Neville Table",
    subtitle: "Five lecture points; evaluate at x = 1.5",
    tier: "catalog",
    category: "lecture",
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
    id: "newton-forward-cos",
    title: "Newton Forward (cos x at 1.0 to 2.2)",
    subtitle: "f(x) = cos(x) at 1.0, 1.3, 1.6, 1.9, 2.2; evaluate at x = 1.5",
    tier: "catalog",
    category: "function",
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
    tier: "catalog",
    category: "function",
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
    tier: "catalog",
    category: "function",
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
    tier: "catalog",
    category: "lecture",
    sourceNote: "Repeated-node divided differences using f'(x_i).",
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
    subtitle: "Same three Bessel-style points; surfaces the basis-form output when included",
    tier: "catalog",
    category: "lecture",
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
    tier: "catalog",
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
    id: "osculating-bessel-style",
    title: "Osculating (Bessel-style)",
    subtitle: "Same Bessel-style points and first derivatives; evaluate at x = 1.5",
    tier: "catalog",
    category: "lecture",
    sourceNote: "Generalized confluent divided differences with first-derivative matching at each node.",
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
      osculatingOrders: [
        { x: "1.3", order: 1 },
        { x: "1.6", order: 1 },
        { x: "1.9", order: 1 },
      ],
      derivatives: [
        { x: "1.3", order: 1, value: "-0.52202324741466" },
        { x: "1.6", order: 1, value: "-0.56989593526168" },
        { x: "1.9", order: 1, value: "-0.581157072713434" },
      ],
    },
  },
]

interface ExamplesPanelProps {
  onLoadExample: (form: Partial<FormState>) => void
}

export function ExamplesPanel({ onLoadExample }: ExamplesPanelProps) {
  const [catalogOpen, setCatalogOpen] = useState(false)
  const quickStart = EXAMPLES.filter((ex) => ex.tier === "quick")
  const catalog = EXAMPLES.filter((ex) => ex.tier === "catalog")

  return (
    <section className="rounded-xl border bg-card overflow-hidden">
      <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-foreground">Quick Start</h2>
        </div>
        <span className="font-label text-muted-foreground hidden sm:inline">
          Curriculum-critical lecture examples
        </span>
      </div>

      {/* Quick Start row: 4 high-value examples on first paint. */}
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
          {quickStart.map((ex) => (
            <ExampleCard key={ex.id} example={ex} onLoadExample={onLoadExample} />
          ))}
        </div>

        {/* Disclosure: opens the catalog with the remaining 8 examples. */}
        <div className="mt-4 border-t border-border/60 pt-3">
          <button
            type="button"
            onClick={() => setCatalogOpen((open) => !open)}
            aria-expanded={catalogOpen}
            aria-controls="lecture-catalog"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-subtle outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-md px-2 py-1"
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${catalogOpen ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
            <span>
              {catalogOpen ? "Hide lecture catalog" : `Show ${catalog.length} more lecture examples`}
            </span>
          </button>

          {catalogOpen && (
            <div
              id="lecture-catalog"
              className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 animate-in-results"
            >
              {catalog.map((ex) => (
                <ExampleCard
                  key={ex.id}
                  example={ex}
                  onLoadExample={onLoadExample}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function ExampleCard({
  example,
  onLoadExample,
}: {
  example: Example
  onLoadExample: (form: Partial<FormState>) => void
}) {
  return (
    <div className="group rounded-lg border border-border p-3 space-y-3 hover:border-primary/30 hover:bg-muted/30 transition-subtle">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground">{example.title}</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
            {example.subtitle}
          </p>
        </div>
        <Badge
          variant={CATEGORY_BADGE[example.category]}
          className="font-label shrink-0 h-[18px] px-1.5 rounded"
        >
          {CATEGORY_LABEL[example.category]}
        </Badge>
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        {example.sourceNote}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="text-[11px] h-6 px-2"
        onClick={() => onLoadExample(example.form)}
        aria-label={`Load Example - Load ${example.title} example`}
      >
        Load Example
      </Button>
    </div>
  )
}
