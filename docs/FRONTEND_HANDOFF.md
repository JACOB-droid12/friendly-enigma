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
| `GET /health` | Polled every 30s for header status badge and app-level Compute availability |
| `POST /api/validate-function` | Debounced inline validation (800ms after typing in function modes) |
| `POST /api/interpolate` | Main compute button and keyboard shortcut only |

## Phase 2 Backend Expansion

P2.0 backend contract prep accepts Phase 2 method names under the stable `POST /api/interpolate` endpoint. P2.1 implements equal-spacing methods. P2.2 implements first-derivative Hermite methods. P2.3 implements Taylor polynomials. P2.4 implements natural cubic spline segments. P2.5 audit is complete with release caveats documented in `docs/PHASE_2_FINAL_AUDIT.md`. If Claude Opus exposes a deferred or ineligible Phase 2 method, the frontend must render the method-level error returned under `methods.<method>.error` and must not simulate the method client-side.

P2.5 frontend integration status:

- Backend payloads for `newton_forward`, `newton_backward`, `stirling`, `hermite_divided_difference`, `hermite`, `taylor`, and natural `cubic_spline` are ready for Claude Opus rendering work.
- `osculating` remains accepted by schema but deferred; render its `method_not_implemented` method-level error until the backend implements generalized derivative-order repeated nodes.
- Codex did not implement Phase 2 React controls/renderers during P2.5.
- `npm run build`, `npm run lint`, and `npm test` passed during P2.5 verification.
- Browser QA for actual Phase 2 method flows is still pending because those frontend flows are not implemented yet.

Accepted Phase 2 method names:

| Method | Family | Frontend role |
|---|---|---|
| `newton_forward` | Equal spacing | Finite-difference construction near the first nodes |
| `newton_backward` | Equal spacing | Finite-difference construction near the last nodes |
| `stirling` | Equal spacing | Centered finite-difference construction |
| `hermite_divided_difference` | Derivative data | Repeated-node divided-difference construction |
| `hermite` | Derivative data | Hermite basis / derivative-matching construction when backend supports it |
| `osculating` | Derivative data | Generalized derivative matching after Hermite is stable |
| `taylor` | Function derivative | Local polynomial approximation from safe symbolic derivatives |
| `cubic_spline` | Piecewise | Natural cubic spline segments and backend graph samples |

Optional request blocks now documented in `docs/API_CONTRACT.md`:

- `method_options`: method-specific config keyed by method name.
- `derivatives`: string-valued derivative data objects with `x`, `order`, and `value`.

Frontend ownership rule remains unchanged:

- React may render method cards, config controls, derivative input tables, finite-difference tables, Hermite repeated-node tables, Taylor terms, spline segments, warnings, and backend graph arrays.
- React must not compute finite differences, Hermite tables, Taylor terms, spline coefficients, graph samples, interpolated values, or errors.
- Barycentric stays a stable evaluator / graph-support method, not the main classroom construction method.

### P2.1 Equal-Spacing Payloads

Backend P2.1 implements:

- `newton_forward`
- `newton_backward`
- `stirling`

Frontend rendering rules:

- Render `methods.newton_forward.forward_difference_table` exactly as a finite-difference table.
- Render `methods.newton_backward.backward_difference_table` exactly as a finite-difference table.
- Render `methods.stirling.centered_difference_table` as the centered/Stirling table artifact returned by the backend.
- Render `spacing_h`, `anchor_index`, `center_index`, `center_x`, `s`, `terms`, and `target_guidance` as backend facts.
- If `target_guidance.recommended` differs from the selected method, show it as guidance only. Do not auto-switch methods on the frontend.
- For method-level errors such as `unequal_spacing` or `stirling_requires_centered_nodes`, show the returned error message and code.
- Do not calculate finite differences in React.

### P2.2 Derivative-Data Payloads

Backend P2.2 implements:

- `hermite_divided_difference`
- `hermite`

Backend P2.2 explicitly defers:

- `osculating` - still accepted by schema, but returns `method_not_implemented` because the backend helper currently supports first-derivative Hermite only, not generalized derivative orders.

Request rules:

- Send derivative data through the existing `derivatives` array with string-valued `x` and `value`, and integer `order`.
- For P2.2 Hermite, use `order: 1` only.
- Provide one first derivative for every interpolation node.
- If derivative data is missing or unsupported, render the method-level error returned by the backend. Do not fill or estimate derivatives in React.

Frontend rendering rules:

