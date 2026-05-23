import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface PrecisionSettingsProps {
  precision: number
  exact: boolean | null
  onPrecisionChange: (p: number) => void
  onExactChange: (exact: boolean | null) => void
}

const PRESETS: number[] = [15, 30, 50, 100]

export function PrecisionSettings({
  precision,
  exact,
  onPrecisionChange,
  onExactChange,
}: PrecisionSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Label htmlFor="exact-toggle" className="text-sm">Exact Mode</Label>
          <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[280px]">
            SymPy Rational arithmetic. Symbolic fractions when possible. Precision still applies to numerical evaluations and graph sampling.
          </p>
        </div>
        <Switch
          id="exact-toggle"
          checked={exact === true}
          onCheckedChange={(checked) => onExactChange(checked ? true : false)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="precision-input" className="text-sm">Decimal Precision</Label>
          <span className="text-xs font-numeric text-muted-foreground" aria-hidden="true">
            {precision} digits
          </span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={8}
            max={200}
            step={1}
            value={precision}
            onChange={(e) => onPrecisionChange(parseInt(e.target.value))}
            className="flex-1 h-1.5 rounded-full appearance-none bg-muted accent-primary cursor-pointer"
            aria-label="Decimal precision"
            aria-valuemin={8}
            aria-valuemax={200}
            aria-valuenow={precision}
            aria-valuetext={`${precision} significant digits`}
          />
          <Input
            id="precision-input"
            type="number"
            min={8}
            max={200}
            step={1}
            inputMode="numeric"
            value={precision}
            onChange={(e) => {
              const val = parseInt(e.target.value)
              if (val >= 8 && val <= 200) onPrecisionChange(val)
            }}
            className="w-16 font-numeric text-sm text-center h-8"
            aria-label="Decimal precision in digits"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-label text-muted-foreground">Presets</span>
          {PRESETS.map((p) => {
            const active = precision === p
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPrecisionChange(p)}
                aria-pressed={active}
                className={
                  "h-6 px-2 rounded-md text-[11px] font-numeric transition-subtle outline-none " +
                  "focus-visible:ring-3 focus-visible:ring-ring/50 " +
                  (active
                    ? "bg-primary/10 text-primary"
                    : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted")
                }
              >
                {p}
              </button>
            )
          })}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Significant digits for mpmath high-precision arithmetic (8 to 200).
        </p>
      </div>
    </div>
  )
}
