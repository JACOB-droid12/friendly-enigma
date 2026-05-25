import { useMemo } from "react"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ErrorNotice } from "@/components/ErrorNotice"
import { useDisplayDigits } from "@/lib/display-digits"
import type {
  NewtonForwardResult,
  NewtonBackwardResult,
  StirlingResult,
  EqualSpacingEvaluation,
  ErrorBody,
  WarningBody,
} from "@/lib/api-types"

/**
 * Renderer for the Equal-Spacing Family methods (`newton_forward`,
 * `newton_backward`, `stirling`). Reads only fields documented in
 * `docs/API_CONTRACT.md` "P2.1 Equal-Spacing Methods"; performs no
 * client-side math (R6.6).
 *
 * Layout follows `design.md` §9.1: method-level error and warnings,
 * spacing summary, difference table (wrapped in
 * `overflow-x-auto rounded-lg` per R14.3), per-evaluation blocks
 * with `s`, `value`, and `terms`, optional target-guidance advisory
 * copy (R6.4 — advisory only, never auto-switch), and the construction
 * `steps` `<ol>`.
 *
 * On a method-level error response (e.g. `unequal_spacing`) the
 * backend OMITS every collection / scalar field on the result; only
 * `status`, `warnings`, and `error` are guaranteed. Every consumer
 * below guards with `?? []` / `?.` so the renderer falls through to
 * the shared `ErrorNotice` path without crashing.
 */

type EqualSpacingMethod = "newton_forward" | "newton_backward" | "stirling"

type EqualSpacingResult =
  | NewtonForwardResult
  | NewtonBackwardResult
  | StirlingResult

interface EqualSpacingDetailsProps {
  method: EqualSpacingMethod
  result: EqualSpacingResult
}

const METHOD_LABEL: Record<EqualSpacingMethod, string> = {
  newton_forward: "Newton Forward",
  newton_backward: "Newton Backward",
  stirling: "Stirling",
}

const TABLE_HEADING: Record<EqualSpacingMethod, string> = {
  newton_forward: "Forward-Difference Table",
  newton_backward: "Backward-Difference Table",
  stirling: "Centered-Difference Table",
}

/**
 * Pull the right table key for the given method without relying on
 * client-side computation. The discriminant on `method` keeps the
 * union narrow at each branch so TypeScript reads the correct field.
 * Returns `undefined` when the backend omitted the field on a
 * method-level error response.
 */
