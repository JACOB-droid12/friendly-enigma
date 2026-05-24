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
})
