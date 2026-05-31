import { Badge } from "@/components/ui/badge"
import { ErrorNotice } from "@/components/ErrorNotice"
import type { ErrorBody, MethodName, WarningBody } from "@/lib/api-types"

/**
 * Renderer for any method whose response carries
 * `error.code === "method_not_implemented"`. The prop shape stays
 * permissive on purpose so the component can render any future deferred
 * method without changes.
 *
 * Layout follows `design.md` §9.5:
 *   1. "Deferred" badge (`variant="secondary"`).
 *   2. Backend error block — `error.message` and `Code: method_not_implemented`
 *      rendered through the shared `ErrorNotice` with `severity="warning"`.
 *      Warning, not destructive, because the response is a deliberate
 *      deferred state (the request was valid; the method just is not
 *      implemented yet) rather than a validation failure.
 *   3. Body copy — a single paragraph that explains the response state.
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
 * Static copy only: no math, no simulation, and no method-specific
 * claims about current release blockers.
 */
const LECTURE_COPY: Partial<Record<MethodName, string>> = {}

const GENERIC_LECTURE_COPY =
  "This method is accepted by the backend schema but is not available in this response."

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
