import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { KatexDisplay } from "@/components/KatexDisplay"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info, Copy, Check } from "lucide-react"
import { useState } from "react"
import type { PolynomialData } from "@/lib/api-types"
import { useDisplayDigits } from "@/lib/display-digits"

interface PolynomialCardProps {
  polynomial: PolynomialData
}

function CopyableFormula({ text, copyAriaLabel }: { text: string | null; copyAriaLabel?: string }) {
  const [copied, setCopied] = useState(false)

  if (!text) return <span className="text-xs italic text-muted-foreground">Not available for this degree</span>

  async function handleCopy() {
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group relative">
      <pre className="text-xs font-numeric bg-muted/50 border rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
        {text}
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-background border opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-subtle text-muted-foreground hover:text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50${
          copied ? " animate-success-pop text-primary" : ""
        }`}
        aria-label={copied ? "Copied" : copyAriaLabel ?? "Copy expression to clipboard"}
      >
        {copied ? (
          <><Check className="h-3 w-3" aria-hidden="true" /> Copied</>
        ) : (
          <><Copy className="h-3 w-3" aria-hidden="true" /> Copy</>
        )}
      </button>
    </div>
  )
}

export function PolynomialCard({ polynomial }: PolynomialCardProps) {
  const [tab, setTab] = useState("expanded")
  const { digits, formatPoly, formatLiterals } = useDisplayDigits()

  /*
   * Display-precision routing per polynomial form.
   *
   * - "expanded": SymPy emits a top-level sum of monomials. `formatPoly`
   *   is safe and additionally filters near-zero coefficients (high-
   *   precision floating-point noise such as `2.78e-49 x^9`).
   *
   * - "factored", "lagrange", "newton": the grammar is NOT a top-level
   *   sum (parenthesised sub-expressions, embedded basis polynomials,
   *   nested-form Horner). Use `formatLiterals` which only rounds numeric
   *   literals in place and never drops or merges tokens. The backend
   *   remains the source of truth for structure.
   */
  const expandedFormatted = formatPoly(polynomial.expanded)
  const factoredText = formatLiterals(polynomial.factored)
  const lagrangeText = formatLiterals(polynomial.lagrange_form)
  const newtonText = formatLiterals(polynomial.newton_form)

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-5 py-3 border-b bg-muted/30">
        <h2 className="text-sm font-semibold text-foreground">Polynomial Forms</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Equivalent representations of the interpolating polynomial
        </p>
      </div>
      <div className="p-5">
        {polynomial.expanded_omitted_reason && (
          <Alert className="mb-4">
            <Info className="h-4 w-4" aria-hidden="true" />
            <AlertDescription className="text-xs">{polynomial.expanded_omitted_reason}</AlertDescription>
          </Alert>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-8">
            <TabsTrigger value="expanded" className="text-xs">Expanded</TabsTrigger>
            <TabsTrigger value="factored" className="text-xs">Factored</TabsTrigger>
            <TabsTrigger value="lagrange" className="text-xs">Lagrange</TabsTrigger>
            <TabsTrigger value="newton" className="text-xs">Newton</TabsTrigger>
          </TabsList>

          <TabsContent value="expanded" className="space-y-3 mt-4">
            <div className="bg-muted/30 rounded-lg p-4">
              <KatexDisplay latex={polynomial.latex_expanded} plainText={expandedFormatted.text} />
            </div>
            {expandedFormatted.hiddenCount > 0 && (
              <p className="text-[11px] text-muted-foreground italic">
                {expandedFormatted.hiddenCount} near-zero {expandedFormatted.hiddenCount === 1 ? "term" : "terms"} hidden at {digits === "full" ? "current" : `${digits} digits`} (likely floating-point noise). Switch to Full to see all terms.
              </p>
            )}
            <CopyableFormula text={expandedFormatted.text} copyAriaLabel="Copy expanded polynomial" />
          </TabsContent>

          <TabsContent value="factored" className="space-y-3 mt-4">
            <CopyableFormula text={factoredText || polynomial.factored} copyAriaLabel="Copy factored polynomial" />
          </TabsContent>

          <TabsContent value="lagrange" className="space-y-3 mt-4">
            <div className="bg-muted/30 rounded-lg p-4">
              <KatexDisplay latex={polynomial.latex_lagrange} plainText={lagrangeText} />
            </div>
            <CopyableFormula text={lagrangeText || polynomial.lagrange_form} copyAriaLabel="Copy Lagrange form" />
          </TabsContent>

          <TabsContent value="newton" className="space-y-3 mt-4">
            <div className="bg-muted/30 rounded-lg p-4">
              <KatexDisplay latex={polynomial.latex_newton} plainText={newtonText} />
            </div>
            <CopyableFormula text={newtonText || polynomial.newton_form} copyAriaLabel="Copy Newton nested form" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
