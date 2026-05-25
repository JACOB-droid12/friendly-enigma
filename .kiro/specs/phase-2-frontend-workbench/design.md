# Design

> Scope. This is the design phase for the `phase-2-frontend-workbench`
> feature. It implements the 18 requirements approved in
> `.kiro/specs/phase-2-frontend-workbench/requirements.md` (R1–R18).
> The scope is the React workbench under `frontend/src/` only. Per
> R1 no file under `backend/` is modified, no endpoint path changes,
> and no field is added to the documented contract in
> `docs/API_CONTRACT.md`. Per R13 the existing Analysis Bench design
> system established by `frontend-analysis-bench-overhaul` and
> `frontend-design-system-overhaul` is preserved as-is — no new
> palette, no new card style, no new typography voice, no new role-
> tag voice, no new motion handle.
>
> Property-based testing is intentionally not applied to this feature.
> The work is a thin contract pass-through plus method-aware UI on
> top of a documented backend contract; it is not a pure-function or
> universal-property domain. R15.4 states this explicitly. Verification
> follows R16: `npm run build`, `npm run lint`, and `npm test` from
> `frontend/`, plus the Browser QA Matrix in R17. There is no
> Correctness Properties section in this design.

---

## Overview

The Phase 2 Frontend Workbench extends the existing React frontend
(`frontend/`, Vite 8 + TypeScript 6 + Tailwind 4 + Base UI v4 + Recharts +
KaTeX, per `frontend/package.json` and `docs/FRONTEND_HANDOFF.md`) so it
can drive every Phase 2 lecture method that the Codex-owned backend
already ships under the stable `POST /api/interpolate` endpoint:

- Equal-Spacing Family: `newton_forward`, `newton_backward`, `stirling`.
- Derivative-Data Family: `hermite_divided_difference`, `hermite`,
  and the deferred `osculating` (rendered from its
  `method_not_implemented` response).
- Function-Derivative Family: `taylor`.
- Piecewise Family: natural `cubic_spline`.

The frontend remains a pure renderer of the documented backend contract
plus a thin method-aware input layer that conditionally adds
`method_options` and `derivatives` to the existing request body. The
design implements `requirements.md` R1–R18 in the order they appear
there. The Traceability Matrix in §17 maps every requirement to the
sections that satisfy it.

This design does not introduce any computation that the backend already
owns. R1.1–R1.5, R6.6, R7.5, R8.5, R9.6, and R11.6 forbid frontend
math; this design honors those by routing every numeric field through
the backend response and keeping every numeric input as a string at the
API boundary.

---

## Context: existing frontend

This section is grounded in actual filenames and exports observed in
the worktree on 2026-05-25. It is read-only context; no edits are
proposed here.

### 2.1 Layers and ownership

`frontend/src/` is organized as the layers below. Phase 2 will extend
each layer additively without changing existing behavior (R12).

- **App state and orchestration** — `frontend/src/App.tsx`. Owns
  `FormState` (the value type defined in `frontend/src/components/InputPanel.tsx`),
  `result: InterpolateResponse | null`, top-level error and
  function-validation error state, and the debounced
  `POST /api/validate-function` effect. Builds the
  `InterpolateRequest` through a local `buildRequest(form)` helper that
  switch-cases on `form.mode`. Default form is
  `methods: ["lagrange", "newton"]`. Keyboard shortcuts route through
  `frontend/src/lib/use-shortcuts.ts`.
- **API client** — `frontend/src/lib/api-client.ts`. Single
  `interpolate(request: InterpolateRequest): Promise<InterpolateResponse>`
  function plus `checkHealth` and `validateFunction`. All three are
  thin `fetch` wrappers; the `BASE_URL` is empty so the Vite dev proxy
  forwards `/api/*` and `/health` to `http://127.0.0.1:8000` per
  `frontend/vite.config.ts`.
- **Contract types** — `frontend/src/lib/api-types.ts`. Exports
  `MethodName = "lagrange" | "newton" | "barycentric" | "neville"`,
  the `InterpolateRequest` shape (no `method_options`, no
  `derivatives`), `PolynomialData` (no `hermite_form`, `taylor_form`,
  `latex_hermite`, `latex_taylor`), and `InterpolateResponse.methods`
  typed with only the four V1 method keys.
- **Warnings catalog** — `frontend/src/lib/warnings.ts`. Flat
  `CATALOG: Record<string, { label, severity }>` consumed via
  `getWarningMeta(code)`. Severity is display-only; the code-to-
  severity mapping exists so the UI can choose a color and an icon
  without recomputing severity from numerical values (R1.5).
- **Display formatting** — `frontend/src/lib/format-numeric.ts` and
  `frontend/src/lib/display-digits.tsx`. Provide a backend-string-
  preserving display ladder consumed by every result renderer.
- **Input panel** — `frontend/src/components/InputPanel.tsx`. Three
  sections: "Interpolation Data" (mode tabs +
  `PointsInput` / `XValuesInput` / `FunctionIntervalInput`), "Methods"
  (`MethodSelector`), and "Precision & Evaluation"
  (`PrecisionSettings`, `EvaluationTargets`, graph toggle).
- **Mode-specific input editors** —
  `frontend/src/components/PointsInput.tsx`,
  `frontend/src/components/XValuesInput.tsx`,
  `frontend/src/components/FunctionIntervalInput.tsx`. Each preserves
  string-valued numeric inputs at the API boundary (R1.4) and uses the
  `font-numeric` voice plus `tabular-nums` (R13).
- **Method catalog** — `frontend/src/components/MethodSelector.tsx`.
  Single flat `ALL_METHODS` array of
  `{ value: MethodName, label, role, highlight?, description }`.
  Renders four checkbox cards in fixed order (Lagrange, Newton,
  Barycentric, Neville) with role tags in the design-system label
  voice. The dispatch point for "what method is selected" is
  `form.methods` on `App.tsx`'s `FormState`.
- **Examples Panel** — `frontend/src/components/ExamplesPanel.tsx`.
  Hard-coded `EXAMPLES` array (`Linear Lagrange`,
  `Second-Degree Lagrange via 1/x`, `Neville Table`,
  `Newton Divided Difference`). Each entry seeds a partial
  `FormState` and never calls `/api/interpolate` directly.
- **Results panel** — `frontend/src/components/ResultsPanel.tsx`. Tab
  bar (Overview / Guide / Polynomial / Evaluations / Graph / Methods /
  Notes), persistent warning bar (warnings live, never hidden), and
  lazy-loaded `GraphCard` and `PolynomialCard` for bundle hygiene.
- **Result renderers** — `frontend/src/components/results/`:
  - `SummaryCard.tsx` — degree, nodes, precision, mode, methods row.
  - `NodesTable.tsx` — node table from `data.nodes`.
  - `EvaluationTable.tsx` — cross-method comparison table.
  - `PolynomialCard.tsx` — Expanded / Factored / Lagrange / Newton
    polynomial forms with KaTeX + copyable plain text.
  - `GraphCard.tsx` — backend `graph_data` arrays only; no
    client-side resampling. Already source-method agnostic — already
    shows `graph_data.source_method` as a Badge (so adding
    `cubic_spline` will work the moment the type union allows it).
  - `MethodDetails.tsx` — per-method tab list with shared
    `MethodError` and `MethodWarnings` helpers and a
    `pickInitialTab()` helper that prefers Lagrange → Newton →
    Neville before Barycentric.
  - `GuidedExplanation.tsx` — defense notes per method using a
    `MethodBlock` per V1 method.
  - `ResultQualityGuide.tsx` — flat
    `WARNING_GUIDANCE: Record<string, { means, check }>` map keyed
    on backend warning code.
  - `EducationalNotes.tsx` — bulleted list from
    `data.educational_notes`.
- **Tests and fixtures** — `frontend/src/test/setup.ts` plus
  `frontend/src/test/interpolate-response.fixtures.ts` exports
  `linearPointsResponse` and `oneOverXResponse` typed with
  `satisfies InterpolateResponse`. Existing Vitest specs live next to
  the components they cover:
  `frontend/src/components/results/results.smoke.test.tsx`,
  `frontend/src/components/results/GuidedExplanation.test.tsx`,
  `frontend/src/components/results/ResultQualityGuide.test.tsx`, and
  `frontend/src/App.examples.test.tsx`. Vitest config lives in
  `frontend/vite.config.ts` (jsdom environment, setup file).

### 2.2 Method-name unions and dispatch points

Today there is exactly one method-name union:
`MethodName` in `frontend/src/lib/api-types.ts`. It is consumed at the
following dispatch points, all of which Phase 2 must extend:

- `MethodSelector.tsx` — the static `ALL_METHODS` array uses
  `MethodName` as the `value` type.
- `MethodDetails.tsx` — both the
  `data.input_summary.methods_requested` filter and the four
  hard-coded `<TabsContent>` panels (`lagrange`, `newton`,
  `barycentric`, `neville`).
- `SummaryCard.tsx` — `METHOD_BADGE: Record<MethodName, BadgeVariant>`
  and the `methods_requested.map((m) => ...)` row.
- `ExamplesPanel.tsx` — `EXAMPLES[i].form.methods` is `MethodName[]`.
- `ResultQualityGuide.tsx` — `WARNING_GUIDANCE` is keyed on warning
  codes, not method names, but the rendered warning chips read the
  per-method warnings.
- `App.tsx` — `DEFAULT_FORM.methods: ["lagrange", "newton"]` and the
  switch-case in `buildRequest(form)` that decides what extra fields
  to put on the request body.

Phase 2 must extend `MethodName` to include the eight Phase 2 method
literals (R2.1) and update each dispatch point. None of the existing
V1 dispatch behavior changes (R12).

### 2.3 What is NOT in the worktree today

A `grep_search` for `newton_forward|newton_backward|stirling|hermite|`
`osculating|taylor|cubic_spline` against `frontend/src/**/*` finds zero
matches. Phase 2 is therefore strictly additive in the frontend layer.
There is no `MethodComparison*` file in `frontend/src/`; the closest
existing surface is `SummaryCard.tsx`'s methods badge row, so the
"Method Comparison Summary" mentioned by R11.3 is implemented as an
additive method-grouping update inside that card. See §10.3.

---

## Architecture

> This is the "Architecture diagram" section requested in
> requirements.md §3. The heading is normalized to `## Architecture`
> to satisfy the Kiro spec format; the content is still the requested
> ASCII diagram plus its callouts.

ASCII diagram. Boxes marked `[E]` already exist; boxes marked `[N]` are
new files added by Phase 2; boxes marked `[X]` are existing files
extended by Phase 2.

