import { render, screen } from "@testing-library/react"
import type React from "react"
import { describe, expect, it } from "vitest"
import { DisplayDigitsProvider } from "@/lib/display-digits"
import {
  taylorResponse,
  taylorUnsupportedFunctionResponse,
} from "@/test/interpolate-response.fixtures"
import TaylorDetails from "./TaylorDetails"

/**
 * Tests for the Function-Derivative Family renderer per design.md §12.2.
 *
 * The renderer is `DisplayDigitsProvider`-aware (it calls `useDisplayDigits`
 * for `format` and `formatLiterals`), so all `render` calls go through the
 * provider wrapper to mirror how the component mounts inside the workbench
 * via `App.tsx`.
 *
 * No client-side math is asserted here; assertions only verify that backend
 * fields surface in the documented layout (R8.1, R8.2, R8.3, R8.4),
 * matching the unit-test guidance in R15.2. Per locked decision 2 the
 * renderer itself never invokes SymPy or Math.js (R8.5); the tests reflect
 * that by checking text from the fixture directly without re-deriving any
 * polynomial value.
 */

function renderWithDisplay(ui: React.ReactElement) {
  return render(<DisplayDigitsProvider>{ui}</DisplayDigitsProvider>)
}

describe("TaylorDetails", () => {
  it("renders the taylor happy path with configuration row, term table, polynomial forms, evaluations, and remainder note", () => {
    const result = taylorResponse.methods.taylor!
    renderWithDisplay(<TaylorDetails result={result} />)

    // Each documented section heading surfaces verbatim from the renderer
    // (R8.1, R8.2). The fixture populates `taylor_form`, `expanded`,
    // `latex_expanded`, `latex_taylor`, `evaluations`, `remainder_note`,
    // and `steps`, so every gated heading should render.
    expect(
      screen.getByRole("heading", { name: "Taylor Configuration" }),
    ).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Taylor Terms" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Taylor Form" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Expanded" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Expanded (LaTeX)" })).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Taylor Form (LaTeX)" }),
    ).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Evaluations" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Remainder Note" })).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Construction Steps" }),
    ).toBeInTheDocument()

    // Configuration row surfaces backend `center`, `order`, and
    // `series_name`. The values are split across `<span>` labels and
    // inline text content, so use `textContent` matchers to assert the
    // visible composite strings (R8.1).
    expect(
      screen.getByText(
        (_content, node) =>
          (node?.textContent ?? "").replace(/\s+/g, " ").trim() === "center = 0",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        (_content, node) =>
          (node?.textContent ?? "").replace(/\s+/g, " ").trim() === "order = 3",
      ),
    ).toBeInTheDocument()
    expect(screen.getByText(/Series:\s*Maclaurin/)).toBeInTheDocument()

    // Term table header columns are `<th>` elements which expose the
    // implicit `columnheader` role. The "f^(k)(c)" cell carries an
    // `aria-label="derivative evaluated at the center"`, so it is matched
    // by accessible name (R8.2).
    expect(
      screen.getByRole("columnheader", { name: "order" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("columnheader", { name: "derivative" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("columnheader", {
        name: "derivative evaluated at the center",
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("columnheader", { name: "coefficient" }),
    ).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: "term" })).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: "LaTeX" })).toBeInTheDocument()

    // The order-0 row's `derivative` column carries the backend-supplied
    // string `cos(x)`, routed through `formatLiterals` which preserves
    // identifiers verbatim. Match the inner `<code>` element directly so
    // the function matcher does not double-match the wrapping `<td>`
    // (whose `textContent` traverses through the `<code>` child).
    expect(
      screen.getByText(
        (_content, node) =>
          node?.tagName === "CODE" && (node?.textContent ?? "").trim() === "cos(x)",
      ),
    ).toBeInTheDocument()

    // Remainder note text is rendered exactly per R8.4 — no editing, no
    // truncation, no display-digit rounding. A substring match keeps the
    // assertion robust to copy tweaks while still verifying the panel is
    // wired.
    expect(screen.getByText(/Taylor's theorem writes/i)).toBeInTheDocument()

    // Evaluation chip reads `P(<x>) = <value>`. With the default 12-digit
    // display setting, exact rationals like `1/2` and `7/8` pass through
    // `format` unchanged, so the chip's text content is `P(1/2) = 7/8`.
    expect(screen.getByText(/P\(1\/2\)\s*=\s*7\/8/)).toBeInTheDocument()
  })

  it("renders the Maclaurin badge when series_name === \"Maclaurin\" without altering polynomial fields", () => {
    const result = taylorResponse.methods.taylor!
    // Sanity-check the fixture matches the case under test (R8.3).
    expect(result.series_name).toBe("Maclaurin")

    renderWithDisplay(<TaylorDetails result={result} />)

    // The Badge renders the literal "Maclaurin (center = 0)" copy when
    // `series_name === "Maclaurin"` (R8.3).
    expect(screen.getByText("Maclaurin (center = 0)")).toBeInTheDocument()

    // Polynomial-section headings still render alongside the badge,
    // confirming the badge does not gate the polynomial fields (R8.3).
    expect(screen.getByRole("heading", { name: "Taylor Form" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Expanded" })).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Taylor Form (LaTeX)" }),
    ).toBeInTheDocument()
  })

  it("renders the unsupported_taylor_function method-level error inline via ErrorNotice", () => {
    const result = taylorUnsupportedFunctionResponse.methods.taylor!
    // Sanity-check the fixture matches the case under test (R8.4).
    expect(result.error?.code).toBe("unsupported_taylor_function")

    renderWithDisplay(<TaylorDetails result={result} />)

    // Backend message surfaces verbatim. Use a partial regex match so the
    // assertion stays robust to copy tweaks while still verifying the
    // method-level error path is wired (R8.4).
    expect(
      screen.getByText(/Taylor expansion is not supported/i),
    ).toBeInTheDocument()

    // The error code appears in the canonical "Code: <code>" hierarchy
    // produced by the shared `ErrorNotice`.
    expect(screen.getByText("Code:")).toBeInTheDocument()
    expect(screen.getByText("unsupported_taylor_function")).toBeInTheDocument()

    // The `Taylor Terms` heading is gated by `result.terms.length > 0`,
    // and the error fixture leaves `terms: []`, so the table does not
    // render. The renderer falls through to the shared error path
    // without re-deriving the term table on the client.
    expect(
      screen.queryByRole("heading", { name: "Taylor Terms" }),
    ).not.toBeInTheDocument()
  })
})