- Render `methods.hermite_divided_difference.repeated_nodes` as backend-owned repeated-node metadata.
- Render `methods.hermite_divided_difference.divided_difference_table` as a triangular repeated-node divided-difference table.
- Render `methods.hermite_divided_difference.coefficients`, `nested_form`, `expanded`, `latex_expanded`, `latex_hermite`, `evaluations`, `steps`, `warnings`, and `error` exactly as returned.
- Render `methods.hermite` the same way, plus `methods.hermite.basis_form` when `basis_form.status === "included"`.
- If `basis_form.status === "omitted"`, show the backend reason/warning rather than reconstructing the basis.
- The top-level `polynomial.hermite_form` and `polynomial.latex_hermite` may be present when Hermite is the selected polynomial source.
- Do not calculate repeated nodes, divided differences, Hermite basis terms, derivative matches, evaluations, graph samples, or errors in React.

Recommended Phase 2 UI additions for Claude Opus:

- Derivative input table keyed to the point/node rows.
- Method cards for `hermite_divided_difference` and `hermite` under the derivative-data family.
- Repeated-node table renderer.
- Hermite basis renderer with included/omitted states.
- Lecture example preset for the Bessel-style nodes `1.3`, `1.6`, `1.9`, first derivatives, and evaluation `x = 1.5`.
### P2.3 Taylor Payloads

Backend P2.3 implements:

- `taylor`

Request rules:

- Use the existing `function` field plus `method_options.taylor.center` and `method_options.taylor.order`.
- `center` must remain a string at the API boundary.
- `order` must be an integer from 0 through 20.
- The current backend still normalizes through an existing request mode, so Taylor examples should use `x_values_with_function` or `function_interval` until a future contract revision says otherwise.
- Render backend method-level errors such as `unsupported_taylor_function`; do not repair Taylor configuration or derivative terms in React.

Frontend rendering rules:

- Render `methods.taylor.center`, `order`, `series_name`, `terms`, `taylor_form`, `expanded`, `latex_expanded`, `latex_taylor`, `evaluations`, `remainder_note`, `steps`, `warnings`, and `error` exactly as returned.
- Render `terms` as derivative-term rows: order, derivative, derivative-at-center, coefficient, term, and LaTeX term.
- The top-level `polynomial.taylor_form` and `polynomial.latex_taylor` may be present when Taylor is the selected polynomial source.
- Do not calculate symbolic derivatives, Taylor coefficients, Taylor terms, Taylor polynomial values, graph samples, or errors in React.

Recommended Phase 2 UI additions for Claude Opus:

- Taylor config panel for center and order.
- Taylor term table/renderer.
- Lecture example preset for `f(x)=cos(x)`, center `0`, order `3`, evaluation `x=1/2`.
- Maclaurin label when `series_name` is returned as `Maclaurin`.
### P2.4 Cubic Spline Payloads

Backend P2.4 implements:

- `cubic_spline`

Request rules:

- Use `method_options.cubic_spline.boundary_condition = "natural"`.
- Other boundary conditions return method-level error code `unsupported_boundary_condition`.
- Existing point/function modes still provide the nodes; the spline method owns ordering and segment generation.

Frontend rendering rules:

- Render `methods.cubic_spline.ordered_nodes`, `second_derivatives`, `segments`, `continuity_checks`, `evaluations`, `steps`, `warnings`, and `error` exactly as returned.
- Render `segments` as piecewise interval rows with local coefficients `a`, `b`, `c`, `d`, `local_form`, expanded segment, and LaTeX.
- If the top-level `polynomial.expanded_omitted_reason` is `piecewise_method_no_global_polynomial`, show that the spline has piecewise segments instead of a single global polynomial.
- If `graph_data.source_method === "cubic_spline"`, render graph arrays exactly as returned. Do not resample the spline in React.
- Do not calculate spline coefficients, segment values, continuity checks, graph samples, or errors in React.

Recommended Phase 2 UI additions for Claude Opus:

