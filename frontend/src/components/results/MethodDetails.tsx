import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ErrorNotice } from "@/components/ErrorNotice"
import { AlertTriangle } from "lucide-react"
import { useMemo, useState } from "react"
import type { InterpolateResponse, MethodName } from "@/lib/api-types"
import { useDisplayDigits } from "@/lib/display-digits"
import { methodShortLabel } from "@/lib/method-metadata"
// Phase 2 family renderers (locked decision 1 in tasks.md): each Phase 2
// panel delegates to its per-family renderer under
// `frontend/src/components/results/methods/`. The V1 inline renderers
// (`LagrangeDetails`, `NewtonDetails`, `BarycentricDetails`,
// `NevilleDetails`) intentionally stay inline below — locked decision 1
// only governs the Phase 2 family files.
import EqualSpacingDetails from "./methods/EqualSpacingDetails"
import HermiteDetails from "./methods/HermiteDetails"
import TaylorDetails from "./methods/TaylorDetails"
import CubicSplineDetails from "./methods/CubicSplineDetails"
import OsculatingDetails from "./methods/OsculatingDetails"

/**
 * Pick the default tab for `MethodDetails`. Prefers Classroom-Facing Methods
 * (Lagrange → Newton → Neville) when any are available, since those are the
 * methods most users want to inspect first. Falls back to whatever `available`
 * contains (for example Barycentric only) when no Classroom-Facing Method is
 * present, and finally to `"lagrange"` as a last resort if `available` is
 * empty (callers should already guard against the empty case).
 */
function pickInitialTab(available: MethodName[]): MethodName {
  const classroom: MethodName[] = ["lagrange", "newton", "neville"]
  const first = classroom.find((m) => available.includes(m))
  if (first) return first
  return available[0] ?? "lagrange"
}

interface MethodDetailsProps {
  data: InterpolateResponse
}

/**
 * Per-method active-tab tint, keyed to the same role taxonomy used by
 * `SummaryCard`. Construction methods (Lagrange, Newton) keep the neutral
 * lifted-pill active state because they are the most common selections
 * and tinting them would create visual noise. Barycentric (Stable
 * Evaluator, the unique source of graph data) gets the primary tint;
 * Neville (Target-Specific) gets the info tint, the same hue used for
 * informational notices elsewhere in the app.
 *
 * Classes use `data-active:` (Base UI's active-state attribute on the
 * Tab primitive) and pair light + dark mode tokens so the tint stays
 * legible across themes. tailwind-merge resolves the conflict with the
 * default `data-active:bg-background data-active:text-foreground` from
 * the trigger base classes.
 */
const METHOD_TAB_TINT: Record<string, string> = {
  lagrange: "",
  newton: "",
  barycentric:
    "data-active:bg-primary/10 data-active:text-primary dark:data-active:bg-primary/15 dark:data-active:text-primary",
  neville:
    "data-active:bg-info/10 data-active:text-info-foreground dark:data-active:bg-info/15 dark:data-active:text-info",
}

