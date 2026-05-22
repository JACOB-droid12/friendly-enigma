# Interpolation Backend Design

## Architecture

The backend exposes one main interpolation compute endpoint: `POST /api/interpolate`. This endpoint accepts all supported input modes: explicit `(x_i, y_i)` points; x-values plus a function expression, where the backend evaluates `y_i = f(x_i)`; and a function expression plus interval/node settings, where the backend generates nodes and evaluates the function.

The request includes selected methods, precision settings, target x-values, and graph settings. The backend validates and normalizes the request once, checks for invalid or duplicate x-values, evaluates functions when needed, and then runs the selected pure math modules internally.

The backend also exposes optional `POST /api/validate-function` for frontend usability. This helper validates mathematical expressions before submission, but it must call the same parser and validation logic used by `POST /api/interpolate`. The app must still work if the frontend skips this helper and submits directly to `POST /api/interpolate`.

The API intentionally avoids separate public endpoints per interpolation method in v1. Lagrange, Newton divided differences, Barycentric Lagrange, and Neville are implemented as pure internal modules. Keeping the public API unified prevents duplicated validation, keeps precision handling consistent, and makes method comparison easier for the React frontend.

The high-level flow is:

```text
FastAPI schemas
-> request validation
-> numeric/function normalization
-> duplicate-x and domain checks
-> node generation or y-value evaluation
-> shared warnings and educational notes
-> selected method modules
-> evaluation and graph-data generation
-> JSON response contract
```

## Core Boundaries

`schemas.py` stays at the FastAPI/Pydantic boundary. It defines request models, response models, enum-like literals, and error shapes only. It does not compute interpolation results, parse functions beyond basic field validation, or format educational math output.

`core/parser.py` owns safe function-expression parsing. It must not use raw `eval`. It parses expressions through a restricted SymPy parser using explicit allowed symbols, functions, constants, and transformations, with no arbitrary Python names or object access. Both `POST /api/interpolate` and optional `POST /api/validate-function` call this same module, so parser behavior cannot drift between pre-validation and actual interpolation.

`core/precision.py` owns numeric conversion and formatting policy. It preserves exact rational values when the input allows it, such as integer, decimal, or fraction strings converted through SymPy `Rational`. For function-generated y-values, it preserves symbolic expressions where practical, but evaluates transcendental or graph/evaluation outputs under the requested decimal precision when needed. It also centralizes output formatting, significant-digit rules, and the one allowed float boundary: graph sampling may use float-compatible values only after canonical nodes and polynomial/method data have already been computed, and the response still returns graph values as strings or `null`.

`core/validation.py` owns validation that is independent of API transport: minimum node count, duplicate x-values, non-real values, invalid methods, interval bounds, node-count rules, custom-node rules, close-x warnings, high-degree warnings, and domain errors from function evaluation.

`core/normalization.py` converts all input modes into one canonical internal structure:

```text
InterpolationProblem
- mode
- nodes = [(x0, y0), (x1, y1), ...]
- original_function, if known
- precision context
- selected methods
- evaluation targets
- graph settings
- warnings from normalization
```

After normalization, method modules do not care whether nodes came from points, x-values plus a function, or interval-generated nodes.

The method modules are pure math modules:

```text
core/methods/lagrange.py
core/methods/newton.py
core/methods/barycentric.py
core/methods/neville.py
```

They receive clean numerical/domain objects and return structured method results. They do not import FastAPI, Pydantic request models, frontend concepts, or raw JSON payloads. They do not parse inputs independently and do not choose their own precision policy.

Each method result uses a shared outer shape but allows method-specific fields. For example, polynomial forms are present for Lagrange and Newton, weights are present for Barycentric, and Neville tables are present for Neville.

A service/orchestrator layer coordinates the workflow after normalization. It runs selected methods, catches method-local failures into structured per-method errors where possible, builds shared warnings and educational notes, computes requested evaluations, generates graph data, and assembles the final response contract.

The most important rule is:

```text
FastAPI/Pydantic stays at the API boundary.
Pure interpolation modules only receive clean numerical/domain objects.
All input modes are normalized before method execution.
```

Codex implementation warning:

Do not let each method parse inputs independently. Do not let each method apply its own precision policy. Do not let React duplicate parser or math logic. The backend owns numerical correctness.

## Math Behavior

Shared assumptions:

- x-values must be distinct. Duplicate x-values are a hard validation error.
- `n + 1` nodes produce a unique interpolating polynomial of degree at most `n`.
- Lagrange, Newton, Barycentric, and Neville should agree mathematically when using the same nodes.
- Numerical values may differ slightly because of precision, conditioning, and method stability. Differences beyond tolerance should produce a warning.
- Method-disagreement tolerance is defined in `core/precision.py`, not inside each method. Use both absolute and relative tolerance:

```text
abs(a - b) <= abs_tol
OR
abs(a - b) <= rel_tol * max(1, abs(a), abs(b))
```

Tolerance should scale with requested precision:

```text
comparison_digits = max(8, precision_digits)
abs_tol = 10^(-(comparison_digits - 4))
rel_tol = 10^(-(comparison_digits - 4))
```

For `precision = 30`, default tolerances are `1e-26`, leaving four guard digits for method differences and conditioning.

The app separates educational method output from best numerical evaluation. Newton and Lagrange are important for showing formulas, polynomial construction, and steps. Barycentric is preferred as the default numerical evaluator for values and graphing. Neville is used for target-specific recursive table output.

Lagrange responsibilities:

- Return basis polynomials `L_i(x)`.
- Return the Lagrange summation form.
- Return expanded and LaTeX forms where practical.
- Return educational steps explaining how each basis polynomial is built.
- Avoid treating expanded Lagrange as the main high-degree numerical evaluator.
- Omit expanded forms when expressions are too large or degree is too high. In that case, set the expanded form to `null` and return a warning such as `expanded_polynomial_omitted`.

Newton divided differences responsibilities:

- Return the full divided-difference table.
- Return coefficients in Newton order.
- Return Newton nested/product form.
- Return expanded/LaTeX forms where practical.
- Return educational steps explaining divided differences and polynomial construction.
- Support polynomial construction from the same canonical nodes.
- Omit expanded forms when expressions are too large or degree is too high, using the same warning policy.

Barycentric Lagrange responsibilities:

- Return barycentric weights by node.
- Act as the preferred numerical evaluator for requested values and graph data.
- Handle exact-node hits directly: if target `x` equals a node, return that node's `y` value instead of dividing by zero.
- Use high-precision arithmetic where practical for requested evaluations.
- Document any lower-precision or SciPy/double-precision boundary if used for graph sampling.

Neville responsibilities:

- Return one triangular Neville table per requested target `x`.
- Return target-specific interpolation results.
- Require evaluation targets to produce useful output.
- If Neville is selected but no `evaluation_x` is provided, return a structured method warning or method error explaining that Neville requires target x-values. Do not crash the whole request.
- Not return a full symbolic polynomial in v1.
- Serve as an educational/checking method, especially when a user wants `P(x_target)` without constructing the full polynomial.

Evaluation rules:

- All selected methods should evaluate requested `evaluation_x` values where applicable.
- Results must be returned as strings, not raw frontend-facing floating values.
- If an original function is known, include `f_x` and `absolute_error` only when `f(x)` can be evaluated safely at the target. Otherwise return `null` plus a domain warning or structured error.
- If selected methods disagree beyond the shared tolerance policy, return a non-blocking warning.
- Extrapolation outside the node range should return a warning, not a hard error.

Graph-data rules:

- Default `graph_data.P_x` comes from the stable default evaluator, preferably barycentric.
- Return `graph_data.x`, `graph_data.f_x`, `graph_data.P_x`, and `graph_data.error` as arrays of strings or `null`.
- Use `null` for undefined values or function-domain failures. Do not substitute fake zeroes.
- Keep graph sampling separate from exact symbolic polynomial construction.
- If method-by-method graph comparison is needed later, return optional `method_graphs` keyed by method. The default v1 graph must not require React to recompute anything.
- The frontend renders graph arrays only; it does not recompute interpolation.

Error and warning behavior:

- Duplicate x-values: hard error.
- Fewer than two nodes: hard error.
- Unsafe or unknown function expression: hard error.
- Function domain errors while generating required nodes: structured hard error.
- High degree, especially degree `>= 10`: warning.
- Very close x-values: warning.
- Extrapolation outside node range: warning.
- High-degree equally spaced interpolation: Runge phenomenon warning.
- Expanded polynomial omitted because expression is too large: warning.
- Method-local numerical failure: structured method error where possible, not a whole-response crash if other selected methods succeeded.

## Response Contract

`POST /api/interpolate` returns one consistent top-level shape for all input modes and selected methods.

Status semantics:

```text
status: "ok"      -> normalization succeeded and all selected methods succeeded
status: "partial" -> normalization succeeded, but one or more selected methods failed or returned method-level warnings/errors
status: "error"   -> validation or normalization failed before computation
```

Validation/normalization failures return HTTP `400` or `422`. If normalization succeeds but some methods fail, return HTTP `200` with `status: "partial"` and structured method errors. If all selected methods fail after normalization, v1 should still return HTTP `200` with `status: "partial"` only when the response can explain each method failure. Validation-level failures remain `status: "error"`.

Success/partial shape:

```json
{
  "status": "ok",
  "response_version": "1.0",
  "metadata": {
    "tolerance": {
      "abs_tol": "1e-26",
      "rel_tol": "1e-26",
      "precision_digits_used_for_comparison": 30
    }
  },
  "input_summary": {
    "mode": "points",
    "node_count": 2,
    "degree": 1,
    "methods_requested": ["lagrange", "newton", "barycentric"],
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
    "expanded": "-x + 6",
    "factored": "6 - x",
    "lagrange_form": "4*(x - 5)/(2 - 5) + 1*(x - 2)/(5 - 2)",
    "newton_form": "4 - 1*(x - 2)",
    "latex_expanded": "- x + 6",
    "latex_lagrange": "...",
    "latex_newton": "...",
    "expanded_omitted_reason": null
  },
  "methods": {
    "lagrange": {
      "status": "ok",
      "basis_polynomials": [],
      "summation_form": "",
      "evaluations": [],
      "steps": [],
      "warnings": [],
      "error": null
    },
    "newton": {
      "status": "ok",
      "divided_difference_table": [],
      "coefficients": [],
      "nested_form": "",
      "evaluations": [],
      "steps": [],
      "warnings": [],
      "error": null
    },
    "barycentric": {
      "status": "ok",
      "weights": [],
      "evaluations": [],
      "notes": [],
      "warnings": [],
      "error": null
    },
    "neville": {
      "status": "ok",
      "target_results": [],
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

Method results use a shared outer shape: `status`, method-specific fields, `evaluations` where applicable, `warnings`, and `error`. Method-specific fields are allowed because artifacts differ: Lagrange returns basis polynomials, Newton returns divided-difference tables, Barycentric returns weights, and Neville returns target tables.

Top-level `evaluations` is the frontend's main comparison table. `best_P_x` defaults to barycentric if barycentric was selected or internally available as the stable evaluator. Otherwise fallback order is Newton, then Lagrange, then Neville. `method_values.neville` is populated when Neville is selected and a target table was generated; it is `null` only when Neville was not requested, failed for that target, or no target was provided.

`graph_data` shape when requested:

```json
{
  "x": ["-1", "-0.5", "0", "0.5", "1"],
  "f_x": ["-0.8414709848", "-0.4794255386", "0", "0.4794255386", "0.8414709848"],
  "P_x": ["-0.8414709848", "-0.4780", "0", "0.4780", "0.8414709848"],
  "error": ["0", "0.0014255386", "0", "0.0014255386", "0"],
  "source_method": "barycentric",
  "method_graphs": null
}
```

Hard error shape:

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

Stable warning/error codes:

```text
duplicate_x
too_few_nodes
invalid_method
invalid_interval
invalid_node_count
non_real_value
unsafe_expression
function_domain_error
close_x_warning
high_degree_warning
runge_warning
extrapolation_warning
method_disagreement_warning
expanded_polynomial_omitted
neville_requires_evaluation_x
graph_sampling_domain_error
method_failed
```

Default tolerance policy lives in `core/precision.py`:

```text
comparison_digits = max(8, precision_digits)
abs_tol = 10^(-(comparison_digits - 4))
rel_tol = 10^(-(comparison_digits - 4))
```

For `precision = 30`, default tolerances are `1e-26`, leaving four guard digits for method differences and conditioning.

## Testing And Validation

Tests cover both math correctness and system safety. Interpolation bugs can come from method logic, parser security, precision handling, normalization, API response assembly, or graph generation.

Unit tests for pure math methods:

- Test Lagrange, Newton, Barycentric, and Neville independently.
- Confirm the same nodes produce matching evaluated values within the shared tolerance from `core/precision.py`.
- Confirm Newton divided-difference tables match known expected values.
- Confirm Neville triangular tables match known target interpolation examples.
- Confirm Barycentric returns the exact node y-value when evaluation `x` equals a node.
- Test expanded polynomial forms only for low-degree cases where the expression size is reasonable.

Golden tests from lecture/source examples:

- Points `(2, 4)`, `(5, 1)` produce `P(x) = -x + 6`.
- `x = [2, 2.75, 4]`, `f(x) = 1/x`, target `x = 3`, approximates about `0.32955`.
- Newton divided-difference examples become regression tests for table and coefficients.
- Neville examples become regression tests for triangular table values and target result.

Normalization tests:

- Points mode normalizes into canonical nodes.
- X-values plus function mode normalizes into canonical nodes after backend evaluation of `y_i = f(x_i)`.
- Function interval mode normalizes into canonical generated nodes.
- Sorted/unsorted node behavior is deterministic and documented in the response.

Parser/security tests:

- Reject unsafe expressions.
- Reject unknown symbols and unknown functions.
- Reject object access, imports, lambdas, assignments, and raw Python execution.
- Accept only whitelisted functions/constants such as `sin`, `cos`, `exp`, `log`/`ln`, `sqrt`, `pi`, and `E`.
- Verify `POST /api/validate-function` and `POST /api/interpolate` produce consistent parser outcomes because they share the same parser module.

Validation tests:

- Duplicate x-values return hard error code `duplicate_x`.
- Fewer than two nodes return hard error code `too_few_nodes`.
- Invalid interval returns hard error code `invalid_interval`.
- Invalid node count returns hard error code `invalid_node_count`.
- Non-real values return structured error code `non_real_value`.
- Function domain failures return structured error code `function_domain_error`.

Precision tests:

- Exact rational input preserves exact values where possible.
- High-precision mode returns string outputs, not frontend-facing floats.
- Method-disagreement tolerance uses centralized `core/precision.py` policy.
- Graph sampling float boundary does not affect canonical polynomial or method computation.

API contract and response schema tests:

- `POST /api/interpolate` returns stable `response_version`.
- Full successful computation returns `status: "ok"`.
- Method-local failure returns `status: "partial"` with structured method error.
- Validation failure returns `status: "error"` with stable error code.
- Top-level `metadata`, `input_summary`, `nodes`, `polynomial`, `methods`, `evaluations`, `graph_data`, `warnings`, and `educational_notes` shapes remain stable.
- Validate response JSON against Pydantic response models.
- Check that all warning/error codes are stable.
- Check that missing optional fields use `null` or `[]` consistently.

Graph-data tests:

- Graph arrays have equal lengths.
- Undefined function values become `null`, not zero.
- `P_x` comes from the stable evaluator, preferably barycentric.
- Graph output is render-ready for the frontend and does not require React to recompute interpolation.

Numerical edge cases:

- Close x-values produce warning `close_x_warning`.
- High-degree interpolation produces warning `high_degree_warning`.
- High-degree equally spaced nodes produce warning `runge_warning`.
- Extrapolation targets produce warning `extrapolation_warning`.
- Exact node hits return the node value directly.
- Domain failures are structured and do not produce fake values.
- Method disagreement beyond tolerance produces warning `method_disagreement_warning`.

Command-level verification:

```powershell
cd backend
python -m pytest
python -m pytest app/tests/test_parser.py
python -m pytest app/tests/test_api.py
python -m ruff check .
```

Final handoff verification should run:

```powershell
cd backend
python -m pytest
python -m ruff check .
```

Later this can be wrapped as:

```powershell
.\scripts\verify-backend.ps1
```

`docs/HANDOFF.md` must record exact commands run, pass/fail results, known failures or skipped tests, and the next recommended step.

No completion claim should be made unless the exact commands were run and recorded.

## Implementation Order And Milestones

### Resource / Library Strategy

| Need | Best resource/library | Why |
|---|---|---|
| Exact polynomial formula | SymPy | Use for symbolic construction, simplification, expansion, LaTeX output, and exact rational forms where practical. |
| Stable numeric interpolation/evaluation | SciPy interpolate | Use as optional reference or numeric backend for barycentric interpolation. |
| High significant digits | mpmath | Use for arbitrary-precision arithmetic when the user requests 30, 50, 100, or more digits. |
| Exact decimal input | Python `decimal` | Use at the input/formatting boundary for exact decimal representation and controlled rounding behavior. |
| Graph comparison | Backend arrays; frontend charts | Backend generates graph-ready arrays only. Frontend renders with its chosen chart library. |
| UI/frontend | React / Vite / Tailwind | Claude Opus owns this separately. The frontend should not do serious numerical math. |
| Frontend expression helper | Math.js | Optional React-side helper for calculator-style input, expression preview, syntax hints, and display formatting. It must not replace the Python backend parser, validation, precision policy, or interpolation methods. |

Math.js is optional frontend UX support only. The Python backend remains the source of truth for parsing, validation, precision, interpolation, evaluations, tables, and graph-ready data.

Final library rule:

```text
Backend truth:
SymPy + SciPy + mpmath + Decimal