```
                ┌─────────────────────────────────────────┐
                │ User (browser, viewport ≥320px)         │
                └────────────────────┬────────────────────┘
                                     │
                                     ▼
   ┌──────────────────────────────────────────────────────────────┐
   │ App.tsx                                                  [X] │
   │   FormState (extended with methodOptions + derivatives)      │
   │   buildRequest(form) → InterpolateRequest                    │
   │   POST /api/validate-function (debounced)                [E] │
   └─────────────┬────────────────────┬─────────────────┬─────────┘
                 │                    │                 │
                 ▼                    ▼                 ▼
       ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐
       │ ExamplesPanel[X] │  │ InputPanel   [X] │  │ Method       │
       │ (V2 lecture      │  │  ┌─────────────┐ │  │ Selector [X] │
       │  examples)       │  │  │ Adaptive    │ │  │ (catalog +   │
       └──────────────────┘  │  │ blocks  [N] │ │  │  family      │
                             │  │ ─ Equal-    │ │  │  groups +    │
                             │  │   spacing   │ │  │  eligibility │
                             │  │   hint      │ │  │  hint +      │
                             │  │ ─ Derivative│ │  │  deferred    │
                             │  │   table     │ │  │  badge)      │
                             │  │ ─ Taylor    │ │  └──────┬───────┘
                             │  │   config    │ │         │
                             │  │ ─ Spline    │ │         │
                             │  │   config    │ │         │
                             │  └─────────────┘ │         │
                             └────────┬─────────┘         │
                                      ▼                   ▼
                       ┌──────────────────────────────────────┐
                       │ lib/api-client.ts          interpolate│
                       │   single POST /api/interpolate    [E]│
                       │   request body now optionally        │
                       │   carries method_options +           │
                       │   derivatives                        │
                       └──────────────────┬───────────────────┘
                                          │
                                          ▼
                       ┌──────────────────────────────────────┐
                       │ Backend (Codex-owned, untouched) [E] │
                       │   FastAPI POST /api/interpolate      │
                       │   returns InterpolateResponse        │
                       │   with methods.{lagrange | newton |  │
                       │   barycentric | neville |            │
                       │   newton_forward | newton_backward | │
                       │   stirling | hermite_divided_difference │
                       │   | hermite | osculating | taylor |  │
                       │   cubic_spline}                      │
                       └──────────────────┬───────────────────┘
                                          │
                                          ▼
   ┌──────────────────────────────────────────────────────────────┐
   │ ResultsPanel.tsx                                         [E] │
   │   Tabs: Overview | Guide | Polynomial | Evaluations |        │
   │         Graph | Methods | Notes                              │
   │   Persistent warning bar (warnings never hidden)             │
   └────────┬───────────┬───────────┬───────────┬───────────┬─────┘
            │           │           │           │           │
            ▼           ▼           ▼           ▼           ▼
   ┌──────────┐  ┌─────────────┐  ┌─────────┐ ┌──────────┐ ┌─────────┐
   │ Summary  │  │ Guided      │  │ Polynom.│ │ Eval     │ │ Graph   │
   │ Card  [X]│  │ Explanation │  │ Card [X]│ │ Table[E] │ │ Card[X] │
   │ (family  │  │  + Result   │  │ (Hermite│ │ (no      │ │ (passes │
   │ grouping │  │  Quality    │  │ Taylor  │ │ change)  │ │ source_ │
   │ + Bary.  │  │  Guide  [X] │  │ tabs +  │ │          │ │ method =│
   │ tag pre- │  │  (Phase 2   │  │ piece-  │ │          │ │ cubic_  │
   │ served)  │  │  codes)     │  │ wise    │ │          │ │ spline) │
   │          │  │             │  │ notice) │ │          │ │         │
   └──────────┘  └─────────────┘  └─────────┘ └──────────┘ └─────────┘
                                          │
                                          ▼
                       ┌──────────────────────────────────────┐
                       │ MethodDetails.tsx                [X] │
                       │   per-method tabs (4 V1 + 7 Phase 2  │
                       │   keys + osculating deferred)        │
                       └──────────────────┬───────────────────┘
                                          │
                                          ▼
   ┌──────────────────────────────────────────────────────────────┐
   │ Family-specific result renderers                             │
   │   ─ EqualSpacingDetails.tsx                              [N] │
   │   ─ HermiteDetails.tsx                                   [N] │
   │   ─ TaylorDetails.tsx                                    [N] │
   │   ─ CubicSplineDetails.tsx                               [N] │
   │   ─ DeferredMethodDetails.tsx (osculating)               [N] │
   │   each renders ONLY backend fields. No client math.          │
   └──────────────────────────────────────────────────────────────┘
```

The frontend is the only consumer that changes. The endpoint, request
shape (additive only), and response shape (Phase 2 keys are additive
and optional under `methods`) all match `docs/API_CONTRACT.md` as
documented today.

---

## Components and Interfaces

> This is the "Component map" section requested in requirements.md
> §4. The heading is normalized to `## Components and Interfaces` to
> satisfy the Kiro spec format; the content is still the requested
> table of every existing file extended and every new file created.

Every existing file Phase 2 touches and every new file Phase 2 adds.
"Existing-extended" means additive edits only; "new" means a new file
under `frontend/src/`. No file under `backend/` appears in this table.

| Path | Kind | Purpose | Requirements covered |
|---|---|---|---|
| `frontend/src/lib/api-types.ts` | existing-extended | Extend `MethodName` union (8 new literals); add `InterpolateRequest.method_options` + `InterpolateRequest.derivatives`; add the eight Phase 2 method response interfaces; extend `PolynomialData` with `hermite_form`, `taylor_form`, `latex_hermite`, `latex_taylor`, and an `expanded_omitted_reason` doc note for `piecewise_method_no_global_polynomial`; widen `InterpolateResponse.methods` to make the eight Phase 2 keys optional. | R2.1, R2.2, R2.3, R2.4, R2.5, R2.6 |
| `frontend/src/lib/api-client.ts` | existing-extended | No structural change. Confirms `interpolate(request)` continues to be the single `POST /api/interpolate` call. | R3.1, R3.5 |
| `frontend/src/lib/warnings.ts` | existing-extended | Add Phase 2 entries to `CATALOG` (display label + severity for `unequal_spacing`, `stirling_requires_centered_nodes`, `target_not_recommended_for_method`, `missing_derivative_data`, `invalid_derivative_order`, `unsupported_taylor_function`, `unsupported_boundary_condition`, `piecewise_method_no_global_polynomial`, `method_not_implemented`). Severity stays backend-driven; this map is only for the chip's color and icon. | R1.5, R11.2 |
| `frontend/src/App.tsx` | existing-extended | Extend `FormState` and `DEFAULT_FORM` with the new optional fields (derivatives table, Taylor center/order, spline boundary). Extend `buildRequest(form)` to attach `method_options` and `derivatives` only when relevant methods are selected. Extend `isFormBlocked` to also block Compute when an Equal-Spacing Family method is selected on ineligible nodes per R5.2 / R4.5. | R3.2, R3.3, R3.4, R4.5, R5.7, R12 |
| `frontend/src/components/InputPanel.tsx` | existing-extended | Render the new adaptive method-aware blocks in a fourth section ("Method Configuration") that is empty by default and only shows the blocks needed by currently-selected Phase 2 methods. No change to the V1 input flow. | R5.1, R5.7, R14.2 |
| `frontend/src/components/MethodSelector.tsx` | existing-extended | Replace the flat `ALL_METHODS` array with a family-grouped catalog (still a single source-of-truth array). Add eligibility-hint copy, deferred badge for `osculating`, and the family group headers. Preserve typography voice and palette. | R4.1, R4.2, R4.3, R4.4, R4.5, R4.6, R10.1, R13 |
| `frontend/src/components/ExamplesPanel.tsx` | existing-extended | Add Phase 2 lecture examples (V2 library) — at least one per implemented Phase 2 method plus a deferred-labelled `osculating` entry. Preserve existing entries and category badges. | R11.4, R11.5, R12.2 |
| `frontend/src/components/PointsInput.tsx` | (no change in this phase) | Reused as-is for nodes in Derivative-Data Family flows. The new derivative input table is a separate component; it does not modify `PointsInput`. | R5.3 |
| `frontend/src/components/DerivativeInputTable.tsx` | new | Method-aware control bound to the user-entered nodes that lets the user enter `f'(x_i)` per node. String inputs only; integer `order` fixed at 1 for current Hermite support. | R5.3, R5.4 |
| `frontend/src/components/TaylorConfigBlock.tsx` | new | Method-aware control for Taylor: `center` string, `order` integer 0..20. Reuses the same `function` field already on the X+f(x) and Interval input editors. | R5.5 |
| `frontend/src/components/CubicSplineConfigBlock.tsx` | new | Method-aware control for natural cubic spline: a `boundary_condition` selector with only `natural` enabled (other options shown disabled with a future-support note). | R5.6, R9.5 |
| `frontend/src/components/EqualSpacingHint.tsx` | new | Frontend-only eligibility hint that summarizes whether the user-entered x-values appear equally spaced. Hint-only parsing is allowed inside this component for the hint's text; the request body still ships strings. | R4.5, R5.2 |
| `frontend/src/components/results/MethodDetails.tsx` | existing-extended | Add the eight Phase 2 panels to the per-method tab list. Each panel delegates to a new family-specific renderer file (see below). Existing V1 panels are untouched. | R6, R7, R8, R9, R10, R12.1 |
| `frontend/src/components/results/methods/EqualSpacingDetails.tsx` | new | Renderer for `newton_forward`, `newton_backward`, and `stirling`. Renders forward / backward / centered difference tables, target guidance advisory copy, and per-evaluation `s` and `terms`. | R6.1, R6.2, R6.3, R6.4, R6.5, R6.6, R14.3 |
| `frontend/src/components/results/methods/HermiteDetails.tsx` | new | Renderer for `hermite_divided_difference` and `hermite`. Renders repeated nodes, divided-difference table, coefficients, nested form, expanded form, LaTeX, basis form (included or omitted). | R7.1, R7.2, R7.3, R7.4, R7.5, R14.3 |
| `frontend/src/components/results/methods/TaylorDetails.tsx` | new | Renderer for `taylor`. Renders center, order, series_name (with Maclaurin label), term list, taylor_form, latex_taylor, evaluations, remainder note. | R8.1, R8.2, R8.3, R8.4, R8.5, R14.3 |
| `frontend/src/components/results/methods/CubicSplineDetails.tsx` | new | Renderer for `cubic_spline`. Renders boundary_condition, ordered_nodes, second_derivatives, segments, continuity_checks, evaluations. Surfaces piecewise notice when `polynomial.expanded_omitted_reason === "piecewise_method_no_global_polynomial"`. | R9.1, R9.2, R9.3, R9.5, R9.6, R14.3 |
| `frontend/src/components/results/methods/DeferredMethodDetails.tsx` | new | Renderer for any method-level `method_not_implemented` response, used for `osculating`. | R10.1, R10.2, R10.3, R10.4 |
| `frontend/src/components/results/GuidedExplanation.tsx` | existing-extended | Add a `MethodBlock` per implemented Phase 2 method with lecture-aligned defense copy, plus a "Deferred methods" block when `osculating` is present. | R11.1, R11.6 |
| `frontend/src/components/results/ResultQualityGuide.tsx` | existing-extended | Add `WARNING_GUIDANCE` rows for Phase 2 codes named in R11.2. Severity stays from `getWarningMeta`. | R11.2, R11.6 |
| `frontend/src/components/results/SummaryCard.tsx` | existing-extended | Group methods by family in the methods row. Preserve Barycentric tag voice as Stable Evaluator and graph support. | R11.3, R12.1, R13 |
| `frontend/src/components/results/PolynomialCard.tsx` | existing-extended | Add Hermite and Taylor polynomial-form tabs when the corresponding `polynomial.hermite_form` / `polynomial.taylor_form` (and their LaTeX counterparts) are present. Surface the piecewise notice when `expanded_omitted_reason === "piecewise_method_no_global_polynomial"`. | R2.4, R7.2, R8.1, R9.3 |
| `frontend/src/components/results/GraphCard.tsx` | (no change in this phase) | Already passes `graph_data` arrays through and already shows `graph_data.source_method` as a Badge. `cubic_spline` works as soon as `MethodName` includes the literal. | R9.4, R12.5 |
| `frontend/src/test/interpolate-response.fixtures.ts` | existing-extended | Add one fixture per Phase 2 method response plus three special fixtures. (See §12 for the alternative sibling-file option.) | R15.1 |
| `frontend/src/components/results/methods/*.test.tsx` | new | Vitest unit tests, one per family renderer, plus a deferred-method test and a graph-card pass-through test for `cubic_spline`. | R15.2, R15.3, R15.5 |
| `.kiro/specs/phase-2-frontend-workbench/screenshots/` | new | Browser QA screenshots referenced from `docs/FRONTEND_HANDOFF.md`. | R17.9 |

The backend boundary list from R1 (no `backend/` edits, no new
endpoint paths, no contract field invention) is enforced by simply not
including any backend file in this table.


---

## Data Models

> This is the "TypeScript types layout" section requested in
> requirements.md §5. The heading is normalized to `## Data Models`
> to satisfy the Kiro spec format; the content is still the
> additive `frontend/src/lib/api-types.ts` extensions, sourced
> verbatim from `docs/API_CONTRACT.md`.

This section describes the additive edits to
`frontend/src/lib/api-types.ts`. Every field is sourced from
`docs/API_CONTRACT.md` exactly as documented; nothing is invented. Where
the contract leaves a field optional, the type marks it optional
(`?:`) so the V1 callers stay untouched. Per R1.3 / R2.6, anything that
is not in the contract is in §16 ("Open questions") instead of in the
type, not silently invented.

### 5.1 MethodName union

Replace the existing four-literal union with the union of the four V1
literals plus the eight Phase 2 literals named in `docs/API_CONTRACT.md`
"Method Names" and re-stated in R2.1.

```ts
export type MethodName =
  | "lagrange"
  | "newton"
  | "barycentric"
  | "neville"
  | "newton_forward"
  | "newton_backward"
  | "stirling"
  | "hermite_divided_difference"
  | "hermite"
  | "osculating"
  | "taylor"
  | "cubic_spline"
```

