# Frontend Handoff — Interpolating Polynomial Program

## Ownership Boundary
Claude Opus owns the React frontend. Codex owns the backend, numerical engine, tests, and API contract.

Do not build frontend files in this backend implementation pass.

## What Claude Opus Should Build

- React UI for creating interpolation requests.
- Input mode selector:
  - points
  - x-values with function
  - function interval
- Editable point table for `(x_i, y_i)` input.
- x-values input plus function string input for sampled function mode.
- interval, node strategy, node count, and custom-node inputs for function interval mode.
- method selector for Lagrange, Newton, barycentric, and Neville.
- precision settings:
  - exact mode toggle
  - decimal precision input
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
- Do not parse or evaluate user function strings in the frontend except for light syntax display.
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
  "methods": ["lagrange", "newton", "barycentric"],
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
  "methods": ["lagrange", "newton", "barycentric"],
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
  "node_count": 5,
  "methods": ["lagrange", "newton", "barycentric"],
  "precision": 50,
  "exact": false,
  "evaluation_x": ["0", "0.5"],
  "graph": true
}
```

## Response Fields To Display

- `status`
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
- `methods.lagrange.steps`
- `methods.newton.divided_difference_table`
- `methods.newton.coefficients`
- `methods.newton.steps`
- `methods.barycentric.weights`
- `methods.barycentric.notes`
- `methods.neville.target_results`
- `methods.neville.tables`
- `evaluations`
- `graph_data`
- `warnings`
- `educational_notes`

## Method Table Display Requirements

- Lagrange:
  - Show each basis polynomial `L_i(x)` with node index and corresponding `x_i`.
  - Show steps in order.
- Newton:
  - Show divided-difference table as a triangular table.
  - Show coefficients in order.
  - Show nested Newton form.
- Barycentric:
  - Show weights by node.
  - Show notes about stable evaluation.
- Neville:
  - Show one triangular table per target x-value.
  - Show target result for each requested target.

## Graph Display Requirements

- Only render a graph if `graph_data` is not null.
- Use:
  - `graph_data.x`
  - `graph_data.f_x`
  - `graph_data.P_x`
  - `graph_data.error`
- Treat graph values as strings until passing to the chart library.
- If values are `null`, render gaps or skip those points.
- Show original nodes as visible points.

## Error And Warning Display Requirements

- Validation errors are blocking and should be shown near the relevant input field when possible.
- Warnings are non-blocking and should appear near results.
- Do not hide warnings. Numerical stability warnings are academically important.

## Claude Opus First Step
After the backend is implemented and tests pass, read these files first:

1. `AGENTS.md`
2. `docs/API_CONTRACT.md`
3. `docs/FRONTEND_HANDOFF.md`
4. `docs/HANDOFF.md`

Then build the frontend against the documented backend response shape.

