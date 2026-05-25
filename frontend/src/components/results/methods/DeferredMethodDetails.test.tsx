import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import DeferredMethodDetails from "./DeferredMethodDetails"
import { MethodDetails } from "@/components/results/MethodDetails"
import { DisplayDigitsProvider } from "@/lib/display-digits"
import { osculatingDeferredResponse } from "@/test/interpolate-response.fixtures"

/**
 * Tests for the deferred-method renderer (R10.2, R10.3) and for the
 * sibling-method visibility guarantee under top-level
 * `status === "partial"` when only `osculating` is deferred (R10.4,
 * R15.2). The MethodDetails dispatcher renders both panels in the
 * same Tabs root: the V1 Lagrange panel must stay fully operational
 * even though the Osculating panel surfaces a deferred state.
 */

describe("DeferredMethodDetails", () => {
  it("renders the deferred chip + backend message + code, with no tables", () => {
    const result = osculatingDeferredResponse.methods.osculating!

    render(<DeferredMethodDetails method="osculating" result={result} />)

    // 1. Deferred chip from design.md §9.5.
    expect(screen.getByText("Deferred")).toBeInTheDocument()

    // 2. Backend `error.message` is rendered verbatim through the
    //    shared ErrorNotice (severity="warning", layout="block").
    expect(
      screen.getByText(/Osculating polynomial matching is accepted/i),
    ).toBeInTheDocument()

    // 3. Backend `error.code` is rendered as the literal
    //    `method_not_implemented` in the ErrorNotice "Code:" line.
    expect(screen.getByText("method_not_implemented")).toBeInTheDocument()

    // 4. Per R10.3 the deferred renderer must not simulate, approximate,
    //    or otherwise stand in for an unimplemented method, so it
    //    renders no tables.
    expect(screen.queryByRole("table")).toBeNull()
  })
})

describe("MethodDetails — sibling visibility under partial status", () => {
  it("keeps Lagrange visible when only osculating is deferred", () => {
    render(
      <DisplayDigitsProvider>
        <MethodDetails data={osculatingDeferredResponse} />
      </DisplayDigitsProvider>,
    )

    // The dispatcher's `pickInitialTab` prefers Classroom-Facing Methods,
    // so `lagrange` is the default active tab and its panel is mounted.
    // The fixture sets `basis_polynomials` to a non-empty array, so the
    // Lagrange panel renders the "Basis Polynomials" heading.
    expect(screen.getByText("Basis Polynomials")).toBeInTheDocument()

    // Both tab triggers render in the TabsList regardless of which
    // panel is active. The trigger text is the raw lowercase method
    // name (`lagrange`, `osculating`) styled by the `capitalize` Tailwind
    // class, so DOM text matching uses a case-insensitive regex.
    expect(screen.getByText(/^lagrange$/i)).toBeInTheDocument()
    // "Osculating" appears at minimum as the tab trigger; if the
    // Osculating panel is also mounted, it would additionally appear
    // inside the deferred lecture copy. `getAllByText` covers both.
    expect(screen.getAllByText(/osculating/i).length).toBeGreaterThanOrEqual(1)
  })
})
