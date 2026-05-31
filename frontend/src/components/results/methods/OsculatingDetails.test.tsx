import { render, screen } from "@testing-library/react"
import type React from "react"
import { describe, expect, it } from "vitest"
import { MethodDetails } from "@/components/results/MethodDetails"
import { DisplayDigitsProvider } from "@/lib/display-digits"
import { osculatingSuccessResponse } from "@/test/interpolate-response.fixtures"
import OsculatingDetails from "./OsculatingDetails"

function renderWithDisplay(ui: React.ReactElement) {
  return render(<DisplayDigitsProvider>{ui}</DisplayDigitsProvider>)
}

describe("OsculatingDetails", () => {
  it("renders orders, repeated nodes, confluent table, polynomial forms, and evaluations", () => {
    const result = osculatingSuccessResponse.methods.osculating!
    const { container } = renderWithDisplay(<OsculatingDetails result={result} />)

    expect(screen.getByRole("heading", { name: "Osculating Orders" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Repeated Nodes" })).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Confluent Divided-Difference Table" }),
    ).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Coefficients" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Newton Nested Form" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Expanded" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Evaluations" })).toBeInTheDocument()

    expect(screen.getByText("max order")).toBeInTheDocument()
    expect(screen.getByText("derivative order")).toBeInTheDocument()
    expect(screen.getByText("P(1/2) = 41/16")).toBeInTheDocument()

    expect(screen.getByRole("heading", { name: "Expanded (LaTeX)" })).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Osculating Form (LaTeX)" }),
    ).toBeInTheDocument()
    expect(container.querySelector('[role="math"]')).not.toBeNull()
  })
})

describe("MethodDetails", () => {
  it("routes osculating responses to the real osculating renderer", () => {
    renderWithDisplay(<MethodDetails data={osculatingSuccessResponse} />)

    expect(screen.getByText(/^osculating$/i)).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Osculating Orders" })).toBeInTheDocument()
    expect(screen.queryByText("Deferred")).not.toBeInTheDocument()
  })
})