Frontend UX:
React / Vite / Tailwind + optional Math.js

Graphing:
Backend returns arrays only; frontend renders charts.

Avoid:
NumPy polyfit as the main interpolation engine.
```

### Milestone 1 - Documentation And Spec Lock

Finalize endpoint shape, input modes, response contract, method result shape, warning/error codes, precision/tolerance policy, graph-data rules, and handoff rules.

Deliverables:

- `docs/API_CONTRACT.md`
- `docs/MATH_BEHAVIOR.md`
- `docs/HANDOFF.md`
- `docs/PLAN.md`
- `docs/FRONTEND_HANDOFF.md`

### Milestone 2 - Backend Scaffolding

Create:

```text
backend/
  app/
    main.py
    schemas.py
    api/
      routes.py
    core/
      parser.py
      precision.py
      validation.py
      normalization.py
      methods/
        lagrange.py
        newton.py
        barycentric.py
        neville.py
      service.py
    tests/
```

Deliverables:

- FastAPI app starts.
- `GET /health` returns healthy response.
- `python -m pytest` runs, even if only scaffold tests exist.
- Ruff config exists if practical.

### Milestone 3 - Schemas And Response Models

Implement `schemas.py` with request models, response models, method literals, input-mode literals, warning/error shapes, graph-data shape, and method-result outer shape.

Rules:

- No interpolation math.
- No function parsing beyond basic field validation.
- No educational math formatting.

### Milestone 4 - Parser, Precision, Validation, Normalization

Implement:

```text
core/parser.py
core/precision.py
core/validation.py
core/normalization.py
```

Deliverables:

- Safe parser works without raw `eval`.
- Precision policy is centralized.
- All three input modes normalize into canonical nodes.
- Duplicate x-values, bad intervals, bad node counts, non-real values, domain errors, and invalid methods are handled.
- Parser/security and validation tests pass.

### Milestone 5 - Pure Math Modules

Implement:

```text
core/methods/lagrange.py
core/methods/newton.py
core/methods/barycentric.py
core/methods/neville.py
```

Rules:

- No FastAPI imports.
- No Pydantic request imports.
- No raw JSON payloads.
- No frontend assumptions.
- No independent parser or precision policy.

Deliverables:

- Lagrange basis polynomials and summation form.
- Newton divided-difference table and Newton form.
- Barycentric weights and stable evaluations.
- Neville triangular tables per target x.
- Lecture golden tests pass.

### Milestone 6 - Service / Orchestrator Layer

Workflow:

```text
request model
-> validation
-> normalization
-> selected method execution
-> method-local error capture
-> top-level evaluations
-> graph-data generation
-> warnings and educational notes
-> response contract assembly
```

Deliverables:

- `POST /api/interpolate` runs selected methods.
- Partial method failures do not crash the whole response.
- Top-level evaluations are generated.
- `best_P_x` uses barycentric when available.
- Graph data comes from the stable evaluator.

### Milestone 7 - API Endpoints

Finish:

```text
GET  /health
POST /api/validate-function
POST /api/interpolate
```

Rules:

- `/api/validate-function` uses the same parser as `/api/interpolate`.
- `/api/interpolate` works even if pre-validation was skipped.
- Hard validation failures return `status: "error"`.
- Method-local failures return `status: "partial"`.

### Milestone 8 - Testing And Verification

Run:

```powershell
cd backend
python -m pytest
python -m pytest app/tests/test_parser.py
python -m pytest app/tests/test_api.py
python -m ruff check .
```

Final handoff verification:

```powershell
cd backend
python -m pytest
python -m ruff check .
```

### Milestone 9 - Final Backend Handoff

Update `docs/HANDOFF.md` with files changed, exact commands run, pass/fail results, skipped tests, known issues, next backend step, and whether Claude Opus can start frontend integration.

## Final Risks And Scope Boundaries

### Main Risks

1. Numerical conditioning risk

   Interpolation can become unstable with high-degree polynomials, close x-values, equally spaced nodes, or extrapolation. The app must warn users instead of pretending every result is equally reliable.

2. Precision drift risk

   Precision rules must stay centralized in `core/precision.py`. Individual methods must not choose their own rounding, tolerance, or formatting rules.

3. Parser/security risk

   Function parsing must never use raw `eval`. Both `/api/interpolate` and `/api/validate-function` must use the same restricted backend parser.

4. Frontend/backend drift risk

   React and Math.js must not become a second math engine. The frontend may preview input, but the backend remains the source of truth for parsing, validation, interpolation, evaluations, tables, and graph-ready data.

5. Response-contract drift risk

   The JSON response shape must stay stable so Claude Opus can build the frontend without guessing. New fields may be added later, but v1 fields should not randomly change.

6. Graph accuracy risk

   Graph data must come from the backend's stable evaluator, preferably barycentric. The frontend renders arrays only and must not recompute interpolation.

7. Symbolic-expression explosion risk

   Expanded polynomial forms can become very large. For high degree or large expressions, the backend should omit expanded form and return a structured warning.

8. Method disagreement risk

   Different methods should theoretically agree, but numerical differences can happen. Disagreement beyond the shared tolerance should produce a warning, not silent mismatch.

9. Dependency misuse risk

   SymPy, SciPy, mpmath, and Decimal each have a specific role. NumPy `polyfit` must not become the main interpolation engine.

10. Completion-claim risk

    No handoff or completion claim should be made unless tests and lint commands were actually run and recorded in `docs/HANDOFF.md`.

### Scope Boundaries For v1

In scope:

- `GET /health`
- `POST /api/interpolate`
- optional `POST /api/validate-function`
- three input modes:
  - explicit points
  - x-values plus function
  - function interval/node generation
- Lagrange, Newton divided differences, Barycentric Lagrange, and Neville
- exact/symbolic output where practical
- high-precision numeric evaluation where practical
- method tables and educational notes
- graph-ready arrays
- structured warnings/errors
- backend tests and handoff documentation

Out of scope for v1:

- separate public endpoints per method
- frontend-side interpolation correctness
- Math.js as the final parser or computation engine
- NumPy `polyfit` as the main interpolation engine
- OCR, PDF import, or automatic problem solving from screenshots
- AI-generated solving beyond user-provided input
- database, storage, or accounts
- authentication
- deployment packaging
- advanced adaptive node selection unless explicitly added later
- full CAS replacement behavior
- guaranteed stability for arbitrary high-degree interpolation without warnings

### Final Boundary Rule

The backend owns mathematical correctness.

The frontend owns presentation, input convenience, and rendering.

Math modules own pure interpolation logic.

The orchestrator owns workflow and response assembly.

Tests and `docs/HANDOFF.md` prove what was actually completed.