- Natural spline boundary selector, with only `natural` enabled unless a later backend milestone adds more.
- Piecewise segment table.
- Continuity-check panel for interior knots.
- Segment-boundary display on the graph or method panel using backend interval metadata.
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
- Show Guided Explanation / Defense Notes from existing backend response fields
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
├── ExamplesPanel (4 lecture-aligned prefill examples)
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
│   ├── Tab Navigation (Overview | Guide | Polynomial | Evaluations | Graph | Methods | Notes)
│   ├── Overview: SummaryCard + WarningsDisplay + NodesTable
│   ├── Guide: GuidedExplanation
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
| Guide | Guided Explanation / Defense Notes for presenting backend output | — |
| Polynomial | Expanded/Factored/Lagrange/Newton forms with KaTeX | — |
| Evaluations | Cross-method comparison table | Disabled if no evaluation_x |
| Graph | f(x), P(x), nodes, error chart with brush zoom | Disabled if graph_data is null |
| Methods | Per-method details (nested tabs: Lagrange/Newton/Barycentric/Neville) | — |
| Notes | Educational notes + all warnings (badge shows count) | — |

## Guided Explanation / Defense Notes

`frontend/src/components/results/GuidedExplanation.tsx` renders a classroom-friendly guide from the existing `InterpolateResponse` only. It does not call the API and does not recompute interpolation values.

| Explanation item | Backend response fields used |
|---|---|
| Input type | `input_summary.mode` |
| Number of nodes | `input_summary.node_count` |
| Expected polynomial degree | `input_summary.degree` |
| Selected methods | `input_summary.methods_requested` |
| Polynomial result | `polynomial.expanded`, then `polynomial.expanded_omitted_reason` fallback |
| Evaluation result | `evaluations[].x`, `evaluations[].best_P_x`, `evaluations[].f_x`, `evaluations[].absolute_error` |
| Warnings | `warnings[].code`, `warnings[].message` |
| Lagrange guide | Presence of `methods.lagrange` and `basis_polynomials.length` |
| Newton guide | Presence of `methods.newton` and `divided_difference_table.length` |
| Neville guide | Presence of `methods.neville` and `target_results[].x` |
| Barycentric guide | Presence of `methods.barycentric` and `graph_data.source_method` |

Lecture/source grounding from `Lecture/Lecture.txt` and `Lecture/pasted.txt`:

- Lagrange is described as the classroom construction method using basis polynomials through supplied nodes.
- Newton is described through divided differences and Newton form.
- Neville is described as a recursive target-specific table.
- Barycentric was not found in the lecture text, so the Guide tab describes it only as stable numerical evaluation and graph support.

Lecture-covered but out-of-scope topics for this V1+ frontend goal: Newton forward/backward differences, Stirling / centered differences, osculating and Taylor polynomials, Hermite interpolation, and cubic splines.

## Examples Panel

Four lecture-aligned preset examples are available. Loading an example fills the existing form fields and method selections only; it does not call `POST /api/interpolate`.

| Example | Mode | Data | Evaluation |
|---|---|---|---|
| Linear Lagrange | points | (2,4), (5,1) | x=3; lecture note says `P(x)=6-x` |
| Second-Degree Lagrange | x_values_with_function | `function=1/x`, x=[2, 2.75, 4] | x=3 |
| Neville Table | points | (1.0,0.7651977), (1.3,0.6200860), (1.6,0.4554022), (1.9,0.2818186), (2.2,0.1103623) | x=1.5 |
| Newton Divided Difference | points | Same five-point lecture table | x=1.5 |

- The Linear and Second-Degree Lagrange examples select only `lagrange`.
- The Neville Table example selects `neville`, `lagrange`, and `newton`.
- The Newton Divided Difference example selects only `newton`.
- The function example may still trigger the existing debounced backend function validation after load; this is not interpolation computation.

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

Expected: `npm run build`, `npm run lint`, and `npm test` exit 0. Current lint expectation is 0 errors and 0 warnings.

## Latest Verification Results (2026-05-24)
| Command | Result |
|---|---|
| `npm test -- GuidedExplanation.test.tsx` | PASS — 1 test file, 3 tests passed |
| `npm run build` | PASS — TypeScript build and Vite production build completed |
| `npm run lint` | PASS — 0 errors, 0 warnings |
| `npm test` | PASS — 3 test files, 13 tests passed |
| Browser smoke with Vite + local backend | PASS — Guide tab rendered for Linear Lagrange with `points mode`, 2 nodes, degree 1, `6 - x`, and `P(3) = 3` |
| `git status --short backend/` | PASS — empty output; no backend files changed |

### Latest Example-Library Test Coverage

`frontend/src/App.examples.test.tsx` verifies:

- Linear Lagrange loads `(2,4)`, `(5,1)`, evaluation `x=3`, selects `lagrange`, and does not call `/api/interpolate`.
- Second-Degree Lagrange loads `x_values_with_function`, `function=1/x`, x-values `2`, `2.75`, `4`, evaluation `x=3`, and selects only `lagrange`.
- Neville Table loads all five lecture points, evaluation `x=1.5`, and selects `neville`, `lagrange`, and `newton`.


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


---

## Frontend Design System Overhaul — Polish Pass (2026-05-24)

Polish pass on top of the `frontend-analysis-bench-overhaul` baseline. This is **the smallest controlled set of edits** that takes the surface from "design-system aligned" to "premium, modern scientific workbench" without changing the API contract, the numerical engine, the design tokens, the typography voices, the focus rings, or the motion handles. Every audit elsewhere came back compliant; only the five edits below carry behavior.

### Behavioral Changes (the only new behavior in this pass)

1. **X + f(x) row input minimum width at md+.** `frontend/src/components/XValuesInput.tsx` — each x-value row Input class now ends with `md:min-w-[10rem]`. At viewport widths of 768px and above the row's numeric input is pinned to at least 160px even when the surrounding column shrinks; below 768px the constraint is dropped automatically and the input collapses to fill the input card content width.

2. **Interval mode field labels in label voice.** `frontend/src/components/FunctionIntervalInput.tsx` — the four labels ("Interval Start (a)", "Interval End (b)", "Node Strategy", "Node Count") now read in the design-system label voice (`<Label className="font-label text-muted-foreground">`). The inline `<span className="font-numeric">a</span>` and `<span className="font-numeric">b</span>` math symbols are preserved, so the surrounding label is in label voice while the symbols themselves stay in numeric voice (Three-Voice Rule).

3. **Compute blocked when Node Count is out of range.** `frontend/src/App.tsx` — derived `isFormBlocked` boolean fires when `form.mode === "function_interval"` and `Number.isFinite(form.nodeCount) && (form.nodeCount < 2 || form.nodeCount > 50)`. The flag joins the existing Compute `disabled` predicate (alongside `loading || !backendOnline`) and the `aria-disabled` annotation. The `computeDisabledReason`/`title` mechanism reads `Node count out of range (2–50)` when the flag is set. Submission is blocked at the action bar; the request shape is unchanged and the value is not silently clamped.

4. **Canonical Method Selector descriptions and role-tag voice.** `frontend/src/components/MethodSelector.tsx`:
   - Lagrange: "Lagrange shows basis polynomials and summation form."
   - Newton: "Newton shows divided-difference tables and nested form."
   - Barycentric: "Barycentric provides stable evaluation and is the source for graph data."
   - Neville: "Neville produces target-specific triangular tables."
   The role-tag span now uses `font-label text-muted-foreground` (with `font-label text-primary/80` on Barycentric only). Role strings stay exactly `Construction` / `Construction` / `Stable Evaluator` / `Target-Specific`. Card order, layout, padding, weight, and per-card geometry are unchanged; the only differentiator across the four cards remains the Barycentric tint.

5. **Method Details initial-tab fallback guard.** `frontend/src/components/results/MethodDetails.tsx` — small pure helper at the top of the file:
   ```ts
   function pickInitialTab(available: MethodName[]): MethodName {
     const classroom: MethodName[] = ["lagrange", "newton", "neville"]
     const first = classroom.find((m) => available.includes(m))
     if (first) return first
     return available[0] ?? "lagrange"
   }
   ```
   The initial-tab `useState` now calls `pickInitialTab(availableMethods)`. The default tab is the first available Classroom-Facing Method evaluated in the order Lagrange → Newton → Neville, and falls back to whatever is available (for example Barycentric only) when no Classroom-Facing Method is present. Panel layouts, headers, role tints, and per-method content are unchanged.

### Audit-and-Confirm (no behavioral change)

Everything else in this pass is audit-and-confirm against the prior spec's baseline. The following surfaces were inspected and found compliant:

- **Foundation.** `frontend/src/index.css` (OKLCH tokens, four typography handles, motion handles all neutralized under `prefers-reduced-motion: reduce`); `components/ui/input.tsx`, `select.tsx`, `switch.tsx`, `tabs.tsx`, `button.tsx`, `button.variants.ts`, `table.tsx` (canonical 32px / `rounded-lg` / 3px focus ring at `ring/50`, default Button variant flat at rest, table row separation and scroll wrapper).
- **Math input typography.** Function expression and x-value rows in `XValuesInput.tsx` carry `font-numeric`; numeric inputs in `FunctionIntervalInput.tsx` carry `font-numeric`; chip wrapper in `EvaluationTargets.tsx` carries `focus-within:ring-2 focus-within:ring-ring/50 focus-within:ring-inset` with chip width `w-32`; severity word in `WarningsDisplay.tsx` is `font-label`; `<TableHead>` cells in `NodesTable.tsx`, `EvaluationTable.tsx`, and `MethodDetails.tsx` use `font-label`.
- **Error and warning hierarchy.** `App.tsx` routes `unsafe_expression` and `function_domain_error` to `functionError` outside Points mode and to `topError` inside Points mode; `XValuesInput.tsx` and `FunctionIntervalInput.tsx` wire inline `ErrorNotice` through `aria-describedby` (`function-error` / `fn-interval-error`); `lib/warnings.ts` carries the canonical labels for every documented code; `ErrorNotice.tsx` code-to-guidance map has exactly the six allowed keys (`too_few_nodes`, `duplicate_x`, `unsafe_expression`, `function_domain_error`, `invalid_interval`, `no_methods_selected`); `MethodDetails.tsx` per-method `MethodError` / `MethodWarnings` delegate to `ErrorNotice`.
- **Results panel and chrome.** `App.tsx` masthead is opaque `bg-card` with `border-b sticky top-0 z-10` and no `backdrop-blur`, Compute is flat at rest; `ResultsPanel.tsx` persistent warning bar above the tab list, sticky `top: var(--header-h, 60px)` opaque `bg-background` tab nav, `overflow-x-auto`, active tab `bg-primary/10 text-primary`, Notes count badge in `warning` variant; `SummaryCard.tsx` four-cell grid with status chip and per-method badge taxonomy; `PolynomialCard.tsx` KaTeX `bg-muted/30 rounded-lg p-4` containers without inner border, `<pre>` `overflow-x-auto whitespace-pre-wrap break-all`; `EvaluationTable.tsx` columns and missing-cell glyph (centered muted dot with `aria-label="not available"`) inside `overflow-x-auto rounded-lg`; `GraphCard.tsx` consumes only `graph_data.x | f_x | P_x | error` and node coordinates with `--graph-*` token routing and the canonical `aria-label`; `NodesTable.tsx` and `EducationalNotes.tsx`; `HealthIndicator.tsx` token-aliased colors paired with icon and text label; `MethodSelector.tsx` corner indicator absent and four cards equal-prominence.

### Verification

| Command | Working directory | Exit | Notes |
| --- | --- | --- | --- |
| `npm run build` | `frontend/` | 0 | `tsc -b` clean; Vite emitted index 393.80 kB / 120.48 kB gz, PolynomialCard 263.59 kB / 79.12 kB gz, GraphCard 378.37 kB / 109.63 kB gz, CSS 61.56 kB / 10.92 kB gz. 1.79 s. |
| `npm run lint` | `frontend/` | 0 | Zero ESLint errors and no warnings. |
| `npm test` | `frontend/` | 0 | `vitest run`: Test Files 1 passed (1), Tests 7 passed (7), 7.75 s. |
| `git status --short` | repo root | 0 | Six modified files under `frontend/src/` plus three untracked spec files under `.kiro/specs/frontend-design-system-overhaul/`. No `backend/` path appears, no Generated Folder is staged. |

### Live Visual Check

**Not performed in this session.** The Chrome DevTools MCP integration is connected but only `about:blank` was open, the Vite dev server and FastAPI backend were not running, and starting long-running dev/backend processes from shell tools is forbidden by this session's hard rules. The seven scenarios in the design's Section 7.1 (Points / X + f(x) / Function Interval modes at desktop and 320px, the results surfaces against at least one Backend response, the canonical error hierarchy, and the page-level horizontal-scroll inspection at 320px across all named surfaces) are unverified by direct browser observation in this session. The smoke-test backstop in `frontend/src/components/results/results.smoke.test.tsx` passed at exit code 0. To perform the Live Visual Check in a follow-up session, start the backend (`python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000` from `backend/`) and the dev server (`npm run dev` from `frontend/`), then re-run the seven scenarios via the Chrome DevTools MCP.

### Hard Rules Reaffirmed

- No file under `backend/` was modified.
- No endpoint path, request shape, or response shape was changed.
- No interpolation algorithm was implemented, replaced, or augmented in client code; the chart still consumes `graph_data` arrays only.
- No new design token, font, shadow scale, radius scale, or motion handle was introduced.
- No PBT was added; this is a visual / structural alignment pass, not a pure-function or universal-property domain.


