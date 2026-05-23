# Handoff — Interpolating Polynomial Program

## Current Task
Layout fix pass: Fixed the root cause of cramped input layouts (Tailwind v4 variant syntax), improved Quick Reference balance, error display, and Method Details polish.

## Current Status
- Overall status: Frontend layout and polish complete. All verification commands pass.
- Branch: `codex/interpolation-backend-v1`
- Backend status: Unchanged, all tests pass.
- Frontend status: Builds, lints, and type-checks clean. Live-tested against backend.
- Integration status: **PASS** — all live tests verified.

## What Changed (This Session)

### Root Cause Fix: Tabs Layout Bug
The `data-horizontal:flex-col` Tailwind variant used in the shadcn/ui Tabs component was not being compiled by Tailwind CSS v4. The shorthand `data-horizontal:` syntax requires explicit registration in v4; the correct syntax is `data-[orientation=horizontal]:`.

**Result**: The Tabs root was rendering as `flex-direction: row` instead of `column`, causing the TabsList and TabsContent to sit side-by-side. The tab content (form inputs) was squeezed into ~130px while the tab list took ~530px.

**Fix**: Updated `tabs.tsx` and `separator.tsx` to use `data-[orientation=horizontal]:` and `data-[orientation=vertical]:` syntax throughout.

### Changes Made

| File | What changed |
|---|---|
| `frontend/src/components/ui/tabs.tsx` | Fixed all `data-horizontal:` / `data-vertical:` / `group-data-horizontal/` / `group-data-vertical/` variants to use `data-[orientation=horizontal]:` / `data-[orientation=vertical]:` / `group-data-[orientation=horizontal]/` / `group-data-[orientation=vertical]/` syntax |
| `frontend/src/components/ui/separator.tsx` | Same variant syntax fix |
| `frontend/src/App.tsx` | Compact Quick Reference (240px column, smaller text), human-readable error messages with code shown underneath, removed unused `BookOpen` import |
| `frontend/src/components/results/MethodDetails.tsx` | Improved spacing (space-y-5), bordered containers for coefficients and DD table, better visual hierarchy with bg-muted/30 backgrounds, rounded-lg borders on tables |

### Quick Reference Improvements
- Reduced column width from 320px to 240px
- More compact text (11px base, 10px for code)
- Shorter descriptions ("Enter (xᵢ, yᵢ) pairs" instead of "Enter (xᵢ, yᵢ) pairs directly")
- Single-line example instead of multi-line
- Visually secondary to the main input form

### Error Display Improvements
- Human-readable message shown first (e.g., "At least two distinct points are required.")
- Backend error code shown smaller underneath (e.g., "Code: too_few_nodes")
- Mapped common error codes to friendly messages

### Method Details Polish
- Coefficients displayed in bordered card with shadow
- Divided-difference table wrapped in rounded border with header row background
- Better spacing between sections (space-y-5)
- Basis polynomials in bordered container
- Summation/Newton forms with more padding (p-4)
- Construction steps with slightly more spacing

### Precision Default
- Already was 50 (confirmed in DEFAULT_FORM). Max is 200. No change needed.

## Verification Commands Run

### Frontend Build
| Command | Result |
|---|---|
| `npx tsc -b` | PASS — 0 errors |
| `npm run build` | PASS — 959 kB JS, 82 kB CSS |
| `npm run lint` | PASS — 0 errors, 3 warnings (react-refresh, expected) |

### Impeccable Detector
| Command | Result |
|---|---|
| `node .kiro/skills/impeccable/scripts/detect.mjs --json frontend/src` | PASS — 0 findings |

### Live Integration Tests
| Test | Result |
|---|---|
| Linear Lagrange: (2,4),(5,1), eval x=3 → P(3)=3 | PASS ✓ |
| f(x)=1/x, x=[2,2.75,4], eval x=3 → P(3)=29/88, f(3)=1/3, error=1/264 | PASS ✓ |
| Runge Phenomenon: degree 10, 11 nodes, 2 warnings visible | PASS ✓ |
| Newton divided-difference table renders (3 rows, with header) | PASS ✓ |
| Neville table renders with evaluation_x | PASS ✓ |
| Barycentric weights render (3 weights) | PASS ✓ |
| Warnings visible (HIGH DEGREE + RUNGE PHENOMENON) | PASS ✓ |
| graph_data renders (101 points, no frontend recomputation) | PASS ✓ |
| Inline function validation shows "Valid: 1/x" | PASS ✓ |
| Interval mode layout: full-width inputs, clean 2-col grid | PASS ✓ |
| X+f(x) mode layout: full-width function input + x-values | PASS ✓ |
| Points mode layout: full-width point table | PASS ✓ |
| Results tabs navigate correctly | PASS ✓ |

### Layout Verification (Browser DevTools)
| Check | Before | After |
|---|---|---|
| Tabs root flex-direction | `row` (broken) | `column` (correct) |
| Tab content width | 131px (squeezed) | 746px (full card width) |
| Tabs root data-orientation | `horizontal` | `horizontal` |

## Known Caveats
1. Bundle size 959 kB JS — code-splitting would help.
2. IBM Plex Sans Variable webfont adds ~50 kB to assets.
3. The Brush component on the graph adds ~20px height.
4. Debounced function validation fires after 800ms; if backend is slow, requests may overlap.

## Previous Session Summary
- Added ExamplesPanel with 3 lecture presets
- Reorganized results with tabbed navigation (Overview/Polynomial/Evaluations/Graph/Methods/Notes)
- Added inline validation (duplicate x-values, debounced function validation)
- Added graph brush/zoom and custom tooltip
- Added Quick Reference toggle for mobile/tablet
- Fixed various accessibility and minor issues

## Next Steps
1. Consider keyboard shortcut (Ctrl+Enter) for Compute.
2. Consider paste-from-spreadsheet support for points input.
3. Optional: dark mode toggle.
4. Optional: code-split for smaller initial bundle.
5. Run `/impeccable critique` to verify score improvement.


---

## Session 2026-05-23: Frontend Analysis Bench Overhaul (Spec `frontend-analysis-bench-overhaul`)

### DESIGN.md Alignment Review Summary

The frontend was audited against every named rule in `DESIGN.md` and the OKLCH token contract in `.impeccable/design.json`. Audit and remediation were grouped into seven implementation groups (A–G) per the spec at `.kiro/specs/frontend-analysis-bench-overhaul/`. All non-verification groups (A–F) are complete; this entry records the verification cycle (Group G).

