import type { MethodName } from "@/lib/api-types"
import { Badge } from "@/components/ui/badge"
import {
  METHOD_CATALOG,
  type MethodCatalogEntry,
  type MethodFamily,
} from "./MethodSelector.catalog"

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
 * and layout are identical across every card; the only differentiator is
 * the Barycentric tint (`text-primary/80` vs `text-muted-foreground`).
 *
 * Per Phase 2 design.md §8.x the catalog is family-grouped. Catalog data
 * is owned by `MethodSelector.catalog.ts`; this file only renders it.
 */

/**
 * Family render order. Matches the `MethodFamily` declaration order in
 * `MethodSelector.catalog.ts` and design.md §8.2 verbatim. Per design.md
 * §8.2 the labels are: Construction, Stable Evaluator, Target-Specific,
 * Equal Spacing, Derivative Data, Function Derivative, Piecewise.
 */
const FAMILIES_IN_ORDER: { family: MethodFamily; label: string }[] = [
  { family: "construction", label: "Construction" },
  { family: "stable_evaluator", label: "Stable Evaluator" },
  { family: "target_specific", label: "Target-Specific" },
  { family: "equal_spacing", label: "Equal Spacing" },
  { family: "derivative_data", label: "Derivative Data" },
  { family: "function_derivative", label: "Function Derivative" },
  { family: "piecewise", label: "Piecewise" },
]

/**
 * Group catalog entries by family, preserving declaration order within
 * each family (so `lagrange` precedes `newton`, etc., per §8.3).
 */
function groupByFamily(
  entries: MethodCatalogEntry[]
): Record<MethodFamily, MethodCatalogEntry[]> {
  const out: Record<MethodFamily, MethodCatalogEntry[]> = {
    construction: [],
    stable_evaluator: [],
    target_specific: [],
    equal_spacing: [],
    derivative_data: [],
    function_derivative: [],
    piecewise: [],
  }
  for (const entry of entries) {
    out[entry.family].push(entry)
  }
  return out
}

const GROUPED_CATALOG = groupByFamily(METHOD_CATALOG)

export function MethodSelector({ selected, onChange }: MethodSelectorProps) {
  function toggle(method: MethodName) {
    if (selected.includes(method)) {
      // At-least-one-method-selected guard (preserved from V1).
      if (selected.length <= 1) return
      onChange(selected.filter((m) => m !== method))
    } else {
      onChange([...selected, method])
    }
  }

  return (
    <fieldset className="space-y-3">
      <legend className="sr-only">Interpolation methods</legend>
      {FAMILIES_IN_ORDER.map(({ family, label }) => {
        const entries = GROUPED_CATALOG[family]
        // Defensive guard: skip families with zero entries. None should be
        // empty in practice given the catalog in §8.2.
        if (entries.length === 0) return null
        return (
          <section key={family} className="space-y-2">
            <h3 className="font-label text-muted-foreground">{label}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {entries.map((m) => {
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
                    {m.deferred && (
                      <Badge
                        variant="secondary"
                        className="absolute right-2 top-2 text-[11px]"
                      >
                        Deferred
                      </Badge>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {m.label}
                      </span>
                      <span
                        className={
                          "font-label " +
                          (m.highlight
                            ? "text-primary/80"
                            : "text-muted-foreground")
                        }
                      >
                        {m.role}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {m.description}
                    </p>
                    {m.eligibilityHint && (
                      <p className="mt-1 text-[11px] text-muted-foreground/80 leading-relaxed">
                        {m.eligibilityHint}
                      </p>
                    )}
                    {m.deferred && m.deferredNote && (
                      <p className="mt-1 text-[11px] text-muted-foreground/80 leading-relaxed">
                        {m.deferredNote}
                      </p>
                    )}
                  </label>
                )
              })}
            </div>
          </section>
        )
      })}
    </fieldset>
  )
}
