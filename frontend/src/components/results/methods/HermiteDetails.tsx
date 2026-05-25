import { useMemo } from "react"
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
  HermiteDividedDifferenceResult,
  HermiteResult,
  HermiteBasisFormIncluded,
  ErrorBody,
  WarningBody,
} from "@/lib/api-types"

/**
 * Renderer for the Derivative-Data Family methods
 * `hermite_divided_difference` and `hermite`. Reads only fields
 * documented in `docs/API_CONTRACT.md` "P2.2 Derivative-Data Methods";
 * performs no client-side math (R7.5).
 *
 * Layout follows `design.md` §9.2:
 *
 *   1. Method-level error and warnings (via shared `ErrorNotice`).
 *      `missing_derivative_data` and `invalid_derivative_order` route
 *      through the same path; the renderer never auto-fills or
 *      estimates derivatives (R7.4).
 *   2. Repeated-nodes table — one row per `repeated_nodes[i]`, wrapped
 *      in `overflow-x-auto rounded-lg` (R14.3).
 *   3. Divided-difference table — same triangular layout as
 *      `NewtonDetails`. Header `Δ⁰`, `Δ¹`, `Δ²`, … per the design.
 *   4. Coefficients chip row — one chip per `coefficients[i]`.
 *   5. Newton nested form (`<pre>`, `font-numeric`).
 *   6. Expanded form (when `expanded` non-null).
 *   7. Expanded LaTeX through `KatexDisplay` (when `latex_expanded`
 *      non-null).
 *   8. For `method === "hermite"` only, when `basis_form` is present:
 *        - `included` → formula line, basis-term table, expanded form,
 *          latex via KaTeX, and the `matches_divided_difference`
 *          indicator.
 *        - `omitted`  → informational notice surfacing the matching
 *          `expanded_polynomial_omitted` warning (whose
 *          `details.artifact === "hermite_basis_form"`); falls back
 *          to a body-voice line when the warning is absent. Per R7.3,
 *          the basis form is never reconstructed on the client.
 *   9. Construction `steps` `<ol>` (existing pattern).
 */

type HermiteMethod = "hermite_divided_difference" | "hermite"

