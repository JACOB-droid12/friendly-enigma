# Error Analysis Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add optional backend-owned error analysis and frontend rendering for interpolation remainder theory, actual error data, sampled max error, warnings, and educational steps.

**Architecture:** Backend adds an optional `analysis` request block, stores normalized analysis options on `InterpolationProblem`, computes `error_analysis` in a pure core module, and attaches it to the existing `POST /api/interpolate` response. Frontend extends form state and request building, then renders the returned `error_analysis` block in a dedicated results tab without doing math.

**Tech Stack:** Python 3.11+, FastAPI, Pydantic, SymPy, pytest, React, TypeScript, Vitest, Testing Library.

---

## File Structure

- Create `backend/app/core/error_analysis.py`
  - Pure backend analysis module. Accepts `InterpolationProblem`, raw method results, and the selected polynomial source. Returns a JSON-ready dict or `None`.
- Modify `backend/app/schemas.py`
  - Add `AnalysisOptions` and optional `analysis` to `InterpolateRequest`; add `error_analysis` to `InterpolateResponse`.
- Modify `backend/app/core/domain.py`
  - Add `AnalysisConfig` dataclass and `analysis` field to `InterpolationProblem`.
- Modify `backend/app/core/normalization.py`
  - Normalize and validate analysis options, including numeric-string parsing for `derivative_bound`.
- Modify `backend/app/core/service.py`
  - Call `build_error_analysis(...)` after methods run and include the result in the response.
- Test `backend/app/tests/test_schemas.py`
  - Schema coverage for omitted/valid/invalid analysis options and response model acceptance.
- Create `backend/app/tests/test_error_analysis.py`
  - Core/service tests for global interpolation, point-only partial analysis, Hermite/Osculating multiplicities, Taylor, and cubic spline notes.
- Modify `backend/app/tests/test_api.py`
  - API contract tests for `error_analysis: null`, populated analysis, and invalid derivative bounds.
- Modify `frontend/src/lib/api-types.ts`
  - Add request/response types for `analysis` and `error_analysis`.
- Modify `frontend/src/components/InputPanel.tsx`
  - Extend `FormState` and render the Error Analysis control block.
- Create `frontend/src/components/ErrorAnalysisConfigBlock.tsx`
  - Small controlled UI block for enable/sample count/derivative bound.
- Modify `frontend/src/lib/interpolate-request.ts`
  - Omit `analysis` unless enabled; preserve derivative bound as string.
- Create `frontend/src/components/results/ErrorAnalysisPanel.tsx`
  - Render formulas, node product, target errors, sample summary, warnings, and steps.
- Modify `frontend/src/components/ResultsPanel.tsx`
  - Add an Error Analysis tab that is enabled only when `data.error_analysis` is non-null.
- Modify `frontend/src/test/interpolate-response.fixtures.ts`
  - Add error-analysis fixture data.
- Test `frontend/src/components/InputPanel.MethodConfig.test.tsx`
  - Verify controls and request construction.
- Create `frontend/src/components/results/ErrorAnalysisPanel.test.tsx`
  - Verify rendering for ok and partial analysis states.
- Modify `docs/API_CONTRACT.md`, `docs/FRONTEND_HANDOFF.md`, `docs/PLAN.md`, and `docs/HANDOFF.md`
  - Record request/response shape, frontend guidance, exact commands run, failures, and remaining risks.

## Task 1: Backend Schema And Normalized Analysis Config

**Files:**
- Modify: `backend/app/schemas.py`
- Modify: `backend/app/core/domain.py`
- Modify: `backend/app/core/normalization.py`
- Test: `backend/app/tests/test_schemas.py`

- [ ] **Step 1: Write failing schema tests**

Add these tests to `backend/app/tests/test_schemas.py`:

```python
def test_analysis_options_are_optional_and_default_to_none() -> None:
    request = InterpolateRequest(
        mode="points",
        points=[["0", "0"], ["1", "1"]],
        methods=["lagrange"],
    )

    assert request.analysis is None


def test_analysis_options_accept_valid_error_config() -> None:
    request = InterpolateRequest(
        mode="x_values_with_function",
        x_values=["0", "1"],
        function="exp(x)",
        methods=["lagrange"],
        analysis={"error": True, "sample_count": 101, "derivative_bound": "1"},
    )

    assert request.analysis is not None
    assert request.analysis.error is True
    assert request.analysis.sample_count == 101
    assert request.analysis.derivative_bound == "1"


@pytest.mark.parametrize("sample_count", [24, 502, True, 101.5, "101"])
def test_analysis_sample_count_is_strict_integer_in_range(sample_count: object) -> None:
    with pytest.raises(ValidationError):
        InterpolateRequest(
            mode="points",
            points=[["0", "0"], ["1", "1"]],
            methods=["lagrange"],
            analysis={"error": True, "sample_count": sample_count},
        )


@pytest.mark.parametrize("bad_bound", [1, 1.0, True])
def test_analysis_derivative_bound_must_be_string_when_present(bad_bound: object) -> None:
    with pytest.raises(ValidationError):
        InterpolateRequest(
            mode="points",
            points=[["0", "0"], ["1", "1"]],
            methods=["lagrange"],
            analysis={"error": True, "derivative_bound": bad_bound},
        )
```

- [ ] **Step 2: Run schema tests and verify red**

Run from `backend/`:

```powershell
.\.venv\Scripts\python.exe -m pytest app/tests/test_schemas.py -q
```

Expected: FAIL because `InterpolateRequest` has no `analysis` field.

- [ ] **Step 3: Add schema types**

In `backend/app/schemas.py`, add this model after `MethodOptions`:

```python
class AnalysisOptions(StrictModel):
    error: bool = False
    sample_count: StrictInt = Field(default=101, ge=25, le=501)
    derivative_bound: StrictStr | None = None
```

Then add this field to `InterpolateRequest`:

```python
analysis: AnalysisOptions | None = None
```

And add this field to `InterpolateResponse`:

```python
error_analysis: dict[str, Any] | None = None
```

- [ ] **Step 4: Add normalized domain config**

In `backend/app/core/domain.py`, add this dataclass above `InterpolationProblem`:

```python
@dataclass(slots=True)
class AnalysisConfig:
    error: bool = False
    sample_count: int = 101
    derivative_bound: sp.Expr | None = None
    derivative_bound_text: str | None = None
```

Then add this field to `InterpolationProblem`:

```python
analysis: AnalysisConfig = field(default_factory=AnalysisConfig)
```

- [ ] **Step 5: Normalize analysis options**

In `backend/app/core/normalization.py`, update the import:

```python
from app.core.domain import AnalysisConfig, DerivativeDatum, InterpolationProblem, Node
```

Add this helper before `_normalize_derivatives`:

```python
def _normalize_analysis(request: InterpolateRequest, *, exact: bool) -> AnalysisConfig:
    if request.analysis is None:
        return AnalysisConfig()
    derivative_bound = None
    if request.analysis.derivative_bound is not None:
        derivative_bound = to_sympy(
            request.analysis.derivative_bound,
            exact=exact,
            precision=request.precision,
        )
    return AnalysisConfig(
        error=request.analysis.error,
        sample_count=request.analysis.sample_count,
        derivative_bound=derivative_bound,
        derivative_bound_text=request.analysis.derivative_bound,
    )
```

Then pass it inside `InterpolationProblem(...)`:

```python
analysis=_normalize_analysis(request, exact=exact),
```

- [ ] **Step 6: Run schema tests and verify green**

Run from `backend/`:

```powershell
.\.venv\Scripts\python.exe -m pytest app/tests/test_schemas.py -q
```

Expected: PASS.

- [ ] **Step 7: Commit Task 1**

```powershell
git add backend/app/schemas.py backend/app/core/domain.py backend/app/core/normalization.py backend/app/tests/test_schemas.py
git commit -m "feat: add error analysis request schema"
```

## Task 2: Backend Error Analysis Core For Global Polynomials

**Files:**
- Create: `backend/app/core/error_analysis.py`
- Modify: `backend/app/core/service.py`
- Test: `backend/app/tests/test_error_analysis.py`
- Test: `backend/app/tests/test_api.py`

- [ ] **Step 1: Write failing core tests**

Create `backend/app/tests/test_error_analysis.py`:

```python
import sympy as sp

from app.core.service import interpolate
from app.schemas import InterpolateRequest


def test_error_analysis_is_none_when_not_requested() -> None:
    response = interpolate(
        InterpolateRequest(
            mode="points",
            points=[["0", "0"], ["1", "1"]],
            methods=["lagrange"],
            exact=True,
        )
    )

    assert response["error_analysis"] is None


def test_function_backed_global_error_analysis_returns_targets_and_sample_summary() -> None:
    response = interpolate(
        InterpolateRequest(
            mode="x_values_with_function",
            x_values=["0", "1", "2"],
            function="x**3",
            methods=["lagrange", "newton", "barycentric"],
            evaluation_x=["3"],
            exact=True,
            analysis={"error": True, "sample_count": 25, "derivative_bound": "6"},
        )
    )

    analysis = response["error_analysis"]
    assert analysis["status"] == "ok"
    assert analysis["source_method"] == "lagrange"
    assert analysis["node_product"] == "x*(x - 2)*(x - 1)"
    assert analysis["derivative_bound"] == "6"
    target = analysis["target_errors"][0]
    assert target["x"] == "3"
    assert target["p_x"] == "6"
    assert target["f_x"] == "27"
    assert target["absolute_error"] == "21"
    assert target["inside_node_interval"] is False
    assert target["bound"] == "6"
    assert analysis["sample_summary"]["sample_count"] == 25
    assert analysis["sample_summary"]["max_abs_error"] is not None
    assert analysis["warnings"] == []
    assert analysis["steps"]


def test_point_only_error_analysis_is_partial_without_actual_error() -> None:
    response = interpolate(
        InterpolateRequest(
            mode="points",
            points=[["0", "0"], ["1", "1"], ["2", "4"]],
            methods=["lagrange"],
            evaluation_x=["3"],
            exact=True,
            analysis={"error": True},
        )
    )

    analysis = response["error_analysis"]
    assert analysis["status"] == "partial"
    assert analysis["target_errors"][0]["f_x"] is None
    assert analysis["target_errors"][0]["absolute_error"] is None
    assert analysis["warnings"][0]["code"] == "actual_error_requires_function"


def test_hermite_error_analysis_uses_repeated_node_multiplicity() -> None:
    response = interpolate(
        InterpolateRequest(
            mode="points",
            points=[["0", "1"], ["1", "4"]],
            methods=["hermite"],
            derivatives=[
                {"x": "0", "order": 1, "value": "2"},
                {"x": "1", "order": 1, "value": "4"},
            ],
            exact=True,
            analysis={"error": True},
        )
    )

    analysis = response["error_analysis"]
    assert analysis["status"] == "partial"
    assert analysis["source_method"] == "hermite"
    assert analysis["node_product"] == "x**2*(x - 1)**2"


def test_osculating_error_analysis_uses_confluent_multiplicity() -> None:
    response = interpolate(
        InterpolateRequest(
            mode="points",
            points=[["0", "1"], ["1", "4"]],
            methods=["osculating"],
            method_options={
                "osculating": {"orders": [{"x": "0", "order": 2}, {"x": "1", "order": 1}]}
            },
            derivatives=[
                {"x": "0", "order": 1, "value": "2"},
                {"x": "0", "order": 2, "value": "2"},
                {"x": "1", "order": 1, "value": "4"},
            ],
            exact=True,
            analysis={"error": True},
        )
    )

    analysis = response["error_analysis"]
    assert analysis["status"] == "partial"
    assert analysis["source_method"] == "osculating"
    assert sp.expand(sp.sympify(analysis["node_product"])) == sp.expand(sp.Symbol("x") ** 3 * (sp.Symbol("x") - 1) ** 2)
```

- [ ] **Step 2: Run tests and verify red**

Run from `backend/`:

```powershell
.\.venv\Scripts\python.exe -m pytest app/tests/test_error_analysis.py -q
```

Expected: FAIL because `error_analysis` is missing and `backend/app/core/error_analysis.py` does not exist.

- [ ] **Step 3: Add error analysis module**

Create `backend/app/core/error_analysis.py`:

```python
from __future__ import annotations

from typing import Any

import sympy as sp

from app.core.domain import InterpolationProblem
from app.core.methods.cubic_spline import evaluate_cubic_spline_result
from app.core.parser import X
from app.core.precision import format_value, to_sympy


GLOBAL_METHODS = {
    "lagrange",
    "newton",
    "barycentric",
    "hermite_divided_difference",
    "hermite",
    "osculating",
}


def build_error_analysis(
    problem: InterpolationProblem,
    *,
    raw_results: dict[str, dict[str, Any]],
    polynomial_source: dict[str, Any] | None,
) -> dict[str, Any] | None:
    if not problem.analysis.error:
        return None
    source_method = _source_method(raw_results, polynomial_source)
    if source_method == "taylor":
        return _taylor_analysis(problem, raw_results.get("taylor", {}))
    if source_method == "cubic_spline" or (
        source_method is None and raw_results.get("cubic_spline", {}).get("segment_polynomials")
    ):
        return _spline_analysis(problem, raw_results.get("cubic_spline", {}))
    return _global_analysis(problem, raw_results, polynomial_source, source_method)


def _source_method(
    raw_results: dict[str, dict[str, Any]],
    polynomial_source: dict[str, Any] | None,
) -> str | None:
    if polynomial_source is None:
        return None
    for method, result in raw_results.items():
        if result is polynomial_source:
            return method
    return None


def _global_analysis(
    problem: InterpolationProblem,
    raw_results: dict[str, dict[str, Any]],
    polynomial_source: dict[str, Any] | None,
    source_method: str | None,
) -> dict[str, Any]:
    warnings: list[dict[str, Any]] = []
    if polynomial_source is None or polynomial_source.get("polynomial") is None:
        return _partial_without_polynomial()
    polynomial = polynomial_source["polynomial"]
    factors = _node_product_factors(problem, raw_results, source_method)
    node_product = sp.prod(X - factor for factor in factors)
    degree = int(polynomial_source.get("degree", len(factors) - 1))
    derivative_order = degree + 1
    if problem.original_function is None:
        warnings.append(_actual_error_requires_function())
    target_errors = _target_errors(problem, polynomial=polynomial, node_product=node_product)
    sample_summary = (
        _sample_summary(problem, evaluator=lambda value: sp.N(polynomial.subs(X, value), problem.precision))
        if problem.original_function is not None
        else None
    )
    return {
        "status": "partial" if warnings else "ok",
        "source_method": source_method,
        "remainder_formula": (
            f"f^({derivative_order})(xi)/{derivative_order}! * "
            f"{sp.sstr(node_product)}"
        ),
        "latex_remainder_formula": (
            "\\frac{f^{(" + str(derivative_order) + ")}(\\xi)}{"
            + str(derivative_order)
            + "!}"
            + sp.latex(node_product)
        ),
        "node_product": sp.sstr(node_product),
        "latex_node_product": sp.latex(node_product),
        "derivative_bound": problem.analysis.derivative_bound_text,
        "bound_formula": _bound_formula(problem, node_product=node_product, derivative_order=derivative_order),
        "target_errors": target_errors,
        "sample_summary": sample_summary,
        "warnings": warnings,
        "steps": [
            "Select the successful polynomial source used by the backend response.",
            "Build the node-product factor from the interpolation constraints.",
            "Use the classical interpolation remainder form for global polynomial interpolation.",
            "Evaluate actual error only when the original function is known.",
        ],
    }


def _node_product_factors(
    problem: InterpolationProblem,
    raw_results: dict[str, dict[str, Any]],
    source_method: str | None,
) -> list[sp.Expr]:
    if source_method in {"hermite", "hermite_divided_difference"}:
        repeated_nodes = raw_results.get(source_method, {}).get("repeated_nodes", [])
        factors = [to_sympy(item["x"], exact=problem.exact, precision=problem.precision) for item in repeated_nodes]
        if factors:
            return factors
    if source_method == "osculating":
        repeated_nodes = raw_results.get("osculating", {}).get("repeated_nodes", [])
        factors = [to_sympy(item["x"], exact=problem.exact, precision=problem.precision) for item in repeated_nodes]
        if factors:
            return factors
    return [node.x for node in problem.nodes]


def _target_errors(
    problem: InterpolationProblem,
    *,
    polynomial: sp.Expr,
    node_product: sp.Expr,
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    node_xs = [node.x for node in problem.nodes]
    left = min(node_xs)
    right = max(node_xs)
    for target_text in problem.evaluation_x:
        target = to_sympy(target_text, exact=problem.exact, precision=problem.precision)
        p_value = sp.simplify(polynomial.subs(X, target))
        f_value = None
        absolute_error = None
        if problem.original_function is not None:
            f_value = sp.simplify(problem.original_function.subs(X, target))
            absolute_error = abs(f_value - p_value)
        rows.append(
            {
                "x": format_value(target, precision=problem.precision) or target_text,
                "p_x": format_value(p_value, precision=problem.precision),
                "f_x": format_value(f_value, precision=problem.precision) if f_value is not None else None,
                "absolute_error": (
                    format_value(absolute_error, precision=problem.precision)
                    if absolute_error is not None
                    else None
                ),
                "inside_node_interval": bool(left <= target <= right),
                "bound": _bound_at(problem, node_product=node_product, target=target),
            }
        )
    return rows


def _sample_summary(problem: InterpolationProblem, *, evaluator) -> dict[str, Any]:
    node_xs = [node.x for node in problem.nodes]
    left = min(node_xs)
    right = max(node_xs)
    sample_count = problem.analysis.sample_count
    step = sp.simplify((right - left) / (sample_count - 1))
    max_error = None
    max_x = None
    for index in range(sample_count):
        x_value = sp.N(left + step * index, problem.precision)
        p_value = evaluator(x_value)
        f_value = sp.simplify(problem.original_function.subs(X, x_value))
        error = abs(f_value - p_value)
        if max_error is None or error > max_error:
            max_error = error
            max_x = x_value
    return {
        "sample_count": sample_count,
        "max_abs_error": format_value(max_error, precision=problem.precision),
        "max_error_x": format_value(max_x, precision=problem.precision),
        "interval": [
            format_value(left, precision=problem.precision),
            format_value(right, precision=problem.precision),
        ],
    }


def _bound_formula(
    problem: InterpolationProblem,
    *,
    node_product: sp.Expr,
    derivative_order: int,
) -> str | None:
    if problem.analysis.derivative_bound is None:
        return None
    bound_expr = sp.simplify(
        problem.analysis.derivative_bound * sp.Abs(node_product) / sp.factorial(derivative_order)
    )
    return sp.sstr(bound_expr)


def _bound_at(
    problem: InterpolationProblem,
    *,
    node_product: sp.Expr,
    target: sp.Expr,
) -> str | None:
    if problem.analysis.derivative_bound is None:
        return None
    derivative_order = sp.Poly(node_product, X).degree()
    value = sp.simplify(
        problem.analysis.derivative_bound
        * abs(node_product.subs(X, target))
        / sp.factorial(derivative_order)
    )
    return format_value(value, precision=problem.precision)


def _partial_without_polynomial() -> dict[str, Any]:
    return {
        "status": "partial",
        "source_method": None,
        "remainder_formula": None,
        "latex_remainder_formula": None,
        "node_product": None,
        "latex_node_product": None,
        "derivative_bound": None,
        "bound_formula": None,
        "target_errors": [],
        "sample_summary": None,
        "warnings": [
            {
                "code": "error_analysis_requires_polynomial",
                "message": "Error analysis requires a successful polynomial source.",
                "details": {},
            }
        ],
        "steps": [],
    }


def _actual_error_requires_function() -> dict[str, Any]:
    return {
        "code": "actual_error_requires_function",
        "message": "Actual error values require a known original function.",
        "details": {},
    }
```

- [ ] **Step 4: Wire service response**

In `backend/app/core/service.py`, add the import:

```python
from app.core.error_analysis import build_error_analysis
```

Then add `error_analysis` to the response dict after `graph_data`:

```python
"error_analysis": build_error_analysis(
    problem,
    raw_results=raw_results,
    polynomial_source=polynomial_source,
),
```

- [ ] **Step 5: Run core tests and fix formatting mismatches**

