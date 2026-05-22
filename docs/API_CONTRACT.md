# API Contract — Interpolating Polynomial Program Backend

## Status
This is the planned backend contract. Implementation has not started yet. Update this file immediately if endpoint paths, request JSON, response JSON, validation errors, warning behavior, or frontend consumption notes change.

## Base URL
Development default:

```text
http://127.0.0.1:8000
```

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Basic service health check. |
| `POST` | `/api/interpolate` | Build and evaluate interpolation results. |
| `POST` | `/api/validate-function` | Validate a function string against the safe parser whitelist without computing interpolation. |

## `GET /health`

### Success Response

```json
{
  "status": "ok",
  "service": "interpolation-backend",
  "version": "0.1.0"
}
```

## `POST /api/interpolate`

### Shared Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `mode` | string | Yes | One of `points`, `x_values_with_function`, `function_interval`. |
| `methods` | string array | No | Any of `lagrange`, `newton`, `barycentric`, `neville`. Defaults to `["lagrange", "newton", "barycentric"]`. |
| `precision` | integer | No | Decimal precision for high-precision evaluation. Defaults to `50`. |
| `exact` | boolean | No | When true, use SymPy Rational conversion where possible. Defaults to `true` for points and x-values-with-function; defaults to `false` for function-interval. |
| `evaluation_x` | string array | No | x-values where `P(x)` should be evaluated. |
| `graph` | boolean | No | Whether to return graph arrays. Defaults to `false`. |

All numeric input values must be strings. The backend must not silently parse them as Python float before precision handling.

### Mode A: Points

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

Validation:

- `points` must contain at least two `[x, y]` pairs.
- All `x` values must be distinct.
- Values must be real numeric strings.

### Mode B: X-Values With Function

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

Validation:

- `x_values` must contain at least two values.
- All `x_values` must be distinct.
- `function` must pass the safe parser.

Lecture alignment:

- The lecture PDFs include this example for `f(x)=1/x` with nodes `2`, `2.75`, and `4`, approximating `f(3)` as about `0.32955`.

### Mode C: Function Interval

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

Validation:

- `interval` must be a two-item string array `[a, b]` with `a < b`.
- `node_count` must be at least 2.
- `node_strategy` must be one of `equally_spaced`, `chebyshev_nodes`, or `custom_nodes`.
- For `custom_nodes`, provide `x_values`; values must lie in or near the interval as documented by the response.

### Safe Function Parser

Allowed symbol:

- `x`

Allowed functions/constants:

- `sin`
- `cos`
- `tan`
- `exp`
- `log`
- `sqrt`
- `abs`
- `asin`
- `acos`
- `atan`
- `sinh`
- `cosh`
- `tanh`
- `pi`
- `E`

Rejected examples:

- `__import__("os").system("dir")`
- `open("file")`
- `lambda x: x`
- `y + 1`
- `unknown_func(x)`

## Success Response Schema

```json
{
  "status": "ok",
  "input_summary": {
    "mode": "points",
    "method_count": 3,
    "node_count": 2,
    "precision": 50,
    "exact": true,
    "function": null,
    "node_strategy": null,
    "sorted_nodes": false
  },
  "nodes": [
    {"x": "2", "y": "4"},
    {"x": "5", "y": "1"}
  ],
  "degree": 1,
  "polynomial": {
    "expanded": "-x + 6",
    "factored": "6 - x",
    "newton_form": "4 - (x - 2)",
    "lagrange_form": "4*(x - 5)/(2 - 5) + 1*(x - 2)/(5 - 2)",
    "latex_expanded": "- x + 6",
    "latex_lagrange": "",
    "latex_newton": ""
  },
  "methods": {
    "lagrange": {
      "basis_polynomials": [
        {
          "index": 0,
          "x_i": "2",
          "basis": "(x - 5)/(2 - 5)",
          "expanded": "5/3 - x/3",
          "latex": ""
        }
      ],
      "steps": []
    },
    "newton": {
      "divided_difference_table": [],
      "coefficients": [],
      "steps": []
    },
    "barycentric": {
      "weights": [],
      "notes": []
    },
    "neville": {
      "target_results": [],
      "tables": []
    }
  },
  "evaluations": [
    {
      "x": "3",
      "P_x": "3",
      "f_x": null,
      "absolute_error": null
    }
  ],
  "graph_data": null,
  "warnings": [],
  "educational_notes": []
}
```

## Error Response Schema

HTTP status codes:

- `400`: invalid request values or validation failure.
- `422`: malformed JSON or schema failure.
- `500`: unexpected backend error.

Planned error body:

```json
{
  "status": "error",
  "error": {
    "code": "duplicate_x_values",
    "message": "x-values must be distinct.",
    "details": {
      "duplicates": ["2"]
    }
  }
}
```

Planned validation error codes:

- `invalid_mode`
- `insufficient_points`
- `duplicate_x_values`
- `invalid_numeric_string`
- `invalid_precision`
- `invalid_function`
- `unsafe_function`
- `unknown_function_name`
- `unknown_symbol`
- `invalid_interval`
- `invalid_node_count`
- `invalid_node_strategy`
- `unsupported_method`

## Warning Schema

Warnings are non-blocking and appear inside successful responses:

```json
{
  "code": "high_degree",
  "message": "Degree 10 interpolation may be numerically unstable.",
  "details": {
    "degree": 10
  }
}
```

Planned warning codes:

- `high_degree`
- `equally_spaced_oscillation_risk`
- `close_x_values_conditioning`
- `nodes_reordered`
- `barycentric_double_precision_graph`
- `function_evaluation_failed_for_some_graph_points`

## Graph Data Format

When `graph: true`, return:

```json
{
  "graph_data": {
    "x": ["-1", "-0.5", "0", "0.5", "1"],
    "f_x": ["-0.8414709848", "-0.4794255386", "0", "0.4794255386", "0.8414709848"],
    "P_x": ["-0.8414709848", "-0.4780", "0", "0.4780", "0.8414709848"],
    "error": ["0", "0.0014255386", "0", "0.0014255386", "0"]
  }
}
```

Rules:

- Values are strings to avoid frontend precision loss.
- `f_x` and `error` are `null` when no original function is known.
- Individual array entries may be `null` if a function is undefined at that graph x-value.
- The frontend should plot these arrays without recomputing the interpolation.

## Frontend Display Recommendations

- Display polynomial strings and LaTeX exactly as returned.
- Show method sections independently.
- Render Lagrange basis polynomials as a list or table.
- Render Newton divided differences as a triangular table.
- Render Neville data as one triangular table per target x-value.
- Show barycentric weights in a table with one row per node.
- Show warnings prominently but do not block result display.
- Do not run frontend math to "fix" backend output. Frontend should only format and visualize the response.

