import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { HealthIndicator } from "@/components/HealthIndicator"
import { ErrorNotice } from "@/components/ErrorNotice"
import { InputPanel, type FormState } from "@/components/InputPanel"
import { ResultsPanel } from "@/components/ResultsPanel"
import { ExamplesPanel } from "@/components/ExamplesPanel"
import { ThemeToggle } from "@/components/ThemeToggle"
import { interpolate, validateFunction, ApiError } from "@/lib/api-client"
import type { InterpolateResponse, MethodName } from "@/lib/api-types"
import { DisplayDigitsProvider } from "@/lib/display-digits"
import { assessEqualSpacing } from "@/lib/equal-spacing"
import { buildRequest } from "@/lib/interpolate-request"
import { useShortcuts } from "@/lib/use-shortcuts"
import { AlertTriangle, Play, RotateCcw, HelpCircle, X, Keyboard, Loader2 } from "lucide-react"

const DEFAULT_FORM: FormState = {
  mode: "points",
  points: [["", ""], ["", ""]],
  xValues: ["", ""],
  functionExpr: "",
  intervalStart: "",
  intervalEnd: "",
  nodeStrategy: "equally_spaced",
  nodeCount: 3,
  methods: ["lagrange", "newton"],
  precision: 50,
  exact: true,
  evaluationX: [],
  graph: false,
  derivatives: [],
  osculatingOrders: [],
  taylorCenter: "0",
  taylorOrder: 3,
  splineBoundaryCondition: "natural",
  splineLeftDerivative: "",
  splineRightDerivative: "",
}

export default function App() {
  return (
    <DisplayDigitsProvider>
      <AppShell />
    </DisplayDigitsProvider>
  )
}

