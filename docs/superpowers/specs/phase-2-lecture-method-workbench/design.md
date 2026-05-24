# Phase 2 Lecture Method Workbench Design

## Design Goal

Phase 2 turns the v1 interpolation backend into a lecture-method workbench. The backend remains the numerical source of truth. The frontend receives richer method artifacts and renders them without recomputing the math.

The expansion uses Approach B: plan the complete lecture-supported method set now, then implement it in ordered milestones.

## Current Architecture Baseline

The current backend already follows the intended boundary:

```text
FastAPI route
-> Pydantic schema
-> normalization
-> shared validation and warnings
-> pure method builders
-> service response assembly
-> optional backend graph arrays
```

Existing pure method modules:

```text
backend/app/core/methods/lagrange.py
backend/app/core/methods/newton.py
backend/app/core/methods/barycentric.py
backend/app/core/methods/neville.py
```

Existing service orchestration:

```text
backend/app/core/service.py
backend/app/core/normalization.py
backend/app/core/validation.py
backend/app/core/precision.py
backend/app/core/parser.py
backend/app/core/graph_data.py
```

Phase 2 should extend this structure, not replace it.

## Public API Strategy

Keep a single public compute endpoint:

```text
POST /api/interpolate
```

Add optional request blocks, likely:

```json
{
  "method_options": {
    "taylor": {
      "center": "0",
      "order": 3
    },
    "spline": {
      "boundary_condition": "natural"
    }
  },
  "derivatives": [
    {
      "x": "1.3",
      "order": 1,
      "value": "-0.5220232"
    }
  ]
}
```

P2.0 must finalize exact names. The principle is stable: optional fields only, no per-method endpoint, and numeric values remain strings.

## Response Strategy

Keep the existing top-level response fields:

```text
status
response_version
metadata
input_summary
nodes
degree
polynomial
methods
evaluations
graph_data
warnings
educational_notes
```

New Phase 2 methods live under `methods.<method_name>` with the same outer shape:

```json
{
  "status": "ok",
  "warnings": [],
  "error": null
}
```

Each method adds its own payload fields. Examples:

```text
methods.newton_forward.forward_difference_table
methods.newton_forward.s
methods.newton_forward.anchor_index
methods.newton_forward.target_guidance

methods.hermite_divided_difference.repeated_nodes
methods.hermite_divided_difference.divided_difference_table
methods.hermite_divided_difference.coefficients

methods.taylor.center
methods.taylor.order
methods.taylor.terms
methods.taylor.remainder_note

methods.cubic_spline.boundary_condition
methods.cubic_spline.segments
methods.cubic_spline.continuity_checks
```

## Internal Module Design

Add shared helpers before method implementation:

```text
backend/app/core/methods/finite_differences.py
backend/app/core/methods/repeated_nodes.py
backend/app/core/methods/piecewise.py
backend/app/core/methods/metadata.py
```

### `finite_differences.py`

Responsibilities:

- determine equal spacing
- return canonical spacing `h`
- build forward-difference tables
- build backward-difference tables or views
- compute forward/backward falling/rising products
- choose target-position guidance without auto-selecting methods

### `repeated_nodes.py`

Responsibilities:

- expand derivative data into repeated nodes
- build Hermite divided-difference tables
- validate derivative coverage
- support later osculating generalized derivative orders

### `piecewise.py`

Responsibilities:

- represent piecewise intervals
- evaluate piecewise polynomials for backend graph samples
- format segment coefficients
- produce continuity checks

### `metadata.py`

Responsibilities:

- centralize method names, family labels, lecture status, and frontend display hints
- prevent frontend from hard-coding unsupported backend assumptions

## Method Designs

### Equal-Spacing Family

`newton_forward` uses the first node as the default anchor unless method options later specify a permitted anchor. It requires equally spaced nodes and returns forward differences, `s = (x - x_0) / h`, formula terms, evaluations, LaTeX, and lecture steps.

`newton_backward` uses the last node as the default anchor. It requires equally spaced nodes and returns backward differences, `s = (x - x_n) / h`, formula terms, evaluations, LaTeX, and lecture steps.

