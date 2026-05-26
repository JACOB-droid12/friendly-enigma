import { AlertCircle, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { resolveBackendCodePayload } from "@/lib/backend-codes"

/**
 * Shared, reusable error / warning / info renderer.
 *
 * Renders a structured backend `{ code, message }` payload in the canonical
 * hierarchy from Requirement 6:
 *
 *   1. Severity word in `font-label` voice (block layout only).
 *   2. Human-readable backend `message` as the primary line.
 *   3. `Code: <code>` secondary line in `numeric` voice.
 *   4. Optional one-sentence recovery guidance from the frontend-maintained
 *      code-to-guidance map (block layout only).
 *
 * Containment follows the Inset Containment Rule (`ring-1 ring-inset` with a
 * semantic tint). Severity is communicated by color, icon, and text label so
 * it is never carried by color alone (Requirement 6.9).
 *
 * If `message` is empty/missing the component falls through to a missing-
 * message state where the `code` becomes the primary content and a generic
 * "Backend did not provide a description." sits in the secondary slot
 * (Requirement 6.11). If both are missing a defensive generic primary line
 * is rendered so the component never renders empty.
 */

export interface ErrorNoticeProps {
  /** Backend error/warning code, e.g. "too_few_nodes". May be undefined or empty. */
  code?: string | null
  /** Human-readable message from the backend. Empty/missing triggers the fallback. */
  message?: string | null
  /** Severity. Defaults to "error" (destructive). Warning + info supported for shared use. */
  severity?: "error" | "warning" | "info"
  /**
   * "block" (default): full ring-1 ring-inset notice, suitable for top-level banner or method panel.
   * "inline": tighter inline notice for placement under a math input field.
   */
  layout?: "block" | "inline"
  /** Optional id for aria-describedby wiring from the input that owns the notice. */
  id?: string
  /** Optional className passthrough for the outermost element. */
  className?: string
}

/**
 * Frontend-maintained code-to-guidance map (Requirement 6.3).
 *
 * The backend remains the source of truth for the `code` and the `message`;
 * this map only adds one recovery sentence the user can act on. New codes
 * added to the API contract should be considered for inclusion here, but
 * the absence of a code from this map is not an error: the notice still
 * renders message and code in the canonical hierarchy.
 */
const RECOVERY_GUIDANCE: Record<string, string> = {
  too_few_nodes: "Add at least two distinct (x, y) points and recompute.",
  duplicate_x: "Make every x-value unique. Each row needs a different x.",
  unsafe_expression:
    "Use only supported functions: sin, cos, tan, exp, log, ln, sqrt, abs, asin, acos, atan, sinh, cosh, tanh, pi, E.",
  function_domain_error:
    "Choose x-values inside the function's domain. For example, 1/x is undefined at x = 0.",
  invalid_interval: "Use a finite interval [a, b] with a < b.",
  no_methods_selected: "Select at least one method before computing.",
}

const SEVERITY_LABEL: Record<NonNullable<ErrorNoticeProps["severity"]>, string> = {
  error: "Error",
  warning: "Warning",
  info: "Info",
}

const SEVERITY_CONTAINER: Record<NonNullable<ErrorNoticeProps["severity"]>, string> = {
  error: "bg-destructive/5 ring-1 ring-inset ring-destructive/20",
  warning: "bg-warning/5 ring-1 ring-inset ring-warning/20",
  info: "bg-info/5 ring-1 ring-inset ring-info/15",
}

const SEVERITY_ICON_COLOR: Record<NonNullable<ErrorNoticeProps["severity"]>, string> = {
  error: "text-destructive",
  warning: "text-warning",
  info: "text-info",
}

const SEVERITY_PRIMARY_TEXT: Record<NonNullable<ErrorNoticeProps["severity"]>, string> = {
  error: "text-destructive",
  warning: "text-warning-foreground",
  info: "text-info-foreground",
}

const SEVERITY_LABEL_COLOR: Record<NonNullable<ErrorNoticeProps["severity"]>, string> = {
  error: "text-destructive",
  warning: "text-warning",
  info: "text-info",
}

function SeverityIcon({
  severity,
  className,
}: {
  severity: NonNullable<ErrorNoticeProps["severity"]>
  className: string
}) {
  if (severity === "error") return <AlertCircle className={className} aria-hidden="true" />
  if (severity === "warning") return <AlertTriangle className={className} aria-hidden="true" />
  return <Info className={className} aria-hidden="true" />
}

export function ErrorNotice({
  code,
  message,
  severity = "error",
  layout = "block",
  id,
  className,
}: ErrorNoticeProps) {
  const trimmedCode = code?.trim() ?? ""
  const trimmedMessage = message?.trim() ?? ""
  const hasCode = trimmedCode.length > 0
  const hasMessage = trimmedMessage.length > 0

  // Route the payload through the shared backend-code registry so an
  // unknown code falls back to a safe display rather than crashing or
  // surfacing snake_case as a primary line. The registry's `humanized`
  // flag is informational; we do not currently change layout based on it.
  const resolved = resolveBackendCodePayload(trimmedCode, trimmedMessage)
  const primaryText = resolved.primary
  const secondaryText = resolved.secondary ?? null
  const showCodeLine = resolved.showCode
  const bothMissing = !hasMessage && !hasCode

  // Recovery guidance is suppressed for inline layout (compactness) and for
  // the missing-message and both-missing branches (the secondary slot is
  // already used). Block layout + recognized code + message present.
  const recovery =
    layout === "block" && hasMessage && hasCode ? RECOVERY_GUIDANCE[trimmedCode] : undefined

  const isInline = layout === "inline"
  const isBlock = !isInline

  // role="alert" for errors so screen readers announce them as alerts.
  // role="status" for warnings and info so they are polite live regions.
  const role = severity === "error" ? "alert" : "status"

  const containerClasses = cn(
    "rounded-lg flex items-start",
    isInline ? "gap-2 px-3 py-2" : "gap-3 px-4 py-3",
    SEVERITY_CONTAINER[severity],
    className,
  )

  const iconClasses = cn(
    "shrink-0 mt-0.5",
    isInline ? "h-3.5 w-3.5" : "h-4 w-4",
    SEVERITY_ICON_COLOR[severity],
  )

  const primaryClasses = cn(
    "font-medium leading-tight",
    isInline ? "text-xs" : "text-sm",
    SEVERITY_PRIMARY_TEXT[severity],
  )

  return (
    <div id={id} role={role} className={containerClasses}>
      <SeverityIcon severity={severity} className={iconClasses} />
      <div className="min-w-0 flex-1">
        {isBlock && (
          <p className={cn("font-label", SEVERITY_LABEL_COLOR[severity])}>
            {SEVERITY_LABEL[severity]}
          </p>
        )}
        <p className={cn(primaryClasses, isBlock && "mt-1")}>{primaryText}</p>
        {secondaryText && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{secondaryText}</p>
        )}
        {showCodeLine && (
          <p className="text-xs mt-1 leading-tight">
            <span className="text-muted-foreground">Code: </span>
            <span className="font-numeric text-muted-foreground">{trimmedCode}</span>
          </p>
        )}
        {!bothMissing && recovery && (
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{recovery}</p>
        )}
      </div>
    </div>
  )
}
