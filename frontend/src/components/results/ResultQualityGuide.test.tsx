import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import type { InterpolateResponse } from "@/lib/api-types"
import { linearPointsResponse, oneOverXResponse } from "@/test/interpolate-response.fixtures"
import { ResultQualityGuide } from "./ResultQualityGuide"

describe("ResultQualityGuide", () => {
  it("renders a calm no-warning trust state", () => {
    render(<ResultQualityGuide data={linearPointsResponse} />)

    expect(screen.getByRole("heading", { name: "Result Quality" })).toBeInTheDocument()
    expect(screen.getByText("Trust this result?")).toBeInTheDocument()
    expect(screen.getByText("No backend warnings were reported.")).toBeInTheDocument()
    expect(screen.getByText("Review the polynomial, method tables, and evaluations before presenting.")).toBeInTheDocument()
  })

  it("renders warning message, code, meaning, and next check guidance", () => {
    const warningResponse: InterpolateResponse = {
      ...linearPointsResponse,
      warnings: [
        {
          code: "high_degree_warning",
          message: "High-degree interpolation can oscillate between nodes.",
          details: { degree: 12 },
        },
      ],
    }

    render(<ResultQualityGuide data={warningResponse} />)

    const warning = screen.getByRole("status", { name: "High Degree warning quality note" })
    expect(within(warning).getByText("High-degree interpolation can oscillate between nodes.")).toBeInTheDocument()
    expect(within(warning).getByText("high_degree_warning")).toBeInTheDocument()
    expect(within(warning).getByText(/The backend is warning that many nodes can make/i)).toBeInTheDocument()
    expect(within(warning).getByText(/Check the graph shape/i)).toBeInTheDocument()
  })

  it("explains function values and absolute errors when the backend provides them", () => {
    render(<ResultQualityGuide data={oneOverXResponse} />)

    expect(screen.getByText("Evaluation comparison")).toBeInTheDocument()
    expect(screen.getByText("P(3) = 29/88")).toBeInTheDocument()
    expect(screen.getByText("f(3) = 1/3")).toBeInTheDocument()
    expect(screen.getByText("|error| = 1/264")).toBeInTheDocument()
    expect(screen.getByText(/compare the interpolating polynomial against the original function/i)).toBeInTheDocument()
  })

  it("explains that graph samples are backend-provided", () => {
    render(<ResultQualityGuide data={linearPointsResponse} />)

    expect(screen.getByText("Graph quality note")).toBeInTheDocument()
    expect(screen.getByText("barycentric")).toBeInTheDocument()
    expect(screen.getByText(/The graph is rendered from backend-provided samples only/i)).toBeInTheDocument()
  })
})
