import { useEffect, useRef, useState } from "react"
import { Check, X, Loader2 } from "lucide-react"
import { checkHealth } from "@/lib/api-client"

type Status = "checking" | "online" | "offline"

interface HealthIndicatorProps {
  /** Optional callback so the parent can react to status changes (e.g. disable Compute when offline). */
  onStatusChange?: (online: boolean) => void
}

/**
 * Polling cadence (ms).
 *   - HEALTHY_INTERVAL: backend last responded ok. Slow, steady polling.
 *   - INITIAL_BACKOFF / MAX_BACKOFF: when the backend is offline, retry on
 *     exponential backoff so a long outage doesn't burn a request every 30 s.
 *   - The hidden tab path skips polling entirely until visibilitychange fires.
 */
const HEALTHY_INTERVAL = 30_000
const INITIAL_BACKOFF = 5_000
const MAX_BACKOFF = 120_000

export function HealthIndicator({ onStatusChange }: HealthIndicatorProps) {
  const [status, setStatus] = useState<Status>("checking")
  // Stash the latest callback in a ref so the polling effect doesn't tear down
  // every time the parent passes a new function identity (the audit flagged
  // this as a future hazard).
  const onStatusChangeRef = useRef(onStatusChange)
  useEffect(() => {
    onStatusChangeRef.current = onStatusChange
  }, [onStatusChange])

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | null = null
    let backoff = INITIAL_BACKOFF

    function schedule(delay: number) {
      if (cancelled) return
      if (timer) clearTimeout(timer)
      timer = setTimeout(check, delay)
    }

    async function check() {
      // Skip while the tab is hidden; visibilitychange resumes us.
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return
      }
      try {
        const res = await checkHealth()
        if (cancelled) return
        const next: Status = res.status === "ok" ? "online" : "offline"
        setStatus(next)
        onStatusChangeRef.current?.(next === "online")
        if (next === "online") {
          backoff = INITIAL_BACKOFF
          schedule(HEALTHY_INTERVAL)
        } else {
          schedule(backoff)
          backoff = Math.min(backoff * 2, MAX_BACKOFF)
        }
      } catch {
        if (cancelled) return
        setStatus("offline")
        onStatusChangeRef.current?.(false)
        schedule(backoff)
        backoff = Math.min(backoff * 2, MAX_BACKOFF)
      }
    }

    function onVisibility() {
      if (document.visibilityState === "visible") {
        // Reset backoff on tab focus so a transient outage doesn't keep
        // the user waiting after they come back to the tab.
        backoff = INITIAL_BACKOFF
        schedule(0)
      }
    }

    check()
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibility)
    }

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibility)
      }
    }
  }, [])

  const dotClass =
    status === "online"
      ? "bg-success"
      : status === "offline"
      ? "bg-destructive"
      : "bg-muted-foreground animate-pulse"

  // Icon paired with text so severity is never carried by color alone.
  const Icon = status === "online" ? Check : status === "offline" ? X : Loader2
  const iconClass =
    status === "online"
      ? "text-success"
      : status === "offline"
      ? "text-destructive"
      : "text-muted-foreground animate-spin"

  const label =
    status === "online" ? "Backend connected" : status === "offline" ? "Backend offline" : "Connecting…"

  return (
    <div
      className="flex items-center gap-1.5 text-xs text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      <span className={`w-1.5 h-1.5 rounded-full transition-colors-fast ${dotClass}`} aria-hidden="true" />
      <Icon className={`h-3 w-3 transition-colors-fast ${iconClass}`} aria-hidden="true" />
      <span className="font-numeric hidden sm:inline">{label}</span>
      <span className="sr-only sm:hidden">{label}</span>
    </div>
  )
}
