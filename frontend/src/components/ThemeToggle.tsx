import { Sun, Moon, Monitor } from "lucide-react"
import { useTheme, type Theme } from "@/lib/use-theme"

const NEXT_THEME: Record<Theme, Theme> = {
  light: "dark",
  dark: "system",
  system: "light",
}

const THEME_LABEL: Record<Theme, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
}

/**
 * Theme cycle button.
 *
 * Accessibility (WCAG 2.5.3, Label in Name): the visible text must be a
 * substring of the accessible name. We render the visible label first
 * (e.g. "Light"), then disambiguate with the next state in `aria-label`
 * ("Light theme, switch to dark"). Voice-control users can say "Click
 * Light" because "Light" is part of the accessible name.
 */
export function ThemeToggle() {
  const { theme, cycle } = useTheme()
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor
  const visibleLabel = THEME_LABEL[theme]
  const nextLabel = THEME_LABEL[NEXT_THEME[theme]]
  const accessibleLabel = `${visibleLabel} theme, switch to ${nextLabel.toLowerCase()}`

  return (
    <button
      type="button"
      onClick={cycle}
      title={accessibleLabel}
      aria-label={accessibleLabel}
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-subtle outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="hidden sm:inline">{visibleLabel}</span>
    </button>
  )
}
