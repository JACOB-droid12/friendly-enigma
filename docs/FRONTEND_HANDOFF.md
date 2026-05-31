# Frontend Handoff — Interpolating Polynomial Program

For the remaining Claude Opus Phase 2 React workbench implementation checklist, see `docs/OPUS_PHASE_2_FRONTEND_HANDOFF.md`.

## Status
Frontend v1.5 with critique-driven refactors. Builds, lints, type-checks, and tests clean (12 test files, 57 tests). Live-tested against backend.

## Task 3 Backend Osculating Update (2026-05-31)

`osculating` is now implemented by the backend. Valid `methods: ["osculating"]` requests return `methods.osculating.status === "ok"` with `orders`, `repeated_nodes`, `confluent_divided_difference_table`, `coefficients`, `nested_form`, `expanded`, `degree`, `latex_expanded`, `latex_osculating`, `evaluations`, `steps`, and `warnings`.

Frontend-relevant contract changes:

- Treat valid osculating responses as implemented method payloads, not placeholder responses.
- Render `polynomial.osculating_form` and `polynomial.latex_osculating` when present.
- Render `graph_data.source_method === "osculating"` as a method-owned polynomial sample, like Taylor/Hermite.
- When osculating is the selected polynomial source, `degree`, `input_summary.degree`, and `methods.osculating.degree` reflect the osculating polynomial degree from repeated derivative constraints, not just distinct node count.
- Point/data mode must send derivative values for every requested order `1..m_i`; function-backed modes can omit derivative values because the backend derives them safely from the parsed function.
- `method_options.osculating.orders[]` is the maximum derivative order per node. Repeating the same normalized node is rejected with `duplicate_derivative_order` even if the duplicate entry has a different order. If omitted, the backend defaults to first-derivative constraints at every node.
- Function-backed osculating rejects unsafe derivative results with `function_domain_error`, including `abs(x)` at `x=0` because the requested derivative is not two-sided at the node. Surface the backend message/code instead of deriving derivatives in React.
- A single function node is accepted only for the narrow Taylor-equivalent osculating exception: `methods` exactly `["osculating"]` and at least one explicit positive order.

## Task 5 Frontend Request Controls And Types (2026-06-01)

Task 5 updates the React request-control surface without implementing the osculating result renderer.

Frontend request behavior now implemented:

- `frontend/src/lib/api-types.ts` mirrors the backend request contract for `method_options.osculating.orders[]` and cubic spline boundary modes `natural`, `clamped`, `not-a-knot`, and `periodic`.
- `frontend/src/lib/interpolate-request.ts` builds `method_options.osculating.orders[]` from the current visible x-value rows while preserving max-order integers and numeric strings.
- Point/data-mode osculating sends derivative entries for each requested order with `{ x, order, value }`; function-backed osculating omits manual derivative values so the backend derives them from `f(x)`.
- Hermite request behavior remains first-derivative only with `order: 1`.
- Cubic spline controls now allow all implemented boundary modes. When `clamped` is selected, the request includes `left_derivative` and `right_derivative` as strings.
- Function-interval osculating does not synthesize generated nodes in React. The UI notes that interval nodes are backend-generated and sends no explicit order rows, preserving the backend default behavior without moving node generation into React.

Focused Task 5 spec fix, also completed 2026-06-01:

- Hermite and Osculating derivative payload requirements are now unioned per visible node without duplicate `(x, order)` entries.
- Hermite methods keep provided order-1 derivative entries even when Osculating is also selected and a node has max order `0`.
- Osculating point mode still emits derivative entries only for orders `1..max_order`.
- The catalog example now loads `Osculating (Bessel-style)` as an implemented request with `osculatingOrders` and order-1 derivative values, instead of historical placeholder copy.

Focused Task 5 metadata/spec fix, also completed 2026-06-01:

- `frontend/src/lib/method-metadata.ts` now describes Osculating as implemented generalized derivative-order interpolation.
- Osculating no longer has `deferred: true` or the stale placeholder note saying the backend returns `method_not_implemented`.
- `MethodSelector` still supports generic deferred metadata, but the Osculating card now renders as an implemented Derivative Data method without a `Deferred` badge.
- No Osculating result renderer, result types, backend math, or `MethodDetails` routing changed; those remain Task 6 scope.

Focused Task 5 UI-state fix, also completed 2026-06-01:

- Hermite and Osculating controls still share `form.derivatives`, but table edits now merge into the existing derivative state instead of replacing the whole array.
- Hermite first-derivative edits update visible order-1 entries and preserve higher-order Osculating values.
- Osculating max-order/value edits update Osculating-required entries and preserve unrelated Hermite order-1 values when Hermite is selected, including when an Osculating max order is changed to `0`.
- Emitted derivative state is deduplicated by `(x, order)` and sorted deterministically by visible node order, x string, and derivative order.
- Osculating max-order edits emit `derivatives` and `osculatingOrders` together from `InputPanel`, avoiding sibling state clobbering from sequential partial updates.

Focused Task 5 type-safety fix, also completed 2026-06-01:

- `frontend/src/lib/api-types.ts` now models the implemented backend `OsculatingResult` payload instead of the old legacy-placeholder-only shape.
- The type includes optional `orders`, generalized `repeated_nodes`, `confluent_divided_difference_table`, `coefficients`, `nested_form`, `expanded`, `degree`, `latex_expanded`, `latex_osculating`, `evaluations`, and `steps`, while preserving `status`, `warnings`, and `error`.
- Stale comments saying the backend had not implemented Osculating were removed from the API type file.
- `MethodDetails` and renderer files remain intentionally untouched; Task 6 still owns visual rendering and routing.

## Task 6 Frontend Osculating Result Rendering (2026-06-01)

Task 6 replaces the historical Osculating placeholder result path with real rendering for the implemented backend payload.

Frontend result behavior now implemented:

