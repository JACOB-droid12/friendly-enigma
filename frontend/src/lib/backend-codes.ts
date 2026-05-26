import { getWarningMeta, type WarningSeverity } from "./warnings"

/**
 * Backend code registry.
 *
 * Single front door for every place the UI displays a backend warning,
 * error, or omission code (`piecewise_method_no_global_polynomial`,
 * `unsafe_expression`, `unequal_spacing`, etc). Reuses the existing
 * `lib/warnings.ts` catalog so the humanised label and severity stay
 * consistent across surfaces.
 *
 * Safe fallback (per user direction): an unknown code does not crash
 * and does not block rendering. It returns a payload whose
 * `humanized: false` flag tells callers "no friendly label exists; show
 * the backend message first, then a `Code: <code>` line."
 */

export interface BackendCodeDisplay {
  /**
   * Humanised label suitable for `font-label` voice. When the code is
   * unknown to the registry this falls back to the raw `code` string
   * so callers always have something printable.
   */
  label: string
  /** Display severity (info / warning / error). */
  severity: WarningSeverity
  /** True when the registry has a friendly label, false on fallback. */
  humanized: boolean
}

export function getBackendCodeDisplay(code: string): BackendCodeDisplay {
  const meta = getWarningMeta(code)
  return {
    label: meta.label,
    severity: meta.severity,
    humanized: meta.label !== code,
  }
}

/**
 * Resolve a `{ code, message }` payload into the three slots used by
 * `ErrorNotice` and similar surfaces:
 *
 *   primary    : the human-readable line.
 *   secondary  : optional follow-up sentence (only used when message
 *                is missing).
 *   showCode   : whether to render a `Code: <code>` companion line.
 *
 * Rules:
 *   - When `message` is present, that is the primary line and the code
 *     becomes the `Code:` companion. The friendly registry label is
 *     not used here because the backend message is already the
 *     authority on what happened.
 *   - When `message` is missing but `code` is present, the friendly
 *     registry label becomes the primary line, the raw code becomes
 *     the `Code:` companion, and a secondary "Backend did not provide
 *     a description." line acknowledges the gap. If the code is
 *     unknown to the registry, the raw code is the primary line and
 *     the secondary line is the same.
 *   - When both are missing, primary falls back to a generic sentence.
 */
export function resolveBackendCodePayload(
  code?: string | null,
  message?: string | null,
): {
  primary: string
  secondary?: string
  showCode: boolean
  humanized: boolean
  severity: WarningSeverity
} {
  const trimmedCode = code?.trim() ?? ""
  const trimmedMessage = message?.trim() ?? ""
  const hasCode = trimmedCode.length > 0
  const hasMessage = trimmedMessage.length > 0

  if (hasMessage && hasCode) {
    const display = getBackendCodeDisplay(trimmedCode)
    return {
      primary: trimmedMessage,
      showCode: true,
      humanized: display.humanized,
      severity: display.severity,
    }
  }

  if (hasMessage) {
    return {
      primary: trimmedMessage,
      showCode: false,
      humanized: false,
      severity: "warning",
    }
  }

  if (hasCode) {
    const display = getBackendCodeDisplay(trimmedCode)
    return {
      primary: display.humanized ? display.label : trimmedCode,
      secondary: "Backend did not provide a description.",
      showCode: display.humanized,
      humanized: display.humanized,
      severity: display.severity,
    }
  }

  return {
    primary: "An unexpected error occurred.",
    showCode: false,
    humanized: false,
    severity: "error",
  }
}