### 5.2 InterpolateRequest extensions

Add two optional top-level fields. Both default to `undefined` on V1
requests so the existing four-method flow is unchanged.

```ts
export interface DerivativeEntry {
  x: string                  // string at API boundary (R1.4)
  order: number              // integer 1..10 per contract; 1 for current Hermite
  value: string              // string at API boundary (R1.4)
}

export interface TaylorMethodOptions {
  center: string             // numeric string (R1.4)
  order: number              // integer 0..20
}

export type SplineBoundaryCondition = "natural"
// Future boundary conditions are deferred per docs/API_CONTRACT.md and
// R5.6. The literal stays narrow so the UI cannot send something the
// backend rejects.

export interface CubicSplineMethodOptions {
  boundary_condition: SplineBoundaryCondition
}

export interface MethodOptions {
  taylor?: TaylorMethodOptions
  cubic_spline?: CubicSplineMethodOptions
}

export interface InterpolateRequest {
  // ...existing fields unchanged...
  method_options?: MethodOptions
  derivatives?: DerivativeEntry[]
}
```

R3.4 says the corresponding `method_options[name]` block must be omitted
when the method is not selected; the request builder in §6 enforces
this.

### 5.3 Phase 2 method response interfaces

All eight interfaces share the V1 `status / warnings / error` outer
shell already used by `LagrangeResult`, `NewtonResult`, etc. Field
names below are taken verbatim from `docs/API_CONTRACT.md` "P2.1 Equal-
Spacing Methods", "P2.2 Derivative-Data Methods", "P2.3 Taylor Method",
and "P2.4 Natural Cubic Spline Method" sections.

#### 5.3.1 Equal-Spacing Family

```ts
export interface FiniteDifferenceTerm {
  order: number
  value: string
}

export interface EvaluationTargetGuidance {
  recommended: string        // method name string from backend
  target: string
  left: string
  right: string
  midpoint: string
}

export interface EqualSpacingEvaluation {
  x: string
  s: string
  value: string
  terms?: FiniteDifferenceTerm[]
  target_guidance?: EvaluationTargetGuidance
}

export interface NewtonForwardResult {
  status: string
  forward_difference_table: Array<Array<string | null>>
  spacing_h: string
  anchor_index: number
  evaluations: EqualSpacingEvaluation[]
  steps: string[]
  warnings: WarningBody[]
  error: ErrorBody | null
}

export interface NewtonBackwardResult {
  status: string
  backward_difference_table: Array<Array<string | null>>
  spacing_h: string
  anchor_index: number
  evaluations: EqualSpacingEvaluation[]
  steps: string[]
  warnings: WarningBody[]
  error: ErrorBody | null
}

export interface StirlingResult {
  status: string
  centered_difference_table: Array<Array<string | null>>
  spacing_h: string
  center_index: number
  center_x: string
  evaluations: EqualSpacingEvaluation[]
  steps: string[]
  warnings: WarningBody[]
  error: ErrorBody | null
}
```

The contract example for `newton_forward` shows `terms` and
`target_guidance` inside each evaluation entry, while `stirling` shows
them similarly. The shapes above match the contract example. The outer
shell (status + steps + warnings + error) is shared with V1 results.

#### 5.3.2 Derivative-Data Family

```ts
export interface RepeatedNode {
  index: number
  source_node_index: number
  x: string
  y: string
  first_derivative?: string  // contract shows this on Hermite first-derivative case
}

export interface HermiteBasisTerm {
  node_index: number
  x: string
  f_x: string
  f_prime_x: string
  lagrange_basis: string
  value_basis: string
  derivative_basis: string
}

export interface HermiteBasisFormIncluded {
  status: "included"
  formula: string
  terms: HermiteBasisTerm[]
  expanded: string
  latex: string
  matches_divided_difference: boolean
}

export interface HermiteBasisFormOmitted {
  status: "omitted"
  // The contract describes the omission state via the
  // `expanded_polynomial_omitted` warning with
  // `details.artifact === "hermite_basis_form"`. The omitted shape
  // intentionally does not invent extra fields here. See §16.
}

export type HermiteBasisForm =
  | HermiteBasisFormIncluded
  | HermiteBasisFormOmitted

export interface HermiteDividedDifferenceResult {
  status: string
  repeated_nodes: RepeatedNode[]
  divided_difference_table: Array<Array<string | null>>
  coefficients: string[]
  nested_form: string
  expanded: string | null
  latex_expanded: string | null
  latex_hermite: string | null
  evaluations: Array<{ x: string; value: string }>
  steps: string[]
  warnings: WarningBody[]
  error: ErrorBody | null
}

export interface HermiteResult extends HermiteDividedDifferenceResult {
  basis_form?: HermiteBasisForm
}

export interface OsculatingResult {
  status: string
  warnings: WarningBody[]
  error: ErrorBody | null
  // Deferred per docs/API_CONTRACT.md. The renderer relies on
  // `error.code === "method_not_implemented"`. No additional fields
  // are read from this method until the backend implements it.
}
```

#### 5.3.3 Function-Derivative Family

```ts
export interface TaylorTerm {
  order: number
  derivative: string
  derivative_at_center: string
  coefficient: string
  term: string
  latex_term: string
}

export interface TaylorResult {
  status: string
  center: string
  order: number
  series_name: string         // "Taylor" or "Maclaurin" per contract
  terms: TaylorTerm[]
  taylor_form: string
  expanded: string | null
  latex_expanded: string | null
  latex_taylor: string | null
  evaluations: Array<{ x: string; value: string }>
  remainder_note: string
  steps: string[]
  warnings: WarningBody[]
  error: ErrorBody | null
}
```

#### 5.3.4 Piecewise Family

```ts
export interface SplineSegment {
  index: number
  interval: { left: string; right: string }
  coefficients: { a: string; b: string; c: string; d: string }
  local_form: string
  expanded: string
  latex: string
}

export interface SplineContinuityCheck {
  x: string
  value_continuous: boolean
  first_derivative_continuous: boolean
  second_derivative_continuous: boolean
}

export interface SplineEvaluation {
  x: string
  value: string
  segment_index?: number      // contract example shows this on success
}

export interface CubicSplineResult {
  status: string
  boundary_condition: SplineBoundaryCondition
  ordered_nodes: Array<{ index: number; x: string; y: string }>
  second_derivatives: string[]
  segments: SplineSegment[]
  continuity_checks: SplineContinuityCheck[]
  evaluations: SplineEvaluation[]
  steps: string[]
  warnings: WarningBody[]
  error: ErrorBody | null
}
```

### 5.4 PolynomialData extensions

`docs/API_CONTRACT.md` "Success Response Shape" lists the polynomial
block with `hermite_form`, `taylor_form`, `latex_hermite`, and
`latex_taylor` already present (all `null` on V1 success). The
existing TypeScript type is missing these four fields. Add them as
optional/nullable strings, matching the contract's null-on-V1 default.

```ts
export interface PolynomialData {
  expanded: string | null
  factored: string | null
  lagrange_form: string | null
  newton_form: string | null
  hermite_form: string | null
  taylor_form: string | null
  latex_expanded: string | null
  latex_lagrange: string | null
  latex_newton: string | null
  latex_hermite: string | null
  latex_taylor: string | null
  // expanded_omitted_reason now also accepts the documented Phase 2
  // value "piecewise_method_no_global_polynomial".
  expanded_omitted_reason: string | null
}
```

The TypeScript type stays `string | null` for `expanded_omitted_reason`
because the backend may add new reasons over time and the renderer
already handles the unknown-string case (it renders the reason text
through `polynomialText()`). The `piecewise_method_no_global_polynomial`
value is documented in `docs/API_CONTRACT.md` "P2.4 Natural Cubic
Spline Method" and is the trigger for §10.4's piecewise notice.

### 5.5 InterpolateResponse.methods extension

Phase 2 method keys are additive and optional, so V1 consumers keep
working (R2.5):

```ts
export interface InterpolateResponse {
  // ...unchanged top-level fields...
  methods: {
    lagrange?: LagrangeResult
    newton?: NewtonResult
    barycentric?: BarycentricResult
    neville?: NevilleResult
    newton_forward?: NewtonForwardResult
    newton_backward?: NewtonBackwardResult
    stirling?: StirlingResult
    hermite_divided_difference?: HermiteDividedDifferenceResult
    hermite?: HermiteResult
    osculating?: OsculatingResult
    taylor?: TaylorResult
    cubic_spline?: CubicSplineResult
  }
}
```

Per R2.6 nothing here goes beyond `docs/API_CONTRACT.md`. The fields
that are described in the contract by example only (e.g. `s`, `terms`,
`target_guidance`) are typed exactly as the example shows them.

---

## API client behavior

The frontend keeps `frontend/src/lib/api-client.ts` exactly as it is
today (R3.1, R3.5). The `interpolate(request)` function is the single
network call; Phase 2 changes only what is in `request`.

### 6.1 Single endpoint

There is no new function, no per-method endpoint, no GraphQL or
streaming alternative (R3.5). `health` polling and the debounced
`POST /api/validate-function` for the function input continue to work
as today.

### 6.2 Request builder concept

The request builder lives in `App.tsx`'s `buildRequest(form)`. Phase 2
extends it to conditionally attach `method_options` and `derivatives`
based on the selected methods. The shape below is illustrative; it
preserves R1.4 (numeric values stay strings) and R3.4 (omit the per-
method `method_options[name]` block when the method is not selected).

```ts
function buildMethodOptions(form: FormState): MethodOptions | undefined {
  const out: MethodOptions = {}

  if (form.methods.includes("taylor")) {
    out.taylor = {
      center: form.taylorCenter,                 // string from input
      order: form.taylorOrder,                   // integer 0..20
    }
  }

  if (form.methods.includes("cubic_spline")) {
    out.cubic_spline = {
      boundary_condition: form.splineBoundaryCondition, // "natural"
    }
  }

  return Object.keys(out).length > 0 ? out : undefined
}

function buildDerivatives(form: FormState): DerivativeEntry[] | undefined {
  const needsDerivatives =
    form.methods.includes("hermite_divided_difference") ||
    form.methods.includes("hermite") ||
    form.methods.includes("osculating")
  if (!needsDerivatives) return undefined
  return form.derivatives
    .filter((d) => d.x.trim() !== "" && d.value.trim() !== "")
    .map((d) => ({ x: d.x, order: 1, value: d.value }))
}

function buildRequest(form: FormState): InterpolateRequest {
  const base: InterpolateRequest = {
    mode: form.mode,
    methods: form.methods,
    precision: form.precision,
    exact: form.exact,
    evaluation_x: form.evaluationX.filter((x) => x.trim() !== ""),
    graph: form.graph,
  }

  switch (form.mode) {
    case "points":
      base.points = form.points.filter((p) => p[0].trim() !== "" || p[1].trim() !== "")
      break
    case "x_values_with_function":
      base.x_values = form.xValues.filter((x) => x.trim() !== "")
      base.function = form.functionExpr
      break
    case "function_interval":
      base.function = form.functionExpr
      base.interval = [form.intervalStart, form.intervalEnd]
      base.node_strategy = form.nodeStrategy
      base.node_count = form.nodeCount
      break
  }

  const methodOptions = buildMethodOptions(form)
  if (methodOptions) base.method_options = methodOptions

  const derivatives = buildDerivatives(form)
  if (derivatives) base.derivatives = derivatives

  return base
}
```

Notes:

- Per R3.4, when no Phase 2 method that needs `method_options` is
  selected, the `method_options` key is not added to the body at all
  (not added with `{}`).
- Per R5.4, `order` is hard-coded to 1 inside `buildDerivatives` for
  current Hermite support; Hermite higher orders are deferred at the
  backend and would currently surface `invalid_derivative_order`.
- Per R10.1, selecting `osculating` is allowed: the request goes
  through unchanged and the backend's `method_not_implemented`
  response is rendered by §9.5.

### 6.3 What does NOT change

- No `BASE_URL` change (still empty so the Vite proxy forwards in dev
  per `frontend/vite.config.ts`).
- No new error class (the existing `ApiError` in
  `frontend/src/lib/api-client.ts` already exposes `code` and
  `details`).
- No retry logic, no streaming, no SSE, no WebSocket.

---

## Adaptive Input Panel design