- `frontend/src/components/results/MethodDetails.tsx` routes `data.methods.osculating` to `OsculatingDetails`.
- `frontend/src/components/results/methods/OsculatingDetails.tsx` renders `orders`, generalized `repeated_nodes`, `confluent_divided_difference_table`, `coefficients`, `nested_form`, `expanded`, `latex_expanded`, `latex_osculating`, `evaluations`, `steps`, method-level warnings, and method-level errors.
- `frontend/src/test/interpolate-response.fixtures.ts` now exports `osculatingSuccessResponse` instead of the obsolete `osculatingDeferredResponse`.
- `GuidedExplanation` now describes implemented Osculating output instead of a placeholder method.
- `ResultQualityGuide` warning guidance now reflects implemented higher-order Osculating and implemented spline boundary modes.
- `DeferredMethodDetails` remains only as generic defensive UI for future `method_not_implemented` responses; Osculating no longer uses it.

## Task 7 Accessibility Fix (2026-06-01)

`DisplayDigitsControl` now labels both layers of the Base UI radio implementation:

- Visible radio roots keep stable visible-label ids and also receive explicit `aria-label` values (`6`, `12`, `25`, `Full`).
- Hidden native `input[type="radio"]` elements receive explicit `aria-label` values (`Display precision 6`, `Display precision 12`, `Display precision 25`, `Display precision Full`) through `inputRef`.
- `DisplayDigitsControl.test.tsx` asserts the `radiogroup` accessible name, each visible radio accessible name, and each hidden native input label.

Additional accessibility fixes landed in the same task:

- The shared `Switch` component now renders as a labelled `button role="switch"` and no longer creates hidden Base UI checkbox inputs.
- Exact-mode and graph-output switches use visible text spans with `aria-labelledby`; they no longer rely on orphan `<label for=...>` elements.
- `EvaluationTargets` uses a semantic span for the group heading instead of a non-control label.
- Example buttons now include visible text in their accessible names (`Load Example - Load ... example`) to satisfy label/name matching.
- Method-card captions now use full-contrast text tokens instead of lower-opacity variants that failed Lighthouse color contrast.

This is a real code fix for the prior Chrome "Chrome form-label warning" report, not a documentation-only waiver. Chrome DevTools MCP direct JSON-RPC verification on `http://127.0.0.1:5173/` found no console `issue` messages, no unlabeled form fields, and Lighthouse Accessibility `100`. Reports were generated at `.codex/evidence/chrome-a11y/report.json` and `.codex/evidence/chrome-a11y/report.html`.

Verification from `frontend/`:

| Command | Result |
|---|---|
| `npm test -- InputPanel.MethodConfig.test.tsx` | PASS - 15 tests after the focused spec-fix regression. |
| `npm test -- App.examples.test.tsx` | PASS - 11 tests after updating the Osculating example expectation. |
| `npm test -- InputPanel.MethodConfig.test.tsx App.examples.test.tsx` | PASS - 26 tests. |
| `npm test -- MethodSelector.test.tsx InputPanel.MethodConfig.test.tsx App.examples.test.tsx` | PASS - 30 tests after the metadata/spec fix. |
| `npm test -- InputPanel.MethodConfig.test.tsx` | PASS - 17 tests after the UI-state fix regressions. |
| `npm test -- OsculatingDetails.test.tsx` | PASS - 2 tests. |
| `npm test -- OsculatingDetails.test.tsx results.smoke.test.tsx GuidedExplanation.test.tsx ResultQualityGuide.test.tsx` | PASS - 4 files, 16 tests. |
| `npm test -- DisplayDigitsControl.test.tsx` | PASS - 2 tests after the native-input label fix. |
| `npm test -- DisplayDigitsControl.test.tsx switch.test.tsx InputPanel.MethodConfig.test.tsx MethodSelector.test.tsx App.examples.test.tsx` | PASS - 5 files, 35 tests after the switch, orphan-label, contrast, and accessible-name fixes. |
| `npm run lint` | PASS. |
| `npm run build` | PASS after the focused type-safety fix, Task 6, and Task 7; Vite emitted the existing large-chunk advisory. |

Remaining frontend work:

- Browser smoke still needs to cover Osculating UI, spline boundary inputs, result tabs, graph/evaluation output, and 320x800 mobile layout against the live app. The display-precision/switch label issue now has Chrome DevTools MCP accessibility evidence.

## Preview Deployment Checkpoint (2026-06-01)

Per user request, a preview was deployed separately from production before production promotion:

- Preview URL: `https://interpolation-workbench-731dpy4tj-marvillarq20-3593s-projects.vercel.app`
- Inspect URL: `https://vercel.com/marvillarq20-3593s-projects/interpolation-workbench/7dpxuQtN7s8MaVReKG39yhxXkdrb`
- Deployment id: `dpl_7dpxuQtN7s8MaVReKG39yhxXkdrb`
- `npx vercel inspect` reports target `preview`, status `Ready`.
- Production was not promoted or touched.
- Direct unauthenticated access to `/` and `/health` returns HTTP `401 Unauthorized`, so the preview remains behind Vercel Authentication and is not public.

## Reciprocal Graph Node Plotting Fix (2026-05-26)

`GraphCard` now parses backend numeric strings with a strict graph parser instead of `parseFloat`. This matters for exact-mode point inputs because the backend returns rational node strings such as `"1/2"` and `"2/3"`; `parseFloat` partially parsed those as `1` and `2`, which made the red node series appear at stale-looking integer coordinates while the orange `P(x)` curve was sampled from correct decimal `graph_data`.

Frontend-relevant behavior after the fix:

- Node scatter points use the actual backend node coordinates, including exact rational `a/b` strings.
- Graph sample arrays, optional `f_x`, optional `error`, tooltip values, and brush x-coordinates all pass through the same numeric parser.
- Point-only interpolation still renders no original `f(x)` curve and no true error curve because the backend returns null `f_x` and `error` arrays when no function is supplied.
- No interpolation math, graph sampling, endpoint path, request shape, or response shape changed.

Regression coverage:

- `frontend/src/components/results/methods/CubicSplineGraphPassthrough.test.tsx` now includes the reciprocal case nodes `(0,1)`, `(1/2,2/3)`, `(1,1/2)`, `(3/2,2/5)`, `(2,1/3)` and asserts the Recharts `Scatter` data is `(0,1)`, `(0.5,0.6666...)`, `(1,0.5)`, `(1.5,0.4)`, `(2,0.3333...)`.
- Verification passed with `npm run lint`, `npm run build`, and `npm test` (58 tests).
- Browser DOM/SVG QA on `http://127.0.0.1:5173/` confirmed five node markers at half-step x positions and a graph legend containing only `Nodes` and `P(x)`. Browser screenshot capture timed out, so the recorded proof is DOM/SVG coordinate evidence.

## Vercel Deployment Notes (2026-05-26)

Current preview:

```text
https://interpolation-workbench-l5rm96fe6-marvillarq20-3593s-projects.vercel.app
```

Architecture: single Vercel project. The frontend remains a Vite static app built from `frontend/` into `frontend/dist`. The backend remains the existing FastAPI app from `backend/app/main.py`, exposed to Vercel through `api/index.py`. `vercel.json` rewrites `/health` and `/api/:path*` to the adapter and rewrites other non-API paths to `/index.html` for SPA refresh support.

Environment variables: none required for the single-project same-origin deployment. `frontend/src/lib/api-client.ts` now honors optional `VITE_API_BASE_URL`; if unset, it keeps the existing same-origin behavior used by Vite dev proxy and Vercel rewrites.

Verification: deployed preview passed `GET /health`, `POST /api/validate-function`, the Linear Lagrange workflow `(2,4),(5,1), x=3 -> P(x)=6-x, P(3)=3`, a Phase 2 Taylor API workflow, a Phase 2 Cubic Spline browser workflow, graph rendering, and 320px mobile viewport smoke. A later graph-timeout fix also verified graph-enabled exact `cos(x)` examples for `newton_forward`, `newton_backward`, and `stirling`; each now returns 101 backend graph samples from the same `/api/interpolate` response shape. Preview is protected by Vercel Deployment Protection/SSO, so browser/API checks used authenticated Vercel CLI or bypass-cookie flows.

## v1.5 Highlights (2026-05-26)

Critique pass `2026-05-26T05-43-56Z__frontend.md` flagged five priority issues plus several minor observations. All fixes shipped in this build.

- **`lib/method-metadata.ts`**: single source of truth for `MethodName` -> label, short label, family, role, badge variant, description, eligibility hint, deferred note. `MethodSelector`, `SummaryCard`, `MethodDetails`, `EvaluationTable`, `GraphCard`, `ResultQualityGuide`, and `GuidedExplanation` all consume it. The legacy `MethodSelector.catalog.ts` was deleted.
- **`lib/backend-codes.ts`**: shared registry for backend warning/error/omission codes. Reuses the existing `lib/warnings.ts` catalog and adds a safe fallback so unknown codes show the backend message first and the raw code in a `Code:` companion line. `ErrorNotice` routes through the registry; `WarningsDisplay` and `ResultQualityGuide` continue to read `getWarningMeta` directly because they already render labelled warnings.
- **EvaluationTable**: column headers use `methodShortLabel` (`Hermite DD`, `Newton Fwd`, etc.) and the best-method Badge uses `methodLabel` plus `methodBadgeVariant` for role-tinted, friendly output. The previous `capitalize` Tailwind utility on raw snake_case is gone.
- **PolynomialCard**: when the response is a piecewise spline (`expanded_omitted_reason === "piecewise_method_no_global_polynomial"`), the duplicate Alert is suppressed so the body-voice notice in the Expanded tab is the single source of truth. For every other omission reason, the Alert routes through the friendly registry label (`Polynomial Omitted` instead of `expanded_polynomial_omitted`).
- **Examples panel**: redesigned around the user's "Quick Start + Lecture Catalog" direction. Four curriculum-critical cards on first paint (Linear Lagrange, Newton Divided Difference, Second-Degree Lagrange, Cubic Spline). A `Show 8 more lecture examples` disclosure opens the rest of the Phase 2 catalog. Categories (`Lecture / Function / Demo`) stay as subtle Badge tags only; primary navigation is the Quick Start vs Catalog split, not the categories.
- **Display digits and KaTeX parity**: `formatLatexLiterals` (in `lib/format-numeric.ts`) rounds numeric literals inside SymPy LaTeX without touching `\frac`, `\left`, `\right`, identifiers, or braces. Exposed through `useDisplayDigits().formatLatex`. PolynomialCard now passes Display-respected LaTeX to every `KatexDisplay`. The Copy buttons preserve full backend precision via the new `fullPrecisionText` prop on `CopyableFormula`.
- **GuidedExplanation**: dropped the local `METHOD_LABEL` map (it duplicated what is now in `method-metadata.ts`) and swapped Tailwind's `font-mono` for the project's `.font-numeric` handle so the polynomial and evaluation lines align with the rest of the numeric voice.
- **Em dashes**: removed from user-facing copy. `lib/warnings.ts` (`Piecewise: No Global Polynomial`) and `ExamplesPanel.tsx` (`Deferred: Osculating (Bessel-style)`).
- **Reduced motion**: `prefers-reduced-motion: reduce` now also neutralizes Tailwind's `animate-pulse` (used by `Skeleton` and the `HealthIndicator` checking-state dot). The `Loader2` spinner stays running because removing it would imply "computation has stopped".
- **Result-tab hotkeys**: digits 1 to 7 select Overview / Guide / Polynomial / Evaluations / Graph / Methods / Notes, skipping disabled tabs. Wired through a `tabHotkey: { index, tick }` prop on `ResultsPanel` so React's "no setState in an effect body" rule stays satisfied.
- **PrecisionSettings**: active preset chip now pairs the color shift with `font-semibold` and `ring-1 ring-inset ring-primary/30`, so severity is never carried by color alone. The `App.tsx` header logo opacity moved from `bg-primary/8` to `bg-primary/10` to match the rest of the codebase's /5 /10 /15 /20 ladder.
- **DerivativeInputTable**: extra inline help on derivative order so first-time students see "Hermite currently supports first-derivative data only (order = 1). Enter f'(x_i) per node; the request builder fills the order field for you." up front.
- **Tests updated**: `App.examples.test.tsx` now opens the Lecture Catalog disclosure before clicking through Phase 2 examples; `CubicSplineGraphPassthrough.test.tsx` and `results.smoke.test.tsx` and `ResultQualityGuide.test.tsx` expect the friendly `Cubic Spline` / `Barycentric` text instead of the raw `cubic_spline` / `barycentric` strings.

