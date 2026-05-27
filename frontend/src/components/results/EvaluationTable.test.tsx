import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { DisplayDigitsProvider } from "@/lib/display-digits"
import { EvaluationTable } from "./EvaluationTable"

function renderTable() {
  return render(
    <DisplayDigitsProvider>
      <EvaluationTable
        methodsRequested={["barycentric"]}
        evaluations={[
          {
            x: "3",
            best_P_x: "29/88",
            best_method: "barycentric",
            method_values: { barycentric: "29/88" },
            f_x: "1/3",
            absolute_error: "1/264",
            warnings: [],
          },
        ]}
      />
    </DisplayDigitsProvider>,
  )
}

describe("EvaluationTable", () => {
  it("adds best-method rationale as a compact help affordance", () => {
    renderTable()

    const methodBadge = screen.getByLabelText(
      "Barycentric. Stable evaluator; avoids rebuilding the polynomial at each x.",
    )

    expect(methodBadge).toHaveAttribute(
      "title",
      "Stable evaluator; avoids rebuilding the polynomial at each x.",
    )
  })
})