Run from `backend/`:

```powershell
.\.venv\Scripts\python.exe -m pytest app/tests/test_error_analysis.py -q
```

Expected: PASS after adjusting only string formatting differences caused by SymPy ordering. Do not loosen assertions that check required fields or actual error values.

- [ ] **Step 6: Add API contract tests**

Append to `backend/app/tests/test_api.py`:

```python
def test_interpolate_error_analysis_contract_for_function_backed_request() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/interpolate",
        json={
            "mode": "x_values_with_function",
            "x_values": ["0", "1", "2"],
            "function": "x**3",
            "methods": ["lagrange", "newton"],
            "evaluation_x": ["3"],
            "exact": True,
            "analysis": {"error": True, "sample_count": 25, "derivative_bound": "6"},
        },
    )

    body = response.json()
    analysis = body["error_analysis"]

    assert response.status_code == 200
    assert analysis["status"] == "ok"
    assert analysis["target_errors"][0]["absolute_error"] == "21"
    assert analysis["sample_summary"]["sample_count"] == 25


def test_interpolate_rejects_invalid_analysis_derivative_bound() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/interpolate",
        json={
            "mode": "points",
            "points": [["0", "0"], ["1", "1"]],
            "methods": ["lagrange"],
            "analysis": {"error": True, "derivative_bound": "not-a-number"},
        },
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "non_real_value"
```

- [ ] **Step 7: Run targeted backend tests**

Run from `backend/`:

```powershell
.\.venv\Scripts\python.exe -m pytest app/tests/test_error_analysis.py app/tests/test_api.py app/tests/test_schemas.py -q
```

Expected: PASS.

- [ ] **Step 8: Commit Task 2**

```powershell
git add backend/app/core/error_analysis.py backend/app/core/service.py backend/app/tests/test_error_analysis.py backend/app/tests/test_api.py
git commit -m "feat: add global error analysis"
```

## Task 3: Taylor And Cubic Spline Analysis Paths

**Files:**
- Modify: `backend/app/core/error_analysis.py`
- Test: `backend/app/tests/test_error_analysis.py`

- [ ] **Step 1: Add failing Taylor and spline tests**

Append to `backend/app/tests/test_error_analysis.py`:

```python
def test_taylor_error_analysis_uses_taylor_language() -> None:
    response = interpolate(
        InterpolateRequest(
            mode="x_values_with_function",
            x_values=["0", "1"],
            function="exp(x)",
            methods=["taylor"],
            method_options={"taylor": {"center": "0", "order": 2}},
            evaluation_x=["1"],
            exact=True,
            analysis={"error": True, "sample_count": 25},
        )
    )

    analysis = response["error_analysis"]
    assert analysis["status"] == "ok"
    assert analysis["source_method"] == "taylor"
    assert "Taylor" in analysis["remainder_formula"]
    assert analysis["node_product"] is None
    assert analysis["target_errors"][0]["p_x"] == "5/2"
    assert analysis["target_errors"][0]["f_x"] == "E"
    assert analysis["sample_summary"]["sample_count"] == 25


def test_cubic_spline_error_analysis_returns_piecewise_notes() -> None:
    response = interpolate(
        InterpolateRequest(
            mode="x_values_with_function",
            x_values=["0", "1", "2"],
            function="x**3",
            methods=["cubic_spline"],
            method_options={"cubic_spline": {"boundary_condition": "natural"}},
            evaluation_x=["1/2"],
            exact=True,
            analysis={"error": True, "sample_count": 25},
        )
    )

    analysis = response["error_analysis"]
    assert analysis["status"] == "ok"
    assert analysis["source_method"] == "cubic_spline"
    assert analysis["remainder_formula"] is None
    assert analysis["node_product"] is None
    assert analysis["target_errors"][0]["absolute_error"] is not None
    assert any("piecewise" in step.lower() for step in analysis["steps"])
```

- [ ] **Step 2: Run tests and verify red**

Run from `backend/`:

```powershell
.\.venv\Scripts\python.exe -m pytest app/tests/test_error_analysis.py::test_taylor_error_analysis_uses_taylor_language app/tests/test_error_analysis.py::test_cubic_spline_error_analysis_returns_piecewise_notes -q
```

Expected: FAIL because `_taylor_analysis` and `_spline_analysis` are not implemented.

- [ ] **Step 3: Implement Taylor and spline helpers**

Add these functions to `backend/app/core/error_analysis.py`:

```python
def _taylor_analysis(problem: InterpolationProblem, taylor_result: dict[str, Any]) -> dict[str, Any]:
    polynomial = taylor_result.get("polynomial")
    order = int(taylor_result.get("order", 0))
    center = taylor_result.get("center")
    warnings = [] if problem.original_function is not None else [_actual_error_requires_function()]
    target_errors = (
        _target_errors(problem, polynomial=polynomial, node_product=sp.Integer(1))
        if polynomial is not None
        else []
    )
    sample_summary = (
        _sample_summary(problem, evaluator=lambda value: sp.N(polynomial.subs(X, value), problem.precision))
        if problem.original_function is not None and polynomial is not None
        else None
    )
    return {
        "status": "partial" if warnings else "ok",
        "source_method": "taylor",
        "remainder_formula": (
            f"Taylor remainder: f^({order + 1})(xi)/{order + 1}! * (x - {center})^({order + 1})"
        ),
        "latex_remainder_formula": (
            "\\frac{f^{(" + str(order + 1) + ")}(\\xi)}{"
            + str(order + 1)
            + "!}(x-"
            + str(center)
            + ")^{"
            + str(order + 1)
            + "}"
        ),
        "node_product": None,
        "latex_node_product": None,
        "derivative_bound": problem.analysis.derivative_bound_text,
        "bound_formula": None,
        "target_errors": target_errors,
        "sample_summary": sample_summary,
        "warnings": warnings,
        "steps": [
            "Use Taylor's theorem at the configured expansion center.",
            "Compare the Taylor polynomial with the original function when the function is known.",
            "Do not treat Taylor analysis as interpolation through multiple nodes.",
        ],
    }
```

Add this helper:

```python
def _spline_analysis(problem: InterpolationProblem, spline_result: dict[str, Any]) -> dict[str, Any]:
    warnings = [] if problem.original_function is not None else [_actual_error_requires_function()]
    target_errors = _spline_target_errors(problem, spline_result)
    sample_summary = (
        _sample_summary(
            problem,
            evaluator=lambda value: evaluate_cubic_spline_result(spline_result, value),
        )
        if problem.original_function is not None and spline_result.get("segment_polynomials")
        else None
    )
    return {
        "status": "partial" if warnings else "ok",
        "source_method": "cubic_spline",
        "remainder_formula": None,
        "latex_remainder_formula": None,
        "node_product": None,
        "latex_node_product": None,
        "derivative_bound": problem.analysis.derivative_bound_text,
        "bound_formula": None,
        "target_errors": target_errors,
        "sample_summary": sample_summary,
        "warnings": warnings,
        "steps": [
            "Cubic spline error is piecewise and depends on the selected boundary condition.",
            "The backend compares spline segment values with the original function when available.",
            "No single global interpolation remainder formula is reported for splines.",
        ],
    }


def _spline_target_errors(
    problem: InterpolationProblem,
    spline_result: dict[str, Any],
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    node_xs = [node.x for node in problem.nodes]
    left = min(node_xs)
    right = max(node_xs)
    for target_text in problem.evaluation_x:
        target = to_sympy(target_text, exact=problem.exact, precision=problem.precision)
        p_value = evaluate_cubic_spline_result(spline_result, target)
        f_value = None
        absolute_error = None
        if problem.original_function is not None:
            f_value = sp.simplify(problem.original_function.subs(X, target))
            absolute_error = abs(f_value - p_value)
        rows.append(
            {
                "x": format_value(target, precision=problem.precision) or target_text,
                "p_x": format_value(p_value, precision=problem.precision),
                "f_x": format_value(f_value, precision=problem.precision) if f_value is not None else None,
                "absolute_error": (
                    format_value(absolute_error, precision=problem.precision)
                    if absolute_error is not None
                    else None
                ),
                "inside_node_interval": bool(left <= target <= right),
                "bound": None,
            }
        )
    return rows
```

- [ ] **Step 4: Run Taylor/spline tests**

Run from `backend/`:

```powershell
.\.venv\Scripts\python.exe -m pytest app/tests/test_error_analysis.py -q
```

Expected: PASS.

- [ ] **Step 5: Commit Task 3**

```powershell
git add backend/app/core/error_analysis.py backend/app/tests/test_error_analysis.py
git commit -m "feat: add method-specific error analysis"
```

## Task 4: Frontend Types, Form State, And Request Builder

**Files:**
- Modify: `frontend/src/lib/api-types.ts`
- Modify: `frontend/src/components/InputPanel.tsx`
- Create: `frontend/src/components/ErrorAnalysisConfigBlock.tsx`
- Modify: `frontend/src/lib/interpolate-request.ts`
- Test: `frontend/src/components/InputPanel.MethodConfig.test.tsx`

- [ ] **Step 1: Add failing frontend request tests**

In `frontend/src/components/InputPanel.MethodConfig.test.tsx`, update `makeForm` to include:

```ts
analysisEnabled: false,
analysisSampleCount: 101,
analysisDerivativeBound: "",
```

Append these tests:

```ts
it("renders Error Analysis controls and emits local form updates", () => {
  const onChange = vi.fn()
  render(<InputPanel form={makeForm({ analysisEnabled: true })} onChange={onChange} />)

  expect(screen.getByRole("heading", { name: "Error Analysis" })).toBeInTheDocument()
  expect(screen.getByLabelText("Enable error analysis")).toBeChecked()
  expect(screen.getByLabelText("Error sample count")).toHaveValue(101)
  expect(screen.getByLabelText("Derivative bound")).toHaveValue("")

  fireEvent.change(screen.getByLabelText("Error sample count"), { target: { value: "25" } })
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ analysisSampleCount: 25 }))

  fireEvent.change(screen.getByLabelText("Derivative bound"), { target: { value: "6" } })
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ analysisDerivativeBound: "6" }))
})

it("omits analysis from requests unless enabled", () => {
  const request = buildRequest(makeForm({ analysisEnabled: false }))

  expect(request.analysis).toBeUndefined()
})

it("sends analysis config without coercing derivative bound", () => {
  const request = buildRequest(
    makeForm({
      analysisEnabled: true,
      analysisSampleCount: 25,
      analysisDerivativeBound: "6/5",
    }),
  )

  expect(request.analysis).toEqual({
    error: true,
    sample_count: 25,
    derivative_bound: "6/5",
  })
})

it("omits blank derivative bound from analysis config", () => {
  const request = buildRequest(
    makeForm({
      analysisEnabled: true,
      analysisSampleCount: 101,
      analysisDerivativeBound: "   ",
    }),
  )

  expect(request.analysis).toEqual({
    error: true,
    sample_count: 101,
  })
})
```

- [ ] **Step 2: Run frontend tests and verify red**

Run from `frontend/`:

```powershell
npm test -- InputPanel.MethodConfig.test.tsx
```

Expected: FAIL because `FormState` and request types do not include analysis fields.

- [ ] **Step 3: Add API types**

In `frontend/src/lib/api-types.ts`, add:

```ts
export interface AnalysisOptions {
  error: boolean
  sample_count: number
  derivative_bound?: string
}

export interface ErrorAnalysisTarget {
  x: string
  p_x: string | null
  f_x: string | null
  absolute_error: string | null
  inside_node_interval: boolean
  bound: string | null
}

export interface ErrorAnalysisSampleSummary {
  sample_count: number
  max_abs_error: string | null
  max_error_x: string | null
  interval: [string | null, string | null]
}

export interface ErrorAnalysis {
  status: ResponseStatus
  source_method: string | null
  remainder_formula: string | null
  latex_remainder_formula: string | null
  node_product: string | null
  latex_node_product: string | null
  derivative_bound: string | null
  bound_formula: string | null
  target_errors: ErrorAnalysisTarget[]
  sample_summary: ErrorAnalysisSampleSummary | null
  warnings: WarningBody[]
  steps: string[]
}
```

Add to `InterpolateRequest`:

```ts
analysis?: AnalysisOptions
```

Add to `InterpolateResponse`:

```ts
error_analysis: ErrorAnalysis | null
```

- [ ] **Step 4: Add ErrorAnalysisConfigBlock component**

Create `frontend/src/components/ErrorAnalysisConfigBlock.tsx`:

```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface ErrorAnalysisConfigBlockProps {
  enabled: boolean
  sampleCount: number
  derivativeBound: string
  onEnabledChange: (enabled: boolean) => void
  onSampleCountChange: (sampleCount: number) => void
  onDerivativeBoundChange: (derivativeBound: string) => void
}

export default function ErrorAnalysisConfigBlock({
  enabled,
  sampleCount,
  derivativeBound,
  onEnabledChange,
  onSampleCountChange,
  onDerivativeBoundChange,
}: ErrorAnalysisConfigBlockProps) {
  return (
    <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h3 className="font-label text-foreground">Error Analysis</h3>
          <p className="text-xs text-muted-foreground">
            Return backend-computed remainder formulas and approximation error data
          </p>
        </div>
        <Switch
          id="error-analysis-toggle"
          aria-label="Enable error analysis"
          checked={enabled}
          onCheckedChange={onEnabledChange}
        />
      </div>

      {enabled && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="error-analysis-sample-count">Error sample count</Label>
            <Input
              id="error-analysis-sample-count"
              type="number"
              min={25}
              max={501}
              step={1}
              value={sampleCount}
              onChange={(event) => {
                const next = Number.parseInt(event.target.value, 10)
                onSampleCountChange(Number.isFinite(next) ? next : 101)
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="error-analysis-derivative-bound">Derivative bound</Label>
            <Input
              id="error-analysis-derivative-bound"
              value={derivativeBound}
              onChange={(event) => onDerivativeBoundChange(event.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Wire InputPanel state**

In `frontend/src/components/InputPanel.tsx`, import:

```ts
import ErrorAnalysisConfigBlock from "./ErrorAnalysisConfigBlock"
```

Add to `FormState`:

```ts
analysisEnabled: boolean
analysisSampleCount: number
analysisDerivativeBound: string
```

Render this block inside the Precision & Evaluation section after the graph toggle:

```tsx
<Separator />