The Input Panel keeps its three existing sections ("Interpolation
Data" / "Methods" / "Precision & Evaluation") and adds a fourth section
between "Methods" and "Precision & Evaluation" called **Method
Configuration**. This section is empty by default (R5.7); only the
blocks needed by currently-selected Phase 2 methods are rendered. None
of this changes V1 layout.

### 7.1 Equal-Spacing Family

When any of `newton_forward`, `newton_backward`, or `stirling` is
selected, the Input Panel reuses the existing X+f(x) / Points editors
for the nodes (R5.1) and renders a new `EqualSpacingHint` component:

- Reads `form.points[]` (or `form.xValues[]` for the X+f(x) mode) and
  computes a frontend-only summary:
  - "Spacing appears equal: h ≈ (rounded float)" when consecutive
    differences look equal within a small frontend tolerance.
  - "Spacing not equal: differences vary by N orders of magnitude" when
    they do not.
- The hint is internally allowed to `parseFloat` for hint-only purposes
  because R1.4 only forbids floating-point parsing for the request
  body. The hint computes nothing about interpolation; it computes
  only "are the user-typed strings approximately equally spaced". The
  request body always ships strings.
- The hint never auto-switches the method (R6.4).

Compute-blocking rule (R4.5, R5.2):

- If the only Equal-Spacing Family methods selected are ineligible
  (the hint shows "spacing not equal"), Compute is dimmed for that
  context. This is implemented by extending `App.tsx`'s
  `isFormBlocked` predicate with an `equalSpacingIneligible` flag.
- If at least one selected method is eligible (e.g. user has
  `lagrange + newton_forward` selected on unequal nodes), Compute
  stays enabled. The backend will return a method-level
  `unequal_spacing` error for `newton_forward` while the eligible
  methods succeed. The renderer (§9.1) shows the method-level error
  inline.

Mobile rules (R14.2): the hint stacks below the method selector on
viewports narrower than `md`.

### 7.2 Derivative-Data Family

When any of `hermite_divided_difference`, `hermite`, or `osculating` is
selected, the Input Panel renders a new `DerivativeInputTable`:

- One row per node currently in `form.points[]` (or `form.xValues[]`
  for the X+f(x) mode). The table is keyed to node index so adding or
  removing a node row updates the derivative rows in lockstep.
- Each row exposes a single `value` string input (R5.3, R5.4). `x` is
  inherited from the corresponding node row, so the user does not
  retype it. The bound state is `form.derivatives[i] = { x, value }`,
  with `order: 1` injected by `buildDerivatives` per R5.4.
- A short helper paragraph at the top of the table reads "Hermite
  currently supports first-derivative data only (order = 1)." This
  paragraph is body voice, label color, no new typography.

The table follows the existing `PointsInput` labelled-grid pattern so
screen readers announce the columns ("node x", "derivative value")
without depending on the visual subscript.

`osculating` selection still allows the request to go through (R10.1).
The deferred renderer in §9.5 reads the backend
`method_not_implemented` response.

### 7.3 Function-Derivative Family

When `taylor` is selected, the Input Panel renders a new
`TaylorConfigBlock`:

- Mode hint: Taylor must be sent through one of the existing function-
  backed modes (`x_values_with_function` or `function_interval`) per
  `docs/API_CONTRACT.md` "P2.3 Taylor Method". If the user is on
  `points` mode, the block surfaces a small disabled state with a
  short body-voice line: "Taylor needs a function expression. Switch
  to X + f(x) or Interval mode."
- Inputs (R5.5):
  - `center` — labelled "Center", numeric voice string input.
  - `order` — labelled "Order", numeric `<input type="number" min={0}
    max={20} step={1}>`. Out-of-range produces an inline error notice
    using the existing `ErrorNotice` shared component, the same way
    `FunctionIntervalInput`'s node-count input does today.
- The function expression itself is the existing
  `XValuesInput`/`FunctionIntervalInput` `function` input (R5.5
  "function expression input bound to the existing `function` field").
  The Taylor block does NOT introduce a second function input.

### 7.4 Piecewise Family

When `cubic_spline` is selected, the Input Panel renders a new
`CubicSplineConfigBlock`:

- A single labelled `<select>` named "Boundary Condition" (R5.6).
- Options:
  - "Natural" (value `natural`) — enabled.
  - "Clamped (deferred)" — disabled, shown only as a placeholder so
    users know other boundary conditions are planned. On hover/focus,
    the option's `title` attribute contains "Backend currently
    accepts only natural; clamped is deferred."
- A short body-voice helper paragraph: "Natural cubic spline ties the
  second derivative to zero at the interval ends."

Mobile (R14.2): the block stacks below the derivative table when
both are visible on viewports narrower than `md`.

### 7.5 Adaptive block visibility rules (summary)

| Selected method present in `form.methods`? | Block rendered |
|---|---|
| `newton_forward` ∨ `newton_backward` ∨ `stirling` | `EqualSpacingHint` |
| `hermite_divided_difference` ∨ `hermite` ∨ `osculating` | `DerivativeInputTable` |
| `taylor` | `TaylorConfigBlock` |
| `cubic_spline` | `CubicSplineConfigBlock` |
| none of the above | (nothing — default V1 behavior, R5.7) |

The blocks render in the order listed above. They live in a new
"Method Configuration" card section that is itself hidden when no
Phase 2 method is selected, so V1 users see exactly today's layout.


---

## Method Selector / catalog design

The `MethodSelector` keeps the existing card UI (R4.6, R13). The
internal data model changes from a single flat list to a single
source-of-truth array of catalog entries grouped by family.

### 8.1 Catalog shape

```ts
type MethodFamily =
  | "construction"           // Lagrange, Newton (V1)
  | "stable_evaluator"       // Barycentric (V1)
  | "target_specific"        // Neville (V1)
  | "equal_spacing"          // Phase 2
  | "derivative_data"        // Phase 2
  | "function_derivative"    // Phase 2
  | "piecewise"              // Phase 2

interface MethodCatalogEntry {
  value: MethodName
  label: string                    // human label (e.g. "Newton Forward")
  family: MethodFamily             // group key
  role: string                     // role tag rendered in font-label
  highlight?: boolean              // primary tint (Barycentric only today)
  description: string              // one-sentence classroom role description
  eligibilityHint?: string         // shown next to the card; equal-spacing only
  deferred?: boolean               // true for osculating
  deferredNote?: string            // body-voice deferred-state copy
}
```

### 8.2 Family group order and copy

| Family | Group label | Members | Role tag | Notes |
|---|---|---|---|---|
| `construction` | "Construction" | `lagrange`, `newton` | "Construction" | Unchanged from today. |
| `stable_evaluator` | "Stable Evaluator" | `barycentric` | "Stable Evaluator" | Highlighted (`highlight: true`); copy preserved per R12.1 / R11.3. |
| `target_specific` | "Target-Specific" | `neville` | "Target-Specific" | Unchanged. |
| `equal_spacing` | "Equal Spacing" | `newton_forward`, `newton_backward`, `stirling` | "Equal Spacing" | Each carries an eligibility hint (R4.3). |
| `derivative_data` | "Derivative Data" | `hermite_divided_difference`, `hermite`, `osculating` | "Derivative Data" | `osculating` is `deferred: true` (R4.4, R10.1). |
| `function_derivative` | "Function Derivative" | `taylor` | "Function Derivative" | — |
| `piecewise` | "Piecewise" | `cubic_spline` | "Piecewise" | — |

The role-tag string is unchanged for the four V1 methods (R12.1,
R13.3). All Phase 2 role tags are rendered using the existing
`font-label` utility — no new typography.

### 8.3 Per-method copy

```text
Construction
  Lagrange       → "Lagrange shows basis polynomials and summation form."
  Newton         → "Newton shows divided-difference tables and nested form."
Stable Evaluator
  Barycentric    → "Barycentric provides stable evaluation and is the source for graph data."
Target-Specific
  Neville        → "Neville produces target-specific triangular tables."
Equal Spacing                                 (eligibilityHint: "Requires equally spaced nodes.")
  Newton Forward → "Forward differences near the first nodes."
  Newton Backward→ "Backward differences near the last nodes."
  Stirling       → "Centered differences near a chosen midpoint."
Derivative Data
  Hermite Div Diff → "Repeated-node divided differences using f'(x_i)."
  Hermite        → "Hermite construction with optional basis form output."
  Osculating     → "Generalized derivative matching." [deferred]
Function Derivative
  Taylor         → "Local Taylor / Maclaurin polynomial around a center."
Piecewise
  Cubic Spline   → "Natural cubic spline segments tied at interior knots."
```

### 8.4 Eligibility hint and deferred badge

- Eligibility hint (R4.3): a short body-voice line under the card
  description, e.g. "Requires equally spaced nodes." The hint is
  static descriptive copy. The dynamic hint about whether the *current*
  nodes are equally spaced lives in the Input Panel (§7.1), not on the
  catalog card, because the catalog card has no access to the user's
  node values.
- Deferred badge (R4.4, R10.1): `osculating` carries a small chip
  rendered with the existing `Badge` primitive at variant
  `secondary`, content `"Deferred"`. The chip sits at the top-right
  of the card and uses no new color. Below the description, a body-
  voice line reads "Backend currently returns a method-level error;
  see Methods tab for details."

### 8.5 Layout

The selector grid expands from a 1- or 2-column flat layout to a
family-grouped layout:

- Each family is rendered as a small section with a `font-label`
  family heading and a `grid grid-cols-1 sm:grid-cols-2` body of
  cards.
- The inter-family vertical gap is the existing `xs` (4px) section
  rhythm between sections of the input card; no new spacing token.
- The per-card visual treatment (selected ring, focus-within ring,
  rounded-lg, border, hover state, label voice for role tag) is
  preserved exactly (R13.4).
- Width contract: the selector still occupies the full width of the
  Methods card content area; cards still use `grid-cols-1
  sm:grid-cols-2` so they stack on small viewports (R14.2).

### 8.6 What the selector does NOT do

- It does not parse the user's `points[]` to gate Equal-Spacing
  selection at the catalog level. Selection of an Equal-Spacing
  method is always allowed; eligibility is communicated through the
  Input Panel hint (§7.1) and Compute-blocking flag (§7.1).
- It does not auto-add Phase 2 methods on example load. Examples set
  `form.methods` explicitly per R11.4 / R11.5.
- It does not change the Compute button label, voice, or position
  (R13.4).

---

## Result renderers

This section describes one renderer per family. Each new file lives at
`frontend/src/components/results/methods/<Family>Details.tsx` and is
wired into `MethodDetails.tsx`'s tab list. Each renderer reads only
backend fields; nothing is computed in the client (R6.6, R7.5, R8.5,
R9.6, R10.3, R11.6).

### 9.1 Equal-Spacing renderer (`EqualSpacingDetails.tsx`)

Used for the `newton_forward`, `newton_backward`, and `stirling`
panels in `MethodDetails`. The component accepts a discriminated union
of `NewtonForwardResult | NewtonBackwardResult | StirlingResult` and
narrows by checking which difference-table key is present.

Layout (top to bottom):

1. `MethodError` and `MethodWarnings` (the existing
   `MethodDetails`-internal helpers; no new error component). On
   `unequal_spacing` or `stirling_requires_centered_nodes`, the
   `ErrorNotice` shows the backend `code` and `message` exactly
   (R6.5). Sibling methods stay visible; the error is contained
   inside this method's tab (R6.5, R10.4).
2. **Spacing summary** — a small grid in the existing `bg-muted/30
   rounded-lg p-3` block:
   - `spacing_h` (label: "Spacing h", numeric voice).
   - For `newton_forward`/`newton_backward`: `anchor_index` (label:
     "Anchor index", numeric voice).
   - For `stirling`: `center_index` and `center_x` (numeric voice).
3. **Difference table** — wrapped in `overflow-x-auto rounded-lg`
   (R14.3). Columns are `Δ⁰` / `Δ¹` / `Δ²` / ... rendered with the
   existing `font-label` voice header pattern from `NewtonDetails`.
   Cells render `string | null` exactly; `null` becomes the centered
   muted dot the V1 renderers already use.
4. **Per-evaluation block** — one row per `evaluations[i]`:
   - "x" (numeric voice).
   - "s" (numeric voice).
   - "Value" — `evaluations[i].value` (numeric voice).
   - "Terms" — small list of `terms[].order` and `terms[].value`.
5. **Target guidance** — when `evaluations[i].target_guidance` is
   present and `recommended` differs from this method's name, a
   body-voice notice reads "Backend recommends `<recommended>` for
   target x near `<target>` (interval `<left>` to `<right>`,
   midpoint `<midpoint>`)." Per R6.4 this is advisory only; the UI
   does not auto-switch.
6. **Steps** — existing `ol` list pattern, identical to V1
   renderers.

Sibling-method behavior (R6.5): when one Equal-Spacing method fails
with a method-level error, the other methods (siblings) keep
rendering. The failing method's tab gains the existing
`AlertTriangle` icon next to its label, courtesy of the
`MethodDetails` per-tab `status !== "ok"` indicator.

What is NOT computed here: forward differences, backward differences,
centered differences, factorial coefficients, target guidance text. All
six R6.6 forbids; all six come from the backend response.

### 9.2 Hermite renderer (`HermiteDetails.tsx`)

Used for the `hermite_divided_difference` and `hermite` panels.
Accepts `HermiteDividedDifferenceResult | HermiteResult` and detects
the basis branch via `("basis_form" in result)`.

Layout (top to bottom):

1. `MethodError` and `MethodWarnings`. On `missing_derivative_data` or
   `invalid_derivative_order`, the error renders inline via
   `ErrorNotice`; the form does not auto-fill or estimate
   derivatives (R7.4).
2. **Repeated nodes table** — one row per `repeated_nodes[i]`. Columns:
   `index`, `source_node_index`, `x`, `y`, `first_derivative`. Header
   row in `font-label`; cells in `font-numeric`. Wrapped in
   `overflow-x-auto rounded-lg` (R14.3).
3. **Divided-difference table** — same layout as the existing
   `NewtonDetails` divided-difference table; reused header/cell
   convention so the visual rhythm matches (R13).
4. **Coefficients chip row** — `coefficients[i]` rendered as the
   existing chip pattern from `NewtonDetails`.
5. **Forms** — `nested_form`, `expanded`, plus `latex_expanded`
   rendered through `KatexDisplay`, mirroring `NewtonDetails`.
6. **Basis form** — only for `methods.hermite`:
   - When `basis_form.status === "included"`: render the formula
     line, then a `terms[]` table with one row per node and the
     existing label/numeric voice pattern. Render `expanded` and
     `latex` through `KatexDisplay`. Show the
     `matches_divided_difference` boolean as a small badge ("matches
     divided difference: ✓" or "✗") in body voice.
   - When `basis_form.status === "omitted"`: render an
     informational notice that includes the corresponding
     `expanded_polynomial_omitted` warning message + code if it is
     in `result.warnings`. Per R7.3, the renderer does not
     reconstruct the basis form; it only displays the omission state.
     Implementation note: the omission's machine-readable reason is
     carried in the warning's `details.artifact ===
     "hermite_basis_form"`; see §11 for the warnings catalog row.
7. **Steps** — same `ol` pattern as V1.

What is NOT computed: repeated-node duplication, divided-difference
table cells, basis polynomial multiplications, evaluation values,
warning severity (R7.5).

### 9.3 Taylor renderer (`TaylorDetails.tsx`)

Used for the `taylor` panel. Accepts `TaylorResult`.

Layout:

1. `MethodError` and `MethodWarnings`. On `unsupported_taylor_function`
   or any Taylor option validation error, render the error inline via
   `ErrorNotice` (R8.4). No client-side computation.
2. **Header row** — `center` (numeric voice), `order` (numeric voice),
   `series_name` (label voice). When `series_name === "Maclaurin"`,
   surface a small Badge "Maclaurin (center = 0)" next to the header
   (R8.3). The polynomial fields themselves are not altered.
3. **Term table** — one row per `terms[]`. Columns:
   - `order`
   - `derivative`
   - `derivative_at_center`
   - `coefficient`
   - `term`
   - `latex_term` rendered through `KatexDisplay`
   All numeric values use `font-numeric`; column headers use
   `font-label` (R13.3).
4. **Polynomial forms** — `taylor_form`, `expanded`,
   `latex_expanded`, `latex_taylor` rendered through the existing
   `PolynomialCard`-style pattern (label header + KaTeX wrapper +
   copyable `<pre>` block in `font-numeric`). The Polynomial card
   itself also surfaces these forms when present (§5.4 / §10.3).
5. **Evaluations** — one chip per `evaluations[]` showing
   `P(x) = value` (numeric voice), reusing the chip pattern from
   `NevilleDetails`.
6. **Remainder note** — render `remainder_note` text exactly. No
   editing, no truncation.
7. **Steps** — `ol` pattern as V1.

What is NOT computed: derivatives, coefficients, terms, polynomial
expansion, remainder notes, Maclaurin/Taylor naming. R8.5 forbids
calling SymPy or Math.js client-side; this design does not import
either.

### 9.4 Cubic spline renderer (`CubicSplineDetails.tsx`)

Used for the `cubic_spline` panel. Accepts `CubicSplineResult`.

Layout:

1. `MethodError` and `MethodWarnings`. On `unsupported_boundary_condition`,
   render the error inline (R9.5). No client-side construction of
   coefficients or continuity checks.
2. **Boundary condition badge** — `boundary_condition` rendered via
   the existing Badge primitive at `variant="secondary"`. No new
   color.
3. **Ordered nodes table** — one row per `ordered_nodes[i]` with
   columns `index`, `x`, `y`. The card surfaces the
   `nodes_reordered` warning when present (the UI mapping is in
   `warnings.ts`; see §11).
4. **Second derivatives** — small chip row showing
   `second_derivatives[i]` per node. Header in `font-label`
   ("Second Derivatives M_i").
5. **Segments table** — one row per `segments[i]`. Columns:
   - `index`
   - `interval` rendered as `[left, right]`
   - `coefficients.a`, `.b`, `.c`, `.d` (four numeric-voice columns)
   - `local_form` (numeric voice, `<code>`)
   - `expanded` (numeric voice, `<code>`)
   - `latex` rendered through `KatexDisplay`
   The table is wrapped in `overflow-x-auto rounded-lg` per R14.3.
6. **Continuity checks** — one row per `continuity_checks[i]` with
   columns `x`, `value_continuous`, `first_derivative_continuous`,
   `second_derivative_continuous`. Booleans render as ✓ / ✗ with
   text labels for screen readers (no color-only).
7. **Evaluations** — one chip per `evaluations[]`. When
   `segment_index` is present, append "(segment i)" in body voice.
8. **Piecewise notice** — when
   `polynomial.expanded_omitted_reason === "piecewise_method_no_global_polynomial"`,
   the Polynomial tab and this renderer both surface a body-voice
   notice: "This is a piecewise spline; the backend does not return a
   single global polynomial." This satisfies R9.3.

GraphCard pass-through (R9.4): when `graph_data.source_method ===
"cubic_spline"`, the existing `GraphCard.tsx` renders the backend
arrays exactly. No edits to `GraphCard` are required because it
already accepts `source_method` as a string and does not branch on V1
literals. The piecewise notice in this renderer hyperlinks the user
to the Graph tab when `graph_data` is present.

What is NOT computed: spline coefficients, segment polynomials,
continuity checks, sample points, graph arrays, segment-index
membership for evaluations. R9.6 forbids each.

### 9.5 Deferred renderer (`DeferredMethodDetails.tsx`)

Used for any method whose response carries
`error.code === "method_not_implemented"`, currently only `osculating`.

Layout:

1. **Deferred badge** — Badge with `variant="secondary"`, content
   `"Deferred"`.
2. **Backend error block** — body-voice paragraph:
   `error.message` followed by `Code: method_not_implemented` in
   `font-numeric`. This reuses the existing `ErrorNotice` shared
   component with `severity="warning"` (warning, not destructive,
   because the response is a deliberate deferred state, not a
   validation failure).
3. **Lecture-aware copy** — single body-voice paragraph: "Generalized
   osculating polynomials match higher-order derivatives at each
   node. The backend has not implemented this yet; pick Hermite for
   first-derivative matching."
4. **No tables, no terms, no derivatives** are rendered (R10.3).

When the top-level `status === "partial"` and the only failing method
is `osculating`, the Results Panel keeps every sibling renderer
visible (R10.4). This is automatic because `MethodDetails` already
filters by `data.input_summary.methods_requested.filter((m) =>
data.methods[m])` and renders one panel per method, independent of
the others.


---

## Cross-cutting renderer updates

### 10.1 GuidedExplanation

`frontend/src/components/results/GuidedExplanation.tsx` keeps its
existing structure (Section header, summary tiles, Polynomial result,
Evaluation result, Method guide, How to present). Phase 2 adds
`MethodBlock` entries inside the "Method guide" grid for each
implemented Phase 2 method, plus a "Deferred methods" block when
`osculating` is present. R11.6 forbids client-side computation; each
block reads only from `data.methods[<name>]` and the input summary.

| MethodBlock title | Triggered when | Body |
|---|---|---|
| "Newton Forward" | `data.methods.newton_forward` exists | Forward differences are most appropriate near the first nodes. The backend returns `forward_difference_table`, `s = (x - x_0)/h`, `terms`, and `target_guidance`. |
| "Newton Backward" | `data.methods.newton_backward` exists | Backward differences are most appropriate near the last nodes. Backend returns `backward_difference_table`, `s = (x - x_n)/h`, and `target_guidance`. |
| "Stirling" | `data.methods.stirling` exists | Centered differences require an odd number of equally spaced nodes. Backend returns `centered_difference_table`, `center_index`, `center_x`, and per-evaluation `s`. |
| "Hermite Divided Difference" | `data.methods.hermite_divided_difference` exists | Hermite duplicates each node and uses `f'(x_i)` as the first divided difference. Backend returns `repeated_nodes` and the divided-difference table. |
| "Hermite Basis Form" | `data.methods.hermite` and `basis_form.status === "included"` | Hermite basis polynomials match value and derivative at each node. The basis form is shown when the backend returns it; otherwise the `expanded_polynomial_omitted` warning explains why it was hidden. |
| "Taylor / Maclaurin" | `data.methods.taylor` exists | Taylor approximates locally around `center`. Backend returns derivative terms, polynomial forms, and a remainder note. When `series_name === "Maclaurin"`, the center is 0. |
| "Cubic Spline" | `data.methods.cubic_spline` exists | Natural cubic spline ties the second derivative to zero at the boundary. The polynomial is piecewise; no single global polynomial exists. |
| "Deferred methods" | `data.methods.osculating?.error?.code === "method_not_implemented"` | Generalized osculating polynomial matching is deferred until the backend implements it. The frontend shows the backend response exactly. |

The blocks use the existing `MethodBlock` component (already in
`GuidedExplanation.tsx`) so typography, spacing, and surface match
V1 (R13).

### 10.2 ResultQualityGuide

`frontend/src/components/results/ResultQualityGuide.tsx` adds entries
to its `WARNING_GUIDANCE` map for every Phase 2 code named in R11.2.
Each entry uses the existing `{ means, check }` pair shape so the
rendering code is unchanged. Severity continues to come from
`getWarningMeta` (§11), not from per-row computation.

| Backend code | "What it means" | "Check next" |
|---|---|---|
| `unequal_spacing` | The selected equal-spacing method needs nodes at equal intervals; this set varies. | Check the X-values' spacing or pick a non-equal-spacing method (Lagrange, Newton, Neville). |
| `stirling_requires_centered_nodes` | Stirling needs an odd number of equally spaced nodes so a single center exists. | Add or remove a node so the count is odd, or pick `newton_forward` / `newton_backward` instead. |
| `target_not_recommended_for_method` | The backend says the target x is not in the recommended region for this method. | The numerical answer is still valid; consider using the recommended method for accuracy near this target. |
| `missing_derivative_data` | Hermite needs a first derivative at every node. | Fill in the derivative table or remove Hermite from the method list. |
| `invalid_derivative_order` | The selected method does not currently support that derivative order. | Hermite supports order 1 only today; remove higher-order rows or wait for backend `osculating`. |
| `expanded_polynomial_omitted` | The polynomial / basis form was too large to render comfortably and was omitted. | Use the smaller forms (nested, divided-difference table, segment list) or reduce the node count. |
| `unsupported_taylor_function` | The function expression cannot produce a Taylor polynomial under the safe parser. | Check the function spelling, allowed-functions list, and the `center` value before recomputing. |
| `unsupported_boundary_condition` | Cubic spline got a boundary condition the backend does not implement. | Switch the boundary selector to "natural" (the only enabled option today). |
| `piecewise_method_no_global_polynomial` | A piecewise method does not have a single global polynomial. | Use the segment list, continuity checks, and graph instead of expecting a closed-form polynomial. |
| `nodes_reordered` | The backend reordered nodes for segment construction (cubic spline) or numerical stability. | Verify the displayed order matches your expectations before matching to lecture notes. |
| `method_not_implemented` | The selected method is accepted by schema but not implemented yet. | Pick an implemented method (Hermite for derivative matching) or wait for backend support. |

R11.2 lists the same code set; this table is the rendering side of it.
R1.5 keeps severity backend-driven through `warnings.ts`.

### 10.3 Method Comparison Summary (in SummaryCard)

There is no separate `MethodComparison*` component in the worktree
today (confirmed by grep). The closest existing surface is the
methods row at the bottom of `SummaryCard.tsx`. R11.3 is satisfied by
extending that row:

- Render the methods grouped by family. Family order matches the
  catalog (§8.2). Within a family, methods are listed in catalog
  order.
- Each method renders as the existing `Badge` primitive. The
  per-method badge variant comes from a `Record<MethodName,
  BadgeVariant>` table. V1 mappings are preserved exactly:
  `lagrange` and `newton` are `secondary`; `barycentric` is `default`
  (primary tint, the same accent the existing
  `frontend-design-system-overhaul` `SummaryCard` uses for the
  Stable Evaluator tag); `neville` is `info`. Phase 2 mappings:
  `newton_forward`, `newton_backward`, `stirling`,
  `hermite_divided_difference`, `hermite`, `taylor`, `cubic_spline`
  all reuse `secondary` so they read as additional methods, not as
  primary or info-tinted accents (R12.1, R13.4). `osculating` reuses
  `secondary` and gets the deferred chip described in §8.4.
- Family group labels render in `font-label` voice between badge
  rows. No new typography (R13.3).
- Barycentric copy stays as Stable Evaluator and graph support
  (R12.1, R11.3); no Phase 2 change reframes Barycentric as a
  primary classroom construction method.

This is the smallest possible change that satisfies R11.3 and avoids
introducing a new surface that would compete with the Method Details
tab.

### 10.4 PolynomialCard

`frontend/src/components/results/PolynomialCard.tsx` already renders
internal Tabs (Expanded / Factored / Lagrange / Newton). Phase 2 adds
two conditional tabs:

- **Hermite tab** — visible when `polynomial.hermite_form` is
  non-null. Renders `polynomial.hermite_form` (numeric voice) and
  `polynomial.latex_hermite` through `KatexDisplay`. Reuses the
  existing tab-body container; no new visual primitive.
- **Taylor tab** — visible when `polynomial.taylor_form` is non-null.
  Renders `polynomial.taylor_form` and `polynomial.latex_taylor`.

When `polynomial.expanded_omitted_reason ===
"piecewise_method_no_global_polynomial"`, the Expanded tab content
becomes a body-voice notice: "Cubic spline is piecewise; no single
global polynomial. See the Methods tab for the segment list." The
Factored tab is hidden in the same case because there is no global
polynomial to factor. This satisfies R9.3 at the polynomial-card
level.

### 10.5 Examples Panel (Lecture Example Library V2)

`frontend/src/components/ExamplesPanel.tsx` keeps the four existing
V1 examples (R12.2) and adds at least one Phase 2 example per
implemented method (R11.4). The category badge reuses the existing
`CATEGORY_BADGE` variants (`default` / `info` / `secondary`); no new
color.

| Example title | Mode | Methods | Source / notes |
|---|---|---|---|
| "Newton Forward (cos x at 1.0…2.2)" | `x_values_with_function` | `["newton_forward"]` | Lecture data: `function = cos(x)`, x = `1.0`, `1.3`, `1.6`, `1.9`, `2.2`; `evaluation_x = ["1.5"]`. Sourced from `docs/API_CONTRACT.md` "P2.1" section. |
| "Newton Backward (cos x)" | `x_values_with_function` | `["newton_backward"]` | Same nodes; emphasizes the last-node anchor. |
| "Stirling (cos x, centered)" | `x_values_with_function` | `["stirling"]` | Same nodes; demonstrates centered differences. |
| "Hermite Divided Difference (Bessel-style)" | `points` | `["hermite_divided_difference"]` | Lecture data per `docs/API_CONTRACT.md` "P2.2": points (1.3, 0.6200860), (1.6, 0.4554022), (1.9, 0.2818186); derivatives -0.52202324741466, -0.56989593526168, -0.581157072713434; `evaluation_x = ["1.5"]`. |
| "Hermite (Basis Form)" | `points` | `["hermite"]` | Same nodes; surfaces the basis-form rendering when the backend includes it. |
| "Taylor (cos x, order 3)" | `x_values_with_function` | `["taylor"]` | `function = cos(x)`, `x_values = ["0", "1"]`, `method_options.taylor = { center: "0", order: 3 }`, `evaluation_x = ["1/2"]`. From the contract example. |
| "Cubic Spline (lecture three-point)" | `points` | `["cubic_spline"]` | Lecture data: (1, 2), (2, 3), (3, 5); `method_options.cubic_spline = { boundary_condition: "natural" }`; `evaluation_x = ["5/2"]`; `graph: true`. |
| "Osculating (deferred)" | `points` | `["osculating"]` | Bessel-style points + first derivatives. Loaded entry is labelled "Deferred"; computing returns `method_not_implemented` and renders via §9.5. R11.5. |

Each entry seeds a `Partial<FormState>` exactly the way the V1
entries do today; no example calls `/api/interpolate` directly. The
"Osculating (deferred)" entry's category badge uses `secondary` and
its title prefix is the literal "Deferred — " so users know what to
expect before they Compute. R11.5 is satisfied because the entry both
loads and renders the deferred backend response cleanly. See §16 for
the open question about whether this entry should be visible by
default or hidden behind a feature flag.

---

## Warnings module changes

`frontend/src/lib/warnings.ts` is the single display-side mapping for
warning code → label and display severity. R1.5 keeps severity
backend-driven; the catalog here only chooses a chip color and icon.

The Phase 2 additions to `CATALOG`:

```ts
const CATALOG: Record<string, WarningMeta> = {
  // ...existing V1 entries unchanged...

  // Phase 2 additions

  unequal_spacing: { label: "Unequal Spacing", severity: "warning" },
  stirling_requires_centered_nodes: {
    label: "Stirling Center Required", severity: "warning",
  },
  target_not_recommended_for_method: {
    label: "Target Outside Recommended Region", severity: "info",
  },
  missing_derivative_data: { label: "Missing Derivative Data", severity: "error" },
  invalid_derivative_order: { label: "Invalid Derivative Order", severity: "error" },
  unsupported_taylor_function: {
    label: "Unsupported Taylor Function", severity: "error",
  },
  unsupported_boundary_condition: {
    label: "Unsupported Boundary Condition", severity: "error",
  },
  piecewise_method_no_global_polynomial: {
    label: "Piecewise — No Global Polynomial", severity: "info",
  },
  method_not_implemented: { label: "Method Not Implemented", severity: "warning" },
}
```

Notes:

- Display severity for `target_not_recommended_for_method` and
  `piecewise_method_no_global_polynomial` is `info` (cyan) so they
  sit alongside `nodes_reordered` and `expanded_polynomial_omitted`
  in the existing informational tier.
- `missing_derivative_data`, `invalid_derivative_order`,
  `unsupported_taylor_function`, and `unsupported_boundary_condition`
  display as `error` (coral) because they correspond to a method
  failing entirely. The renderer routes these via `ErrorNotice`
  inside the failing method tab; they are not promoted to
  destructive top-level errors because the response is `partial`,
  not `error`.
- `method_not_implemented` displays as `warning` (amber) because the
  request itself was valid; the method just is not implemented yet.
  The deferred-method renderer in §9.5 uses `severity="warning"` for
  the same reason.
- The Hermite `expanded_polynomial_omitted` warning continues to use
  the existing V1 entry; the basis-form omitted state is identified
  by `details.artifact === "hermite_basis_form"` on the warning
  body. No new code is needed for this.

---

## Testing Strategy

> This is the "Fixtures and tests" section requested in
> requirements.md §12. The heading is normalized to
> `## Testing Strategy` to satisfy the Kiro spec format; the content
> is still the fixture file plan, the Vitest test plan, and the
> rationale for not adding property-based tests.

### 12.1 Fixture file layout

`frontend/src/test/interpolate-response.fixtures.ts` already exports
`linearPointsResponse` and `oneOverXResponse`. Phase 2 chooses to
**extend** the file rather than add a sibling file because:

- The existing fixtures use `satisfies InterpolateResponse`, which
  forces every fixture to stay in sync with the (extended) type.
  Splitting them into a sibling file fragments that guarantee.
- Phase 2 fixtures share helpers (e.g. a base `points`-mode response)
  that already live in this file.

If the file becomes unwieldy at implementation time (>500 lines
post-edit), the implementer may split it into
`frontend/src/test/phase2-fixtures.ts` (sibling, same export
convention). The choice is non-blocking; this design notes both as
acceptable. R15.1 only requires the fixtures, not a specific filename.

Phase 2 fixture set, one per method:

| Fixture name | Method response covered | Notes |
|---|---|---|
| `newtonForwardResponse` | `methods.newton_forward` happy path | cos(x) lecture nodes from the contract example. |
| `newtonBackwardResponse` | `methods.newton_backward` happy path | Same lecture nodes; anchor at last index. |
| `stirlingResponse` | `methods.stirling` happy path | Odd node count (5) so center exists. |
| `hermiteDividedDifferenceResponse` | `methods.hermite_divided_difference` happy path | Bessel-style nodes from the contract example. |
| `hermiteResponse` | `methods.hermite` happy path with `basis_form.status === "included"` | Low-degree case so the basis form is included. |
| `hermiteOmittedBasisResponse` | `methods.hermite` happy path with `basis_form.status === "omitted"` and matching `expanded_polynomial_omitted` warning whose `details.artifact === "hermite_basis_form"` | Special fixture per R15.1. |
| `taylorResponse` | `methods.taylor` happy path | cos(x), center 0, order 3, eval x=1/2. |
| `cubicSplineResponse` | `methods.cubic_spline` happy path with `graph_data.source_method === "cubic_spline"` | Special fixture per R15.1; lecture three-point spline. |
| `osculatingDeferredResponse` | `methods.osculating.error.code === "method_not_implemented"`, top-level `status === "partial"` | Special fixture per R15.1. |
| `unequalSpacingErrorResponse` | `methods.newton_forward.error.code === "unequal_spacing"` | Used by the EqualSpacingDetails error path test. |
| `splineUnsupportedBoundaryResponse` | `methods.cubic_spline.error.code === "unsupported_boundary_condition"` | Used by the CubicSplineDetails error path test. |
| `taylorUnsupportedFunctionResponse` | `methods.taylor.error.code === "unsupported_taylor_function"` | Used by the TaylorDetails error path test. |

All fixtures use real lecture data from `docs/API_CONTRACT.md`'s
Phase 2 examples or from the Bessel-style data referenced in
`docs/OPUS_PHASE_2_FRONTEND_HANDOFF.md`. No invented backend fields
(R2.6).

### 12.2 Vitest test files

Test files live next to the components they cover, matching the
existing convention.

| Test file | Asserts |
|---|---|
| `frontend/src/components/results/methods/EqualSpacingDetails.test.tsx` | (1) Happy path: `newton_forward` fixture renders the difference table, `spacing_h`, `anchor_index`, `s`, `terms`, target guidance copy, evaluations. (2) Error path: `unequalSpacingErrorResponse` renders the `ErrorNotice` with the backend message and the literal `Code: unequal_spacing`. (3) Sibling-method behavior: a response with `newton_forward` failing and `lagrange` succeeding still renders the Lagrange tab content. (4) `target_guidance.recommended` differing from selected method renders the advisory copy and does NOT change `form.methods` or call `interpolate`. |
| `frontend/src/components/results/methods/HermiteDetails.test.tsx` | (1) Happy path: repeated nodes, divided-difference table, coefficients, nested form, expanded form, `latex_expanded` rendered through KaTeX. (2) `basis_form.status === "included"` renders the basis term table and `matches_divided_difference` indicator. (3) `basis_form.status === "omitted"` renders the omission notice using the corresponding `expanded_polynomial_omitted` warning. (4) `missing_derivative_data` error path renders `ErrorNotice` with the backend code and message. |
| `frontend/src/components/results/methods/TaylorDetails.test.tsx` | (1) Happy path renders all term-table columns, `taylor_form`, `latex_taylor`, evaluations, and `remainder_note`. (2) `series_name === "Maclaurin"` renders the Maclaurin badge without altering polynomial fields. (3) `unsupported_taylor_function` error path renders inline. |
| `frontend/src/components/results/methods/CubicSplineDetails.test.tsx` | (1) Happy path renders `boundary_condition`, `ordered_nodes`, `second_derivatives`, segment table, continuity checks, evaluations. (2) `polynomial.expanded_omitted_reason === "piecewise_method_no_global_polynomial"` renders the piecewise notice. (3) `unsupported_boundary_condition` error path renders inline. |
| `frontend/src/components/results/methods/DeferredMethodDetails.test.tsx` | (1) `osculatingDeferredResponse` renders the deferred chip, the backend message, the literal `Code: method_not_implemented`, and does NOT render any tables. (2) When `status === "partial"` because of `osculating` only, sibling V1 method tabs still render. |
| `frontend/src/components/results/methods/CubicSplineGraphPassthrough.test.tsx` | Renders `<GraphCard graphData={cubicSplineResponse.graph_data!} nodes={...} />` and asserts that the rendered `source_method` Badge text is `"cubic_spline"`, that the chart region exists, and that the underlying chart props use the backend `graph_data.x` / `graph_data.f_x` / `graph_data.P_x` arrays unmutated (verified by reading the React props passed to recharts via the test data, not by parsing the rendered SVG). R15.3. |
| `frontend/src/components/MethodSelector.test.tsx` | (1) Catalog renders all 12 methods grouped by family in the documented order. (2) `osculating` carries the "Deferred" badge. (3) Each Equal-Spacing card renders the static eligibility hint. (4) Selecting and deselecting a Phase 2 method updates the bound state without throwing. |
| `frontend/src/App.examples.test.tsx` | Extend the existing test file with assertions for each Phase 2 example: loading the example sets the expected `form.methods`, `form.derivatives`, `form.taylorCenter`, `form.taylorOrder`, and `form.splineBoundaryCondition`, and does NOT call `/api/interpolate`. |

The existing `results.smoke.test.tsx` is untouched. New families get
their own dedicated specs to keep the smoke file focused on V1.

### 12.3 No property-based tests

Per R15.4 and the scope note at the top of this document, Phase 2 does
not add property-based tests. The Phase 2 frontend layer is contract
pass-through plus method-aware UI; it has no pure-function or
universal-property domain that would benefit from PBT. The dual-test
discipline R15 expects (unit + property) collapses to unit tests
alone here, with the rationale recorded in §15.

---

## Browser QA matrix

R17 defines the browser QA scope. Each scenario below has a stable
ID, a fixed input set, the backend response shape it expects
(referenced by fixture ID from §12.1), and a screenshot path under
`.kiro/specs/phase-2-frontend-workbench/screenshots/`. Screenshots are
PNGs unless noted otherwise; the directory is created at execution
time per R17.9.

| Scenario ID | Goal | Inputs | Expected response shape (fixture) | Screenshot |
|---|---|---|---|---|
| PHASE2-EQ-01 | Equal-Spacing happy path | `function = cos(x)`, x = `1.0`, `1.3`, `1.6`, `1.9`, `2.2`, methods `["newton_forward","newton_backward","stirling"]`, `evaluation_x = ["1.5"]`, `precision: 50`, `exact: true`, `graph: false` | shape per `newtonForwardResponse` + `newtonBackwardResponse` + `stirlingResponse` (all status `ok`, no error) | `screenshots/phase2-eq-01-happy.png` |
| PHASE2-EQ-02 | Equal-Spacing ineligible | Points (1, 1), (2, 4), (4, 16) (non-equal spacing), methods `["newton_forward","stirling"]` | `unequalSpacingErrorResponse` for both methods; sibling renders intact | `screenshots/phase2-eq-02-ineligible.png` |
| PHASE2-EQ-03 | Stirling needs centered count | Even node count (4 nodes equally spaced), methods `["stirling"]` | response with `methods.stirling.error.code === "stirling_requires_centered_nodes"` | `screenshots/phase2-eq-03-stirling-even.png` |
| PHASE2-HERMITE-01 | Hermite happy path | Points (1.3, 0.6200860), (1.6, 0.4554022), (1.9, 0.2818186) with first derivatives -0.52202..., -0.56990..., -0.58116..., methods `["hermite_divided_difference","hermite"]`, `evaluation_x = ["1.5"]` | `hermiteDividedDifferenceResponse` + `hermiteResponse` (basis included) | `screenshots/phase2-hermite-01-happy.png` |
| PHASE2-HERMITE-02 | Hermite missing derivative | Same points, derivatives table empty, methods `["hermite"]` | response with `methods.hermite.error.code === "missing_derivative_data"` | `screenshots/phase2-hermite-02-missing-derivative.png` |
| PHASE2-HERMITE-03 | Hermite basis omitted | High-degree Hermite case where backend returns `basis_form.status === "omitted"` and `expanded_polynomial_omitted` warning with `details.artifact === "hermite_basis_form"` | `hermiteOmittedBasisResponse` | `screenshots/phase2-hermite-03-basis-omitted.png` |
| PHASE2-TAYLOR-01 | Taylor happy path | `function = cos(x)`, mode `x_values_with_function`, x = `0`, `1`, methods `["taylor"]`, `method_options.taylor = { center: "0", order: 3 }`, `evaluation_x = ["1/2"]` | `taylorResponse` (Maclaurin label visible) | `screenshots/phase2-taylor-01-happy.png` |
| PHASE2-TAYLOR-02 | Taylor unsupported function | Unsafe or unsupported function expression, methods `["taylor"]` | `taylorUnsupportedFunctionResponse` | `screenshots/phase2-taylor-02-unsupported.png` |
| PHASE2-SPLINE-01 | Cubic spline happy path with graph | Points (1, 2), (2, 3), (3, 5), methods `["cubic_spline"]`, `method_options.cubic_spline.boundary_condition = "natural"`, `evaluation_x = ["5/2"]`, `graph: true` | `cubicSplineResponse` with `graph_data.source_method === "cubic_spline"` | `screenshots/phase2-spline-01-happy.png` |
| PHASE2-SPLINE-02 | Cubic spline unsupported boundary (if exposed) | If the boundary selector permits a non-natural value (it should not by §7.4), methods `["cubic_spline"]` | `splineUnsupportedBoundaryResponse` | `screenshots/phase2-spline-02-unsupported.png` |
| PHASE2-OSCULATING-01 | Deferred osculating | Bessel-style nodes + derivatives, methods `["osculating"]` | `osculatingDeferredResponse` | `screenshots/phase2-osculating-01-deferred.png` |
| PHASE2-V1-01 | V1 Linear Lagrange regression | (2, 4), (5, 1), method `["lagrange"]`, eval x = 3 | `linearPointsResponse` | `screenshots/phase2-v1-01-linear-lagrange.png` |
| PHASE2-V1-02 | V1+ `1/x` regression | x_values `[2, 2.75, 4]`, function `1/x`, eval x = 3, method `["lagrange"]` | `oneOverXResponse` | `screenshots/phase2-v1-02-one-over-x.png` |
| PHASE2-V1-03 | V1+ Neville Table regression | Five lecture points, methods `["neville","lagrange","newton"]`, eval x = 1.5 | response with all three methods present | `screenshots/phase2-v1-03-neville.png` |
| PHASE2-V1-04 | V1+ Newton Divided Difference regression | Same five points, methods `["newton"]`, eval x = 1.5 | response with `newton.divided_difference_table` populated | `screenshots/phase2-v1-04-newton-dd.png` |
| PHASE2-MOBILE-01 | 320px overflow check | Any compute (e.g. PHASE2-EQ-01 on 320px viewport) | Same as PHASE2-EQ-01 | `screenshots/phase2-mobile-01-320px.png` (and a DOM assertion that `document.documentElement.scrollWidth <= clientWidth`) |

Network expectations (from R1.2): each scenario is verified by reading
the DevTools Network tab and confirming only `GET /health`,
`POST /api/validate-function`, and `POST /api/interpolate` are called.

The DevTools `No label associated with a form field` issue from
`docs/HANDOFF.md` for hidden Base UI display-precision radio inputs is
listed as an open frontend QA item in `docs/PHASE_2_FINAL_AUDIT.md`;
this design does not attempt to fix it. It is referenced in §15 as a
risk to flag during browser QA.

---

## Verification commands

Per R16, the fixed verification command set after Phase 2 frontend
changes is:

```bash
cd frontend
npm run build
npm run lint
npm test
```

These run from the `frontend/` directory. They are the exact commands
documented in `docs/FRONTEND_HANDOFF.md`'s "Verification Commands"
section. No additional command is required.

The Browser QA Matrix in §13 is executed manually after the three
commands pass. R16.4 requires the matrix results to be recorded in
`docs/HANDOFF.md` and `docs/FRONTEND_HANDOFF.md`. Per R18, after Phase
2 frontend behavior changes the maintainer also updates
`docs/PLAN.md`. R18.4 is explicit that `docs/API_CONTRACT.md` is owned
by Codex and is NOT modified by Phase 2 frontend work.

R16.5 / R18.5 require honest verification reporting: a command is
listed as "passed" only if it actually ran with exit code 0; failures
or skipped runs are recorded as such with the reason.

---

## Error Handling

> This section addresses both "Risks and tradeoffs" (requirements.md
> §15) and the Kiro-recommended `## Error Handling` section. The
> renderer-level error flow is implicit throughout §Result renderers
> (every family renderer routes method-level backend errors through
> the existing `ErrorNotice` component without recomputing severity).
> The list below covers the design risks and the operational
> tradeoffs the implementer must keep in mind.

## Risks and tradeoffs

1. **Typing fidelity to the backend contract.** The Phase 2 response
   types in §5.3 mirror the contract example payloads exactly; if the
   backend later renames a field, the frontend types break at compile
   time, which is the desired behavior (R2.6). The risk is the
   reverse: a contract-documented field that the runtime backend has
   not yet emitted (e.g. `target_guidance` on every evaluation).
   Mitigation: every Phase 2 field that is example-only in the
   contract is typed as `?:` so renderers gracefully skip it.

2. **Method Selector eligibility-hint UX.** The Equal-Spacing
   eligibility hint is computed in the frontend. There is a tradeoff
   between speed (immediate feedback while the user types) and
   authority (the backend is the only source of truth). This design
   resolves the tradeoff by:
   - Letting the hint use float parsing internally for the hint text
     only (the request body still ships strings).
   - Never auto-switching the method based on the hint (R6.4).
   - Letting the user submit ineligible Equal-Spacing methods when at
     least one other selected method is eligible; the backend's
     `unequal_spacing` method-level error renders inline. The
     frontend disables Compute only when *every* selected method is
     ineligible Equal-Spacing.

3. **Hermite `basis_form` omission rendering.** The contract describes
   the omission state via the `expanded_polynomial_omitted` warning
   with `details.artifact === "hermite_basis_form"`, not via a
   dedicated `reason` field on `basis_form`. The renderer therefore
   reads the warning to render the omission text. If the backend
   stops emitting that warning while still emitting `basis_form.status
   === "omitted"`, the renderer falls back to a generic body-voice
   "basis form omitted by the backend" line so the UI never looks
   broken. See §16 for the open question about whether this fallback
   is acceptable.

4. **Cubic spline graph-data pass-through.** `GraphCard.tsx` already
   accepts `source_method` as a string and renders the backend
   arrays. The risk is that a future contract change adds
   `method_graphs` (currently always `null`) and the existing
   `GraphCard` renders only one curve. Phase 2 explicitly defers any
   `method_graphs` work; if the backend ever populates it, that is a
   separate spec.

5. **ESLint/test-runner constraints.** Tailwind 4 + Vite 8 + Vitest 4
   (per `frontend/package.json`) is a relatively new stack. Adding new
   files under `frontend/src/components/results/methods/` may surface
   shadcn-style lint warnings (`react-refresh/only-export-components`).
   The implementation must keep `npm run lint` at 0 errors and not
   introduce new warnings beyond the three pre-existing shadcn
   warnings recorded in `docs/FRONTEND_HANDOFF.md`. The new family
   renderer files export a single component per file to avoid
   triggering the rule.

6. **320px overflow risk for wide tables.** The new tables (forward /
   backward / centered difference, repeated-node divided-difference,
   Taylor terms, spline segments) are typically wide. R14.3 requires
   each to live inside an `overflow-x-auto` container so the page
   does not scroll horizontally at 320px. The risk is that adding a
   new table without the wrapper regresses the 320px guarantee. The
   QA matrix scenario PHASE2-MOBILE-01 catches this; the
   implementation must wrap every new table.

7. **DevTools accessibility issue carry-over.** The pre-existing
   "No label associated with a form field" warning on hidden Base UI
   display-precision radio inputs carries through Phase 2 unchanged.
   This design does not introduce new hidden form fields; if QA
   surfaces additional hits during the matrix, the implementer
   records them in `docs/HANDOFF.md` rather than silencing them.

8. **`osculating` example default visibility.** Loading the
   "Osculating (deferred)" example by default is convenient for
   demonstrating the deferred state but may confuse new users who
   expect Compute to succeed. See §16 question (3).

---

## Open questions

The questions below need a user decision before §17 can be locked
into tasks.md. Each question is ranked by how blocking it is for
Phase 2.

1. **Split MethodDetails into per-family files vs. extending in
   place.** This design proposes new files under
   `frontend/src/components/results/methods/`, with `MethodDetails.tsx`
   becoming a thin tab-list dispatcher. The alternative is to add the
   eight Phase 2 panels inline inside the existing
   `MethodDetails.tsx`. The design choice favors the split because
   the inline file would grow to ~1500 lines and obscure V1 logic,
   but the user may prefer a single-file approach. Recommended: split.

2. **Hermite `basis_form` omission machine-readable reason.** The
   contract describes omission through the
   `expanded_polynomial_omitted` warning's `details.artifact`. There
   is no `basis_form.reason` field in the contract today. Should the
   frontend surface a request to the backend team to add a
   `reason: string` on the omitted-state object so the renderer is
   not coupled to the warnings catalog? This design does NOT add
   `reason` to the type (R2.6 forbids inventing fields); it raises
   the question here so the user can decide whether to ask Codex.

3. **`osculating` in the catalog by default vs. behind a feature
   flag.** R10.1 says the catalog "SHALL accept selection of
   `osculating`". This design places it visibly in the Derivative-
   Data Family with a "Deferred" badge. Alternative: hide `osculating`
   behind a feature flag (e.g. `?showDeferred=1`) so casual users do
   not see it. R10.1 does not mandate visibility. Recommended: keep
   visible — the deferred badge and catalog copy already prevent
   confusion, and R10.4 wants the deferred state observable.

4. **Examples Panel `osculating` entry enabled vs. disabled by
   default.** The "Osculating (deferred)" example is loadable but
   computes a `method_not_implemented` response. R11.5 says the
   example must be "labeled as deferred and SHALL render the backend
   `method_not_implemented` response when computed." Should the Load
   button on that entry be enabled (recommended) or disabled with a
   tooltip explaining the deferred state? Recommended: enabled,
   because R11.5's "render the backend response when computed"
   requires the user to be able to compute it.

5. **`Other` boundary conditions in the cubic spline selector.** §7.4
   shows other boundary conditions as disabled placeholders. The
   alternative is to omit them entirely until backend support lands.
   Recommended: keep them as disabled options to telegraph the
   roadmap; they have a `title` attribute that explains the deferral
   so they do not mislead.

6. **Adaptive Input Panel section ordering.** This design puts the
   new "Method Configuration" card between "Methods" and "Precision &
   Evaluation". An alternative is to put it inside the existing
   "Methods" card as a nested block. Recommended: separate card,
   because it preserves R13's "no nested cards" rule.


---

## Traceability matrix

Every requirement R1–R18 maps to at least one design section.

| Requirement | Design section(s) that satisfy it |
|---|---|
| R1.1 No `backend/` edits | §1, §4 (component map excludes backend), §6 |
| R1.2 Only `/health`, `/api/interpolate`, `/api/validate-function` | §6.1, §6.3, §13 (network expectations) |
| R1.3 No request/response shape changes; types only mirror docs | §5, §6, §16 |
| R1.4 Numeric values stay strings on the wire | §5.2, §6.2, §7.1, §7.2 |
| R1.5 Warnings via `getWarningMeta`; no severity recompute | §11, §10.2 |
| R2.1 `MethodName` extended to all 12 literals | §5.1 |
| R2.2 `InterpolateRequest` gains optional `method_options` + `derivatives` | §5.2 |
| R2.3 Phase 2 method response interfaces | §5.3 |
| R2.4 `PolynomialData` adds `hermite_form`, `taylor_form`, latex variants, piecewise reason | §5.4, §10.4 |
| R2.5 `InterpolateResponse.methods` keys are optional and additive | §5.5 |
| R2.6 No invented contract fields | §5 (each subsection cites the contract), §16 |
| R3.1 Single `POST /api/interpolate` call | §6.1 |
| R3.2 `method_options` only on the body | §5.2, §6.2 |
| R3.3 `derivatives` array with string `x`/`value` and integer `order` | §5.2, §6.2 |
| R3.4 Omit unused `method_options[name]` blocks | §6.2 |
| R3.5 No alternate transports / per-method endpoints | §6.1, §6.3 |
| R4.1 Method selector lists V1 + Phase 2 grouped by family | §8.2 |
| R4.2 Family + role description in existing voices | §8.2, §8.3 |
| R4.3 Equal-Spacing eligibility hint on each card | §8.4 |
| R4.4 Deferred badge for `osculating` | §8.4 |
| R4.5 Frontend-only eligibility hint blocking Compute when ineligible | §7.1 |
| R4.6 No design-system changes in Method Selector | §8.5, §13 ("voice preserved") |
| R5.1 X+f(x) point input default for V1 + Equal-Spacing | §7.1 (reuses existing editor) |
| R5.2 Equal-Spacing eligibility hint logic | §7.1 |
| R5.3 Derivative Input Table with `(x_i, f(x_i), f'(x_i))` rows as strings | §7.2 |
| R5.4 `order` integer fixed at 1 for current Hermite | §6.2, §7.2 |
| R5.5 Taylor config block with `function`, `center`, `order 0..20` | §7.3 |
| R5.6 Cubic spline boundary selector with only `natural` enabled | §7.4 |
| R5.7 Phase 2 blocks hidden when no Phase 2 method selected | §7.5 |
| R6.1 Render `newton_forward` fields exactly | §9.1 |
| R6.2 Render `newton_backward` fields exactly | §9.1 |
| R6.3 Render `stirling` fields exactly | §9.1 |
| R6.4 Advisory `target_guidance.recommended` (no auto-switch) | §9.1 |
| R6.5 Render method-level errors via `ErrorNotice`; siblings stay visible | §9.1, §9 (general pattern) |
| R6.6 No client-side finite differences | §9.1 |
| R7.1 Render `hermite_divided_difference` fields | §9.2 |
| R7.2 Render `hermite` repeated-node fields + `basis_form` (included) | §9.2 |
| R7.3 Render `basis_form.status === "omitted"` from backend reason / warning | §9.2 |
| R7.4 Render `missing_derivative_data` / `invalid_derivative_order` errors | §9.2 |
| R7.5 No client-side Hermite computation | §9.2 |
| R8.1 Render Taylor fields exactly | §9.3 |
| R8.2 Render Taylor `terms` columns exactly | §9.3 |
| R8.3 Maclaurin label when `series_name === "Maclaurin"` | §9.3 |
| R8.4 Render `unsupported_taylor_function` error | §9.3 |
| R8.5 No client-side Taylor symbolic computation | §9.3 |
| R9.1 Render `cubic_spline` fields | §9.4 |
| R9.2 Render segments table | §9.4 |
| R9.3 Piecewise notice when `expanded_omitted_reason === "piecewise_method_no_global_polynomial"` | §9.4, §10.4 |
| R9.4 GraphCard pass-through when `graph_data.source_method === "cubic_spline"` | §9.4, §4 (GraphCard unchanged) |
| R9.5 Render `unsupported_boundary_condition` error | §9.4 |
| R9.6 No client-side spline computation | §9.4 |
| R10.1 Method selector accepts `osculating` | §8.2, §8.4 |
| R10.2 Deferred panel renders `error.code === "method_not_implemented"` | §9.5 |
| R10.3 No simulation, approximation, or hiding of `osculating` | §9.5 |
| R10.4 Sibling renderers operational under `partial` status | §9.5, §9 (general pattern) |
| R11.1 GuidedExplanation entries for each Phase 2 method | §10.1 |
| R11.2 ResultQualityGuide entries for Phase 2 codes | §10.2, §11 |
| R11.3 Method Comparison Summary grouped by family; Barycentric stays Stable Evaluator | §10.3 |
| R11.4 Examples Panel gains lecture examples per implemented Phase 2 method | §10.5 |
| R11.5 Examples Panel `osculating` entry labeled deferred and renders backend response | §10.5 |
| R11.6 None of these surfaces compute math locally | §9, §10, §11 |
| R12.1 V1 method renderers unchanged (catalog grouping copy aside) | §4, §10.3 |
| R12.2 Existing lecture examples preserved | §10.5 |
| R12.3 Existing Guided Explanation V1 blocks preserved | §10.1 |
| R12.4 Existing Result Quality V1 warnings preserved | §10.2, §11 |
| R12.5 Existing Barycentric GraphCard rendering preserved | §4 (GraphCard unchanged) |
| R13.1 OKLCH tokens, palette, three-voice typography preserved | §1, §4, §8.5 |
| R13.2 No gradients, frosted glass, side-stripe, nested cards, hero metrics, gradient text, bounce motion | §16.6 (no nested cards), §8.5, §13 |
| R13.3 Family labels and role tags use existing `font-label` | §8, §10.3 |
| R13.4 Compute button, Method Selector cards, Results Panel surfaces stay flat-at-rest | §8.5, §10.3 |
| R13.5 IBM Plex Sans Variable + numeric voice preserved | §1, §8 |
| R14.1 No 320px page-level horizontal overflow | §13 (PHASE2-MOBILE-01), §15 (overflow risk) |
| R14.2 Phase 2 adaptive blocks stack below `md` | §7.1, §7.4, §7.5 |
| R14.3 Phase 2 result tables wrapped in horizontal-scroll containers | §9.1, §9.2, §9.3, §9.4 |
| R15.1 Phase 2 fixtures incl. omitted basis form, deferred osculating, cubic spline graph | §12.1 |
| R15.2 Vitest tests cover happy path, deferred state, errors, warnings | §12.2 |
| R15.3 GraphCard pass-through test for `cubic_spline` | §12.2 (`CubicSplineGraphPassthrough.test.tsx`) |
| R15.4 No property-based tests; rationale recorded | §12.3, scope note |
| R15.5 `npm test` passes existing + new tests | §12.2, §14 |
| R16.1 `npm run build` passes | §14 |
| R16.2 `npm run lint` passes | §14 |
| R16.3 `npm test` passes | §14 |
| R16.4 Browser QA Matrix recorded in HANDOFF + FRONTEND_HANDOFF | §14, §13 |
| R16.5 Honest verification reporting | §14 |
| R17.1 Equal-Spacing happy-path scenario | §13 (PHASE2-EQ-01) |
| R17.2 Equal-Spacing ineligible scenario | §13 (PHASE2-EQ-02, PHASE2-EQ-03) |
| R17.3 Hermite happy-path + missing-derivative scenarios | §13 (PHASE2-HERMITE-01, PHASE2-HERMITE-02) |
| R17.4 Taylor happy-path + unsupported scenario | §13 (PHASE2-TAYLOR-01, PHASE2-TAYLOR-02) |
| R17.5 Cubic spline happy-path with graph | §13 (PHASE2-SPLINE-01) |
| R17.6 Deferred `osculating` scenario | §13 (PHASE2-OSCULATING-01) |
| R17.7 V1 / V1+ regression scenarios | §13 (PHASE2-V1-01..04) |
| R17.8 320px viewport check | §13 (PHASE2-MOBILE-01) |
| R17.9 Screenshots in `.kiro/specs/phase-2-frontend-workbench/screenshots/` | §13 (paths column) |
| R18.1 Update FRONTEND_HANDOFF.md when behavior changes | §14 |
| R18.2 Update HANDOFF.md with files, commands, results | §14 |
| R18.3 Update PLAN.md with milestone status | §14 |
| R18.4 Do not modify API_CONTRACT.md | §14, §1 |
| R18.5 Honest verification reporting | §14 |

