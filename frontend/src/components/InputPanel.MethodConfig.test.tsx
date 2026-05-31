import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { InputPanel, type FormState } from "@/components/InputPanel"
import { buildRequest } from "@/lib/interpolate-request"

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
    osculatingOrders: [],
    taylorCenter: "0",
    taylorOrder: 3,
    splineBoundaryCondition: "natural",
    splineLeftDerivative: "",
    splineRightDerivative: "",
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

  it("renders order-aware osculating controls and manual derivative value inputs in points mode", () => {
    render(
      <InputPanel
        form={makeForm({
          methods: ["osculating"],
          osculatingOrders: [
            { x: "1", order: 2 },
            { x: "2", order: 1 },
          ],
          derivatives: [
            { x: "1", order: 1, value: "10" },
            { x: "1", order: 2, value: "20" },
            { x: "2", order: 1, value: "30" },
          ],
        })}
        onChange={vi.fn()}
      />,
    )

    expect(
      screen.getByRole("heading", { name: "Osculating Derivative Orders" }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Maximum derivative order for node 0")).toHaveValue(2)
    expect(screen.getByLabelText("Maximum derivative order for node 1")).toHaveValue(1)
    expect(screen.getByLabelText("Derivative order 1 for node 0")).toHaveValue("10")
    expect(screen.getByLabelText("Derivative order 2 for node 0")).toHaveValue("20")
    expect(screen.getByLabelText("Derivative order 1 for node 1")).toHaveValue("30")
  })

  it("does not render manual osculating derivative value inputs in function-backed mode", () => {
    render(
      <InputPanel
        form={makeForm({
          mode: "x_values_with_function",
          xValues: ["0", "1"],
          functionExpr: "exp(x)",
          methods: ["osculating"],
          osculatingOrders: [
            { x: "0", order: 2 },
            { x: "1", order: 1 },
          ],
        })}
        onChange={vi.fn()}
      />,
    )

    expect(screen.getByLabelText("Maximum derivative order for node 0")).toHaveValue(2)
    expect(screen.getByLabelText("Maximum derivative order for node 1")).toHaveValue(1)
    expect(screen.queryByLabelText("Derivative order 1 for node 0")).toBeNull()
    expect(screen.queryByLabelText("Derivative order 2 for node 0")).toBeNull()
    expect(
      screen.getByText(/backend derives derivative values from f\(x\)/i),
    ).toBeInTheDocument()
  })

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

  it("enables implemented spline boundary modes and renders clamped derivative fields", () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <InputPanel
        form={makeForm({ methods: ["cubic_spline"] })}
        onChange={onChange}
      />,
    )

    const selector = screen.getByRole("combobox", { name: "Boundary Condition" })
    expect(within(selector).getByRole("option", { name: "Natural" })).not.toBeDisabled()
    expect(within(selector).getByRole("option", { name: "Clamped" })).not.toBeDisabled()
    expect(within(selector).getByRole("option", { name: "Not-a-Knot" })).not.toBeDisabled()
    expect(within(selector).getByRole("option", { name: "Periodic" })).not.toBeDisabled()

    fireEvent.change(selector, { target: { value: "clamped" } })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ splineBoundaryCondition: "clamped" }),
    )

    rerender(
      <InputPanel
        form={makeForm({
          methods: ["cubic_spline"],
          splineBoundaryCondition: "clamped",
          splineLeftDerivative: "0",
          splineRightDerivative: "4",
        })}
        onChange={onChange}
      />,
    )

    expect(screen.getByLabelText("Left endpoint derivative")).toHaveValue("0")
    expect(screen.getByLabelText("Right endpoint derivative")).toHaveValue("4")
  })

  it("builds osculating and clamped spline method options without coercing numeric strings", () => {
    const request = buildRequest(
      makeForm({
        methods: ["osculating", "cubic_spline"],
        points: [
          ["0", "1"],
          ["1", "2"],
        ],
        osculatingOrders: [
          { x: "stale", order: 2 },
          { x: "stale", order: 1 },
        ],
        derivatives: [
          { x: "0", order: 1, value: "3/2" },
          { x: "0", order: 2, value: "5.25" },
          { x: "1", order: 1, value: "7" },
        ],
        splineBoundaryCondition: "clamped",
        splineLeftDerivative: "3/2",
        splineRightDerivative: "7",
      }),
    )

    expect(request.method_options?.osculating?.orders).toEqual([
      { x: "0", order: 2 },
      { x: "1", order: 1 },
    ])
    expect(request.method_options?.cubic_spline).toEqual({
      boundary_condition: "clamped",
      left_derivative: "3/2",
      right_derivative: "7",
    })
    expect(request.derivatives).toEqual([
      { x: "0", order: 1, value: "3/2" },
      { x: "0", order: 2, value: "5.25" },
      { x: "1", order: 1, value: "7" },
    ])
  })

  it("builds function-backed osculating requests without manual derivative values", () => {
    const request = buildRequest(
      makeForm({
        mode: "x_values_with_function",
        xValues: ["0", "1"],
        functionExpr: "exp(x)",
        methods: ["osculating"],
        osculatingOrders: [
          { x: "0", order: 2 },
          { x: "1", order: 0 },
        ],
        derivatives: [{ x: "0", order: 1, value: "999" }],
      }),
    )

    expect(request.method_options?.osculating?.orders).toEqual([
      { x: "0", order: 2 },
      { x: "1", order: 0 },
    ])
    expect(request.derivatives).toBeUndefined()
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
            "osculating",
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
    // Sanity: the body holds all adaptive blocks as direct
    // children, so they stack vertically.
    expect(body!.children.length).toBe(5)
  })
})
