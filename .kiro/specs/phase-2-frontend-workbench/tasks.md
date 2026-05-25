# Implementation Plan: phase-2-frontend-workbench

> Convert the feature design into a series of prompts for a code-generation
> LLM that will implement each step with incremental progress. Make sure
> that each prompt builds on the previous prompts, and ends with wiring
> things together. There should be no hanging or orphaned code that isn't
> integrated into a previous step. Focus ONLY on tasks that involve
> writing, modifying, or testing code.

## Overview

This plan implements `design.md` for `phase-2-frontend-workbench`. The
scope is the React workbench under `frontend/src/` only. Work is grouped
into the seven implementation groups defined in the design and reflected
in the user's six locked decisions (see §"Locked decisions" below). Each
leaf is small enough to be executed in a single sub-agent turn (typically
one file or one tightly-scoped concern). Implementation and tests are
split into separate leaves so the orchestrator can dispatch them in
waves: implementation leaves first, test leaves once their target file
exists.

Locked decisions reflected throughout this plan (do not re-ask):

1. `MethodDetails.tsx` becomes a thin tab-list dispatcher and per-family
   renderer files live under
   `frontend/src/components/results/methods/`.
2. The Hermite basis-form omission state is read from the existing
   `expanded_polynomial_omitted` warning whose
   `details.artifact === "hermite_basis_form"`. No `basis_form.reason`
   field is invented.
3. `osculating` stays visible in the Method Selector with a "Deferred"
   badge. No feature flag.
4. The Examples Panel "Osculating (deferred)" entry is loadable; the
   Deferred renderer displays the backend `method_not_implemented`
   response.
5. The cubic spline boundary selector keeps non-natural options as
   disabled placeholders carrying a `title` tooltip explaining the
   deferral. Only `natural` is enabled.
6. The Adaptive Input Panel renders as a separate "Method Configuration"
   card placed between the existing "Methods" section and the existing
   "Precision & Evaluation" section. No nested cards.

## Hard Rules

These rules apply to every task in this plan. They are NOT optional
and are NOT to be relaxed by any sub-task.

- No file under `backend/` is modified, created, or deleted.
  (Requirement R1.1)
- The frontend SHALL call only `GET /health`, `POST /api/interpolate`,
  and `POST /api/validate-function`; no other endpoint paths are
  introduced. (Requirement R1.2)
- The frontend SHALL NOT change the request shape or response shape
  documented in `docs/API_CONTRACT.md`. TypeScript types only mirror
  documented backend fields. No field is invented. (Requirements R1.3,
  R2.6)
- All numeric values inside `points`, `x_values`, `interval`,
  `evaluation_x`, `derivatives[].x`, `derivatives[].value`, and
  `method_options.taylor.center` SHALL be sent as strings without
  `parseFloat` or `Number()` before sending. (Requirement R1.4)
- Warning severity SHALL come from `getWarningMeta` in
  `frontend/src/lib/warnings.ts`. Severity is never recomputed from
  numerical values in React. (Requirement R1.5)
- The frontend SHALL NOT compute interpolation, finite differences,
  Hermite repeated-node tables, Hermite basis terms, Taylor
  derivatives or terms, spline coefficients, segment polynomials,
  continuity checks, graph samples, interpolated values, or error
  metrics. (Requirements R6.6, R7.5, R8.5, R9.6, R10.3, R11.6)
- The frontend SHALL NOT use `eval`, SymPy, Math.js, or any client-
  side symbolic engine for numerical or symbolic computation.
  (Requirement R8.5; project rule from `AGENTS.md`)
- No new design token, font, palette, role-tag voice, or motion
  handle is introduced. The Analysis Bench design system is preserved
  as-is. (Requirement R13)
- Modifications outside `frontend/src/` are restricted to the
  Reporting Files (`docs/HANDOFF.md`, `docs/FRONTEND_HANDOFF.md`,
  `docs/PLAN.md`) and the screenshots directory under
  `.kiro/specs/phase-2-frontend-workbench/screenshots/`. The frontend
  SHALL NOT modify `docs/API_CONTRACT.md`. (Requirements R18.1, R18.2,
  R18.3, R18.4)

## Property-Based Testing Rationale

Property-based tests are intentionally not used in this feature.

The Phase 2 frontend layer is a thin contract pass-through plus
method-aware UI rendering on top of a documented backend contract.
Universal "for-all-inputs" properties do not apply: the renderers map
exact backend fields to exact DOM output, the request builder
conditionally attaches contract-documented optional blocks, and there
is no pure-function or universal-property domain here. This is the
explicit position taken by `requirement R15.4` and by the design's
scope note. The closely-related prior specs
`frontend-analysis-bench-overhaul` and
`frontend-design-system-overhaul` made the same call for the same
reasons.

There is therefore no Correctness Properties section in `design.md`
and no PBT sub-task in any group below. The Kiro Spec Format
diagnostic that flags a missing Correctness Properties section is a
"recommended" warning, not an error, and is intentionally accepted
for this spec. Verification routes through Vitest unit tests
(Group F), the Requirement R16 fixed commands (Group G G1, G2, G3),
and the Requirement R17 Browser QA Matrix (Group G G4–G10).

## Task Dependency Graph

