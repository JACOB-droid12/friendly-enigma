# Frontend Handoff — Interpolating Polynomial Program

## Status
Frontend v1.1 with UX improvements. Builds, lints, and type-checks clean. Live-tested against backend.

## Ownership Boundary
Claude Opus owns the React frontend. Codex owns the backend, numerical engine, tests, and API contract.

## Frontend Stack
- React 19.2.6 + TypeScript 6.0.3
- Vite 8.0.14 (build + dev server with proxy)
- Tailwind CSS 4.3.0 (via `@tailwindcss/vite`)
- **Official shadcn/ui v4 (base-nova style)** with `@base-ui/react` primitives
- KaTeX 0.17.0 for LaTeX rendering
- Recharts 3.8.1 for graph visualization (with Brush zoom)
- Lucide React 1.16.0 for icons
- class-variance-authority 0.7.1 for component variants
- **IBM Plex Sans Variable** (body/UI font via `@fontsource-variable/ibm-plex-sans`)
- Palatino/Iowan Old Style (math/heading serif accent, system font)
- JetBrains Mono / Fira Code (numeric/code values, system font)

## shadcn/ui Details
- Style: `base-nova` (shadcn v4 default)
- Primitive library: `@base-ui/react` (MUI Base UI)
- Components installed: alert, badge, button, card, input, label, separator, skeleton, switch, table, tabs
- Custom variants added: `warning` on Alert and Badge (for numerical stability warnings)
- Configuration: `components.json` at project root
- Native `<select>` kept for simple dropdowns

## Running the Frontend

Development:
```bash
cd frontend
npm run dev
```

The Vite dev server proxies `/api/*` and `/health` to `http://127.0.0.1:8000`.

Production build:
```bash
cd frontend
npm run build
npm run preview
```

