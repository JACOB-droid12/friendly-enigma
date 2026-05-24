import { AlertCircle, AlertTriangle, CheckCircle2, Info, LineChart } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { InterpolateResponse, WarningBody } from "@/lib/api-types"
import { getWarningMeta, type WarningSeverity } from "@/lib/warnings"

interface ResultQualityGuideProps {
  data: InterpolateResponse
}

const SEVERITY_CLASSES: Record<
  WarningSeverity,
  { container: string; icon: string; label: string; body: string; badge: "info" | "warning" | "destructive" }
> = {
  info: {
    container: "bg-info/5 ring-1 ring-inset ring-info/15",
    icon: "text-info",
    label: "text-info",
    body: "text-info-foreground",
    badge: "info",
  },
  warning: {
    container: "bg-warning/5 ring-1 ring-inset ring-warning/20",
    icon: "text-warning",
    label: "text-warning",
    body: "text-warning-foreground",
    badge: "warning",
  },
  error: {
    container: "bg-destructive/5 ring-1 ring-inset ring-destructive/20",
    icon: "text-destructive",
    label: "text-destructive",
    body: "text-destructive",
    badge: "destructive",
  },
}

const WARNING_GUIDANCE: Record<string, { means: string; check: string }> = {
  high_degree_warning: {
    means:
      "The backend is warning that many nodes can make the interpolating polynomial sensitive between nodes.",
    check: "Check the graph shape, compare methods, and consider fewer or better-spaced nodes.",
  },
  runge_warning: {
    means:
      "The backend detected a setup where equally spaced high-degree interpolation can oscillate near the interval edges.",
    check: "Check endpoint behavior on the graph and consider Chebyshev-style nodes if interval mode is available.",
  },
  close_x_warning: {
    means:
      "Some x-values are very close, which can make interpolation coefficients numerically sensitive.",
    check: "Check whether near-duplicate nodes are intentional and compare method outputs at the target x-values.",
  },
  extrapolation_warning: {
    means:
      "An evaluation target is outside the node range, so the result is extrapolation rather than interpolation.",
    check: "Check whether the target x-value should be inside the data interval before trusting the value.",
  },
  method_disagreement_warning: {
    means:
      "Selected methods did not agree within the backend comparison tolerance.",
    check: "Check the method values table, precision setting, and input nodes before presenting the result.",
  },
  expanded_polynomial_omitted: {
    means:
      "The backend omitted the expanded polynomial to keep the response readable.",
    check: "Use the returned method forms, tables, and evaluations instead of expecting a large expanded expression.",
  },
  neville_requires_evaluation_x: {
    means:
      "Neville's Method is target-specific and needs an evaluation x-value to produce its recursive table.",
    check: "Add an evaluation target if you want to inspect Neville's table.",
  },
  graph_sampling_domain_error: {
    means:
      "The backend could not sample every requested graph point, usually because the function is undefined somewhere.",
    check: "Check the interval, graph gaps, and original function domain.",
  },
  method_failed: {
    means:
      "A selected method reported a backend failure while other response data may still be available.",
    check: "Check the method details and avoid presenting failed method output as verified.",
  },
  nodes_reordered: {
    means:
      "The backend reordered nodes for computation or presentation consistency.",
    check: "Check the node table before matching rows to lecture notes or handwritten work.",
  },
}

function SeverityIcon({ severity, className }: { severity: WarningSeverity; className: string }) {
  const Icon = severity === "info" ? Info : severity === "error" ? AlertCircle : AlertTriangle
  return <Icon className={className} aria-hidden="true" />
}

function trustSummary(data: InterpolateResponse) {
  if (data.status === "partial") {
    return {
      label: "Review before trusting",
      badge: "warning" as const,
      text: "The backend returned a partial result. Use only the successful method outputs and review warnings before presenting.",
    }
  }

  if (data.warnings.length > 0) {
    return {
      label: "Use with caution",
      badge: "warning" as const,
      text: `${data.warnings.length} backend warning${data.warnings.length === 1 ? "" : "s"} should be reviewed before trusting the result.`,
    }
  }

  return {
    label: "No backend warnings",
    badge: "success" as const,
    text: "No backend warnings were reported.",
  }
}

function guidanceFor(warning: WarningBody) {
  return (
    WARNING_GUIDANCE[warning.code] ?? {
      means: "The backend reported a caution for this result.",
      check: "Read the backend message and compare the relevant result tables before presenting.",
    }
  )
}

function evaluationComparisons(data: InterpolateResponse) {
  return data.evaluations.filter(
    (evaluation) => evaluation.f_x !== null || evaluation.absolute_error !== null,
  )
}