interface HermiteDetailsProps {
  method: HermiteMethod
  result: HermiteDividedDifferenceResult | HermiteResult
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

export default function HermiteDetails({ method, result }: HermiteDetailsProps) {
  const { format, formatLiterals, digits } = useDisplayDigits()

  // The backend omits collection / scalar fields on a method-level error
  // response (e.g. `missing_derivative_data`). Guard each consumer below
  // with a fallback so the renderer falls through cleanly to the shared
  // `ErrorNotice` path.
  const dividedDifferenceTable = result.divided_difference_table ?? []
  const coefficients = result.coefficients ?? []
  const repeatedNodes = result.repeated_nodes ?? []
  const steps = result.steps ?? []

  // Divided-difference tables can be large for higher-degree fits. Memoize
  // per `digits` so changing the Display ladder is the only re-format
  // trigger, mirroring `NewtonDetails`.
  const formattedTable = useMemo(
    () =>
      dividedDifferenceTable.map((row) =>
        row.map((cell) => (cell != null ? format(cell) : null)),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dividedDifferenceTable, digits],
  )

  const formattedCoefficients = useMemo(
    () => coefficients.map((value) => format(value)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [coefficients, digits],
  )

  const headerColumnCount = useMemo(() => {
    let max = 0
    for (const row of formattedTable) {
      if (row.length > max) max = row.length
    }
    return max
  }, [formattedTable])

  // Narrow check for the basis branch per the task notes. Only `hermite`
  // carries a `basis_form`.
  const hermiteResult = method === "hermite" && "basis_form" in result
    ? (result as HermiteResult)
    : null
  const basisForm = hermiteResult?.basis_form

  return (
    <div className="space-y-5">
      <MethodError error={result.error} />
      <MethodWarnings warnings={result.warnings} />

      {repeatedNodes.length > 0 && (
        <RepeatedNodesTable nodes={repeatedNodes} />
      )}

      {formattedTable.length > 0 && headerColumnCount > 0 && (
        <div className="space-y-2">
          <h3 className="font-label text-foreground">Divided-Difference Table</h3>
          <div className="overflow-x-auto rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  {Array.from({ length: headerColumnCount }, (_, j) => (
                    <TableHead
                      key={j}
                      className="font-label text-muted-foreground px-3 py-2"
                      aria-label={j === 0 ? "f at x sub i" : `delta ${j} divided difference`}
                    >
                      {j === 0 ? (
                        <>f[x<sub aria-hidden="true">i</sub>]</>
                      ) : (
                        <>&Delta;<span aria-hidden="true">{j}</span></>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {formattedTable.map((row, i) => (
                  <TableRow key={i}>
                    {row.map((cell, j) => (
                      <TableCell key={j} className="font-numeric text-[11px] py-2 px-3">
                        {cell != null ? cell : (
                          <span className="text-muted-foreground/40" aria-label="not available">·</span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {formattedCoefficients.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-label text-foreground">Coefficients</h3>
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex flex-wrap gap-2">
              {formattedCoefficients.map((value, index) => (
                <code
                  key={index}
                  className="font-numeric text-[11px] bg-card rounded-md px-2.5 py-1 not-italic"
                >
                  c<sub>{index}</sub> = {value}
                </code>
              ))}
            </div>
          </div>
        </div>
      )}

      {result.nested_form && (
        <div className="space-y-2">
          <h3 className="font-label text-foreground">Newton Nested Form</h3>
          <pre className="text-[11px] font-numeric bg-muted/30 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
            {formatLiterals(result.nested_form)}
          </pre>
        </div>
      )}

      {result.expanded && (
        <div className="space-y-2">
          <h3 className="font-label text-foreground">Expanded</h3>
          <pre className="text-[11px] font-numeric bg-muted/30 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
            {formatLiterals(result.expanded)}
          </pre>
        </div>
      )}

      {result.latex_expanded && (
        <div className="space-y-2">
          <h3 className="font-label text-foreground">Expanded (LaTeX)</h3>
          <div className="bg-muted/30 rounded-lg p-4">
            <KatexDisplay
              latex={result.latex_expanded}
              plainText={result.expanded}
            />
          </div>
        </div>
      )}

      {basisForm && basisForm.status === "included" && (
        <BasisFormIncluded basisForm={basisForm} />
      )}

      {basisForm && basisForm.status === "omitted" && (
        <BasisFormOmitted warnings={result.warnings} />
      )}

      {steps.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-label text-foreground">Construction Steps</h3>
          <ol className="list-decimal list-inside space-y-1.5 text-xs text-muted-foreground leading-relaxed pl-1">
            {steps.map((step, i) => <li key={i}>{step}</li>)}
          </ol>
        </div>
      )}
    </div>
  )
}

function RepeatedNodesTable({
  nodes,
}: {
  nodes: NonNullable<HermiteDividedDifferenceResult["repeated_nodes"]>
}) {
  const { format } = useDisplayDigits()
  return (
    <div className="space-y-2">
      <h3 className="font-label text-foreground">Repeated Nodes</h3>
      <div className="overflow-x-auto rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-label text-muted-foreground px-3 py-2">index</TableHead>
              <TableHead className="font-label text-muted-foreground px-3 py-2">
                source_node_index
              </TableHead>
              <TableHead className="font-label text-muted-foreground px-3 py-2">
                x<sub aria-hidden="true">i</sub>
              </TableHead>
              <TableHead className="font-label text-muted-foreground px-3 py-2">
                y<sub aria-hidden="true">i</sub>
              </TableHead>
              <TableHead className="font-label text-muted-foreground px-3 py-2">
                f&prime;(x<sub aria-hidden="true">i</sub>)
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {nodes.map((n) => (
              <TableRow key={n.index}>
                <TableCell className="font-numeric text-[11px] py-2 px-3 text-muted-foreground">
                  {n.index}
                </TableCell>
                <TableCell className="font-numeric text-[11px] py-2 px-3 text-muted-foreground">
                  {n.source_node_index}
                </TableCell>
                <TableCell className="font-numeric text-[11px] py-2 px-3">
                  {format(n.x)}
                </TableCell>
                <TableCell className="font-numeric text-[11px] py-2 px-3">
                  {format(n.y)}
                </TableCell>
                <TableCell className="font-numeric text-[11px] py-2 px-3">
                  {n.first_derivative != null ? (
                    format(n.first_derivative)
                  ) : (
                    <span className="text-muted-foreground/40" aria-label="not available">·</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function BasisFormIncluded({ basisForm }: { basisForm: HermiteBasisFormIncluded }) {
  const { format, formatLiterals } = useDisplayDigits()
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="font-label text-foreground">Hermite Basis Form</h3>
        <pre className="text-[11px] font-numeric bg-muted/30 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
          {basisForm.formula}
        </pre>
      </div>

      {basisForm.terms.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-label text-foreground">Basis Terms</h3>
          <div className="overflow-x-auto rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-label text-muted-foreground px-3 py-2">
                    node_index
                  </TableHead>
                  <TableHead className="font-label text-muted-foreground px-3 py-2">
                    x<sub aria-hidden="true">i</sub>
                  </TableHead>
                  <TableHead className="font-label text-muted-foreground px-3 py-2">
                    f(x<sub aria-hidden="true">i</sub>)
                  </TableHead>
                  <TableHead className="font-label text-muted-foreground px-3 py-2">
                    f&prime;(x<sub aria-hidden="true">i</sub>)
                  </TableHead>
                  <TableHead className="font-label text-muted-foreground px-3 py-2">
                    L<sub aria-hidden="true">i</sub>(x)
                  </TableHead>
                  <TableHead className="font-label text-muted-foreground px-3 py-2">
                    H<sub aria-hidden="true">i</sub>(x)
                  </TableHead>
                  <TableHead className="font-label text-muted-foreground px-3 py-2">
                    K<sub aria-hidden="true">i</sub>(x)
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {basisForm.terms.map((t) => (
                  <TableRow key={t.node_index}>
                    <TableCell className="font-numeric text-[11px] py-2 px-3 text-muted-foreground">
                      {t.node_index}
                    </TableCell>
                    <TableCell className="font-numeric text-[11px] py-2 px-3">
                      {format(t.x)}
                    </TableCell>
                    <TableCell className="font-numeric text-[11px] py-2 px-3">
                      {format(t.f_x)}
                    </TableCell>
                    <TableCell className="font-numeric text-[11px] py-2 px-3">
                      {format(t.f_prime_x)}
                    </TableCell>
                    <TableCell className="font-numeric text-[11px] py-2 px-3 break-all">
                      {formatLiterals(t.lagrange_basis)}
                    </TableCell>
                    <TableCell className="font-numeric text-[11px] py-2 px-3 break-all">
                      {formatLiterals(t.value_basis)}
                    </TableCell>
                    <TableCell className="font-numeric text-[11px] py-2 px-3 break-all">
                      {formatLiterals(t.derivative_basis)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {basisForm.expanded && (
        <div className="space-y-2">
          <h3 className="font-label text-foreground">Basis Expanded</h3>
          <pre className="text-[11px] font-numeric bg-muted/30 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
            {formatLiterals(basisForm.expanded)}
          </pre>
        </div>
      )}

      {basisForm.latex && (
        <div className="space-y-2">
          <h3 className="font-label text-foreground">Basis Expanded (LaTeX)</h3>
          <div className="bg-muted/30 rounded-lg p-4">
            <KatexDisplay
              latex={basisForm.latex}
              plainText={basisForm.expanded}
            />
          </div>
        </div>
      )}

      <div>
        <Badge variant={basisForm.matches_divided_difference ? "outline" : "warning"}>
          <span className="text-muted-foreground">matches divided difference: </span>
          <span aria-hidden="true">{basisForm.matches_divided_difference ? "✓" : "✗"}</span>
          <span className="sr-only">
            {basisForm.matches_divided_difference ? "yes" : "no"}
          </span>
        </Badge>
      </div>
    </div>
  )
}

function BasisFormOmitted({ warnings }: { warnings: WarningBody[] }) {
  // Per locked decision 2 in tasks.md and design.md §9.2 / §16, the
  // omission state is surfaced via the `expanded_polynomial_omitted`
  // warning whose `details.artifact === "hermite_basis_form"`. The
  // renderer reads only what the backend returned (R7.3, R7.5).
  const omissionWarning = warnings.find(
    (w) =>
      w.code === "expanded_polynomial_omitted" &&
      (w.details as { artifact?: string } | undefined)?.artifact === "hermite_basis_form",
  )

  if (omissionWarning) {
    return (
      <div className="space-y-2">
        <h3 className="font-label text-foreground">Hermite Basis Form</h3>
        <ErrorNotice
          code={omissionWarning.code}
          message={omissionWarning.message}
          severity="info"
          layout="block"
        />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h3 className="font-label text-foreground">Hermite Basis Form</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Hermite basis form omitted by the backend.
      </p>
    </div>
  )
}
