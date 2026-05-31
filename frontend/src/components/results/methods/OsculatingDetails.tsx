import { useMemo } from "react"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { ErrorNotice } from "@/components/ErrorNotice"
import { KatexDisplay } from "@/components/KatexDisplay"
import { useDisplayDigits } from "@/lib/display-digits"
import type { ErrorBody, OsculatingResult, WarningBody } from "@/lib/api-types"

interface OsculatingDetailsProps {
  result: OsculatingResult
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

export default function OsculatingDetails({ result }: OsculatingDetailsProps) {
  const { format, formatLiterals, digits } = useDisplayDigits()

  const orders = result.orders ?? []
  const repeatedNodes = result.repeated_nodes ?? []
  const table = result.confluent_divided_difference_table ?? []
  const coefficients = result.coefficients ?? []
  const evaluations = result.evaluations ?? []
  const steps = result.steps ?? []

  const formattedTable = useMemo(
    () => table.map((row) => row.map((cell) => (cell != null ? format(cell) : null))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [table, digits],
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

  return (
    <div className="space-y-5">
      <MethodError error={result.error} />
      <MethodWarnings warnings={result.warnings} />

      {orders.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-label text-foreground">Osculating Orders</h3>
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
                    max order
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((entry) => (
                  <TableRow key={`${entry.node_index}-${entry.x}`}>
                    <TableCell className="font-numeric text-[11px] py-2 px-3 text-muted-foreground">
                      {entry.node_index}
                    </TableCell>
                    <TableCell className="font-numeric text-[11px] py-2 px-3">
                      {format(entry.x)}
                    </TableCell>
                    <TableCell className="font-numeric text-[11px] py-2 px-3">
                      {entry.max_order}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {repeatedNodes.length > 0 && (
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
                    derivative order
                  </TableHead>
                  <TableHead className="font-label text-muted-foreground px-3 py-2">
                    derivative value
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repeatedNodes.map((node) => (
                  <TableRow key={node.index}>
                    <TableCell className="font-numeric text-[11px] py-2 px-3 text-muted-foreground">
                      {node.index}
                    </TableCell>
                    <TableCell className="font-numeric text-[11px] py-2 px-3 text-muted-foreground">
                      {node.source_node_index}
                    </TableCell>
                    <TableCell className="font-numeric text-[11px] py-2 px-3">
                      {format(node.x)}
                    </TableCell>
                    <TableCell className="font-numeric text-[11px] py-2 px-3">
                      {format(node.y)}
                    </TableCell>
                    <TableCell className="font-numeric text-[11px] py-2 px-3">
                      {node.derivative_order ?? 0}
                    </TableCell>
                    <TableCell className="font-numeric text-[11px] py-2 px-3">
                      {node.derivative_value != null ? (
                        format(node.derivative_value)
                      ) : (
                        <span className="text-muted-foreground/40" aria-label="not available">.</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {formattedTable.length > 0 && headerColumnCount > 0 && (
        <div className="space-y-2">
          <h3 className="font-label text-foreground">Confluent Divided-Difference Table</h3>
          <div className="overflow-x-auto rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  {Array.from({ length: headerColumnCount }, (_, j) => (
                    <TableHead
                      key={j}
                      className="font-label text-muted-foreground px-3 py-2"
                      aria-label={j === 0 ? "f at repeated x sub i" : `delta ${j} confluent divided difference`}
                    >
                      {j === 0 ? (
                        <>f[z<sub aria-hidden="true">i</sub>]</>
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
                    {Array.from({ length: headerColumnCount }, (_, j) => {
                      const cell = row[j] ?? null
                      return (
                        <TableCell key={j} className="font-numeric text-[11px] py-2 px-3">
                          {cell != null ? cell : (
                            <span className="text-muted-foreground/40" aria-label="not available">.</span>
                          )}
                        </TableCell>
                      )
                    })}
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

      {result.latex_osculating && (
        <div className="space-y-2">
          <h3 className="font-label text-foreground">Osculating Form (LaTeX)</h3>
          <div className="bg-muted/30 rounded-lg p-4">
            <KatexDisplay
              latex={result.latex_osculating}
              plainText={result.nested_form}
            />
          </div>
        </div>
      )}

      {evaluations.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-label text-foreground">Evaluations</h3>
          <div className="flex flex-wrap gap-2">
            {evaluations.map((entry) => (
              <code
                key={entry.x}
                className="font-numeric text-xs bg-primary/5 border border-primary/20 rounded-md px-2.5 py-1 not-italic"
              >
                P({format(entry.x)}) = {format(entry.value)}
              </code>
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
