/**
 * Display-precision formatting for backend-produced numeric strings.
 *
 * The backend computes at user-selected precision (mpmath digits or SymPy
 * Rational). Those strings are the source of truth, but printing every
 * 50-digit coefficient on screen turns "respect for math" into "wall of
 * noise". This module rounds a numeric string for display while keeping
 * the original string available for "Full" mode.
 *
 * Inputs are always strings from the backend and may be:
 *   - integer:        "1", "-3", "0"
 *   - rational:       "1/26", "-7/3"            (SymPy Rational)
 *   - decimal:        "0.0384615...538"
 *   - scientific:     "2.7796...e-49"           (mpmath at high precision)
 *
 * "Full" returns the input unchanged. A finite digit budget rounds via
 * Number.toPrecision and converts to scientific when the magnitude is too
 * small or too large for the budget. Integers and short rationals are
 * returned unchanged (they are already exact and short).
 */

export type DisplayDigits = 6 | 12 | 25 | "full"

export const DISPLAY_DIGITS_OPTIONS: readonly DisplayDigits[] = [6, 12, 25, "full"] as const

export const DEFAULT_DISPLAY_DIGITS: DisplayDigits = 12

/** Rationals like "1/26" or "-7/3" are already exact and shorter than any decimal expansion. */
const RATIONAL_PATTERN = /^-?\d+\/\d+$/
/** Plain integers like "0", "1", "-12". */
const INTEGER_PATTERN = /^-?\d+$/

/**
 * Round a single numeric string to a digit budget. "full" passes through.
 * Integers and rationals pass through (they are already minimal).
 *
 * For decimals/scientific:
 *   - When the budget is below JavaScript's safe Number precision (15),
 *     we round through Number.toPrecision and convert to scientific when
 *     the magnitude is outside the budget's readable window.
 *   - When the budget is at or above 15, we keep the backend's exact text
 *     and only truncate to the budget. Going through Number for budgets
 *     >15 would invent garbage tail digits because JS doubles cannot
 *     represent more than ~17 significant decimal digits.
 */
export function roundNumericString(input: string, digits: DisplayDigits): string {
  if (digits === "full") return input
  const trimmed = input.trim()
  if (trimmed === "") return trimmed
  if (INTEGER_PATTERN.test(trimmed)) return trimmed
  if (RATIONAL_PATTERN.test(trimmed)) return trimmed

  if (digits >= 15) {
    return truncateSignificantDigits(trimmed, digits)
  }

  const n = Number(trimmed)
  if (!Number.isFinite(n)) return trimmed

  if (n === 0) return "0"

  const absN = Math.abs(n)
  const lower = Math.pow(10, -4)
  const upper = Math.pow(10, digits)

  if (absN < lower || absN >= upper) {
    // Stay in scientific to avoid 0.0000...000... or massive integer runs.
    return n.toExponential(Math.max(digits - 1, 1))
  }

  return stripTrailingZeros(n.toPrecision(digits))
}

/**
 * String-based truncation: keep at most `digits` significant figures from
 * the source string without going through Number. Preserves the backend's
 * exact digits up to the budget, then drops the rest. No rounding (the
 * truncated tail is dropped). For high-precision contexts this is the
 * safer choice: the backend remains the source of truth.
 */
function truncateSignificantDigits(input: string, digits: number): string {
  const negative = input.startsWith("-")
  const body = negative ? input.slice(1) : input

  const eIdx = body.toLowerCase().indexOf("e")
  const mantissa = eIdx === -1 ? body : body.slice(0, eIdx)
  const exponent = eIdx === -1 ? "" : body.slice(eIdx)

  const dotIdx = mantissa.indexOf(".")
  const intPart = dotIdx === -1 ? mantissa : mantissa.slice(0, dotIdx)
  const fracPart = dotIdx === -1 ? "" : mantissa.slice(dotIdx + 1)

  const intDigits = intPart.replace(/^0+/, "")
  let kept: string

  if (intDigits.length >= digits) {
    // Integer portion alone meets or exceeds the budget; we still print
    // the full integer and drop the fraction. No invented digits.
    kept = intPart + (fracPart ? "" : "")
  } else if (intDigits.length === 0) {
    // Pure-fractional number: skip leading fractional zeros, keep `digits`
    // significant digits from where the first non-zero digit appears.
    const leadingZeros = fracPart.match(/^0*/)?.[0].length ?? 0
    const significantStart = leadingZeros
    const significantEnd = significantStart + digits
    kept = "0." + fracPart.slice(0, significantEnd)
  } else {
    const remaining = digits - intDigits.length
    kept = intPart + (fracPart ? "." + fracPart.slice(0, remaining) : "")
  }

  const rejoined = stripTrailingZeros(kept) + exponent
  return negative ? "-" + rejoined : rejoined
}