Verification: `npm run build` (PASS, 2567 modules), `npm run lint` (PASS, 0 errors), `npm test` (PASS, 12 files, 57 tests). Live browser QA on Linear Lagrange, Cubic Spline (the previously-double-signaled piecewise notice is now single), and the Display=6 radio selecting via keyboard hotkey 3.

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

P2.0 backend contract prep accepts Phase 2 method names under the stable `POST /api/interpolate` endpoint. P2.1 implements equal-spacing methods. P2.2 implements first-derivative Hermite methods. P2.3 implements Taylor polynomials. P2.4 implements cubic spline segments with natural, clamped, not-a-knot, and periodic boundary conditions. P2.5 audit is complete with release gates documented in `docs/PHASE_2_FINAL_AUDIT.md`. Backend tests and Ruff now pass under Python 3.12.13, satisfying the Python 3.11+ backend runtime gate. If Claude Opus exposes a deferred or ineligible Phase 2 method, the frontend must render the method-level error returned under `methods.<method>.error` and must not simulate the method client-side.

P2.5 frontend integration status:

- Backend payloads for `newton_forward`, `newton_backward`, `stirling`, `hermite_divided_difference`, `hermite`, `taylor`, and all implemented `cubic_spline` boundary modes are ready for Claude Opus rendering work.
- `osculating` is implemented and should render from the successful backend payload when valid.
- Codex did not implement Phase 2 React controls/renderers during P2.5.
- Backend verification passed under Python 3.12.13 with `.\.venv\Scripts\python.exe -m pytest` and `.\.venv\Scripts\python.exe -m ruff check .`.
- `npm run build`, `npm run lint`, and `npm test` passed during P2.5 verification.
- Browser QA for the current V1+ frontend guide/result-quality flows passed through a built static/proxy server: linear Lagrange graph compute and the `f(x) = 1/x` function-backed lecture example both returned backend 200 responses and rendered Guide output. Historical browser-QA note superseded by the implemented Phase 2 frontend workbench, Task 5 controls, Task 6 Osculating renderer, and Task 7 Chrome DevTools MCP evidence.
- Historical Chrome form-label issue superseded by Task 7: hidden native display-precision inputs and switches are labelled, and Chrome DevTools MCP reports no console form-label issues.

Accepted Phase 2 method names:

| Method | Family | Frontend role |
|---|---|---|
| `newton_forward` | Equal spacing | Finite-difference construction near the first nodes |
| `newton_backward` | Equal spacing | Finite-difference construction near the last nodes |
| `stirling` | Equal spacing | Centered finite-difference construction |
| `hermite_divided_difference` | Derivative data | Repeated-node divided-difference construction |
| `hermite` | Derivative data | Hermite basis / derivative-matching construction when backend supports it |
| `osculating` | Derivative data | Generalized derivative matching through confluent repeated nodes |
| `taylor` | Function derivative | Local polynomial approximation from safe symbolic derivatives |
| `cubic_spline` | Piecewise | Cubic spline segments, boundary metadata, and backend graph samples |

Optional request blocks now documented in `docs/API_CONTRACT.md`:

- `method_options`: method-specific config keyed by method name.
- `derivatives`: string-valued derivative data objects with `x`, `order`, and `value`.

2026-05-27 RC update:

- `method_options` is now schema-hardened. Accepted blocks are `taylor`, `cubic_spline`, and `osculating`; unknown option blocks return FastAPI HTTP `422`.
- `method_options.taylor.center` is a strict numeric string. Send `"0"`, not `0`.
- `method_options.cubic_spline.boundary_condition` is limited to `"natural"`, `"clamped"`, `"not-a-knot"`, or `"periodic"` at the schema boundary, and all four literals are implemented by the backend.
- `method_options.cubic_spline.left_derivative` and `right_derivative` are strict numeric strings required only for `"clamped"`; missing values return method-level `missing_boundary_parameter`.
- `"not-a-knot"` requires at least four nodes and returns method-level `invalid_node_count` if too few are supplied.
- `"periodic"` requires matching first/last y-values and returns method-level `periodic_endpoint_mismatch` when they differ.
- `method_options.osculating.orders[]` accepts strict `{ "x": string, "order": integer }` entries with `order` from 0 through 10 and drives real backend osculating output.
- Duplicate `derivatives[]` entries with the same normalized `x` and `order` now fail before method execution with HTTP `400` and error code `duplicate_derivative_data`.
- `input_summary.sorted_nodes` is now live. It becomes `true` when a supported backend method reorders nodes; current case is `cubic_spline`, while the existing method-level `nodes_reordered` warning remains present.
- `methods.stirling.evaluations[].terms` is now populated from direct centered Stirling finite-difference summation, not a Lagrange fallback.
- Display precision radio controls use explicit per-instance label ids for Base UI group/options.
- Graph rendering differentiates `f(x)` and `P(x)` by style as well as color: `f(x)` is dashed and `P(x)` remains solid.
- Evaluation comparison best-method badges expose a short backend-priority rationale through compact help text (`title` / accessible label) without adding repeated visible row copy.

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

Task 3 implements:

- `osculating` — generalized derivative-order interpolation through confluent repeated nodes.

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

### Task 3 Osculating Payloads

Backend Task 3 implements:

- `osculating`

Frontend rendering rules:

- Render `methods.osculating.orders` as the per-node maximum derivative orders used by the backend.
- Render `methods.osculating.repeated_nodes` and `methods.osculating.confluent_divided_difference_table` exactly as returned.
- Render `coefficients`, `nested_form`, `expanded`, `latex_expanded`, `latex_osculating`, `evaluations`, `steps`, `warnings`, and `error` exactly as returned.
- Render `polynomial.osculating_form` and `polynomial.latex_osculating` when present.
- If `graph_data.source_method === "osculating"`, show that `P_x` came from the backend-owned osculating polynomial.
- For method-level errors such as `missing_derivative_data`, `duplicate_derivative_order`, `derivative_node_not_found`, and `function_domain_error`, show the backend message/code. Do not estimate missing derivatives or recompute symbolic derivatives in React.

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

- Use `method_options.cubic_spline.boundary_condition` with `"natural"`, `"clamped"`, `"not-a-knot"`, or `"periodic"`.
- For `"clamped"`, also send `left_derivative` and `right_derivative` as numeric strings.
- For `"periodic"`, the first and last y-values must match.
- Existing point/function modes still provide the nodes; the spline method owns ordering and segment generation.

Frontend rendering rules:

- Render `methods.cubic_spline.boundary_condition`, `boundary_parameters`, `ordered_nodes`, `second_derivatives`, `segments`, `continuity_checks`, `evaluations`, `steps`, `warnings`, and `error` exactly as returned.
- Render `segments` as piecewise interval rows with local coefficients `a`, `b`, `c`, `d`, `local_form`, expanded segment, and LaTeX.
- If the top-level `polynomial.expanded_omitted_reason` is `piecewise_method_no_global_polynomial`, show that the spline has piecewise segments instead of a single global polynomial.
- If `graph_data.source_method === "cubic_spline"`, render graph arrays exactly as returned. Do not resample the spline in React.
- Do not calculate spline coefficients, segment values, continuity checks, graph samples, or errors in React.

Recommended Phase 2 UI additions for Claude Opus:

- Boundary selector with all implemented backend modes enabled.
- Clamped endpoint derivative inputs that send string values only when `boundary_condition === "clamped"`.
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
- Show Result Quality / Warnings Guide from existing backend response fields
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
│   ├── Guide: GuidedExplanation + ResultQualityGuide
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
| Guide | Guided Explanation / Defense Notes and Result Quality / Warnings Guide | — |
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

`frontend/src/components/results/ResultQualityGuide.tsx` is rendered inside the same Guide tab. It extends the defense notes with a concise quality and warning interpretation layer.

| Quality item | Backend response fields used |
|---|---|
| Trust summary | `status`, `warnings.length` |
| No-warning state | `warnings.length` |
| Warning message | `warnings[].message` |
| Warning technical code | `warnings[].code` |
| Warning label/severity display | Existing `getWarningMeta(warnings[].code)` display mapping |
| Evaluation comparison | `evaluations[].x`, `evaluations[].best_P_x`, `evaluations[].f_x`, `evaluations[].absolute_error` |
| Graph sample note | `graph_data.source_method`, `graph_data.x.length` |

Design placement:

- Lives in the existing Guide tab, not a new top-level results tab.
- Uses the same `rounded-xl border bg-card overflow-hidden` surface, `bg-muted/30` headers, `font-label` labels, `font-numeric` technical values, and semantic inset notices as the rest of the workbench.
- Replaces the previous smaller warning block in `GuidedExplanation` so warning interpretation is not duplicated.
- Does not calculate warning severity, errors, graph samples, or interpolation values. It displays backend and existing frontend display metadata only.

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
| `npm test -- ResultQualityGuide.test.tsx` | PASS — 1 test file, 4 tests passed |
| `npm test -- ResultQualityGuide.test.tsx GuidedExplanation.test.tsx` | PASS — 2 test files, 7 tests passed |
| `npm test -- GuidedExplanation.test.tsx` | PASS — 1 test file, 3 tests passed |
| `npm run build` | PASS — TypeScript build and Vite production build completed |
| `npm run lint` | PASS — 0 errors, 0 warnings |
| `npm test` | PASS — 4 test files, 17 tests passed |
| Browser smoke with Vite + local backend | PASS — Guide tab rendered for Linear Lagrange with `points mode`, 2 nodes, degree 1, `6 - x`, and `P(3) = 3` |
| Browser 320px overflow check | PASS — `scrollWidth` matched `clientWidth`; no overflowing elements found |
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


---

## Phase 2 Frontend Workbench (2026-05-26)

The Phase 2 Frontend Workbench feature spec at
`.kiro/specs/phase-2-frontend-workbench/` (R1–R18) is implemented under
`frontend/src/`. This section documents what the workbench presents to
the user and how it consumes the existing backend contract; the
file-by-file change log, exact git status, verification command exit
codes, and per-scenario observations live in `docs/HANDOFF.md` under
"Session: Phase 2 Frontend Workbench (2026-05-26)" and in the
per-task results files under
`.kiro/specs/phase-2-frontend-workbench/screenshots/`.

### Summary

Every Phase 2 lecture method currently shipped by the Codex-owned
backend is now selectable in the React workbench and renders against
the live response under the stable `POST /api/interpolate` endpoint:

- Newton Forward, Newton Backward, and Stirling (Equal-Spacing
  Family).
- Hermite Divided Difference and Hermite Basis Form (Derivative-Data
  Family).
- Taylor / Maclaurin (Function-Derivative Family).
- Natural Cubic Spline (Piecewise Family).
- Osculating (Derivative-Data Family) is implemented by the backend as
  of 2026-05-31. The 2026-05-26 frontend workbench originally rendered
  it through a placeholder path; that path is now historical for Osculating.

### Method Selector catalog

`frontend/src/components/MethodSelector.tsx` renders a single
family-grouped catalog sourced from
`frontend/src/components/MethodSelector.catalog.ts`. The catalog is
the workbench's source of truth for method metadata. Family keys (and
their visible role-tag voices, preserved from the Analysis Bench
design system):

| Family key | Role-tag voice | Methods |
|---|---|---|
| `construction` | CONSTRUCTION | `lagrange`, `newton` |
| `stable_evaluator` | STABLE EVALUATOR | `barycentric` (primary tint preserved) |
| `target_specific` | TARGET-SPECIFIC | `neville` |
| `equal_spacing` | EQUAL SPACING | `newton_forward`, `newton_backward`, `stirling` |
| `derivative_data` | DERIVATIVE DATA | `hermite_divided_difference`, `hermite`, `osculating` |
| `function_derivative` | FUNCTION DERIVATIVE | `taylor` |
| `piecewise` | PIECEWISE | `cubic_spline` |