export function MethodDetails({ data }: MethodDetailsProps) {
  const availableMethods = data.input_summary.methods_requested.filter(
    (m) => data.methods[m]
  )
  const [tab, setTab] = useState<string>(pickInitialTab(availableMethods))

  if (availableMethods.length === 0) return null

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-5 py-3 border-b bg-muted/30">
        <h2 className="text-sm font-semibold text-foreground">Method Details</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Per-method tables, coefficients, and steps</p>
      </div>
      <div className="p-5">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-8">
            {availableMethods.map((m) => (
              <TabsTrigger
                key={m}
                value={m}
                className={`text-xs gap-1 ${METHOD_TAB_TINT[m] ?? ""}`}
              >
                {methodShortLabel(m)}
                {data.methods[m]?.status !== "ok" && (
                  <AlertTriangle className="h-3 w-3 text-warning" aria-hidden="true" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {data.methods.lagrange && (
            <TabsContent value="lagrange" className="mt-4">
              <LagrangeDetails result={data.methods.lagrange} />
            </TabsContent>
          )}
          {data.methods.newton && (
            <TabsContent value="newton" className="mt-4">
              <NewtonDetails result={data.methods.newton} />
            </TabsContent>
          )}
          {data.methods.barycentric && (
            <TabsContent value="barycentric" className="mt-4">
              <BarycentricDetails result={data.methods.barycentric} />
            </TabsContent>
          )}
          {data.methods.neville && (
            <TabsContent value="neville" className="mt-4">
              <NevilleDetails result={data.methods.neville} />
            </TabsContent>
          )}

          {/*
           * Phase 2 panels (additive per design.md §4 / tasks.md 4.6).
           * Each panel mounts only when the backend returned a result
           * for that key; `availableMethods` already filters tabs the
           * same way, so triggers and panels stay in lockstep. A
           * method-level error inside any of these renderers is
           * handled by the family renderer itself (R6.5, R10.4 —
           * sibling methods stay visible and operational).
           */}
          {data.methods.newton_forward && (
            <TabsContent value="newton_forward" className="mt-4">
              <EqualSpacingDetails
                method="newton_forward"
                result={data.methods.newton_forward}
              />
            </TabsContent>
          )}
          {data.methods.newton_backward && (
            <TabsContent value="newton_backward" className="mt-4">
              <EqualSpacingDetails
                method="newton_backward"
                result={data.methods.newton_backward}
              />
            </TabsContent>
          )}
          {data.methods.stirling && (
            <TabsContent value="stirling" className="mt-4">
              <EqualSpacingDetails
                method="stirling"
                result={data.methods.stirling}
              />
            </TabsContent>
          )}
          {data.methods.hermite_divided_difference && (
            <TabsContent value="hermite_divided_difference" className="mt-4">
              <HermiteDetails
                method="hermite_divided_difference"
                result={data.methods.hermite_divided_difference}
              />
            </TabsContent>
          )}
          {data.methods.hermite && (
            <TabsContent value="hermite" className="mt-4">
              <HermiteDetails method="hermite" result={data.methods.hermite} />
            </TabsContent>
          )}
          {data.methods.osculating && (
            <TabsContent value="osculating" className="mt-4">
              <OsculatingDetails result={data.methods.osculating} />
            </TabsContent>
          )}
          {data.methods.taylor && (
            <TabsContent value="taylor" className="mt-4">
              <TaylorDetails result={data.methods.taylor} />
            </TabsContent>
          )}
          {data.methods.cubic_spline && (
            <TabsContent value="cubic_spline" className="mt-4">
              <CubicSplineDetails
                result={data.methods.cubic_spline}
                polynomial={data.polynomial}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}

function MethodError({ error }: { error: { code: string; message: string } | null }) {
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

function MethodWarnings({ warnings }: { warnings: Array<{ code: string; message: string }> }) {
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

function LagrangeDetails({ result }: { result: NonNullable<InterpolateResponse["methods"]["lagrange"]> }) {
  const { formatLiterals } = useDisplayDigits()
  return (
    <div className="space-y-5">
      <MethodError error={result.error} />
      <MethodWarnings warnings={result.warnings} />

      {result.basis_polynomials.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-label text-foreground">Basis Polynomials</h3>
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            {result.basis_polynomials.map((bp) => (
              <div key={bp.index} className="flex items-start gap-2.5">
                <Badge variant="outline" className="text-[10px] font-numeric shrink-0 mt-0.5">
                  L<sub>{bp.index}</sub>
                </Badge>
                <code className="font-numeric text-[11px] text-foreground/80 break-all leading-relaxed">
                  {formatLiterals(bp.basis)}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.summation_form && (
        <div className="space-y-2">
          <h3 className="font-label text-foreground">Summation Form</h3>
          <pre className="text-[11px] font-numeric bg-muted/30 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
            {formatLiterals(result.summation_form)}
          </pre>
        </div>
      )}

      {result.steps.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-label text-foreground">Construction Steps</h3>
          <ol className="list-decimal list-inside space-y-1.5 text-xs text-muted-foreground leading-relaxed pl-1">
            {result.steps.map((step, i) => <li key={i}>{step}</li>)}
          </ol>
        </div>
      )}
    </div>
  )
}

function NewtonDetails({ result }: { result: NonNullable<InterpolateResponse["methods"]["newton"]> }) {
  const { format, formatLiterals, digits } = useDisplayDigits()

  // Newton's divided-difference table is potentially 50x50 cells. Memoize the
  // formatted rows so changing the Display digits ladder is the only trigger
  // for a re-format, not unrelated parent renders.
  const formattedTable = useMemo(
    () =>
      result.divided_difference_table.map((row) =>
        row.map((cell) => (cell != null ? format(cell) : null)),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [result.divided_difference_table, digits],
  )
  const formattedCoefficients = useMemo(
    () => result.coefficients.map((value) => format(value)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [result.coefficients, digits],
  )

  return (
    <div className="space-y-5">
      <MethodError error={result.error} />
      <MethodWarnings warnings={result.warnings} />

      {result.coefficients.length > 0 && (
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

      {formattedTable.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-label text-foreground">Divided-Difference Table</h3>
          <div className="overflow-x-auto rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  {formattedTable[0]?.map((_, j) => (
                    <TableHead
                      key={j}
                      className="font-label text-muted-foreground px-3 py-2"
                      aria-label={j === 0 ? "f at x sub i" : `delta ${j} divided difference`}
                    >
                      {j === 0 ? <>f[x<sub aria-hidden="true">i</sub>]</> : <>&Delta;<span aria-hidden="true">{j}</span></>}
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

      {result.nested_form && (
        <div className="space-y-2">
          <h3 className="font-label text-foreground">Newton Nested Form</h3>
          <pre className="text-[11px] font-numeric bg-muted/30 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
            {formatLiterals(result.nested_form)}
          </pre>
        </div>
      )}

      {result.steps.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-label text-foreground">Construction Steps</h3>
          <ol className="list-decimal list-inside space-y-1.5 text-xs text-muted-foreground leading-relaxed pl-1">
            {result.steps.map((step, i) => <li key={i}>{step}</li>)}
          </ol>
        </div>
      )}
    </div>
  )
}

function BarycentricDetails({ result }: { result: NonNullable<InterpolateResponse["methods"]["barycentric"]> }) {
  const { format } = useDisplayDigits()
  return (
    <div className="space-y-4">
      <MethodError error={result.error} />
      <MethodWarnings warnings={result.warnings} />

      {result.weights.length > 0 && (
        <div>
          <h3 className="font-label text-foreground mb-2">Barycentric Weights</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-label text-muted-foreground w-12" aria-label="row index">i</TableHead>
                <TableHead className="font-label text-muted-foreground" aria-label="x sub i (node value)">
                  x<sub aria-hidden="true">i</sub>
                </TableHead>
                <TableHead className="font-label text-muted-foreground" aria-label="w sub i (barycentric weight)">
                  w<sub aria-hidden="true">i</sub>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.weights.map((w) => (
                <TableRow key={w.index}>
                  <TableCell className="font-numeric text-[11px] text-muted-foreground">{w.index}</TableCell>
                  <TableCell className="font-numeric text-[11px]">{format(w.x)}</TableCell>
                  <TableCell className="font-numeric text-[11px]">{format(w.weight)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {result.notes.length > 0 && (
        <div>
          <h3 className="font-label text-foreground mb-2">Notes</h3>
          <ul className="space-y-1 text-xs text-muted-foreground leading-relaxed">
            {result.notes.map((note, i) => (
              <li
                key={i}
                className="pl-3 text-xs text-muted-foreground leading-relaxed relative before:absolute before:left-0 before:top-[0.45em] before:w-1.5 before:h-1.5 before:rounded-full before:bg-primary/15"
              >
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function NevilleDetails({ result }: { result: NonNullable<InterpolateResponse["methods"]["neville"]> }) {
  const { format } = useDisplayDigits()
  return (
    <div className="space-y-4">
      <MethodError error={result.error} />
      <MethodWarnings warnings={result.warnings} />

      {result.target_results.length > 0 && (
        <div>
          <h3 className="font-label text-foreground mb-2">Target Results</h3>
          <div className="flex flex-wrap gap-2">
            {result.target_results.map((tr, i) => (
              <code
                key={i}
                className="font-numeric text-xs bg-primary/5 border border-primary/20 rounded-md px-2.5 py-1 not-italic"
              >
                P({format(tr.x)}) = {format(tr.value)}
              </code>
            ))}
          </div>
        </div>
      )}

      {result.tables.length > 0 && (
        <div className="space-y-4">
          {result.tables.map((t, ti) => (
            <div key={ti}>
              <h3 className="font-label text-foreground mb-2">
                Neville Table for x = <span className="font-numeric">{format(t.x)}</span>
              </h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {t.rows[0]?.map((_, j) => (
                        <TableHead
                          key={j}
                          className="font-label text-muted-foreground px-2 py-1.5"
                          aria-label={`P sub ${j} (Neville approximation column)`}
                        >
                          P<sub aria-hidden="true">{j}</sub>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {t.rows.map((row, i) => (
                      <TableRow key={i}>
                        {row.map((cell, j) => (
                          <TableCell key={j} className="font-numeric text-[11px] py-1.5 px-2">
                            {cell != null ? format(cell) : (
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
          ))}
        </div>
      )}

      {result.target_results.length === 0 && result.warnings.length === 0 && (
        <p className="text-xs text-muted-foreground italic">
          Neville requires evaluation targets to produce tables. Add x-values in the
          {" "}<a href="#evaluation-targets" className="text-primary underline-offset-2 hover:underline">Evaluation Targets</a>{" "}
          section above and recompute.
        </p>
      )}
    </div>
  )
}
