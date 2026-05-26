import { useEffect } from "react"

interface ShortcutHandlers {
  /** Compute. Bound to Ctrl/Cmd+Enter at the document level. */
  onCompute?: () => void
  /** Reset. Bound to Alt+R (Ctrl+R is reserved for browser reload). */
  onReset?: () => void
  /** Quick reference toggle. Bound to "?". */
  onToggleHelp?: () => void
  /**
   * Result-tab hotkey. Fires with the digit 1-7 the user pressed; the
   * caller maps the digit to a tab id. Bound only when results are on
   * screen (the App passes `undefined` while `result === null`).
   */
  onResultTab?: (index: number) => void
  /** Disable shortcuts entirely (e.g. while loading). */
  disabled?: boolean
}

const isModEnter = (e: KeyboardEvent) =>
  e.key === "Enter" && (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey

const isAltR = (e: KeyboardEvent) =>
  e.altKey && (e.key === "r" || e.key === "R") && !e.ctrlKey && !e.metaKey && !e.shiftKey

const isQuestion = (e: KeyboardEvent) =>
  e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey

const isPlainDigit = (e: KeyboardEvent) =>
  /^[1-9]$/.test(e.key) &&
  !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey

/**
 * Page-level shortcuts. Fires for top-level surfaces only: ignores events
 * originating inside form controls so typing a number doesn't trigger
 * Compute, and Esc/Enter inside input fields keeps native semantics.
 */
export function useShortcuts({
  onCompute,
  onReset,
  onToggleHelp,
  onResultTab,
  disabled,
}: ShortcutHandlers) {
  useEffect(() => {
    if (disabled) return

    function shouldIgnore(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) return false
      const tag = target.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        // Allow Ctrl/Cmd+Enter from inside inputs: that is the canonical
        // "submit form from anywhere" combo. Suppress Alt+R, "?", and
        // result-tab digits so the user can still type "1" into an
        // x-value field without changing tabs.
        return false
      }
      if (target.isContentEditable) return true
      return false
    }

    function handler(e: KeyboardEvent) {
      const ignore = shouldIgnore(e.target)

      if (isModEnter(e) && onCompute) {
        e.preventDefault()
        onCompute()
        return
      }
      if (ignore) return
      if (isAltR(e) && onReset) {
        e.preventDefault()
        onReset()
        return
      }
      if (isQuestion(e) && onToggleHelp) {
        e.preventDefault()
        onToggleHelp()
        return
      }
      if (isPlainDigit(e) && onResultTab) {
        const index = Number(e.key)
        if (index >= 1 && index <= 7) {
          e.preventDefault()
          onResultTab(index)
          return
        }
      }
    }

    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onCompute, onReset, onToggleHelp, onResultTab, disabled])
}
