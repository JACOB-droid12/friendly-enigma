import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ErrorNotice } from "@/components/ErrorNotice"
import { KatexDisplay } from "@/components/KatexDisplay"
import { useDisplayDigits } from "@/lib/display-digits"
import type {
  CubicSplineResult,
  PolynomialData,
  ErrorBody,
  WarningBody,
} from "@/lib/api-types"

/**
 * Renderer for the Piecewise Family `cubic_spline` panel. Reads only
 * fields documented in `docs/API_CONTRACT.md` "P2.4 Natural Cubic
 * Spline Method"; performs no client-side math (R9.6 — no spline
 * coefficients, no segment polynomials, no continuity checks, no
 * sample points, no graph arrays, no segment-index membership for
 * evaluations are computed in the client).
 *
 * Layout follows `design.md` §9.4:
 *
 *   1. Method-level error and warnings (inline `ErrorNotice` for
 *      `unsupported_boundary_condition` per R9.5).
 *   2. Boundary-condition badge (`Badge` variant `secondary`).
 *   3. Piecewise notice (R9.3) when
 *      `polynomial.expanded_omitted_reason ===
 *      "piecewise_method_no_global_polynomial"`.
 *   4. Ordered-nodes table (`index`, `x`, `y`) wrapped in
 *      `overflow-x-auto rounded-lg` per R14.3.
 *   5. Second-derivatives chip row showing `M_<i> = <value>` per node.
 *   6. Segments table (`index`, `interval`, `coefficients.{a,b,c,d}`,
 *      `local_form`, `expanded`, `latex` via KaTeX), wrapped in
 *      `overflow-x-auto rounded-lg` per R14.3.
 *   7. Continuity-check rows (booleans render as ✓/✗ with `sr-only`
 *      text labels so severity is never carried by color alone).
 *   8. Evaluation chips. When `segment_index` is present, append
 *      "(segment <i>)" in body voice.
 *   9. Construction `steps` `<ol>` matching V1 renderers.
 *
 * On a method-level error response (e.g. `unsupported_boundary_condition`)
 * the backend OMITS every collection / scalar field on the result;
 * only `status`, `warnings`, and `error` are guaranteed. Every
 * consumer below guards with `?? []` / `!= null` so the renderer
 * falls through cleanly to the shared `ErrorNotice` path.
 */

export interface CubicSplineDetailsProps {
  result: CubicSplineResult
  /**
   * Top-level polynomial block from the response. Used to surface the
   * piecewise notice when `expanded_omitted_reason ===
   * "piecewise_method_no_global_polynomial"` (R9.3). The renderer
   * never derives the polynomial; it just inspects the reason string.
   */
  polynomial: PolynomialData
}

function MethodError({ error }: { error: ErrorBody | null }) {
  if (!error) return null
  return (
    <ErrorNotice
      code={error.code}
      message={error.message}
      severity="error"
      layout="block"
      className="mb-3"
    />
  )
}

function MethodWarnings({ warnings }: { warnings: WarningBody[] }) {
  if (warnings.length === 0) return null
  return (
    <div className="space-y-2 mb-3">
      {warnings.map((w, i) => (
        <ErrorNotice
          key={i}
          code={w.code}
          message={w.message}
          severity="warning"
          layout="block"
        />
      ))}
    </div>
  )
}

