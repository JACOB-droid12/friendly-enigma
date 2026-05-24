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
| `method_options` | object | No | Optional Phase 2 method configuration keyed by method name. Defaults to `{}`. |
| `derivatives` | object array | No | Optional Phase 2 derivative data. Defaults to `[]`. |

All user numeric inputs are strings.

### Method Names

Implemented v1 method names:

- `lagrange`
- `newton`
- `barycentric`
- `neville`

Accepted Phase 2 method names:

- `newton_forward`
- `newton_backward`
- `stirling`
- `hermite_divided_difference`
- `hermite`
- `osculating`
- `taylor`
- `cubic_spline`

P2.0 accepts the Phase 2 method names to stabilize the contract. Until a method's implementation milestone is complete, selecting that method returns a method-level error with code `method_not_implemented` and the top-level response status is `partial` when normalization succeeds.

### Phase 2 Optional Method Blocks

`method_options` is keyed by method name. Current documented keys are:

```json
{
  "method_options": {
    "taylor": {
      "center": "0",
      "order": 3
    },
    "cubic_spline": {
      "boundary_condition": "natural"
    }
  }
}
```

Rules:

- `taylor.center` must be a numeric string.
- `taylor.order` must be an integer order selected by the frontend.
- `cubic_spline.boundary_condition` supports only `natural` until a later explicit boundary-condition expansion.
- Unknown method option keys are accepted at P2.0 schema level but should not be treated as implemented behavior unless documented by a later milestone.

`derivatives` supplies derivative data for Hermite and osculating methods:

```json
{
  "derivatives": [
    {"x": "1.3", "order": 1, "value": "-0.5220232"},
    {"x": "1.6", "order": 1, "value": "-0.5698959"}
  ]
}
```

Rules:

- `x` and `value` are strings at the API boundary.
- `order` is an integer from 1 through 10.
- Derivative values are normalized through the same precision path as point values.
- Missing or ineligible derivative data returns method-level errors for derivative-data methods once those methods are implemented.

## P2.1 Equal-Spacing Methods

Implemented P2.1 method names:

- `newton_forward`
- `newton_backward`
- `stirling`

These methods require equally spaced x-values. If selected with ineligible spacing, the method returns a method-level error with code `unequal_spacing`. `stirling` currently requires an odd number of equally spaced nodes so there is one center node; even node counts return method-level error code `stirling_requires_centered_nodes`.

`newton_forward` method result fields:

```json
{
  "status": "ok",
  "forward_difference_table": [["7651977/10000000", "-1451117/10000000"]],
  "spacing_h": "3/10",
  "anchor_index": 0,
  "evaluations": [
    {
      "x": "1.5",
      "s": "5/3",
      "value": "51181999459876543/100000000000000000",
      "terms": [{"order": 0, "value": "7651977/10000000"}],
      "target_guidance": {
        "recommended": "stirling",
        "target": "3/2",
        "left": "1",
        "right": "11/5",
        "midpoint": "8/5"
      }
    }
  ],
  "steps": [],
  "warnings": [],
  "error": null
}
```

`newton_backward` uses the same outer shape with `backward_difference_table` and `anchor_index` set to the last node index.

`stirling` method result fields:

```json
{
  "status": "ok",
  "centered_difference_table": [],
  "spacing_h": "3/10",
  "center_index": 2,
  "center_x": "8/5",
  "evaluations": [
    {
      "x": "1.5",
      "s": "-1/3",
      "value": "51181999459876543/100000000000000000",
      "target_guidance": {
        "recommended": "stirling",
        "target": "3/2",
        "left": "1",
        "right": "11/5",
        "midpoint": "8/5"
      }
    }
  ],
  "steps": [],
  "warnings": [],
  "error": null
}
```

Target guidance is advisory only. The backend does not silently replace the selected method.

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
      "basis_polynomials": [
        {
          "index": 0,
          "x_i": "2",
          "basis": "5/3 - x/3",
          "expanded": "5/3 - x/3",
          "latex": "\\frac{5}{3} - \\frac{x}{3}"
        },
        {
          "index": 1,
          "x_i": "5",
          "basis": "x/3 - 2/3",
          "expanded": "x/3 - 2/3",
          "latex": "\\frac{x}{3} - \\frac{2}{3}"
        }
      ],
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
- `method_not_implemented`
- `unequal_spacing`
- `stirling_requires_centered_nodes`
- `missing_derivative_data`
- `invalid_derivative_order`
- `unsupported_taylor_function`
- `unsupported_boundary_condition`

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
- `target_not_recommended_for_method`
- `piecewise_method_no_global_polynomial`

## Frontend Display Notes
- Display polynomial strings and LaTeX exactly as returned.
- Show method sections independently.
- Render Lagrange basis polynomials from `methods.lagrange.basis_polynomials[].basis` as a list or table. `basis` is the backend wire field; do not expect or invent an `expression` alias.
- Render Newton divided differences as a triangular table.
- Render Neville data as one triangular table per target x-value.
- Show barycentric weights in a table with one row per node.
- Show warnings prominently.
- Do not run frontend math to correct backend output.
