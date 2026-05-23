import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNewlyAddedIndex } from "@/lib/use-newly-added-index"
import { Plus, X } from "lucide-react"

interface EvaluationTargetsProps {
  targets: string[]
  onChange: (targets: string[]) => void
}

export function EvaluationTargets({ targets, onChange }: EvaluationTargetsProps) {
  const freshIndex = useNewlyAddedIndex(targets.length)

  function addTarget() {
    onChange([...targets, ""])
  }

  function removeTarget(index: number) {
    onChange(targets.filter((_, i) => i !== index))
  }

  function updateTarget(index: number, value: string) {
    onChange(targets.map((t, i) => (i === index ? value : t)))
  }

  return (
    <div className="space-y-3" id="evaluation-targets">
      <div>
        <Label className="text-sm">Evaluation Targets</Label>
        <p className="text-xs text-muted-foreground mt-0.5">
          x-values where P(x) will be evaluated and compared across methods
        </p>
      </div>
      {targets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {targets.map((target, i) => (
            <div
              key={i}
              className={`flex items-center gap-1 bg-muted/50 rounded-md pl-2 pr-1 py-1 transition-subtle focus-within:ring-2 focus-within:ring-ring/50 focus-within:ring-inset${
                i === freshIndex ? " animate-row-enter" : ""
              }`}
            >
              <Input
                placeholder="x"
                value={target}
                onChange={(e) => updateTarget(i, e.target.value)}
                className="font-numeric text-sm h-6 w-32 border-0 bg-transparent p-0"
                aria-label={`Evaluation target ${i + 1}`}
              />
              <button
                type="button"
                onClick={() => removeTarget(i)}
                className="flex items-center justify-center w-6 h-6 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-subtle outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                aria-label={`Remove target ${i + 1}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <Button type="button" variant="outline" size="sm" onClick={addTarget}>
        <Plus className="h-4 w-4 mr-1" /> Add Target
      </Button>
    </div>
  )
}
