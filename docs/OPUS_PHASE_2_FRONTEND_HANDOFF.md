# Claude Opus Handoff - Phase 2 Lecture Method Workbench Frontend

## Purpose
This handoff is for Claude Opus to implement the remaining React workbench integration for the completed Phase 2 backend. Codex owns the backend numerical engine, API contract, tests, and docs. Claude Opus owns the React frontend controls, renderers, and browser QA.

## Current Status
- Backend Phase 2 P2.0 through P2.5 is complete and verified.
- Stable endpoints are unchanged:
  - `GET /health`
  - `POST /api/validate-function`
  - `POST /api/interpolate`
- Backend Python 3.11+ gate is closed with Python 3.12.13 in `backend/.venv`:
  - `.\.venv\Scripts\python.exe -m pytest` -> 73 passed
  - `.\.venv\Scripts\python.exe -m ruff check .` -> all checks passed
- Frontend baseline verification passed during P2.5:
  - `npm run build`
  - `npm run lint`
  - `npm test` -> 4 files / 17 tests passed
- Current V1+ browser smoke passed for the existing frontend guide/result-quality flows:
  - linear Lagrange graph compute
  - `f(x) = 1/x` function-backed lecture example
- Actual Phase 2 frontend controls/renderers are not implemented yet.
- Full product release-candidate status remains blocked until Claude Opus implements and browser-tests the Phase 2 frontend workbench.

## Required Reading
Before editing React code, read these backend-owned source-of-truth docs:

- `docs/API_CONTRACT.md`
- `docs/FRONTEND_HANDOFF.md`
- `docs/PHASE_2_FINAL_AUDIT.md`
- `docs/superpowers/specs/phase-2-lecture-method-workbench/requirements.md`
- `docs/superpowers/specs/phase-2-lecture-method-workbench/design.md`
- `docs/superpowers/specs/phase-2-lecture-method-workbench/tasks.md`

## Existing Frontend Files To Extend
Expected React integration points:

- `frontend/src/components/MethodSelector.tsx`
- `frontend/src/components/InputPanel.tsx`
- `frontend/src/components/ExamplesPanel.tsx`
- `frontend/src/components/results/MethodDetails.tsx`
- `frontend/src/components/results/GuidedExplanation.tsx`
- `frontend/src/components/results/ResultQualityGuide.tsx`
- `frontend/src/components/results/GraphCard.tsx`
- `frontend/src/lib/api-types.ts`
- `frontend/src/lib/api-client.ts`
- `frontend/src/lib/warnings.ts`

Do not move interpolation or approximation math into these files.

## Hard Boundaries
- Do not add per-method endpoints.
- Do not change stable endpoint paths.
- Keep numeric API input values as strings.
- React must not compute finite differences, Hermite repeated-node tables, Taylor derivatives/terms, spline coefficients/segments, continuity checks, graph samples, interpolated values, errors, or warning severity.
- React must render backend `graph_data` arrays exactly as returned.
- Do not silently auto-select finite-difference methods when nodes are not eligible.
- Render method-level backend errors instead of hiding or repairing them in the client.
- `osculating` is accepted by schema but intentionally deferred; render its `method_not_implemented` response.
- Keep Barycentric as stable evaluation / graph support, not the main classroom construction method.

## Method Catalog Additions
Add these methods to the frontend catalog without changing the backend contract:

| Method | Family | Frontend role |
|---|---|---|
| `newton_forward` | Equal spacing | finite-difference construction near first nodes |
| `newton_backward` | Equal spacing | finite-difference construction near last nodes |
| `stirling` | Equal spacing | centered finite-difference construction |
| `hermite_divided_difference` | Derivative data | repeated-node divided-difference construction |
| `hermite` | Derivative data | first-derivative Hermite construction |
| `osculating` | Derivative data | deferred generalized derivative matching |
| `taylor` | Function derivative | local Taylor/Maclaurin approximation |
| `cubic_spline` | Piecewise | natural cubic spline segment construction |

## Equal-Spacing Family
Backend implements:

- `newton_forward`
- `newton_backward`
- `stirling`

Frontend must add:

- equal-spacing method cards
- finite-difference table renderers
- target-location guidance display
- ineligible/error state rendering
- lecture examples for each method

Render these backend fields when present:

- `spacing_h`
- `anchor_index`
- `center_index`
- `center_x`
- `s`
- `terms`
- `target_guidance`
- `forward_difference_table`
- `backward_difference_table`
- `centered_difference_table`

Expected method-level errors include:

- `unequal_spacing`
- `stirling_requires_centered_nodes`

Do not auto-switch methods based on `target_guidance.recommended`; show it as guidance only.

Example request:

```json
{
  "mode": "x_values_with_function",
  "function": "cos(x)",
  "x_values": ["1.0", "1.3", "1.6", "1.9", "2.2"],
  "methods": ["newton_forward", "newton_backward", "stirling"],
  "evaluation_x": ["1.5"],
  "precision": 50,
  "exact": true,
  "graph": false
}
```

## Derivative-Data Family
Backend implements:

- `hermite_divided_difference`
- `hermite`

Backend defers:

- `osculating`

Frontend must add:

- derivative input table keyed to current nodes
- first-derivative controls for Hermite
- repeated-node table renderer
- Hermite basis included/omitted state renderer
- lecture example for Hermite
- `osculating` deferred-method rendering

Request rules:

- Send derivative data through `derivatives`.
- Keep `x` and `value` as strings.
- For current Hermite support, use `order: 1`.
- Provide one first derivative for every interpolation node.

Render these backend fields when present:

- `repeated_nodes`
- `divided_difference_table`
- `coefficients`
- `nested_form`
- `expanded`
- `latex_expanded`
- `latex_hermite`
- `basis_form`
- `evaluations`
- `steps`
- `warnings`
- `error`

Expected method-level errors include:

- `missing_derivative_data`
- `invalid_derivative_order`
- `method_not_implemented` for `osculating`

Example request:

```json
{
  "mode": "points",
  "points": [["1.3", "0.6200860"], ["1.6", "0.4554022"], ["1.9", "0.2818186"]],
  "derivatives": [
    {"x": "1.3", "order": 1, "value": "-0.52202324741466"},
    {"x": "1.6", "order": 1, "value": "-0.56989593526168"},
    {"x": "1.9", "order": 1, "value": "-0.581157072713434"}
  ],
  "methods": ["hermite_divided_difference", "hermite"],
  "evaluation_x": ["1.5"],
  "precision": 50,
  "exact": true
}
```

## Taylor Family
Backend implements:

- `taylor`

Frontend must add:

- Taylor config panel
- center input
- order input, constrained to backend-supported range
- Taylor/Maclaurin term renderer
- remainder-note display
- lecture example

Request rules:

- Use the existing `function` field.
- Use `method_options.taylor.center` as a string.
- Use `method_options.taylor.order` as an integer from 0 through 20.
- Use an existing function-backed request mode such as `x_values_with_function` or `function_interval`.

Render these backend fields when present:

- `center`
- `order`
- `series_name`
- `terms`
- `taylor_form`
- `expanded`
- `latex_expanded`
- `latex_taylor`
- `evaluations`
- `remainder_note`
- `steps`
- `warnings`
- `error`

Expected method-level errors include:

- `unsupported_taylor_function`
- Taylor option validation errors documented in `docs/API_CONTRACT.md`

Example request:

```json
{
  "mode": "x_values_with_function",
  "function": "cos(x)",
  "x_values": ["0", "1"],
  "methods": ["taylor"],
  "method_options": {"taylor": {"center": "0", "order": 3}},
  "evaluation_x": ["1/2"],
  "precision": 50,
  "exact": true
}
```

## Piecewise Family
Backend implements:

- `cubic_spline` with natural boundary condition

Frontend must add:

- spline boundary selector with only `natural` enabled unless backend support expands
- piecewise segment table
- segment interval metadata display
- continuity-check panel
- graph display using backend `graph_data` only
- lecture example

Request rules:

- Use `method_options.cubic_spline.boundary_condition = "natural"`.
- Other boundary conditions return method-level `unsupported_boundary_condition`.

Render these backend fields when present:

- `ordered_nodes`
- `second_derivatives`
- `segments`
- `continuity_checks`
- `evaluations`
- `steps`
- `warnings`
- `error`
- `graph_data.source_method`

If `polynomial.expanded_omitted_reason` is `piecewise_method_no_global_polynomial`, show that the spline is piecewise and has no single global polynomial.

Example request:

```json
{
  "mode": "points",
  "points": [["1", "2"], ["2", "3"], ["3", "5"]],
  "methods": ["cubic_spline"],
  "method_options": {"cubic_spline": {"boundary_condition": "natural"}},
  "evaluation_x": ["5/2"],
  "precision": 50,
  "exact": true,
  "graph": true
}
```

## Guided Explanation Updates
Add lecture-aware guide content for:

- when equal-spacing methods are eligible and when they are not
- why forward/backward/centered finite differences depend on target location
- why Hermite requires derivative data
- why repeated nodes are backend-owned table data
- why Taylor is local approximation around a center
- why natural cubic spline is piecewise rather than a single global polynomial
- why `osculating` is deferred

Keep explanations aligned with backend-returned method artifacts. Do not invent construction details in React.

## Result Quality / Warnings Guide Updates
Extend the existing guide to render Phase 2 warnings and method errors:

- equal-spacing ineligibility
- target-location warnings
- missing or invalid derivative data
- unsupported Taylor functions/options
- piecewise no-global-polynomial notes
- unsupported spline boundary conditions
- deferred `osculating`

Warning severity must come from backend fields and existing warning mapping only; do not compute severity from numerical values in React.

## Browser QA Required From Claude Opus
After implementation, run frontend build/lint/test and browser QA for:

- method picker/catalog shows all Phase 2 methods
- equal-spacing success flow
- equal-spacing ineligible flow
- Hermite derivative table success flow
- Hermite missing-derivative error flow
- Taylor success flow
- Taylor unsupported/error flow
- natural cubic spline success flow with backend graph data
- unsupported spline boundary error, if exposed by UI
- `osculating` deferred method-level error
- existing V1 methods still render and compute
- hidden Base UI display precision radio issue is fixed or explicitly rechecked

Network expectations:

- health polling may call `GET /health`
- function validation may call `POST /api/validate-function`
- compute must call `POST /api/interpolate`
- no per-method endpoint calls

## Acceptance Checklist
- `npm run build` passes.
- `npm run lint` passes.
- `npm test` passes.
- Browser QA proves major Phase 2 frontend flows against the real backend.
- Network tab shows only stable endpoint paths.
- React renders backend arrays/tables/terms/segments and does not compute them.
- Graphs use backend `graph_data`; spline graph uses `source_method: "cubic_spline"`.
- `docs/FRONTEND_HANDOFF.md` is updated with actual frontend implementation notes.
- `docs/HANDOFF.md` and `docs/PLAN.md` are updated with commands run and residual risks.
- Full product release-candidate audit is updated after frontend QA.

## Current Git Hygiene Note
At the time this handoff was created, tracked files under `Lecture/` were deleted in the worktree. Those deletions are unrelated to this Opus handoff and were not staged by Codex. Restore or intentionally commit them separately before calling the repository clean.