Waves are computed from the `Depends on:` lines on each task. Each
wave lists the tasks whose dependencies are all satisfied by tasks
in earlier waves, so the orchestrator can dispatch every task in a
wave in parallel.

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.7", "1.8"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "1.5", "1.14", "2.1", "5.2", "5.3"] },
    { "id": 2, "tasks": ["1.6", "1.9", "3.1", "4.1", "4.2", "4.3", "4.5"] },
    { "id": 3, "tasks": ["1.10", "1.11", "1.13", "2.2", "2.3", "2.4", "4.4", "4.7", "5.1", "5.4", "6.1", "6.2", "6.3", "6.4", "6.5", "6.6"] },
    { "id": 4, "tasks": ["1.12", "2.5", "3.2", "3.3", "3.4", "3.5", "3.6", "4.6", "6.7", "6.8", "6.9", "6.10", "6.12", "6.13"] },
    { "id": 5, "tasks": ["2.6", "6.11", "6.14"] },
    { "id": 6, "tasks": ["7.1"] },
    { "id": 7, "tasks": ["7.2", "7.3"] },
    { "id": 8, "tasks": ["7.4", "7.5", "7.6", "7.7", "7.8", "7.9", "7.10"] },
    { "id": 9, "tasks": ["7.11"] },
    { "id": 10, "tasks": ["7.12"] },
    { "id": 11, "tasks": ["7.13"] },
    { "id": 12, "tasks": ["7.14"] },
    { "id": 13, "tasks": ["7.15"] }
  ]
}
```

Same-group sequential dependencies are summarized by the wave order;
see the `Depends on:` line on each task for the exact predecessor
list.

## Tasks

- [ ] 1. Group A — Foundation (api-types, warnings, FormState, helpers, catalog scaffolding)

  - [x] 1.1 Extend `MethodName` union with the eight Phase 2 method literals
    - File: `frontend/src/lib/api-types.ts`
    - Add the literals `newton_forward`, `newton_backward`, `stirling`,
      `hermite_divided_difference`, `hermite`, `osculating`, `taylor`,
      and `cubic_spline` to the existing `MethodName` union.
    - _Requirements: R2.1_
    - Depends on: (none)
    - Acceptance: `MethodName` lists all 12 literals exactly as in
      `design.md` §5.1. `tsc -b` clean. No other file changes.

  - [x] 1.2 Add request-side Phase 2 types to `api-types.ts`
    - File: `frontend/src/lib/api-types.ts`
    - Add `DerivativeEntry`, `TaylorMethodOptions`,
      `SplineBoundaryCondition` (literal `"natural"` only),
      `CubicSplineMethodOptions`, and `MethodOptions`. Extend
      `InterpolateRequest` with optional `method_options?: MethodOptions`
      and `derivatives?: DerivativeEntry[]`.
    - _Requirements: R2.2, R5.4, R5.5, R5.6_
    - Depends on: 1.1
    - Acceptance: Types match `design.md` §5.2 verbatim. V1 callers
      compile unchanged because both new fields are optional.
      `tsc -b` clean.

  - [x] 1.3 Add Equal-Spacing Family response types to `api-types.ts`
    - File: `frontend/src/lib/api-types.ts`
    - Add `FiniteDifferenceTerm`, `EvaluationTargetGuidance`,
      `EqualSpacingEvaluation`, `NewtonForwardResult`,
      `NewtonBackwardResult`, and `StirlingResult` per `design.md`
      §5.3.1.
    - _Requirements: R2.3_
    - Depends on: 1.1
    - Acceptance: All field names match
      `docs/API_CONTRACT.md` "P2.1 Equal-Spacing Methods" verbatim.
      Difference-table cell type is `Array<Array<string | null>>`.
      `tsc -b` clean.

  - [x] 1.4 Add Derivative-Data Family response types to `api-types.ts`
    - File: `frontend/src/lib/api-types.ts`
    - Add `RepeatedNode`, `HermiteBasisTerm`,
      `HermiteBasisFormIncluded`, `HermiteBasisFormOmitted` (zero
      added fields per locked decision 2), `HermiteBasisForm` union,
      `HermiteDividedDifferenceResult`, `HermiteResult`, and
      `OsculatingResult` per `design.md` §5.3.2.
    - _Requirements: R2.3, R7.2, R7.3, R10.2_
    - Depends on: 1.1
    - Acceptance: `HermiteBasisFormOmitted` carries only the
      `status: "omitted"` discriminant. No `reason` field is
      introduced. `OsculatingResult` exposes only the V1-style outer
      shell (`status`, `warnings`, `error`). `tsc -b` clean.

  - [x] 1.5 Add Function-Derivative and Piecewise response types to `api-types.ts`
    - File: `frontend/src/lib/api-types.ts`
    - Add `TaylorTerm`, `TaylorResult`, `SplineSegment`,
      `SplineContinuityCheck`, `SplineEvaluation`, and
      `CubicSplineResult` per `design.md` §5.3.3 and §5.3.4.
    - _Requirements: R2.3_
    - Depends on: 1.1
    - Acceptance: All field names match `docs/API_CONTRACT.md` "P2.3
      Taylor Method" and "P2.4 Natural Cubic Spline Method" verbatim.
      `SplineSegment.coefficients` is `{ a, b, c, d: string }`.
      `tsc -b` clean.

  - [x] 1.6 Extend `PolynomialData` and widen `InterpolateResponse.methods`
    - File: `frontend/src/lib/api-types.ts`
    - Add `hermite_form: string | null`, `taylor_form: string | null`,
      `latex_hermite: string | null`, and `latex_taylor: string | null`
      to `PolynomialData`. Document the additional accepted value
      `"piecewise_method_no_global_polynomial"` for
      `expanded_omitted_reason` via a comment (the type stays
      `string | null` per `design.md` §5.4). Widen
      `InterpolateResponse.methods` so the eight Phase 2 keys are
      optional and additive; V1 keys remain optional as before.
    - _Requirements: R2.4, R2.5_
    - Depends on: 1.3, 1.4, 1.5
    - Acceptance: V1 fixtures and renderers still type-check. New
      keys are present on `InterpolateResponse.methods` and typed to
      the interfaces from A3, A4, A5. `tsc -b` clean.

  - [x] 1.7 Add Phase 2 entries to the warnings catalog
    - File: `frontend/src/lib/warnings.ts`
    - Add catalog rows for `unequal_spacing`,
      `stirling_requires_centered_nodes`,
      `target_not_recommended_for_method`, `missing_derivative_data`,
      `invalid_derivative_order`, `unsupported_taylor_function`,
      `unsupported_boundary_condition`,
      `piecewise_method_no_global_polynomial`, and
      `method_not_implemented`. Use the labels and severities in
      `design.md` §11. Existing V1 entries are untouched.
    - _Requirements: R1.5, R11.2, R12.4_
    - Depends on: (none)
    - Acceptance: `getWarningMeta(code)` returns a populated
      `{ label, severity }` for every Phase 2 code listed in R11.2.
      No code has its severity computed from numerical values.

  - [x] 1.8 Add the equal-spacing eligibility helper
    - File: `frontend/src/lib/equal-spacing.ts` (new)
    - Export a pure helper with signature
      `assessEqualSpacing(values: string[]): { equallySpaced: boolean; spacingH?: number; reason?: string }`.
      The helper internally parses through `Number()` for hint-only
      purposes and returns `equallySpaced: false` when fewer than two
      finite values are present, when any difference is non-finite,
      or when consecutive differences disagree beyond a small
      relative tolerance. The helper SHALL NOT compute interpolation
      and SHALL NOT mutate its input.
    - _Requirements: R4.5, R5.2_
    - Depends on: (none)
    - Acceptance: Helper is pure, returns the documented shape, and
      is consumed by `EqualSpacingHint.tsx` (B1) and `App.tsx`
      `isFormBlocked` (A13).

  - [x] 1.9 Extend `FormState` with Phase 2 fields
    - File: `frontend/src/components/InputPanel.tsx`
    - Extend the exported `FormState` type with
      `derivatives: Array<{ x: string; value: string }>`,
      `taylorCenter: string`, `taylorOrder: number`, and
      `splineBoundaryCondition: SplineBoundaryCondition`. Import the
      new request-side types from `api-types.ts`.
    - _Requirements: R5.3, R5.4, R5.5, R5.6_
    - Depends on: 1.2
    - Acceptance: `FormState` exports the four new fields with the
      shapes above. V1 InputPanel rendering is unchanged. `tsc -b`
      clean.

  - [x] 1.10 Extend `DEFAULT_FORM` in `App.tsx`
    - File: `frontend/src/App.tsx`
    - Add `derivatives: []`, `taylorCenter: "0"`, `taylorOrder: 3`,
      and `splineBoundaryCondition: "natural"` to the existing
      `DEFAULT_FORM` literal. V1 fields keep their existing values
      including `methods: ["lagrange", "newton"]`.
    - _Requirements: R5.5, R5.6, R5.7, R12_
    - Depends on: 1.9
    - Acceptance: `DEFAULT_FORM` satisfies the extended `FormState`.
      A fresh page render still shows V1 layout because no Phase 2
      method is selected by default.

  - [x] 1.11 Add `buildMethodOptions` and `buildDerivatives` helpers in `App.tsx`
    - File: `frontend/src/App.tsx`
    - Add two private helpers exactly as documented in `design.md`
      §6.2. `buildMethodOptions` returns `undefined` when no method
      that needs `method_options` is selected. `buildDerivatives`
      returns `undefined` unless one of `hermite_divided_difference`,
      `hermite`, or `osculating` is selected; it filters empty rows
      and injects `order: 1`.
    - _Requirements: R3.2, R3.3, R3.4, R5.4_
    - Depends on: 1.2, 1.9
    - Acceptance: Helpers are pure, return the documented types, and
      preserve string values without `parseFloat`. `tsc -b` clean.

  - [x] 1.12 Wire the helpers into `buildRequest` in `App.tsx`
    - File: `frontend/src/App.tsx`
    - Extend the existing `buildRequest(form)` to attach
      `method_options` and `derivatives` to the body only when the
      respective helpers return a non-undefined value. Do not change
      the V1 mode-specific branches (`points`,
      `x_values_with_function`, `function_interval`).
    - _Requirements: R3.1, R3.4, R3.5, R12_
    - Depends on: 1.11
    - Acceptance: V1 requests are byte-identical to today's. Phase 2
      requests carry only the per-method blocks for selected methods.
      No new endpoint paths or transports are introduced.

  - [x] 1.13 Extend `isFormBlocked` for equal-spacing ineligibility
    - File: `frontend/src/App.tsx`
    - Extend the derived `isFormBlocked` predicate so Compute is
      blocked when every selected method is in the Equal-Spacing
      Family AND `assessEqualSpacing(values)` returns
      `equallySpaced: false`, where `values` is `form.points` x
      column for `points` mode or `form.xValues` for
      `x_values_with_function` (and the synthesized interval x-values
      are out of scope per `design.md` §7.1). When at least one
      selected method is not Equal-Spacing, Compute stays enabled.
    - _Requirements: R4.5, R5.2_
    - Depends on: 1.8, 1.9
    - Acceptance: Compute button's `disabled` and `aria-disabled` set
      when every selected method is Equal-Spacing and the helper
      reports ineligibility. The hover title surfaces the reason.

  - [x] 1.14 Add the grouped Method Selector catalog data file
    - File: `frontend/src/components/MethodSelector.catalog.ts` (new)
    - Export `MethodFamily` type and a single
      `METHOD_CATALOG: MethodCatalogEntry[]` constant matching
      `design.md` §8.1, §8.2, §8.3, §8.4. Each entry carries `value`,
      `label`, `family`, `role`, optional `highlight` (Barycentric
      only), `description`, optional `eligibilityHint` (Equal-Spacing
      family only), optional `deferred` (true for `osculating`), and
      optional `deferredNote`. Do not edit `MethodSelector.tsx` here;
      this leaf only ships the data.
    - _Requirements: R4.1, R4.2, R4.3, R4.4, R10.1_
    - Depends on: 1.1
    - Acceptance: File exports the types and the catalog constant.
      `tsc -b` clean. Catalog includes all 12 methods grouped by the
      seven families documented in §8.2.

- [ ] 2. Group B — Adaptive Input Panel components and wiring

  - [x] 2.1 Add `EqualSpacingHint.tsx`
    - File: `frontend/src/components/EqualSpacingHint.tsx` (new)
    - Render a body-voice hint that consumes `assessEqualSpacing` from
      `lib/equal-spacing.ts`. Show "Spacing appears equal: h ≈ <h>"
      when eligible, otherwise "Spacing not equal" with the helper's
      reason. The component receives the relevant string array as a
      prop. It does not auto-switch the method.
    - _Requirements: R4.5, R5.2, R6.4_
    - Depends on: 1.8
    - Acceptance: Component renders the hint string, uses existing
      label and body voices, and calls only the helper. `tsc -b`
      clean.

  - [x] 2.2 Add `DerivativeInputTable.tsx`
    - File: `frontend/src/components/DerivativeInputTable.tsx` (new)
    - Render one row per node currently in `form.points` or
      `form.xValues`, each with the corresponding `x` (read-only,
      numeric voice) and an editable `value` string input (numeric
      voice). The bound state is
      `form.derivatives[i] = { x, value }`. Header in `font-label`
      voice. Helper paragraph reads "Hermite currently supports
      first-derivative data only (order = 1)." Wrap the table in
      `overflow-x-auto rounded-lg`.
    - _Requirements: R5.3, R5.4, R14.3_
    - Depends on: 1.9
    - Acceptance: Adding or removing a node row updates the
      derivative rows in lockstep keyed by index. The component does
      no math.

  - [x] 2.3 Add `TaylorConfigBlock.tsx`
    - File: `frontend/src/components/TaylorConfigBlock.tsx` (new)
    - Render a labelled `center` string input (numeric voice) and an
      `<input type="number" min={0} max={20} step={1}>` for `order`.
      When `form.mode === "points"`, render a body-voice disabled
      hint instead: "Taylor needs a function expression. Switch to
      X + f(x) or Interval mode." Out-of-range `order` renders an
      inline error notice via the existing shared `ErrorNotice`.
    - _Requirements: R5.5_
    - Depends on: 1.9
    - Acceptance: The block reuses the existing function input from
      X + f(x) / Interval; it does not introduce a second function
      input. `tsc -b` clean.

  - [x] 2.4 Add `CubicSplineConfigBlock.tsx`
    - File: `frontend/src/components/CubicSplineConfigBlock.tsx`
      (new)
    - Render a labelled `<select>` "Boundary Condition". The
      `Natural` option (value `natural`) is enabled. Per locked
      decision 5, all other boundary conditions appear as `disabled`
      `<option>` placeholders, each carrying a `title` attribute
      explaining the deferral (e.g. "Backend currently accepts only
      natural; clamped is deferred."). Helper paragraph: "Natural
      cubic spline ties the second derivative to zero at the
      interval ends."
    - _Requirements: R5.6, R9.5_
    - Depends on: 1.9
    - Acceptance: Only `natural` is selectable. The disabled options
      carry the documented `title` tooltips. No new color or
      typography is introduced.

  - [x] 2.5 Wire the "Method Configuration" card in `InputPanel.tsx`
    - File: `frontend/src/components/InputPanel.tsx`
    - Per locked decision 6, add a fourth section between the
      existing "Methods" section and "Precision & Evaluation": a
      separate Card titled "Method Configuration" that renders the
      blocks from B1, B2, B3, B4 only when the relevant Phase 2
      method is selected, in the order documented in `design.md`
      §7.5. The section is hidden entirely when no Phase 2 method is
      selected. No nested Cards.
    - _Requirements: R5.1, R5.7, R13.2, R14.2_
    - Depends on: 2.1, 2.2, 2.3, 2.4
    - Acceptance: V1 layout is byte-identical when no Phase 2 method
      is selected. The section appears between Methods and Precision
      & Evaluation when any Phase 2 method is selected. Blocks stack
      below the `md` breakpoint.

  - [x] 2.6 Add a Vitest smoke test for "Method Configuration" card stacking
    - File: `frontend/src/components/InputPanel.MethodConfig.test.tsx`
      (new)
    - Render `InputPanel` with a `FormState` that selects each Phase
      2 method in turn and assert that the corresponding adaptive
      block is present in the document. Render with no Phase 2
      method selected and assert the section is absent. Verify the
      Card uses a `grid-cols-1` (or similar single-column) class on
      narrow widths so blocks stack vertically below the `md`
      breakpoint.
    - _Requirements: R5.7, R14.2_
    - Depends on: 2.5
    - Acceptance: Vitest test passes. `npm test` passes overall.

- [ ] 3. Group C — Method Selector catalog rendering and Examples Panel V2 entries

  - [x] 3.1 Refactor `MethodSelector.tsx` to render the family-grouped catalog
    - File: `frontend/src/components/MethodSelector.tsx`
    - Replace the flat `ALL_METHODS` array with the grouped catalog
      from `A14` (`MethodSelector.catalog.ts`). Render one section
      per `MethodFamily` with a `font-label` family heading and the
      existing card grid. Each card renders the role tag, one-
      sentence description, and (Equal-Spacing only) the static
      eligibility hint from the catalog entry. The `osculating` card
      renders the "Deferred" badge plus the deferred-note line per
      locked decision 3. Preserve role-tag voice, palette, card
      style, focus ring, and Barycentric primary tint. Card order
      and copy match `design.md` §8.2 / §8.3 exactly.
    - _Requirements: R4.1, R4.2, R4.3, R4.4, R4.6, R10.1, R12.1, R13_
    - Depends on: 1.14
    - Acceptance: All 12 methods render grouped by the seven families
      in the documented order. `osculating` shows the "Deferred"
      badge. `tsc -b` and lint clean.

  - [x] 3.2 Add Equal-Spacing Family entries to `ExamplesPanel.tsx`
    - File: `frontend/src/components/ExamplesPanel.tsx`
    - Append three lecture-aligned `EXAMPLES` entries:
      "Newton Forward (cos x at 1.0…2.2)",
      "Newton Backward (cos x)", and
      "Stirling (cos x, centered)". Each uses
      `mode: "x_values_with_function"`,
      `function: "cos(x)"`,
      `xValues: ["1.0", "1.3", "1.6", "1.9", "2.2"]`,
      `evaluationX: ["1.5"]`, and a single-method `methods` array as
      named in `design.md` §10.5. No example calls
      `/api/interpolate` directly.
    - _Requirements: R11.4, R12.2_
    - Depends on: 1.1, 1.10
    - Acceptance: Each new entry sets the documented partial
      `FormState` exactly. Existing V1 entries are untouched.

  - [x] 3.3 Add Hermite Family entries to `ExamplesPanel.tsx`
    - File: `frontend/src/components/ExamplesPanel.tsx`
    - Append two entries: "Hermite Divided Difference (Bessel-style)"
      with `methods: ["hermite_divided_difference"]` and "Hermite
      (Basis Form)" with `methods: ["hermite"]`. Both use
      `mode: "points"` with the lecture points (1.3, 0.6200860),
      (1.6, 0.4554022), (1.9, 0.2818186) and the corresponding
      first-derivative `derivatives` rows from
      `docs/API_CONTRACT.md` "P2.2 Derivative-Data Methods".
      `evaluationX: ["1.5"]`.
    - _Requirements: R11.4, R12.2_
    - Depends on: 1.1, 1.10
    - Acceptance: Each entry seeds `form.derivatives` correctly with
      string `x` and `value` and no `order` field (the request
      builder injects `order: 1`).

  - [x] 3.4 Add the Taylor example to `ExamplesPanel.tsx`
    - File: `frontend/src/components/ExamplesPanel.tsx`
    - Append "Taylor (cos x, order 3)" with
      `mode: "x_values_with_function"`,
      `function: "cos(x)"`, `xValues: ["0", "1"]`,
      `methods: ["taylor"]`,
      `taylorCenter: "0"`, `taylorOrder: 3`, and
      `evaluationX: ["1/2"]`.
    - _Requirements: R11.4, R12.2_
    - Depends on: 1.1, 1.10
    - Acceptance: Loading the example seeds the four Taylor-related
      `FormState` fields exactly as named.

  - [x] 3.5 Add the Cubic Spline example to `ExamplesPanel.tsx`
    - File: `frontend/src/components/ExamplesPanel.tsx`
    - Append "Cubic Spline (lecture three-point)" with
      `mode: "points"`,
      `points: [["1","2"], ["2","3"], ["3","5"]]`,
      `methods: ["cubic_spline"]`,
      `splineBoundaryCondition: "natural"`,
      `evaluationX: ["5/2"]`, and `graph: true`.
    - _Requirements: R11.4, R12.2_
    - Depends on: 1.1, 1.10
    - Acceptance: Loading the example seeds graph mode true and the
      spline boundary string `"natural"`.

  - [x] 3.6 Add the deferred Osculating example to `ExamplesPanel.tsx`
    - File: `frontend/src/components/ExamplesPanel.tsx`
    - Append "Osculating (deferred)" with the title prefixed
      "Deferred — " per `design.md` §10.5. Use the Bessel-style
      points and first-derivative rows from C3; set
      `methods: ["osculating"]`. Per locked decision 4 the Load
      button is enabled; computing the example produces a
      `method_not_implemented` response that the deferred renderer
      (D5) displays.
    - _Requirements: R11.4, R11.5_
    - Depends on: 1.1, 1.10
    - Acceptance: Entry loads with `osculating` selected and a non-
      empty `derivatives` array. The title is prefixed
      "Deferred — ".

- [ ] 4. Group D — Family renderers, MethodDetails dispatcher, and PolynomialCard extensions

  - [x] 4.1 Add `EqualSpacingDetails.tsx`
    - File:
      `frontend/src/components/results/methods/EqualSpacingDetails.tsx`
      (new)
    - Render `newton_forward`, `newton_backward`, and `stirling`
      panels per `design.md` §9.1. Layout (top to bottom):
      method-level error and warnings (via the existing
      `ErrorNotice` / `MethodWarnings`), spacing summary
      (`spacing_h`, `anchor_index` or `center_index`/`center_x`),
      difference table wrapped in `overflow-x-auto rounded-lg`,
      per-evaluation block with `s`, `value`, and `terms`, target-
      guidance advisory copy when `target_guidance.recommended`
      differs from this method's name, and the `steps` `<ol>`. The
      component reads only backend fields; no math is computed.
    - _Requirements: R6.1, R6.2, R6.3, R6.4, R6.5, R6.6, R14.3_
    - Depends on: 1.3
    - Acceptance: Component renders all documented fields, never
      auto-switches methods, and uses existing voices. `tsc -b`
      clean.

  - [x] 4.2 Add `HermiteDetails.tsx`
    - File:
      `frontend/src/components/results/methods/HermiteDetails.tsx`
      (new)
    - Render `hermite_divided_difference` and `hermite` panels per
      `design.md` §9.2. Render repeated nodes, divided-difference
      table, coefficients, nested form, expanded form,
      `latex_expanded` via KaTeX. For `hermite` with
      `basis_form.status === "included"`, render the formula line,
      basis-term table, expanded form, latex via KaTeX, and the
      `matches_divided_difference` indicator. Per locked decision 2,
      for `basis_form.status === "omitted"`, render an
      informational notice that surfaces the message of the
      corresponding `expanded_polynomial_omitted` warning whose
      `details.artifact === "hermite_basis_form"`. Fall back to a
      generic "basis form omitted by the backend" line when the
      warning is absent. Wrap tables in `overflow-x-auto rounded-lg`.
    - _Requirements: R7.1, R7.2, R7.3, R7.4, R7.5, R14.3_
    - Depends on: 1.4
    - Acceptance: Component renders both happy paths plus the omitted
      basis-form path. The omitted state never reconstructs the
      basis form. `tsc -b` clean.

  - [x] 4.3 Add `TaylorDetails.tsx`
    - File:
      `frontend/src/components/results/methods/TaylorDetails.tsx`
      (new)
    - Render the `taylor` panel per `design.md` §9.3. Header row
      with `center`, `order`, and `series_name`; render the
      "Maclaurin (center = 0)" badge when
      `series_name === "Maclaurin"` without altering polynomial
      fields. Term table with columns `order`, `derivative`,
      `derivative_at_center`, `coefficient`, `term`, `latex_term`
      via KaTeX. Polynomial forms (`taylor_form`, `expanded`,
      `latex_expanded`, `latex_taylor`). Evaluation chips. Render
      `remainder_note` text exactly. Inline `ErrorNotice` for
      `unsupported_taylor_function`.
    - _Requirements: R8.1, R8.2, R8.3, R8.4, R8.5, R14.3_
    - Depends on: 1.5
    - Acceptance: Component does not call SymPy or Math.js. All
      polynomial text is rendered exactly as returned. `tsc -b`
      clean.

  - [x] 4.4 Add `CubicSplineDetails.tsx`
    - File:
      `frontend/src/components/results/methods/CubicSplineDetails.tsx`
      (new)
    - Render the `cubic_spline` panel per `design.md` §9.4.
      Boundary-condition badge, ordered-nodes table, second-
      derivatives chip row, segments table (columns `index`,
      `interval`, `coefficients.{a,b,c,d}`, `local_form`, `expanded`,
      `latex` via KaTeX), continuity-check rows with `✓`/`✗` plus
      text labels, and evaluation chips that surface
      `segment_index` when present. Surface a body-voice piecewise
      notice when
      `polynomial.expanded_omitted_reason === "piecewise_method_no_global_polynomial"`.
      Inline `ErrorNotice` for `unsupported_boundary_condition`.
      Wrap segments table in `overflow-x-auto rounded-lg`.
    - _Requirements: R9.1, R9.2, R9.3, R9.5, R9.6, R14.3_
    - Depends on: 1.5, 1.6
    - Acceptance: Component renders all documented fields and never
      computes spline data. `tsc -b` clean.

  - [x] 4.5 Add `DeferredMethodDetails.tsx`
    - File:
      `frontend/src/components/results/methods/DeferredMethodDetails.tsx`
      (new)
    - Render any method whose response carries
      `error.code === "method_not_implemented"` per `design.md`
      §9.5. Layout: "Deferred" badge, body-voice paragraph with the
      backend `message` and `Code: method_not_implemented` in
      numeric voice (via shared `ErrorNotice` with
      `severity="warning"`), and lecture-aware copy explaining the
      deferral. Render no tables or terms.
    - _Requirements: R10.2, R10.3_
    - Depends on: 1.4
    - Acceptance: Component renders only backend fields plus the
      static lecture copy. `tsc -b` clean.

  - [x] 4.6 Refactor `MethodDetails.tsx` to a thin tab-list dispatcher
    - File: `frontend/src/components/results/MethodDetails.tsx`
    - Per locked decision 1, keep the four V1 panels and add eight
      Phase 2 panels. Each panel imports the family renderer from
      `frontend/src/components/results/methods/*.tsx` (D1–D5). The
      `osculating` panel routes to `DeferredMethodDetails`.
      Preserve `pickInitialTab()` behavior so V1 default tab logic
      is unchanged. Keep sibling-method visibility under
      `status === "partial"` (R6.5, R10.4).
    - _Requirements: R6.5, R10.4, R12.1_
    - Depends on: 4.1, 4.2, 4.3, 4.4, 4.5
    - Acceptance: V1 behavior is unchanged. All eight Phase 2 panels
      mount under their tabs when present. Failing methods do not
      hide siblings.

  - [x] 4.7 Extend `PolynomialCard.tsx` with Hermite, Taylor, and piecewise notice
    - File:
      `frontend/src/components/results/PolynomialCard.tsx`
    - Add a "Hermite" tab visible when `polynomial.hermite_form` is
      non-null; render `hermite_form` (numeric voice) and
      `latex_hermite` via KaTeX. Add a "Taylor" tab visible when
      `polynomial.taylor_form` is non-null; render `taylor_form`
      and `latex_taylor`. When
      `polynomial.expanded_omitted_reason === "piecewise_method_no_global_polynomial"`,
      replace Expanded tab content with a body-voice notice and
      hide the Factored tab. Preserve V1 KaTeX wrapper styles
      (`bg-muted/30 rounded-lg p-4` with no inner `border`).
    - _Requirements: R2.4, R7.2, R8.1, R9.3_
    - Depends on: 1.6
    - Acceptance: V1 layout is unchanged when neither
      `hermite_form` nor `taylor_form` is present and
      `expanded_omitted_reason` is not the piecewise value.

- [x] 5. Group E — Cross-cutting renderers (Guide, Result Quality, Summary, Graph)

  - [x] 5.1 Add Phase 2 `MethodBlock` entries to `GuidedExplanation.tsx`
    - File:
      `frontend/src/components/results/GuidedExplanation.tsx`
    - Add `MethodBlock` entries for "Newton Forward", "Newton
      Backward", "Stirling", "Hermite Divided Difference", "Hermite
      Basis Form", "Taylor / Maclaurin", and "Cubic Spline" per the
      table in `design.md` §10.1. Add a "Deferred methods" block
      when `data.methods.osculating?.error?.code === "method_not_implemented"`.
      Each block reads only `data.methods[<name>]` and the input
      summary; it does not compute math.
    - _Requirements: R11.1, R11.6, R12.3_
    - Depends on: 1.6
    - Acceptance: V1 blocks remain. New blocks render only when
      their backend payload is present. `tsc -b` clean.

  - [x] 5.2 Add Phase 2 entries to `ResultQualityGuide.tsx`
    - File:
      `frontend/src/components/results/ResultQualityGuide.tsx`
    - Extend `WARNING_GUIDANCE` with `{ means, check }` rows for
      every Phase 2 code listed in R11.2 plus
      `nodes_reordered`, using the table in `design.md` §10.2.
      Severity continues to come from `getWarningMeta` (do not
      compute it locally).
    - _Requirements: R11.2, R11.6, R12.4_
    - Depends on: 1.7
    - Acceptance: All R11.2 codes are present in
      `WARNING_GUIDANCE`. Severity is read from `getWarningMeta`.

  - [x] 5.3 Group `SummaryCard.tsx` methods row by family
    - File:
      `frontend/src/components/results/SummaryCard.tsx`
    - Render the methods row grouped by family per `design.md`
      §10.3. Family order matches `A14`'s catalog. Within a family,
      methods are listed in catalog order. Phase 2 methods reuse
      the `secondary` Badge variant; V1 mappings are preserved
      exactly: `lagrange`/`newton` → `secondary`, `barycentric` →
      primary tint (Stable Evaluator), `neville` → `info`.
      Family group labels render in `font-label` voice. Barycentric
      copy stays as Stable Evaluator and graph support; no Phase 2
      change reframes Barycentric as a primary classroom
      construction method.
    - _Requirements: R11.3, R12.1, R13.3_
    - Depends on: 1.1
    - Acceptance: V1 mappings unchanged. New Phase 2 methods render
      under their family heading in catalog order.

  - [x] 5.4 Verification-only check on `GraphCard.tsx`
    - File: `frontend/src/components/results/GraphCard.tsx`
    - **Verification leaf with no code change.** Inspect the
      existing `GraphCard.tsx` and confirm it already accepts
      `graph_data.source_method` as a free-form string (so
      `"cubic_spline"` passes through), already renders only the
      backend `graph_data.x | f_x | P_x | error` arrays plus node
      coordinates, and does not perform any client-side
      resampling, smoothing, or recomputation. Record the
      confirmation in the leaf's "Acceptance" line. Do not edit
      the file.
    - _Requirements: R9.4, R12.5_
    - Depends on: 1.1, 1.6
    - Acceptance: The file is read and confirmed to satisfy R9.4
      and R12.5 without modification. No changes are made.

- [ ] 6. Group F — Fixtures and Vitest tests

  - [x] 6.1 Add Equal-Spacing Family fixtures
    - File: `frontend/src/test/interpolate-response.fixtures.ts`
    - Append `newtonForwardResponse`, `newtonBackwardResponse`, and
      `stirlingResponse` per `design.md` §12.1, sourced from
      `docs/API_CONTRACT.md` "P2.1 Equal-Spacing Methods" example
      payloads. Each fixture uses `satisfies InterpolateResponse`
      so type drift is caught at compile time.
    - _Requirements: R15.1_
    - Depends on: 1.6
    - Acceptance: All three fixtures compile against the extended
      `InterpolateResponse` and contain string-typed numeric
      values.

  - [x] 6.2 Add Hermite Family fixtures (happy + omitted basis)
    - File: `frontend/src/test/interpolate-response.fixtures.ts`
    - Append `hermiteDividedDifferenceResponse`, `hermiteResponse`
      (with `basis_form.status === "included"` and a small
      degree), and `hermiteOmittedBasisResponse` (with
      `basis_form.status === "omitted"` plus a matching
      `expanded_polynomial_omitted` warning whose
      `details.artifact === "hermite_basis_form"`).
    - _Requirements: R15.1, R7.3_
    - Depends on: 1.6
    - Acceptance: Three fixtures compile. The omitted-basis fixture
      contains the warning code with the documented `details`
      payload exactly.

  - [x] 6.3 Add Taylor fixtures (happy + unsupported function)
    - File: `frontend/src/test/interpolate-response.fixtures.ts`
    - Append `taylorResponse` (cos(x), center 0, order 3, eval
      x = 1/2, `series_name === "Maclaurin"`) and
      `taylorUnsupportedFunctionResponse` (method-level
      `error.code === "unsupported_taylor_function"`).
    - _Requirements: R15.1, R8.4_
    - Depends on: 1.6
    - Acceptance: Both fixtures compile and use the documented
      shape. `taylor_form` is set on the Maclaurin example.

  - [x] 6.4 Add Cubic Spline fixtures (happy with graph passthrough + unsupported boundary)
    - File: `frontend/src/test/interpolate-response.fixtures.ts`
    - Append `cubicSplineResponse` with
      `graph_data.source_method === "cubic_spline"` and the lecture
      three-point spline data, and
      `splineUnsupportedBoundaryResponse` with method-level
      `error.code === "unsupported_boundary_condition"`. The happy
      fixture sets `polynomial.expanded_omitted_reason ===
      "piecewise_method_no_global_polynomial"` per
      `docs/API_CONTRACT.md`.
    - _Requirements: R15.1, R9.3, R9.5_
    - Depends on: 1.6
    - Acceptance: Both fixtures compile. The happy fixture is
      reused by D7's piecewise notice test and by F12's graph
      passthrough test.

  - [x] 6.5 Add the deferred Osculating fixture
    - File: `frontend/src/test/interpolate-response.fixtures.ts`
    - Append `osculatingDeferredResponse` with top-level
      `status: "partial"` and
      `methods.osculating.error.code === "method_not_implemented"`.
      The fixture also includes a successful sibling method (e.g.
      Lagrange) so D6 / D11 can assert sibling visibility.
    - _Requirements: R15.1, R10.4_
    - Depends on: 1.6
    - Acceptance: Fixture compiles. Sibling method is present and
      successful.

  - [x] 6.6 Add Equal-Spacing and Hermite error fixtures
    - File: `frontend/src/test/interpolate-response.fixtures.ts`
    - Append `unequalSpacingErrorResponse` (with
      `methods.newton_forward.error.code === "unequal_spacing"`)
      and `hermiteMissingDerivativeErrorResponse` (with
      `methods.hermite.error.code === "missing_derivative_data"`).
    - _Requirements: R15.1, R6.5, R7.4_
    - Depends on: 1.6
    - Acceptance: Both fixtures compile and reference real backend
      error codes documented in `docs/API_CONTRACT.md`.

  - [x] 6.7 Add `EqualSpacingDetails.test.tsx`
    - File:
      `frontend/src/components/results/methods/EqualSpacingDetails.test.tsx`
      (new)
    - Cover (1) happy path renders difference table, `spacing_h`,
      `anchor_index`, `s`, `terms`, target guidance, evaluations;
      (2) `unequalSpacingErrorResponse` renders `ErrorNotice` with
      backend message and the literal `Code: unequal_spacing`;
      (3) sibling-method visibility under `partial` status; and
      (4) target-guidance advisory copy does not mutate
      `form.methods` or call `interpolate`.
    - _Requirements: R6.1, R6.2, R6.3, R6.4, R6.5, R15.2_
    - Depends on: 4.1, 6.1, 6.6
    - Acceptance: All four cases pass under Vitest.

  - [x] 6.8 Add `HermiteDetails.test.tsx`
    - File:
      `frontend/src/components/results/methods/HermiteDetails.test.tsx`
      (new)
    - Cover (1) happy path renders repeated nodes, divided-
      difference table, coefficients, nested form, expanded form,
      `latex_expanded` via KaTeX; (2) `basis_form.status ===
      "included"` renders basis terms and the
      `matches_divided_difference` indicator; (3)
      `basis_form.status === "omitted"` renders the omission notice
      sourced from the `expanded_polynomial_omitted` warning whose
      `details.artifact === "hermite_basis_form"`; (4)
      `missing_derivative_data` error path renders inline.
    - _Requirements: R7.1, R7.2, R7.3, R7.4, R15.2_
    - Depends on: 4.2, 6.2, 6.6
    - Acceptance: All four cases pass under Vitest.

  - [x] 6.9 Add `TaylorDetails.test.tsx`
    - File:
      `frontend/src/components/results/methods/TaylorDetails.test.tsx`
      (new)
    - Cover (1) happy path renders all term-table columns,
      `taylor_form`, `latex_taylor`, evaluations, and
      `remainder_note`; (2) `series_name === "Maclaurin"` shows the
      Maclaurin badge without altering polynomial fields; (3)
      `unsupported_taylor_function` error path renders inline.
    - _Requirements: R8.1, R8.2, R8.3, R8.4, R15.2_
    - Depends on: 4.3, 6.3
    - Acceptance: All three cases pass under Vitest.

  - [x] 6.10 Add `CubicSplineDetails.test.tsx`
    - File:
      `frontend/src/components/results/methods/CubicSplineDetails.test.tsx`
      (new)
    - Cover (1) happy path renders `boundary_condition`,
      `ordered_nodes`, `second_derivatives`, segment table,
      continuity checks, evaluations; (2) piecewise notice when
      `polynomial.expanded_omitted_reason === "piecewise_method_no_global_polynomial"`;
      (3) `unsupported_boundary_condition` error path renders
      inline.
    - _Requirements: R9.1, R9.2, R9.3, R9.5, R15.2_
    - Depends on: 4.4, 6.4
    - Acceptance: All three cases pass under Vitest.

  - [x] 6.11 Add `DeferredMethodDetails.test.tsx`
    - File:
      `frontend/src/components/results/methods/DeferredMethodDetails.test.tsx`
      (new)
    - Cover (1) `osculatingDeferredResponse` renders the deferred
      chip, the backend message, and the literal
      `Code: method_not_implemented`, and renders no tables; (2)
      sibling V1 method tabs still render when `status === "partial"`
      because of `osculating` only.
    - _Requirements: R10.2, R10.3, R10.4, R15.2_
    - Depends on: 4.5, 4.6, 6.5
    - Acceptance: Both cases pass under Vitest.

  - [x] 6.12 Add `CubicSplineGraphPassthrough.test.tsx`
    - File:
      `frontend/src/components/results/methods/CubicSplineGraphPassthrough.test.tsx`
      (new)
    - Render `<GraphCard graphData={cubicSplineResponse.graph_data!}
      nodes={...} />` and assert that the rendered `source_method`
      Badge text is `"cubic_spline"`, the chart region exists, and
      the chart props pass `graph_data.x`, `graph_data.f_x`, and
      `graph_data.P_x` to Recharts unmutated. Verify by reading the
      rendered React props or by capturing the data array
      identities, not by parsing the SVG.
    - _Requirements: R9.4, R15.3_
    - Depends on: 6.4
    - Acceptance: Test passes and proves no client-side mutation
      of the graph arrays.

  - [x] 6.13 Add `MethodSelector.test.tsx`
    - File:
      `frontend/src/components/MethodSelector.test.tsx` (new)
    - Cover (1) catalog renders all 12 methods grouped by family
      in the documented order; (2) `osculating` carries the
      "Deferred" badge; (3) each Equal-Spacing card renders the
      static eligibility hint; (4) selecting and deselecting a
      Phase 2 method updates the bound state without throwing.
    - _Requirements: R4.1, R4.3, R4.4, R10.1, R15.2_
    - Depends on: 1.14, 3.1
    - Acceptance: All four cases pass under Vitest.

  - [x] 6.14 Extend `App.examples.test.tsx` for Phase 2 examples
    - File: `frontend/src/App.examples.test.tsx`
    - For each new example added in C2–C6, assert that loading the
      example sets the expected `form.methods`,
      `form.derivatives`, `form.taylorCenter`, `form.taylorOrder`,
      `form.splineBoundaryCondition`, and other relevant
      `FormState` fields, and does NOT call `/api/interpolate`.
    - _Requirements: R11.4, R11.5, R12.2, R15.2_
    - Depends on: 3.2, 3.3, 3.4, 3.5, 3.6
    - Acceptance: Existing V1 example assertions still pass; new
      Phase 2 example assertions pass.

- [ ] 7. Group G — Verification, Browser QA, documentation, and commit

  - [x] 7.1 Run `npm run build`
    - Working directory: `frontend/`
    - Command: `npm run build`
    - _Requirements: R16.1_
    - Depends on: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.12,
      A13, A14, B1, B2, B3, B4, B5, B6, C1, C2, C3, C4, C5, C6, D1,
      D2, D3, D4, D5, D6, D7, E1, E2, E3, E4, F1, F2, F3, F4, F5,
      F6, F7, F8, F9, F10, F11, F12, F13, F14
    - Acceptance: Exit code 0. TypeScript build and Vite production
      build complete with no errors. Capture the full output in
      the handoff record.

  - [x] 7.2 Run `npm run lint`
    - Working directory: `frontend/`
    - Command: `npm run lint`
    - _Requirements: R16.2_
    - Depends on: 7.1
    - Acceptance: Exit code 0. Zero ESLint errors. Pre-existing
      shadcn `react-refresh/only-export-components` warnings
      remain acceptable; new files MUST NOT introduce additional
      warnings.

  - [x] 7.3 Run `npm test`
    - Working directory: `frontend/`
    - Command: `npm test`
    - _Requirements: R16.3, R15.5_
    - Depends on: 7.1
    - Acceptance: Exit code 0. All existing Vitest tests plus the
      new Phase 2 tests (F7–F14) pass.

  - [x] 7.4 Browser QA — Equal-Spacing scenarios
    - Execute scenarios PHASE2-EQ-01 (happy path),
      PHASE2-EQ-02 (ineligible), and PHASE2-EQ-03 (Stirling needs
      centered count) per `design.md` §13. Capture screenshots
      under
      `.kiro/specs/phase-2-frontend-workbench/screenshots/`. Read
      the DevTools Network tab and confirm only `GET /health`,
      `POST /api/validate-function`, and `POST /api/interpolate`
      are called.
    - _Requirements: R17.1, R17.2, R17.9, R1.2_
    - Depends on: 7.3
    - Acceptance: Three screenshots saved. Network expectations
      met. Pass / fail recorded honestly per scenario.

  - [x] 7.5 Browser QA — Hermite scenarios
    - Execute scenarios PHASE2-HERMITE-01 (happy),
      PHASE2-HERMITE-02 (missing derivative), and PHASE2-HERMITE-03
      (basis form omitted) per `design.md` §13. Capture
      screenshots under
      `.kiro/specs/phase-2-frontend-workbench/screenshots/`.
    - _Requirements: R17.3, R17.9_
    - Depends on: 7.3
    - Acceptance: Three screenshots saved. Network expectations
      met. Pass / fail recorded honestly per scenario.

  - [x] 7.6 Browser QA — Taylor scenarios
    - Execute scenarios PHASE2-TAYLOR-01 (happy) and
      PHASE2-TAYLOR-02 (unsupported function) per `design.md`
      §13. Capture screenshots under
      `.kiro/specs/phase-2-frontend-workbench/screenshots/`.
    - _Requirements: R17.4, R17.9_
    - Depends on: 7.3
    - Acceptance: Two screenshots saved. Network expectations met.
      Pass / fail recorded honestly per scenario.

  - [x] 7.7 Browser QA — Cubic Spline scenarios
    - Execute scenarios PHASE2-SPLINE-01 (happy with graph) and
      PHASE2-SPLINE-02 (unsupported boundary, exercised only if
      QA can drive the disabled options) per `design.md` §13.
      Capture screenshots under
      `.kiro/specs/phase-2-frontend-workbench/screenshots/`. For
      PHASE2-SPLINE-01, confirm the rendered Graph tab shows
      `graph_data.source_method === "cubic_spline"`.
    - _Requirements: R17.5, R9.4, R17.9_
    - Depends on: 7.3
    - Acceptance: Two screenshots saved. Network expectations met.
      Pass / fail recorded honestly per scenario.

  - [x] 7.8 Browser QA — Deferred Osculating scenario
    - Execute scenario PHASE2-OSCULATING-01 per `design.md` §13.
      Capture screenshot under
      `.kiro/specs/phase-2-frontend-workbench/screenshots/`.
      Confirm the deferred-method panel renders cleanly and that
      sibling renderers (when present in the response) remain
      operational.
    - _Requirements: R17.6, R10.4, R17.9_
    - Depends on: 7.3
    - Acceptance: Screenshot saved. Pass / fail recorded honestly.

  - [x] 7.9 Browser QA — V1 / V1+ regression scenarios
    - Execute scenarios PHASE2-V1-01 (Linear Lagrange),
      PHASE2-V1-02 (`1/x` function-backed), PHASE2-V1-03 (Neville
      Table), and PHASE2-V1-04 (Newton Divided Difference) per
      `design.md` §13. Capture screenshots under
      `.kiro/specs/phase-2-frontend-workbench/screenshots/`.
    - _Requirements: R17.7, R12.1, R12.2, R12.3, R12.4, R12.5,
      R17.9_
    - Depends on: 7.3
    - Acceptance: Four screenshots saved. Network expectations
      met. Each V1 / V1+ scenario passes without regression.

  - [x] 7.10 Browser QA — 320px viewport overflow check
    - Execute scenario PHASE2-MOBILE-01 per `design.md` §13.
      Capture screenshot under
      `.kiro/specs/phase-2-frontend-workbench/screenshots/`. Run
      a DOM assertion in the browser console that
      `document.documentElement.scrollWidth <= document.documentElement.clientWidth`
      on the main page after loading any Phase 2 result.
    - _Requirements: R14.1, R17.8, R17.9_
    - Depends on: 7.3
    - Acceptance: Screenshot saved. DOM assertion passes. No
      page-level horizontal overflow at 320px.

  - [x] 7.11 Update `docs/HANDOFF.md`
    - File: `docs/HANDOFF.md`
    - Append a Phase 2 frontend section recording: every frontend
      file modified or created (paths under `frontend/src/`),
      every command run with working directory and exit result
      (G1, G2, G3), and every Browser QA scenario from G4–G10
      with pass / fail outcome and screenshot path. Confirm no
      file under `backend/` was modified. Per R18.5, do not
      claim a command or scenario passed unless it was actually
      executed and observed.
    - _Requirements: R18.2, R18.5, R16.4, R16.5_
    - Depends on: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10
    - Acceptance: HANDOFF section is complete, honest, and
      references each command, file, and scenario.

  - [x] 7.12 Update `docs/FRONTEND_HANDOFF.md`
    - File: `docs/FRONTEND_HANDOFF.md`
    - Document the implemented Phase 2 React renderers (catalog,
      adaptive input panel, family renderers, deferred renderer,
      cross-cutting updates), the Browser QA Matrix outcomes, and
      any open caveats. Reference the screenshots under
      `.kiro/specs/phase-2-frontend-workbench/screenshots/`. Do
      not modify `docs/API_CONTRACT.md` (owned by Codex per
      R18.4).
    - _Requirements: R18.1, R17.9_
    - Depends on: 7.11
    - Acceptance: FRONTEND_HANDOFF section reflects actual
      implementation and references the screenshots.

  - [x] 7.13 Update `docs/PLAN.md`
    - File: `docs/PLAN.md`
    - Add a Phase 2 frontend workbench milestone row to the
      milestones table, mark it complete with the recorded
      verification commands and Browser QA outcomes, and update
      the Remaining Work bullets accordingly.
    - _Requirements: R18.3_
    - Depends on: 7.11, 7.12
    - Acceptance: PLAN.md milestone table reflects the completed
      Phase 2 frontend status.

  - [x] 7.14 Capture `git status --short`
    - Working directory: repository root
    - Command: `git status --short`
    - Capture the full output for the commit record.
    - _Requirements: R18.2, R18.5_
    - Depends on: 7.11, 7.12, 7.13
    - Acceptance: Output captured. Confirm no path under
      `backend/` appears.

  - [x] 7.15 Final commit
    - Working directory: repository root
    - Stage only the frontend files under `frontend/src/`, the
      screenshots under
      `.kiro/specs/phase-2-frontend-workbench/screenshots/`, and
      the four reporting files (`docs/HANDOFF.md`,
      `docs/FRONTEND_HANDOFF.md`, `docs/PLAN.md`, and the spec's
      own files). Compose a commit message that summarizes the
      Phase 2 frontend workbench implementation, references the
      verification command results, and lists the Browser QA
      outcomes.
    - _Requirements: R18.2, R18.5_
    - Depends on: 7.14
    - Acceptance: Single commit recorded. No backend file is
      staged. Pre-commit hooks (if any) are preserved.

## Final Completion Checklist

The phase-2-frontend-workbench feature is complete when every item
below is satisfied:

- `npm run build` from `frontend/` passes (R16.1, recorded in G1).
- `npm run lint` from `frontend/` passes (R16.2, recorded in G2).
- `npm test` from `frontend/` passes including all new Phase 2
  Vitest tests (R16.3, R15.5, recorded in G3).
- The Browser QA Matrix has been executed and recorded for
  Equal-Spacing (R17.1, R17.2), Hermite (R17.3), Taylor (R17.4),
  Cubic Spline (R17.5), deferred Osculating (R17.6), V1 / V1+
  regressions (R17.7), and the 320px viewport check (R17.8). Each
  scenario has a saved screenshot under
  `.kiro/specs/phase-2-frontend-workbench/screenshots/` (R17.9).
- The Network tab confirmation in G4–G10 demonstrates that only
  `GET /health`, `POST /api/validate-function`, and
  `POST /api/interpolate` were called (R1.2).
- `docs/HANDOFF.md` records the files changed, commands run, and
  Browser QA outcomes honestly (R18.2, R18.5, R16.4, R16.5).
- `docs/FRONTEND_HANDOFF.md` reflects the implemented renderers and
  references the screenshots (R18.1).
- `docs/PLAN.md` records the Phase 2 frontend milestone with
  verification status (R18.3).
- `docs/API_CONTRACT.md` is unchanged (R18.4).
- No file under `backend/` was created, modified, or deleted. The
  final commit's `git status --short` and `git diff --name-only`
  confirm zero `backend/` paths.

## Notes

- Property-based tests are intentionally not used in this feature.
  See the "Property-Based Testing Rationale" section above for the
  reasoning. There is no Correctness Properties section in
  `design.md` and no PBT sub-task in any group.
- Every task is required. None is marked optional.
- Each implementation leaf is intentionally split from its test
  leaf so the orchestrator's wave-based scheduler can dispatch
  independent tasks in parallel: Group A foundations land in the
  first waves, Groups B–E (depending only on Group A) run in
  parallel waves once their Group A dependencies complete, Group F
  depends on the renderer implementation it covers, and Group G
  runs last.
- All numeric user input continues to be passed to the backend as
  strings (R1.4). No client-side interpolation, finite-difference,
  Hermite, Taylor, spline, graph-sampling, or error computation is
  introduced.
