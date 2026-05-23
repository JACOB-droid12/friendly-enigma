import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useNewlyAddedIndex } from "@/lib/use-newly-added-index"
import { Plus, X } from "lucide-react"

interface PointsInputProps {
  points: string[][]
  onChange: (points: string[][]) => void
}

export function PointsInput({ points, onChange }: PointsInputProps) {
  const freshIndex = useNewlyAddedIndex(points.length)

  function addPoint() {
    onChange([...points, ["", ""]])
  }

  function removePoint(index: number) {
    if (points.length <= 2) return
    onChange(points.filter((_, i) => i !== index))
  }

  function updatePoint(index: number, field: 0 | 1, value: string) {
    const updated = points.map((p, i) =>
      i === index ? (field === 0 ? [value, p[1]] : [p[0], value]) : p
    )
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      {/* Table header */}
      <div className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 px-1">
        <span className="font-label text-muted-foreground text-center" aria-label="row index">i</span>
        <span className="font-label text-muted-foreground" aria-label="x sub i (input value)">
          x<sub aria-hidden="true">i</sub>
        </span>
        <span className="font-label text-muted-foreground" aria-label="y sub i (output value)">
          y<sub aria-hidden="true">i</sub>
        </span>
        <span aria-hidden="true" />
      </div>

      {/* Point rows */}
      <div className="space-y-2">
        {points.map((point, i) => (
          <div
            key={i}
            className={`grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 items-center group${
              i === freshIndex ? " animate-row-enter" : ""
            }`}
          >
            <span className="text-xs text-muted-foreground text-center font-numeric tabular-nums">
              {i}
            </span>
            <Input
              placeholder={i === 0 ? "e.g. 2" : i === 1 ? "e.g. 5" : ""}
              value={point[0]}
              onChange={(e) => updatePoint(i, 0, e.target.value)}
              className="font-numeric text-sm h-8"
              aria-label={`Point ${i} x-value`}
            />
            <Input
              placeholder={i === 0 ? "e.g. 4" : i === 1 ? "e.g. 1" : ""}
              value={point[1]}
              onChange={(e) => updatePoint(i, 1, e.target.value)}
              className="font-numeric text-sm h-8"
              aria-label={`Point ${i} y-value`}
            />
            <button
              type="button"
              onClick={() => removePoint(i)}
              disabled={points.length <= 2}
              className="flex items-center justify-center w-6 h-6 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-muted-foreground disabled:hover:bg-transparent transition-subtle outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              aria-label={`Remove point ${i}`}
              title={points.length <= 2 ? "At least 2 points are required" : undefined}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addPoint}>
        <Plus className="h-4 w-4 mr-1" /> Add Point
      </Button>

      <p className="text-xs text-muted-foreground">
        Enter at least 2 distinct (x, y) pairs. Values are parsed as exact rationals when possible.
      </p>
    </div>
  )
}