function AppShell() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [result, setResult] = useState<InterpolateResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [topError, setTopError] = useState<{ code?: string; message: string } | null>(null)
  const [functionError, setFunctionError] = useState<{ code?: string; message: string } | null>(null)
  const [validationSuccess, setValidationSuccess] = useState<string | null>(null)
  const [backendOnline, setBackendOnline] = useState(false)
  const [showQuickRef, setShowQuickRef] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [tabHotkey, setTabHotkey] = useState<{ index: number; tick: number }>({ index: 1, tick: 0 })

  const validateDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (form.mode === "points" || !form.functionExpr.trim()) {
      return
    }

    if (validateDebounceRef.current) {
      clearTimeout(validateDebounceRef.current)
    }

    validateDebounceRef.current = setTimeout(async () => {
      try {
        const response = await validateFunction({ function: form.functionExpr })
        setFunctionError(null)
        setValidationSuccess(`Valid: ${response.normalized_expression}`)
      } catch (err) {
        if (err instanceof ApiError) {
          setFunctionError({ code: err.code, message: err.message })
        }
        setValidationSuccess(null)
      }
    }, 800)

    return () => {
      if (validateDebounceRef.current) {
        clearTimeout(validateDebounceRef.current)
      }
    }
  }, [form.functionExpr, form.mode])

  const inlineErrors = useMemo(() => {
    const errors: string[] = []

    if (form.mode === "points") {
      const xVals = form.points.map((p) => p[0].trim()).filter((v) => v !== "")
      const duplicates = xVals.filter((v, i) => xVals.indexOf(v) !== i)
      if (duplicates.length > 0) {
        errors.push(`Duplicate x-value: ${[...new Set(duplicates)].join(", ")}`)
      }
    } else if (form.mode === "x_values_with_function") {
      const xVals = form.xValues.map((v) => v.trim()).filter((v) => v !== "")
      const duplicates = xVals.filter((v, i) => xVals.indexOf(v) !== i)
      if (duplicates.length > 0) {
        errors.push(`Duplicate x-value: ${[...new Set(duplicates)].join(", ")}`)
      }
    }

    return errors
  }, [form.mode, form.points, form.xValues])

  const handleCompute = useCallback(async () => {
    setLoading(true)
    setTopError(null)
    setFunctionError(null)
    setValidationSuccess(null)

    try {
      const request = buildRequest(form)
      const response = await interpolate(request)
      setResult(response)
    } catch (err) {
      if (err instanceof ApiError) {
        const code = err.code
        if (
          (code === "unsafe_expression" || code === "function_domain_error") &&
          form.mode !== "points"
        ) {
          setFunctionError({ code, message: err.message })
        } else {
          setTopError({ code: err.code, message: err.message })
        }
      } else {
        setTopError({
          message: err instanceof Error ? err.message : "An unexpected error occurred",
        })
      }
      setResult(null)
    } finally {
      setLoading(false)
    }
  }, [form])

  const handleReset = useCallback(() => {
    setForm(DEFAULT_FORM)
    setResult(null)
    setTopError(null)
    setFunctionError(null)
    setValidationSuccess(null)
  }, [])

  const handleLoadExample = useCallback((partial: Partial<FormState>) => {
    setForm({ ...DEFAULT_FORM, ...partial })
    setResult(null)
    setTopError(null)
    setFunctionError(null)
    setValidationSuccess(null)
  }, [])

  // Page-level keyboard shortcuts (see lib/use-shortcuts.ts).
  useShortcuts({
    onCompute: backendOnline ? handleCompute : undefined,
    onReset: handleReset,
    onToggleHelp: () => setShowQuickRef((s) => !s),
    onResultTab: result
      ? (index) => setTabHotkey((prev) => ({ index, tick: prev.tick + 1 }))
      : undefined,
    disabled: loading,
  })

  const isNodeCountBlocked =
    form.mode === "function_interval" &&
    Number.isFinite(form.nodeCount) &&
    (form.nodeCount < 2 || form.nodeCount > 50)

  // Equal-Spacing ineligibility gate (R4.5, R5.2; design.md §7.1).
  // Compute is blocked only when EVERY selected method is in the
  // Equal-Spacing Family AND the user-entered x-values do not
  // appear equally spaced. When at least one selected method is
  // not Equal-Spacing, Compute stays enabled — the backend remains
  // the authority for the non-equal-spacing methods.
  const equalSpacingIneligible = useMemo(() => {
    // Empty methods list cannot be "all" Equal-Spacing.
    if (form.methods.length === 0) return null
    const equalSpacingMethods: ReadonlyArray<MethodName> = [
      "newton_forward",
      "newton_backward",
      "stirling",
    ]
    const allEqualSpacing = form.methods.every((m) =>
      equalSpacingMethods.includes(m),
    )
    if (!allEqualSpacing) return null

    // function_interval mode: synthesized x-values aren't meaningful
    // here; let the backend authority decide. Return null so we don't
    // gate Compute.
    if (form.mode === "function_interval") return null

    const xs =
      form.mode === "points"
        ? form.points.map((p) => p[0]).filter((s) => s.trim() !== "")
        : form.xValues.filter((s) => s.trim() !== "")

    const verdict = assessEqualSpacing(xs)
    return verdict.equallySpaced ? null : verdict.reason ?? "ineligible"
  }, [form.methods, form.mode, form.points, form.xValues])

  const isFormBlocked = isNodeCountBlocked || equalSpacingIneligible !== null

  const computeDisabledReason = !backendOnline
    ? "Backend offline"
    : loading
    ? "Computing"
    : isNodeCountBlocked
    ? "Node count out of range (2\u201350)"
    : equalSpacingIneligible !== null
    ? `Equal-spacing methods need equally spaced x-values: ${equalSpacingIneligible}`
    : undefined

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 ring-1 ring-primary/15 shrink-0">
              <span className="font-math text-xl font-semibold italic text-primary">P</span>
            </div>
            <div className="min-w-0">
              <h1 className="font-math text-[1.25rem] font-semibold leading-tight tracking-tight text-foreground">
                Polynomial Interpolation
              </h1>
              <p className="text-[11px] text-muted-foreground tracking-wide mt-0.5 hidden sm:block">
                Lagrange · Newton · Barycentric · Neville
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ShortcutsDialog
              open={showShortcuts}
              onOpenChange={setShowShortcuts}
            />
            <button
              type="button"
              onClick={() => setShowQuickRef((s) => !s)}
              className="lg:hidden flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-subtle outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              aria-label="Toggle quick reference"
              aria-expanded={showQuickRef}
            >
              <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Reference</span>
            </button>
            <ThemeToggle />
            <HealthIndicator onStatusChange={setBackendOnline} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1100px] mx-auto px-6 py-8">
        {/* Examples Panel */}
        <div className="mb-8">
          <ExamplesPanel
            onLoadExample={handleLoadExample}
          />
        </div>

        {/* Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6">
          {/* Left: Input Configuration */}
          <div className="space-y-6">
            <InputPanel
              form={form}
              onChange={setForm}
              functionError={functionError}
              validationSuccess={validationSuccess}
            />

            {/* Inline Validation Warnings */}
            {inlineErrors.length > 0 && (
              <div className="space-y-2">
                {inlineErrors.map((err, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 text-xs bg-warning/5 ring-1 ring-inset ring-warning/20 rounded-lg px-4 py-2.5"
                    role="alert"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" aria-hidden="true" />
                    <span className="text-warning-foreground">{err}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Action Bar + offline status */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleCompute}
                  disabled={loading || !backendOnline || isFormBlocked}
                  aria-disabled={loading || !backendOnline || isFormBlocked}
                  aria-describedby={!backendOnline ? "compute-status" : undefined}
                  title={computeDisabledReason}
                  size="lg"
                  className="gap-2"
                  aria-keyshortcuts="Control+Enter Meta+Enter"
                >
                  {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {loading ? "Computing\u2026" : "Compute"}
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleReset}
                  disabled={loading}
                  className="gap-2 text-muted-foreground"
                  aria-keyshortcuts="Alt+R"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  Reset
                </Button>

                <span className="hidden md:inline text-[11px] text-muted-foreground ml-auto">
                  <kbd className="font-numeric text-[10px] px-1.5 py-0.5 rounded bg-muted">Ctrl/Cmd + Enter</kbd>
                  {" "}to compute
                </span>
              </div>

              {/* Inline status: visible affordance for "why is Compute dimmed?".
               * Pairs with aria-describedby on the Compute button so screen readers
               * announce the reason on focus rather than relying on the native
               * `title` tooltip, which AT and touch users do not see. */}
              {!backendOnline && (
                <p
                  id="compute-status"
                  role="status"
                  className="flex items-start gap-2 text-xs text-muted-foreground animate-in-results"
                >
                  <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    <span className="text-foreground font-medium">Backend offline.</span>{" "}
                    Compute is unavailable until the API responds. The header indicator updates every 30 s.
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Right: Contextual Panel */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-4">
              <QuickReferenceCard />
            </div>
          </aside>
        </div>

        {/* Mobile/Tablet Quick Reference (collapsible) */}
        {showQuickRef && (
          <div className="lg:hidden mt-6 relative animate-in-results">
            <button
              type="button"
              onClick={() => setShowQuickRef(false)}
              className="absolute top-3 right-3 p-1 rounded text-muted-foreground hover:text-foreground transition-subtle z-10"
              aria-label="Close quick reference"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
            <QuickReferenceCard />
          </div>
        )}

        {/* Error Display */}
        {topError && (
          <div className="mt-6 animate-in-results">
            <ErrorNotice
              code={topError.code}
              message={topError.message}
              severity="error"
              layout="block"
            />
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="mt-8 space-y-4" aria-live="polite">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="mt-8 animate-in-results">
            <Separator className="mb-6" />
            <ResultsPanel
              data={result}
              tabHotkeyIndex={tabHotkey.index}
              tabHotkeyTick={tabHotkey.tick}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-6 text-center text-xs text-muted-foreground">
        <span className="font-numeric">v0.1.0</span>{" "}
        · Computed by SymPy and mpmath at your chosen precision
      </footer>
    </div>
  )
}

function ShortcutsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Trigger
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-subtle outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label="Keyboard shortcuts"
        title="Keyboard shortcuts (?)"
      >
        <Keyboard className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Shortcuts</span>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-30 bg-foreground/10" />
        <DialogPrimitive.Popup
          className="fixed left-1/2 top-24 z-40 -translate-x-1/2 w-[min(420px,calc(100vw-2rem))] rounded-xl border bg-card p-5 shadow-sm outline-none"
        >
          <div className="flex items-center justify-between mb-3">
            <DialogPrimitive.Title className="text-sm font-semibold text-foreground">
              Keyboard Shortcuts
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              className="p-1 rounded text-muted-foreground hover:text-foreground transition-subtle outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              aria-label="Close"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>
          <dl className="space-y-2 text-xs">
            <ShortcutRow keys={["Ctrl/Cmd", "Enter"]} description="Compute" />
            <ShortcutRow keys={["Alt", "R"]} description="Reset form" />
            <ShortcutRow keys={["?"]} description="Toggle quick reference" />
            <ShortcutRow keys={["1", "to", "7"]} description="Switch result tab" />
            <ShortcutRow keys={["Esc"]} description="Close this overlay" />
          </dl>
          <DialogPrimitive.Description className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
            Shortcuts work from anywhere on the page. Compute also fires from inside any input.
          </DialogPrimitive.Description>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function ShortcutRow({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-foreground">{description}</span>
      <span className="flex items-center gap-1">
        {keys.map((k, i) => (
          <kbd
            key={i}
            className="font-numeric text-[10px] px-1.5 py-0.5 rounded bg-muted text-foreground"
          >
            {k}
          </kbd>
        ))}
      </span>
    </div>
  )
}

function QuickReferenceCard() {
  return (
    <div className="rounded-xl ring-1 ring-foreground/10 bg-card p-4 space-y-3 text-[11px]">
      <div className="flex items-center gap-2 text-xs font-medium text-foreground">
        <HelpCircle className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        Quick Reference
      </div>
      <div className="space-y-2 text-muted-foreground leading-relaxed">
        <p>
          <strong className="text-foreground font-medium">Points:</strong> Enter (x&#x1D62;, y&#x1D62;) pairs.
        </p>
        <p>
          <strong className="text-foreground font-medium">Function:</strong> f(x) + x-values; backend evaluates y&#x1D62;.
        </p>
        <p>
          <strong className="text-foreground font-medium">Interval:</strong> f(x), [a, b], node strategy.
        </p>
      </div>
      <Separator />
      <div className="space-y-1.5 text-muted-foreground">
        <p className="font-medium text-foreground text-[11px]">Allowed functions:</p>
        <p className="font-numeric text-[10px] leading-relaxed">
          sin cos tan exp log ln sqrt abs asin acos atan sinh cosh tanh &#x3C0; e
        </p>
      </div>
      <Separator />
      <div className="space-y-1.5 text-muted-foreground">
        <p className="font-medium text-foreground text-[11px]">Example:</p>
        <p className="font-numeric text-[10px]">(2, 4), (5, 1) &#x2192; P(x) = 6 &#x2212; x</p>
        <p className="font-numeric text-[10px]">P(3) = 3</p>
      </div>
    </div>
  )
}