/** Drop trailing zeros after a decimal point: "1.20000" -> "1.2", "1.000" -> "1". */
export function stripTrailingZeros(value: string): string {
  if (!value.includes(".")) return value
  // Handle scientific-notation formatted strings carefully.
  const eIdx = value.toLowerCase().indexOf("e")
  if (eIdx !== -1) {
    const mantissa = stripTrailingZeros(value.slice(0, eIdx))
    return mantissa + value.slice(eIdx)
  }
  return value.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "")
}

/**
 * Format polynomial-shaped strings emitted by SymPy (Python form):
 *   "-220.941...x**10 + 2.77e-49*x**9 + 494.9...x**8 - ... + 1.0"
 *
 * Rounds each coefficient and, when `hideNearZeroBelow` is finite, drops
 * terms whose absolute coefficient is below that threshold. The result
 * preserves the rest of the term (e.g. `*x**9`) verbatim so KaTeX/SymPy
 * grammar is undisturbed for downstream rendering.
 */
export function formatPolynomial(
  poly: string,
  digits: DisplayDigits,
  hideNearZeroBelow: number | null,
): { text: string; hiddenCount: number } {
  if (digits === "full" && hideNearZeroBelow === null) {
    return { text: poly, hiddenCount: 0 }
  }
  const terms = splitTopLevelTerms(poly)
  if (terms.length === 0) return { text: poly, hiddenCount: 0 }

  let hiddenCount = 0
  const formatted: string[] = []

  for (let i = 0; i < terms.length; i++) {
    const term = terms[i]
    const parsed = parseTerm(term)
    const coeffNum = Number(parsed.coeff)
    if (
      hideNearZeroBelow !== null &&
      Number.isFinite(coeffNum) &&
      Math.abs(coeffNum) > 0 &&
      Math.abs(coeffNum) < hideNearZeroBelow
    ) {
      hiddenCount++
      continue
    }
    formatted.push(renderTerm(parsed, digits, formatted.length === 0))
  }

  if (formatted.length === 0) {
    return { text: "0", hiddenCount }
  }

  return { text: formatted.join(" "), hiddenCount }
}

interface ParsedTerm {
  sign: "+" | "-"
  coeff: string
  rest: string // empty string when the term is a bare constant
}

/**
 * Split the polynomial into top-level terms. `+` and `-` count as separators
 * only at depth 0 and never when they are part of an exponent like `1.5e-10`.
 */
function splitTopLevelTerms(poly: string): string[] {
  const terms: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < poly.length; i++) {
    const c = poly[i]
    if (c === "(") depth++
    else if (c === ")") depth--
    else if ((c === "+" || c === "-") && depth === 0 && i > 0) {
      const prev = poly[i - 1]
      if (prev === "e" || prev === "E") continue
      const segment = poly.slice(start, i).trim()
      if (segment !== "") terms.push(segment)
      start = i
    }
  }
  const tail = poly.slice(start).trim()
  if (tail !== "") terms.push(tail)
  return terms
}

function parseTerm(term: string): ParsedTerm {
  let body = term.trim()
  let sign: "+" | "-" = "+"
  if (body.startsWith("+")) body = body.slice(1).trim()
  else if (body.startsWith("-")) {
    sign = "-"
    body = body.slice(1).trim()
  }

  // Match: leading numeric coefficient optionally followed by * <rest>
  // Coefficient: \d+(\.\d+)?([eE][+-]?\d+)?
  const m = body.match(/^(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)(?:\s*\*\s*(.*))?$/s)
  if (m) {
    return { sign, coeff: m[1], rest: (m[2] ?? "").trim() }
  }
  // No leading numeric coefficient: implicit coefficient of 1, e.g. "x" or "x**2".
  return { sign, coeff: "1", rest: body }
}

