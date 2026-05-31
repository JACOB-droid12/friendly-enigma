import type { MethodName } from "@/lib/api-types"
import { Badge } from "@/components/ui/badge"
import {
  FAMILY_LABEL,
  FAMILY_ORDER,
  METHOD_METADATA,
  METHOD_ORDER,
  type MethodMetadata,
} from "@/lib/method-metadata"

interface MethodSelectorProps {
  selected: MethodName[]
  onChange: (methods: MethodName[]) => void
}

/**
 * Family-grouped method selector.
 *
 * Catalog content (labels, families, role tags, descriptions, eligibility
 * hints, and any deferred chip) is owned by `lib/method-metadata.ts`.
 * This file is the renderer: it groups the catalog by family per
 * `FAMILY_ORDER` and renders one card per method.
 *
 * Role tags use the design-system label voice (`font-label`). The only
 * differentiator across method cards is the Barycentric tint
 * (`text-primary` vs `text-muted-foreground`); size, weight, padding,
 * and layout are identical so the eye is drawn to the actual method
 * name first, the role tag second.
 *
 * Hybrid intent routing (per the design direction) is presented above
 * this component as a Quick Start row in `ExamplesPanel`. The Method
 * Selector remains the advanced manual catalog, grouped by method
 * family, so once a user knows what they want they can pick it directly
 * without re-reading lecture-aware copy.
 */

function groupByFamily(): Map<string, MethodMetadata[]> {
  const out = new Map<string, MethodMetadata[]>()
  for (const family of FAMILY_ORDER) out.set(family, [])
  for (const name of METHOD_ORDER) {
    const meta = METHOD_METADATA[name]
    out.get(meta.family)!.push(meta)
  }
  return out
}

const GROUPED_CATALOG = groupByFamily()

export function MethodSelector({ selected, onChange }: MethodSelectorProps) {
  function toggle(method: MethodName) {
    if (selected.includes(method)) {
      // At-least-one-method-selected guard.
      if (selected.length <= 1) return
      onChange(selected.filter((m) => m !== method))
    } else {
      onChange([...selected, method])
    }
  }

  return (
    <fieldset className="space-y-3">
      <legend className="sr-only">Interpolation methods</legend>
      {FAMILY_ORDER.map((family) => {
        const entries = GROUPED_CATALOG.get(family) ?? []
        if (entries.length === 0) return null
        return (
          <section key={family} className="space-y-2">
            <h3 className="font-label text-muted-foreground">{FAMILY_LABEL[family]}</h3>
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
                            ? "text-primary"
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
                      <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                        {m.eligibilityHint}
                      </p>
                    )}
                    {m.deferred && m.deferredNote && (
                      <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
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
