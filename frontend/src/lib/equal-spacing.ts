/**
 * Frontend-only equal-spacing eligibility hint.
 *
 * Phase 2 lecture methods that consume equally spaced nodes
 * (`newton_forward`, `newton_backward`, `stirling`) require the user's
 * x-values to be uniformly stepped. This helper inspects the
 * user-entered x-value strings and reports whether they *appear*
 * equally spaced so the UI can surface a non-blocking eligibility
 * hint and (when every selected method is in the Equal-Spacing
 * Family) gate the Compute button.
 *
 * Important contract notes:
 *   - This is a hint-only helper. The request body still ships the
 *     original user strings without `parseFloat`/`Number()`; the
 *     backend remains the authority on whether equal-spacing is
 *     accepted or rejected. The frontend never short-circuits a
 *     backend call when at least one selected method is not in the
 *     Equal-Spacing Family (R4.5).
 *   - The helper is pure: no DOM access, no global state, no
 *     mutation of its input array.
 *   - The helper SHALL NOT compute interpolation, finite
 *     differences, or any numeric transformation beyond comparing
 *     consecutive differences with a relative tolerance.
 *
 * Consumed by:
 *   - `frontend/src/components/EqualSpacingHint.tsx` (renders the
 *     hint copy beneath the input editor).
 *   - `frontend/src/App.tsx` `isFormBlocked` (gates Compute when
 *     every selected method is Equal-Spacing).
 */

/**
 * Relative tolerance used when comparing consecutive differences. Two
 * differences `a` and `b` are treated as equal when
 *   |a - b| <= EQUAL_SPACING_TOLERANCE * max(|a|, |b|, 1).
 *
 * The trailing `1` floor admits small mismatches caused by binary-
 * float representation of decimal user input (e.g. parsing "0.1",
 * "0.2", "0.3" introduces sub-1e-16 noise) without ignoring nodes
 * that are genuinely uneven. The tolerance is intentionally tight
 * because this helper is only a hint; the backend still validates
 * spacing exactly.
 */
const EQUAL_SPACING_TOLERANCE = 1e-9

/**
 * Inspect a list of x-value strings and report whether they look
 * equally spaced for hint purposes. Returns `equallySpaced: false`
 * when fewer than two finite values are present, when any value or
 * computed difference is non-finite, or when consecutive differences
 * disagree beyond `EQUAL_SPACING_TOLERANCE`. When eligible,
 * `spacingH` carries the first computed difference (a `number`); the
 * field is omitted otherwise. When ineligible, `reason` carries a
 * short hint string suitable for surfacing in `EqualSpacingHint`.
 */
export function assessEqualSpacing(
  values: string[],
): { equallySpaced: boolean; spacingH?: number; reason?: string } {
  if (values.length < 2) {
    return { equallySpaced: false, reason: "fewer than two values" }
  }

  const parsed: number[] = []
  for (const raw of values) {
    const trimmed = raw.trim()
    if (trimmed === "") {
      return { equallySpaced: false, reason: "non-finite value detected" }
    }
    const n = Number(trimmed)
    if (!Number.isFinite(n)) {
      return { equallySpaced: false, reason: "non-finite value detected" }
    }
    parsed.push(n)
  }

  const firstDiff = parsed[1] - parsed[0]
  if (!Number.isFinite(firstDiff)) {
    return { equallySpaced: false, reason: "non-finite value detected" }
  }

  for (let i = 2; i < parsed.length; i++) {
    const diff = parsed[i] - parsed[i - 1]
    if (!Number.isFinite(diff)) {
      return { equallySpaced: false, reason: "non-finite value detected" }
    }
    const threshold =
      EQUAL_SPACING_TOLERANCE *
      Math.max(Math.abs(diff), Math.abs(firstDiff), 1)
    if (Math.abs(diff - firstDiff) > threshold) {
      return {
        equallySpaced: false,
        reason: "differences vary beyond tolerance",
      }
    }
  }

  return { equallySpaced: true, spacingH: firstDiff }
}
