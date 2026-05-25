import { render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { InputPanel, type FormState } from "@/components/InputPanel"

/**
 * Vitest smoke test for the "Method Configuration" card in
 * `InputPanel.tsx` (Phase 2 leaf 2.6).
 *
 * Validates: Requirements R5.7, R14.2.
 *
 * R5.7 — The Adaptive Input Panel section is hidden entirely when
 *   no Phase 2 method is selected, and renders only the blocks
 *   triggered by the currently selected Phase 2 methods.
 * R14.2 — Below the `md` breakpoint, Method Configuration blocks
 *   stack vertically rather than sitting side by side.
 *
 * The test exercises the rendered DOM only — it never recomputes
 * Phase 2 form state and never asserts on internal class names that
 * the implementation does not actually emit. The "stacking"
 * assertion checks that the Method Configuration card body carries
 * the `space-y-5` Tailwind utility, which is the single-column
 * vertical stack utility the implementation uses (see
 * `InputPanel.tsx` Section 3).
 */

function makeForm(overrides: Partial<FormState> = {}): FormState {
  return {
    mode: "points",
    points: [
      ["1", "1"],
      ["2", "4"],
    ],
    xValues: ["", ""],
    functionExpr: "",
    intervalStart: "",
    intervalEnd: "",
    nodeStrategy: "equally_spaced",
    nodeCount: 3,
    methods: ["lagrange"],
    precision: 50,
    exact: true,
    evaluationX: [],
    graph: false,
    derivatives: [],
    taylorCenter: "0",
    taylorOrder: 3,
    splineBoundaryCondition: "natural",
    ...overrides,
  }
}

describe("InputPanel — Method Configuration card", () => {
  it("hides the Method Configuration section when no Phase 2 method is selected", () => {
    render(<InputPanel form={makeForm()} onChange={vi.fn()} />)

    // The card heading is the canonical signal for the section's
    // presence; if the section is absent its adaptive blocks
    // (Derivative Data table, Taylor Configuration, Cubic Spline
    // Configuration) cannot render either.
    expect(screen.queryByText("Method Configuration")).toBeNull()
    // The Method Selector renders a "Derivative Data" *family*
    // heading and per-method role-tag spans regardless of which
    // methods are selected, so a bare `queryByText("Derivative
    // Data")` would match those Method-Selector nodes. The
    // adaptive `DerivativeInputTable` is the only one that renders
    // a `<h3>Derivative Data</h3>` *inside* the Method
    // Configuration card; if the card is hidden, no such heading
    // exists in the document at all.
    const sectionHeading = screen.queryByRole("heading", {
      name: "Method Configuration",
    })
    expect(sectionHeading).toBeNull()
    expect(screen.queryByText("Taylor Configuration")).toBeNull()
    expect(screen.queryByText("Cubic Spline Configuration")).toBeNull()
  })

  it.each([
    ["newton_forward"],
    ["newton_backward"],
    ["stirling"],
  ] as const)(
    "renders the Equal-Spacing hint when %s is selected",
    (method) => {
      render(
        <InputPanel
          form={makeForm({ methods: [method] })}
          onChange={vi.fn()}
        />,
      )

      expect(screen.getByText("Method Configuration")).toBeInTheDocument()
      // The EqualSpacingHint renders one of two body-voice messages
      // depending on `assessEqualSpacing(["1", "2"])`. Both are
      // acceptable here — we only need to confirm the block mounted.
      const hint = screen.queryByText(/Spacing appears equal/i) ??
        screen.queryByText(/Spacing not equal/i)
      expect(hint).not.toBeNull()
    },
  )

  it.each([
    ["hermite_divided_difference"],
    ["hermite"],
    ["osculating"],
  ] as const)(
    "renders the Derivative Data table when %s is selected",
    (method) => {
      render(
        <InputPanel
          form={makeForm({ methods: [method] })}
          onChange={vi.fn()}
        />,
      )

      // Scope inside the Method Configuration section so the family
      // heading rendered by `MethodSelector` (which also reads
      // "Derivative Data") cannot collide with the adaptive
      // `DerivativeInputTable`'s heading.
      const configHeading = screen.getByRole("heading", {
        name: "Method Configuration",
      })
      const section = configHeading.closest("section")
      expect(section).not.toBeNull()
      expect(
        within(section!).getByRole("heading", { name: "Derivative Data" }),
      ).toBeInTheDocument()
    },
  )

  it("renders the Taylor configuration block when taylor is selected", () => {
    render(
      <InputPanel
        form={makeForm({
          mode: "x_values_with_function",
          methods: ["taylor"],
          xValues: ["0", "1"],
          functionExpr: "cos(x)",
        })}
        onChange={vi.fn()}
      />,
    )

    expect(screen.getByText("Method Configuration")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Taylor Configuration" }),
    ).toBeInTheDocument()
  })

  it("renders the Cubic Spline configuration block when cubic_spline is selected", () => {
    render(
      <InputPanel
        form={makeForm({ methods: ["cubic_spline"] })}
        onChange={vi.fn()}
      />,
    )

    expect(screen.getByText("Method Configuration")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Cubic Spline Configuration" }),
    ).toBeInTheDocument()
  })

  it("stacks Method Configuration blocks vertically below the md breakpoint", () => {
    // Select every Phase 2 method so all four adaptive blocks mount
    // inside the same Method Configuration body. The implementation
    // uses Tailwind's `space-y-5` utility on the body wrapper to
    // place the blocks in a single column with vertical rhythm —
    // there is no `grid` or `flex-row` wrapper, so blocks stack
    // naturally on narrow widths (R14.2).
    render(
      <InputPanel
        form={makeForm({
          mode: "x_values_with_function",
          methods: [
            "newton_forward",
            "hermite_divided_difference",
            "taylor",
            "cubic_spline",
          ],
          xValues: ["1", "2", "3"],
          functionExpr: "cos(x)",
        })}
        onChange={vi.fn()}
      />,
    )

    const heading = screen.getByText("Method Configuration")
    // Section header → section root → body div is the second child.
    const sectionRoot = heading.closest("section")
    expect(sectionRoot).not.toBeNull()
    const body = sectionRoot!.querySelector(".space-y-5")
    expect(body).not.toBeNull()
    expect(body).toHaveClass("space-y-5")
    // Sanity: the body holds all four adaptive blocks as direct
    // children, so they stack vertically.
    expect(body!.children.length).toBe(4)
  })
})
