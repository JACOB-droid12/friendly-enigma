import { AlertTriangle, AlertCircle, Info } from "lucide-react"
import type { WarningBody } from "@/lib/api-types"
import { getWarningMeta, type WarningSeverity } from "@/lib/warnings"

interface WarningsDisplayProps {
  warnings: WarningBody[]
}

const SEVERITY_CLASSES: Record<
  WarningSeverity,
  { container: string; icon: string; label: string; body: string }
> = {
  info: {
    container: "bg-info/5 ring-1 ring-inset ring-info/15",
    icon: "text-info",
    label: "text-info",
    body: "text-info-foreground",
  },
  warning: {
    container: "bg-warning/5 ring-1 ring-inset ring-warning/20",
    icon: "text-warning",
    label: "text-warning",
    body: "text-warning-foreground",
  },
  error: {
    container: "bg-destructive/5 ring-1 ring-inset ring-destructive/20",
    icon: "text-destructive",
    label: "text-destructive",
    body: "text-destructive",
  },
}

function SeverityIcon({ severity, className }: { severity: WarningSeverity; className: string }) {
  const Icon = severity === "info" ? Info : severity === "error" ? AlertCircle : AlertTriangle
  return <Icon className={className} aria-hidden="true" />
}

export function WarningsDisplay({ warnings }: WarningsDisplayProps) {
  if (warnings.length === 0) return null

  return (
    <div className="space-y-2">
      {warnings.map((w, i) => {
        const meta = getWarningMeta(w.code)
        const cls = SEVERITY_CLASSES[meta.severity]
        const role = meta.severity === "error" ? "alert" : "status"
        return (
          <div
            key={i}
            className={`flex items-start gap-3 rounded-lg px-4 py-3 text-sm ${cls.container}`}
            role={role}
          >
            <SeverityIcon
              severity={meta.severity}
              className={`h-4 w-4 shrink-0 mt-0.5 ${cls.icon}`}
            />
            <div>
              <span className={`font-label ${cls.label}`}>{meta.label}</span>
              <p className={`text-xs mt-0.5 leading-relaxed ${cls.body}`}>{w.message}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
