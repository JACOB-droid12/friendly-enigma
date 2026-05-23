import { useCallback, useEffect, useState } from "react"

export type Theme = "light" | "dark" | "system"

const STORAGE_KEY = "interp:theme"

function readStored(): Theme {
  if (typeof window === "undefined") return "system"
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    if (v === "light" || v === "dark" || v === "system") return v
  } catch {
    // localStorage may be unavailable (private mode); fall through.
  }
  return "system"
}

function applyToDom(theme: Theme): void {
  if (typeof document === "undefined") return
  const root = document.documentElement
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
  const effective = theme === "system" ? (prefersDark ? "dark" : "light") : theme
  root.classList.toggle("dark", effective === "dark")
  root.dataset.theme = effective
  root.style.colorScheme = effective
}

/**
 * Eager theme application. Run before React mounts so there is no flash of
 * the wrong theme on first paint.
 */
export function applyInitialTheme(): void {
  applyToDom(readStored())
}

/**
 * Theme hook with three states: light, dark, system. System follows the
 * OS preference and re-applies on change.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => readStored())

  useEffect(() => {
    applyToDom(theme)
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, theme)
      } catch {
        // ignore: storage write failure is non-fatal
      }
    }
  }, [theme])

  useEffect(() => {
    if (theme !== "system") return
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => applyToDom("system")
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [theme])

  const setTheme = useCallback((t: Theme) => setThemeState(t), [])
  const cycle = useCallback(() => {
    setThemeState((cur) => (cur === "light" ? "dark" : cur === "dark" ? "system" : "light"))
  }, [])

  return { theme, setTheme, cycle }
}