| Design rule | Audit result | Remediation |
| --- | --- | --- |
| Three-Voice Typography (display, body, label, numeric) | Pass after Groups A + C | Added `.font-label` canonical handle in `index.css`; replaced every ad-hoc `text-[10px] uppercase tracking-wider font-medium` with `font-label`; replaced default `font-mono` on math inputs with `font-numeric` (JetBrains Mono with `tabular-nums`). |
| Tinted Neutral Rule | Pass | All visible surfaces resolve to OKLCH tokens (`indigo-deep`, `slate-ink`, `surface-warm`, `surface-tinted`, `border-subtle`). No literal `#000`/`#fff`. The remaining `bg-[var(--destructive)]` literal in `HealthIndicator` was routed through `bg-destructive`. |
| Inset Containment Rule (warnings/errors via `ring-1 ring-inset`) | Pass | All notices route through the new `ErrorNotice` component or `WarningsDisplay`; both use `ring-1 ring-inset` with tinted backgrounds. No side-stripe accents above 1px. |
| Numeric Respect Rule (math values in `font-numeric` with `tabular-nums`) | Pass | Every coordinate, coefficient, weight, table cell, polynomial fragment, and chart tick now routes through the canonical numeric stack. Recharts axis ticks use the full `'JetBrains Mono', 'Fira Code', 'SF Mono', 'Cascadia Code', monospace` fallback chain. |
| Flat-at-Rest Rule | Pass | Header lost `bg-card/80` translucency; Compute button lost resting `shadow-sm`; Newton coefficient chips lost resting `shadow-sm` and inner `border`; KaTeX wrappers and Method Details section surfaces lost inner `border`. |
| No Nested Cards | Pass | `ResultsPanel` outer tab-bar card was flattened to `rounded-xl` only; KaTeX renderers and Method Details section surfaces use only `bg-muted/30` tonal layering inside the parent card outline. |
| Method emphasis (Lagrange/Newton construction; Barycentric stable evaluator; Neville target-specific) | Pass | `MethodSelector` role tags fixed to "Construction" / "Construction" / "Stable Evaluator" / "Target-Specific"; Barycentric retains `bg-primary/10 text-primary` accent without enlarging its card; `DEFAULT_FORM.methods` set to `["lagrange", "newton"]`. |
| Error/warning hierarchy (message first, code second, recovery sentence third) | Pass | New `ErrorNotice.tsx` component implements the canonical hierarchy with severity word in label voice, `Code: <code>` in numeric voice, and a frontend-maintained recovery-guidance map keyed on real backend codes (`too_few_nodes`, `duplicate_x`, `unsafe_expression`, `function_domain_error`, `invalid_interval`, `no_methods_selected`). |
| Visible focus on every interactive element | Pass | Method-selector label wrappers carry `focus-within:ring-2 focus-within:ring-ring/50`; Select primitive aligned to 32px / `lg` radius / 3px ring; Switch primitive matches; EvaluationTargets chip container uses `focus-within:ring-2 focus-within:ring-ring/50 focus-within:ring-inset`. |
| Reduced-motion respected | Pass | `index.css` `@media (prefers-reduced-motion: reduce)` block disables `.transition-subtle` and `.animate-in-results`; comments document the contract. |
| Backend authority (no client recomputation, no Math.js as source of truth) | Pass | Frontend renders only backend-returned arrays for the chart and tables. Frontend type fix applied to `NewtonResult.coefficients` and `NevilleResult.tables[].x/rows` to match the actual backend wire format; backend was not modified. |

### What Changed

Every frontend file modified across Groups A–F. No backend file was modified.

| File | Group(s) | Change |
| --- | --- | --- |
| `frontend/src/index.css` | A | Added `.font-label` voice handle (10px / 500 / 0.05em / uppercase / line-height 1). Inline comments anchor the four-voice contract and the reduced-motion contract to DESIGN.md. |
| `frontend/src/components/ui/select.tsx` | A | `SelectTrigger` aligned to `input-default`: 32px height, `rounded-lg`, `px-2.5 py-1`, 3px focus ring at `ring/50`. |
| `frontend/src/components/ui/switch.tsx` | A | Verified canonical 3px focus ring at `ring/50`; no edits required. |
| `frontend/src/components/PointsInput.tsx` | B + C | Row spacing `space-y-1.5` → `space-y-2`; `"0"` placeholder fallbacks dropped; `Add Point` shape aligned with `Add X-Value`; header spans now use `font-label`. |
| `frontend/src/components/XValuesInput.tsx` | B + C + E | Function input full-width; new `validationSuccess` prop renders inline `✓ Valid: <expr>` directly under the function input; x-value rows refactored to labelled grid `grid-cols-[2rem_1fr_2rem]` with `min-w-[10rem]` per cell; `font-mono` → `font-numeric`; remove icon unified to `X`; inline `text-[var(--*)]` literals routed through Tailwind aliases; inline error rendered through `ErrorNotice` (layout `inline`). |
| `frontend/src/components/FunctionIntervalInput.tsx` | B + C + E | Full-width function input + body-voice helper paragraph; `[a, b]` row stacks below md (`grid-cols-1 md:grid-cols-2`); strategy/count row uses `md:grid-cols-[2fr_1fr]` for a balanced ratio; `a` and `b` math symbols rendered in `font-numeric` inside labels; node-count `min`/`max` HTML attrs removed; inline destructive notice for out-of-range with severity word in `font-label`; inline error rendered through `ErrorNotice` (layout `inline`). |
| `frontend/src/components/InputPanel.tsx` | B + E | Added `validationSuccess` and structured `functionError` pass-through props. |
| `frontend/src/components/MethodSelector.tsx` | C + D | Role tags use `font-label`; canonical role labels Construction/Construction/Stable Evaluator/Target-Specific; canonical descriptions per Requirement 7.5; corner indicator dot removed; `<label>` carries `focus-within:ring-2 focus-within:ring-ring/50`. |
| `frontend/src/components/WarningsDisplay.tsx` | C + E | Severity word in `font-label`; body text routes through `text-warning-foreground` / `text-info-foreground`; structure unchanged so warnings remain unconditionally visible. |
| `frontend/src/components/EvaluationTargets.tsx` | C | Chip width `w-20` → `w-32`; chip container carries `focus-within:ring-2 focus-within:ring-ring/50 focus-within:ring-inset` so the bare-input chip has a visible focus state; `Add Target` aligned with the other Add buttons. |
| `frontend/src/components/HealthIndicator.tsx` | F | `bg-[var(--destructive)]` → `bg-destructive` for the offline status dot. |
| `frontend/src/components/ErrorNotice.tsx` | E (new) | Shared component for all error/warning/info notices. Block layout: severity word in `font-label` + primary message + `Code: <code>` in `font-numeric` + recovery sentence from a frontend-maintained code-to-guidance map. Inline layout: compact icon + message + `Code:` (no severity word, no recovery). Missing-message fallback: code becomes primary, "Backend did not provide a description." fills secondary slot. Defensive both-missing fallback prevents empty render. |
| `frontend/src/App.tsx` | B + D + E + F | Removed `[code] message` string parsing; `topError` and `functionError` are now `{ code?, message }` structured state. Removed dead `ERROR_MESSAGES` / `formatErrorMessage` / `getErrorCode` helpers. `unsafe_expression` and `function_domain_error` route inline only when a function input is mounted (`form.mode !== "points"`); otherwise fall back to the top-level banner. Top-level error JSX now consumes `ErrorNotice`. `DEFAULT_FORM.methods` changed to `["lagrange", "newton"]`. Header lost `bg-card/80` translucency. Compute button lost resting `shadow-sm`. |
| `frontend/src/components/ResultsPanel.tsx` | F | Outer tab-bar card flattened: `<nav>` lost `border bg-card overflow-hidden`, kept `rounded-xl`. Inner div is `flex items-center gap-1 overflow-x-auto py-1`. Tabs read as section navigation, not a standalone outlined card. |
| `frontend/src/components/results/SummaryCard.tsx` | C | Four header spans (`Degree`/`Nodes`/`Precision`/`Mode`) routed through `font-label`. |
| `frontend/src/components/results/NodesTable.tsx` | C + F | `<TableHead>` cells use `font-label text-muted-foreground`; `<Table>` wrapped in `<div className="overflow-x-auto rounded-lg">`. |
| `frontend/src/components/results/EvaluationTable.tsx` | C + F | All seven header cells routed through `font-label text-muted-foreground` (dropped `font-numeric` and `capitalize` from headers; label voice provides uppercase); three `"—"` placeholders replaced with the centered muted-dot `<span className="text-muted-foreground/30">·</span>`; `<Table>` wrapped in scroll container. |
| `frontend/src/components/results/MethodDetails.tsx` | C + D + E + F | Section sub-header `<h4>` rules routed through `font-label text-foreground`; Newton DD `<TableHead>` and Barycentric weights `<TableHead>` use `font-label text-muted-foreground`; inner `border` rings removed from basis-polynomial wrapper, summation `<pre>`, Newton coefficient block, divided-difference table wrapper, and nested-form `<pre>`; Newton coefficient chips lost resting `shadow-sm` and `border`; Neville heading rewritten to "Neville Table for x = `<span className="font-numeric">{t.x}</span>`"; Neville triangular tables gained a `<TableHeader>` row with `P[k]` columns; `MethodError` and `MethodWarnings` rebuilt to delegate to `ErrorNotice` so per-method errors and warnings share the canonical hierarchy with the top-level surfaces. |
| `frontend/src/components/results/PolynomialCard.tsx` | F | Removed inner `border` from three KaTeX wrappers. `bg-muted/30 rounded-lg p-4` is now the only inner containment. |
| `frontend/src/components/results/EducationalNotes.tsx` | F | Heading copy renamed "Theory Notes" → "Educational Notes" so the tab name and section title agree; bullet padding aligned with `BarycentricDetails` (`pl-4` → `pl-3`). |
| `frontend/src/components/results/GraphCard.tsx` | F | Recharts axis tick `fontFamily` (×4 occurrences across main + error chart XAxis/YAxis) routed through the canonical numeric voice fallback chain `'JetBrains Mono', 'Fira Code', 'SF Mono', 'Cascadia Code', monospace`. CustomTooltip node-line color now uses `text-destructive` Tailwind alias. Chart data construction unchanged: still consumes only `graph_data.x`, `graph_data.f_x`, `graph_data.P_x`, `graph_data.error`, and node coordinates. |
| `frontend/src/lib/api-types.ts` | D | Frontend-only type fix: `NewtonResult.coefficients` `Array<{index, value}>` → `string[]` and `NevilleResult.tables[].target_x`/`table` → `x`/`rows`, aligning with the backend's actual wire format. The previous types were a pre-existing latent bug masked by the old default-method selection. Backend wire format unchanged. |