---

## Frontend Design System Overhaul — Live Visual Check Follow-up (2026-05-24)

Follow-up to the polish-pass entry above. The build/lint/test verification ran clean in the prior session, but the Live Visual Check was not executed. This follow-up ran the seven Requirement 11 scenarios via the Chrome DevTools MCP integration against the running dev server and backend, observed one pre-existing 320 px page-level horizontal-scroll defect in the masthead, and applied the smallest scoped fix.

### Live Visual Check Result

**PASSED** for all seven Requirement 11 scenarios after the masthead fix below. Verified directly in a Chromium browser via the Chrome DevTools MCP integration with the backend at `http://127.0.0.1:8000` and the dev server at `http://localhost:5173`. Every scenario was actually observed and recorded; 21 screenshots are saved under `.kiro/specs/frontend-design-system-overhaul/screenshots/`.

Per-scenario outcome (full table in `docs/HANDOFF.md`):

- Points mode (desktop and 320) — PASS.
- X + f(x) mode (desktop and 320), with `md:min-w-[10rem]` enforced (rows render at 686 px desktop) — PASS.
- Function Interval mode (desktop and 320), with the four field labels in label voice and Compute blocked when node count is out of range — PASS.
- Results surfaces (Overview, Polynomial, Evaluations, Graph, Method Details for Lagrange / Newton / Barycentric / Neville, Notes) against a real backend response — PASS.
- Error hierarchy (top-level `too_few_nodes` with full canonical hierarchy and recovery sentence; inline `unsafe_expression` rendered beneath the function input via the `inline` layout) — PASS.
- 320 px page-level horizontal-scroll inspection across all named surfaces — PASS after fix.
- Method Details navigation at 320 px — all four method tabs reachable inside the `overflow-x-auto` tab list; Method Emphasis Rule preserved.

### Masthead 320 px Fix (Pre-existing Defect, Minimal Scope)

The visual check observed a 320 px page-level horizontal scroll: `document.scrollingElement.scrollWidth = 397` vs `clientWidth = 320`. The offender was the masthead's right cluster — the "Backend connected" status indicator extending past the viewport because the header used `px-6` padding, no flex `gap`, and the HealthIndicator's text label was always rendered. The defect is pre-existing (the masthead was audit-only in the polish pass).

Two minimal frontend edits resolve it:

1. `frontend/src/App.tsx` — header container: `px-6` → `px-4 sm:px-6`, added `gap-2`, `min-w-0` on the title cluster and `shrink-0` on the identity-mark badge and trailing controls cluster, and `hidden sm:block` on the "Lagrange · Newton · Barycentric · Neville" subtitle. The four-method order remains visible at every breakpoint via the method selector cards, the role tags, and the Result Summary methods row, so Method Emphasis Rule (Requirement 6.2) is not weakened.
2. `frontend/src/components/HealthIndicator.tsx` — the visible label is `hidden sm:inline`, with an `sr-only sm:hidden` companion span carrying the same text. The 1.5 px dot and the `Check` / `X` / `Loader2` icon remain visible at every breakpoint, paired with `role="status" aria-live="polite"` so severity is never carried by color alone (Requirement 10.3 still satisfied).

After the fix, all seven Requirement 11 scenarios pass at the strict 320 px viewport, with `scrollingElement.scrollWidth === clientWidth === 320` on every surface.

### Verification Re-run

| Command | Working directory | Exit | Notes |
| --- | --- | --- | --- |
| `npm run build` | `frontend/` | 0 | `tsc -b && vite build` clean; bundles unchanged within noise. |
| `npm run lint` | `frontend/` | 0 | Zero ESLint errors and no warnings. |
| `npm test` | `frontend/` | 0 | `vitest run`: 1 test file passed, 7 tests passed. |
| `git status --short` | repo root | 0 | Seven `M` entries under `frontend/src/`, two under `docs/`, four `??` spec entries under `.kiro/specs/frontend-design-system-overhaul/`. No `backend/` path. No Generated Folder. |

### Hard Rules Reaffirmed

- No backend file was modified.
- No endpoint path, request shape, or response shape was changed.
- No interpolation algorithm was added or moved into client code.
- No new design token, font, shadow scale, radius scale, or motion handle was introduced.
- The smoke-test suite at `frontend/src/components/results/results.smoke.test.tsx` was not relaxed; all 7 tests continue to assert backend-rendering correctness.
