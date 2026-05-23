import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Scatter,
  ComposedChart,
  Brush,
} from "recharts"
import type { GraphData, NodeEntry } from "@/lib/api-types"
import { useDisplayDigits } from "@/lib/display-digits"
import { roundNumericString } from "@/lib/format-numeric"

interface GraphCardProps {
  graphData: GraphData
  nodes: NodeEntry[]
}

interface ChartPoint {
  x: number
  f_x?: number
  P_x?: number
  error?: number
  isNode?: boolean
  nodeLabel?: string
}

interface TooltipPayloadEntry {
  dataKey: string
  name: string
  value: number | string | undefined
  color: string
  payload: ChartPoint & { nodeY?: number }
}

/** Tokens this chart pulls from CSS custom properties. Names mirror index.css. */
const GRAPH_TOKEN_NAMES = [
  "--graph-fx",
  "--graph-px",
  "--graph-node",
  "--graph-error",
  "--graph-brush-stroke",
  "--graph-brush-fill",
] as const

type GraphTokenName = (typeof GRAPH_TOKEN_NAMES)[number]
type GraphTokens = Record<GraphTokenName, string>

const FALLBACK_TOKENS: GraphTokens = {
  "--graph-fx": "oklch(0.55 0.15 260)",
  "--graph-px": "oklch(0.65 0.18 45)",
  "--graph-node": "oklch(0.55 0.2 25)",
  "--graph-error": "oklch(0.55 0.2 25)",
  "--graph-brush-stroke": "oklch(0.4 0.12 260)",
  "--graph-brush-fill": "oklch(0.96 0.008 250)",
}

function readGraphTokens(): GraphTokens {
  if (typeof document === "undefined") return FALLBACK_TOKENS
  const styles = getComputedStyle(document.documentElement)
  const out = { ...FALLBACK_TOKENS }
  for (const name of GRAPH_TOKEN_NAMES) {
    const v = styles.getPropertyValue(name).trim()
    if (v) out[name] = v
  }
  return out
}

/**
 * Resolve graph color tokens from CSS custom properties and re-resolve when
 * the theme changes. Recharts accepts arbitrary CSS color strings for stroke
 * and fill, but it does not evaluate `var(--...)` itself, so we resolve to
 * concrete OKLCH strings at render time.
 *
 * The theme observer watches for class changes on `<html>` (the `dark` class
 * toggle from `applyToDom` in lib/use-theme.ts) and for OS color-scheme
 * changes when the user is in "system" mode.
 */
function useGraphTokens(): GraphTokens {
  const [tokens, setTokens] = useState<GraphTokens>(() => readGraphTokens())

  useEffect(() => {
    if (typeof document === "undefined") return
    const refresh = () => setTokens(readGraphTokens())
    refresh()

    const root = document.documentElement
    const classObserver = new MutationObserver(refresh)
    classObserver.observe(root, { attributes: true, attributeFilter: ["class", "data-theme"] })

    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    mq.addEventListener("change", refresh)

    return () => {
      classObserver.disconnect()
      mq.removeEventListener("change", refresh)
    }
  }, [])

  return tokens
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: number | string
}) {
  const { digits } = useDisplayDigits()
  if (!active || !payload || payload.length === 0) return null

  const fmt = (v: number) => roundNumericString(String(v), digits)
  const nodeEntry = payload.find((p) => p.dataKey === "nodeY")

  return (
    <div className="rounded-lg border bg-card p-2.5 shadow-sm text-[11px] font-numeric space-y-1">
      <p className="text-muted-foreground">x = {typeof label === "number" ? fmt(label) : label}</p>
      {nodeEntry && nodeEntry.value !== undefined && (
        <p className="text-destructive font-medium">
          Node: ({fmt(nodeEntry.payload.x)},{" "}
          {typeof nodeEntry.value === "number" ? fmt(nodeEntry.value) : nodeEntry.value})
        </p>
      )}
      {payload
        .filter((p) => p.dataKey !== "nodeY")
        .map((entry) => (
          <p key={entry.dataKey} style={{ color: entry.color }}>
            {entry.name}:{" "}
            {typeof entry.value === "number"
              ? entry.dataKey === "error"
                ? entry.value.toExponential(4)
                : fmt(entry.value)
              : String(entry.value)}
          </p>
        ))}
    </div>
  )
}

export function GraphCard({ graphData, nodes }: GraphCardProps) {
  const tokens = useGraphTokens()

  const chartData: ChartPoint[] = graphData.x
    .map((xStr, i) => {
      if (xStr === null) return null
      const x = parseFloat(xStr)
      if (isNaN(x)) return null

      const point: ChartPoint = { x }

      const fxStr = graphData.f_x[i]
      if (fxStr !== null) {
        const fxVal = parseFloat(fxStr)
        if (!isNaN(fxVal)) point.f_x = fxVal
      }

      const pxStr = graphData.P_x[i]
      if (pxStr !== null) {
        const pxVal = parseFloat(pxStr)
        if (!isNaN(pxVal)) point.P_x = pxVal
      }

      const errStr = graphData.error[i]
      if (errStr !== null) {
        const errVal = parseFloat(errStr)
        if (!isNaN(errVal)) point.error = errVal
      }

      return point
    })
    .filter((p): p is ChartPoint => p !== null)

  const nodePoints = nodes
    .map((n) => ({
      x: parseFloat(n.x),
      nodeY: parseFloat(n.y),
      isNode: true,
      nodeLabel: `(${n.x}, ${n.y})`,
    }))
    .filter((p) => !isNaN(p.x) && !isNaN(p.nodeY))

  const hasOriginalFunction = chartData.some((p) => p.f_x !== undefined)
  const hasError = chartData.some((p) => p.error !== undefined && p.error !== 0)

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Graph</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Interpolation vs. original function</p>
        </div>
        <Badge variant="secondary" className="text-[10px] font-numeric capitalize">
          {graphData.source_method}
        </Badge>
      </div>
      <div className="p-5 space-y-6">
        {/* Main chart */}
        <div role="region" aria-label="Interpolation graph. Drag the handles below the chart to zoom into a region.">
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey="x"
                type="number"
                domain={["dataMin", "dataMax"]}
                tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Cascadia Code', monospace" }}
              />
              <YAxis tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Cascadia Code', monospace" }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {hasOriginalFunction && (
                <Line
                  type="monotone"
                  dataKey="f_x"
                  name="f(x)"
                  stroke={tokens["--graph-fx"]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />
              )}
              <Line
                type="monotone"
                dataKey="P_x"
                name="P(x)"
                stroke={tokens["--graph-px"]}
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
              <Scatter
                data={nodePoints}
                dataKey="nodeY"
                name="Nodes"
                fill={tokens["--graph-node"]}
              />
              <Brush
                dataKey="x"
                height={24}
                stroke={tokens["--graph-brush-stroke"]}
                fill={tokens["--graph-brush-fill"]}
                travellerWidth={8}
                aria-label="Drag handles to zoom into a region of the graph"
              />
            </ComposedChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-muted-foreground mt-1 text-center" aria-hidden="true">
            Drag the brush below the chart to zoom into a region
          </p>
        </div>

        {/* Error chart */}
        {hasError && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Approximation Error |f(x) − P(x)|
            </p>
            <ResponsiveContainer width="100%" height={160}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="x"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Cascadia Code', monospace" }}
                />
                <YAxis tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Cascadia Code', monospace" }} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="error"
                  name="|error|"
                  stroke={tokens["--graph-error"]}
                  strokeWidth={1.5}
                  dot={false}
                  connectNulls={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
