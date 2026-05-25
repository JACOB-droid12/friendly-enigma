import { render, screen } from "@testing-library/react"
import type React from "react"
import { describe, expect, it } from "vitest"
import { DisplayDigitsProvider } from "@/lib/display-digits"
import {
  hermiteDividedDifferenceResponse,
  hermiteResponse,
  hermiteOmittedBasisResponse,
  hermiteMissingDerivativeErrorResponse,
} from "@/test/interpolate-response.fixtures"
import HermiteDetails from "./HermiteDetails"

/**
 * Tests for the Derivative-Data Family renderer per design.md §12.2.
 *
 * The renderer is `DisplayDigitsProvider`-aware (it calls `useDisplayDigits`),
 * so all `render` calls go through the provider wrapper to mirror how the
 * component mounts inside the workbench.
 *
 * No client-side math is asserted here; assertions only verify that backend
 * fields surface in the documented layout (R7.1, R7.2, R7.3, R7.4),
 * matching the unit-test guidance in R15.2. Per locked decision 2, the
 * omitted basis-form path is sourced from the
 * `expanded_polynomial_omitted` warning whose
 * `details.artifact === "hermite_basis_form"`; the renderer never
 * reconstructs the basis form on the client (R7.3).
 */

function renderWithDisplay(ui: React.ReactElement) {
  return render(<DisplayDigitsProvider>{ui}</DisplayDigitsProvider>)
}

describe("HermiteDetails", () => {
  it("renders the hermite_divided_difference happy path with repeated nodes, divided-difference table, coefficients, nested form, expanded form, and latex_expanded via KaTeX", () => {
    const result = hermiteDividedDifferenceResponse.methods.hermite_divided_difference!
    const { container } = renderWithDisplay(
      <HermiteDetails method="hermite_divided_difference" result={result} />,
    )

    // Each documented section heading surfaces verbatim from the renderer
    // (R7.1, R7.2). The repeated-nodes table renders before the
    // divided-difference table per design.md §9.2.
    expect(screen.getByRole("heading", { name: "Repeated Nodes" })).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Divided-Difference Table" }),
    ).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Coefficients" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Newton Nested Form" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Expanded" })).toBeInTheDocument()

    // The latex_expanded section uses KaTeX. KatexDisplay exposes the math
    // through a `role="math"` container so the LaTeX rendering itself can
    // be detected from the test side without inspecting KaTeX internals.
    // Use a direct `querySelector` rather than `getByRole("math")`: the
    // role-based query iterates the whole tree calling
    // `window.getComputedStyle` on every node, and jsdom's accessibility
    // helpers throw a `TypeError: Cannot read properties of undefined`
    // on certain KaTeX-rendered descendants. The container-scoped CSS
    // selector confirms the same element is in the document without
    // triggering that traversal.
    expect(
      screen.getByRole("heading", { name: "Expanded (LaTeX)" }),
    ).toBeInTheDocument()
    expect(container.querySelector('[role="math"]')).not.toBeNull()

    // Basis-form sections are absent for the divided-difference variant
    // because the response does not carry a `basis_form` field. Use
    // `container.querySelector` for the heading lookup as well, again
    // to avoid the jsdom traversal crash described above.
    const headings = Array.from(container.querySelectorAll("h3")).map(
      (h) => (h.textContent ?? "").trim(),
    )
    expect(headings).not.toContain("Hermite Basis Form")
    expect(headings).not.toContain("Basis Terms")
  })

  it("renders the hermite happy path with the basis-included branch, basis terms, and the matches_divided_difference indicator", () => {
    const result = hermiteResponse.methods.hermite!
    // Sanity-check the fixture matches the case under test.
    expect(result.basis_form?.status).toBe("included")
    expect(
      result.basis_form?.status === "included" &&
        result.basis_form.matches_divided_difference,
    ).toBe(true)

    renderWithDisplay(<HermiteDetails method="hermite" result={result} />)

    // Both the divided-difference sections and the basis-form sections
    // render side-by-side on the basis-included branch (R7.2).
    expect(
      screen.getByRole("heading", { name: "Divided-Difference Table" }),
    ).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Hermite Basis Form" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Basis Terms" })).toBeInTheDocument()

    // The basis-form badge surfaces the `matches_divided_difference`
    // boolean both as a visible glyph (with a paired `sr-only` text label)
    // and as a body-voice prefix.
    expect(screen.getByText(/matches divided difference:/i)).toBeInTheDocument()
    expect(screen.getByText("yes")).toBeInTheDocument()
  })

  it("renders the omitted basis-form notice sourced from the expanded_polynomial_omitted warning whose details.artifact is hermite_basis_form", () => {
    const result = hermiteOmittedBasisResponse.methods.hermite!
    expect(result.basis_form?.status).toBe("omitted")

    renderWithDisplay(<HermiteDetails method="hermite" result={result} />)

    // The basis-form section header still renders, now containing an
    // info-severity ErrorNotice routed by the renderer (locked decision 2).
    expect(screen.getByRole("heading", { name: "Hermite Basis Form" })).toBeInTheDocument()

    // The omission warning message and code surface through ErrorNotice.
    // The same warning is also present at the method-level top (rendered
    // by `MethodWarnings`), so the message and the code line can each
    // appear more than once. `getAllByText` tolerates either or both
    // occurrences without re-asserting layout the dispatcher owns.
    expect(
      screen.getAllByText(
        /Hermite basis form was omitted because the symbolic basis expansion exceeded the display threshold\./,
      ).length,
    ).toBeGreaterThan(0)
    expect(screen.getAllByText("expanded_polynomial_omitted").length).toBeGreaterThan(0)

    // Per R7.3 the basis-term table is never reconstructed on the client
    // when the backend omits the basis form, and the matches-indicator
    // does not appear because no `included` payload was returned.
    expect(
      screen.queryByRole("heading", { name: "Basis Terms" }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/matches divided difference:/i)).not.toBeInTheDocument()
  })

  it("renders the missing_derivative_data method-level error inline via ErrorNotice", () => {
    const result = hermiteMissingDerivativeErrorResponse.methods.hermite!
    renderWithDisplay(<HermiteDetails method="hermite" result={result} />)

    // Backend message surfaces verbatim. Use a partial regex match so the
    // assertion stays robust to copy tweaks while still verifying the
    // method-level error path is wired (R7.4).
    expect(screen.getByText(/Hermite requires a first derivative/i)).toBeInTheDocument()

    // The error code appears in the canonical "Code: <code>" hierarchy
    // produced by the shared `ErrorNotice`.
    expect(screen.getByText("Code:")).toBeInTheDocument()
    expect(screen.getByText("missing_derivative_data")).toBeInTheDocument()

    // No tables / coefficients / forms / basis sections render because the
    // backend left those collections empty in the error-case fixture; the
    // renderer falls through to the shared error path.
    expect(
      screen.queryByRole("heading", { name: "Repeated Nodes" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "Divided-Difference Table" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "Coefficients" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "Newton Nested Form" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "Hermite Basis Form" }),
    ).not.toBeInTheDocument()
  })
})
