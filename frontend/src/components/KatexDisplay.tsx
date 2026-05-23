import { useEffect, useRef } from "react"
import katex from "katex"
import "katex/dist/katex.min.css"

interface KatexDisplayProps {
  latex: string | null
  /** Optional plain-text fallback used as the accessible label for screen readers. */
  plainText?: string | null
  displayMode?: boolean
  className?: string
}

/**
 * Render LaTeX with KaTeX. Accessibility contract:
 *
 * - The visible KaTeX output is `aria-hidden`. Screen readers should not
 *   try to read the raw mark-up.
 * - A `<span class="sr-only">` carries the accessible text. When the
 *   caller passes `plainText` (e.g. the SymPy plain expanded form), that
 *   is read aloud. Otherwise we fall back to the LaTeX string with the
 *   most common math escapes lightly humanised.
 */
export function KatexDisplay({ latex, plainText, displayMode = true, className = "" }: KatexDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || !latex) return
    try {
      katex.render(latex, containerRef.current, {
        displayMode,
        throwOnError: false,
        trust: false,
        strict: false,
      })
    } catch {
      if (containerRef.current) {
        containerRef.current.textContent = latex
      }
    }
  }, [latex, displayMode])

  if (!latex) {
    return (
      <span className="text-sm text-muted-foreground italic">Not available</span>
    )
  }

  const accessibleText = (plainText ?? humanizeLatex(latex)).trim()

  return (
    <div className={`overflow-x-auto py-2 ${className}`} role="math" aria-label={accessibleText}>
      <div ref={containerRef} aria-hidden="true" />
      <span className="sr-only">{accessibleText}</span>
    </div>
  )
}

/** Best-effort humanization of LaTeX for screen readers when no plain-text is available. */
function humanizeLatex(input: string): string {
  return input
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "$1 over $2")
    .replace(/\\cdot/g, " times ")
    .replace(/\\left|\\right/g, "")
    .replace(/\\sum/g, " sum ")
    .replace(/\\prod/g, " product ")
    .replace(/\\sqrt\{([^{}]+)\}/g, "square root of $1")
    .replace(/\^\{([^{}]+)\}/g, " to the $1")
    .replace(/[{}]/g, "")
    .replace(/\\,/g, " ")
    .replace(/\\\\/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}
