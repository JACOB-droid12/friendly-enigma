# Requirements Document

## Introduction

The Phase 2 Frontend Workbench extends the existing React (`frontend/`, Vite + TypeScript) Analysis Bench so it can drive every Phase 2 lecture method that the Codex-owned backend already ships: Newton forward/backward differences, Stirling centered differences, Hermite divided difference, Hermite basis form, Taylor / Maclaurin polynomials, and natural cubic splines. It must also render the deferred `osculating` method's `method_not_implemented` response cleanly without simulating it. The frontend remains a pure renderer of the documented backend contract in `docs/API_CONTRACT.md` plus a thin input layer that produces the existing `POST /api/interpolate` request body.

This spec covers only the React workbench. Backend code, API endpoint paths, and request/response shapes are out of scope. The existing Analysis Bench design system (tokens, palette, card style, typography, role-tag voice) defined by the `frontend-analysis-bench-overhaul` and `frontend-design-system-overhaul` specs is preserved as-is; this spec must not introduce a competing visual system.

## Glossary

- **Frontend**: The React application under `frontend/` (Vite + TypeScript). Owned by Claude Opus per `AGENTS.md`.
- **Backend**: The FastAPI service under `backend/`. Owned by Codex. Out of scope for editing.
- **Phase 2 Methods**: The eight method literals introduced by Phase 2: `newton_forward`, `newton_backward`, `stirling`, `hermite_divided_difference`, `hermite`, `osculating`, `taylor`, `cubic_spline`.
- **V1 Methods**: The four already-shipped method literals: `lagrange`, `newton`, `barycentric`, `neville`.
- **V1+ Flows**: The frontend behaviors already shipped on top of V1, including the lecture Examples Panel, Guided Explanation, Result Quality / Warnings Guide, function-backed examples, and the V1 method renderers in `MethodDetails`.
- **Equal-Spacing Family**: `newton_forward`, `newton_backward`, `stirling`.
- **Derivative-Data Family**: `hermite_divided_difference`, `hermite`, `osculating`.
- **Function-Derivative Family**: `taylor`.
- **Piecewise Family**: `cubic_spline`.
- **Method Catalog**: The frontend's static list of method metadata used by `MethodSelector` and `MethodDetails` to label, group, and route methods.
- **Method Family Label**: A short tag (Construction, Stable Evaluator, Target-Specific, Equal Spacing, Derivative Data, Function Derivative, Piecewise) rendered using the existing `font-label` design-system voice.
- **Deferred Method**: A method literal accepted by the backend schema that returns a method-level `method_not_implemented` error. In Phase 2 this applies to `osculating`.
- **Method Not Implemented Response**: A backend response where `methods.<name>.error.code === "method_not_implemented"` and the top-level `status` is typically `"partial"`.
- **Adaptive Input Panel**: A method-aware input section in `InputPanel` that reveals derivative tables, Taylor config, or spline config only when the relevant Phase 2 method is selected.
- **Derivative Input Table**: A frontend control that lets the user enter `(x_i, f(x_i), f'(x_i))` rows as strings for the Derivative-Data Family.
- **Result Renderer**: A read-only React component that displays a backend method payload exactly as returned. Result renderers must not compute interpolation, finite differences, Hermite tables, Taylor terms, spline coefficients, graph samples, error metrics, or warning severity.
- **API Contract**: The backend contract documented in `docs/API_CONTRACT.md`.
- **Analysis Bench Design System**: The existing tokens, palette, card style, three-voice typography (`font-label` / body / `font-numeric`), and role-tag conventions established by `frontend-analysis-bench-overhaul` and `frontend-design-system-overhaul`.
- **Browser QA Matrix**: A documented set of manual browser checks for Phase 2 flows plus regression checks for V1 / V1+ flows and a 320px-width overflow check.

## Requirements

### Requirement 1: Backend Boundary Preservation

**User Story:** As a backend owner (Codex), I want the Phase 2 frontend work to leave my backend untouched, so that backend ownership and the documented API contract stay intact.

#### Acceptance Criteria