function renderTerm(parsed: ParsedTerm, digits: DisplayDigits, isFirst: boolean): string {
  const rounded = roundNumericString(parsed.coeff, digits)
  const signToken = parsed.sign === "+" ? (isFirst ? "" : "+") : isFirst ? "-" : "-"
  const signPart = isFirst ? signToken : `${signToken} `

  if (rounded === "1" && parsed.rest !== "") {
    return signPart === "" || signPart === "+" || signPart === "+ "
      ? `${signPart}${parsed.rest}`.trim()
      : `${signPart}${parsed.rest}`.trim()
  }

  if (parsed.rest === "") {
    return `${signPart}${rounded}`.trim()
  }
  return `${signPart}${rounded}*${parsed.rest}`.trim()
}

/**
 * The threshold for hiding near-zero polynomial coefficients. Using 10^-(digits + 2)
 * keeps anything that could legitimately be the smallest displayable value while
 * pruning floating-point noise from high-precision SymPy expansion.
 */
export function nearZeroThresholdFor(digits: DisplayDigits): number | null {
  if (digits === "full") return null
  return Math.pow(10, -(digits + 2))
}

/**
 * Structure-preserving numeric-literal formatter.
 *
 * Walks an arbitrary expression string and rounds every numeric literal in
 * place without touching operators, parentheses, variable names, function
 * names, or any other non-numeric token. Safe for forms whose grammar is
 * NOT a sum of monomials, such as factored "(x - 2.0)*(x - 5.0)", Lagrange
 * "L_0*y_0 + L_1*y_1" with embedded basis polynomials, and Newton nested
 * "4 + (x - 2)*(...)".
 *
 * Unlike formatPolynomial, this function never re-orders, drops, or merges
 * tokens. Near-zero filtering is deliberately NOT applied here because we
 * cannot know whether a small coefficient is structurally meaningful inside
 * a parenthesised inner expression. The backend remains the source of
 * truth for structure; this layer only rounds the numbers it sees.
 *
 * "full" passes the input through unchanged.
 */
export function formatNumericLiteralsInString(
  input: string,
  digits: DisplayDigits,
): string {
  if (digits === "full") return input
  // Match decimal/integer/scientific numeric literals. Negative signs are
  // intentionally NOT consumed: a "-" in the middle of an expression is an
  // operator, and consuming it as part of a literal would break grammar
  // for inputs like "1 - 2" or "x - 0.5".
  const NUM = /(?:\d+\.\d+|\d+)(?:[eE][+-]?\d+)?/g
  return input.replace(NUM, (match) => roundNumericString(match, digits))
}


/**
 * Structure-preserving numeric-literal formatter for LaTeX strings.
 *
 * SymPy emits LaTeX where numeric literals appear as plain digit runs
 * (`1.5`, `0.7651977`, `1.2e-5`) interleaved with control sequences
 * (`\frac`, `\left`, `\right`), braces, and identifiers. Rounding the
 * literals while leaving everything else alone keeps KaTeX rendering
 * stable: the same `\frac{...}{...}` shape, just shorter coefficients.
 *
 * Implementation notes:
 *
 *   - Negative signs are operators; we never consume them as part of
 *     a literal. A `-` in the middle of an expression is left alone.
 *   - Exponents inside a control sequence (e.g. the integer in
 *     `\frac{1}{2}`) round through `roundNumericString`, but
 *     integers and rationals already pass through unchanged so the
 *     LaTeX shape is preserved verbatim.
 *   - The implementation reuses `formatNumericLiteralsInString` so
 *     bug fixes apply to both plain-text and LaTeX output. We call
 *     it under a separate name to make the intent explicit at call
 *     sites and to leave room for LaTeX-specific tightening later
 *     (for example, skipping numerals inside `\text{...}` blocks).
 *
 * Display-digits parity: when the polynomial card renders the plain
 * text and the LaTeX side by side, both pass through the same
 * digit-budget helper. At Display 6 the plain text and the KaTeX
 * output round to six significant figures together. Full precision
 * stays available through "Full" mode and through the Copy button on
 * the polynomial forms.
 */
export function formatLatexLiterals(
  input: string,
  digits: DisplayDigits,
): string {
  if (digits === "full") return input
  return formatNumericLiteralsInString(input, digits)
}