function getDifferenceTable(
  method: EqualSpacingMethod,
  result: EqualSpacingResult,
): Array<Array<string | null>> | undefined {
  if (method === "newton_forward") {
    return (result as NewtonForwardResult).forward_difference_table
  }
  if (method === "newton_backward") {
    return (result as NewtonBackwardResult).backward_difference_table
  }
  return (result as StirlingResult).centered_difference_table
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

export default function EqualSpacingDetails({ method, result }: EqualSpacingDetailsProps) {
  const { format, digits } = useDisplayDigits()

  const differenceTable = getDifferenceTable(method, result) ?? []
  const evaluations = result.evaluations ?? []
  const steps = result.steps ?? []

  // Difference tables are potentially large; memoize the formatted cells so
  // changing the Display digits ladder is the only trigger for a re-format.
  const formattedTable = useMemo(
    () =>
      differenceTable.map((row) =>
        row.map((cell) => (cell != null ? format(cell) : null)),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [differenceTable, digits],
  )

  // Header column count is the widest row's length (triangular tables shrink
  // as order increases). Falling back to row 0 mirrors `NewtonDetails`.
  const headerColumnCount = useMemo(() => {
    let max = 0
    for (const row of formattedTable) {
      if (row.length > max) max = row.length
    }
    return max
  }, [formattedTable])

  return (
    <div className="space-y-5">
      <MethodError error={result.error} />
      <MethodWarnings warnings={result.warnings} />

      <SpacingSummary method={method} result={result} />

      {formattedTable.length > 0 && headerColumnCount > 0 && (
        <div className="space-y-2">
          <h3 className="font-label text-foreground">{TABLE_HEADING[method]}</h3>
          <div className="overflow-x-auto rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  {Array.from({ length: headerColumnCount }, (_, j) => (
                    <TableHead
                      key={j}
                      className="font-label text-muted-foreground px-3 py-2"
                      aria-label={`delta ${j} finite difference`}
                    >
                      &Delta;<span aria-hidden="true">{j}</span>
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

      {evaluations.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-label text-foreground">Evaluations</h3>
          <div className="space-y-3">
            {evaluations.map((ev, i) => (
              <EvaluationBlock key={i} method={method} evaluation={ev} />
            ))}
          </div>
        </div>
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

function SpacingSummary({
  method,
  result,
}: {
  method: EqualSpacingMethod
  result: EqualSpacingResult
}) {
  const { format } = useDisplayDigits()

  const rows: Array<{ label: string; value: string }> = []

  if (result.spacing_h != null) {
    rows.push({ label: "Spacing h", value: format(result.spacing_h) })
  }

  if (method === "newton_forward" || method === "newton_backward") {
    const r = result as NewtonForwardResult | NewtonBackwardResult
    if (r.anchor_index != null) {
      rows.push({ label: "Anchor index", value: String(r.anchor_index) })
    }
  } else {
    const r = result as StirlingResult
    if (r.center_index != null) {
      rows.push({ label: "Center index", value: String(r.center_index) })
    }
    if (r.center_x != null) {
      rows.push({ label: "Center x", value: format(r.center_x) })
    }
  }

  // Skip the entire section when the backend omitted the spacing fields
  // (method-level error response).
  if (rows.length === 0) return null

  return (
    <div className="space-y-2">
      <h3 className="font-label text-foreground">Spacing Summary</h3>
      <div className="bg-muted/30 rounded-lg p-3">
        <div className="flex flex-wrap gap-2">
          {rows.map((r) => (
            <code
              key={r.label}
              className="font-numeric text-[11px] bg-card rounded-md px-2.5 py-1 not-italic"
            >
              <span className="text-muted-foreground">{r.label} = </span>
              {r.value}
            </code>
          ))}
        </div>
      </div>
    </div>
  )
}

function EvaluationBlock({
  method,
  evaluation,
}: {
  method: EqualSpacingMethod
  evaluation: EqualSpacingEvaluation
}) {
  const { format } = useDisplayDigits()
  const guidance = evaluation.target_guidance
  const showGuidance = guidance != null && guidance.recommended !== method
  const terms = evaluation.terms ?? []

  return (
    <div className="bg-muted/30 rounded-lg p-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        <code className="font-numeric text-[11px] bg-card rounded-md px-2.5 py-1 not-italic">
          <span className="text-muted-foreground">x = </span>
          {format(evaluation.x)}
        </code>
        <code className="font-numeric text-[11px] bg-card rounded-md px-2.5 py-1 not-italic">
          <span className="text-muted-foreground">s = </span>
          {format(evaluation.s)}
        </code>
        <code className="font-numeric text-[11px] bg-card rounded-md px-2.5 py-1 not-italic">
          <span className="text-muted-foreground">Value = </span>
          {format(evaluation.value)}
        </code>
      </div>

      {terms.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="font-label text-muted-foreground">Terms</h4>
          <div className="flex flex-wrap gap-1.5">
            {terms.map((t) => (
              <Badge
                key={t.order}
                variant="outline"
                className="text-[10px] font-numeric tabular-nums"
              >
                <span className="text-muted-foreground">order {t.order}: </span>
                {format(t.value)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {showGuidance && guidance && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          Backend recommends <span className="font-numeric">{guidance.recommended}</span>{" "}
          for target x near <span className="font-numeric">{format(guidance.target)}</span>{" "}
          (interval <span className="font-numeric">{format(guidance.left)}</span>{" "}
          to <span className="font-numeric">{format(guidance.right)}</span>,{" "}
          midpoint <span className="font-numeric">{format(guidance.midpoint)}</span>).
          {" "}
          {METHOD_LABEL[method]} remains selected — this is advisory only.
        </p>
      )}
    </div>
  )
}
