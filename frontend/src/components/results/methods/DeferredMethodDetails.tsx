import { Badge } from "@/components/ui/badge"
import { ErrorNotice } from "@/components/ErrorNotice"
import type { ErrorBody, MethodName, WarningBody } from "@/lib/api-types"

/**
 * Renderer for any method whose response carries
 * `error.code === "method_not_implemented"`. Currently only `osculating`
 * routes here, but the prop shape stays permissive on purpose so the
 * component can render any future deferred method without changes.
 *
 * Layout follows `design.md` §9.5:
 *   1. "Deferred" badge (`variant="secondary"`).
 *   2. Backend error block — `error.message` and `Code: method_not_implemented`
 *      rendered through the shared `ErrorNotice` with `severity="warning"`.
 *      Warning, not destructive, because the response is a deliberate
 *      deferred state (the request was valid; the method just is not
 *      implemented yet) rather than a validation failure.
 *   3. Lecture-aware copy — a single body-voice paragraph that explains
 *      why the method is deferred and points at the closest implemented
 *      alternative.
 *   4. No tables, no terms, no derivatives. Per R10.3 the renderer must
 *      not simulate, approximate, or hide the deferred state.
 *
 * Sibling-method visibility under top-level `status === "partial"` (R10.4)
 * is handled by the parent `MethodDetails` dispatcher; this component
 * does not branch on top-level status.
 */

interface DeferredMethodDetailsProps {
  /** Method name. Used to choose the lecture-aware copy. */
  method: MethodName
  /**
   * Deliberately permissive shape: any method-level result with the
   * shared error/warnings outer shell can be passed in. Only `error` is
   * read by this renderer; `warnings` is part of the prop contract for
   * forward-compatibility but is rendered (when relevant) by the parent
   * dispatcher's persistent warning bar, not here.
   */
  result: {
    error: ErrorBody | null
    warnings: WarningBody[]
  }
}

/**
 * Lecture-aware copy keyed by method name. Static strings only — no
 * math, no simulation. R10.3 forbids approximating or hiding the
 * deferred state, but a static lecture line that points at an
 * implemented alternative is fine.
 */
const LECTURE_COPY: Partial<Record<MethodName, string>> = {
  osculating:
    "Generalized osculating polynomials match higher-order derivatives at each node. The backend has not implemented this yet; pick Hermite for first-derivative matching.",
}

const GENERIC_LECTURE_COPY =
  "This method is accepted by the backend schema but is not implemented yet."

export default function DeferredMethodDetails({
  method,
  result,
}: DeferredMethodDetailsProps) {
  const { error } = result
  const lectureCopy = LECTURE_COPY[method] ?? GENERIC_LECTURE_COPY

  return (
    <div className="space-y-3">
      <Badge variant="secondary" className="text-[10px]">
        Deferred
      </Badge>

      {error ? (
        <ErrorNotice
          code={error.code}
          message={error.message}
          severity="warning"
          layout="block"
        />
      ) : (
        <p className="text-xs text-muted-foreground leading-relaxed italic">
          No deferred-method error payload returned.
        </p>
      )}

      <p className="text-xs text-muted-foreground leading-relaxed">
        {lectureCopy}
      </p>
    </div>
  )
}