Files created in this feature:
- `frontend/src/components/ErrorNotice.tsx`

### Commands Run (Group G — Requirement 9)

All commands run from `c:\Users\Emmy Lou\Documents\New project 3\frontend` unless noted.

| Task | Command | Working dir | Exit code | Notes |
| --- | --- | --- | --- | --- |
| 12.1 | `npx tsc -b` | `frontend/` | 0 | Zero TypeScript errors. |
| 12.2 | `npm run build` | `frontend/` | 0 | 2454 modules transformed; built in 1.21s. Pre-existing chunk-size advisory at 960 kB JS bundle (unchanged from prior sessions). |
| 12.3 | `npm run lint` | `frontend/` | 0 | Zero ESLint errors. Three pre-existing `react-refresh/only-export-components` warnings in `src/components/ui/badge.tsx` (line 54), `button.tsx` (line 58), `tabs.tsx` (line 82). These are inherent to shadcn/ui v4 primitive files that intentionally export both a component and a `cva` variant constant. |
| 12.4 | `impeccable detect "C:\Users\Emmy Lou\Documents\New project 3\frontend\src"` | workspace root | 0 | Zero findings against project source. (A workspace-root run reports six findings inside the impeccable detector's own bundled scripts at `.kiro/skills/impeccable/scripts/*.js`; those are the detector's pattern definitions matching themselves and are not findings against this codebase.) |

### Live-Test Results (Group G — Requirement 10)

All scenarios run against the running backend at `http://127.0.0.1:8000` proxied through Vite at `http://localhost:5173`. API-layer assertions performed via `curl` / `python -c "json.load..."`. UI-layer assertions performed via Chrome DevTools MCP with the dev server running.

| Task | Scenario | Source of truth | Result |
| --- | --- | --- | --- |
| 12.5 | Linear Lagrange (Req 10.1): points (2,4) (5,1), evaluation x=3 → P(x) = 6 − x and P(3) = 3 | API: `expanded: '6 - x'`, `best_P_x: '3'`, all four method values = `'3'` | PASS |
| 12.6 | 1/x example (Req 10.2): f(x)=1/x, x=[2, 2.75, 4], evaluation x=3 → P(3) = 29/88 ≈ 0.32955 | API: `best_P_x: '29/88'`, `f_x: '1/3'`, `absolute_error: '1/264'` | PASS |
| 12.7 | Newton DD table (Req 10.3): renders with header row + one row per node | API: `divided_difference_table = [['4','-1'], ['1', null]]`; UI: `<TableHead>` columns `f[xᵢ]`, `Δ¹`, `Δ²`, ... in `font-label` voice | PASS |
| 12.8 | Neville triangular tables (Req 10.4): each table identifies its target x | API: `tables[0].x = '3'`, `tables[0].rows = [['4','3'], ['1', null]]`; UI: `<h4>` "Neville Table for x = `<numeric>3</numeric>`" + `<TableHead>` `P[k]` columns | PASS |
| 12.9 | Barycentric weights table (Req 10.5): columns `i`, `xᵢ`, `wᵢ`, one row per node | API: `weights = [{index:0, x:'2', weight:'-1/3'}, {index:1, x:'5', weight:'1/3'}]`; UI: `<TableHead>` `i`/`xᵢ`/`wᵢ` in `font-label` voice | PASS |
| 12.10 | Warnings + errors hierarchy (Req 10.6): warnings stay visible without user action; errors render with message-first hierarchy and code-second in numeric voice | UI: Runge example shows top-level `WarningsDisplay` with severity words "HIGH DEGREE" and "RUNGE PHENOMENON" in `font-label`; `too_few_nodes`, `unsafe_expression` (inline under function input), `duplicate_x` (with recovery sentence) all render in `ErrorNotice` with the canonical hierarchy. Notes tab badge shows count `2`. No warning is collapsed by default. | PASS |
| 12.11 | Graph rendering uses only backend `graph_data` arrays (Req 10.7, supported by Req 1.6/1.7) | DevTools network: exactly one `POST /api/interpolate` for the Runge compute (reqid=158, 200, 45654 byte response); no additional fetches; chart legend = `Nodes / P(x) / f(x)`; chart points construction in `GraphCard.tsx` is `chartData.map((xStr, i) => ...)` consuming only `graph_data.x/f_x/P_x/error` plus node coordinates | PASS |

Live-test screenshots saved at `.kiro/specs/frontend-analysis-bench-overhaul/screenshots/`:
- `group-g-runge-warnings-overview.png` — Runge result with both top-level warnings visible in label voice.
- `group-g-runge-graph-from-backend.png` — graph card rendered from backend `graph_data`.
- `group-g-runge-response.network-response` — captured response body for traceability.

