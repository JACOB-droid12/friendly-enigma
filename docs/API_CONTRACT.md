# API Contract — Interpolating Polynomial Program Backend

## Status
Implemented v1 backend contract plus Phase 2 P2.1/P2.2/P2.3/P2.4 backend method expansion, with P2.5 final audit complete. The backend owns parsing, validation, numerical precision, interpolation, osculating interpolation, Taylor approximation, natural cubic spline generation, evaluations, warnings, derivative-data handling, and graph-ready arrays.

Task 3 backend osculating is implemented locally. Valid `osculating` requests now route through service orchestration, use generalized confluent repeated nodes, and return method-owned polynomial output instead of `method_not_implemented`.

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

P2.0 accepts the Phase 2 method names to stabilize the contract. P2.1 implements `newton_forward`, `newton_backward`, and `stirling`. P2.2 implements `hermite_divided_difference` and `hermite`. P2.3 implements `taylor`. P2.4 implements natural `cubic_spline`. P2.5 audits the implemented backend expansion. Task 3 implements `osculating`.

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
      "boundary_condition": "natural",
      "left_derivative": null,
      "right_derivative": null
    },
    "osculating": {
      "orders": [
        {"x": "0", "order": 2}
      ]
    }
  }
}
```

Rules:

- `taylor.center` must be a numeric string and is required when `taylor` is selected.
- `taylor.order` must be a JSON integer from 0 through 20 and is required when `taylor` is selected. Booleans, floats, and stringified floats are rejected by schema validation.
- `cubic_spline.boundary_condition` is schema-limited to `natural`, `clamped`, `not-a-knot`, or `periodic`. Current spline computation still supports only `natural`; other accepted literals return method-level error code `unsupported_boundary_condition`.
- `cubic_spline.left_derivative` and `cubic_spline.right_derivative` are optional strict strings for the clamped-boundary contract. They are preserved at the schema boundary but are not used until clamped spline computation is implemented.
- `osculating.orders` is an optional list of strict objects with string `x` and integer `order` from 0 through 10. Each object declares the maximum derivative order used at that node. If omitted, backend osculating defaults to first-derivative Hermite-style constraints at every node.
- Unknown method option blocks are rejected by schema validation. Current accepted blocks are `taylor`, `cubic_spline`, and `osculating`.
- Numeric-string option fields are strict strings at the schema boundary; for example, `method_options.taylor.center: 0` is rejected with FastAPI HTTP `422`, while `"0"` is accepted.

`derivatives` supplies derivative data for Hermite and osculating methods:

```json
{
  "derivatives": [
    {"x": "1.3", "order": 1, "value": "-0.5220232"},
    {"x": "1.6", "order": 1, "value": "-0.5698959"},
    {"x": "1.9", "order": 1, "value": "-0.5811571"}
  ]
}
```

Rules:

- `x` and `value` are strings at the API boundary.
- `order` is an integer from 1 through 10.
- Derivative values are normalized through the same precision path as point values.
- Duplicate derivative entries for the same normalized `x` and `order` are rejected before method execution with HTTP `400` and error code `duplicate_derivative_data`.
- `hermite_divided_difference` and `hermite` currently support first-derivative data only (`order = 1`).
- Hermite methods require first-derivative data at every interpolation node.
- Missing derivative data returns method-level error code `missing_derivative_data`.
- Higher derivative orders currently return method-level error code `invalid_derivative_order` for Hermite methods.
- `osculating` supports generalized derivative orders through the Task 2 confluent repeated-node helper.

## P2.1 Equal-Spacing Methods

Implemented P2.1 method names:

- `newton_forward`
- `newton_backward`
- `stirling`

These methods require equally spaced x-values. If selected with ineligible spacing, the method returns a method-level error with code `unequal_spacing`. `stirling` currently requires an odd number of equally spaced nodes so there is one center node; even node counts return method-level error code `stirling_requires_centered_nodes`.

In numeric mode (`exact: false`), equal-spacing eligibility is checked with the backend precision tolerance reported in `metadata.tolerance`, not by display-digit formatting. Decimal nodes such as `["1.0", "1.3", "1.6", "1.9", "2.2"]` are accepted as equally spaced at `precision: 50`; genuinely unequal spacings still return method-level `unequal_spacing`.

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
      "value": "621861293/1215000000",
      "terms": [
        {"order": 0, "value": "2277011/5000000"},
        {"order": 1, "value": "563779/10000000"},
        {"order": 2, "value": "-14833/30000000"},
        {"order": 3, "value": "108497/202500000"},
        {"order": 4, "value": "-887/607500000"}
      ],
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

Stirling `evaluations[].value` is computed directly from the centered Stirling finite-difference formula. `evaluations[].terms` lists the rendered formula contribution for each order. Target guidance is advisory only. The backend does not silently replace the selected method.

## P2.2 Derivative-Data Methods

Implemented P2.2 method names:

- `hermite_divided_difference`
- `hermite`

Hermite methods use the existing `POST /api/interpolate` endpoint. No per-method endpoint is introduced.

Request example:

```json
{
  "mode": "points",
  "points": [
    ["1.3", "0.6200860"],
    ["1.6", "0.4554022"],
    ["1.9", "0.2818186"]
  ],
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

`hermite_divided_difference` method result fields:

```json
{
  "status": "ok",
  "repeated_nodes": [
    {
      "index": 0,
      "source_node_index": 0,
      "x": "13/10",
      "y": "310043/500000",
      "first_derivative": "-26101162370733/50000000000000"
    }
  ],
  "divided_difference_table": [],
  "coefficients": [],
  "nested_form": "...",
  "expanded": "...",
  "latex_expanded": "...",
  "latex_hermite": "...",
  "evaluations": [{"x": "1.5", "value": "..."}],
  "steps": [],
  "warnings": [],
  "error": null
}
```

`hermite` returns the same repeated-node divided-difference fields and adds `basis_form` when the symbolic basis is small enough for display:

```json
{
  "basis_form": {
    "status": "included",
    "formula": "H_i(x)=(1-2(x-x_i)L_i'(x_i))L_i(x)^2, K_i(x)=(x-x_i)L_i(x)^2",
    "terms": [
      {
        "node_index": 0,
        "x": "0",
        "f_x": "1",
        "f_prime_x": "2",
        "lagrange_basis": "1 - x",
        "value_basis": "(1 - x)**2*(2*x + 1)",
        "derivative_basis": "x*(1 - x)**2"
      }
    ],
    "expanded": "x**2 + 2*x + 1",
    "latex": "...",
    "matches_divided_difference": true
  }
}
```

If the basis form is omitted for size, `basis_form.status` is `omitted` and the method includes warning code `expanded_polynomial_omitted` with `details.artifact = "hermite_basis_form"`.

## Task 3 Osculating Method

Implemented Task 3 method name:

- `osculating`

Osculating interpolation uses the existing `POST /api/interpolate` endpoint. No per-method endpoint is introduced. It generalizes ordinary interpolation, first-derivative Hermite interpolation, and single-center Taylor-style interpolation by matching derivative orders `0..m_i` at each selected base node.

Request example:

```json
{
  "mode": "points",
  "points": [["0", "1"], ["1", "4"]],
  "derivatives": [
    {"x": "0", "order": 1, "value": "2"},
    {"x": "1", "order": 1, "value": "4"}
  ],
  "methods": ["osculating"],
  "method_options": {
    "osculating": {
      "orders": [
        {"x": "0", "order": 1},
        {"x": "1", "order": 1}
      ]
    }
  },
  "evaluation_x": ["1/2"],
  "precision": 50,
  "exact": true
}
```

`osculating` method result fields:

```json
{
  "status": "ok",
  "orders": [{"node_index": 0, "x": "0", "max_order": 1}],
  "repeated_nodes": [],
  "confluent_divided_difference_table": [],
  "coefficients": [],
  "nested_form": "...",
  "expanded": "x**2 + 2*x + 1",
  "latex_expanded": "...",
  "latex_osculating": "...",
  "evaluations": [{"x": "1/2", "value": "9/4"}],
  "steps": [],
  "warnings": [],
  "error": null
}
```

Validation and safety:

- `method_options.osculating.orders[].x` must match an interpolation node after numeric normalization; otherwise the method returns `derivative_node_not_found`.
- Duplicate normalized `(x, order)` entries in `method_options.osculating.orders[]` return `duplicate_derivative_order`.
- In point/data mode, derivative values for every requested order `1..m_i` must be supplied in `derivatives[]`; missing values return `missing_derivative_data`.
- Duplicate `derivatives[]` entries for the same normalized `(x, order)` are rejected before method execution with HTTP `400` and `duplicate_derivative_data`.
- In function-backed modes, required derivative values are derived from the already parsed safe SymPy expression. Non-real, infinite, undefined, or unevaluated derivative values return `function_domain_error`.
- A narrow single-node function-backed osculating request is allowed only when `methods` is exactly `["osculating"]` and `method_options.osculating.orders[]` contains a positive order. This supports Taylor-equivalent osculating input such as `f(x)=exp(x)`, `x_values=["0"]`, order `2`.
- If `orders` is omitted, the backend defaults to maximum order `1` at every node, matching first-derivative Hermite-style osculating behavior.

Top-level response behavior:

- `polynomial.osculating_form` and `polynomial.latex_osculating` are populated when osculating output is available.
- Top-level `evaluations[].best_method` prefers `osculating` ahead of Hermite and Taylor when multiple selected methods produce values.
- When `graph: true` and osculating succeeds, `graph_data.P_x` samples the osculating polynomial and `graph_data.source_method` is `"osculating"`.

## P2.3 Taylor Method

Implemented P2.3 method name:

- `taylor`

Taylor uses the existing `POST /api/interpolate` endpoint and the same safe parser as `/api/validate-function`. No per-method endpoint is introduced.

Request example:

```json
{
  "mode": "x_values_with_function",
  "function": "cos(x)",
  "x_values": ["0", "1"],
  "methods": ["taylor"],
  "method_options": {
    "taylor": {
      "center": "0",
      "order": 3
    }
  },
  "evaluation_x": ["1/2"],
  "precision": 50,
  "exact": true
}
```

`taylor` method result fields:

```json
{
  "status": "ok",
  "center": "0",
  "order": 3,
  "series_name": "Maclaurin",
  "terms": [
    {
      "order": 0,
      "derivative": "cos(x)",
      "derivative_at_center": "1",
      "coefficient": "1",
      "term": "1",
      "latex_term": "1"
    }
  ],
  "taylor_form": "1 - x**2/2",
  "expanded": "1 - x**2/2",
  "latex_expanded": "1 - \\frac{x^{2}}{2}",
  "latex_taylor": "1 - \\frac{x^{2}}{2}",
  "evaluations": [{"x": "1/2", "value": "7/8"}],
  "remainder_note": "Taylor's theorem writes f(x) = P_n(x) + R_n(x), ...",
  "steps": [],
  "warnings": [],
  "error": null
}
```

Validation and safety:

- The function is parsed only through the existing SymPy whitelist parser.
- `method_options.taylor.center` is parsed through the shared numeric-string precision path.
- `method_options.taylor.order` must be an integer from 0 through 20.
- Missing or unsupported Taylor configuration returns method-level error code `unsupported_taylor_function`.
- Functions or centers that produce non-real, infinite, undefined, or unevaluated derivative terms return method-level error code `unsupported_taylor_function`.
- The frontend must not compute Taylor derivatives, terms, evaluations, or errors.

## P2.4 Natural Cubic Spline Method

Implemented P2.4 method name:

- `cubic_spline`

P2.4 supports only the natural boundary condition. Unsupported boundary conditions return method-level error code `unsupported_boundary_condition`.

Request example:

```json
{
  "mode": "points",
  "points": [["1", "2"], ["2", "3"], ["3", "5"]],
  "methods": ["cubic_spline"],
  "method_options": {
    "cubic_spline": {
      "boundary_condition": "natural"
    }
  },
  "evaluation_x": ["5/2"],
  "precision": 50,
  "exact": true,
  "graph": true
}
```

`cubic_spline` method result fields:

```json
{
  "status": "ok",
  "boundary_condition": "natural",
  "ordered_nodes": [
    {"index": 0, "x": "1", "y": "2"}
  ],
  "second_derivatives": ["0", "3/2", "0"],
  "segments": [
    {
      "index": 0,
      "interval": {"left": "1", "right": "2"},
      "coefficients": {"a": "2", "b": "3/4", "c": "0", "d": "1/4"},
      "local_form": "(x - 1)**3/4 + 3*x/4 + 5/4",
      "expanded": "x**3/4 - 3*x**2/4 + 3*x/2 + 1",
      "latex": "..."
    }
  ],
  "continuity_checks": [
    {
      "x": "2",
      "value_continuous": true,
      "first_derivative_continuous": true,
      "second_derivative_continuous": true
    }
  ],
  "evaluations": [{"x": "5/2", "value": "125/32", "segment_index": 1}],
  "steps": [],
  "warnings": [],
  "error": null
}
```

Spline-specific rules:

- Segments are ordered by increasing x-value.
- If input nodes are reordered for segment construction, the method returns warning code `nodes_reordered`.
- `segments[].coefficients` are local coefficients for `S_i(x) = a + b(x-x_i) + c(x-x_i)^2 + d(x-x_i)^3`.
- Spline-only responses do not have a single global polynomial. The top-level `polynomial.expanded` is `null` and `polynomial.expanded_omitted_reason` is `piecewise_method_no_global_polynomial`.
- When `graph: true` and `cubic_spline` succeeds, `graph_data.source_method` is `cubic_spline` and `graph_data.P_x` is sampled from backend-owned spline segments.
- The frontend must not compute spline coefficients, continuity checks, segment values, graph samples, or errors.

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
    "osculating_form": null,
    "hermite_form": null,
    "taylor_form": null,
    "latex_expanded": "6 - x",
    "latex_lagrange": "6 - x",
    "latex_newton": "6 - x",
    "latex_osculating": null,
    "latex_hermite": null,
    "latex_taylor": null,
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

`input_summary.sorted_nodes` is `true` when at least one successful method reorders input nodes for computation. In the current method set, natural `cubic_spline` sorts nodes by increasing x-value and also preserves the existing method-level `nodes_reordered` warning with ordered input indices.

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
- `P_x` uses barycentric evaluation by default for standard interpolation graph sampling.
- If `cubic_spline` is selected and succeeds, `P_x` uses backend-owned spline segment evaluation and `source_method` is `cubic_spline`.
- If `osculating`, `taylor`, `hermite`, or `hermite_divided_difference` is selected and succeeds, `P_x` uses that method-owned polynomial and `source_method` is the selected method name.
- Graph sample bounds and grid steps are generated in backend SymPy/high-precision space; exact decimal endpoints are not rounded through Python `float`.
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
- `duplicate_derivative_data`
- `duplicate_derivative_order`
- `derivative_node_not_found`
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
- Display digits are frontend-only formatting and do not affect backend numeric eligibility, continuity, or equality checks.
- Show method sections independently.
- Render Lagrange basis polynomials from `methods.lagrange.basis_polynomials[].basis` as a list or table. `basis` is the backend wire field; do not expect or invent an `expression` alias.
- Render Newton divided differences as a triangular table.
- Render Hermite repeated-node divided differences as a triangular table.
- Render Hermite basis output from `methods.hermite.basis_form` only when returned by the backend.
- Render Osculating repeated nodes, `orders`, `confluent_divided_difference_table`, coefficients, nested/expanded forms, `latex_osculating`, and evaluations exactly as returned by the backend.
- Render Taylor terms from `methods.taylor.terms` and Taylor notes from backend text fields.
- Render cubic spline segments from `methods.cubic_spline.segments` and continuity checks from `methods.cubic_spline.continuity_checks`.
- Render Neville data as one triangular table per target x-value.
- Show barycentric weights in a table with one row per node.
- Show warnings prominently.
- Do not run frontend math to correct backend output.