## Running the Backend (required for integration)
```bash
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## API Integration Points

| Endpoint | Frontend Usage |
|---|---|
| `GET /health` | Polled every 30s for header status badge + Examples panel "Compute" visibility |
| `POST /api/validate-function` | Debounced inline validation (800ms after typing in function modes) |
| `POST /api/interpolate` | Main compute button + Examples "Load and Compute" |

## Frontend Does Not
- Recompute interpolation
- Parse or evaluate functions as source of truth
- Recompute barycentric weights
- Resample graph data
- Infer hidden precision behavior
- Use Math.js for computation

## Frontend Does
- Render backend-returned LaTeX via KaTeX
- Render backend-returned graph_data arrays via Recharts (with brush zoom)
- Display all warnings/errors from backend response
- Show method-specific details (basis polys, DD tables, weights, Neville tables)
- Provide input convenience (dynamic point lists, sliders, toggles)
- Route errors to appropriate UI locations
- Provide preset lecture examples that populate the form
- Validate function expressions inline (debounced, via backend)
- Detect duplicate x-values client-side in real-time
- Organize results with tabbed progressive disclosure

## Component Architecture
```
App
├── Header + HealthIndicator + QuickRef Toggle
├── ExamplesPanel (3 presets: Linear, 1/x, Runge)
├── InputPanel
│   ├── InputModeTabs (shadcn Tabs)
│   ├── PointsInput / XValuesInput / FunctionIntervalInput
│   ├── MethodSelector
│   ├── PrecisionSettings (shadcn Switch + native range)
│   ├── EvaluationTargets
│   └── GraphToggle (shadcn Switch)
├── InlineValidation (duplicate x-value warnings)
├── ActionBar (shadcn Button)
├── QuickReferenceCard (desktop sidebar + mobile collapsible)
├── ResultsPanel (tabbed)
│   ├── Tab Navigation (Overview | Polynomial | Evaluations | Graph | Methods | Notes)
│   ├── Overview: SummaryCard + WarningsDisplay + NodesTable
│   ├── Polynomial: PolynomialCard (Tabs + KaTeX + copyable)
│   ├── Evaluations: EvaluationTable (shadcn Table)
│   ├── Graph: GraphCard (Recharts + Brush + custom tooltip)
│   ├── Methods: MethodDetails (nested Tabs per method)
│   └── Notes: WarningsDisplay + EducationalNotes
└── Footer
```

## Results Tab Structure

The results area uses top-level tabs for progressive disclosure:

| Tab | Content | Default |
|---|---|---|
| Overview | Summary metrics, warnings, nodes table | Selected by default |
| Polynomial | Expanded/Factored/Lagrange/Newton forms with KaTeX | — |
| Evaluations | Cross-method comparison table | Disabled if no evaluation_x |
| Graph | f(x), P(x), nodes, error chart with brush zoom | Disabled if graph_data is null |
| Methods | Per-method details (nested tabs: Lagrange/Newton/Barycentric/Neville) | — |
| Notes | Educational notes + all warnings (badge shows count) | — |

## Examples Panel

Three preset examples available:

| Example | Mode | Data | Evaluation |
|---|---|---|---|
| Linear Lagrange | points | (2,4), (5,1) | x=3 → P(3)=3 |
| f(x) = 1/x | x_values_with_function | x=[2, 2.75, 4] | x=3 → P(3)=29/88 |
| Runge Phenomenon | function_interval | 1/(1+25x²), [-1,1], 11 nodes | x=0.9, 0.95 |

- "Load" fills the form without submitting
- "Compute" fills the form and immediately calls POST /api/interpolate
- "Compute" button only visible when backend health is OK

## Inline Validation

| Validation | Trigger | Method |
|---|---|---|
| Duplicate x-values | Real-time (useMemo) | Client-side comparison |
| Function expression | Debounced 800ms | POST /api/validate-function |
| Empty required fields | On compute attempt | Server-side (backend returns error) |

## Graph Rendering Rules (enforced)
- Only renders when `graph_data` is not null
- Uses `graph_data.x`, `graph_data.f_x`, `graph_data.P_x`, `graph_data.error`
- Null values become gaps (not zero)
- String values parsed to float only at chart boundary
- No frontend recomputation of f(x) or P(x)
- Nodes displayed as scatter points with coordinate tooltips
- Brush component enables x-axis zoom/pan

## Error Handling
- API errors with `code` field are routed to appropriate UI location
- Function-related errors (`unsafe_expression`, `function_domain_error`) shown near function input (inline)
- Other validation errors shown as top-level alert
- Method-local failures shown within method tabs
- Partial status handled gracefully (successful methods still display)

## Accessibility
- Results tabs use proper `role="tab"`, `aria-selected`, `aria-controls`
- KaTeX elements have `role="math"` and `aria-label` with formula content
- Warning/info notices use `role="alert"` with icon + text (not color alone)
- Quick Reference accessible on all screen sizes (toggle button on mobile/tablet)
- All interactive elements have visible focus states
- Tables have proper `<th>` headers

## Design System Documentation

### Files
| File | Purpose |
|---|---|
| `PRODUCT.md` (project root) | Strategic context: register, users, brand personality, anti-references, design principles, accessibility |
| `DESIGN.md` (project root) | Visual system: OKLCH tokens, typography, elevation, components, do's/don'ts |
| `.impeccable/design.json` | Sidecar: tonal ramps, motion/shadow tokens, self-contained component snippets |

### Creative North Star
**"The Analysis Bench"** — a polished scientific workbench for interpolation experiments.

### Anti-Patterns (Prohibited)
- Side-stripe borders (border-left > 1px as accent)
- Gradient text
- Decorative glassmorphism / backdrop-blur
- Bounce/elastic easing
- Nested cards
- Hero-metric template
- Hiding warnings for aesthetics
- Pure black/white
- Inter font

## Verification Commands

```bash
cd frontend
npx tsc -b          # TypeScript check
npm run build       # Production build
npm run lint        # ESLint
```

Expected: 0 errors, 3 warnings (react-refresh from shadcn/ui component files).

## Latest Verification Results (2026-05-23)
| Command | Result |
|---|---|
| `npx tsc -b` | PASS — 0 errors |
| `npm run build` | PASS — 959 kB JS, 82 kB CSS |
| `npm run lint` | PASS — 0 errors, 3 warnings |
| `impeccable detect frontend/src` | PASS — 0 findings |
| Live test: Linear Lagrange P(3)=3 | PASS ✓ |
| Live test: 1/x P(3)=29/88 | PASS ✓ |
| Live test: Runge warnings visible | PASS ✓ |
| Live test: Graph renders from backend data | PASS ✓ |
| Live test: Results tabs navigate | PASS ✓ |
| Live test: Interval mode layout full-width | PASS ✓ |
| Live test: X+f(x) mode layout full-width | PASS ✓ |


---

## 2026-05-23 — Frontend Analysis Bench Overhaul (Spec `frontend-analysis-bench-overhaul`)

The frontend was audited against `PRODUCT.md`, `DESIGN.md`, and `.impeccable/design.json` and remediated to match "The Analysis Bench" design system. Scope was strictly frontend; backend, API contract, request/response shapes, endpoint paths, and interpolation logic were NOT changed.

### Highlights

- **Three-Voice Typography is fully consistent.** A single canonical `.font-label` CSS handle (`index.css`) replaces every ad-hoc `text-[10px] uppercase tracking-wider font-medium` string. All math values use the canonical `font-numeric` stack (`'JetBrains Mono', 'Fira Code', 'SF Mono', 'Cascadia Code', monospace`) with `tabular-nums`, including Recharts axis ticks.
- **Mode layouts no longer feel cramped.** X+f(x) function input fills the full input-card width; each x-value row uses a labelled grid `[2rem_1fr_2rem]` with `min-w-[10rem]` so values do not collapse on add/remove. Interval mode uses `grid-cols-1 md:grid-cols-2` for `[a, b]` and `md:grid-cols-[2fr_1fr]` for strategy/count, stacking below md.
- **Errors lead with the human message, not the code.** New `ErrorNotice.tsx` component renders severity word in label voice → primary message → `Code: <code>` in numeric voice → recovery sentence (from a frontend-maintained map keyed on real backend codes: `too_few_nodes`, `duplicate_x`, `unsafe_expression`, `function_domain_error`, `invalid_interval`, `no_methods_selected`). Function-related errors render inline under the function input; other errors render as a top-level banner. Missing-message and both-missing fallbacks prevent empty notices.
- **Method emphasis is balanced.** Role tags now read **CONSTRUCTION / CONSTRUCTION / STABLE EVALUATOR / TARGET-SPECIFIC**, with Barycentric retaining a primary tint to mark it as the recommended evaluator without enlarging or reordering its card. Default selection is now Lagrange + Newton; Barycentric and Neville remain available.
- **Flat-at-Rest is enforced.** Header lost `bg-card/80` translucency. Compute button lost resting `shadow-sm`. Newton coefficient chips lost resting `shadow-sm` and inner `border`. KaTeX wrappers in `PolynomialCard` lost their inner `border`. Method Details surfaces (basis-polynomial, summation, divided-difference, nested-form) use only `bg-muted/30` tonal layering inside the parent card outline.
- **No nested cards.** `ResultsPanel` outer tab-bar card was flattened to `rounded-xl` only; tabs now read as section navigation, not a standalone outlined pill.
- **Tables are readable.** `NodesTable` and `EvaluationTable` headers route through `font-label`; both wrap their `<Table>` in a horizontal-scroll container so long rationals do not wrap rows. `EvaluationTable` `—` placeholders were replaced with the centered muted dot used in Method Details.
- **Visible focus on every interactive element.** Method-selector card wrappers carry `focus-within:ring-2 focus-within:ring-ring/50`; Select primitive aligned to 32px / `lg` radius / 3px ring; EvaluationTargets chip container carries `focus-within:ring-2 focus-within:ring-ring/50 focus-within:ring-inset`.

### Frontend type alignment

A pre-existing latent type mismatch in `frontend/src/lib/api-types.ts` was corrected during Group D:
- `NewtonResult.coefficients` was typed `Array<{index, value}>` → corrected to `string[]` (the backend's actual wire format).
- `NevilleResult.tables[].target_x`/`table` was corrected to `x`/`rows`.

The backend's wire format was always returning these shapes; the frontend types and renderer references are now aligned. **Backend was not modified.** This bug had been masked because the old default-method list excluded Neville and the example bench's 1/x scenario didn't include Neville either.

### Updated rendering rules
- **Graph still renders only from backend arrays.** `GraphCard.tsx` consumes `graph_data.x`, `graph_data.f_x`, `graph_data.P_x`, `graph_data.error`, and the node coordinates. No client-side resampling. Verified via DevTools network tab during Group G live tests (exactly one `POST /api/interpolate` per Compute; chart legend = `Nodes / P(x) / f(x)`).
- **Recharts axis ticks** route through the full canonical numeric voice fallback chain. Tabular-nums alignment of SVG ticks is a known Recharts limitation (SVG `<text>` does not pick up `font-variant-numeric` automatically).

### Default form change
`DEFAULT_FORM.methods` is now `["lagrange", "newton"]` (was `["lagrange", "newton", "barycentric"]`). Barycentric and Neville remain available via the method selector. This is the lecture-aligned default: construction first; the user opts into the stable evaluator and the target-specific recursion explicitly.

### Verification

| Command | Working dir | Result |
| --- | --- | --- |
| `npx tsc -b` | `frontend/` | PASS — 0 errors |
| `npm run build` | `frontend/` | PASS — 2454 modules, 1.21s, ~960 kB JS gzipped 286 kB |
| `npm run lint` | `frontend/` | PASS — 0 errors, 3 pre-existing shadcn `react-refresh/only-export-components` warnings |
| `impeccable detect frontend/src` | workspace root | PASS — 0 findings against project source |

### Live tests (against backend at 127.0.0.1:8000)

| Scenario | Result |
| --- | --- |
| Linear Lagrange P(3)=3 | PASS |
| 1/x at x=3 → 29/88 ≈ 0.32955, f(3)=1/3, error=1/264 | PASS |
| Newton DD table renders with header + per-node rows | PASS |
| Neville triangular tables render with target-x identifier | PASS |
| Barycentric weights table renders i / xᵢ / wᵢ | PASS |
| Runge warnings (HIGH DEGREE, RUNGE PHENOMENON) visible without user action | PASS |
| Graph renders only from backend `graph_data` arrays | PASS |

Screenshots saved at `.kiro/specs/frontend-analysis-bench-overhaul/screenshots/`.

### Remaining caveats
- Bundle size ~960 kB JS (pre-existing, would benefit from code-splitting, out of scope).
- shadcn primitive lint warnings are inherent to v4 primitive shape and accepted by Requirement 9.3.
- Recharts SVG ticks do not pick up `tabular-nums` automatically; cosmetic limitation.


---

## Frontend v1.2 Notes (2026-05-23)

### Display vs Compute Precision (NEW)

Compute precision (input form) and display precision (results) are now decoupled. The backend remains the source of truth and continues to receive `precision: <n>` and `exact: <bool>` per `docs/API_CONTRACT.md`.

The frontend introduces a display-only control next to the result tabs:

- Segmented `radiogroup`: `6 / 12 / 25 / Full` significant digits.
- Default: `12`.
- Implementation: `frontend/src/lib/format-numeric.ts` + `frontend/src/lib/display-digits.tsx` + `frontend/src/components/DisplayDigitsControl.tsx`.
- Behavior:
  - Integers (`-3`, `1`) and SymPy rationals (`1/26`, `-7/3`) pass through unchanged.
  - For decimals/scientific, budgets <15 round through `Number.toPrecision`. Budgets >=15 use string truncation to preserve the backend's exact text up to the budget.
  - "Full" passes through the backend string verbatim.
  - For the expanded polynomial, near-zero coefficients (|c| < 10^-(digits + 2)) are hidden with a visible "N near-zero terms hidden" message. "Full" disables this filter.

This addresses the Runge example readability problem: the backend can compute at 50 digits while the user reads 12.

### Keyboard Shortcuts (NEW)

Page-level shortcuts implemented in `frontend/src/lib/use-shortcuts.ts`:

| Shortcut | Action |
|---|---|
| `Ctrl/Cmd + Enter` | Compute (works from anywhere, including inside inputs) |
| `Alt + R` | Reset form |
| `?` | Toggle keyboard-shortcut overlay |

The Compute and Reset buttons expose `aria-keyshortcuts` so AT users discover the bindings. A small inline hint sits next to the action bar (`md:` and up).

### Theme Toggle (NEW)

`frontend/src/components/ThemeToggle.tsx` cycles `light → dark → system`. Selection persists in `localStorage` under `interp:theme`. `applyInitialTheme()` runs in `frontend/src/main.tsx` before React mounts to avoid flash-of-wrong-theme on first paint.

The existing `.dark` block in `frontend/src/index.css` is now wired up; previously it was unused.

### Accessibility Improvements

- `KatexDisplay` no longer reads raw LaTeX to screen readers. Visible KaTeX is `aria-hidden`, an adjacent `sr-only` span carries the rounded plain-text expression. Callers (`PolynomialCard`) pass the rounded `formatPoly().text` so the SR announcement matches what is on screen.
- Node Count input now has native `min={2} max={50} step={1} inputMode="numeric"` so the a11y tree reports correct bounds and the browser enforces them.
- Precision slider now exposes `aria-valuetext="<n> significant digits"`.
- HealthIndicator pairs the status dot with `Check` / `X` / `Loader2` icons + text label so severity is never carried by color alone.
- Result-tab disabled state contrast lifted from `text-muted-foreground/40` to `text-muted-foreground/60`.

### Warnings Library

`frontend/src/lib/warnings.ts` is the single source of truth for warning code → label + severity. `WarningsDisplay` and (transitively) `ResultsPanel` consume it. New backend warning codes should be added to the `CATALOG` map alongside any update to `docs/API_CONTRACT.md`.

### Method Selector Roles (CHANGED)

Role badges retuned from method-class taxonomy (`Construction` / `Stable Evaluator` / `Target-Specific`) to user-task labels:

| Method | Role |
|---|---|
| Lagrange | TEACH |
| Newton | VERIFY |
| Barycentric | PLOT (highlighted, primary tint) |
| Neville | TARGET |

Barycentric retains the primary tint because it is the unique source of graph data per the API contract.

### Anti-Pattern Status

`node .kiro/skills/impeccable/scripts/detect.mjs --json --fast frontend/src` returns `[]`. Live page audit reports 0 elements with `border-left >= 2px`, 0 `backdrop-filter`, 0 gradient backgrounds, 0 `background-clip: text` rules.


---

## Frontend v1.3 Hardening Notes (2026-05-23)

### Polynomial-form correctness (NEW)

The display-precision pipeline now branches on grammar:

| Backend field | Grammar | Display function | Why |
|---|---|---|---|
| `polynomial.expanded` | top-level sum of monomials | `formatPoly` | Round each monomial coefficient and hide near-zero terms (high-precision floating-point noise). |
| `polynomial.factored` | product / quotient of factors | `formatLiterals` | Operators and parens carry meaning; only literals round. |
| `polynomial.lagrange_form` | sum of basis-product terms | `formatLiterals` | Same. |
| `polynomial.newton_form` | nested product Horner | `formatLiterals` | Same. |
| Lagrange basis polynomials | product of `(x - x_k)` factors | `formatLiterals` | Same. |
| Lagrange summation form | sum of basis * y_i terms | `formatLiterals` | Same. |
| Newton nested form (per method) | nested product Horner | `formatLiterals` | Same. |

`formatLiterals` (in `frontend/src/lib/format-numeric.ts`) walks the string with a regex that matches numeric literals only (`(\d+\.\d+|\d+)([eE][+-]?\d+)?`) and replaces them through `roundNumericString`. Operators (`+`, `-`, `*`, `/`), parentheses, identifiers (`x`, `pi`), and structural tokens are left exactly as the backend emitted them. The function never splits, drops, or merges tokens.

`formatPoly` retains its near-zero-coefficient hiding because that is mathematically meaningful only when the coefficient is at the top level. Inside a parenthesised inner expression, even a small literal can be structurally critical, so `formatLiterals` does NOT hide near-zero literals.

### Assistive-tech table headers (NEW)

Tables that mix Latin letters and HTML `<sub>` tend to render as garbled letter-by-letter strings on the accessibility tree. The fix:
- Wrap the `<sub>i</sub>` content in `aria-hidden="true"` so the screen reader does not read the "i" as a separate node.
- Set an explicit `aria-label` on the parent `<th>` / header span. Examples:
  - `aria-label="row index"` for the index column.
  - `aria-label="x sub i (input value)"` and `aria-label="y sub i (output value)"` on Points and Nodes tables.
  - `aria-label="x sub i (node value)"` and `aria-label="w sub i (barycentric weight)"` on the barycentric weights table.
  - `aria-label="absolute error"` on the `|Error|` column.
  - `aria-label="f at x sub i"` and `aria-label="delta {k} divided difference"` on the Newton DD table.
  - `aria-label="P sub {k} (Neville approximation column)"` on Neville triangles.

This applies to: `frontend/src/components/PointsInput.tsx`, `frontend/src/components/results/NodesTable.tsx`, `frontend/src/components/results/EvaluationTable.tsx`, `frontend/src/components/results/MethodDetails.tsx`.

### DisplayDigitsControl deduplication (NEW)

The previous build mounted two instances of `<DisplayDigitsControl />` (a desktop one and a `md:hidden` mobile copy) so the DOM contained 8 radios when only 4 were visible. The result: voice-control users could hit the hidden instance, and DOM testing was brittle.

The single control is now placed inside a flex container that stacks (`flex-col`) at small widths and lays out side-by-side (`md:flex-row`) at medium and up. No CSS-hidden duplicate exists.

### Theme toggle WCAG 2.5.3 (NEW)

Lighthouse `label-content-name-mismatch` flagged the toggle as serious because the visible text ("System") was not a substring of the accessible name ("Switch to light mode"). Voice-control users saying "Click System" could not trigger it.

The toggle now renders the visible label first, then disambiguates with the next state in `aria-label`:
- Visible: "Light"; aria-label: "Light theme, switch to dark".
- Visible: "Dark"; aria-label: "Dark theme, switch to system".
- Visible: "System"; aria-label: "System theme, switch to light".

### Method roles restored (CHANGED)

The v1.2 build relabelled method roles to `TEACH / VERIFY / PLOT / TARGET`. v1.3 restores the canonical project-requirement labels:

| Method | Role |
|---|---|
| Lagrange | Construction |
| Newton | Construction |
| Barycentric | Stable Evaluator |
| Neville | Target-Specific |

Visual treatment was softened so the labels do not yell: lower weight (`font-normal`), no `font-label` (no uppercase, no letterspacing), `text-muted-foreground` for the unhighlighted three, `text-primary/80` only for Barycentric (it is the unique source of graph data per the API contract).

### Meta description, footer copy, --success token (POLISH)

- `frontend/index.html` now sets `<meta name="description">` describing the workbench. Lighthouse SEO category went from 60 to 80 as a result.
- Footer copy reads "Computed by SymPy and mpmath at your chosen precision" instead of the prior developer-shaped phrasing.
- `DESIGN.md` documents the new `--success` token and updates the Semantic Honesty Rule to include success.

### Lighthouse Status

Latest snapshot (desktop, with the 1/x example loaded and Methods tab active):

| Category | Score |
|---|---|
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 80 |
| Agentic Browsing | 50 |

Two remaining failures: `robots-txt` and `llms-txt`. Both are out-of-scope for a localhost workbench.

### Anti-Pattern Status

`node detect.mjs --json --fast frontend/src` -> `[]`. Live page DOM audit reports 0 elements with `border-left >= 2px`, 0 `backdrop-filter`, 0 gradient backgrounds, 0 `background-clip: text` rules.

### Hard Rules Reaffirmed

- Backend behavior unchanged this pass.
- Endpoint paths and JSON contract unchanged.
- Interpolation logic unchanged.
- Frontend renders backend results only.


---

## Frontend V1 Stabilization Contract Fix (2026-05-23)

### Issue Fixed

Backend Lagrange basis entries use the wire field `basis`. The frontend type and renderer expected `expression`, so the Method Details Lagrange basis list rendered blank values even though the backend response was correct.

### Frontend Contract Update

- `frontend/src/lib/api-types.ts`: `LagrangeResult.basis_polynomials[]` now matches the backend shape:
  - `index`
  - `x_i`
  - `basis`
  - `expanded`
  - `latex`
- `frontend/src/components/results/MethodDetails.tsx`: renders `formatLiterals(bp.basis)`.
- The backend response shape was not changed.
- No interpolation logic moved into React.

### Smoke Coverage Added

New command:

```powershell
cd frontend
npm test
```

The test suite covers:

- Linear points `(2,4), (5,1)`, expected `P(x)=6-x`, `P(3)=3`.
- Function example `f(x)=1/x` with nodes `2`, `2.75`, `4`, evaluation `x=3`, expected `P(3)=29/88`, `f(3)=1/3`, `|error|=1/264`.
- Lagrange basis entries render from backend `basis`.
- Newton divided-difference table renders.
- Neville triangular table renders.
- Barycentric weights render.
- Graph card renders backend-provided `graph_data` arrays and `source_method`; no frontend resampling.

### Verification

| Command | Working dir | Result |
|---|---|---|
| `npm run build` | `frontend/` | PASS — TypeScript build and Vite production build completed |
| `npm run lint` | `frontend/` | PASS — 0 errors |
| `npm test` | `frontend/` | PASS — 1 test file, 7 tests passed |

### Opus Notes

- Keep reading `docs/API_CONTRACT.md` as the backend wire contract.
- For Lagrange basis output, use `methods.lagrange.basis_polynomials[].basis`; do not expect `expression`.
- Continue treating graph data as backend-owned arrays; React should only parse values at the chart boundary.


---

## Frontend v1.4 Colorize Pass (2026-05-23)

Strategic color enrichment within the existing Indigo-Slate "Analysis Bench" register. No palette change, no recoloring; just extending the role taxonomy already used by `MethodSelector` and the warning vocabulary into surfaces that previously read as monochrome neutrals. The Semantic Honesty Rule remains intact: every color introduced still means what it meant before.

### New badge variants

`frontend/src/components/ui/badge.variants.ts` gains two variants:

| Variant | Token roles | Light | Dark |
|---|---|---|---|
| `info` | bg `info/10`, text `info-foreground`, border `info/30` | cyan-data | brighter cyan |
| `success` | bg `success/10`, text `success-foreground`, border `success/30` | green-leaning | brighter green |

These bind to existing CSS custom properties (`--info`, `--success`) already declared in `frontend/src/index.css`. No new tokens were introduced.

### SummaryCard role taxonomy and Mode chip

`frontend/src/components/results/SummaryCard.tsx`:

- The status chip (`ok` / `partial` / `error`) now uses the `success` variant for `ok` instead of `default` (primary). This restores the Semantic Honesty Rule for "positive system status" already established by `HealthIndicator`. Primary stays reserved for "interactive or selected".
- The "Mode" cell renders as a tinted Badge instead of a body-voice word so the four-cell rhythm in the summary stays in the numeric/label voice. `Exact` (rationals) reads primary, `Numeric` (mpmath floats) reads `info`.
- The methods row carries per-method role tints keyed to the same taxonomy as `MethodSelector`:

| Method | Role | Badge variant |
|---|---|---|
| Lagrange | Construction | `secondary` |
| Newton | Construction | `secondary` |
| Barycentric | Stable Evaluator | `default` (primary) |
| Neville | Target-Specific | `info` |

### MethodDetails active-tab tints

`frontend/src/components/results/MethodDetails.tsx` adds a `METHOD_TAB_TINT` map that applies the same role taxonomy on the active state of each method tab:
- Construction methods keep the neutral lifted-pill active state.
- Barycentric uses `data-active:bg-primary/10 data-active:text-primary` (with dark-mode variants).
- Neville uses `data-active:bg-info/10 data-active:text-info-foreground` (with dark-mode variants).

This way the role color a user selected methods with in the Methods picker echoes back on every method-related surface (selector, summary chip, active tab), making the role taxonomy the through-line.

### ExamplesPanel category tints

`frontend/src/components/ExamplesPanel.tsx`: the per-example category tag was a flat gray pill; it now renders as a tinted `Badge` so the category encodes what each example demonstrates without rereading the subtitle:

| Category | Badge variant | Why |
|---|---|---|
| Lecture | `default` (primary) | Curriculum entry, the canonical worked example |
| Function | `info` (cyan) | Explores an analytic f(x); informational |
| Demo | `warning` (amber) | The Runge example IS the cautionary tale; amber pre-flags the warning bar that example will produce |

Amber retains its single app-wide meaning (numerical caution). The ExamplesPanel `Example.category` type was tightened from `string` to a discriminated union so a typo cannot silently fall through.

### DESIGN.md update

The `Badges / Method Tags` section now documents:
- The full variant set (primary, secondary, warning, info, success, outline, destructive, ghost, link).
- The method role taxonomy and which surfaces enforce it.
- The Mode chip rule.
- The example category tint table.
- The Result Summary status chip mapping.

### What did not change

- No new colors. No palette swap. Every tint references existing tokens.
- No new motion handles, no new typography handles.
- No anti-pattern violations. No side stripes, no gradient text, no glassmorphism, no hero-metric template.
- The Method Details list itself stays a single tab list (the tint is per-trigger active state, not per-trigger background; sibling triggers stay neutral).

### Verification

| Command | Working dir | Result |
| --- | --- | --- |
| `npm run build` | `frontend/` | PASS — 2553 modules, 1.66s. Bundles: index 393 kB / 120 kB gzip, GraphCard 378 kB / 110 kB gzip, PolynomialCard 264 kB / 79 kB gzip. CSS 61 kB / 11 kB gzip. |
| `npm run lint` | `frontend/` | PASS — 0 errors, 0 warnings. |
| `getDiagnostics` on touched files | n/a | PASS — 0 issues. |

### Live tests (against backend at 127.0.0.1:8000)

Screenshots saved at `.impeccable/critique/screens/` with `colorize-after-*` prefix.

| Scenario | Result |
| --- | --- |
| Empty form + Examples panel category tints | PASS — Lecture (primary), Function (info), Demo (warning amber) all render distinct |
| Linear Lagrange overview, status `ok` reads green | PASS |
| Linear Lagrange Mode chip reads `Exact` (primary) | PASS |
| Linear Lagrange method badges color-coded by role | PASS — Lagrange/Newton (secondary), Barycentric (primary), Neville (info-cyan) |
| Runge overview, Mode reads `Numeric` (info-cyan) | PASS |
| Method Details active tab tinted per role: Lagrange (neutral), Barycentric (primary), Neville (info) | PASS |
| Same role tints render correctly in dark mode | PASS |

### Hard Rules Reaffirmed

- Backend behavior unchanged this pass.
- Endpoint paths and JSON contract unchanged.
- Interpolation logic unchanged.
- Frontend renders backend results only.