Catalog entries carry `value`, `label`, `family`, `role`, optional
`highlight` (Barycentric only), `description`, optional
`eligibilityHint` (Equal-Spacing family only), `deferred`, and
`deferredNote`. The Osculating card no longer renders a
Deferred badge for valid backend Task 3 behavior; Barycentric retains
its primary-tinted role tag.

### Adaptive Input Panel

`frontend/src/components/InputPanel.tsx` adds a fourth section,
"Method Configuration", placed between "Methods" and "Precision &
Evaluation" (locked decision #6 of the spec). The card is hidden
entirely when no Phase 2 method that needs configuration is selected,
so V1 layout is byte-identical for the four V1 methods. The card is
flat (no nested cards) and its blocks stack below the `md` breakpoint.

Adaptive blocks rendered inside the card:

- **`EqualSpacingHint.tsx`** (R4.5 / R5.2). Reads the user-entered
  string x-values through the pure helper
  `frontend/src/lib/equal-spacing.ts` (parsing is hint-only; the
  request body still ships strings) and renders either
  `Spacing appears equal: h ≈ <h>` or `Spacing not equal: <reason>`.
  This same helper drives `App.tsx` `isFormBlocked`, which disables
  the Compute button (with `aria-disabled="true"` and a tooltip
  reason) when every selected method is in the Equal-Spacing Family
  and the helper reports ineligibility.
- **`DerivativeInputTable.tsx`** (R5.3 / R5.4). Supports two request
  modes. `first-derivative` preserves the Hermite one-row-per-node
  first-derivative input behavior and emits `order: 1`.
  `osculating` shows a maximum derivative order per visible node and,
  in points mode, derivative value inputs for every order `1..m_i`.
  In function-backed modes, value inputs are hidden because the
  backend derives derivative values from `f(x)`.