1. THE Frontend SHALL NOT create, modify, or delete any file under the `backend/` directory.
2. THE Frontend SHALL call only `GET /health`, `POST /api/interpolate`, and `POST /api/validate-function` and SHALL NOT introduce any other endpoint paths.
3. THE Frontend SHALL NOT change the request shape or response shape documented in `docs/API_CONTRACT.md`; the Frontend MAY only add TypeScript types that match documented backend fields.
4. WHEN the Frontend issues a compute request, THE Frontend SHALL send all numeric values inside `points`, `x_values`, `interval`, `evaluation_x`, `derivatives[].x`, `derivatives[].value`, and `method_options.taylor.center` as strings without applying `parseFloat` or `Number()` before sending.
5. WHERE backend warnings are present in a response, THE Frontend SHALL render them using the existing `getWarningMeta` mapping in `frontend/src/lib/warnings.ts` and SHALL NOT recompute or override warning severity from numerical values.

### Requirement 2: Backend Contract Type Coverage

**User Story:** As a frontend developer, I want TypeScript types that match every Phase 2 backend payload, so that renderers can read exact fields without casting through `unknown`.

#### Acceptance Criteria

1. THE Frontend SHALL extend `frontend/src/lib/api-types.ts` to include the Phase 2 method literals `newton_forward`, `newton_backward`, `stirling`, `hermite_divided_difference`, `hermite`, `osculating`, `taylor`, and `cubic_spline` in the `MethodName` union.
2. THE Frontend SHALL extend `InterpolateRequest` with optional `method_options` and `derivatives` fields whose shapes match `docs/API_CONTRACT.md` Phase 2 sections.
3. THE Frontend SHALL define response payload types for `NewtonForwardResult`, `NewtonBackwardResult`, `StirlingResult`, `HermiteDividedDifferenceResult`, `HermiteResult`, `OsculatingResult`, `TaylorResult`, and `CubicSplineResult` that mirror the documented backend fields including `forward_difference_table`, `backward_difference_table`, `centered_difference_table`, `spacing_h`, `anchor_index`, `center_index`, `center_x`, `s`, `terms`, `target_guidance`, `repeated_nodes`, `divided_difference_table`, `coefficients`, `nested_form`, `expanded`, `latex_expanded`, `latex_hermite`, `basis_form`, `center`, `order`, `series_name`, `taylor_form`, `latex_taylor`, `remainder_note`, `boundary_condition`, `ordered_nodes`, `second_derivatives`, `segments`, and `continuity_checks`.
4. THE Frontend SHALL extend `PolynomialData` with optional `hermite_form`, `taylor_form`, `latex_hermite`, and `latex_taylor` fields and SHALL extend `expanded_omitted_reason` documentation to include `piecewise_method_no_global_polynomial`.
5. THE Frontend SHALL extend `InterpolateResponse.methods` so the eight Phase 2 method keys are optional, additive, and non-breaking for V1 consumers.
6. THE Frontend SHALL NOT introduce TypeScript fields that do not appear in `docs/API_CONTRACT.md`.

### Requirement 3: API Client Stability

**User Story:** As a frontend developer, I want a single compute request entry point, so that the Phase 2 expansion does not fork network behavior.

#### Acceptance Criteria

1. THE Frontend SHALL keep `frontend/src/lib/api-client.ts` using a single `POST /api/interpolate` call shape.
2. WHEN a Phase 2 method requires `method_options`, THE Frontend SHALL include the `method_options` object only on the request body and SHALL NOT introduce a new function or path.
3. WHEN a Derivative-Data Family method is selected, THE Frontend SHALL include the `derivatives` array on the request body with string-valued `x` and `value` fields and integer `order`.
4. IF a Phase 2 method is not selected, THEN THE Frontend SHALL omit its corresponding `method_options[name]` block from the request body.
5. THE Frontend SHALL NOT add per-method endpoints, GraphQL endpoints, or alternate transport mechanisms.

### Requirement 4: Method Catalog Additions

**User Story:** As a student or instructor, I want every Phase 2 method visible in the method catalog, so that I can pick the lecture method that matches my workflow.

#### Acceptance Criteria

1. THE Method Selector SHALL list all V1 methods and all Phase 2 methods grouped by family (Construction, Stable Evaluator, Target-Specific, Equal Spacing, Derivative Data, Function Derivative, Piecewise).
2. THE Method Selector SHALL render the family label and a short classroom-role description for each Phase 2 method using the existing `font-label` and body voices, with no new typography rules.
3. THE Method Selector SHALL render an eligibility hint next to each Equal-Spacing Family method indicating that the method requires equally spaced nodes.
4. WHERE a method is the deferred `osculating` method, THE Method Selector SHALL mark it with a deferred-state tag explaining that the backend currently returns a method-level error.
5. WHEN the user selects an Equal-Spacing Family method while the entered nodes are not equally spaced, THE Method Selector SHALL surface a frontend-only eligibility hint that disables the Compute button for that method context, AND THE Method Selector SHALL NOT short-circuit a backend call when the user keeps an eligible non-equal-spacing method selected.
6. THE Method Selector SHALL NOT change the Analysis Bench role-tag voice, palette, card style, or typography.

