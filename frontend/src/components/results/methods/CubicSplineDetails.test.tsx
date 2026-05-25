import { render, screen } from "@testing-library/react"
import type React from "react"
import { describe, expect, it } from "vitest"
import { DisplayDigitsProvider } from "@/lib/display-digits"
import {
  cubicSplineResponse,
  splineUnsupportedBoundaryResponse,
} from "@/test/interpolate-response.fixtures"
import CubicSplineDetails from "./CubicSplineDetails"

/**
 * Tests for the Piecewise Family `cubic_spline` renderer per
 * design.md §12.2. The renderer is `DisplayDigitsProvider`-aware (it
 * calls `useDisplayDigits` for `format` and `formatLiterals`), so all
 * `render` calls go through the provider wrapper to mirror how the
 * component mounts inside the workbench via `App.tsx`.
 *
 * No client-side math is asserted here; assertions only verify that
 * backend fields surface in the documented layout (R9.1, R9.2, R9.3,
 * R9.5), matching the unit-test guidance in R15.2. Per R9.6 the
 * renderer never recomputes spline coefficients, segment polynomials,
 * continuity checks, or evaluations on the client; the tests reflect
 * that by reading text from the fixtures directly.
 *
 * The `polynomial` prop is sourced from the response's top-level
 * `polynomial` block (NOT `methods.cubic_spline.polynomial`, which
 * does not exist in the API contract). The piecewise notice is
 * triggered by `polynomial.expanded_omitted_reason ===
 * "piecewise_method_no_global_polynomial"` per R9.3.
 */

function renderWithDisplay(ui: React.ReactElement) {
  return render(<DisplayDigitsProvider>{ui}</DisplayDigitsProvider>)
}

describe("CubicSplineDetails", () => {
  it("renders the cubic_spline happy path with boundary condition badge, ordered nodes, second derivatives, segments table, continuity checks, evaluations, and the piecewise notice", () => {
    renderWithDisplay(
      <CubicSplineDetails
        result={cubicSplineResponse.methods.cubic_spline!}
        polynomial={cubicSplineResponse.polynomial}
      />,
    )

    // Boundary condition heading + Badge value `"natural"` surface
    // verbatim from the backend (R9.1).
    expect(
      screen.getByRole("heading", { name: "Boundary Condition" }),
    ).toBeInTheDocument()
    expect(screen.getByText("natural")).toBeInTheDocument()

    // Ordered-nodes section heading. The fixture's three nodes are
    // populated, so the table renders (R9.1).
    expect(screen.getByRole("heading", { name: "Ordered Nodes" })).toBeInTheDocument()

    // Second-derivatives heading reads "Second Derivatives M<i>" with
    // the trailing subscript glyph rendered via `<sub>`. The accessible
    // name therefore matches `/Second Derivatives M/i`.
    expect(
      screen.getByRole("heading", { name: /Second Derivatives M/ }),
    ).toBeInTheDocument()

    // Segments, continuity-checks, and evaluations sections all render
    // because the happy-path fixture populates each collection (R9.1).
    expect(screen.getByRole("heading", { name: "Segments" })).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Continuity Checks" }),
    ).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Evaluations" })).toBeInTheDocument()

    // Segment 0's `local_form` renders verbatim through `formatLiterals`,
    // which preserves operators / parentheses / identifiers and only
    // rounds numeric literals. The fixture's literals (`2`, `3`, `4`,
    // `1`) are all single-digit integers and pass through unchanged at
    // the default 12-digit display setting, so the resulting `<code>`
    // text content is the fixture string verbatim. Match the inner
    // `<code>` element directly so the function matcher does not
    // double-match the wrapping `<td>` (whose `textContent` traverses
    // through the `<code>` child).
    expect(
      screen.getByText(
        (_content, node) =>
          node?.tagName === "CODE" &&
          (node?.textContent ?? "").trim() === "2 + 3/4*(x - 1) + 1/4*(x - 1)**3",
      ),
    ).toBeInTheDocument()

    // Piecewise notice (R9.3) — folded into the happy-path test because
    // the happy fixture sets `expanded_omitted_reason` to
    // `"piecewise_method_no_global_polynomial"`. The notice copy is in
    // body voice, not error/warning voice.
    expect(screen.getByText(/This is a piecewise spline/i)).toBeInTheDocument()
  })

  it("renders the unsupported_boundary_condition method-level error inline via ErrorNotice", () => {
    renderWithDisplay(
      <CubicSplineDetails
        result={splineUnsupportedBoundaryResponse.methods.cubic_spline!}
        polynomial={splineUnsupportedBoundaryResponse.polynomial}
      />,
    )

    // Backend `error.message` surfaces verbatim through the shared
    // `ErrorNotice` (R9.5). The wording follows the contract example:
    // "Boundary condition 'clamped' is not yet supported. Use 'natural'."
    expect(
      screen.getByText(/Boundary condition .* is not yet supported/i),
    ).toBeInTheDocument()

    // The error code appears in the canonical "Code: <code>" hierarchy
    // produced by the shared `ErrorNotice`.
    expect(screen.getByText("Code:")).toBeInTheDocument()
    expect(screen.getByText("unsupported_boundary_condition")).toBeInTheDocument()

    // Per R9.5 the error path leaves `segments: []` so the Segments
    // heading is gated off; the renderer falls through to the shared
    // error path without inventing a segment list on the client.
    expect(
      screen.queryByRole("heading", { name: "Segments" }),
    ).not.toBeInTheDocument()
  })
})
