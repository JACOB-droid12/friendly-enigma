import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { DisplayDigitsProvider } from "@/lib/display-digits"
import type { InterpolateResponse, MethodName } from "@/lib/api-types"
import { EvaluationTable } from "./EvaluationTable"
import { GraphCard } from "./GraphCard"
import { MethodDetails } from "./MethodDetails"
import { PolynomialCard } from "./PolynomialCard"
import { linearPointsResponse, oneOverXResponse } from "@/test/interpolate-response.fixtures"

function renderWithDisplay(ui: React.ReactElement) {
  return render(<DisplayDigitsProvider>{ui}</DisplayDigitsProvider>)
}

function responseWithOnlyMethod(
  response: InterpolateResponse,
  method: MethodName,
): InterpolateResponse {
  return {
    ...response,
    input_summary: {
      ...response.input_summary,
      methods_requested: [method],
    },
    methods: {
      [method]: response.methods[method],
    },
  } as InterpolateResponse
}

describe("interpolation result smoke rendering", () => {
  it("renders the linear points example polynomial and P(3)", () => {
    const { container } = renderWithDisplay(<PolynomialCard polynomial={linearPointsResponse.polynomial} />)
    expect(container.querySelector('[role="math"][aria-label="6 - x"]')).not.toBeNull()

    renderWithDisplay(
      <EvaluationTable
        evaluations={linearPointsResponse.evaluations}
        methodsRequested={linearPointsResponse.input_summary.methods_requested}
      />,
    )
    expect(screen.getByText("Best P(x)")).toBeInTheDocument()
    expect(screen.getAllByText("3").length).toBeGreaterThan(0)
  })

  it("renders backend Lagrange basis entries from the basis field", () => {
    renderWithDisplay(<MethodDetails data={responseWithOnlyMethod(linearPointsResponse, "lagrange")} />)

    expect(screen.getByText("Basis Polynomials")).toBeInTheDocument()
    expect(screen.getByText("5/3 - x/3")).toBeInTheDocument()
    expect(screen.getByText("x/3 - 2/3")).toBeInTheDocument()
  })

  it("renders the f(x)=1/x lecture example evaluation", () => {
    renderWithDisplay(
      <EvaluationTable
        evaluations={oneOverXResponse.evaluations}
        methodsRequested={oneOverXResponse.input_summary.methods_requested}
      />,
    )

    expect(screen.getAllByText("29/88").length).toBeGreaterThan(0)
    expect(screen.getByText("1/3")).toBeInTheDocument()
    expect(screen.getByText("1/264")).toBeInTheDocument()
  })

  it("renders Newton divided differences", () => {
    renderWithDisplay(<MethodDetails data={responseWithOnlyMethod(linearPointsResponse, "newton")} />)

    expect(screen.getByText("Divided-Difference Table")).toBeInTheDocument()
    expect(screen.getByText("-1")).toBeInTheDocument()
  })

  it("renders Neville triangular tables", () => {
    renderWithDisplay(<MethodDetails data={responseWithOnlyMethod(oneOverXResponse, "neville")} />)

    expect(screen.getByText(/Neville Table for x =/)).toBeInTheDocument()
    expect(screen.getAllByText("29/88").length).toBeGreaterThan(0)
  })

  it("renders barycentric weights", () => {
    renderWithDisplay(<MethodDetails data={responseWithOnlyMethod(linearPointsResponse, "barycentric")} />)

    expect(screen.getByText("Barycentric Weights")).toBeInTheDocument()
    expect(screen.getByText("-1/3")).toBeInTheDocument()
    expect(screen.getAllByText("1/3").length).toBeGreaterThan(0)
  })

  it("renders graph data supplied by the backend response", () => {
    renderWithDisplay(
      <GraphCard
        graphData={linearPointsResponse.graph_data!}
        nodes={linearPointsResponse.nodes}
      />,
    )

    expect(screen.getByRole("region", { name: /Interpolation graph/i })).toBeInTheDocument()
    expect(screen.getAllByText("barycentric").length).toBeGreaterThan(0)
  })
})
