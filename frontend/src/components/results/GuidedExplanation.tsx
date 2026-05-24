import { AlertTriangle, BookOpenCheck, ListChecks, Presentation, Route } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { InterpolateResponse, MethodName } from "@/lib/api-types"

interface GuidedExplanationProps {
  data: InterpolateResponse
}

const INPUT_MODE_LABEL: Record<InterpolateResponse["input_summary"]["mode"], string> = {
  points: "points mode",
  x_values_with_function: "x-values with a function",
  function_interval: "function interval",
}

const METHOD_LABEL: Record<MethodName, string> = {
  lagrange: "Lagrange",
  newton: "Newton",
  barycentric: "Barycentric",
  neville: "Neville",
}

function methodLabels(methods: MethodName[]) {
  return methods.map((method) => METHOD_LABEL[method]).join(", ")
}

function polynomialText(data: InterpolateResponse) {
  if (data.polynomial.expanded) return data.polynomial.expanded
  if (data.polynomial.expanded_omitted_reason) return data.polynomial.expanded_omitted_reason
  return "The backend response did not include an expanded polynomial."
}

function evaluationLines(data: InterpolateResponse) {
  return data.evaluations.map((evaluation) => {
    const lines = [`P(${evaluation.x}) = ${evaluation.best_P_x}`]
    if (evaluation.f_x !== null) lines.push(`f(${evaluation.x}) = ${evaluation.f_x}`)
    if (evaluation.absolute_error !== null) lines.push(`|error| = ${evaluation.absolute_error}`)
    return lines
  })
}

function SectionHeader({
  title,
  icon,
}: {
  title: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary">
        {icon}
      </span>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
  )
}

function MethodBlock({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg border bg-background px-4 py-3">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <div className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  )
}

export function GuidedExplanation({ data }: GuidedExplanationProps) {
  const { input_summary: summary } = data
  const methods = summary.methods_requested
  const evaluations = evaluationLines(data)
  const hasWarnings = data.warnings.length > 0
  const nevilleTargets = data.methods.neville?.target_results.map((result) => result.x).join(", ")
  const graphSource = data.graph_data?.source_method

  return (
    <div className="space-y-5">
      <section className="rounded-xl border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Guided Explanation</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Defense notes based on backend output and lecture-covered interpolation methods.
            </p>
          </div>
          <Badge variant={data.status === "ok" ? "success" : data.status === "partial" ? "warning" : "destructive"}>
            {data.status}
          </Badge>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-muted/35 px-4 py-3">
              <span className="font-label text-muted-foreground">Input type</span>
              <p className="mt-1 text-sm font-medium text-foreground">{INPUT_MODE_LABEL[summary.mode]}</p>
            </div>
            <div className="rounded-lg bg-muted/35 px-4 py-3">
              <span className="font-label text-muted-foreground">Nodes</span>
              <p className="mt-1 text-sm font-medium font-numeric text-foreground">{summary.node_count}</p>
            </div>
            <div className="rounded-lg bg-muted/35 px-4 py-3">
              <span className="font-label text-muted-foreground">Expected degree</span>
              <p className="mt-1 text-sm font-medium font-numeric text-foreground">{summary.degree}</p>
            </div>
            <div className="rounded-lg bg-muted/35 px-4 py-3">
              <span className="font-label text-muted-foreground">Selected methods</span>
              <p className="mt-1 text-sm font-medium text-foreground">{methodLabels(methods)}</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
            <section className="rounded-lg border bg-background px-4 py-3">
              <SectionHeader
                title="Polynomial result"
                icon={<BookOpenCheck className="h-3.5 w-3.5" aria-hidden="true" />}
              />
              <p className="mt-3 rounded-md bg-muted/35 px-3 py-2 font-mono text-sm text-foreground">
                {polynomialText(data)}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                This is the polynomial representation returned by the backend. The frontend displays it
                as received and does not rebuild the interpolation formula.
              </p>
            </section>

            <section className="rounded-lg border bg-background px-4 py-3">
              <SectionHeader
                title="Evaluation result"
                icon={<Route className="h-3.5 w-3.5" aria-hidden="true" />}
              />
              {evaluations.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {evaluations.map((lines, index) => (
                    <div key={index} className="rounded-md bg-muted/35 px-3 py-2 text-sm">
                      {lines.map((line) => (
                        <p key={line} className="font-mono text-foreground">
                          {line}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  No evaluation target was included in this backend response.
                </p>
              )}
            </section>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b bg-muted/30">
          <SectionHeader
            title="Method guide"
            icon={<ListChecks className="h-3.5 w-3.5" aria-hidden="true" />}
          />
        </div>
        <div className="p-5 grid gap-3 md:grid-cols-2">
          {data.methods.lagrange && (
            <MethodBlock title="Lagrange">
              <p>
                Lagrange builds basis polynomials for the nodes. Each basis polynomial is shaped to be
                1 at its own node and 0 at the other nodes, so the combined polynomial passes through
                all supplied nodes.
              </p>
              <p className="mt-2">
                Backend basis entries shown: {data.methods.lagrange.basis_polynomials.length}
              </p>
            </MethodBlock>
          )}

          {data.methods.newton && (
            <MethodBlock title="Newton">
              <p>
                Newton uses the divided-difference table to build coefficients for the Newton form.
                The table and nested form are returned by the backend for step-by-step review.
              </p>
              <p className="mt-2">
                Backend table rows: {data.methods.newton.divided_difference_table.length}
              </p>
            </MethodBlock>
          )}

          {data.methods.neville && (
            <MethodBlock title="Neville">
              <p>
                Neville's Method uses a recursive table to evaluate the interpolating polynomial at a
                requested target x. It is most useful when presenting a target-specific approximation.
              </p>
              <p className="mt-2">Backend target x values: {nevilleTargets || "none"}</p>
            </MethodBlock>
          )}

          {data.methods.barycentric && (
            <MethodBlock title="Barycentric">
              <p>
                Barycentric is presented here as stable numerical evaluation and graph support. The
                lecture sources reviewed for this goal emphasize Lagrange, Newton, and Neville as the
                classroom methods.
              </p>
              {graphSource && <p className="mt-2">Backend graph source method: {graphSource}</p>}
            </MethodBlock>
          )}
        </div>
      </section>

      <section className="rounded-xl border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b bg-muted/30">
          <SectionHeader
            title="How to present this result"
            icon={<Presentation className="h-3.5 w-3.5" aria-hidden="true" />}
          />
        </div>
        <div className="p-5">
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
            <li>
              Start with the input: {INPUT_MODE_LABEL[summary.mode]}, {summary.node_count} nodes, and
              backend-reported degree {summary.degree}.
            </li>
            <li>
              State the selected methods: {methodLabels(methods)}. Use Lagrange for basis polynomials,
              Newton for divided differences, and Neville for the target table when those outputs are present.
            </li>
            <li>
              Present the polynomial and target evaluation exactly as returned by the backend.
            </li>
            <li>
              Close with warnings or limitations. Warnings are backend notices, not frontend judgments.
            </li>
          </ol>
        </div>
      </section>

      {hasWarnings && (
        <section className="rounded-xl border bg-card overflow-hidden" aria-label="Backend warnings">
          <div className="px-5 py-3 border-b bg-warning/5 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-foreground">Backend warnings</h3>
          </div>
          <div className="p-5 space-y-2">
            {data.warnings.map((warning, index) => (
              <div key={`${warning.code}-${index}`} className="rounded-lg bg-warning/5 px-4 py-3">
                <p className="font-label text-warning">{warning.code}</p>
                <p className="mt-1 text-sm leading-relaxed text-warning-foreground">{warning.message}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
