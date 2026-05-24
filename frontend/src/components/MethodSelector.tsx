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
 * The role tag is rendered in the design-system label voice (`font-label`):
 * IBM Plex Sans, 0.625rem / 500 / 0.05em / uppercase. Size, weight, padding,
 * and layout are identical across the four cards; the only differentiator
 * is the Barycentric tint (`text-primary/80` vs `text-muted-foreground`).
 * The role-tag strings stay exactly as the design spec dictates
 * (`Construction` / `Construction` / `Stable Evaluator` / `Target-Specific`);
 * the `font-label` utility uppercases them at render time.
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
    description: "Lagrange shows basis polynomials and summation form.",
  },
  {
    value: "newton",
    label: "Newton",
    role: "Construction",
    description: "Newton shows divided-difference tables and nested form.",
  },
  {
    value: "barycentric",
    label: "Barycentric",
    role: "Stable Evaluator",
    highlight: true,
    description: "Barycentric provides stable evaluation and is the source for graph data.",
  },
  {
    value: "neville",
    label: "Neville",
    role: "Target-Specific",
    description: "Neville produces target-specific triangular tables.",
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
                    "font-label " +
                    (m.highlight ? "text-primary/80" : "text-muted-foreground")
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