<ErrorAnalysisConfigBlock
  enabled={form.analysisEnabled}
  sampleCount={form.analysisSampleCount}
  derivativeBound={form.analysisDerivativeBound}
  onEnabledChange={(analysisEnabled) => update({ analysisEnabled })}
  onSampleCountChange={(analysisSampleCount) => update({ analysisSampleCount })}
  onDerivativeBoundChange={(analysisDerivativeBound) =>
    update({ analysisDerivativeBound })
  }
/>
```

- [ ] **Step 6: Wire request builder**

In `frontend/src/lib/interpolate-request.ts`, after derivative handling, add:

```ts
if (form.analysisEnabled) {
  base.analysis = {
    error: true,
    sample_count: form.analysisSampleCount,
  }
  if (form.analysisDerivativeBound.trim() !== "") {
    base.analysis.derivative_bound = form.analysisDerivativeBound
  }
}
```

- [ ] **Step 7: Run frontend request tests**

Run from `frontend/`:

```powershell
npm test -- InputPanel.MethodConfig.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit Task 4**

```powershell
git add frontend/src/lib/api-types.ts frontend/src/components/InputPanel.tsx frontend/src/components/ErrorAnalysisConfigBlock.tsx frontend/src/lib/interpolate-request.ts frontend/src/components/InputPanel.MethodConfig.test.tsx
git commit -m "feat: add error analysis request controls"
```

## Task 5: Frontend Error Analysis Result Rendering

**Files:**
- Create: `frontend/src/components/results/ErrorAnalysisPanel.tsx`
- Modify: `frontend/src/components/ResultsPanel.tsx`
- Modify: `frontend/src/test/interpolate-response.fixtures.ts`
- Create: `frontend/src/components/results/ErrorAnalysisPanel.test.tsx`
- Modify: `frontend/src/components/results/results.smoke.test.tsx`

- [ ] **Step 1: Add error-analysis fixtures**

In `frontend/src/test/interpolate-response.fixtures.ts`, add `error_analysis: null` to existing fixture responses that satisfy `InterpolateResponse`.

Then export:

```ts
export const errorAnalysisResponse = {
  ...oneOverXResponse,
  error_analysis: {
    status: "ok",
    source_method: "lagrange",
    remainder_formula: "f^(3)(xi)/3! * (x - 2)*(x - 11/4)*(x - 4)",
    latex_remainder_formula: "\\frac{f^{(3)}(\\xi)}{3!}(x - 2)(x - 11/4)(x - 4)",
    node_product: "(x - 2)*(x - 11/4)*(x - 4)",
    latex_node_product: "(x - 2)(x - 11/4)(x - 4)",
    derivative_bound: "1",
    bound_formula: "Abs((x - 2)*(x - 11/4)*(x - 4))/6",
    target_errors: [
      {
        x: "3",
        p_x: "29/88",
        f_x: "1/3",
        absolute_error: "1/264",
        inside_node_interval: true,
        bound: "1/8",
      },
    ],
    sample_summary: {
      sample_count: 101,
      max_abs_error: "1/264",
      max_error_x: "3",
      interval: ["2", "4"],
    },
    warnings: [],
    steps: [
      "Select the successful polynomial source used by the backend response.",
      "Build the node-product factor from the interpolation constraints.",
    ],
  },
} satisfies InterpolateResponse

export const partialErrorAnalysisResponse = {
  ...linearPointsResponse,
  error_analysis: {
    status: "partial",
    source_method: "lagrange",
    remainder_formula: "f^(2)(xi)/2! * (x - 2)*(x - 5)",
    latex_remainder_formula: "\\frac{f^{(2)}(\\xi)}{2!}(x - 2)(x - 5)",
    node_product: "(x - 2)*(x - 5)",
    latex_node_product: "(x - 2)(x - 5)",
    derivative_bound: null,
    bound_formula: null,
    target_errors: [
      {
        x: "3",
        p_x: "3",
        f_x: null,
        absolute_error: null,
        inside_node_interval: true,
        bound: null,
      },
    ],
    sample_summary: null,
    warnings: [
      {
        code: "actual_error_requires_function",
        message: "Actual error values require a known original function.",
        details: {},
      },
    ],
    steps: ["Actual error requires function-backed input."],
  },
} satisfies InterpolateResponse
```

- [ ] **Step 2: Add failing renderer tests**

Create `frontend/src/components/results/ErrorAnalysisPanel.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { DisplayDigitsProvider } from "@/lib/display-digits"
import { ErrorAnalysisPanel } from "./ErrorAnalysisPanel"
import {
  errorAnalysisResponse,
  partialErrorAnalysisResponse,
} from "@/test/interpolate-response.fixtures"

function renderWithDisplay(ui: React.ReactElement) {
  return render(<DisplayDigitsProvider>{ui}</DisplayDigitsProvider>)
}

describe("ErrorAnalysisPanel", () => {
  it("renders formulas, target errors, and sample summary", () => {
    renderWithDisplay(<ErrorAnalysisPanel analysis={errorAnalysisResponse.error_analysis!} />)

    expect(screen.getByRole("heading", { name: "Error Analysis" })).toBeInTheDocument()
    expect(screen.getByText("Remainder Formula")).toBeInTheDocument()
    expect(screen.getByText("(x - 2)*(x - 11/4)*(x - 4)")).toBeInTheDocument()
    expect(screen.getByText("Maximum Sampled Error")).toBeInTheDocument()
    expect(screen.getAllByText("1/264").length).toBeGreaterThan(0)
    expect(screen.getByText("Inside interval")).toBeInTheDocument()
  })

  it("renders partial warnings without crashing", () => {
    renderWithDisplay(<ErrorAnalysisPanel analysis={partialErrorAnalysisResponse.error_analysis!} />)

    expect(screen.getByText("actual_error_requires_function")).toBeInTheDocument()
    expect(screen.getByText("Actual error values require a known original function.")).toBeInTheDocument()
    expect(screen.getByText("not available")).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run renderer tests and verify red**

Run from `frontend/`:

```powershell
npm test -- ErrorAnalysisPanel.test.tsx
```

Expected: FAIL because `ErrorAnalysisPanel` does not exist.

- [ ] **Step 4: Implement ErrorAnalysisPanel**

Create `frontend/src/components/results/ErrorAnalysisPanel.tsx`:

```tsx
import { AlertTriangle, Calculator } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ErrorNotice } from "@/components/ErrorNotice"
import { KatexDisplay } from "@/components/KatexDisplay"
import { useDisplayDigits } from "@/lib/display-digits"
import type { ErrorAnalysis } from "@/lib/api-types"