export default function CubicSplineDetails({
  result,
  polynomial,
}: CubicSplineDetailsProps) {
  const { format, formatLiterals } = useDisplayDigits()

  const isPiecewiseNoGlobal =
    polynomial.expanded_omitted_reason === "piecewise_method_no_global_polynomial"

  // The backend omits collection / scalar fields on a method-level error
  // response (e.g. `unsupported_boundary_condition`). Guard each consumer
  // below with a fallback so the renderer falls through cleanly to the
  // shared `ErrorNotice` path.
  const orderedNodes = result.ordered_nodes ?? []
  const secondDerivatives = result.second_derivatives ?? []
  const segments = result.segments ?? []
  const continuityChecks = result.continuity_checks ?? []
  const evaluations = result.evaluations ?? []
  const steps = result.steps ?? []

  return (
    <div className="space-y-5">
      <MethodError error={result.error} />
      <MethodWarnings warnings={result.warnings} />

      {result.boundary_condition != null && (
        <div className="space-y-2">
          <h3 className="font-label text-foreground">Boundary Condition</h3>
          <div>
            <Badge variant="secondary">{result.boundary_condition}</Badge>
          </div>
        </div>
      )}

      {isPiecewiseNoGlobal && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          This is a piecewise spline; the backend does not return a single
          global polynomial. See the Methods tab below for the segment list.
        </p>
      )}

      {orderedNodes.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-label text-foreground">Ordered Nodes</h3>
          <div className="overflow-x-auto rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-label text-muted-foreground px-3 py-2">
                    index
                  </TableHead>
                  <TableHead className="font-label text-muted-foreground px-3 py-2">
                    x<sub aria-hidden="true">i</sub>
                  </TableHead>
                  <TableHead className="font-label text-muted-foreground px-3 py-2">
                    y<sub aria-hidden="true">i</sub>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderedNodes.map((n) => (
                  <TableRow key={n.index}>
                    <TableCell className="font-numeric text-[11px] py-2 px-3 text-muted-foreground">
                      {n.index}
                    </TableCell>
                    <TableCell className="font-numeric text-[11px] py-2 px-3 tabular-nums">
                      {format(n.x)}
                    </TableCell>
                    <TableCell className="font-numeric text-[11px] py-2 px-3 tabular-nums">
                      {format(n.y)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {secondDerivatives.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-label text-foreground">
            Second Derivatives M<sub aria-hidden="true">i</sub>
          </h3>
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex flex-wrap gap-2">
              {secondDerivatives.map((value, index) => (
                <code
                  key={index}
                  className="font-numeric text-[11px] bg-card rounded-md px-2.5 py-1 not-italic tabular-nums"
                >
                  M<sub>{index}</sub> = {format(value)}
                </code>
              ))}
            </div>
          </div>
        </div>
      )}

      {segments.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-label text-foreground">Segments</h3>
          <div className="overflow-x-auto rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-label text-muted-foreground px-3 py-2">
                    index
                  </TableHead>
                  <TableHead className="font-label text-muted-foreground px-3 py-2">
                    interval
                  </TableHead>
                  <TableHead className="font-label text-muted-foreground px-3 py-2">
                    a
                  </TableHead>
                  <TableHead className="font-label text-muted-foreground px-3 py-2">
                    b
                  </TableHead>
                  <TableHead className="font-label text-muted-foreground px-3 py-2">
                    c
                  </TableHead>
                  <TableHead className="font-label text-muted-foreground px-3 py-2">
                    d
                  </TableHead>
                  <TableHead className="font-label text-muted-foreground px-3 py-2">
                    local_form
                  </TableHead>
                  <TableHead className="font-label text-muted-foreground px-3 py-2">
                    expanded
                  </TableHead>
                  <TableHead className="font-label text-muted-foreground px-3 py-2">
                    LaTeX
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {segments.map((seg) => (
                  <TableRow key={seg.index}>
                    <TableCell className="font-numeric text-[11px] py-2 px-3 text-muted-foreground">
                      {seg.index}
                    </TableCell>
                    <TableCell className="font-numeric text-[11px] py-2 px-3 tabular-nums whitespace-nowrap">
                      [{format(seg.interval.left)}, {format(seg.interval.right)}]
                    </TableCell>
                    <TableCell className="font-numeric text-[11px] py-2 px-3 tabular-nums">
                      {format(seg.coefficients.a)}
                    </TableCell>
                    <TableCell className="font-numeric text-[11px] py-2 px-3 tabular-nums">
                      {format(seg.coefficients.b)}
                    </TableCell>
                    <TableCell className="font-numeric text-[11px] py-2 px-3 tabular-nums">
                      {format(seg.coefficients.c)}
                    </TableCell>
                    <TableCell className="font-numeric text-[11px] py-2 px-3 tabular-nums">
                      {format(seg.coefficients.d)}
                    </TableCell>
                    <TableCell className="font-numeric text-[11px] py-2 px-3 break-all">
                      <code className="not-italic">{formatLiterals(seg.local_form)}</code>
                    </TableCell>
                    <TableCell className="font-numeric text-[11px] py-2 px-3 break-all">
                      <code className="not-italic">{formatLiterals(seg.expanded)}</code>
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <KatexDisplay
                        latex={seg.latex}
                        plainText={seg.expanded}
                        displayMode={false}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {continuityChecks.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-label text-foreground">Continuity Checks</h3>
          <div className="overflow-x-auto rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-label text-muted-foreground px-3 py-2">
                    x
                  </TableHead>
                  <TableHead className="font-label text-muted-foreground px-3 py-2">
                    value continuous
                  </TableHead>
                  <TableHead
                    className="font-label text-muted-foreground px-3 py-2"
                    aria-label="first derivative continuous"
                  >
                    S&prime;(x) continuous
                  </TableHead>
                  <TableHead
                    className="font-label text-muted-foreground px-3 py-2"
                    aria-label="second derivative continuous"
                  >
                    S&Prime;(x) continuous
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {continuityChecks.map((check, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-numeric text-[11px] py-2 px-3 tabular-nums">
                      {format(check.x)}
                    </TableCell>
                    <TableCell className="font-numeric text-[11px] py-2 px-3">
                      <ContinuityMark ok={check.value_continuous} />
                    </TableCell>
                    <TableCell className="font-numeric text-[11px] py-2 px-3">
                      <ContinuityMark ok={check.first_derivative_continuous} />
                    </TableCell>
                    <TableCell className="font-numeric text-[11px] py-2 px-3">
                      <ContinuityMark ok={check.second_derivative_continuous} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {evaluations.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-label text-foreground">Evaluations</h3>
          <div className="flex flex-wrap gap-2">
            {evaluations.map((ev, i) => (
              <code
                key={i}
                className="font-numeric text-xs bg-primary/5 border border-primary/20 rounded-md px-2.5 py-1 not-italic tabular-nums"
              >
                P({format(ev.x)}) = {format(ev.value)}
                {ev.segment_index != null && (
                  <span className="ml-1 text-muted-foreground font-sans not-italic">
                    (segment {ev.segment_index})
                  </span>
                )}
              </code>
            ))}
          </div>
        </div>
      )}

      {steps.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-label text-foreground">Construction Steps</h3>
          <ol className="list-decimal list-inside space-y-1.5 text-xs text-muted-foreground leading-relaxed pl-1">
            {steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

/**
 * Pair a tick/cross glyph (visual) with an `sr-only` text label so
 * screen readers announce the boolean state. Severity is never carried
 * by color or glyph alone (R9.1 / accessibility convention used by
 * `ErrorNotice` and `HermiteDetails`).
 */
function ContinuityMark({ ok }: { ok: boolean }) {
  return (
    <>
      <span aria-hidden="true">{ok ? "✓" : "✗"}</span>
      <span className="sr-only">{ok ? "yes" : "no"}</span>
    </>
  )
}