### Requirement 5: Adaptive Input Panel

**User Story:** As a user, I want method-specific inputs to appear only when relevant, so that the input panel does not become cluttered with options I do not need.

#### Acceptance Criteria

1. THE Input Panel SHALL keep the existing X + f(x) point input as the default for all V1 methods and the Equal-Spacing Family.
2. WHEN the user selects an Equal-Spacing Family method, THE Input Panel SHALL display a non-blocking eligibility hint summarizing whether the entered x-values appear equally spaced based on the user-entered values only.
3. WHEN the user selects a Derivative-Data Family method, THE Input Panel SHALL display a Derivative Input Table accepting `(x_i, f(x_i), f'(x_i))` rows as strings.
4. THE Derivative Input Table SHALL keep `x` and `value` as strings and SHALL keep `order` as an integer fixed at 1 for `hermite_divided_difference` and `hermite`.
5. WHEN the user selects `taylor`, THE Input Panel SHALL display a Taylor configuration block with a function expression input bound to the existing `function` field, a `center` string input, and an integer `order` input constrained to 0..20.
6. WHEN the user selects `cubic_spline`, THE Input Panel SHALL display a spline configuration block with a `boundary_condition` selector that exposes only `natural` as enabled and shows other boundary conditions as disabled placeholders for future support.
7. WHEN no Phase 2 method is selected, THE Input Panel SHALL hide all Phase 2 adaptive blocks and behave identically to the existing V1+ Input Panel.

### Requirement 6: Equal-Spacing Renderers

**User Story:** As a student, I want forward, backward, and Stirling renderers, so that I can see the finite-difference tables and formulas the lecture covers.

#### Acceptance Criteria

1. WHEN the response includes `methods.newton_forward`, THE MethodDetails SHALL render the `forward_difference_table`, `spacing_h`, `anchor_index`, `s`, `terms`, `target_guidance`, `evaluations`, `steps`, and `warnings` exactly as returned.
2. WHEN the response includes `methods.newton_backward`, THE MethodDetails SHALL render the `backward_difference_table`, `spacing_h`, `anchor_index`, `s`, `terms`, `target_guidance`, `evaluations`, `steps`, and `warnings` exactly as returned.
3. WHEN the response includes `methods.stirling`, THE MethodDetails SHALL render the `centered_difference_table`, `spacing_h`, `center_index`, `center_x`, `s`, `terms`, `target_guidance`, `evaluations`, `steps`, and `warnings` exactly as returned.
4. WHEN `target_guidance.recommended` differs from the selected method, THE MethodDetails SHALL surface that recommendation as advisory copy and SHALL NOT auto-switch the method on the frontend.
5. IF a method-level error such as `unequal_spacing` or `stirling_requires_centered_nodes` is returned, THEN THE MethodDetails SHALL render the message and code via the existing `ErrorNotice` component without hiding sibling method results.
6. THE MethodDetails SHALL NOT compute or recompute forward, backward, or centered differences in the client.

### Requirement 7: Hermite Renderers

**User Story:** As a student, I want a repeated-node divided-difference renderer and a Hermite basis renderer, so that I can review derivative-matched interpolation output.

#### Acceptance Criteria

1. WHEN the response includes `methods.hermite_divided_difference`, THE MethodDetails SHALL render `repeated_nodes`, `divided_difference_table`, `coefficients`, `nested_form`, `expanded`, `latex_expanded`, `latex_hermite`, `evaluations`, `steps`, `warnings`, and `error` exactly as returned.
2. WHEN the response includes `methods.hermite`, THE MethodDetails SHALL render the same repeated-node fields as `hermite_divided_difference` plus the `basis_form` block when `basis_form.status === "included"`.
3. IF `basis_form.status === "omitted"`, THEN THE MethodDetails SHALL render the omission state using the backend reason and the related `expanded_polynomial_omitted` warning, AND THE MethodDetails SHALL NOT reconstruct the basis form on the client.
4. IF the response returns a method-level error such as `missing_derivative_data` or `invalid_derivative_order`, THEN THE MethodDetails SHALL render the message and code via `ErrorNotice` and SHALL NOT auto-fill or estimate derivative values.
5. THE MethodDetails SHALL NOT compute repeated nodes, divided differences, or Hermite basis terms in the client.

