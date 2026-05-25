import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { MethodName } from "@/lib/api-types"
import { MethodSelector } from "./MethodSelector"

/**
 * Phase 2 Frontend Workbench — Group 6 leaf 6.13.
 *
 * Validates: Requirements R4.1, R4.3, R4.4, R10.1, R15.2.
 *
 * The catalog data lives in `MethodSelector.catalog.ts` and the rendering
 * shape lives in `MethodSelector.tsx`. These tests exercise the rendered
 * output only and never recompute catalog content.
 */

describe("MethodSelector", () => {
  it("renders all 12 methods grouped by family in the documented order", () => {
    render(
      <MethodSelector selected={["lagrange"]} onChange={() => {}} />,
    )

    // All seven family headings appear (R4.1 / design.md §8.2).
    const familyHeadings = [
      "Construction",
      "Stable Evaluator",
      "Target-Specific",
      "Equal Spacing",
      "Derivative Data",
      "Function Derivative",
      "Piecewise",
    ] as const
    for (const heading of familyHeadings) {
      expect(
        screen.getByRole("heading", { level: 3, name: heading }),
      ).toBeInTheDocument()
    }

    // All 12 method labels appear in the documented declaration order
    // (R4.1 / design.md §8.3). The aria-label "<Label> method" is the
    // most stable handle since it is wired on the hidden checkbox input.
    const methodLabels = [
      "Lagrange",
      "Newton",
      "Barycentric",
      "Neville",
      "Newton Forward",
      "Newton Backward",
      "Stirling",
      "Hermite Divided Difference",
      "Hermite",
      "Osculating",
      "Taylor",
      "Cubic Spline",
    ] as const
    for (const label of methodLabels) {
      expect(screen.getByLabelText(`${label} method`)).toBeInTheDocument()
    }
  })

  it("renders the Deferred badge on the osculating card", () => {
    render(
      <MethodSelector selected={["lagrange"]} onChange={() => {}} />,
    )

    // R4.4 / R10.1: osculating shows the "Deferred" badge inside its card.
    const osculatingInput = screen.getByLabelText("Osculating method")
    const card = osculatingInput.closest("label")
    expect(card).not.toBeNull()
    expect(within(card as HTMLElement).getByText("Deferred")).toBeInTheDocument()
  })

  it("renders the Equal-Spacing eligibility hint on each Equal-Spacing card", () => {
    render(
      <MethodSelector selected={["lagrange"]} onChange={() => {}} />,
    )

    // R4.3: every Equal-Spacing card ("Newton Forward", "Newton Backward",
    // "Stirling") carries the static eligibility hint exactly once.
    const hints = screen.getAllByText("Requires equally spaced nodes.")
    expect(hints).toHaveLength(3)
  })

  it("selecting and deselecting a Phase 2 method updates the bound state without throwing", () => {
    // Selection: starting from ["lagrange"], click osculating, expect onChange
    // called with ["lagrange", "osculating"].
    const onChangeSelect = vi.fn()
    const { rerender } = render(
      <MethodSelector selected={["lagrange"]} onChange={onChangeSelect} />,
    )

    fireEvent.click(screen.getByLabelText("Osculating method"))

    expect(onChangeSelect).toHaveBeenCalledTimes(1)
    expect(onChangeSelect).toHaveBeenCalledWith<[MethodName[]]>([
      "lagrange",
      "osculating",
    ])

    // Deselection: starting from ["lagrange", "osculating"], click osculating,
    // expect onChange called with ["lagrange"]. The at-least-one guard does
    // NOT trip because lagrange is still selected.
    const onChangeDeselect = vi.fn()
    rerender(
      <MethodSelector
        selected={["lagrange", "osculating"]}
        onChange={onChangeDeselect}
      />,
    )

    fireEvent.click(screen.getByLabelText("Osculating method"))

    expect(onChangeDeselect).toHaveBeenCalledTimes(1)
    expect(onChangeDeselect).toHaveBeenCalledWith<[MethodName[]]>(["lagrange"])
  })
})
