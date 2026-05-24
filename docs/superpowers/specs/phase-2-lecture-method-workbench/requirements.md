# Phase 2 Lecture Method Workbench Requirements

## Status

Planning artifact for Phase 2. No implementation is authorized by this file by itself. Phase 2 must proceed by milestone and must preserve the v1 public API endpoints:

- `GET /health`
- `POST /api/interpolate`
- `POST /api/validate-function`

## Source Coverage

The Phase 2 method list is grounded in `Lecture/Lecture.txt` and `Lecture/pasted.txt` from this repository.

| Family | Lecture coverage | Phase 2 decision |
|---|---|---|
| Equal-spacing interpolation | Newton Forward-Difference, Newton Backward-Difference, and centered/Stirling sections are present in `Lecture/Lecture.txt`. | In scope for P2.1. |
| Derivative-data interpolation | Osculating, Taylor, Hermite, and Hermite divided-difference sections are present. | Hermite and Hermite divided differences in P2.2; osculating after Hermite is stable. |
| Taylor polynomial | Taylor theorem and examples are present in the osculating/Taylor lecture section. | In scope for P2.3. |
| Piecewise approximation | Natural cubic spline lecture section is present; clamped splines are mentioned but require endpoint derivative information. | Natural cubic spline in P2.4; clamped spline is deferred unless explicitly added later. |
| Barycentric | Not found as a lecture construction method in the lecture text. | Keep as stable evaluation / graph support, not as a main classroom construction method. |

## Functional Requirements

### FR1 - Stable API Surface

1. The backend must not add public per-method endpoints.
2. `POST /api/interpolate` must remain the single compute endpoint.
3. `POST /api/validate-function` must remain optional frontend pre-validation and must use the same parser rules as interpolation.
4. Existing v1 methods and fields must remain backward-compatible.
5. New Phase 2 request fields must be optional unless a newly selected method requires them.

### FR2 - Method Catalog

The backend method literal set must expand from:

```text
lagrange
newton
barycentric
neville
```

to include the planned Phase 2 methods:

```text
newton_forward
newton_backward
stirling
hermite_divided_difference
hermite
osculating
taylor
cubic_spline
```

The implementation may add the literals before all methods are implemented only if unavailable methods return explicit structured method errors rather than silent success.

### FR3 - Equal-Spacing Family

P2.1 must implement:

- `newton_forward`
- `newton_backward`
- `stirling`

The backend must:

1. Validate equal spacing before executing these methods.
2. Return a structured method error when spacing is not equal enough for the method.
3. Return forward-difference or backward-difference tables as backend data.
4. Return centered/Stirling table artifacts for Stirling.
5. Return target-location guidance explaining when a target is better suited for forward, backward, or centered formulas.
6. Never silently auto-select an equal-spacing method when nodes are ineligible.
7. Include lecture example regression tests.

### FR4 - Derivative-Data Family

P2.2 must implement:

- `hermite_divided_difference`
- `hermite`
- `osculating`, only after Hermite and repeated-node divided differences are stable

The backend must:

1. Accept derivative data as string-valued API inputs.
2. Validate derivative orders and reject missing required derivative data.
3. Preserve exact rational derivative values when exact mode allows it.
4. Build repeated-node divided-difference tables for Hermite divided differences.
5. Return Hermite polynomial output, LaTeX, evaluations, and lecture-aligned steps.
6. Return Hermite basis-form output when it is clean and low-risk.
7. Treat generalized osculating polynomial support as lower risk only after Hermite is proven.

### FR5 - Taylor Family

P2.3 must implement:

- `taylor`

The backend must:

1. Accept a safe function expression, center, and order.
2. Parse the function through the existing safe SymPy whitelist.
3. Compute symbolic derivatives where supported by the safe expression parser.
4. Return Taylor polynomial, term list, LaTeX, evaluations, and lecture-aligned steps.
5. Include a remainder note when the lecture-supported form applies.
6. Reject unsupported or unsafe function expressions through the existing error path.

### FR6 - Piecewise Family

P2.4 must implement:

- `cubic_spline` with natural boundary condition first

The backend must:

1. Validate at least two nodes and distinct real x-values.
2. Sort nodes when needed and document ordering in the response.
3. Build natural cubic spline segment coefficients.
4. Return piecewise cubic segment metadata for each interval.
5. Return continuity checks for value, first derivative, and second derivative at interior knots.
6. Generate graph-ready samples from the backend only.
7. Defer clamped or other boundary conditions unless explicitly added later.

### FR7 - Warnings and Errors

Phase 2 must add structured method-level errors and warnings without breaking existing codes.

Required new or extended codes include:

- `unequal_spacing`
- `target_not_recommended_for_method`
- `stirling_requires_centered_nodes`
- `missing_derivative_data`
- `invalid_derivative_order`
- `unsupported_taylor_function`
- `unsupported_boundary_condition`
- `piecewise_method_no_global_polynomial`

The exact final names may change during P2.0 contract work, but they must be documented in `docs/API_CONTRACT.md` before implementation.

### FR8 - Graph Data

1. Graph data must remain backend-generated.
2. React must not compute finite differences, Hermite tables, Taylor terms, spline segments, graph samples, errors, or interpolated values.
3. Spline graph data may use piecewise segment evaluation as the `source_method`.
4. Existing `graph_data` fields must remain valid for v1 consumers.
5. Any piecewise-specific graph metadata must be optional and backward-compatible.

### FR9 - Frontend Integration Guidance

Codex owns the API contract and backend payloads. Claude Opus owns React implementation.

Frontend-required guidance must be documented for:

- expanded method catalog
- method-specific config panels
- derivative input tables
- Taylor config panel
- spline boundary selector
- finite-difference table renderers
- repeated-node divided-difference renderer
- Taylor term renderer
- piecewise segment table and graph rendering from backend arrays
- warning and quality guide updates

### FR10 - Verification

Each implementation milestone must run and document:

- backend tests
- backend lint
- frontend build/lint/test if frontend files changed
- API contract doc updates if request or response shape changed
- frontend handoff doc updates if frontend-relevant behavior changed
- `git status --short`
- milestone commit

Python 3.11+ verification remains a known release-certification caveat until it is actually run.

## Non-Functional Requirements

1. Python 3.11+ remains the intended backend runtime.
2. No unsafe `eval`.
3. No Python `float` parsing before precision handling for user numeric inputs.
4. Exact mode must use SymPy Rational when possible.
5. High-precision mode must use mpmath/SymPy precision deliberately.
6. Pure method modules must not import FastAPI, Pydantic request models, or frontend code.
7. API orchestration must stay in service/routing layers.
8. Documentation must record exact commands run and failed attempts honestly.

## Explicit Deferrals

1. Clamped cubic spline is deferred until natural spline is stable and the user explicitly approves boundary-condition expansion.
2. Complex-valued interpolation is deferred.
3. Adaptive node selection is deferred.
4. Frontend implementation by Codex is deferred unless the user explicitly changes scope.
5. Production/release-complete status is deferred until Python 3.11+ verification is run.