### Requirement 8: Taylor Renderer

**User Story:** As a student, I want a Taylor / Maclaurin renderer, so that I can read the term list, polynomial form, evaluations, and remainder note.

#### Acceptance Criteria

1. WHEN the response includes `methods.taylor`, THE MethodDetails SHALL render `center`, `order`, `series_name`, `terms`, `taylor_form`, `expanded`, `latex_expanded`, `latex_taylor`, `evaluations`, `remainder_note`, `steps`, `warnings`, and `error` exactly as returned.
2. THE MethodDetails SHALL render Taylor `terms` as derivative-term rows showing `order`, `derivative`, `derivative_at_center`, `coefficient`, `term`, and `latex_term` from the backend response.
3. WHEN `series_name === "Maclaurin"`, THE MethodDetails SHALL surface the Maclaurin label without altering the polynomial fields.
4. IF the backend returns a method-level error such as `unsupported_taylor_function`, THEN THE MethodDetails SHALL render the message and code via `ErrorNotice` and SHALL NOT compute Taylor derivatives, terms, polynomial values, or remainder notes locally.
5. THE MethodDetails SHALL NOT call SymPy, Math.js, or any client-side symbolic engine for Taylor computation.

### Requirement 9: Cubic Spline Renderer

**User Story:** As a student, I want a piecewise cubic spline renderer, so that I can read each segment, the continuity checks, and the spline-based graph.

#### Acceptance Criteria

1. WHEN the response includes `methods.cubic_spline`, THE MethodDetails SHALL render `boundary_condition`, `ordered_nodes`, `second_derivatives`, `segments`, `continuity_checks`, `evaluations`, `steps`, `warnings`, and `error` exactly as returned.
2. THE MethodDetails SHALL render `segments` as piecewise interval rows showing the interval bounds, local coefficients `a`, `b`, `c`, `d`, `local_form`, `expanded`, and `latex` from the backend response.
3. WHEN `polynomial.expanded_omitted_reason === "piecewise_method_no_global_polynomial"`, THE Results Panel SHALL display a piecewise notice indicating that no single global polynomial exists for this response.
4. WHEN `graph_data.source_method === "cubic_spline"`, THE GraphCard SHALL render the backend `graph_data.x`, `graph_data.f_x`, `graph_data.P_x`, and `graph_data.error` arrays exactly as returned and SHALL NOT resample or interpolate the spline on the client.
5. IF the backend returns a method-level error such as `unsupported_boundary_condition`, THEN THE MethodDetails SHALL render the message and code via `ErrorNotice` and SHALL NOT generate spline coefficients or continuity checks locally.
6. THE MethodDetails SHALL NOT compute spline coefficients, segment polynomials, continuity checks, or piecewise sample points in the client.

### Requirement 10: Deferred Method Rendering

**User Story:** As a user, I want a clean state for the deferred `osculating` method, so that I can see the backend-defined deferred status without confusion.

#### Acceptance Criteria

1. WHERE the catalog includes `osculating`, THE Method Selector SHALL accept selection of `osculating`.
2. WHEN the response includes `methods.osculating` with `error.code === "method_not_implemented"`, THE MethodDetails SHALL render a deferred-method panel showing the backend message and code.
3. THE MethodDetails SHALL NOT simulate, approximate, or hide the `osculating` deferred state.
4. WHEN the top-level response status is `"partial"` due solely to the deferred `osculating` state, THE Results Panel SHALL keep all sibling method renderers visible and operational.

### Requirement 11: Cross-Cutting Renderer Updates

**User Story:** As a user, I want the cross-cutting tabs (Guide, Result Quality, Method Comparison) to reflect Phase 2 methods, so that the workbench remains coherent.

#### Acceptance Criteria

