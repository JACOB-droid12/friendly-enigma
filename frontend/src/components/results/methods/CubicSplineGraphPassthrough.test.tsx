import { render, screen } from "@testing-library/react"
import type React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { DisplayDigitsProvider } from "@/lib/display-digits"
import { cubicSplineResponse } from "@/test/interpolate-response.fixtures"
import { GraphCard } from "@/components/results/GraphCard"

/**
 * Tests for the Piecewise Family graph pass-through per design.md §9.4 and
 * §12.2 (R9.4, R15.3). The renderer under test is `GraphCard`, the same
 * shared chart used by V1 methods, exercised here against the cubic-spline
 * fixture.
 *
 * Recharts does not produce a meaningful SVG layout under jsdom, so this
 * spec verifies pass-through by reading the props handed to each Recharts
 * component rather than parsing the rendered SVG. A thin `vi.mock("recharts",
 * ...)` substitutes a tiny React component for every named export the
 * `GraphCard` imports; each substitute records its props on a hoisted
 * `captured` store and renders a `data-testid` sentinel so DOM-level
 * presence checks remain available. Because `vi.mock` is hoisted by
 * Vitest above all imports, the static `GraphCard` import above resolves
 * against the mocked `recharts` module.
 *
 * The captured props for `ComposedChart` carry the chart's `data` array,
 * which is the only place where graph arrays could be mutated on the
 * client. The assertions confirm that for each entry, `x` and `P_x` are
 * the `parseFloat` of the backend strings at the same index and that
 * `f_x` / `error` stay `undefined` for the all-null fixture columns. This
 * proves the renderer never recomputes any graph value (R6.6, R9.6).
 */

interface CapturedProps {
  ResponsiveContainer: Array<Record<string, unknown>>
  ComposedChart: Array<Record<string, unknown>>
  Line: Array<Record<string, unknown>>
  XAxis: Array<Record<string, unknown>>
  YAxis: Array<Record<string, unknown>>
  CartesianGrid: Array<Record<string, unknown>>
  Tooltip: Array<Record<string, unknown>>
  Legend: Array<Record<string, unknown>>
  Scatter: Array<Record<string, unknown>>
  Brush: Array<Record<string, unknown>>
}

const captured = vi.hoisted<CapturedProps>(() => ({
  ResponsiveContainer: [],
  ComposedChart: [],
  Line: [],
  XAxis: [],
  YAxis: [],
  CartesianGrid: [],
  Tooltip: [],
  Legend: [],
  Scatter: [],
  Brush: [],
}))

vi.mock("recharts", async () => {
  const React = await import("react")

  const make = (name: keyof CapturedProps, passChildren: boolean) => {
    const Component = (props: Record<string, unknown>) => {
      captured[name].push(props)
      return React.createElement(
        "div",
        { "data-testid": `recharts-${name}` },
        passChildren ? (props.children as React.ReactNode) : null,
      )
    }
    Component.displayName = `MockRecharts_${name}`
    return Component
  }

  return {
    ResponsiveContainer: make("ResponsiveContainer", true),
    ComposedChart: make("ComposedChart", true),
    Line: make("Line", false),
    XAxis: make("XAxis", false),
    YAxis: make("YAxis", false),
    CartesianGrid: make("CartesianGrid", false),
    Tooltip: make("Tooltip", false),
    Legend: make("Legend", false),
    Scatter: make("Scatter", false),
    Brush: make("Brush", false),
  }
})

function renderWithDisplay(ui: React.ReactElement) {
  return render(<DisplayDigitsProvider>{ui}</DisplayDigitsProvider>)
}

beforeEach(() => {
  // Reset captured props between specs so each test reads only its own
  // render. The hoisted store is shared across all tests in the file.
  for (const key of Object.keys(captured) as Array<keyof CapturedProps>) {
    captured[key].length = 0
  }
})

