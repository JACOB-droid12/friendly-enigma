import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import App from "./App"

function okJson(body: unknown) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(body),
  } as Response)
}

function renderApp() {
  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = input.toString()
    if (url === "/health") {
      return okJson({ status: "ok", service: "interpolation-backend", version: "test" })
    }
    return okJson({ status: "ok", normalized_expression: "1/x", latex: "\\frac{1}{x}", allowed_symbols: [] })
  })

  vi.stubGlobal("fetch", fetchMock)
  render(<App />)

  return fetchMock
}

/**
 * Open the "Lecture Catalog" disclosure. Quick Start renders 4
 * curriculum cards on first paint; the rest live behind a
 * "Show ... more lecture examples" button. Catalog tests open the
 * disclosure first so their target buttons are mounted.
 */
function openCatalog() {
  fireEvent.click(
    screen.getByRole("button", { name: /show \d+ more lecture examples/i }),
  )
}

describe("lecture examples", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("loads the linear Lagrange lecture example without computing", async () => {
    const fetchMock = renderApp()

    fireEvent.click(screen.getByRole("button", { name: /load linear lagrange example/i }))

    expect(screen.getByLabelText("Point 0 x-value")).toHaveValue("2")
    expect(screen.getByLabelText("Point 0 y-value")).toHaveValue("4")
    expect(screen.getByLabelText("Point 1 x-value")).toHaveValue("5")
    expect(screen.getByLabelText("Point 1 y-value")).toHaveValue("1")
    expect(screen.getByLabelText("Evaluation target 1")).toHaveValue("3")
    expect(screen.getByLabelText("Lagrange method")).toBeChecked()
    expect(screen.getByLabelText("Newton method")).not.toBeChecked()

    expect(fetchMock.mock.calls.some(([url]) => url === "/api/interpolate")).toBe(false)
  })

  it("loads the reciprocal second-degree Lagrange example into X plus function mode", () => {
    renderApp()

    fireEvent.click(screen.getByRole("button", { name: /load second-degree lagrange example/i }))

    expect(screen.getByRole("tab", { name: "X + f(x)" })).toHaveAttribute("data-active")
    expect(screen.getByLabelText("Function f(x)")).toHaveValue("1/x")
    expect(screen.getByLabelText("X-value 0")).toHaveValue("2")
    expect(screen.getByLabelText("X-value 1")).toHaveValue("2.75")
    expect(screen.getByLabelText("X-value 2")).toHaveValue("4")
    expect(screen.getByLabelText("Evaluation target 1")).toHaveValue("3")
    expect(screen.getByLabelText("Lagrange method")).toBeChecked()
    expect(screen.getByLabelText("Newton method")).not.toBeChecked()
    expect(screen.getByLabelText("Neville method")).not.toBeChecked()
  })

  it("loads the Neville table example with the five lecture points", () => {
    renderApp()

    openCatalog()
    fireEvent.click(screen.getByRole("button", { name: /load neville table example/i }))

    expect(screen.getByLabelText("Point 0 x-value")).toHaveValue("1.0")
    expect(screen.getByLabelText("Point 0 y-value")).toHaveValue("0.7651977")
    expect(screen.getByLabelText("Point 4 x-value")).toHaveValue("2.2")
    expect(screen.getByLabelText("Point 4 y-value")).toHaveValue("0.1103623")
    expect(screen.getByLabelText("Evaluation target 1")).toHaveValue("1.5")
    expect(screen.getByLabelText("Neville method")).toBeChecked()
    expect(screen.getByLabelText("Lagrange method")).toBeChecked()
    expect(screen.getByLabelText("Newton method")).toBeChecked()
  })

  it("loads the Newton Forward equal-spacing example with cos(x) on five nodes", () => {
    const fetchMock = renderApp()

    openCatalog()
    fireEvent.click(
      screen.getByRole("button", {
        name: /load newton forward \(cos x at 1\.0 to 2\.2\) example/i,
      }),
    )

    expect(screen.getByRole("tab", { name: "X + f(x)" })).toHaveAttribute("data-active")
    expect(screen.getByLabelText("Function f(x)")).toHaveValue("cos(x)")
    expect(screen.getByLabelText("X-value 0")).toHaveValue("1.0")
    expect(screen.getByLabelText("X-value 1")).toHaveValue("1.3")
    expect(screen.getByLabelText("X-value 2")).toHaveValue("1.6")
    expect(screen.getByLabelText("X-value 3")).toHaveValue("1.9")
    expect(screen.getByLabelText("X-value 4")).toHaveValue("2.2")
    expect(screen.getByLabelText("Evaluation target 1")).toHaveValue("1.5")
    expect(screen.getByLabelText("Newton Forward method")).toBeChecked()
    expect(screen.getByLabelText("Lagrange method")).not.toBeChecked()
    expect(screen.getByLabelText("Newton method")).not.toBeChecked()

    expect(fetchMock.mock.calls.some(([url]) => url === "/api/interpolate")).toBe(false)
  })

  it("loads the Newton Backward equal-spacing example with cos(x) on five nodes", () => {
    const fetchMock = renderApp()

    openCatalog()
    fireEvent.click(
      screen.getByRole("button", { name: /load newton backward \(cos x\) example/i }),
    )

    expect(screen.getByRole("tab", { name: "X + f(x)" })).toHaveAttribute("data-active")
    expect(screen.getByLabelText("Function f(x)")).toHaveValue("cos(x)")
    expect(screen.getByLabelText("X-value 0")).toHaveValue("1.0")
    expect(screen.getByLabelText("X-value 4")).toHaveValue("2.2")
    expect(screen.getByLabelText("Evaluation target 1")).toHaveValue("1.5")
    expect(screen.getByLabelText("Newton Backward method")).toBeChecked()
    expect(screen.getByLabelText("Lagrange method")).not.toBeChecked()
    expect(screen.getByLabelText("Newton method")).not.toBeChecked()

    expect(fetchMock.mock.calls.some(([url]) => url === "/api/interpolate")).toBe(false)
  })

  it("loads the Stirling centered example with cos(x) on five nodes", () => {
    const fetchMock = renderApp()

    openCatalog()
    fireEvent.click(
      screen.getByRole("button", { name: /load stirling \(cos x, centered\) example/i }),
    )

    expect(screen.getByRole("tab", { name: "X + f(x)" })).toHaveAttribute("data-active")
    expect(screen.getByLabelText("Function f(x)")).toHaveValue("cos(x)")
    expect(screen.getByLabelText("X-value 0")).toHaveValue("1.0")
    expect(screen.getByLabelText("X-value 2")).toHaveValue("1.6")
    expect(screen.getByLabelText("X-value 4")).toHaveValue("2.2")
    expect(screen.getByLabelText("Evaluation target 1")).toHaveValue("1.5")
    expect(screen.getByLabelText("Stirling method")).toBeChecked()
    expect(screen.getByLabelText("Lagrange method")).not.toBeChecked()
    expect(screen.getByLabelText("Newton method")).not.toBeChecked()

    expect(fetchMock.mock.calls.some(([url]) => url === "/api/interpolate")).toBe(false)
  })

  it("loads the Hermite divided-difference Bessel-style example with derivative rows", () => {
    const fetchMock = renderApp()

    openCatalog()
    fireEvent.click(
      screen.getByRole("button", {
        name: /load hermite divided difference \(bessel-style\) example/i,
      }),
    )

    expect(screen.getByLabelText("Point 0 x-value")).toHaveValue("1.3")
    expect(screen.getByLabelText("Point 0 y-value")).toHaveValue("0.6200860")
    expect(screen.getByLabelText("Point 1 x-value")).toHaveValue("1.6")
    expect(screen.getByLabelText("Point 1 y-value")).toHaveValue("0.4554022")
    expect(screen.getByLabelText("Point 2 x-value")).toHaveValue("1.9")
    expect(screen.getByLabelText("Point 2 y-value")).toHaveValue("0.2818186")
    expect(screen.getByLabelText("Evaluation target 1")).toHaveValue("1.5")
    expect(screen.getByLabelText("Hermite Divided Difference method")).toBeChecked()
    expect(screen.getByLabelText("Hermite method")).not.toBeChecked()
    expect(screen.getByLabelText("Lagrange method")).not.toBeChecked()
    expect(screen.getByLabelText("Newton method")).not.toBeChecked()

    expect(screen.getByLabelText("Derivative value for node 0")).toHaveValue(
      "-0.52202324741466",
    )
    expect(screen.getByLabelText("Derivative value for node 1")).toHaveValue(
      "-0.56989593526168",
    )
    expect(screen.getByLabelText("Derivative value for node 2")).toHaveValue(
      "-0.581157072713434",
    )

    expect(fetchMock.mock.calls.some(([url]) => url === "/api/interpolate")).toBe(false)
  })

  it("loads the Hermite basis-form Bessel-style example with the same derivative rows", () => {
    const fetchMock = renderApp()

    openCatalog()
    fireEvent.click(
      screen.getByRole("button", { name: /load hermite \(basis form\) example/i }),
    )

    expect(screen.getByLabelText("Point 0 x-value")).toHaveValue("1.3")
    expect(screen.getByLabelText("Point 1 x-value")).toHaveValue("1.6")
    expect(screen.getByLabelText("Point 2 x-value")).toHaveValue("1.9")
    expect(screen.getByLabelText("Evaluation target 1")).toHaveValue("1.5")
    expect(screen.getByLabelText("Hermite method")).toBeChecked()
    expect(screen.getByLabelText("Hermite Divided Difference method")).not.toBeChecked()
    expect(screen.getByLabelText("Lagrange method")).not.toBeChecked()

    expect(screen.getByLabelText("Derivative value for node 0")).toHaveValue(
      "-0.52202324741466",
    )
    expect(screen.getByLabelText("Derivative value for node 1")).toHaveValue(
      "-0.56989593526168",
    )
    expect(screen.getByLabelText("Derivative value for node 2")).toHaveValue(
      "-0.581157072713434",
    )

    expect(fetchMock.mock.calls.some(([url]) => url === "/api/interpolate")).toBe(false)
  })

  it("loads the Taylor cos(x) order-3 example with center 0 and target 1/2", () => {
    const fetchMock = renderApp()

    openCatalog()
    fireEvent.click(
      screen.getByRole("button", { name: /load taylor \(cos x, order 3\) example/i }),
    )

    expect(screen.getByRole("tab", { name: "X + f(x)" })).toHaveAttribute("data-active")
    expect(screen.getByLabelText("Function f(x)")).toHaveValue("cos(x)")
    expect(screen.getByLabelText("X-value 0")).toHaveValue("0")
    expect(screen.getByLabelText("X-value 1")).toHaveValue("1")
    expect(screen.getByLabelText("Taylor method")).toBeChecked()
    expect(screen.getByLabelText("Lagrange method")).not.toBeChecked()
    expect(screen.getByLabelText("Newton method")).not.toBeChecked()

    expect(screen.getByLabelText("Taylor center")).toHaveValue("0")
    expect(screen.getByLabelText("Order")).toHaveValue(3)
    expect(screen.getByLabelText("Evaluation target 1")).toHaveValue("1/2")

    expect(fetchMock.mock.calls.some(([url]) => url === "/api/interpolate")).toBe(false)
  })

  it("loads the lecture three-point cubic spline example with natural boundary and graph on", () => {
    const fetchMock = renderApp()

    fireEvent.click(
      screen.getByRole("button", { name: /load cubic spline \(lecture three-point\) example/i }),
    )

    expect(screen.getByLabelText("Point 0 x-value")).toHaveValue("1")
    expect(screen.getByLabelText("Point 0 y-value")).toHaveValue("2")
    expect(screen.getByLabelText("Point 1 x-value")).toHaveValue("2")
    expect(screen.getByLabelText("Point 1 y-value")).toHaveValue("3")
    expect(screen.getByLabelText("Point 2 x-value")).toHaveValue("3")
    expect(screen.getByLabelText("Point 2 y-value")).toHaveValue("5")
    expect(screen.getByLabelText("Cubic Spline method")).toBeChecked()
    expect(screen.getByLabelText("Lagrange method")).not.toBeChecked()
    expect(screen.getByLabelText("Newton method")).not.toBeChecked()

    expect(screen.getByLabelText("Boundary Condition")).toHaveValue("natural")
    expect(screen.getByLabelText("Evaluation target 1")).toHaveValue("5/2")
    expect(screen.getByRole("switch", { name: /graph output/i })).toBeChecked()

    expect(fetchMock.mock.calls.some(([url]) => url === "/api/interpolate")).toBe(false)
  })

  it("loads the implemented Osculating Bessel-style example with order-aware derivative rows", () => {
    const fetchMock = renderApp()

    openCatalog()
    fireEvent.click(
      screen.getByRole("button", {
        name: /load osculating \(bessel-style\) example/i,
      }),
    )

    expect(screen.getByLabelText("Point 0 x-value")).toHaveValue("1.3")
    expect(screen.getByLabelText("Point 0 y-value")).toHaveValue("0.6200860")
    expect(screen.getByLabelText("Point 1 x-value")).toHaveValue("1.6")
    expect(screen.getByLabelText("Point 2 x-value")).toHaveValue("1.9")
    expect(screen.getByLabelText("Point 2 y-value")).toHaveValue("0.2818186")
    expect(screen.getByLabelText("Evaluation target 1")).toHaveValue("1.5")
    expect(screen.getByLabelText("Osculating method")).toBeChecked()
    expect(screen.getByLabelText("Hermite method")).not.toBeChecked()
    expect(screen.getByLabelText("Hermite Divided Difference method")).not.toBeChecked()
    expect(screen.getByLabelText("Lagrange method")).not.toBeChecked()
    expect(screen.getByLabelText("Newton method")).not.toBeChecked()

    expect(screen.getByLabelText("Maximum derivative order for node 0")).toHaveValue(1)
    expect(screen.getByLabelText("Maximum derivative order for node 1")).toHaveValue(1)
    expect(screen.getByLabelText("Maximum derivative order for node 2")).toHaveValue(1)
    expect(screen.getByLabelText("Derivative order 1 for node 0")).toHaveValue(
      "-0.52202324741466",
    )
    expect(screen.getByLabelText("Derivative order 1 for node 1")).toHaveValue(
      "-0.56989593526168",
    )
    expect(screen.getByLabelText("Derivative order 1 for node 2")).toHaveValue(
      "-0.581157072713434",
    )

    expect(fetchMock.mock.calls.some(([url]) => url === "/api/interpolate")).toBe(false)
  })
})
