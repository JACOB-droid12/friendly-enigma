import type { MethodName } from "@/lib/api-types"

interface MethodSelectorProps {
  selected: MethodName[]
  onChange: (methods: MethodName[]) => void
}

/**
 * Method roles use the canonical wording from the project requirements.
 * Barycentric is highlighted because it is the unique source of graph data
 * in the API contract, not because it is "best".
 *
 * Visual treatment is intentionally softer than `font-label` would imply:
 * the role tag is sentence-cased, weight 400 instead of 500, and rendered
 * in `text-muted-foreground` (or a tinted indigo for Barycentric) so the
 * categorical signal does not visually outshout the method name.
 */
const ALL_METHODS: {
  value: MethodName
  label: string
  role: string
  highlight?: boolean
  description: string
}[] = [
  {
    value: "lagrange",
    label: "Lagrange",
    role: "Construction",
    description: "Basis polynomials, summation form, expanded polynomial.",
  },
  {
    value: "newton",
    label: "Newton",
    role: "Construction",
    description: "Divided-difference table and nested form for hand-checking.",
  },
  {
    value: "barycentric",
    label: "Barycentric",
    role: "Stable Evaluator",
    highlight: true,
    description: "Stable evaluator; required when generating graph data.",
  },
  {
    value: "neville",
    label: "Neville",
    role: "Target-Specific",
    description: "Triangular tables for specific evaluation x-values.",
  },
]

export function MethodSelector({ selected, onChange }: MethodSelectorProps) {
  function toggle(method: MethodName) {
    if (selected.includes(method)) {
      if (selected.length <= 1) return
      onChange(selected.filter((m) => m !== method))
    } else {
      onChange([...selected, method])
    }
  }

  return (
    <fieldset className="space-y-2">
      <legend className="sr-only">Interpolation methods</legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ALL_METHODS.map((m) => {
          const isSelected = selected.includes(m.value)
          return (
            <label
              key={m.value}
              className={`relative flex flex-col gap-1 rounded-lg border p-3 cursor-pointer transition-subtle focus-within:ring-2 focus-within:ring-ring/50 ${
                isSelected
                  ? "border-primary/60 bg-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:border-primary/30 hover:bg-muted/50"
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggle(m.value)}
                className="sr-only"
                aria-label={`${m.label} method`}
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">{m.label}</span>
                <span
                  className={
                    "text-[11px] font-normal tracking-normal " +
                    (m.highlight
                      ? "text-primary/80"
                      : "text-muted-foreground")
                  }
                >
                  {m.role}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{m.description}</p>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
