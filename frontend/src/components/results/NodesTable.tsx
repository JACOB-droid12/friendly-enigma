import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { useDisplayDigits } from "@/lib/display-digits"
import type { NodeEntry } from "@/lib/api-types"

interface NodesTableProps {
  nodes: NodeEntry[]
}

export function NodesTable({ nodes }: NodesTableProps) {
  const { format } = useDisplayDigits()
  if (nodes.length === 0) return null

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-5 py-3 border-b bg-muted/30">
        <h2 className="text-sm font-semibold text-foreground">Interpolation Nodes</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {nodes.length} {nodes.length === 1 ? "node" : "nodes"} defining the polynomial
        </p>
      </div>
      <div className="p-5">
        <div className="overflow-x-auto rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 font-label text-muted-foreground" aria-label="row index">i</TableHead>
                <TableHead className="font-label text-muted-foreground" aria-label="x sub i (input value)">
                  x<sub aria-hidden="true">i</sub>
                </TableHead>
                <TableHead className="font-label text-muted-foreground" aria-label="y sub i (output value)">
                  y<sub aria-hidden="true">i</sub>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nodes.map((node) => (
                <TableRow key={node.index}>
                  <TableCell className="font-numeric text-xs text-muted-foreground">{node.index}</TableCell>
                  <TableCell className="font-numeric text-sm">{format(node.x)}</TableCell>
                  <TableCell className="font-numeric text-sm">{format(node.y)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
