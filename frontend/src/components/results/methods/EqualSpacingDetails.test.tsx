import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { DisplayDigitsProvider } from "@/lib/display-digits"
import {
  newtonForwardResponse,
  unequalSpacingErrorResponse,
} from "@/test/interpolate-response.fixtures"
import EqualSpacingDetails from "./EqualSpacingDetails"

/**
 * Tests for the Equal-Spacing Family renderer per design.md §12.2.
 *
 * The renderer is `DisplayDigitsProvider`-aware (it calls `useDisplayDigits`),
 * so all `render` calls go through the provider wrapper to mirror how the
 * component mounts inside the workbench.
 *
 * No client-side math is asserted here; assertions only verify that backend
 * fields surface in the documented layout (R6.1, R6.2, R6.3, R6.4, R6.5),
 * matching the unit-test guidance in R15.2.
 */

function renderWithDisplay(ui: React.ReactElement) {
  return render(<DisplayDigitsProvider>{ui}</DisplayDigitsProvider>)
}

describe("EqualSpacingDetails", () => {
  it("renders the newton_forward happy path with spacing summary, difference table, evaluations, and steps", () => {
    const result = newtonForwardResponse.methods.newton_forward!
    renderWithDisplay(<EqualSpacingDetails method="newton_forward" result={result} />)

    // Spacing summary surfaces backend `spacing_h` and `anchor_index`.
    expect(screen.getByRole("heading", { name: "Spacing Summary" })).toBeInTheDocument()
    expect(screen.getByText(/Spacing h\s*=/)).toBeInTheDocument()
    expect(screen.getByText(/Anchor index\s*=/)).toBeInTheDocument()

    // Forward-difference table heading is method-specific (R6.2).
    expect(
      screen.getByRole("heading", { name: /Forward-Difference Table/i }),
    ).toBeInTheDocument()

    // Per-evaluation block surfaces `s`, `value`, and `terms` (R6.3).
    expect(screen.getByRole("heading", { name: "Evaluations" })).toBeInTheDocument()
    // The evaluation block renders three `<code>` chips. Each chip's
    // text content reads `<label> = <value>` while the inner label
    // `<span>` text reads `<label> = ` only. Match the full chip
    // text content via a function matcher so the assertion targets
    // the chip uniquely instead of relying on a regex that would
    // also match the inner label span and the spacing-summary chip
    // (`Anchor index = …` contains the substring `x = `).
    expect(
      screen.getByText(
        (_content, node) => (node?.textContent ?? "").trim() === "x = 3/2",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        (_content, node) => (node?.textContent ?? "").trim() === "s = 5/3",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        (_content, node) =>
          (node?.textContent ?? "").trim().startsWith("Value = "),
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Terms" })).toBeInTheDocument()
    expect(screen.getAllByText(/^order \d+:/i).length).toBe(
      result.evaluations?.[0]?.terms?.length ?? 0,
    )

    // Target-guidance advisory copy renders because the fixture's
    // `target_guidance.recommended` is "stirling" while method is
    // "newton_forward" (R6.4).
    expect(screen.getByText(/Backend recommends/i)).toBeInTheDocument()
    expect(screen.getByText(/advisory only/i)).toBeInTheDocument()

    // Construction steps render as an ordered list (R6.1).
    expect(
      screen.getByRole("heading", { name: /Construction Steps/i }),
    ).toBeInTheDocument()
  })

  it("renders the unequal_spacing method-level error inline via ErrorNotice", () => {
    const result = unequalSpacingErrorResponse.methods.newton_forward!
    renderWithDisplay(<EqualSpacingDetails method="newton_forward" result={result} />)

    // Backend message surfaces verbatim.
    expect(
      screen.getByText(/Newton Forward requires equally spaced nodes/i),
    ).toBeInTheDocument()

    // The error code appears in the canonical "Code: <code>" hierarchy
    // produced by the shared `ErrorNotice` (R6.5).
    expect(screen.getByText("Code:")).toBeInTheDocument()
    expect(screen.getByText("unequal_spacing")).toBeInTheDocument()

    // No difference-table / evaluations / steps headings render because the
    // backend left those collections empty in the error-case fixture.
    expect(
      screen.queryByRole("heading", { name: /Forward-Difference Table/i }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Evaluations" })).not.toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: /Construction Steps/i }),
    ).not.toBeInTheDocument()
  })

  it("renders without throwing when the method failed (sibling-friendly)", () => {
    // Verifies the family renderer is robust on its own. Sibling-method
    // visibility is the dispatcher's responsibility (R6.5, R10.4); this
    // case only confirms the renderer does not crash on an error result so
    // siblings rendered by `MethodDetails.tsx` stay intact.
    const result = unequalSpacingErrorResponse.methods.newton_forward!
    expect(() =>
      renderWithDisplay(<EqualSpacingDetails method="newton_forward" result={result} />),
    ).not.toThrow()
  })

  it("surfaces target_guidance advisory copy when recommended differs from the rendered method", () => {
    const result = newtonForwardResponse.methods.newton_forward!
    renderWithDisplay(<EqualSpacingDetails method="newton_forward" result={result} />)

    // The fixture's `target_guidance.recommended` is "stirling" while the
    // rendered method is "newton_forward", so the advisory copy renders.
    // The renderer does not have access to `form.methods`; per task scope
    // we only assert the copy is present and the renderer never reframes
    // the selection.
    expect(screen.getByText(/Backend recommends/i)).toBeInTheDocument()
    expect(screen.getByText(/advisory only/i)).toBeInTheDocument()

    // The fixture's `recommended` value renders inline. Use a function
    // matcher because it is wrapped in a styled <span> alongside other
    // text inside the advisory paragraph.
    expect(
      screen.getByText((_content, node) => node?.textContent === "stirling"),
    ).toBeInTheDocument()
  })
})
