# API Contract — Interpolating Polynomial Program Backend

## Status
Implemented v1 backend contract. The backend owns parsing, validation, numerical precision, interpolation, evaluations, warnings, and graph-ready arrays.

## Base URL
Development default:

```text
http://127.0.0.1:8000
```

## Endpoints
| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Basic service health check. |
| `POST` | `/api/interpolate` | Build interpolation method output, evaluations, and optional graph data. |
| `POST` | `/api/validate-function` | Validate a function string with the same parser used by interpolation. |

## `GET /health`
Success response:

```json
{
  "status": "ok",
  "service": "interpolation-backend",
  "version": "0.1.0"
}
```

## `POST /api/validate-function`
Request:

```json
{
  "function": "sin(x)"
}
```

Success response:

```json
{
  "status": "ok",
  "function": "sin(x)",
  "normalized_expression": "sin(x)",
  "latex": "\\sin{\\left(x \\right)}",
  "allowed_symbols": ["x"]
}
```

Unsafe or unknown expressions return HTTP `400`:

```json
{
  "status": "error",
  "error": {
    "code": "unsafe_expression",
    "message": "Function expression contains unsafe or unsupported syntax.",
    "details": {
      "expression": "__import__('os').system('dir')"
    }
  }
}
```

Allowed variable:

- `x`

Allowed functions/constants:

- `sin`, `cos`, `tan`
- `exp`, `log`, `ln`, `sqrt`, `abs`
- `asin`, `acos`, `atan`
- `sinh`, `cosh`, `tanh`
- `pi`, `E`

Rejected examples:

- `__import__("os").system("dir")`
- `open("file")`
- `lambda x: x`
- `x.__class__`
- `y + 1`
- `unknown_func(x)`

## `POST /api/interpolate`

### Shared Request Fields
| Field | Type | Required | Notes |
|---|---|---|---|
| `mode` | string | Yes | One of `points`, `x_values_with_function`, `function_interval`. |
| `methods` | string array | No | Any of `lagrange`, `newton`, `barycentric`, `neville`; defaults to `["lagrange", "newton", "barycentric"]`. |
| `precision` | integer | No | Decimal precision, 8 to 200; defaults to `50`. |
| `exact` | boolean or null | No | Defaults to `true` for points and x-values-with-function; defaults to `false` for function-interval. |
| `evaluation_x` | string array | No | Target x-values for `P(x)` and optional original function error. |
| `graph` | boolean | No | Whether to return graph-ready arrays. Defaults to `false`. |

All user numeric inputs are strings.

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

Validation:

- `points` must contain at least two `[x, y]` pairs.
- All `x` values must be distinct.
- Values must be real numeric strings.

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

The backend evaluates `y_i = f(x_i)` after the function passes the shared parser.

Lecture regression behavior:

- Nodes `2`, `2.75`, and `4` with `f(x)=1/x` return `P(3) = 29/88`, approximately `0.32955`.
- The original function value is `f(3) = 1/3`.
- The absolute error is `1/264`.

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
  "evaluation_x": ["0"],
  "graph": true
}
```

Validation:

- `interval` must be `[a, b]` with `a < b`.
- `node_count` must be at least 2.
- `node_strategy` must be `equally_spaced`, `chebyshev_nodes`, or `custom_nodes`.
- `custom_nodes` uses `x_values` instead of generated interval nodes.

## Success Response Shape

```json
{
  "status": "ok",
  "response_version": "1.0",
  "metadata": {
    "tolerance": {
      "abs_tol": "1e-46",
      "rel_tol": "1e-46",
      "precision_digits_used_for_comparison": 50
    }
  },
  "input_summary": {
    "mode": "points",
    "node_count": 2,
    "degree": 1,
    "methods_requested": ["lagrange", "newton", "barycentric", "neville"],
    "precision": 50,
    "exact": true,
    "function_known": false,
    "graph_requested": false,
    "sorted_nodes": false
  },
  "nodes": [
    {"index": 0, "x": "2", "y": "4"},
    {"index": 1, "x": "5", "y": "1"}
  ],
  "degree": 1,
  "polynomial": {
    "expanded": "6 - x",
    "factored": "6 - x",
    "lagrange_form": "20/3 - 4*x/3 + x/3 - 2/3",
    "newton_form": "6 - x",
    "latex_expanded": "6 - x",
    "latex_lagrange": "6 - x",
    "latex_newton": "6 - x",
    "expanded_omitted_reason": null
  },
  "methods": {
    "lagrange": {
      "status": "ok",
      "basis_polynomials": [],
      "summation_form": "",
      "expanded": "6 - x",
      "latex_expanded": "6 - x",
      "latex_lagrange": "6 - x",
      "evaluations": [{"x": "3", "value": "3"}],
      "steps": [],
      "warnings": [],
      "error": null
    },
    "newton": {
      "status": "ok",
      "divided_difference_table": [],
      "coefficients": [],
      "nested_form": "6 - x",
      "expanded": "6 - x",
      "latex_expanded": "6 - x",
      "latex_newton": "6 - x",
      "evaluations": [{"x": "3", "value": "3"}],
      "steps": [],
      "warnings": [],
      "error": null
    },
    "barycentric": {
      "status": "ok",
      "weights": [],
      "evaluations": [{"x": "3", "value": "3"}],
      "notes": [],
      "warnings": [],
      "error": null
    },
    "neville": {
      "status": "ok",
      "target_results": [{"x": "3", "value": "3"}],
      "tables": [],
      "warnings": [],
      "error": null
    }
  },
  "evaluations": [
    {
      "x": "3",
      "best_P_x": "3",
      "best_method": "barycentric",
      "method_values": {
        "lagrange": "3",
        "newton": "3",
        "barycentric": "3",
        "neville": "3"
      },
      "f_x": null,
      "absolute_error": null,
      "warnings": []
    }
  ],
  "graph_data": null,
  "warnings": [],
  "educational_notes": []
}
```

`status` values:

- `ok`: normalization and selected methods succeeded.
- `partial`: normalization succeeded but a method failed or returned a structured method problem.
- `error`: validation or normalization failed before method execution.

## Graph Data
When `graph: true`, `graph_data` is:

```json
{
  "x": ["-1", "-0.98"],
  "f_x": ["-0.8414709848078965", "-0.8304973704919705"],
  "P_x": ["-0.8414709848078965", "-0.823987"],
  "error": ["0", "0.006510"],
  "source_method": "barycentric",
  "method_graphs": null
}
```

Rules:

- Arrays are generated by the backend.
- `x`, `f_x`, `P_x`, and `error` have equal length.
- Values are strings or `null`.
- `P_x` uses barycentric evaluation.
- The frontend renders arrays only and must not recompute interpolation.

## Error Response Shape
Hard validation failures return HTTP `400` with:

```json
{
  "status": "error",
  "error": {
    "code": "duplicate_x",
    "message": "x-values must be distinct.",
    "details": {
      "duplicates": ["2"]
    }
  }
}
```

Pydantic schema failures return FastAPI HTTP `422`.

Implemented error codes:

- `duplicate_x`
- `too_few_nodes`
- `invalid_method`
- `invalid_interval`
- `invalid_node_count`
- `non_real_value`
- `unsafe_expression`
- `function_domain_error`

Implemented warning codes:

- `close_x_warning`
- `high_degree_warning`
- `runge_warning`
- `extrapolation_warning`
- `method_disagreement_warning`
- `expanded_polynomial_omitted`
- `neville_requires_evaluation_x`
- `graph_sampling_domain_error`
- `method_failed`
- `nodes_reordered`

## Frontend Display Notes
- Display polynomial strings and LaTeX exactly as returned.
- Show method sections independently.
- Render Lagrange basis polynomials as a list or table.
- Render Newton divided differences as a triangular table.
- Render Neville data as one triangular table per target x-value.
- Show barycentric weights in a table with one row per node.
- Show warnings prominently.
- Do not run frontend math to correct backend output.