export function ResultQualityGuide({ data }: ResultQualityGuideProps) {
  const summary = trustSummary(data)
  const comparisons = evaluationComparisons(data)
  const graphPointCount = data.graph_data?.x.length

  return (
    <section className="rounded-xl border bg-card overflow-hidden">
      <div className="px-5 py-3 border-b bg-muted/30 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Result Quality</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            Trust notes from backend warnings, evaluations, and graph data.
          </p>
        </div>
        <Badge variant={summary.badge}>{summary.label}</Badge>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex items-start gap-3 rounded-lg bg-muted/35 px-4 py-3">
          <CheckCircle2
            className={`mt-0.5 h-4 w-4 shrink-0 ${
              data.warnings.length === 0 && data.status === "ok" ? "text-success" : "text-warning"
            }`}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="font-label text-muted-foreground">Trust this result?</p>
            <p className="mt-1 text-sm leading-relaxed text-foreground">{summary.text}</p>
            {data.warnings.length === 0 && (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Review the polynomial, method tables, and evaluations before presenting.
              </p>
            )}
          </div>
        </div>

        {data.warnings.length > 0 ? (
          <div className="space-y-2">
            {data.warnings.map((warning, index) => {
              const meta = getWarningMeta(warning.code)
              const classes = SEVERITY_CLASSES[meta.severity]
              const guide = guidanceFor(warning)
              const role = meta.severity === "error" ? "alert" : "status"

              return (
                <article
                  key={`${warning.code}-${index}`}
                  className={`rounded-lg px-4 py-3 ${classes.container}`}
                  role={role}
                  aria-label={`${meta.label} warning quality note`}
                >
                  <div className="flex items-start gap-3">
                    <SeverityIcon
                      severity={meta.severity}
                      className={`mt-0.5 h-4 w-4 shrink-0 ${classes.icon}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`font-label ${classes.label}`}>{meta.label}</span>
                        <span className="font-numeric text-[11px] text-muted-foreground break-all">
                          {warning.code}
                        </span>
                      </div>
                      <p className={`mt-1 text-sm leading-relaxed ${classes.body}`}>{warning.message}</p>
                      <dl className="mt-3 grid gap-2 text-xs leading-relaxed sm:grid-cols-2">
                        <div>
                          <dt className="font-label text-muted-foreground">What it means</dt>
                          <dd className="mt-1 text-muted-foreground">{guide.means}</dd>
                        </div>
                        <div>
                          <dt className="font-label text-muted-foreground">Check next</dt>
                          <dd className="mt-1 text-muted-foreground">{guide.check}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div
            className="flex items-start gap-3 rounded-lg bg-success/5 ring-1 ring-inset ring-success/20 px-4 py-3"
            role="status"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
            <div>
              <p className="font-label text-success">No backend warnings</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                No backend warnings were reported for this result.
              </p>
            </div>
          </div>
        )}

        {comparisons.length > 0 && (
          <div className="rounded-lg bg-muted/35 px-4 py-3">
            <p className="font-label text-muted-foreground">Evaluation comparison</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              These values compare the interpolating polynomial against the original function at evaluated x-values.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {comparisons.map((evaluation) => (
                <div key={evaluation.x} className="rounded-md bg-background px-3 py-2">
                  <p className="font-numeric text-xs text-foreground">P({evaluation.x}) = {evaluation.best_P_x}</p>
                  {evaluation.f_x !== null && (
                    <p className="font-numeric text-xs text-foreground">f({evaluation.x}) = {evaluation.f_x}</p>
                  )}
                  {evaluation.absolute_error !== null && (
                    <p className="font-numeric text-xs text-foreground">
                      |error| = {evaluation.absolute_error}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {data.graph_data && (
          <div className="flex items-start gap-3 rounded-lg bg-info/5 ring-1 ring-inset ring-info/15 px-4 py-3">
            <LineChart className="mt-0.5 h-4 w-4 shrink-0 text-info" aria-hidden="true" />
            <div className="min-w-0">
              <p className="font-label text-info">Graph quality note</p>
              <p className="mt-1 text-sm leading-relaxed text-info-foreground">
                The graph is rendered from backend-provided samples only. The frontend does not resample
                f(x), P(x), or the error curve.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Source method:{" "}
                <span className="font-numeric break-all text-foreground">{data.graph_data.source_method}</span>
                {typeof graphPointCount === "number" && (
                  <>
                    {" "}
                    | Samples: <span className="font-numeric text-foreground">{graphPointCount}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