1. THE GuidedExplanation SHALL include lecture-aware entries for each Phase 2 method covering when it is appropriate, what backend artifacts it returns, and why deferred methods are deferred.
2. THE ResultQualityGuide SHALL include guidance entries for Phase 2 warning and error codes including `unequal_spacing`, `stirling_requires_centered_nodes`, `target_not_recommended_for_method`, `missing_derivative_data`, `invalid_derivative_order`, `expanded_polynomial_omitted` (with `details.artifact === "hermite_basis_form"`), `unsupported_taylor_function`, `unsupported_boundary_condition`, `piecewise_method_no_global_polynomial`, `nodes_reordered`, and `method_not_implemented`.
3. THE Method Comparison Summary SHALL be updated so Phase 2 methods are grouped by family and Barycentric remains tagged as Stable Evaluator and graph support, not as the primary classroom construction method.
4. THE Examples Panel SHALL gain at least one lecture example per Phase 2 method that the backend implements (`newton_forward`, `newton_backward`, `stirling`, `hermite_divided_difference`, `hermite`, `taylor`, `cubic_spline`) using lecture-aligned data sourced from `docs/API_CONTRACT.md` and `Lecture/`.
5. WHERE an Examples Panel entry targets `osculating`, THE Examples Panel SHALL label that entry as deferred and SHALL render the backend `method_not_implemented` response when computed.
6. THE GuidedExplanation, ResultQualityGuide, Method Comparison Summary, and Examples Panel SHALL NOT compute interpolation, derivatives, finite differences, Taylor terms, spline segments, or warning severity locally.

### Requirement 12: V1 / V1+ Regression Preservation

**User Story:** As an existing user, I want every V1 and V1+ flow to keep working, so that the Phase 2 expansion does not regress proven behavior.

#### Acceptance Criteria

1. THE Frontend SHALL keep the existing V1 method renderers for `lagrange`, `newton`, `barycentric`, and `neville` working with no behavior changes other than catalog grouping copy.
2. THE Frontend SHALL keep the existing lecture Examples Panel entries (Linear Lagrange, Second-Degree Lagrange via `1/x`, Neville Table, Newton Divided Difference) loading identical form state.
3. THE Frontend SHALL keep the existing Guided Explanation V1 method blocks rendering when their corresponding methods appear in `methods.<v1>`.
4. THE Frontend SHALL keep the existing Result Quality / Warnings Guide rendering for V1 warnings (`high_degree_warning`, `runge_warning`, `close_x_warning`, `extrapolation_warning`, `method_disagreement_warning`, `expanded_polynomial_omitted`, `neville_requires_evaluation_x`, `graph_sampling_domain_error`, `method_failed`, `nodes_reordered`).
5. THE Frontend SHALL keep the existing GraphCard rendering for `graph_data.source_method === "barycentric"` with no client-side resampling.

### Requirement 13: Analysis Bench Design System Preservation

**User Story:** As a designer, I want the existing Analysis Bench design system preserved, so that Phase 2 does not introduce a competing visual language.

#### Acceptance Criteria

1. THE Frontend SHALL keep the existing OKLCH tokens, palette, card style, three-voice typography (`font-label` / body / `font-numeric`), and role-tag voice defined by `frontend-analysis-bench-overhaul` and `frontend-design-system-overhaul`.
2. THE Frontend SHALL NOT introduce gradients, frosted glass, glassmorphism, side-stripe borders, nested cards, hero-metric layouts, gradient text, bounce/elastic motion, or generic dashboard chrome.
3. THE Frontend SHALL render new family labels and role tags using the existing `font-label` utility and SHALL NOT introduce new typographic primitives.
4. THE Frontend SHALL keep the Compute button, Method Selector cards, and Results Panel surface rules flat-at-rest as defined by the existing design system.
5. THE Frontend SHALL keep IBM Plex Sans Variable as the body/UI font and the existing numeric voice as the numeric font.

### Requirement 14: Mobile Layout Integrity

**User Story:** As a mobile user, I want the workbench to fit a 320px viewport, so that nothing overflows horizontally.

#### Acceptance Criteria

1. WHEN the viewport width is 320px, THE Frontend SHALL NOT cause `document.documentElement.scrollWidth` to exceed `document.documentElement.clientWidth` on the main page.
2. THE Phase 2 adaptive input blocks SHALL stack vertically on viewports narrower than the existing `md` breakpoint.
3. THE Phase 2 result tables (forward/backward/centered difference, repeated-node divided-difference, Taylor terms, spline segments) SHALL be wrapped in a horizontally scrollable container so individual long values do not push the page wider than the viewport.

### Requirement 15: Frontend Test Fixtures and Tests

**User Story:** As a frontend developer, I want fixtures and unit tests for Phase 2 renderers, so that contract drift is caught locally.

#### Acceptance Criteria

