# Frontend Handoff — Interpolating Polynomial Program

## Ownership Boundary
Claude Opus owns the React frontend. Codex owns the backend, numerical engine, tests, and API contract.

No frontend files were built in this backend implementation pass.

## Backend Status
Implemented v1 endpoints:

```text
GET /health
POST /api/interpolate
POST /api/validate-function
```

The backend source is under `backend/`. The frontend should read `docs/API_CONTRACT.md` as the source of truth for request and response fields.

## What Claude Opus Should Build
- React UI for creating interpolation requests.
- Input mode selector:
  - `points`
  - `x_values_with_function`
  - `function_interval`
- Editable point table for `(x_i, y_i)` string inputs.
- x-values input plus function string input for sampled-function mode.
- interval, node strategy, node count, and custom-node inputs for function-interval mode.
- method selector for Lagrange, Newton, barycentric, and Neville.
- precision settings:
  - exact mode toggle
  - decimal precision input from 8 to 200
- evaluation target input list.
- graph toggle.
- output screens/panels for:
  - nodes and degree
  - expanded/factored/Newton/Lagrange polynomial forms
  - LaTeX polynomial rendering
  - Lagrange basis table
  - Newton divided-difference table
  - barycentric weights table
  - Neville target tables
  - evaluation results
  - warnings
  - educational notes
  - graph using backend `graph_data`

## What Claude Opus Should Not Build
- Do not implement interpolation math in the frontend.
- Do not parse or evaluate user functions as the source of truth.
- Do not recompute barycentric weights in the frontend.
- Do not infer hidden precision behavior.
- Do not render graphs from independently sampled math. Use backend `graph_data`.

## Endpoint Paths To Call
Development base URL:

```text
http://127.0.0.1:8000
```

Endpoints:

```text
GET /health
POST /api/interpolate
POST /api/validate-function
```

## Request Body Examples

### Points Mode

```json
{
  "mode": "points",
  "points": [["2", "4"], ["5", "1"]],
  "methods": ["lagrange", "newton", "barycentric", "neville"],
  "precision": 50,
  "exact": true,
  "evaluation_x": ["3"],
  "graph": false
}
```

### X-Values With Function Mode

```json
{
  "mode": "x_values_with_function",
  "x_values": ["2", "2.75", "4"],
  "function": "1/x",
  "methods": ["lagrange", "newton", "barycentric", "neville"],
  "precision": 50,
  "exact": true,
  "evaluation_x": ["3"],
  "graph": false
}
```

### Function Interval Mode

```json
{
  "mode": "function_interval",
  "function": "sin(x)",
  "interval": ["-1", "1"],
  "node_strategy": "equally_spaced",
  "node_count": 3,
  "methods": ["barycentric"],
  "precision": 50,
  "exact": false,
  "evaluation_x": ["0", "0.5"],
  "graph": true
}
```

## Response Fields To Display
- `status`
- `response_version`
- `metadata.tolerance`
- `input_summary`
- `nodes`
- `degree`
- `polynomial.expanded`
- `polynomial.factored`
- `polynomial.newton_form`
- `polynomial.lagrange_form`
- `polynomial.latex_expanded`
- `polynomial.latex_lagrange`
- `polynomial.latex_newton`
- `methods.lagrange.basis_polynomials`
- `methods.lagrange.summation_form`
- `methods.lagrange.evaluations`
- `methods.lagrange.steps`
- `methods.newton.divided_difference_table`
- `methods.newton.coefficients`
- `methods.newton.evaluations`
- `methods.newton.steps`
- `methods.barycentric.weights`
- `methods.barycentric.evaluations`
- `methods.barycentric.notes`
- `methods.neville.target_results`
- `methods.neville.tables`
- `evaluations`
- `graph_data`
- `warnings`
- `educational_notes`

## Graph Display Requirements
- Only render a graph if `graph_data` is not null.
- Use:
  - `graph_data.x`
  - `graph_data.f_x`
  - `graph_data.P_x`
  - `graph_data.error`
- Treat graph values as strings until passing them to the chart library.
- If values are `null`, render gaps or skip those points.
- Show original nodes as visible points.
- Do not resample the original function or interpolation polynomial in React.

## Error And Warning Display Requirements
- Validation errors are blocking and should be shown near the relevant input field when possible.
- Warnings are non-blocking and should appear near results.
- Do not hide warnings. Numerical stability warnings are academically important.
- Neville without `evaluation_x` returns a method warning `neville_requires_evaluation_x`.

## Claude Opus First Step
Read these files first:

1. `AGENTS.md`
2. `docs/API_CONTRACT.md`
3. `docs/FRONTEND_HANDOFF.md`
4. `docs/HANDOFF.md`

Then build the frontend against the documented backend response shape.