(Plus prior groups' screenshots: `group-b-*`, `group-c-*`, `group-d-*`, `group-e-*`, `group-f-*`.)

### Remaining Caveats

1. **Bundle size**: Production JS chunk is ~960 kB (gzipped 286 kB). Pre-existing condition; not introduced by this feature. Vite emits the standard >500 kB chunk-size advisory. Code-splitting via `build.rolldownOptions.output.codeSplitting` would address it but is out of scope here.

2. **shadcn primitive lint warnings**: Three `react-refresh/only-export-components` warnings remain in `ui/badge.tsx`, `ui/button.tsx`, `ui/tabs.tsx`. These are inherent to shadcn/ui v4's primitive shape (component + `cva` variant constant in the same file) and are explicitly accepted by Requirement 9.3 (warnings are acceptable; only errors block).

3. **Recharts SVG ticks and `tabular-nums`**: Recharts axis labels render as SVG `<text>` nodes which do not pick up `font-variant-numeric: tabular-nums` automatically. Tick labels still use the canonical numeric voice fallback chain. Tabular alignment of tick numerals is a known Recharts limitation, not a regression.

4. **Frontend type alignment for Neville/Newton**: A pre-existing latent type mismatch in `api-types.ts` was corrected during Group D. The previous types (`NewtonResult.coefficients = Array<{index, value}>` and `NevilleResult.tables[].target_x`/`table`) did not match the backend's actual wire format (`string[]` and `tables[].x`/`rows`). The bug was masked because the old default-method list excluded Neville from the typical request. The frontend types now match the live wire format. Backend was not modified.

5. **Default method change**: `DEFAULT_FORM.methods` is now `["lagrange", "newton"]` (Group D). Barycentric and Neville remain available via the method selector. This was an explicit user request to fix the perceived "Barycentric overemphasis" by leading with the construction methods.

6. **Inline `border` on the `CopyableFormula` `<pre>` and on the Neville Target Results pill**: These were intentionally retained. `CopyableFormula` is a sibling separator below the KaTeX render (not nested-card drift). The Neville Target Results pill uses `border-primary/20` as a primary-tinted tag accent, not as a card outline.

### Next Steps

The frontend overhaul feature `frontend-analysis-bench-overhaul` is complete. Optional follow-ups:

- Consider keyboard shortcut (Ctrl+Enter) for Compute.
- Consider paste-from-spreadsheet support for points input.
- Optional: dark mode toggle (the `.dark` token block already exists in `index.css`).
- Optional: code-split for smaller initial bundle.


---

## Session: Frontend Critique Overhaul (2026-05-23)

### What Changed

Comprehensive UX/quality pass driven by `/impeccable critique` against the running app. Backend untouched (per AGENTS.md scope).

**Foundation libraries (new)**
- `frontend/src/lib/format-numeric.ts`: numeric-string rounding with budgets `6 / 12 / 25 / Full`. Rationals (`1/26`) and integers pass through. For decimals/scientific, budgets <15 round through `Number.toPrecision`; budgets >=15 use string-based truncation so JavaScript's 17-significant-digit double precision does not invent garbage tail digits. `formatPolynomial` rounds each top-level term and hides near-zero coefficients (threshold = `10^-(digits + 2)`).
- `frontend/src/lib/display-digits.tsx`: `DisplayDigitsContext` + `DisplayDigitsProvider` exposing `format`, `formatPoly`, `digits`, `setDigits`.
- `frontend/src/components/DisplayDigitsControl.tsx`: segmented `radiogroup` rendered next to the result tabs.
- `frontend/src/lib/warnings.ts`: shared catalog of warning code → label + severity, replaces inline maps in `WarningsDisplay`.
- `frontend/src/lib/use-shortcuts.ts`: page-level keyboard shortcuts (`Ctrl/Cmd+Enter` Compute, `Alt+R` Reset, `?` toggle help).
- `frontend/src/lib/use-theme.ts` + `frontend/src/components/ThemeToggle.tsx`: light / dark / system theme toggle persisted to `localStorage`, applied before React mounts via `applyInitialTheme()`.
- `frontend/src/main.tsx`: calls `applyInitialTheme()` before `createRoot` to avoid flash-of-wrong-theme.

**Result-layer changes**
- `ResultsPanel`: sticky tab nav, persistent warning row above the tabs (warnings are pedagogical and never hidden behind a tab), Display control wired in. No backdrop-blur per design law.
- `PolynomialCard`, `EvaluationTable`, `NodesTable`, `MethodDetails`, `GraphCard`, `SummaryCard`: every numeric string flows through `useDisplayDigits().format` so the UI respects the user's display-precision choice. Polynomial card surfaces "N near-zero terms hidden at K digits" when terms drop out.
- `NodesTable`: column header marker tightened, "node" / "nodes" pluralization fixed.
- `SummaryCard`: relabeled `PRECISION` to `COMPUTE PRECISION` to disambiguate from the new display control.
- `EvaluationTable`: fallback dot uses `text-muted-foreground/40` and an `aria-label="not available"` so AT users do not silently encounter dot-only cells.

**Input-layer changes**
- `FunctionIntervalInput`: Node Count now has native `min={2} max={50} step={1} inputMode="numeric"`, so the a11y tree and the browser both enforce bounds (was 0/0 in the prior critique). Added node-strategy help text wired through `aria-describedby`.
- `PrecisionSettings`: precision range input gains `aria-valuetext` ("50 significant digits"). Added preset buttons (`15`, `30`, `50`, `100`) with `aria-pressed` state.
- `ExamplesPanel`: Compute button always mounted; when backend offline it is rendered disabled with `aria-disabled` + `title="Backend offline"`. Category chip (`LECTURE`, `FUNCTION`, `DEMO`) bumped to label voice (10px) per DESIGN baseline.
- `MethodSelector`: role badges retuned to task-keyed labels (`TEACH`, `VERIFY`, `PLOT`, `TARGET`). Barycentric retains the primary-tinted highlight as the unique source of graph data.
- `EvaluationTargets`: anchor `id="evaluation-targets"` so the Neville empty-state link works.
- `KatexDisplay`: KaTeX output is now `aria-hidden`, accompanied by an `sr-only` plain-text label; callers pass the rounded plain-text expression so screen readers no longer read raw LaTeX source.

**App shell**
- `App.tsx`: wraps the tree in `DisplayDigitsProvider`, wires shortcuts, adds a Shortcuts overlay (`?` or header button), Theme toggle, removed redundant duplicate `useEffect` health check (now delegated to `HealthIndicator.onStatusChange`). Compute button is disabled with `title="Backend offline"` when the backend is offline. Footer copy rewritten from "All calculations verified server-side" to "Backend computes with SymPy and mpmath at user-selected precision".
- `HealthIndicator`: status dot uses the new `--success` semantic token (was borrowing `--primary`, which the Semantic Honesty Rule reserves for "interactive or selected"). Pairs the status with a `Check` / `X` / `Loader2` icon and `role="status"` so severity is never carried by color alone.

**Design tokens**
- `frontend/src/index.css`: added `--success` and `--success-foreground` (light + dark) so HealthIndicator can stop overloading `--primary`.

### Files Touched (this session)
**New**
- `frontend/src/lib/format-numeric.ts`
- `frontend/src/lib/display-digits.tsx`
- `frontend/src/lib/warnings.ts`
- `frontend/src/lib/use-shortcuts.ts`
- `frontend/src/lib/use-theme.ts`
- `frontend/src/components/DisplayDigitsControl.tsx`
- `frontend/src/components/ThemeToggle.tsx`

**Modified**
- `frontend/src/main.tsx`
- `frontend/src/App.tsx`
- `frontend/src/index.css`
- `frontend/src/components/InputPanel.tsx` (no functional change; verified)
- `frontend/src/components/HealthIndicator.tsx`
- `frontend/src/components/WarningsDisplay.tsx`
- `frontend/src/components/MethodSelector.tsx`
- `frontend/src/components/FunctionIntervalInput.tsx`
- `frontend/src/components/PrecisionSettings.tsx`
- `frontend/src/components/ExamplesPanel.tsx`
- `frontend/src/components/EvaluationTargets.tsx`
- `frontend/src/components/KatexDisplay.tsx`
- `frontend/src/components/ResultsPanel.tsx`
- `frontend/src/components/results/SummaryCard.tsx`
- `frontend/src/components/results/PolynomialCard.tsx`
- `frontend/src/components/results/EvaluationTable.tsx`
- `frontend/src/components/results/NodesTable.tsx`
- `frontend/src/components/results/MethodDetails.tsx`
- `frontend/src/components/results/GraphCard.tsx`

### Commands Run

From `frontend/`:
```
npm run build   ; Built in ~917ms; 0 errors. Bundle size warning is pre-existing.
npm run lint    ; 0 errors, 3 pre-existing warnings (UI primitives `react-refresh/only-export-components`).
```

From repo root:
```
node .kiro/skills/impeccable/scripts/detect.mjs --json --fast frontend/src   ; Returns []. No anti-pattern findings.
```

Live verification (Vite dev + Chrome DevTools MCP):
- Loaded the Runge phenomenon example end-to-end. Verified that Display="12" shows `0.0384615384615` for node y-values (was 50 digits prior), Display="25" shows `0.04705882352941176470588235`, Display="Full" shows the raw 50-digit string.
- Verified the expanded polynomial drops 5 near-zero floating-point-noise coefficients at "12" and labels the count: "5 near-zero terms hidden at 12 digits".
- Verified the warning row hoists above the tabs and routes to the Notes tab on click.
- Verified Node Count spinbutton announces `valuemin=2 valuemax=50` (was 0/0).
- Verified Precision slider announces `valuetext="50 significant digits"`.
- Verified `Ctrl+Enter` shortcut dispatches Compute; `?` opens the shortcuts overlay; theme toggle cycles light → dark → system and persists.
- Verified zero `backdrop-filter` elements and zero side-stripe `border-left` rules on the live page.

### Known Risks / Notes
- `digits >= 15` uses string-based truncation rather than rounding. This means the last visible digit is the source string's prefix, not a rounded value. For backend exact-mode + 50-digit numerics this is the safer choice (the backend remains the source of truth) and mirrors how high-precision libraries usually display values.
- The `react-refresh/only-export-components` warnings on `ui/badge.tsx`, `ui/button.tsx`, `ui/tabs.tsx` are pre-existing (shadcn/ui pattern: variants exported alongside components). On `display-digits.tsx` the warning is suppressed with an inline ESLint disable comment because the context value and the hook live in the same module on purpose; the user-facing control component lives in its own file.
- Bundle is ~975 kB unminified, 290 kB gzipped. Pre-existing; chunk splitting is a future optimization, not a critique blocker.

### Next Steps
- Future critique passes can target persona-specific flows (Alex paste-from-Excel, Sam KaTeX-to-screen-reader full coverage).
- Bundle splitting (`build.rolldownOptions.output.codeSplitting`) is a future opt-in.


---

## Session: Hardening Pass (2026-05-23)

### Scope (per the user's directive)
1. Polynomial-form correctness: `formatPoly` is for the expanded form only; factored / Lagrange / Newton nested go through a structure-preserving literal rounder.
2. Assistive-tech table headers: explicit aria-labels for `i`, `x_i`, `y_i`, `w_i`, `f[x_i]`, `Δk`, `P_k`, and the `|Error|` column.
3. DisplayDigitsControl deduplication: one mounted radiogroup, no `md:hidden` twin.
4. Theme toggle WCAG 2.5.3: visible label is now a substring of the accessible name.
5. Meta description added to `frontend/index.html`.
6. Cheap polish: examples panel surfaces "Backend offline" as visible text rather than tooltip-only; footer copy made student-facing; `--success` token documented in `DESIGN.md`.
7. Method roles restored to canonical wording (`Construction` / `Stable Evaluator` / `Target-Specific`); styling softened (lower weight, no uppercase, no font-label tracking) rather than relabelling.
8. Heading-order fix uncovered by Lighthouse: Method Details `<h4>` headings bumped to `<h3>` so the document outline is `h1 -> h2 -> h3` without skips.

### Hard rules honored
- Backend behavior unchanged.
- Endpoint paths and JSON contract unchanged.
- Interpolation logic unchanged.
- Frontend renders backend results only. No re-computation in React.

### Files Changed
- `frontend/src/lib/format-numeric.ts`: added `formatNumericLiteralsInString()`. Walks a string with a regex that matches numeric literals only and replaces them through `roundNumericString()`. Operators, parentheses, identifiers, and minus-as-operator are left untouched.
- `frontend/src/lib/display-digits.tsx`: exposes a new `formatLiterals()` consumer of the helper.
- `frontend/src/components/results/PolynomialCard.tsx`: routes expanded -> `formatPoly`, all other forms -> `formatLiterals`.
- `frontend/src/components/results/MethodDetails.tsx`: Lagrange basis polynomials, Lagrange summation form, and Newton nested form all flow through `formatLiterals`. DD-table and Neville-table headers carry aria-labels (`f at x sub i`, `delta k divided difference`, `P sub k (Neville approximation column)`). Section sub-headings raised from `<h4>` to `<h3>`.
- `frontend/src/components/results/EvaluationTable.tsx`: `|Error|` column gains `aria-label="absolute error"`.
- `frontend/src/components/results/NodesTable.tsx`: index, x_i, y_i headers carry explicit aria-labels; `<sub>` content marked `aria-hidden`.
- `frontend/src/components/PointsInput.tsx`: same aria-label / `aria-hidden` pattern on the in-form `i / x_i / y_i` header row.
- `frontend/src/components/ResultsPanel.tsx`: removed the duplicate `md:hidden` `DisplayDigitsControl`. The single instance now stacks below the tab list at narrow widths (`flex-col md:flex-row`).
- `frontend/src/components/ThemeToggle.tsx`: aria-label now starts with the visible label (e.g. "Light theme, switch to dark") so WCAG 2.5.3 is satisfied. Voice-control users can say "Click Light".
- `frontend/src/components/ExamplesPanel.tsx`: when backend is offline, an inline `role="status"` "Compute disabled, backend offline" message renders in the section header. Title-only tooltips are no longer the only signal.
- `frontend/src/components/MethodSelector.tsx`: roles back to canonical wording. Styling softened: `text-[11px] font-normal tracking-normal`, with `text-primary/80` only on Barycentric to mark its unique role as the graph data source per the API contract.
- `frontend/src/App.tsx`: footer rewritten to "Computed by SymPy and mpmath at your chosen precision".
- `frontend/index.html`: added `<meta name="description">` so the page is meaningfully introspectable.
- `DESIGN.md`: documented the new `--success` token and the addition to the Semantic Honesty Rule.

### Commands Run

From `frontend/`:
```
npx tsc -b           PASS (exit 0)
npm run build        PASS (exit 0; ~835 ms; same chunk-size warning as before)
npm run lint         PASS (0 errors, 0 warnings)
```

From repo root:
```
node .kiro/skills/impeccable/scripts/detect.mjs --json --fast frontend/src   PASS ([])
```

Live verification (Vite dev + Chrome DevTools MCP, with backend at 127.0.0.1:8000):

Backend assertion matrix (13/13 pass):
- Linear Lagrange: `expanded == "6 - x"`, `P(3) == 3`. PASS
- 1/x example: `best_P_x == 29/88`, `f(3) == 1/3`, `abs_err == 1/264`. PASS
- Newton DD table shape `2x2`. PASS
- Neville: 1 table, first table x = "3". PASS
- Barycentric weights count 2. PASS
- Runge: `high_degree_warning` and `runge_warning` present. PASS
- Runge graph_data present, source_method = "barycentric". PASS

UI verification:
- Polynomial Forms tab: factored "(4*x**2 - 35*x + 98)/88", Lagrange "(x - 4)*(4*x - 11)/12 + -64*(x - 4)*(x - 2)/165 + (x - 2)*(4*x - 11)/40", Newton "-2*x/11 + (x - 11/4)*(x - 2)/22 + 19/22". Algebraic structure preserved through all four sub-tabs.
- Method Details tab: Newton DD-table headers carry aria-labels "f at x sub i", "delta 1 divided difference", "delta 2 divided difference"; cells render exact rationals (1/2, 4/11, etc.).
- Theme toggle: aria-label reads "Light theme, switch to dark"; cycle to "Dark theme, switch to system" still works.
- Display radiogroup count: 4 visible radios in the DOM, was 8 with the duplicate.
- Lighthouse desktop snapshot: Accessibility 100, Best Practices 100, SEO 80, Agentic Browsing 50. Two remaining failures are `robots-txt` and `llms-txt`, not applicable to a localhost workbench.

### Deferred (per user instruction; not in this pass)
- Paste-from-Excel into Points
- Bulk-add evaluation targets
- Saved configurations
- Result-tab hotkeys 1-6
- Bundle splitting Recharts/KaTeX (note: GraphCard and PolynomialCard ARE already lazy-loaded in the current ResultsPanel; further splitting would be diminishing returns)
- KaTeX font subsetting
- Read-polynomial button

### Notes / Risks
- The polynomial-form fix relies on an established assumption: the SymPy `expanded` form is a top-level sum of monomials. The other three forms emit grammars where `+/-` can sit inside parens. `formatLiterals` is structure-preserving by design (it never splits on operators) and so is safe for any expression string the backend chooses to emit, but if SymPy ever changes the `expanded` grammar (unlikely), only `formatPoly` would need re-checking.
- The structure-preserving literal rounder leaves negative numbers with a separate "-" operator token alone (e.g. it does not consume a leading "-" as part of the number, since "-" can also be a binary operator). This means an input like "-3.0e-49" is rounded to "-3.0e-49" by treating the "-3.0e-49" segment as `[-]` `[3.0e-49]`, and `3.0e-49 -> 3e-49` (or hidden, depending on threshold). The minus and exponent's sign are unaffected because they parse via the regex's `[eE][+-]?\d+` clause, not the leading-sign clause.


---

## Session 2026-05-23: Frontend Motion Pass (`/impeccable animate`)

### Scope

Frontend-only motion enrichment. Backend untouched (per AGENTS.md scope).
Goal: extend the existing motion contract (`--ease-standard`, `--ease-out-expo`, `--duration-fast`, `--duration-normal`, `.transition-subtle`, `.animate-in-results`, the reduced-motion neutralizer) to cover the state changes that were still abrupt: row insertion in three editors, compute pending state, copy success, persistent warning bar appearance, function-validation success appearance, offline status line appearance, and health-indicator color transitions on status change. Product register, 150–200 ms budget. No page-load choreography. Reduced-motion contract preserved.

### What Changed

| File | Change |
| --- | --- |
| `frontend/src/index.css` | Added two ease tokens (`--ease-out-quart`, `--ease-out-quint`). Replaced the motion handles + reduced-motion section with five canonical handles (`.transition-subtle`, `.transition-colors-fast`, `.animate-in-results`, `.animate-row-enter`, `.animate-success-pop`) and three keyframe definitions (`fadeSlideIn`, `rowEnter`, `successPop`). Reduced-motion block updated to neutralise all five. Inline comments document the contract and explain why `Loader2`'s `animate-spin` is left running deliberately (functional progress indicator). |
| `frontend/src/lib/use-newly-added-index.ts` (new) | Hook returning the index of the most recently appended list entry for `holdMs` (default 220 ms) so list editors can apply a one-shot entrance class to the new row only. Existing rows never re-animate on unrelated state updates. |
| `frontend/src/components/PointsInput.tsx` | Wired `useNewlyAddedIndex(points.length)`; appends `animate-row-enter` to the freshly-added row only. |
| `frontend/src/components/XValuesInput.tsx` | Same wiring for x-value rows. Function-validation success line now carries `animate-in-results` so the green check fades in instead of popping. |
| `frontend/src/components/EvaluationTargets.tsx` | Same wiring for evaluation target chips. |
| `frontend/src/App.tsx` | Compute button icon swaps from `Play` to `Loader2` with `animate-spin` while `loading`. Offline-status paragraph carries `animate-in-results` so it fades in on appearance. |
| `frontend/src/components/ResultsPanel.tsx` | Persistent warning bar carries `animate-in-results` on every appearance (mounts when `warningCount > 0 && activeTab !== "notes"`). |
| `frontend/src/components/HealthIndicator.tsx` | Status dot and icon carry `transition-colors-fast` so the color transition between checking → online → offline is smoothed instead of a hard color swap. |
| `frontend/src/components/results/PolynomialCard.tsx` | Copy button gains `animate-success-pop` and a `text-primary` color shift while `copied === true`. The pop is a scale-only 1 → 1.06 → 1 over 200 ms, so adjacent layout never shifts. |

### Deliberately not animated

- **Tab panel content swap.** The tab triggers already cross-fade via `transition-subtle`; animating panel content on every tab switch would create animation fatigue and contradict the product register's "consistency over surprise" rule.
- **Theme toggle.** Color transition on theme flip is a known regression pattern (transitions everywhere, including unrelated DOM). Honest hard flip is correct.
- **Page load.** Product register explicitly bans page-load choreography ("users are in a task and won't wait for it").

### Commands Run

From `frontend/`:

| Command | Result |
| --- | --- |
| `npx tsc -b` | exit 0 |
| `npm run lint` | exit 0 (3 pre-existing `react-refresh/only-export-components` warnings on shadcn primitives) |
| `npm run build` | exit 0 (built in 1.74s, bundle sizes unchanged within noise) |

From repo root:

| Command | Result |
| --- | --- |
| `node .kiro/skills/impeccable/scripts/detect.mjs --json frontend/src` | `[]` (no anti-pattern findings) |

### Live Verification

Dev server (`npm run dev`) on port 5173, Chrome DevTools MCP. All assertions read computed `animationName`, `animation-duration`, `animation-timing-function`, and `Element.getAnimations()` directly.

| Test | Result |
| --- | --- |
| Stylesheet contains `@keyframes rowEnter`, `successPop`, `fadeSlideIn`. | PASS |
| Stylesheet contains `.animate-row-enter`, `.animate-success-pop`, `.transition-colors-fast` rules referencing `var(--duration-*)` and `var(--ease-out-*)`. | PASS |
| `@media (prefers-reduced-motion: reduce)` block neutralises all five handles in a single rule. | PASS |
| Add Target click ⇒ fresh row carries `animate-row-enter`, `animationName: rowEnter`, `duration: 200ms`, `easing: ease-out-quart`, single running animation. | PASS |
| Linear Lagrange compute (`(2,4),(5,1)`, eval x=3) ⇒ result panel mounts; degree 1, 2 nodes, 3 method tags, no warning bar (no warnings on this case). | PASS |
| Runge example compute (`f(x)=1/(1+25x^2)`, 11 equally spaced nodes on `[-1, 1]`) ⇒ persistent warning bar mounts with `animationName: fadeSlideIn`, `duration: 200ms`, ease-out-expo, content "Warnings · 2 pedagogical notices from the backend · View in Notes". | PASS |
| Polynomial tab Copy click ⇒ button text becomes "Copied", carries `animate-success-pop`, animation running for 200 ms, no layout shift around it. | PASS |

Screenshot: `.impeccable/critique/screens/animate-runge-with-warnings.png` (Runge result with the new warning bar entrance).

### Remaining Caveats

1. The Compute button's loader-icon swap can be too fast to perceive on Linear Lagrange (sub-100 ms compute on the local backend). The behavior is correct; the icon does swap and the spinner does spin while `loading` is `true`. Visible on Runge or any compute that takes ≥ ~120 ms.

2. Copy success pop runs concurrently with the existing `transition-subtle` color shift on the same element. Browsers handle the two cleanly (one is a transition, one is a CSS animation), and the result is the intended "color shifts to primary, button pulses, both settle within 200 ms". Recorded so a future contributor knows the dual-animation is deliberate.

3. The reduced-motion contract now covers five handles, not two. Any future motion handle MUST be added to both the handle list and the `prefers-reduced-motion: reduce` neutralizer. The block in `index.css` is commented to make this explicit.


---

## Session: Colorize Pass (2026-05-23)

### Scope

`/impeccable colorize entire website`. Strategic enrichment within the existing Indigo-Slate "Analysis Bench" register; not a recoloring. Per `reference/colorize.md` for product register: semantic-first, almost always Restrained. Coverage of saturated color stays under the <=10% Restrained dosage.

Per AGENTS.md: backend / API contract / interpolation logic untouched.

### What Changed

1. **`frontend/src/components/ui/badge.variants.ts`** — added `info` and `success` variants. Both bind to existing CSS custom properties (`--info`, `--success`) already declared in `frontend/src/index.css`. No new tokens were introduced.

2. **`frontend/src/components/results/SummaryCard.tsx`** —
   - Status chip uses the `success` variant for `ok` (was `default`/primary). Restores the Semantic Honesty Rule for positive system status app-wide. Primary now stays reserved for "interactive or selected" everywhere.
   - "Mode" cell renders as a tinted Badge instead of a body-voice word so the four-cell rhythm in the summary stays in the numeric/label voice. `Exact` reads primary, `Numeric` reads info-cyan.
   - Methods row now carries per-method role tints via a `METHOD_BADGE` map: Lagrange/Newton (Construction → secondary), Barycentric (Stable Evaluator → primary), Neville (Target-Specific → info).

3. **`frontend/src/components/results/MethodDetails.tsx`** — added a `METHOD_TAB_TINT` map that applies role tints on the active state of each method tab: Construction methods stay neutral, Barycentric uses `data-active:bg-primary/10`, Neville uses `data-active:bg-info/10`. Same role taxonomy as `MethodSelector` and `SummaryCard`, so the role color a user selected with echoes back across all three surfaces.

4. **`frontend/src/components/ExamplesPanel.tsx`** — example category tag was a flat gray pill; now renders as a tinted Badge that pre-encodes what each example demonstrates: Lecture → primary, Function → info-cyan, Demo → warning-amber. The Demo amber pre-flags the warning bar that the Runge example will produce, so amber's app-wide meaning of "numerical caution" stays intact. The `Example.category` type tightened from `string` to a discriminated union.

5. **`DESIGN.md`** — Badges / Method Tags section now documents the full variant set, the method role taxonomy, the Mode chip rule, the example category table, and the status chip mapping.

6. **`docs/FRONTEND_HANDOFF.md`** — appended a Frontend v1.4 colorize-pass section with verification results.

7. **`.impeccable/critique/2026-05-23T21-30-00Z__frontend-colorize.md`** — full critique log of this pass.

### Files Changed

- `frontend/src/components/ui/badge.variants.ts`
- `frontend/src/components/ExamplesPanel.tsx`
- `frontend/src/components/results/SummaryCard.tsx`
- `frontend/src/components/results/MethodDetails.tsx`
- `DESIGN.md`
- `docs/FRONTEND_HANDOFF.md`

Files created:
- `.impeccable/critique/2026-05-23T21-30-00Z__frontend-colorize.md`

### Commands Run

From `frontend/`:

```
npm run build   ; PASS, 2553 modules, 1.66s. index 393 kB / 120 kB gzip; GraphCard 378 kB / 110 kB gzip; PolynomialCard 264 kB / 79 kB gzip; CSS 61 kB / 11 kB gzip.
npm run lint    ; PASS, 0 errors, 0 warnings (the 3 pre-existing react-refresh warnings are now gone because variants live in their own files since v1.3).
```

`getDiagnostics` on every touched file: 0 issues.

### Live Verification

Dev server at `http://localhost:5173/` with backend at `http://127.0.0.1:8000`. Screenshots in `.impeccable/critique/screens/colorize-after-*.png`.

| Scenario | Result |
|---|---|
| Empty bench: Examples panel category tags read primary / info / warning | PASS |
| Linear Lagrange: status chip green (`ok`), Mode chip primary (`Exact`), method badges role-tinted | PASS |
| Linear Lagrange + Neville selected: Neville badge reads info-cyan in summary | PASS |
| Runge: Mode chip info-cyan (`Numeric`), warning bar amber, status chip green (`ok`) | PASS |
| Method Details Barycentric tab active: primary tint | PASS |
| Method Details Neville tab active: info-cyan tint | PASS |
| Method Details Lagrange / Newton tabs active: neutral lifted-pill (unchanged) | PASS |
| Dark mode: same role tints render correctly | PASS |
| Light mode: same role tints render correctly | PASS |

### Anti-Pattern Status

No new anti-pattern violations. No side stripes, no gradient text, no glassmorphism, no hero-metric template, no nested cards, no #000/#fff. Color is never the only severity indicator (every tinted badge still has a label word; status chip pairs color with text).

### Hard Rules Reaffirmed

- Backend behavior unchanged.
- Endpoint paths and JSON contract unchanged.
- Interpolation logic unchanged.
- Frontend renders backend results only.

### Next Steps

Optional follow-ups, in priority order from the most recent audit:
1. `/impeccable harden` — wire focus management on the shortcuts dialog; replace the custom `ResultsPanel` tablist with the Base UI primitive (already done in this codebase, so this item may be already addressed).
2. `/impeccable polish` — distinguish focus state on `MethodSelector` cards from the hover state.
3. `/impeccable optimize` — visibility-aware backoff in `HealthIndicator`, memoize formatted cells in `EvaluationTable` and `MethodDetails`.


---

## Session: V1 Stabilization and Contract Mismatch Fix (2026-05-23)

### Scope

Stabilized the current V1 project state without adding interpolation features, changing endpoint paths, or changing backend interpolation logic. The known mismatch was frontend-only: backend Lagrange basis entries return `basis`, while the frontend type and renderer expected `expression`.

### Initial Repo State

```powershell
git status --short
 M docs/FRONTEND_HANDOFF.md
 M docs/HANDOFF.md
?? .impeccable/
?? .kiro/
?? .vscode/
?? DESIGN.md
?? PRODUCT.md
?? frontend/

git branch --show-current
codex/interpolation-backend-v1

git log --oneline -10
21b41c8 Document implemented interpolation backend contract
8d4cee3 docs: add interpolation backend implementation plan
2d1749c docs: add interpolation backend design spec
```

### Files Changed In This Session

- `frontend/src/lib/api-types.ts` — changed Lagrange basis entry type from `expression` to backend fields `basis`, `x_i`, `expanded`, and `latex`.
- `frontend/src/components/results/MethodDetails.tsx` — renders `bp.basis`.
- `frontend/package.json` and `frontend/package-lock.json` — added Vitest/Testing Library smoke-test dependencies and `npm test`.
- `frontend/vite.config.ts` — added Vitest jsdom setup.
- `frontend/src/test/setup.ts` — jsdom cleanup and browser API shims for chart/component smoke tests.
- `frontend/src/test/interpolate-response.fixtures.ts` — backend-shaped response fixtures for linear points and `f(x)=1/x`.
- `frontend/src/components/results/results.smoke.test.tsx` — frontend smoke coverage for polynomial/evaluation rendering, Lagrange basis, Newton table, Neville table, barycentric weights, and graph data from backend response.
- `.gitignore` — excludes generated frontend install/build/test outputs while leaving frontend source trackable.
- `docs/API_CONTRACT.md` — made `basis_polynomials[].basis` explicit in the documented response notes.
- `docs/PLAN.md`, `docs/HANDOFF.md`, `docs/FRONTEND_HANDOFF.md` — recorded stabilization status, commands, risks, and next steps.

### Red/Green Evidence

First focused frontend test run after adding smoke tests:

```powershell
cd frontend
npm test
```

Result: FAIL as expected, 6 passed / 1 failed. The failing assertion was `renders backend Lagrange basis entries from the basis field`; rendered `<code>` nodes were empty because the frontend read `bp.expression`.

After the frontend-only fix:

```powershell
cd frontend
npm test
```

Result: PASS, 1 test file, 7 tests passed.

### Verification Commands

Backend, run from `backend/`:

| Command | Result |
|---|---|
| `python --version` | `Python 3.10.11` |
| `python -m pytest` | PASS — 43 passed in 2.15s |
| `python -m ruff check .` | PASS — all checks passed |
| `.\scripts\verify-backend.ps1` | PASS — 43 pytest tests passed, Ruff passed |

Frontend, run from `frontend/`:

| Command | Result |
|---|---|
| `npm run build` | PASS — TypeScript build and Vite production build completed |
| `npm run lint` | PASS — 0 errors |
| `npm test` | PASS — 1 test file, 7 tests passed |

### Tracking Decision

Recommended to commit:

- `frontend/` source/config/package files because it is the actual V1 React frontend baseline and now contains smoke tests that guard the backend contract. Do not commit generated `frontend/node_modules/`, `frontend/dist/`, coverage, or TypeScript build-info files.
- `PRODUCT.md` and `DESIGN.md` because current frontend docs and handoff files reference them as product/design source documents.
- `docs/HANDOFF.md` and `docs/FRONTEND_HANDOFF.md` because AGENTS.md requires them and they contain current integration state.
- `docs/API_CONTRACT.md` and `docs/PLAN.md` updates from this stabilization pass.
- `.gitignore` because it prevents accidental tracking of generated frontend outputs.

Recommended to keep ignored or separately curated:

- `.vscode/` because it currently contains only an empty `settings.json`.
- `.impeccable/` because it contains generated critique logs and many screenshots; keep only if the team intentionally wants audit artifacts in Git.
- `.kiro/` because it includes generated/local skill bundles and large screenshot/spec artifacts; commit only deliberately curated specs, not the whole local tool cache.

### Risks

- Python target mismatch remains: `backend/pyproject.toml` declares `requires-python = ">=3.11"` and Ruff target `py311`, but this machine's `python` is 3.10.11. Backend checks passed under 3.10.11 only; Python 3.11+ verification is NOT proven.
- The frontend is still untracked, so the fix and smoke tests are not protected by Git until the intended frontend baseline is staged/committed.
- `.kiro/` and `.impeccable/` are large/generated-looking and should not be blindly added.

### Next Steps

- Backend: install/select Python 3.11+ and rerun `python -m pytest`, `python -m ruff check .`, and `.\scripts\verify-backend.ps1`.
- Frontend/Opus: review the untracked frontend baseline and stage only `frontend/`, `PRODUCT.md`, `DESIGN.md`, and required docs; leave generated local tool caches out unless intentionally curated.


---

## Session: Safe V1 Baseline Commit Prep (2026-05-23)

### Scope

Prepared the stabilized V1 baseline for one local commit. No feature work, UI redesign, backend behavior change, endpoint path change, or interpolation logic change was made in this pass.

### Repo State Re-checked

```powershell
git status --short
 M .gitignore
 M docs/API_CONTRACT.md
 M docs/FRONTEND_HANDOFF.md
 M docs/HANDOFF.md
 M docs/PLAN.md
?? .impeccable/
?? .kiro/
?? .vscode/
?? DESIGN.md
?? PRODUCT.md
?? frontend/

git branch --show-current
codex/interpolation-backend-v1

git log --oneline -10
21b41c8 Document implemented interpolation backend contract
8d4cee3 docs: add interpolation backend implementation plan
2d1749c docs: add interpolation backend design spec
```

### Staging Decision

Staged intended baseline files only:

- `.gitignore`
- `PRODUCT.md`
- `DESIGN.md`
- `docs/API_CONTRACT.md`
- `docs/PLAN.md`
- `docs/HANDOFF.md`
- `docs/FRONTEND_HANDOFF.md`
- `frontend/` source, config, public assets, package manifest, package lock, and tests

Forbidden staged-path check returned no matches for:

- `node_modules/`
- `frontend/dist/`
- `frontend/coverage/`
- `frontend/*.tsbuildinfo`
- `.kiro/`
- `.impeccable/`
- `.vscode/`

`.vscode/settings.json` was inspected and contains only `{}`, so `.vscode/` remains untracked.

### Verification Before Commit

Backend, from `backend/`:

| Command | Result |
|---|---|
| `python --version` | `Python 3.10.11` |
| `python -m pytest` | PASS — 43 passed in 3.75s |
| `python -m ruff check .` | PASS — all checks passed |
| `.\scripts\verify-backend.ps1` | PASS — 43 pytest tests passed, Ruff passed |

Frontend, from `frontend/`:

| Command | Result |
|---|---|
| `npm run build` | PASS — TypeScript build and Vite production build completed |
| `npm run lint` | PASS — ESLint exited 0 |
| `npm test` | PASS — 1 test file, 7 tests passed |

### Remaining Risk

Python 3.11+ remains unverified. The active `python` command is Python 3.10.11, while `backend/pyproject.toml` declares `requires-python = ">=3.11"`.