1. THE Frontend SHALL extend `frontend/src/test/interpolate-response.fixtures.ts` (or add a sibling file in the same `frontend/src/test/` directory) with one golden fixture per Phase 2 method response, including a `method_not_implemented` fixture for `osculating`, a `basis_form.status === "omitted"` fixture for `hermite`, and a `graph_data.source_method === "cubic_spline"` fixture for `cubic_spline`.
2. THE Frontend SHALL add Vitest unit tests covering each Phase 2 result renderer's happy path, deferred-method rendering, method-level error rendering, and warning chip mapping.
3. THE Frontend SHALL add a Vitest unit test verifying that the `cubic_spline` GraphCard pass-through reads `graph_data` arrays without mutation.
4. THE Frontend SHALL NOT add property-based tests; the rationale is recorded in this spec because the workbench layer is contract pass-through and UI rendering, not a pure-function domain suitable for property-based testing.
5. WHEN the user runs `npm test` from `frontend/`, THE Frontend SHALL run all existing tests plus the new Phase 2 tests with no regressions.

### Requirement 16: Verification Commands

**User Story:** As a reviewer, I want a fixed set of verification commands, so that Phase 2 frontend changes are validated consistently.

#### Acceptance Criteria

1. THE Frontend SHALL pass `npm run build` from `frontend/` after Phase 2 changes.
2. THE Frontend SHALL pass `npm run lint` from `frontend/` after Phase 2 changes.
3. THE Frontend SHALL pass `npm test` from `frontend/` after Phase 2 changes.
4. THE Frontend SHALL document the Browser QA Matrix results in `docs/HANDOFF.md` and `docs/FRONTEND_HANDOFF.md` after Phase 2 changes.
5. THE Frontend SHALL NOT claim verification success unless the commands were actually executed and their results recorded.

### Requirement 17: Browser QA Matrix

**User Story:** As a reviewer, I want browser QA covering each Phase 2 family and the V1 / V1+ regressions, so that real network and rendering paths are exercised.

#### Acceptance Criteria

1. THE Browser QA Matrix SHALL include an Equal-Spacing happy-path scenario covering `newton_forward`, `newton_backward`, and `stirling` against the lecture nodes documented in `docs/API_CONTRACT.md`.
2. THE Browser QA Matrix SHALL include an Equal-Spacing ineligible scenario producing `unequal_spacing` and (where applicable) `stirling_requires_centered_nodes` method-level errors.
3. THE Browser QA Matrix SHALL include a Hermite happy-path scenario using the Bessel-style nodes `1.3`, `1.6`, `1.9` with first derivatives and evaluation `x = 1.5`, plus a Hermite missing-derivative error scenario.
4. THE Browser QA Matrix SHALL include a Taylor scenario for `cos(x)` with `center = 0`, `order = 3`, and evaluation `x = 1/2`, plus a Taylor unsupported-function or unsupported-option error scenario.
5. THE Browser QA Matrix SHALL include a natural cubic spline scenario for the lecture points `(1, 2)`, `(2, 3)`, `(3, 5)` with `evaluation_x = "5/2"` and graph output enabled, asserting that the GraphCard renders backend `graph_data` with `source_method === "cubic_spline"`.
6. THE Browser QA Matrix SHALL include the deferred `osculating` scenario asserting that the deferred-method panel renders cleanly without breaking sibling renderers.
7. THE Browser QA Matrix SHALL include V1 / V1+ regression checks covering Linear Lagrange, the `1/x` function-backed example, the Neville Table example, and the Newton Divided Difference example.
8. THE Browser QA Matrix SHALL include a 320px viewport check confirming no page-level horizontal overflow.
9. THE Browser QA Matrix SHALL be documented with screenshots stored under `.kiro/specs/phase-2-frontend-workbench/screenshots/` and referenced from `docs/FRONTEND_HANDOFF.md`.

### Requirement 18: Documentation Discipline

**User Story:** As a maintainer, I want Phase 2 frontend documentation kept current, so that handoff between agents stays coherent.

#### Acceptance Criteria

1. WHEN Phase 2 frontend behavior changes, THE Frontend SHALL update `docs/FRONTEND_HANDOFF.md` to reflect the implemented React renderers and any open caveats.
2. WHEN Phase 2 frontend behavior changes, THE Frontend SHALL update `docs/HANDOFF.md` with the exact files changed, commands run, and verification results.
3. WHEN Phase 2 frontend milestones complete, THE Frontend SHALL update `docs/PLAN.md` with milestone status and remaining work.
4. THE Frontend SHALL NOT modify `docs/API_CONTRACT.md`; that file is owned by Codex.
5. THE Frontend SHALL record verification command results honestly and SHALL NOT claim a command passed unless it was actually executed.