`stirling` uses a center node near the target. It requires equally spaced nodes and a target near the center. For a first implementation, P2.1 should support the lecture-shaped odd node count case cleanly. Even node counts or ambiguous centers should return a method-level error or warning until the contract explicitly supports them.

### Derivative-Data Family

`hermite_divided_difference` is the first derivative-data implementation. It accepts first derivative values at nodes, duplicates each node, inserts derivative values into the repeated-node divided-difference table, and returns Newton/Hermite polynomial artifacts.

`hermite` adds the basis-form presentation when the symbolic output is clean and low-degree. If the basis form becomes too large, return a structured omission warning while still returning the divided-difference construction.

`osculating` generalizes derivative matching by node and derivative order. It should be implemented only after repeated-node helpers have coverage for first derivative Hermite.

### Taylor Family

`taylor` is function-based, not table-based. It requires `function`, `center`, and `order`. It uses the existing safe parser and SymPy differentiation. It returns derivative values at the center, terms, polynomial forms, LaTeX, evaluations, and a lecture-style remainder note.

### Piecewise Family

`cubic_spline` first supports natural boundary conditions only. It returns each segment with interval bounds and coefficients. It also returns continuity checks at interior nodes and backend graph samples. Top-level `polynomial.expanded` should not pretend there is a single global polynomial; use a clear omission reason such as `piecewise_method_no_global_polynomial`.

## Validation Design

Validation remains layered:

```text
schema field validation
-> normalization validation
-> method eligibility validation
-> method-local computation validation
```

Hard request errors still stop the request. Method-specific ineligibility after normalization becomes a method-level error so other selected methods can still succeed.

Examples:

- Duplicate x-values remain a hard request error.
- Unsafe function remains a hard request error for function-based modes.
- `newton_forward` selected for unequal nodes becomes a method-level error.
- `taylor` selected without function or center becomes a method-level error unless the request shape is invalid enough to be a schema error.
- `cubic_spline` selected with unsupported boundary condition becomes a method-level error.

## Frontend Contract Design

Frontend work is not implemented by Codex in this repository unless the user changes scope. The docs must tell Claude Opus exactly how to consume the backend:

- render method catalog from backend-known method names and metadata
- add config panels only for methods that need them
- send derivative values as strings
- render backend finite-difference tables exactly as returned
- render Hermite repeated-node tables exactly as returned
- render Taylor terms exactly as returned
- render spline segments and graph arrays exactly as returned
- do not recompute numerical values

## Testing Design

Backend tests should be layered:

1. Shared helper tests for finite differences, repeated nodes, and piecewise evaluation.
2. Method unit tests for each new method.
3. API tests for request and response shape.
4. Lecture regression tests for examples present in the lecture text.
5. Backward compatibility tests proving v1 methods still work.

Frontend tests are required only when frontend files change. If Codex only updates backend/docs, frontend tests are not required for that milestone but must remain part of final Phase 2 release-candidate verification.

## Milestone Design

### P2.0 - Contract and Architecture Prep

Finalize method literals, optional request blocks, response payload shapes, warning/error codes, helper modules, and docs. Add no new math method behavior unless scaffolding demands it.

### P2.1 - Equal-Spacing Family

Implement finite-difference helpers and the `newton_forward`, `newton_backward`, and `stirling` methods.

### P2.2 - Derivative-Data Family

Implement derivative input validation, repeated-node divided differences, Hermite divided differences, Hermite basis output when safe, and then osculating.

### P2.3 - Taylor Family

Implement Taylor polynomial generation with safe symbolic derivatives and term output.

### P2.4 - Piecewise Family

Implement natural cubic spline with piecewise segment coefficients, continuity checks, and backend graph samples.

### P2.5 - Release Candidate

Complete lecture examples, guide docs, warning docs, method comparison, frontend smoke/visual QA, full backend/frontend verification, and final audit.

## Risk Controls

1. Do not merge all methods in one pass.
2. Put helper modules under test before method wiring.
3. Prefer method-level errors over whole-response failure for method ineligibility.
4. Do not mutate v1 response fields unless the API contract is explicitly updated.
5. Keep Barycentric as stable evaluator and graph support.
6. Keep Python 3.11+ verification caveat visible until verified.
