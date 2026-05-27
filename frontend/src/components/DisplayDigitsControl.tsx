import { RadioGroup } from "@base-ui/react/radio-group"
import { Radio } from "@base-ui/react/radio"
import { useId } from "react"
import { DISPLAY_DIGITS_OPTIONS } from "@/lib/format-numeric"
import { useDisplayDigits } from "@/lib/display-digits"
import type { DisplayDigits } from "@/lib/format-numeric"

interface DisplayDigitsControlProps {
  className?: string
}

/**
 * Segmented control: 6 / 12 / 25 / Full. Visual affordance for the
 * Display Precision lever next to the result tabs.
 *
 * Built on Base UI's RadioGroup primitive so that arrow keys move
 * selection (and focus) between options, matching the ARIA Authoring
 * Practices "Radio Group" pattern. Tab moves focus into and out of the
 * group; ArrowLeft/ArrowRight (and ArrowUp/ArrowDown) cycle within.
 */
export function DisplayDigitsControl({ className }: DisplayDigitsControlProps) {
  const { digits, setDigits } = useDisplayDigits()
  const baseId = useId()
  const groupLabelId = `${baseId}-display-digits-label`
  const groupQualifierId = `${baseId}-display-digits-qualifier`

  return (
    <RadioGroup
      aria-labelledby={`${groupLabelId} ${groupQualifierId}`}
      value={String(digits)}
      onValueChange={(v) => setDigits(deserialize(v as string))}
      className={
        "inline-flex items-center gap-0 p-[3px] rounded-lg bg-muted text-muted-foreground " +
        (className ?? "")
      }
    >
      <span id={groupLabelId} className="font-label px-2 text-muted-foreground">
        Display
      </span>
      <span id={groupQualifierId} className="sr-only">
        precision
      </span>
      {DISPLAY_DIGITS_OPTIONS.map((opt) => {
        const active = digits === opt
        const label = opt === "full" ? "Full" : String(opt)
        const optionLabelId = `${baseId}-display-digits-option-${String(opt)}`
        return (
          <Radio.Root
            key={String(opt)}
            value={String(opt)}
            aria-labelledby={optionLabelId}
            className={
              "h-6 px-2 rounded-md text-[11px] font-medium transition-subtle outline-none cursor-pointer " +
              "focus-visible:ring-3 focus-visible:ring-ring/50 " +
              (active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            <span id={optionLabelId}>{label}</span>
          </Radio.Root>
        )
      })}
    </RadioGroup>
  )
}

function deserialize(v: string): DisplayDigits {
  if (v === "full") return "full"
  const n = Number(v)
  if (n === 6 || n === 12 || n === 25) return n
  return 12
}