describe("GraphCard cubic-spline pass-through", () => {
  it("renders the cubic_spline source-method Badge using the friendly label", () => {
    const graphData = cubicSplineResponse.graph_data!
    renderWithDisplay(
      <GraphCard graphData={graphData} nodes={cubicSplineResponse.nodes} />,
    )

    // The Badge previously rendered the raw backend `source_method`
    // string under a CSS `capitalize` utility (so `cubic_spline` showed
    // up as "Cubic_spline"). It now routes through `methodLabel`, which
    // resolves the canonical method label "Cubic Spline" via the
    // method-metadata registry. The raw snake_case string must never
    // reach the rendered DOM.
    expect(screen.getByText("Cubic Spline")).toBeInTheDocument()
    expect(screen.queryByText(/cubic_spline/i)).toBeNull()
  })

  it("mounts the ComposedChart region (Recharts mock sentinel present)", () => {
    const graphData = cubicSplineResponse.graph_data!
    renderWithDisplay(
      <GraphCard graphData={graphData} nodes={cubicSplineResponse.nodes} />,
    )

    // The mocked `ComposedChart` renders a `<div data-testid="recharts-
    // ComposedChart">` sentinel, proving the chart region exists without
    // depending on Recharts SVG output (which is unreliable under jsdom).
    expect(screen.getByTestId("recharts-ComposedChart")).toBeInTheDocument()
  })

  it("passes graph_data.x, graph_data.f_x, graph_data.P_x to ComposedChart unmutated", () => {
    const graphData = cubicSplineResponse.graph_data!
    renderWithDisplay(
      <GraphCard graphData={graphData} nodes={cubicSplineResponse.nodes} />,
    )

    // The fixture has no errors and no f(x) samples, so the renderer
    // must never mount the secondary error ComposedChart. The main
    // ComposedChart may, however, be rendered more than once for the
    // same mount — `GraphCard` calls `setTokens(readGraphTokens())`
    // from inside a `useEffect` on mount (see `useGraphTokens`), which
    // schedules a second pass once the DOM has been read for CSS
    // custom properties. Both passes carry identical, unmutated chart
    // data, so this spec asserts:
    //   1. at least one ComposedChart render was captured;
    //   2. every captured render carries a `Brush` child (the main
    //      chart's brush — the secondary error chart does not include
    //      one), proving no error chart was mounted; and
    //   3. the most recent captured `data` array is the unmutated
    //      `parseFloat` mapping of the backend strings.
    expect(captured.ComposedChart.length).toBeGreaterThanOrEqual(1)

    // Every ComposedChart capture must carry a Brush descendant so we
    // know each capture is the main chart (the error chart never
    // mounts a Brush). Counting Brush captures relative to
    // ComposedChart captures gives a structural pass-through check
    // independent of the captured `data` array.
    expect(captured.Brush.length).toBe(captured.ComposedChart.length)

    const chartProps = captured.ComposedChart[
      captured.ComposedChart.length - 1
    ] as { data: unknown }
    expect(Array.isArray(chartProps.data)).toBe(true)
    const data = chartProps.data as Array<{
      x: number
      f_x?: number
      P_x?: number
      error?: number
    }>

    // The fixture's `graph_data.x` has 5 non-null entries; the renderer
    // filters out null/NaN entries via `parseFloat` and `isNaN`, so the
    // chart data array length must match the count of non-null backend
    // entries one-to-one.
    const nonNullXCount = graphData.x.filter((s): s is string => s !== null).length
    expect(nonNullXCount).toBe(5)
    expect(data).toHaveLength(nonNullXCount)

    // Mirror only `parseFloat` (the renderer's own string→number step)
    // when verifying pass-through. The test does NOT recompute any
    // graph value, evaluate spline polynomials, or interpret rational
    // strings; it only confirms each chart entry equals the parseFloat
    // of the backend string at the same index.
    data.forEach((entry, i) => {
      const xStr = graphData.x[i]
      const pxStr = graphData.P_x[i]
      expect(xStr).not.toBeNull()
      expect(pxStr).not.toBeNull()
      expect(entry.x).toBe(parseFloat(xStr as string))
      expect(entry.P_x).toBe(parseFloat(pxStr as string))
      // The cubic-spline fixture's `f_x` and `error` columns are all
      // null, so the renderer must never populate those keys on chart
      // entries. This guards against accidental client-side fallbacks
      // (R6.6, R9.6).
      expect(entry.f_x).toBeUndefined()
      expect(entry.error).toBeUndefined()
    })
  })
})
