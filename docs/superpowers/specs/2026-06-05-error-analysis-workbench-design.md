# Error Analysis Workbench Design

Date: 2026-06-05

## Purpose

Add academic error-analysis depth to the interpolation program. The feature should help students understand not only what polynomial or spline was computed, but also how accurate the approximation is, what theory explains the error, and when the result should be treated with caution.

This is now an explicitly full-stack feature. The backend remains the source of truth for all mathematics and warnings. The frontend sends configuration and renders backend response fields only.

## Goals

- Add optional error analysis to `POST /api/interpolate`.
- Return interpolation remainder formulas, node-product formulas, LaTeX, warnings, and educational steps.
- Compute actual target errors when the original function is known.
- Compute sampled maximum absolute error when the original function and a sample interval are available.
- Support global-polynomial methods first: `lagrange`, `newton`, `barycentric`, `hermite_divided_difference`, `hermite`, and `osculating`.
- Provide Taylor-specific error-analysis language for `taylor`.
- Provide cubic-spline-specific notes and actual sampled error when possible without pretending splines have a single global interpolation remainder formula.
- Add frontend controls and result rendering for the new `error_analysis` block.

## Non-Goals

- Do not add public per-method endpoints.
- Do not move interpolation or error-analysis math into React.
- Do not estimate unknown high-order derivative bounds automatically in the first version.
- Do not implement full formal spline error-bound theory in the first version.
- Do not make analysis required for existing requests.

## Request Contract

Add an optional `analysis` object to `InterpolateRequest`:

```json
{
  "analysis": {
    "error": true,
    "sample_count": 101,
    "derivative_bound": "1"
  }
}
```

Fields:

- `error`: optional boolean, default `false`. Enables error analysis.
- `sample_count`: optional integer, default `101`, bounded to `25..501`.
- `derivative_bound`: optional numeric string. When provided, backend uses it to describe a theoretical bound of the form `M/(n+1)! * |product(x - x_i)|` for global interpolation methods.

Invalid schema values should use normal FastAPI/Pydantic validation. Invalid numeric strings for `derivative_bound` should follow the backend's existing numeric-validation style.

## Response Contract

Add a top-level response field:

```json
{
  "error_analysis": null
}
```

When `analysis.error` is false or omitted, `error_analysis` is `null`.

When enabled, the field has this shape:

```json
{
  "status": "ok",
  "source_method": "lagrange",
  "remainder_formula": "f^(3)(xi)/3! * (x - x0)(x - x1)(x - x2)",
  "latex_remainder_formula": "...",
  "node_product": "(x - 1)*(x - 2)*(x - 3)",
  "latex_node_product": "...",
  "derivative_bound": "1",
  "bound_formula": "1/6 * Abs((x - 1)*(x - 2)*(x - 3))",
  "target_errors": [
    {
      "x": "3/2",
      "p_x": "...",
      "f_x": "...",
      "absolute_error": "...",
      "inside_node_interval": true,
      "bound": "..."
    }
  ],
  "sample_summary": {
    "sample_count": 101,
    "max_abs_error": "...",
    "max_error_x": "...",
    "interval": ["1", "3"]
  },
  "warnings": [],
  "steps": []
}
```

If analysis is requested but only some outputs are available, return:

```json
{
  "status": "partial",
  "warnings": [
    {
      "code": "actual_error_requires_function",
      "message": "Actual error values require a known original function.",
      "details": {}
    }
  ]
}
```

The request should not fail only because some analysis artifacts are unavailable.

## Backend Architecture

Create a pure core module, likely `backend/app/core/error_analysis.py`, that accepts the normalized problem plus raw method results. The service layer should only orchestrate it and attach the returned block to the response.

Responsibilities:

- Pick the same successful polynomial source used by the top-level response where practical.
- Build global interpolation remainder artifacts for standard/global interpolation methods.
- Build Taylor-specific analysis for `taylor`.
- Build spline-specific notes for `cubic_spline`.
- Compute target errors from the known original function when available.
- Compute sampled error summary when the known original function and an analysis interval are available.
- Return structured warnings when analysis is unavailable, partial, or method-specific.

The module must not import FastAPI or Pydantic request models.

## Method Behavior

Global interpolation methods:

- Use degree `n` from the selected polynomial source.
- Build `product(x - x_i)` from the interpolation nodes or method-owned repeated nodes when appropriate.
- Return the classical interpolation remainder formula.
- If `derivative_bound` is provided, return a symbolic bound formula and per-target bound values.
- If original function is known, compute actual `f(x) - P(x)` for `evaluation_x` and sampled points.

Hermite and Osculating:

- Use method-owned repeated/confluent constraints when constructing the node-product factor.
- Use the effective degree and repeated-node multiplicities, not just distinct node count.

Taylor:

- Return Taylor theorem language using order `n`, center `a`, and derivative order `n+1`.
- Use actual error at `evaluation_x` and sampled points when the original function is known.
- Do not describe Taylor as node interpolation.

Cubic spline:

- Return method-specific notes saying spline error behavior is piecewise and boundary-condition dependent.
- Compute actual target/sample errors if the original function is known and spline segment evaluation is available.
- Do not return a global-polynomial remainder formula.

Point-only requests:

- Return theoretical formulas and node products where possible.
- Return a warning that actual error requires a function-backed request.

## Frontend Architecture

Add an Error Analysis control area in the existing input/config flow.

Controls:

- Enable error analysis.
- Sample count input, default `101`, bounded to `25..501`.
- Optional derivative-bound string input.

Request building:

- Omit `analysis` unless error analysis is enabled. This keeps existing requests unchanged and makes `error_analysis: null` the backend default for legacy callers.
- Preserve numeric inputs as strings for `derivative_bound`.
- Do not compute formulas, errors, bounds, or samples in React.

Results:

- Add an Error Analysis tab or section in the existing results area.
- Render backend `error_analysis` exactly as returned.
- Show formula, LaTeX, node product, target errors, sample summary, warnings, and steps.
- Show partial/unavailable analysis states clearly.
- Reuse existing warnings and KaTeX display components where practical.

## Validation

- `analysis.error` defaults to `false`.
- `analysis.sample_count` defaults to `101` and must be within `25..501`.
- `analysis.derivative_bound` must be a numeric string if provided.
- Non-fatal mathematical unavailability should produce `error_analysis.status = "partial"` with warnings.
- Hard malformed request shape should continue to use HTTP `422`.
- Hard invalid numeric strings should follow existing backend validation conventions.

## Testing

Backend tests:

- Schema accepts omitted `analysis`.
- Schema accepts valid analysis options.
- Schema rejects invalid `sample_count`.
- Invalid derivative-bound strings are rejected or reported through the established validation path.
- `error_analysis` is `null` when not requested.
- Function-backed Lagrange/Newton request returns actual target errors and sampled max error.
- Point-only request returns formula data and an actual-error-unavailable warning.
- Hermite/Osculating use repeated-node multiplicities for node-product analysis.
- Taylor returns Taylor-specific analysis.
- Cubic spline returns spline-specific notes and actual errors when function-backed.

Frontend tests:

- Request builder sends the analysis block when enabled.
- Request builder preserves derivative-bound as a string.
- Error Analysis panel renders formulas, target table, sample summary, warnings, and steps.
- Partial/unavailable states render without crashing.

Browser smoke:

- Function-backed global interpolation example with analysis enabled.
- Taylor example with analysis enabled.
- Point-only example with analysis enabled.
- Cubic spline example with analysis enabled.

## Documentation Updates

Update these coordination files during implementation:

- `docs/HANDOFF.md`
- `docs/PLAN.md`
- `docs/API_CONTRACT.md`
- `docs/FRONTEND_HANDOFF.md`

Documentation must record exact commands run, failures, test results, changed files, frontend behavior, and known risks.

## Risks

- Symbolic expression growth can make formulas or sampled analysis slow for high-degree or repeated-node cases. Mitigation: cap sample counts, reuse existing polynomial/source selection, and return warnings when artifacts are omitted.
- Derivative bounds are user-provided in the first version. Mitigation: do not imply that the backend proved the bound unless future work adds automatic bound estimation.
- Spline error theory differs from global polynomial interpolation. Mitigation: give spline its own analysis path instead of forcing a misleading formula.
- Frontend/backend drift is possible because this adds a new response block. Mitigation: update API docs and frontend handoff together with implementation.
