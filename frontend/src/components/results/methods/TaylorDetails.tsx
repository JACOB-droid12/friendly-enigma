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
import type { TaylorResult, ErrorBody, WarningBody } from "@/lib/api-types"

/**
 * Renderer for the Function-Derivative Family `taylor` panel. Reads only
 * fields documented in `docs/API_CONTRACT.md` "P2.3 Taylor Method";
 * performs no client-side math (R8.5 — no SymPy, no Math.js, no
 * symbolic engine).
 *
 * Layout follows `design.md` §9.3:
 *   1. Method-level error and warnings (inline `ErrorNotice` for
 *      `unsupported_taylor_function` per R8.4).
 *   2. Header row with `center`, `order`, `series_name`. When
 *      `series_name === "Maclaurin"`, surface a small Badge
 *      "Maclaurin (center = 0)" without altering polynomial fields
 *      (R8.3).
 *   3. Term table (one row per `terms[]`) with columns `order`,
 *      `derivative`, `derivative_at_center`, `coefficient`, `term`,
 *      `latex_term` rendered through `KatexDisplay`. Wrapped in
 *      `overflow-x-auto rounded-lg` per R14.3.
 *   4. Polynomial forms: `taylor_form`, `expanded` (when non-null),
 *      `latex_expanded` (when non-null), `latex_taylor` (when
 *      non-null), reusing the `NewtonDetails` `<pre>` pattern for
 *      plain text and the `KatexDisplay` wrapper for LaTeX.
 *   5. Evaluation chips (`P(x) = value`).
 *   6. `remainder_note` rendered exactly — no editing, no truncation.
 *   7. Construction steps `<ol>` matching V1 renderers.
 *
 * On a method-level error response (e.g. `unsupported_taylor_function`)
 * the backend OMITS every collection / scalar field on the result;
 * only `status`, `warnings`, and `error` are guaranteed. Every
 * consumer below guards with `?? []` / `?.` / `!= null` so the
 * renderer falls through cleanly to the shared `ErrorNotice` path.
 */

interface TaylorDetailsProps {
  result: TaylorResult
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

export default function TaylorDetails({ result }: TaylorDetailsProps) {
  const { format, formatLiterals } = useDisplayDigits()
  const isMaclaurin = result.series_name === "Maclaurin"

  const terms = result.terms ?? []
  const evaluations = result.evaluations ?? []
  const steps = result.steps ?? []

  const showConfig =
    result.center != null || result.order != null || (result.series_name ?? "") !== ""

  return (
    <div className="space-y-5">
      <MethodError error={result.error} />
      <MethodWarnings warnings={result.warnings} />

      {showConfig && (
        <div className="space-y-2">
          <h3 className="font-label text-foreground">Taylor Configuration</h3>
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex flex-wrap items-center gap-2">
              {result.center != null && (
                <code className="font-numeric text-[11px] bg-card rounded-md px-2.5 py-1 not-italic tabular-nums">
                  <span className="text-muted-foreground">center = </span>
                  {format(result.center)}
                </code>
              )}
              {result.order != null && (
                <code className="font-numeric text-[11px] bg-card rounded-md px-2.5 py-1 not-italic tabular-nums">
                  <span className="text-muted-foreground">order = </span>
                  {String(result.order)}
                </code>
              )}
              {result.series_name && (
                <span className="font-label text-[11px] text-muted-foreground">
                  Series: {result.series_name}
                </span>
              )}
              {isMaclaurin && (
                <Badge variant="secondary" className="text-[10px]">
                  Maclaurin (center = 0)
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {terms.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-label text-foreground">Taylor Terms</h3>
          <div className="overflow-x-auto rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-label text-muted-foreground px-3 py-2">
                    order
                  </TableHead>
                  <TableHead className="font-label text-muted-foreground px-3 py-2">
                    derivative
                  </TableHead>
                  <TableHead
                    className="font-label text-muted-foreground px-3 py-2"
                    aria-label="derivative evaluated at the center"
                  >
                    f<sup aria-hidden="true">(k)</sup>(c)
                  </TableHead>
                  <TableHead className="font-label text-muted-foreground px-3 py-2">
                    coefficient
                  </TableHead>
                  <TableHead className="font-label text-muted-foreground px-3 py-2">
                    term
                  </TableHead>
                  <TableHead className="font-label text-muted-foreground px-3 py-2">
                    LaTeX
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {terms.map((t) => (
                  <TableRow key={t.order}>
                    <TableCell className="font-numeric text-[11px] py-2 px-3 tabular-nums">
                      {t.order}
                    </TableCell>
                    <TableCell className="font-numeric text-[11px] py-2 px-3">
                      <code className="not-italic">{formatLiterals(t.derivative)}</code>
                    </TableCell>
                    <TableCell className="font-numeric text-[11px] py-2 px-3 tabular-nums">
                      {format(t.derivative_at_center)}
                    </TableCell>
                    <TableCell className="font-numeric text-[11px] py-2 px-3 tabular-nums">
                      {format(t.coefficient)}
                    </TableCell>
                    <TableCell className="font-numeric text-[11px] py-2 px-3">
                      <code className="not-italic">{formatLiterals(t.term)}</code>
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <KatexDisplay
                        latex={t.latex_term}
                        plainText={t.term}
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

      {result.taylor_form && (
        <div className="space-y-2">
          <h3 className="font-label text-foreground">Taylor Form</h3>
          <pre className="text-[11px] font-numeric bg-muted/30 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
            {formatLiterals(result.taylor_form)}
          </pre>
        </div>
      )}

      {result.expanded != null && (
        <div className="space-y-2">
          <h3 className="font-label text-foreground">Expanded</h3>
          <pre className="text-[11px] font-numeric bg-muted/30 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
            {formatLiterals(result.expanded)}
          </pre>
        </div>
      )}

      {result.latex_expanded != null && (
        <div className="space-y-2">
          <h3 className="font-label text-foreground">Expanded (LaTeX)</h3>
          <div className="bg-muted/30 rounded-lg p-4">
            <KatexDisplay
              latex={result.latex_expanded}
              plainText={result.expanded ?? null}
            />
          </div>
        </div>
      )}

      {result.latex_taylor != null && (
        <div className="space-y-2">
          <h3 className="font-label text-foreground">Taylor Form (LaTeX)</h3>
          <div className="bg-muted/30 rounded-lg p-4">
            <KatexDisplay
              latex={result.latex_taylor}
              plainText={result.taylor_form ?? null}
            />
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
              </code>
            ))}
          </div>
        </div>
      )}

      {result.remainder_note && (
        <div className="space-y-2">
          <h3 className="font-label text-foreground">Remainder Note</h3>
          {/*
           * Render `remainder_note` text exactly per R8.4 — no editing,
           * no truncation, no display-digit rounding.
           */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            {result.remainder_note}
          </p>
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
