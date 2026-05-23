import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import {
  DEFAULT_DISPLAY_DIGITS,
  formatNumericLiteralsInString,
  formatPolynomial,
  nearZeroThresholdFor,
  roundNumericString,
  type DisplayDigits,
} from "./format-numeric"

/**
 * Display-precision context.
 *
 * Compute precision (the user-selected mpmath/SymPy digit budget on the
 * input form) is independent from display precision (how many digits the
 * UI prints for any given numeric string). The backend remains the source
 * of truth; this context is purely a rendering control.
 *
 * Default is 12 significant digits, which keeps academic results readable
 * while preserving more than double-precision worth of information. "Full"
 * is opt-in for verification work.
 */
export interface DisplayDigitsContextValue {
  digits: DisplayDigits
  setDigits: (d: DisplayDigits) => void
  /** Round a single backend numeric string ("0.0384...", "1/26", "-3.0e-5"). */
  format: (s: string | null | undefined) => string
  /**
   * Round + near-zero-filter a polynomial that is known to be a sum of
   * monomials at the top level (the "expanded" SymPy form).
   *
   * Do NOT use this on factored, Lagrange-summation, or Newton-nested
   * forms: their grammar is not a top-level sum and structure can be
   * incorrectly clipped. Use `formatLiterals` instead.
   */
  formatPoly: (s: string | null | undefined) => { text: string; hiddenCount: number }
  /**
   * Structure-preserving rounding of every numeric literal in an arbitrary
   * expression string. Safe for factored / Lagrange-summation / Newton-
   * nested forms because operators, parentheses, and identifiers are left
   * unchanged. Never drops or merges tokens.
   */
  formatLiterals: (s: string | null | undefined) => string
}

// eslint-disable-next-line react-refresh/only-export-components
export const DisplayDigitsContext = createContext<DisplayDigitsContextValue | null>(null)

export function DisplayDigitsProvider({ children }: { children: ReactNode }) {
  const [digits, setDigits] = useState<DisplayDigits>(DEFAULT_DISPLAY_DIGITS)

  const value = useMemo<DisplayDigitsContextValue>(() => {
    const threshold = nearZeroThresholdFor(digits)
    return {
      digits,
      setDigits,
      format: (s) => {
        if (s == null) return ""
        return roundNumericString(s, digits)
      },
      formatPoly: (s) => {
        if (s == null) return { text: "", hiddenCount: 0 }
        return formatPolynomial(s, digits, threshold)
      },
      formatLiterals: (s) => {
        if (s == null) return ""
        return formatNumericLiteralsInString(s, digits)
      },
    }
  }, [digits])

  return <DisplayDigitsContext.Provider value={value}>{children}</DisplayDigitsContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDisplayDigits(): DisplayDigitsContextValue {
  const ctx = useContext(DisplayDigitsContext)
  if (!ctx) {
    throw new Error("useDisplayDigits must be used inside <DisplayDigitsProvider>")
  }
  return ctx
}