interface ErrorAnalysisPanelProps {
  analysis: ErrorAnalysis
}

export function ErrorAnalysisPanel({ analysis }: ErrorAnalysisPanelProps) {
  const { format, formatLiterals } = useDisplayDigits()

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calculator className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-foreground">Error Analysis</h2>
        </div>
        <Badge variant={analysis.status === "ok" ? "success" : "warning"} className="text-[10px]">
          {analysis.status}
        </Badge>
      </div>

      <div className="p-5 space-y-5">
        {analysis.warnings.length > 0 && (
          <div className="space-y-2">
            {analysis.warnings.map((warning, index) => (
              <ErrorNotice
                key={`${warning.code}-${index}`}
                code={warning.code}
                message={warning.message}
                severity="warning"
                layout="block"
              />
            ))}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <InfoBlock title="Source Method" value={analysis.source_method ?? "not available"} />
          <InfoBlock title="Derivative Bound" value={analysis.derivative_bound ?? "not available"} />
        </div>

        {analysis.remainder_formula && (
          <section className="space-y-2">
            <h3 className="font-label text-foreground">Remainder Formula</h3>
            {analysis.latex_remainder_formula ? (
              <KatexDisplay latex={analysis.latex_remainder_formula} block />
            ) : (
              <pre className="text-[11px] font-numeric bg-muted/30 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                {formatLiterals(analysis.remainder_formula)}
              </pre>
            )}
          </section>
        )}

        {analysis.node_product && (
          <section className="space-y-2">
            <h3 className="font-label text-foreground">Node Product</h3>
            <code className="block font-numeric text-[11px] bg-muted/30 rounded-lg p-4 break-all">
              {formatLiterals(analysis.node_product)}
            </code>
          </section>
        )}

        {analysis.sample_summary && (
          <section className="space-y-2">
            <h3 className="font-label text-foreground">Maximum Sampled Error</h3>
            <div className="grid gap-2 sm:grid-cols-3">
              <InfoBlock title="Max |error|" value={formatNullable(analysis.sample_summary.max_abs_error, format)} />
              <InfoBlock title="At x" value={formatNullable(analysis.sample_summary.max_error_x, format)} />
              <InfoBlock title="Samples" value={String(analysis.sample_summary.sample_count)} />
            </div>
          </section>
        )}

        {analysis.target_errors.length > 0 && (
          <section className="space-y-2">
            <h3 className="font-label text-foreground">Target Errors</h3>
            <div className="overflow-x-auto rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>x</TableHead>
                    <TableHead>P(x)</TableHead>
                    <TableHead>f(x)</TableHead>
                    <TableHead>|error|</TableHead>
                    <TableHead>Interval</TableHead>
                    <TableHead>Bound</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysis.target_errors.map((row, index) => (
                    <TableRow key={`${row.x}-${index}`}>
                      <TableCell className="font-numeric text-xs">{format(row.x)}</TableCell>
                      <TableCell className="font-numeric text-xs">{formatNullable(row.p_x, format)}</TableCell>
                      <TableCell className="font-numeric text-xs">{formatNullable(row.f_x, format)}</TableCell>
                      <TableCell className="font-numeric text-xs">{formatNullable(row.absolute_error, format)}</TableCell>
                      <TableCell>
                        {row.inside_node_interval ? "Inside interval" : "Outside interval"}
                      </TableCell>
                      <TableCell className="font-numeric text-xs">{formatNullable(row.bound, format)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        )}

        {analysis.steps.length > 0 && (
          <section className="space-y-2">
            <h3 className="font-label text-foreground">Analysis Steps</h3>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-muted-foreground leading-relaxed">
              {analysis.steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </div>
  )
}

function InfoBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/30 p-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        <AlertTriangle className="h-3 w-3" aria-hidden="true" />
        {title}
      </div>
      <div className="mt-1 font-numeric text-xs text-foreground break-all">{value}</div>
    </div>
  )
}

function formatNullable(value: string | null, format: (value: string) => string) {
  return value == null ? "not available" : format(value)
}
```

- [ ] **Step 5: Add ResultsPanel tab**

In `frontend/src/components/ResultsPanel.tsx`, import:

```ts
import { ErrorAnalysisPanel } from "./results/ErrorAnalysisPanel"
```

Add `Calculator` to the lucide import and extend the tab type:

```ts
type ResultTab = "overview" | "guide" | "polynomial" | "evaluations" | "graph" | "error" | "methods" | "notes"
```

Add this tab config before `methods`:

```tsx
{ id: "error", label: "Error", icon: <Calculator className="h-3.5 w-3.5" aria-hidden="true" /> },
```

Add:

```ts
const hasErrorAnalysis = data.error_analysis !== null
```

Update disabled logic in both places:

```ts
(target.id === "error" && !hasErrorAnalysis)
```

and:

```ts
(tab.id === "error" && !hasErrorAnalysis)
```

Add the panel:

```tsx
{hasErrorAnalysis && (
  <TabsPrimitive.Panel value="error" className="outline-none">
    <ErrorAnalysisPanel analysis={data.error_analysis!} />
  </TabsPrimitive.Panel>
)}
```

- [ ] **Step 6: Add smoke coverage**

Append to `frontend/src/components/results/results.smoke.test.tsx`:

```tsx
import { ErrorAnalysisPanel } from "./ErrorAnalysisPanel"
import { errorAnalysisResponse } from "@/test/interpolate-response.fixtures"

it("renders backend error analysis data", () => {
  renderWithDisplay(<ErrorAnalysisPanel analysis={errorAnalysisResponse.error_analysis!} />)

  expect(screen.getByText("Maximum Sampled Error")).toBeInTheDocument()
  expect(screen.getByText("Target Errors")).toBeInTheDocument()
})
```

- [ ] **Step 7: Run frontend renderer tests**

Run from `frontend/`:

```powershell
npm test -- ErrorAnalysisPanel.test.tsx results.smoke.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit Task 5**

```powershell
git add frontend/src/components/results/ErrorAnalysisPanel.tsx frontend/src/components/ResultsPanel.tsx frontend/src/test/interpolate-response.fixtures.ts frontend/src/components/results/ErrorAnalysisPanel.test.tsx frontend/src/components/results/results.smoke.test.tsx
git commit -m "feat: render error analysis results"
```

## Task 6: Contract Docs And Coordination Files

**Files:**
- Modify: `docs/API_CONTRACT.md`
- Modify: `docs/FRONTEND_HANDOFF.md`
- Modify: `docs/PLAN.md`
- Modify: `docs/HANDOFF.md`

- [ ] **Step 1: Update API contract**

In `docs/API_CONTRACT.md`, add `analysis` to Shared Request Fields and document:

```markdown
### Error Analysis Options

`analysis` is optional. If omitted or if `analysis.error` is false, the response includes `"error_analysis": null`.

```json
{
  "analysis": {
    "error": true,
    "sample_count": 101,
    "derivative_bound": "1"
  }
}
```

Rules:

- `analysis.error` enables backend error analysis.
- `analysis.sample_count` is an integer from 25 through 501 and defaults to 101.
- `analysis.derivative_bound` is an optional numeric string.
- Actual error values require a known original function.
- Cubic spline analysis is piecewise and does not return a global interpolation remainder formula.
```

Add `error_analysis` to Success Response Shape:

```json
"error_analysis": null
```

Add a response subsection containing the shape from the spec.

- [ ] **Step 2: Update frontend handoff**

In `docs/FRONTEND_HANDOFF.md`, add:

```markdown
## Error Analysis Workbench

- Frontend may send `analysis` only when the user enables Error Analysis.
- Preserve `analysis.derivative_bound` as a string.
- Render `error_analysis` exactly as returned.
- Do not compute formulas, sampled errors, target errors, bounds, or spline analysis in React.
- If `error_analysis.status` is `partial`, show warnings and still render available fields.
```

- [ ] **Step 3: Update PLAN**

In `docs/PLAN.md`, add a milestone row:

```markdown
| Error Analysis Workbench | Completed locally 2026-06-05 | Added optional backend `analysis` request config, backend-owned `error_analysis` response data, frontend controls, result rendering, contract docs, and verification. |
```

- [ ] **Step 4: Update HANDOFF**

At the top of `docs/HANDOFF.md`, add:

```markdown
## Current Task
Error Analysis Workbench is complete locally. The feature adds optional backend-owned error analysis plus frontend controls/rendering. No public endpoint paths were added.

Files changed:

- `backend/app/schemas.py`
- `backend/app/core/domain.py`
- `backend/app/core/normalization.py`
- `backend/app/core/error_analysis.py`
- `backend/app/core/service.py`
- `backend/app/tests/test_schemas.py`
- `backend/app/tests/test_error_analysis.py`
- `backend/app/tests/test_api.py`
- `frontend/src/lib/api-types.ts`
- `frontend/src/components/InputPanel.tsx`
- `frontend/src/components/ErrorAnalysisConfigBlock.tsx`
- `frontend/src/lib/interpolate-request.ts`
- `frontend/src/components/results/ErrorAnalysisPanel.tsx`
- `frontend/src/components/ResultsPanel.tsx`
- `frontend/src/test/interpolate-response.fixtures.ts`
- `frontend/src/components/InputPanel.MethodConfig.test.tsx`
- `frontend/src/components/results/ErrorAnalysisPanel.test.tsx`
- `frontend/src/components/results/results.smoke.test.tsx`
- `docs/API_CONTRACT.md`
- `docs/FRONTEND_HANDOFF.md`
- `docs/PLAN.md`
- `docs/HANDOFF.md`

Verification:

- Record every command run and its observed result here after Task 7.
```

- [ ] **Step 5: Commit docs**

```powershell
git add docs/API_CONTRACT.md docs/FRONTEND_HANDOFF.md docs/PLAN.md docs/HANDOFF.md
git commit -m "docs: document error analysis workbench"
```

## Task 7: Full Verification And Browser Smoke

**Files:**
- Modify only if verification exposes a real defect.
- Update: `docs/HANDOFF.md`

- [ ] **Step 1: Run backend verification**

Run from `backend/`:

```powershell
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m ruff check .
```

Expected: pytest PASS, Ruff PASS.

- [ ] **Step 2: Run frontend verification**

Run from `frontend/`:

```powershell
npm test
npm run lint
npm run build
```

Expected: Vitest PASS, lint PASS, build PASS. The existing Vite large-chunk advisory is acceptable if unchanged.

- [ ] **Step 3: Run local browser smoke**

Start backend from `backend/`:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Start frontend from `frontend/`:

```powershell
npm run dev -- --host 127.0.0.1
```

Use the in-app browser at the shown Vite URL and verify:

- Function-backed global interpolation with Error Analysis enabled renders the Error tab.
- Taylor with Error Analysis enabled renders Taylor remainder language.
- Point-only Lagrange with Error Analysis enabled renders partial warning `actual_error_requires_function`.
- Cubic spline with Error Analysis enabled renders piecewise spline notes.

- [ ] **Step 4: Update HANDOFF with actual results**

Replace the initial verification note added in Task 6 with the exact commands and observed results:

```markdown
Verification:

| Command / Check | Result |
|---|---|
| `.\.venv\Scripts\python.exe -m pytest` from `backend/` | PASS or FAIL with exact summary. |
| `.\.venv\Scripts\python.exe -m ruff check .` from `backend/` | PASS or FAIL with exact summary. |
| `npm test` from `frontend/` | PASS or FAIL with exact summary. |
| `npm run lint` from `frontend/` | PASS or FAIL with exact summary. |
| `npm run build` from `frontend/` | PASS or FAIL with exact summary. |
| Browser smoke: global interpolation analysis | PASS or FAIL with observation. |
| Browser smoke: Taylor analysis | PASS or FAIL with observation. |
| Browser smoke: point-only partial analysis | PASS or FAIL with observation. |
| Browser smoke: cubic spline analysis | PASS or FAIL with observation. |
```

- [ ] **Step 5: Commit verification docs**

```powershell
git add docs/HANDOFF.md
git commit -m "docs: record error analysis verification"
```

## Self-Review

Spec coverage:

- Optional request block: Task 1 and Task 4.
- Backend-owned formulas/error/sample summary: Task 2 and Task 3.
- Function-known actual errors: Task 2 and Task 3.
- Point-only partial behavior: Task 2 and Task 5.
- Hermite/Osculating repeated multiplicity: Task 2.
- Taylor-specific language: Task 3 and Task 5.
- Cubic-spline-specific notes: Task 3 and Task 5.
- Frontend controls and rendering: Task 4 and Task 5.
- Docs and verification: Task 6 and Task 7.

Placeholder scan:

- The implementation tasks do not contain incomplete markers or unspecified "add tests" instructions. The one HANDOFF section intentionally says to replace a verification note after actual verification because exact results cannot be known before execution.

Type consistency:

- Backend request field is `analysis`; frontend request field is `analysis`.
- Backend response field is `error_analysis`; frontend response field is `error_analysis`.
- Analysis option names use backend JSON casing: `sample_count`, `derivative_bound`.
- Frontend form state uses camelCase: `analysisEnabled`, `analysisSampleCount`, `analysisDerivativeBound`.
