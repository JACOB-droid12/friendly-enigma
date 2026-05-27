import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { DisplayDigitsProvider } from "@/lib/display-digits"
import { DisplayDigitsControl } from "./DisplayDigitsControl"

function renderControl() {
  return render(
    <DisplayDigitsProvider>
      <DisplayDigitsControl />
    </DisplayDigitsProvider>,
  )
}

describe("DisplayDigitsControl", () => {
  it("labels the Base UI radio group and options through stable visible label ids", () => {
    renderControl()

    const group = screen.getByRole("radiogroup", { name: "Display precision" })
    const labelledBy = group.getAttribute("aria-labelledby")
    expect(labelledBy).toBeTruthy()
    const groupIds = labelledBy?.split(" ") ?? []
    expect(groupIds).toHaveLength(2)
    expect(screen.getByText("Display")).toHaveAttribute("id", groupIds[0])

    for (const label of ["6", "12", "25", "Full"]) {
      const radio = screen.getByRole("radio", { name: label })
      const optionId = radio.getAttribute("aria-labelledby")
      expect(optionId).toBeTruthy()
      expect(screen.getByText(label)).toHaveAttribute("id", optionId)
    }
  })

  it("uses unique labels when multiple controls are mounted", () => {
    render(
      <DisplayDigitsProvider>
        <DisplayDigitsControl />
        <DisplayDigitsControl />
      </DisplayDigitsProvider>,
    )

    const groups = screen.getAllByRole("radiogroup", { name: "Display precision" })
    expect(groups[0]).not.toHaveAttribute(
      "aria-labelledby",
      groups[1].getAttribute("aria-labelledby") ?? "",
    )
  })
})
