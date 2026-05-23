import { useState, lazy, Suspense } from "react"
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import type { InterpolateResponse } from "@/lib/api-types"
import { SummaryCard } from "./results/SummaryCard"
import { EvaluationTable } from "./results/EvaluationTable"
import { MethodDetails } from "./results/MethodDetails"
import { NodesTable } from "./results/NodesTable"
import { EducationalNotes } from "./results/EducationalNotes"
import { WarningsDisplay } from "./WarningsDisplay"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DisplayDigitsControl } from "@/components/DisplayDigitsControl"
import { AlertTriangle, BookOpen, LineChart, Table2, FunctionSquare, FlaskConical } from "lucide-react"

/**
 * GraphCard pulls in recharts, the largest dependency on the page (~80 kB
 * gzipped). Lazy-loading defers the cost until the user opens the Graph
 * tab. Users who never request graph output never download recharts.
 */
const GraphCard = lazy(() =>
  import("./results/GraphCard").then((m) => ({ default: m.GraphCard })),
)

/**
 * PolynomialCard is the only consumer of KatexDisplay (and therefore the
 * only consumer of katex). Lazy-loading defers katex's JS bundle until the
 * user opens the Polynomial tab. The Overview tab is the default landing,
 * so this saves the cost on first paint for every user.
 */
const PolynomialCard = lazy(() =>
  import("./results/PolynomialCard").then((m) => ({ default: m.PolynomialCard })),
)

interface ResultsPanelProps {
  data: InterpolateResponse
}

type ResultTab = "overview" | "polynomial" | "evaluations" | "graph" | "methods" | "notes"

const TAB_CONFIG: { id: ResultTab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" /> },
  { id: "polynomial", label: "Polynomial", icon: <FunctionSquare className="h-3.5 w-3.5" aria-hidden="true" /> },
  { id: "evaluations", label: "Evaluations", icon: <Table2 className="h-3.5 w-3.5" aria-hidden="true" /> },
  { id: "graph", label: "Graph", icon: <LineChart className="h-3.5 w-3.5" aria-hidden="true" /> },
  { id: "methods", label: "Methods", icon: <BookOpen className="h-3.5 w-3.5" aria-hidden="true" /> },
  { id: "notes", label: "Notes", icon: <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> },
]

export function ResultsPanel({ data }: ResultsPanelProps) {
  const [activeTab, setActiveTab] = useState<ResultTab>("overview")

  const hasEvaluations = data.evaluations.length > 0
  const hasGraph = data.graph_data !== null
  const warningCount = data.warnings.length

  return (
    <TabsPrimitive.Root value={activeTab} onValueChange={(v) => setActiveTab(v as ResultTab)}>
      <div className="space-y-4">
        {/* Persistent warning bar: warnings are pedagogical and never hidden behind a tab. */}
        {warningCount > 0 && activeTab !== "notes" && (
          <button
            type="button"
            onClick={() => setActiveTab("notes")}
            className="w-full flex items-center justify-between gap-3 rounded-lg bg-warning/5 ring-1 ring-inset ring-warning/20 px-4 py-2 text-left transition-subtle hover:bg-warning/10 outline-none focus-visible:ring-3 focus-visible:ring-warning/40 animate-in-results"
            aria-label={`${warningCount} warning${warningCount > 1 ? "s" : ""}, view in Notes tab`}
          >
            <span className="flex items-center gap-2.5">
              <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" aria-hidden="true" />
              <span className="font-label text-warning">Warnings</span>
              <span className="text-xs text-warning-foreground">
                {warningCount} pedagogical {warningCount === 1 ? "notice" : "notices"} from the backend
              </span>
            </span>
            <span className="text-[11px] text-muted-foreground">View in Notes</span>
          </button>
        )}

        {/* Sticky tab nav + display precision control. Sticks under the page header.
         * Uses a solid surface (not backdrop-blur) to honor the no-glassmorphism rule. */}
        <div
          className="sticky z-[5] -mx-1 px-1 py-1 bg-background border-b border-transparent"
          style={{ top: "var(--header-h, 60px)" }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3">
            <TabsPrimitive.List
              aria-label="Results sections"
              className="flex items-center gap-1 overflow-x-auto py-1 rounded-xl"
            >
              {TAB_CONFIG.map((tab) => {
                const isActive = activeTab === tab.id
                const isDisabled =
                  (tab.id === "evaluations" && !hasEvaluations) ||
                  (tab.id === "graph" && !hasGraph)

                return (
                  <TabsPrimitive.Tab
                    key={tab.id}
                    value={tab.id}
                    disabled={isDisabled}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-subtle outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : isDisabled
                        ? "text-muted-foreground/60 cursor-not-allowed"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                    {tab.id === "notes" && warningCount > 0 && (
                      <Badge variant="warning" className="text-[9px] h-4 px-1 ml-0.5">
                        {warningCount}
                      </Badge>
                    )}
                  </TabsPrimitive.Tab>
                )
              })}
            </TabsPrimitive.List>
            <DisplayDigitsControl className="self-start md:self-auto" />
          </div>
        </div>

        {/* Tab Panels */}
        <TabsPrimitive.Panel value="overview" className="outline-none">
          <div className="space-y-5">
            <SummaryCard data={data} />
            <NodesTable nodes={data.nodes} />
          </div>
        </TabsPrimitive.Panel>

        <TabsPrimitive.Panel value="polynomial" className="outline-none">
          <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
            <PolynomialCard polynomial={data.polynomial} />
          </Suspense>
        </TabsPrimitive.Panel>

        {hasEvaluations && (
          <TabsPrimitive.Panel value="evaluations" className="outline-none">
            <EvaluationTable
              evaluations={data.evaluations}
              methodsRequested={data.input_summary.methods_requested}
            />
          </TabsPrimitive.Panel>
        )}

        {hasGraph && (
          <TabsPrimitive.Panel value="graph" className="outline-none">
            <Suspense fallback={<Skeleton className="h-80 w-full rounded-xl" />}>
              <GraphCard graphData={data.graph_data!} nodes={data.nodes} />
            </Suspense>
          </TabsPrimitive.Panel>
        )}

        <TabsPrimitive.Panel value="methods" className="outline-none">
          <MethodDetails data={data} />
        </TabsPrimitive.Panel>

        <TabsPrimitive.Panel value="notes" className="outline-none">
          <div className="space-y-5">
            {warningCount > 0 && <WarningsDisplay warnings={data.warnings} />}
            <EducationalNotes notes={data.educational_notes} />
          </div>
        </TabsPrimitive.Panel>
      </div>
    </TabsPrimitive.Root>
  )
}
