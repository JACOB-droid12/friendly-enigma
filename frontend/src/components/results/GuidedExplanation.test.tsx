import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import type { InterpolateResponse } from "@/lib/api-types"
import { linearPointsResponse, oneOverXResponse } from "@/test/interpolate-response.fixtures"
import { GuidedExplanation } from "./GuidedExplanation"

describe("GuidedExplanation", () => {
  it("renders the linear Lagrange lecture example from backend response fields", () => {
    render(<GuidedExplanation data={linearPointsResponse} />)

    expect(screen.getByRole("heading", { name: "Guided Explanation" })).toBeInTheDocument()
    expect(screen.getByText("points mode")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("6 - x")).toBeInTheDocument()
    expect(screen.getByText("P(3) = 3")).toBeInTheDocument()

    expect(screen.getByRole("heading", { name: "Lagrange" })).toBeInTheDocument()
    expect(screen.getAllByText(/basis polynomials/i).length).toBeGreaterThan(0)
    expect(screen.getByRole("heading", { name: "Newton" })).toBeInTheDocument()
    expect(screen.getByText(/divided-difference table/i)).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Neville" })).toBeInTheDocument()
    expect(screen.getByText(/recursive table/i)).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Barycentric" })).toBeInTheDocument()
    expect(screen.getByText(/stable numerical evaluation and graph support/i)).toBeInTheDocument()

    expect(screen.getByRole("heading", { name: "How to present this result" })).toBeInTheDocument()
  })

  it("renders the f(x)=1/x fixture without recomputing expected values", () => {
    render(<GuidedExplanation data={oneOverXResponse} />)

    expect(screen.getByText("x-values with a function")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getAllByText("P(3) = 29/88").length).toBeGreaterThan(0)
    expect(screen.getAllByText("f(3) = 1/3").length).toBeGreaterThan(0)
    expect(screen.getAllByText("|error| = 1/264").length).toBeGreaterThan(0)
  })

  it("renders backend warnings in the defense notes", () => {
    const warningResponse: InterpolateResponse = {
      ...linearPointsResponse,
      warnings: [
        {
          code: "high_degree",
          message: "High-degree interpolation can oscillate between nodes.",
          details: { degree: 12 },
        },
      ],
    }

    render(<GuidedExplanation data={warningResponse} />)

    const quality = screen.getByRole("status", { name: "high_degree warning quality note" })
    expect(within(quality).getAllByText("high_degree").length).toBeGreaterThan(0)
    expect(within(quality).getByText("High-degree interpolation can oscillate between nodes.")).toBeInTheDocument()
  })
})
