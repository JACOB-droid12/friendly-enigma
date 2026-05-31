import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Switch } from "./switch"

describe("Switch", () => {
  it("labels the visible switch without rendering a hidden native input", () => {
    const { container } = render(<Switch aria-label="Graph output" checked={false} />)

    expect(screen.getByRole("switch", { name: "Graph output" })).toBeInTheDocument()
    expect(container.querySelector('input[type="checkbox"]')).toBeNull()
  })
})