- **`TaylorConfigBlock.tsx`** (R5.5). Labelled `center` string input
  and `<input type="number" min={0} max={20} step={1}>` for `order`.
  When `form.mode === "points"` the block renders a body-voice
  disabled hint instead ("Taylor needs a function expression. Switch
  to X + f(x) or Interval mode."), reusing the existing function
  input field rather than introducing a second one.
- **`CubicSplineConfigBlock.tsx`** (R5.6 / R9.5). The
  `boundary_condition` selector enables `Natural`, `Clamped`,
  `Not-a-Knot`, and `Periodic`. Selecting `Clamped` renders left and
  right endpoint derivative string inputs. The block sends options
  only; React does not compute spline coefficients or generated
  spline data.

### Family renderers

Each Phase 2 family has a dedicated renderer file under
`frontend/src/components/results/methods/`. Every renderer reads only
documented backend fields and performs no math, no symbolic
manipulation, and no client-side resampling.

- **`EqualSpacingDetails.tsx`** (R6.x). Renders
  `forward_difference_table` / `backward_difference_table` /
  `centered_difference_table` (wrapped in
  `overflow-x-auto rounded-lg`), spacing summary (`spacing_h`,
  `anchor_index` or `center_index` / `center_x`), per-evaluation block
  with `s`, `value`, and `terms`, advisory copy when
  `target_guidance.recommended` differs from this method, and the
  `steps` ordered list. Method-level `ErrorNotice` for codes such as
  `unequal_spacing` and `stirling_requires_centered_nodes`.
- **`HermiteDetails.tsx`** (R7.x). Renders repeated nodes,
  divided-difference table, coefficients, Newton nested form,
  expanded form, and `latex_expanded` via KaTeX. For `hermite` with
  `basis_form.status === "included"`, also the basis formula line,
  basis-term table, expanded form, latex via KaTeX, and the
  `matches_divided_difference` indicator. For
  `basis_form.status === "omitted"`, an informational notice that
  surfaces the message of the corresponding
  `expanded_polynomial_omitted` warning whose
  `details.artifact === "hermite_basis_form"` (locked decision #2 —
  no `basis_form.reason` field is invented).
- **`TaylorDetails.tsx`** (R8.x). Renders the header
  (`center`, `order`, `series_name`), a `Maclaurin (center = 0)`
  badge when `series_name === "Maclaurin"` (without altering the
  polynomial fields), the term table with columns `order`,
  `derivative`, `derivative_at_center`, `coefficient`, `term`, and
  `latex_term` (KaTeX), polynomial forms (`taylor_form`, `expanded`,
  `latex_taylor`, `latex_expanded`), evaluation chips, and
  `remainder_note`. Inline `ErrorNotice` for
  `unsupported_taylor_function`.
- **`CubicSplineDetails.tsx`** (R9.x). Renders the
  boundary-condition badge, ordered-nodes table, second-derivatives
  chip row (`Mᵢ`), segments table with `index`, `interval`,
  `coefficients.{a, b, c, d}`, `local_form`, `expanded`, and `latex`
  (KaTeX), continuity-check rows with `✓` / `✗` glyphs paired with
  text labels, and evaluation chips that surface `segment_index`
  when present. Surfaces a body-voice piecewise notice when
  `polynomial.expanded_omitted_reason ===
  "piecewise_method_no_global_polynomial"`. Inline `ErrorNotice`
  remains useful for method-level validation errors such as
  `missing_boundary_parameter`, `invalid_node_count`,
  `periodic_endpoint_mismatch`, and defensive
  `unsupported_boundary_condition`.

### Osculating renderer update

The previous `DeferredMethodDetails.tsx` path is historical for
`osculating`. A current osculating tab should render the Task 3
payload: orders, repeated nodes, confluent divided-difference table,
coefficients, nested form, expanded form, LaTeX, evaluations, steps,
warnings, and method-level errors. `DeferredMethodDetails.tsx` can
remain structurally available for future `method_not_implemented`
methods, but valid osculating input should no longer hit it.

### Cross-cutting updates

- **`MethodDetails.tsx`** is now a thin tab dispatcher (locked
  decision #1). Each Phase 2 method tab delegates to a family
  renderer file; the four V1 panels are untouched. `pickInitialTab()`
  still prefers Lagrange → Newton → Neville before Barycentric.
  Sibling-method visibility under `status === "partial"` (R6.5 /
  R10.4) is preserved.
- **`PolynomialCard.tsx`** adds a Hermite tab visible when
  `polynomial.hermite_form` is non-null (renders `hermite_form` plus
  `latex_hermite` via KaTeX) and a Taylor tab visible when
  `polynomial.taylor_form` is non-null (renders `taylor_form` plus
  `latex_taylor` via KaTeX). When `polynomial.expanded_omitted_reason
  === "piecewise_method_no_global_polynomial"`, the Expanded tab body
  is replaced with a body-voice notice and the Factored tab is
  hidden. V1 KaTeX wrapper styles (`bg-muted/30 rounded-lg p-4` with
  no inner `border`) are preserved.
- **`SummaryCard.tsx`** groups the methods row by family in the
  catalog order. V1 Badge mappings are preserved exactly:
  `lagrange` / `newton` → `secondary`, `barycentric` → primary tint
  (Stable Evaluator), `neville` → `info`. Phase 2 methods reuse the
  `secondary` Badge variant. Family group labels render in
  `font-label` voice. No change reframes Barycentric as a primary
  classroom construction method.
- **`GuidedExplanation.tsx`** adds a `MethodBlock` per implemented
  Phase 2 method (Newton Forward, Newton Backward, Stirling, Hermite
  Divided Difference, Hermite Basis Form, Taylor / Maclaurin, Cubic
  Spline). With Task 3, add/update an Osculating block that reads
  `data.methods.osculating` successful payload fields instead of the
  old placeholder-method condition. Each block reads only
  `data.methods[<name>]` and the input summary.
- **`ResultQualityGuide.tsx`** adds `WARNING_GUIDANCE` rows for the
  Phase 2 codes named in R11.2 plus `nodes_reordered`. Severity
  continues to come from `getWarningMeta` in
  `frontend/src/lib/warnings.ts`; nothing in the result quality guide
  recomputes severity from numerical values.

### Examples Panel V2

`frontend/src/components/ExamplesPanel.tsx` adds the lecture-aligned
Phase 2 entries below. Loading an example fills the existing form
fields, including the new Phase 2 `FormState` fields, and never calls
`/api/interpolate` directly.

| Title | Methods seeded | Notes |
|---|---|---|
| `Newton Forward (cos x at 1.0…2.2)` | `["newton_forward"]` | `mode = x_values_with_function`, `function = cos(x)`, `x = ["1.0","1.3","1.6","1.9","2.2"]`, `evaluation_x = ["1.5"]`, `exact = true` |
| `Newton Backward (cos x)` | `["newton_backward"]` | Same five cos(x) nodes, `exact = true` |
| `Stirling (cos x, centered)` | `["stirling"]` | Same five cos(x) nodes, `exact = true` |
| `Hermite Divided Difference (Bessel-style)` | `["hermite_divided_difference"]` | Three Bessel-style points + first derivatives at each |
| `Hermite (Basis Form)` | `["hermite"]` | Same three Bessel-style points; surfaces the basis-form output |
| `Taylor (cos x, order 3)` | `["taylor"]` | `taylorCenter = "0"`, `taylorOrder = 3`, `evaluation_x = ["1/2"]` |
| `Cubic Spline (lecture three-point)` | `["cubic_spline"]` | `splineBoundaryCondition = "natural"`, `evaluation_x = ["5/2"]`, `graph = true` |
| `Osculating (Bessel-style)` | `["osculating"]` | Same Bessel-style points and derivatives as Hermite; should render the backend Task 3 osculating payload |

The three Equal-Spacing examples currently seed `exact: true` for
lecture-style exact arithmetic. Backend Candidate A hardening on
2026-05-26 also makes the same decimal nodes eligible in numeric mode
(`exact: false`) by using backend precision-aware tolerance for the
equal-spacing guard. The frontend does not need to work around numeric
residuals or alter display-digit behavior.

### API contract preservation

The frontend stays a thin renderer of the documented contract plus a
method-aware input layer. Four hard rules apply to every Phase 2
addition above:

1. The frontend calls only `GET /health`,
   `POST /api/interpolate`, and `POST /api/validate-function`. No
   other endpoint paths are introduced. (R1.2)
2. The request and response shapes documented in
   `docs/API_CONTRACT.md` are the source of truth. The
   `InterpolateRequest.method_options` and
   `InterpolateRequest.derivatives` fields are optional and additive
   per the existing contract; the Phase 2 method response keys under
   `InterpolateResponse.methods` are likewise optional and additive.
   TypeScript types in
   `frontend/src/lib/api-types.ts` mirror documented backend fields
   only — no field is invented. (R1.3 / R2.6)
3. Every numeric field inside `points`, `x_values`, `interval`,
   `evaluation_x`, `derivatives[].x`, `derivatives[].value`, and
   `method_options.taylor.center` is sent as a string, never through
   `parseFloat` or `Number()` before reaching the API boundary.
   (R1.4)
4. Warning severity is read from `getWarningMeta` in
   `frontend/src/lib/warnings.ts`. Severity is not recomputed from
   numerical values in React. (R1.5)

The frontend computes no math: no `eval`, no SymPy, no Math.js, no
finite-difference reconstruction, no Hermite repeated-node tables,
no Taylor derivative terms, no spline coefficients, no graph
samples, no error metrics. (R6.6, R7.5, R8.5, R9.6, R10.3, R11.6)

`docs/API_CONTRACT.md` is owned by Codex (R18.4) and was not
modified by the Phase 2 frontend work.

### Browser QA Matrix outcomes

Every scenario was driven through Chrome via the DevTools MCP
against the running stack (backend `http://127.0.0.1:8000`, frontend
`http://localhost:5173`). Per R18.5 each PASS / PARTIAL outcome
below traces back to a per-scenario results file under
`.kiro/specs/phase-2-frontend-workbench/screenshots/`.

| Group | Scenario | Result | Screenshot | Per-scenario results |
|---|---|---|---|---|
| Equal-Spacing | PHASE2-EQ-01 happy path | PASS | `phase2-eq-01-happy.png` | `phase2-eq-results.md` |
| Equal-Spacing | PHASE2-EQ-02 ineligible (frontend gate) | PASS | `phase2-eq-02-ineligible.png` | `phase2-eq-results.md` |
| Equal-Spacing | PHASE2-EQ-03 Stirling needs centered count | PASS | `phase2-eq-03-stirling-even.png` | `phase2-eq-results.md` |
| Hermite | PHASE2-HERMITE-01 happy path | PASS | `phase2-hermite-01-happy.png` | `phase2-hermite-results.md` |
| Hermite | PHASE2-HERMITE-02 missing derivative | PASS | `phase2-hermite-02-missing-derivative.png` | `phase2-hermite-results.md` |
| Hermite | PHASE2-HERMITE-03 basis form omitted | PASS | `phase2-hermite-03-basis-omitted.png` | `phase2-hermite-results.md` |
| Taylor | PHASE2-TAYLOR-01 happy path | PASS | `phase2-taylor-01-happy.png` | `phase2-taylor-results.md` |
| Taylor | PHASE2-TAYLOR-02 unsupported function | PASS | `phase2-taylor-02-unsupported.png` | `phase2-taylor-results.md` |
| Cubic Spline | PHASE2-SPLINE-01 happy path with graph | PASS | `phase2-spline-01-happy.png` | `phase2-spline-results.md` |
| Cubic Spline | PHASE2-SPLINE-02 unsupported boundary | HISTORICAL PARTIAL | `phase2-spline-02-unsupported-boundary.png` | Superseded by Task 4 backend boundary support; future QA should cover clamped, not-a-knot, and periodic success plus periodic endpoint validation. |
| Osculating historical QA | PHASE2-OSCULATING-01 legacy placeholder + sibling | HISTORICAL PASS | `phase2-osculating-01-legacy-placeholder.png`, `phase2-osculating-01-with-sibling.png` | `phase2-osculating-results.md`; superseded by backend Task 3, so future QA should cover successful osculating rendering. |
| V1 / V1+ regressions | PHASE2-V1-01..04 | PASS | `phase2-v1-01-linear-lagrange.png`, `phase2-v1-02-one-over-x.png`, `phase2-v1-03-neville.png`, `phase2-v1-04-newton-dd.png` | `phase2-v1-results.md` |
| Mobile | PHASE2-MOBILE-01 320px overflow | PASS | `phase2-mobile-01-320px.png`, `phase2-mobile-01-320px-hermite.png` | `phase2-mobile-results.md` |

For PHASE2-SPLINE-01 the rendered Graph card source-method Badge text
is `Cubic_spline` and the underlying `graph_data.source_method` value
is the literal `"cubic_spline"`, satisfying R9.4 / R17.5.

### Backend graph accuracy update

Codex fixed backend graph sampling on 2026-05-26 after an accuracy
check. React behavior does not change: continue rendering
`graph_data.x`, `graph_data.f_x`, `graph_data.P_x`, and
`graph_data.error` exactly as returned, with no client-side resampling.

Frontend-relevant details:

- Standard interpolation graph samples still default to
  `source_method: "barycentric"`.
- Cubic spline graph samples still use backend spline segments and
  `source_method: "cubic_spline"`.
- Taylor and Hermite graph samples now use the successful method-owned
  polynomial, so `source_method` can also be `"taylor"`, `"hermite"`,
  or `"hermite_divided_difference"`.
- Exact decimal graph endpoints are generated without Python-float
  drift, so endpoint labels such as `0.3` should remain stable.

### Open caveats

- **TAYLOR-02 trigger.** `sqrt(x)` is whitelist-safe but its
  derivative at `center = 0` is `zoo` (complex infinity), which is
  the documented `unsupported_taylor_function` path the renderer
  exercises. A truly unsafe expression like `gamma(x)` would be
  rejected earlier by the parser whitelist with the different
  documented `unsafe_expression` code.
- **SPLINE-02 historical note.** Driven through a direct in-page
  `fetch("/api/interpolate", ...)` from the DevTools console because
  locked decision #5 keeps the boundary-condition `<select>`
  historical non-natural placeholder options before Task 4/5 enabled implemented boundary modes, so the UI cannot
  send a non-natural value. The renderer's inline `ErrorNotice` for
  `unsupported_boundary_condition` is covered by
  `frontend/src/components/results/methods/CubicSplineDetails.test.tsx`.
  This is superseded by Task 4 backend support for `clamped`,
  `not-a-knot`, and `periodic`; the frontend control remains a Task 5
  follow-up.
- **MOBILE-01 viewport tooling.** The 320×800 viewport was achieved
  via `mcp_chrome_devtools_emulate` with
  `viewport: "320x800x1,mobile,touch"` rather than `resize_page`,
  which clamps the outer browser window only. DOM assertions and the
  offender walk were both captured under that emulation.
- **HERMITE-01 example selection.** The `design.md` §13 row lists
  methods `["hermite_divided_difference", "hermite"]` but the loaded
  "Hermite Divided Difference (Bessel-style)" example only selects
  `hermite_divided_difference`. The Hermite (basis-form) panel is
  exercised separately by HERMITE-03. The renderer fields required
  by the design are all present and read directly from the backend
  payload.

### Reference

- Spec directory:
  `.kiro/specs/phase-2-frontend-workbench/` —
  `requirements.md`, `design.md`, `tasks.md`, `.config.kiro`.
- Screenshots and per-scenario results:
  `.kiro/specs/phase-2-frontend-workbench/screenshots/`.
- Cross-link: `docs/HANDOFF.md` "Session: Phase 2 Frontend Workbench
  (2026-05-26)" carries the full file-by-file change list, command
  exit codes, and honest deviations.
