# Interpolation Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the backend-only FastAPI interpolation service, tested pure math engine, stable JSON contract, and handoff documentation for the Numerical Analysis interpolation program.

**Architecture:** FastAPI and Pydantic stay at the API boundary. All three input modes normalize into a canonical interpolation problem before pure method modules run. Barycentric is the default numerical evaluator, while Lagrange, Newton, and Neville provide educational method output.

**Tech Stack:** Python 3.11+, FastAPI, Pydantic, SymPy, mpmath, SciPy, pytest, ruff, PowerShell verification commands.

---

## File Structure

Create and maintain these files:

- `backend/pyproject.toml` - package metadata, runtime dependencies, test and lint configuration.
- `backend/README.md` - backend setup, endpoint examples, method notes, limitations, frontend consumption notes.
- `backend/app/__init__.py` - package marker.
- `backend/app/main.py` - FastAPI app factory and route registration.
- `backend/app/api/__init__.py` - API package marker.
- `backend/app/api/routes.py` - `GET /health`, `POST /api/interpolate`, and `POST /api/validate-function`.
- `backend/app/schemas.py` - Pydantic request and response models only.
- `backend/app/core/__init__.py` - core package marker.
- `backend/app/core/domain.py` - internal dataclasses and typed dictionaries for normalized problems and method results.
- `backend/app/core/errors.py` - stable error codes, warning codes, and project exceptions.
- `backend/app/core/parser.py` - restricted SymPy function parser shared by both API endpoints.
- `backend/app/core/precision.py` - numeric conversion, formatting, tolerance, and comparison policy.
- `backend/app/core/validation.py` - duplicate node checks, interval checks, method checks, non-real checks, and warnings.
- `backend/app/core/normalization.py` - converts all request modes into canonical nodes and metadata.
- `backend/app/core/methods/__init__.py` - method package exports.
- `backend/app/core/methods/lagrange.py` - Lagrange basis, summation form, symbolic forms, and evaluations.
- `backend/app/core/methods/newton.py` - divided-difference table, coefficients, Newton form, and evaluations.
- `backend/app/core/methods/barycentric.py` - barycentric weights and stable evaluation.
- `backend/app/core/methods/neville.py` - target-specific Neville tables.
- `backend/app/core/graph_data.py` - graph-ready arrays generated from a stable evaluator.
- `backend/app/core/explanations.py` - fixed educational notes.
- `backend/app/core/service.py` - orchestration and response assembly.
- `backend/app/tests/test_health.py` - health endpoint smoke test.
- `backend/app/tests/test_schemas.py` - schema and response model tests.
- `backend/app/tests/test_precision.py` - precision and tolerance tests.
- `backend/app/tests/test_parser.py` - safe parser and endpoint consistency tests.
- `backend/app/tests/test_normalization.py` - input-mode normalization tests.
- `backend/app/tests/test_validation.py` - validation and warning tests.
- `backend/app/tests/test_lagrange.py` - Lagrange golden tests.
- `backend/app/tests/test_newton.py` - Newton table and coefficient tests.
- `backend/app/tests/test_barycentric.py` - barycentric weights and exact-node tests.
- `backend/app/tests/test_neville.py` - Neville target table tests.
- `backend/app/tests/test_graph_data.py` - graph array and domain-failure tests.
- `backend/app/tests/test_api.py` - `/api/interpolate` and `/api/validate-function` contract tests.
- `backend/scripts/verify-backend.ps1` - optional full verification wrapper.
- `docs/API_CONTRACT.md` - update if implemented response shape differs from the planned contract.
- `docs/FRONTEND_HANDOFF.md` - update if frontend-relevant behavior changes.
- `docs/HANDOFF.md` - update after each meaningful change group with files, commands, pass/fail status, and next step.
- `docs/PLAN.md` - update milestone statuses as implementation progresses.

## Task 1: Backend Package Scaffold And Health Endpoint

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`
- Create: `backend/app/api/__init__.py`
- Create: `backend/app/api/routes.py`
- Create: `backend/app/tests/test_health.py`
- Create: `backend/README.md`
- Modify: `docs/HANDOFF.md`
- Modify: `docs/PLAN.md`

- [ ] **Step 1: Write the failing health endpoint test**

Create `backend/app/tests/test_health.py`:

```python
from fastapi.testclient import TestClient

from app.main import app


def test_health_endpoint_returns_service_metadata() -> None:
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "interpolation-backend",
        "version": "0.1.0",
    }
```

- [ ] **Step 2: Add package metadata**

Create `backend/pyproject.toml`:

```toml
[project]
name = "interpolation-backend"
version = "0.1.0"
description = "FastAPI backend and numerical engine for interpolation methods"
requires-python = ">=3.11"
dependencies = [
  "fastapi>=0.111",
  "pydantic>=2.7",
  "sympy>=1.12",
  "mpmath>=1.3",
  "scipy>=1.12",
  "uvicorn[standard]>=0.29",
]

[project.optional-dependencies]
dev = [
  "pytest>=8.2",
  "httpx>=0.27",
  "ruff>=0.4",
]

[tool.pytest.ini_options]
testpaths = ["app/tests"]
pythonpath = ["."]

[tool.ruff]
line-length = 100
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "I", "UP", "B"]
```

- [ ] **Step 3: Add minimal FastAPI route implementation**

Create `backend/app/__init__.py`:

```python
"""Interpolation backend package."""
```

Create `backend/app/api/__init__.py`:

```python
"""API route package."""
```

Create `backend/app/api/routes.py`:

```python
from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "interpolation-backend",
        "version": "0.1.0",
    }
```

Create `backend/app/main.py`:

```python
from fastapi import FastAPI

from app.api.routes import router

app = FastAPI(title="Interpolation Backend", version="0.1.0")
app.include_router(router)
```

- [ ] **Step 4: Add initial README**

Create `backend/README.md`:

```markdown
# Interpolation Backend

FastAPI backend and numerical computation engine for a Numerical Analysis interpolation program.

## Scope

This repository owns backend math, validation, precision, tests, and JSON API contracts only. The React frontend is owned separately by Claude Opus.

## Planned Endpoints

- `GET /health`
- `POST /api/interpolate`
- `POST /api/validate-function`

## Verification

```powershell
python -m pip install -e ".[dev]"
python -m pytest
python -m ruff check .
```
```

- [ ] **Step 5: Run the health test**

Run:

```powershell
cd backend
python -m pytest app/tests/test_health.py -v
```

Expected: `1 passed`.

- [ ] **Step 6: Update coordination docs**

Update `docs/PLAN.md` milestone `Backend Scaffolding` to `In progress` or `Completed` depending on the test result. Update `docs/HANDOFF.md` with files created, command output, and test result.

- [ ] **Step 7: Commit scaffold**

Run:

```powershell
git add backend docs/HANDOFF.md docs/PLAN.md
git commit -m "feat: scaffold interpolation backend"
```

## Task 2: Schemas And Stable Response Models

**Files:**
- Create: `backend/app/schemas.py`
- Create: `backend/app/tests/test_schemas.py`
- Modify: `docs/HANDOFF.md`
- Modify: `docs/PLAN.md`

- [ ] **Step 1: Write schema tests**

Create `backend/app/tests/test_schemas.py`:

```python
import pytest
from pydantic import ValidationError

from app.schemas import InterpolateRequest, InterpolateResponse, MethodName


def test_points_request_accepts_numeric_strings() -> None:
    request = InterpolateRequest(
        mode="points",
        points=[["2", "4"], ["5", "1"]],
        methods=["lagrange", "newton", "barycentric"],
        precision=50,
        exact=True,
        evaluation_x=["3"],
    )

    assert request.mode == "points"
    assert request.points == [["2", "4"], ["5", "1"]]
    assert request.methods == ["lagrange", "newton", "barycentric"]


def test_invalid_method_rejected_by_schema() -> None:
    with pytest.raises(ValidationError):
        InterpolateRequest(mode="points", points=[["0", "0"], ["1", "1"]], methods=["bad"])


def test_response_model_accepts_ok_shape() -> None:
    response = InterpolateResponse(
        status="ok",
        response_version="1.0",
        metadata={"tolerance": {"abs_tol": "1e-46", "rel_tol": "1e-46", "precision_digits_used_for_comparison": 50}},
        input_summary={"mode": "points", "node_count": 2, "degree": 1},
        nodes=[{"index": 0, "x": "2", "y": "4"}, {"index": 1, "x": "5", "y": "1"}],
        degree=1,
        polynomial={"expanded": "-x + 6", "factored": "6 - x"},
        methods={},
        evaluations=[],
        graph_data=None,
        warnings=[],
        educational_notes=[],
    )

    assert response.status == "ok"


def test_method_literal_contains_required_methods() -> None:
    methods: set[MethodName] = {"lagrange", "newton", "barycentric", "neville"}

    assert methods == {"lagrange", "newton", "barycentric", "neville"}
```

- [ ] **Step 2: Run schema tests and verify failure**

Run:

```powershell
cd backend
python -m pytest app/tests/test_schemas.py -v
```

Expected before implementation: import failure for `app.schemas`.

- [ ] **Step 3: Implement request and response models**

Create `backend/app/schemas.py`:

```python
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

InputMode = Literal["points", "x_values_with_function", "function_interval"]
MethodName = Literal["lagrange", "newton", "barycentric", "neville"]
NodeStrategy = Literal["equally_spaced", "chebyshev_nodes", "custom_nodes"]
ResponseStatus = Literal["ok", "partial", "error"]


class InterpolateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    mode: InputMode
    points: list[list[str]] | None = None
    x_values: list[str] | None = None
    function: str | None = None
    interval: list[str] | None = None
    node_strategy: NodeStrategy | None = None
    node_count: int | None = None
    methods: list[MethodName] = Field(default_factory=lambda: ["lagrange", "newton", "barycentric"])
    precision: int = Field(default=50, ge=8, le=200)
    exact: bool | None = None
    evaluation_x: list[str] = Field(default_factory=list)
    graph: bool = False


class FunctionValidationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    function: str


class ErrorBody(BaseModel):
    code: str
    message: str
    details: dict[str, Any] = Field(default_factory=dict)


class WarningBody(BaseModel):
    code: str
    message: str
    details: dict[str, Any] = Field(default_factory=dict)


class ErrorResponse(BaseModel):
    status: Literal["error"] = "error"
    error: ErrorBody


class InterpolateResponse(BaseModel):
    status: ResponseStatus
    response_version: str = "1.0"
    metadata: dict[str, Any]
    input_summary: dict[str, Any]
    nodes: list[dict[str, Any]]
    degree: int
    polynomial: dict[str, Any]
    methods: dict[str, Any]
    evaluations: list[dict[str, Any]]
    graph_data: dict[str, Any] | None
    warnings: list[dict[str, Any]]
    educational_notes: list[str]


class FunctionValidationResponse(BaseModel):
    status: Literal["ok"] = "ok"
    function: str
    normalized_expression: str
    latex: str
    allowed_symbols: list[str]
```

- [ ] **Step 4: Run schema tests**

Run:

```powershell
cd backend
python -m pytest app/tests/test_schemas.py -v
```

Expected: all schema tests pass.

- [ ] **Step 5: Update coordination docs and commit**

Update `docs/PLAN.md` milestone `Core schemas and validation` to `In progress`. Update `docs/HANDOFF.md` with files changed and command results.

Run:

```powershell
git add backend/app/schemas.py backend/app/tests/test_schemas.py docs/HANDOFF.md docs/PLAN.md
git commit -m "feat: add interpolation API schemas"
```

## Task 3: Domain Objects, Error Codes, And Precision Policy

**Files:**
- Create: `backend/app/core/domain.py`
- Create: `backend/app/core/errors.py`
- Create: `backend/app/core/precision.py`
- Create: `backend/app/tests/test_precision.py`
- Modify: `docs/API_CONTRACT.md`
- Modify: `docs/HANDOFF.md`
- Modify: `docs/PLAN.md`

- [ ] **Step 1: Write precision tests**

Create `backend/app/tests/test_precision.py`:

```python
import sympy as sp

from app.core.precision import (
    comparison_tolerances,
    format_value,
    parse_numeric_string,
    values_close,
)


def test_parse_decimal_string_as_exact_rational() -> None:
    value = parse_numeric_string("2.75", exact=True, precision=50)

    assert value == sp.Rational(11, 4)


def test_parse_fraction_string_as_exact_rational() -> None:
    value = parse_numeric_string("1/3", exact=True, precision=50)

    assert value == sp.Rational(1, 3)


def test_high_precision_parse_keeps_decimal_string_precision() -> None:
    value = parse_numeric_string("0.123456789123456789", exact=False, precision=80)

    assert "0.123456789123456789" in format_value(value, precision=30)


def test_comparison_tolerance_leaves_four_guard_digits() -> None:
    tolerances = comparison_tolerances(30)

    assert tolerances["abs_tol"] == "1e-26"
    assert tolerances["rel_tol"] == "1e-26"
    assert tolerances["precision_digits_used_for_comparison"] == 30


def test_values_close_uses_absolute_or_relative_tolerance() -> None:
    assert values_close("1.00000000000000000000000001", "1.0", precision=30)
```

- [ ] **Step 2: Run precision tests and verify failure**

Run:

```powershell
cd backend
python -m pytest app/tests/test_precision.py -v
```

Expected before implementation: import failure for `app.core.precision`.

- [ ] **Step 3: Implement error codes and domain dataclasses**

Create `backend/app/core/errors.py`:

```python
from dataclasses import dataclass, field
from typing import Any

ERROR_CODES = {
    "duplicate_x",
    "too_few_nodes",
    "invalid_method",
    "invalid_interval",
    "invalid_node_count",
    "non_real_value",
    "unsafe_expression",
    "function_domain_error",
}

WARNING_CODES = {
    "close_x_warning",
    "high_degree_warning",
    "runge_warning",
    "extrapolation_warning",
    "method_disagreement_warning",
    "expanded_polynomial_omitted",
    "neville_requires_evaluation_x",
    "graph_sampling_domain_error",
    "method_failed",
}


@dataclass(slots=True)
class InterpolationError(Exception):
    code: str
    message: str
    details: dict[str, Any] = field(default_factory=dict)

    def to_response(self) -> dict[str, Any]:
        return {"status": "error", "error": {"code": self.code, "message": self.message, "details": self.details}}
```

Create `backend/app/core/domain.py`:

```python
from dataclasses import dataclass, field
from typing import Any, Callable

import sympy as sp


@dataclass(slots=True)
class Node:
    index: int
    x: sp.Expr
    y: sp.Expr
    x_text: str
    y_text: str


@dataclass(slots=True)
class InterpolationProblem:
    mode: str
    nodes: list[Node]
    methods: list[str]
    precision: int
    exact: bool
    evaluation_x: list[str]
    graph: bool
    original_function: sp.Expr | None = None
    function_evaluator: Callable[[sp.Expr], sp.Expr] | None = None
    node_strategy: str | None = None
    sorted_nodes: bool = False
    warnings: list[dict[str, Any]] = field(default_factory=list)


@dataclass(slots=True)
class MethodResult:
    status: str
    payload: dict[str, Any]
    warnings: list[dict[str, Any]] = field(default_factory=list)
    error: dict[str, Any] | None = None
```

- [ ] **Step 4: Implement precision policy**

Create `backend/app/core/precision.py`:

```python
from decimal import Decimal, localcontext
from typing import Any

import mpmath as mp
import sympy as sp


def parse_numeric_string(value: str, *, exact: bool, precision: int) -> sp.Expr | mp.mpf:
    text = value.strip()
    if exact:
        return sp.Rational(text)
    with mp.workdps(precision):
        return mp.mpf(text)


def to_sympy(value: sp.Expr | mp.mpf | str, *, exact: bool, precision: int) -> sp.Expr:
    if isinstance(value, sp.Basic):
        return value
    if isinstance(value, str):
        parsed = parse_numeric_string(value, exact=exact, precision=precision)
        return parsed if isinstance(parsed, sp.Basic) else sp.Float(str(parsed), precision)
    return sp.Float(str(value), precision)


def format_value(value: Any, *, precision: int) -> str:
    if value is None:
        return "null"
    if isinstance(value, sp.Basic):
        simplified = sp.simplify(value)
        if simplified.is_Rational and not simplified.is_Integer:
            return str(simplified)
        return str(sp.N(simplified, precision))
    with localcontext() as ctx:
        ctx.prec = max(precision, 8)
        return format(Decimal(str(value)), "g")


def comparison_tolerances(precision: int) -> dict[str, int | str]:
    comparison_digits = max(8, precision)
    exponent = -(comparison_digits - 4)
    tol = f"1e{exponent}"
    return {
        "abs_tol": tol,
        "rel_tol": tol,
        "precision_digits_used_for_comparison": comparison_digits,
    }


def values_close(left: Any, right: Any, *, precision: int) -> bool:
    tolerances = comparison_tolerances(precision)
    with mp.workdps(max(precision, 20)):
        a = mp.mpf(str(sp.N(left, precision))) if isinstance(left, sp.Basic) else mp.mpf(str(left))
        b = mp.mpf(str(sp.N(right, precision))) if isinstance(right, sp.Basic) else mp.mpf(str(right))
        abs_tol = mp.mpf(tolerances["abs_tol"])
        rel_tol = mp.mpf(tolerances["rel_tol"])
        diff = abs(a - b)
        return diff <= abs_tol or diff <= rel_tol * max(mp.mpf("1"), abs(a), abs(b))
```

- [ ] **Step 5: Run precision tests**

Run:

```powershell
cd backend
python -m pytest app/tests/test_precision.py -v
```

Expected: all precision tests pass.

- [ ] **Step 6: Update docs and commit**

Update `docs/API_CONTRACT.md` if tolerance metadata differs from the design spec. Update `docs/HANDOFF.md` and `docs/PLAN.md`.

Run:

```powershell
git add backend/app/core/domain.py backend/app/core/errors.py backend/app/core/precision.py backend/app/tests/test_precision.py docs
git commit -m "feat: add precision policy and core domain types"
```

## Task 4: Safe Function Parser

**Files:**
- Create: `backend/app/core/parser.py`
- Create: `backend/app/tests/test_parser.py`
- Modify: `docs/HANDOFF.md`
- Modify: `docs/PLAN.md`

- [ ] **Step 1: Write parser tests**

Create `backend/app/tests/test_parser.py`:

```python
import pytest

from app.core.errors import InterpolationError
from app.core.parser import parse_function


@pytest.mark.parametrize("expression", ["sin(x)", "cos(x)", "exp(x)", "log(x)", "ln(x)", "sqrt(x)", "abs(x)", "pi*x", "E**x"])
def test_allowed_function_expressions_parse(expression: str) -> None:
    parsed = parse_function(expression)

    assert parsed.symbol_name == "x"
    assert parsed.expression is not None


@pytest.mark.parametrize(
    "expression",
    [
        "__import__('os').system('dir')",
        "open('file')",
        "lambda x: x",
        "y + 1",
        "unknown_func(x)",
        "x.__class__",
    ],
)
def test_unsafe_or_unknown_expressions_rejected(expression: str) -> None:
    with pytest.raises(InterpolationError) as exc_info:
        parse_function(expression)

    assert exc_info.value.code == "unsafe_expression"
```

- [ ] **Step 2: Run parser tests and verify failure**

Run:

```powershell
cd backend
python -m pytest app/tests/test_parser.py -v
```

Expected before implementation: import failure for `app.core.parser`.

- [ ] **Step 3: Implement restricted SymPy parser**

Create `backend/app/core/parser.py`:

```python
from dataclasses import dataclass

import sympy as sp
from sympy.parsing.sympy_parser import (
    convert_xor,
    implicit_multiplication_application,
    parse_expr,
    standard_transformations,
)

from app.core.errors import InterpolationError

X = sp.Symbol("x", real=True)

ALLOWED_LOCALS = {
    "x": X,
    "sin": sp.sin,
    "cos": sp.cos,
    "tan": sp.tan,
    "exp": sp.exp,
    "log": sp.log,
    "ln": sp.log,
    "sqrt": sp.sqrt,
    "abs": sp.Abs,
    "asin": sp.asin,
    "acos": sp.acos,
    "atan": sp.atan,
    "sinh": sp.sinh,
    "cosh": sp.cosh,
    "tanh": sp.tanh,
    "pi": sp.pi,
    "E": sp.E,
}

TRANSFORMATIONS = standard_transformations + (implicit_multiplication_application, convert_xor)


@dataclass(frozen=True, slots=True)
class ParsedFunction:
    expression: sp.Expr
    symbol: sp.Symbol = X
    symbol_name: str = "x"

    def evaluate(self, value: sp.Expr) -> sp.Expr:
        result = self.expression.subs(self.symbol, value)
        simplified = sp.simplify(result)
        if simplified.is_real is False:
            raise InterpolationError(
                code="function_domain_error",
                message="Function evaluation produced a non-real value.",
                details={"x": str(value), "value": str(simplified)},
            )
        return simplified


def parse_function(expression_text: str) -> ParsedFunction:
    text = expression_text.strip()
    if not text:
        raise InterpolationError("unsafe_expression", "Function expression cannot be empty.", {})
    if any(token in text for token in ["__", "lambda", "=", ";", "[", "]", "{", "}"]):
        raise InterpolationError("unsafe_expression", "Function expression contains unsafe syntax.", {"expression": text})
    try:
        expression = parse_expr(
            text,
            local_dict=ALLOWED_LOCALS,
            global_dict={"__builtins__": {}},
            transformations=TRANSFORMATIONS,
            evaluate=True,
        )
    except Exception as exc:
        raise InterpolationError("unsafe_expression", "Function expression could not be parsed safely.", {"expression": text}) from exc
    if not isinstance(expression, sp.Basic):
        raise InterpolationError("unsafe_expression", "Function expression did not produce a symbolic expression.", {"expression": text})
    if expression.free_symbols - {X}:
        raise InterpolationError(
            "unsafe_expression",
            "Function expression contains unsupported symbols.",
            {"symbols": sorted(str(symbol) for symbol in expression.free_symbols - {X})},
        )
    for function in expression.atoms(sp.Function):
        if function.func not in {sp.sin, sp.cos, sp.tan, sp.exp, sp.log, sp.sqrt, sp.Abs, sp.asin, sp.acos, sp.atan, sp.sinh, sp.cosh, sp.tanh}:
            raise InterpolationError("unsafe_expression", "Function expression contains unsupported functions.", {"function": str(function.func)})
    return ParsedFunction(expression=expression)
```

- [ ] **Step 4: Run parser tests**

Run:

```powershell
cd backend
python -m pytest app/tests/test_parser.py -v
```

Expected: all parser tests pass.

- [ ] **Step 5: Update docs and commit**

Update `docs/HANDOFF.md` and `docs/PLAN.md`.

Run:

```powershell
git add backend/app/core/parser.py backend/app/tests/test_parser.py docs/HANDOFF.md docs/PLAN.md
git commit -m "feat: add safe function parser"
```

## Task 5: Validation And Normalization

**Files:**
- Create: `backend/app/core/validation.py`
- Create: `backend/app/core/normalization.py`
- Create: `backend/app/tests/test_validation.py`
- Create: `backend/app/tests/test_normalization.py`
- Modify: `docs/HANDOFF.md`
- Modify: `docs/PLAN.md`

- [ ] **Step 1: Write validation and normalization tests**

Create `backend/app/tests/test_validation.py`:

```python
import pytest

from app.core.errors import InterpolationError
from app.core.validation import validate_distinct_nodes, validate_methods


def test_duplicate_x_values_raise_hard_error() -> None:
    with pytest.raises(InterpolationError) as exc_info:
        validate_distinct_nodes(["2", "2"])

    assert exc_info.value.code == "duplicate_x"


def test_invalid_method_raises_hard_error() -> None:
    with pytest.raises(InterpolationError) as exc_info:
        validate_methods(["lagrange", "bad"])

    assert exc_info.value.code == "invalid_method"
```

Create `backend/app/tests/test_normalization.py`:

```python
from app.core.normalization import normalize_request
from app.schemas import InterpolateRequest


def test_points_mode_normalizes_to_nodes() -> None:
    request = InterpolateRequest(mode="points", points=[["2", "4"], ["5", "1"]], exact=True)

    problem = normalize_request(request)

    assert [(node.x_text, node.y_text) for node in problem.nodes] == [("2", "4"), ("5", "1")]


def test_x_values_with_function_normalizes_to_nodes() -> None:
    request = InterpolateRequest(
        mode="x_values_with_function",
        x_values=["2", "2.75", "4"],
        function="1/x",
        exact=True,
        evaluation_x=["3"],
    )

    problem = normalize_request(request)

    assert [node.x_text for node in problem.nodes] == ["2", "2.75", "4"]
    assert [node.y_text for node in problem.nodes] == ["1/2", "4/11", "1/4"]


def test_interval_mode_generates_equally_spaced_nodes() -> None:
    request = InterpolateRequest(
        mode="function_interval",
        function="sin(x)",
        interval=["-1", "1"],
        node_strategy="equally_spaced",
        node_count=3,
        exact=False,
    )

    problem = normalize_request(request)

    assert [node.x_text for node in problem.nodes] == ["-1.0", "0.0", "1.0"]
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
cd backend
python -m pytest app/tests/test_validation.py app/tests/test_normalization.py -v
```

Expected before implementation: import failures for validation and normalization modules.

- [ ] **Step 3: Implement validation**

Create `backend/app/core/validation.py`:

```python
from app.core.errors import InterpolationError

VALID_METHODS = {"lagrange", "newton", "barycentric", "neville"}


def validate_methods(methods: list[str]) -> None:
    invalid = [method for method in methods if method not in VALID_METHODS]
    if invalid:
        raise InterpolationError("invalid_method", "Unsupported interpolation method requested.", {"methods": invalid})


def validate_distinct_nodes(x_values: list[str]) -> None:
    seen: set[str] = set()
    duplicates: list[str] = []
    for value in x_values:
        if value in seen and value not in duplicates:
            duplicates.append(value)
        seen.add(value)
    if duplicates:
        raise InterpolationError("duplicate_x", "x-values must be distinct.", {"duplicates": duplicates})


def validate_minimum_nodes(count: int) -> None:
    if count < 2:
        raise InterpolationError("too_few_nodes", "At least two nodes are required.", {"node_count": count})


def validate_interval(interval: list[str] | None, node_count: int | None) -> None:
    if interval is None or len(interval) != 2:
        raise InterpolationError("invalid_interval", "Interval must contain exactly two values.", {"interval": interval})
    if node_count is None or node_count < 2:
        raise InterpolationError("invalid_node_count", "node_count must be at least 2.", {"node_count": node_count})
```

- [ ] **Step 4: Implement normalization**

Create `backend/app/core/normalization.py`:

```python
import sympy as sp

from app.core.domain import InterpolationProblem, Node
from app.core.errors import InterpolationError
from app.core.parser import parse_function
from app.core.precision import format_value, parse_numeric_string, to_sympy
from app.core.validation import (
    validate_distinct_nodes,
    validate_interval,
    validate_methods,
    validate_minimum_nodes,
)
from app.schemas import InterpolateRequest


def _effective_exact(request: InterpolateRequest) -> bool:
    if request.exact is not None:
        return request.exact
    return request.mode != "function_interval"


def _node(index: int, x_text: str, y_value: sp.Expr, *, exact: bool, precision: int) -> Node:
    x_value = to_sympy(x_text, exact=exact, precision=precision)
    y_text = str(y_value) if isinstance(y_value, sp.Rational) else format_value(y_value, precision=precision)
    return Node(index=index, x=x_value, y=y_value, x_text=x_text, y_text=y_text)


def _normalize_points(request: InterpolateRequest, *, exact: bool) -> list[Node]:
    if request.points is None:
        raise InterpolationError("too_few_nodes", "points mode requires points.", {})
    validate_minimum_nodes(len(request.points))
    x_values = [pair[0] for pair in request.points]
    validate_distinct_nodes(x_values)
    nodes: list[Node] = []
    for index, pair in enumerate(request.points):
        if len(pair) != 2:
            raise InterpolationError("too_few_nodes", "Each point must contain x and y values.", {"point": pair})
        x_text, y_text = pair
        y_value = to_sympy(y_text, exact=exact, precision=request.precision)
        nodes.append(_node(index, x_text, y_value, exact=exact, precision=request.precision))
    return nodes


def _normalize_x_values_with_function(request: InterpolateRequest, *, exact: bool) -> tuple[list[Node], sp.Expr]:
    if request.x_values is None or request.function is None:
        raise InterpolationError("too_few_nodes", "x_values_with_function mode requires x_values and function.", {})
    validate_minimum_nodes(len(request.x_values))
    validate_distinct_nodes(request.x_values)
    parsed = parse_function(request.function)
    nodes = []
    for index, x_text in enumerate(request.x_values):
        x_value = to_sympy(x_text, exact=exact, precision=request.precision)
        y_value = parsed.evaluate(x_value)
        nodes.append(_node(index, x_text, y_value, exact=exact, precision=request.precision))
    return nodes, parsed.expression


def _equally_spaced(a: sp.Expr, b: sp.Expr, count: int) -> list[sp.Expr]:
    if count == 2:
        return [a, b]
    step = (b - a) / (count - 1)
    return [sp.simplify(a + step * index) for index in range(count)]


def _normalize_interval(request: InterpolateRequest, *, exact: bool) -> tuple[list[Node], sp.Expr]:
    validate_interval(request.interval, request.node_count)
    if request.function is None:
        raise InterpolationError("unsafe_expression", "function_interval mode requires a function.", {})
    parsed = parse_function(request.function)
    a = to_sympy(request.interval[0], exact=exact, precision=request.precision)
    b = to_sympy(request.interval[1], exact=exact, precision=request.precision)
    if sp.N(a) >= sp.N(b):
        raise InterpolationError("invalid_interval", "Interval start must be less than interval end.", {"interval": request.interval})
    if request.node_strategy not in {None, "equally_spaced"}:
        raise InterpolationError("invalid_method", "Only equally_spaced interval nodes are planned for the first implementation slice.", {"node_strategy": request.node_strategy})
    x_values = _equally_spaced(a, b, request.node_count or 2)
    nodes = []
    for index, x_value in enumerate(x_values):
        y_value = parsed.evaluate(x_value)
        nodes.append(_node(index, str(float(sp.N(x_value))), y_value, exact=exact, precision=request.precision))
    return nodes, parsed.expression


def normalize_request(request: InterpolateRequest) -> InterpolationProblem:
    validate_methods(request.methods)
    exact = _effective_exact(request)
    original_function = None
    if request.mode == "points":
        nodes = _normalize_points(request, exact=exact)
    elif request.mode == "x_values_with_function":
        nodes, original_function = _normalize_x_values_with_function(request, exact=exact)
    else:
        nodes, original_function = _normalize_interval(request, exact=exact)
    return InterpolationProblem(
        mode=request.mode,
        nodes=nodes,
        methods=request.methods,
        precision=request.precision,
        exact=exact,
        evaluation_x=request.evaluation_x,
        graph=request.graph,
        original_function=original_function,
        node_strategy=request.node_strategy,
    )
```

- [ ] **Step 5: Run normalization tests**

Run:

```powershell
cd backend
python -m pytest app/tests/test_validation.py app/tests/test_normalization.py -v
```

Expected: all validation and normalization tests pass.

- [ ] **Step 6: Update docs and commit**

Update `docs/HANDOFF.md` and `docs/PLAN.md`.

Run:

```powershell
git add backend/app/core/validation.py backend/app/core/normalization.py backend/app/tests/test_validation.py backend/app/tests/test_normalization.py docs/HANDOFF.md docs/PLAN.md
git commit -m "feat: normalize interpolation requests"
```

## Task 6: Lagrange And Newton Pure Math Modules

**Files:**
- Create: `backend/app/core/methods/__init__.py`
- Create: `backend/app/core/methods/lagrange.py`
- Create: `backend/app/core/methods/newton.py`
- Create: `backend/app/tests/test_lagrange.py`
- Create: `backend/app/tests/test_newton.py`
- Modify: `docs/HANDOFF.md`
- Modify: `docs/PLAN.md`

- [ ] **Step 1: Write Lagrange tests**

Create `backend/app/tests/test_lagrange.py`:

```python
import sympy as sp

from app.core.domain import Node
from app.core.methods.lagrange import build_lagrange


def test_lagrange_linear_example_expands_to_minus_x_plus_six() -> None:
    nodes = [
        Node(index=0, x=sp.Rational(2), y=sp.Rational(4), x_text="2", y_text="4"),
        Node(index=1, x=sp.Rational(5), y=sp.Rational(1), x_text="5", y_text="1"),
    ]

    result = build_lagrange(nodes, precision=50, evaluation_x=["3"])

    assert sp.expand(result["polynomial"]) == -sp.Symbol("x") + 6
    assert result["evaluations"][0]["value"] == "3.0000000000000000000000000000000000000000000000000"
    assert len(result["basis_polynomials"]) == 2
```

- [ ] **Step 2: Write Newton tests**

Create `backend/app/tests/test_newton.py`:

```python
import sympy as sp

from app.core.domain import Node
from app.core.methods.newton import build_newton


def test_newton_linear_example_coefficients() -> None:
    nodes = [
        Node(index=0, x=sp.Rational(2), y=sp.Rational(4), x_text="2", y_text="4"),
        Node(index=1, x=sp.Rational(5), y=sp.Rational(1), x_text="5", y_text="1"),
    ]

    result = build_newton(nodes, precision=50, evaluation_x=["3"])

    assert result["coefficients"] == ["4", "-1"]
    assert sp.expand(result["polynomial"]) == -sp.Symbol("x") + 6
    assert result["divided_difference_table"][0][0] == "4"
    assert result["divided_difference_table"][0][1] == "-1"
```

- [ ] **Step 3: Run tests and verify failure**

Run:

```powershell
cd backend
python -m pytest app/tests/test_lagrange.py app/tests/test_newton.py -v
```

Expected before implementation: import failures for method modules.

- [ ] **Step 4: Implement Lagrange**

Create `backend/app/core/methods/__init__.py`:

```python
"""Pure interpolation method modules."""
```

Create `backend/app/core/methods/lagrange.py`:

```python
import sympy as sp

from app.core.domain import Node
from app.core.precision import format_value, to_sympy

X = sp.Symbol("x")


def build_lagrange(nodes: list[Node], *, precision: int, evaluation_x: list[str]) -> dict[str, object]:
    basis_entries: list[dict[str, str | int]] = []
    polynomial = sp.Integer(0)
    summation_terms: list[str] = []
    for i, node_i in enumerate(nodes):
        basis = sp.Integer(1)
        for j, node_j in enumerate(nodes):
            if i != j:
                basis *= (X - node_j.x) / (node_i.x - node_j.x)
        expanded_basis = sp.expand(basis)
        polynomial += node_i.y * basis
        basis_entries.append(
            {
                "index": i,
                "x_i": node_i.x_text,
                "basis": str(basis),
                "expanded": str(expanded_basis),
                "latex": sp.latex(basis),
            }
        )
        summation_terms.append(f"({node_i.y_text})*({basis})")
    expanded = sp.expand(polynomial)
    evaluations = []
    for target in evaluation_x:
        target_value = to_sympy(target, exact=True, precision=precision)
        value = expanded.subs(X, target_value)
        evaluations.append({"x": target, "value": format_value(value, precision=precision)})
    return {
        "polynomial": expanded,
        "basis_polynomials": basis_entries,
        "summation_form": " + ".join(summation_terms),
        "expanded": str(expanded),
        "latex_expanded": sp.latex(expanded),
        "latex_lagrange": sp.latex(polynomial),
        "evaluations": evaluations,
        "steps": ["Construct each L_i(x) by multiplying factors (x - x_j)/(x_i - x_j)."],
    }
```

- [ ] **Step 5: Implement Newton**

Create `backend/app/core/methods/newton.py`:

```python
import sympy as sp

from app.core.domain import Node
from app.core.precision import format_value, to_sympy

X = sp.Symbol("x")


def _divided_differences(nodes: list[Node]) -> list[list[sp.Expr | None]]:
    n = len(nodes)
    table: list[list[sp.Expr | None]] = [[None for _ in range(n)] for _ in range(n)]
    for i, node in enumerate(nodes):
        table[i][0] = node.y
    for order in range(1, n):
        for row in range(n - order):
            numerator = table[row + 1][order - 1] - table[row][order - 1]
            denominator = nodes[row + order].x - nodes[row].x
            table[row][order] = sp.simplify(numerator / denominator)
    return table


def build_newton(nodes: list[Node], *, precision: int, evaluation_x: list[str]) -> dict[str, object]:
    table = _divided_differences(nodes)
    coefficients = [table[0][order] for order in range(len(nodes))]
    polynomial = coefficients[0]
    product = sp.Integer(1)
    terms = [str(coefficients[0])]
    for order in range(1, len(nodes)):
        product *= X - nodes[order - 1].x
        polynomial += coefficients[order] * product
        terms.append(f"({coefficients[order]})*({product})")
    expanded = sp.expand(polynomial)
    rendered_table = [
        [str(value) if value is not None else None for value in row]
        for row in table
    ]
    evaluations = []
    for target in evaluation_x:
        target_value = to_sympy(target, exact=True, precision=precision)
        value = expanded.subs(X, target_value)
        evaluations.append({"x": target, "value": format_value(value, precision=precision)})
    return {
        "polynomial": expanded,
        "divided_difference_table": rendered_table,
        "coefficients": [str(coefficient) for coefficient in coefficients],
        "nested_form": " + ".join(terms),
        "latex_newton": sp.latex(polynomial),
        "evaluations": evaluations,
        "steps": ["Compute divided differences by increasing order, then build Newton's product form."],
    }
```

- [ ] **Step 6: Run method tests**

Run:

```powershell
cd backend
python -m pytest app/tests/test_lagrange.py app/tests/test_newton.py -v
```

Expected: Lagrange and Newton tests pass.

- [ ] **Step 7: Update docs and commit**

Update `docs/HANDOFF.md` and `docs/PLAN.md`.

Run:

```powershell
git add backend/app/core/methods backend/app/tests/test_lagrange.py backend/app/tests/test_newton.py docs/HANDOFF.md docs/PLAN.md
git commit -m "feat: add lagrange and newton methods"
```

## Task 7: Barycentric And Neville Pure Math Modules

**Files:**
- Create: `backend/app/core/methods/barycentric.py`
- Create: `backend/app/core/methods/neville.py`
- Create: `backend/app/tests/test_barycentric.py`
- Create: `backend/app/tests/test_neville.py`
- Modify: `docs/HANDOFF.md`
- Modify: `docs/PLAN.md`

- [ ] **Step 1: Write Barycentric tests**

Create `backend/app/tests/test_barycentric.py`:

```python
import sympy as sp

from app.core.domain import Node
from app.core.methods.barycentric import build_barycentric


def test_barycentric_returns_exact_node_hit() -> None:
    nodes = [
        Node(index=0, x=sp.Rational(2), y=sp.Rational(4), x_text="2", y_text="4"),
        Node(index=1, x=sp.Rational(5), y=sp.Rational(1), x_text="5", y_text="1"),
    ]

    result = build_barycentric(nodes, precision=50, evaluation_x=["2", "3"])

    assert result["evaluations"][0]["value"] == "4"
    assert result["evaluations"][1]["value"] == "3.0000000000000000000000000000000000000000000000000"
    assert result["weights"] == [{"index": 0, "x": "2", "weight": "-1/3"}, {"index": 1, "x": "5", "weight": "1/3"}]
```

- [ ] **Step 2: Write Neville tests**

Create `backend/app/tests/test_neville.py`:

```python
import sympy as sp

from app.core.domain import Node
from app.core.methods.neville import build_neville


def test_neville_linear_example_target_result() -> None:
    nodes = [
        Node(index=0, x=sp.Rational(2), y=sp.Rational(4), x_text="2", y_text="4"),
        Node(index=1, x=sp.Rational(5), y=sp.Rational(1), x_text="5", y_text="1"),
    ]

    result = build_neville(nodes, precision=50, evaluation_x=["3"])

    assert result["target_results"] == [{"x": "3", "value": "3.0000000000000000000000000000000000000000000000000"}]
    assert result["tables"][0]["rows"][0][0] == "4"
    assert result["tables"][0]["rows"][0][1] == "3"
```

- [ ] **Step 3: Run tests and verify failure**

Run:

```powershell
cd backend
python -m pytest app/tests/test_barycentric.py app/tests/test_neville.py -v
```

Expected before implementation: import failures for method modules.

- [ ] **Step 4: Implement Barycentric**

Create `backend/app/core/methods/barycentric.py`:

```python
import sympy as sp

from app.core.domain import Node
from app.core.precision import format_value, to_sympy


def _weights(nodes: list[Node]) -> list[sp.Expr]:
    weights: list[sp.Expr] = []
    for i, node_i in enumerate(nodes):
        product = sp.Integer(1)
        for j, node_j in enumerate(nodes):
            if i != j:
                product *= node_i.x - node_j.x
        weights.append(sp.simplify(1 / product))
    return weights


def evaluate_barycentric(nodes: list[Node], target: sp.Expr) -> sp.Expr:
    for node in nodes:
        if sp.simplify(target - node.x) == 0:
            return node.y
    weights = _weights(nodes)
    numerator = sp.Integer(0)
    denominator = sp.Integer(0)
    for node, weight in zip(nodes, weights, strict=True):
        term = weight / (target - node.x)
        numerator += term * node.y
        denominator += term
    return sp.simplify(numerator / denominator)


def build_barycentric(nodes: list[Node], *, precision: int, evaluation_x: list[str]) -> dict[str, object]:
    weights = _weights(nodes)
    evaluations = []
    for target in evaluation_x:
        target_value = to_sympy(target, exact=True, precision=precision)
        value = evaluate_barycentric(nodes, target_value)
        evaluations.append({"x": target, "value": format_value(value, precision=precision)})
    return {
        "weights": [
            {"index": node.index, "x": node.x_text, "weight": str(weight)}
            for node, weight in zip(nodes, weights, strict=True)
        ],
        "evaluations": evaluations,
        "notes": ["Barycentric form is used as the default stable numerical evaluator."],
    }
```

- [ ] **Step 5: Implement Neville**

Create `backend/app/core/methods/neville.py`:

```python
import sympy as sp

from app.core.domain import Node
from app.core.precision import format_value, to_sympy


def _neville_table(nodes: list[Node], target: sp.Expr) -> list[list[sp.Expr | None]]:
    n = len(nodes)
    table: list[list[sp.Expr | None]] = [[None for _ in range(n)] for _ in range(n)]
    for i, node in enumerate(nodes):
        table[i][0] = node.y
    for order in range(1, n):
        for row in range(n - order):
            left = table[row + 1][order - 1]
            right = table[row][order - 1]
            numerator = (target - nodes[row].x) * left - (target - nodes[row + order].x) * right
            denominator = nodes[row + order].x - nodes[row].x
            table[row][order] = sp.simplify(numerator / denominator)
    return table


def build_neville(nodes: list[Node], *, precision: int, evaluation_x: list[str]) -> dict[str, object]:
    if not evaluation_x:
        return {
            "target_results": [],
            "tables": [],
            "warnings": [
                {
                    "code": "neville_requires_evaluation_x",
                    "message": "Neville's method requires target x-values.",
                    "details": {},
                }
            ],
        }
    tables = []
    target_results = []
    for target in evaluation_x:
        target_value = to_sympy(target, exact=True, precision=precision)
        table = _neville_table(nodes, target_value)
        rendered_rows = [[format_value(value, precision=precision) if value is not None else None for value in row] for row in table]
        result = table[0][len(nodes) - 1]
        target_results.append({"x": target, "value": format_value(result, precision=precision)})
        tables.append({"x": target, "rows": rendered_rows})
    return {"target_results": target_results, "tables": tables, "warnings": []}
```

- [ ] **Step 6: Run Barycentric and Neville tests**

Run:

```powershell
cd backend
python -m pytest app/tests/test_barycentric.py app/tests/test_neville.py -v
```

Expected: all Barycentric and Neville tests pass.

- [ ] **Step 7: Update docs and commit**

Update `docs/HANDOFF.md` and `docs/PLAN.md`.

Run:

```powershell
git add backend/app/core/methods/barycentric.py backend/app/core/methods/neville.py backend/app/tests/test_barycentric.py backend/app/tests/test_neville.py docs/HANDOFF.md docs/PLAN.md
git commit -m "feat: add barycentric and neville methods"
```

## Task 8: Graph Data, Educational Notes, And Service Orchestration

**Files:**
- Create: `backend/app/core/graph_data.py`
- Create: `backend/app/core/explanations.py`
- Create: `backend/app/core/service.py`
- Create: `backend/app/tests/test_graph_data.py`
- Modify: `backend/app/api/routes.py`
- Modify: `docs/API_CONTRACT.md`
- Modify: `docs/FRONTEND_HANDOFF.md`
- Modify: `docs/HANDOFF.md`
- Modify: `docs/PLAN.md`

- [ ] **Step 1: Write graph and service tests**

Create `backend/app/tests/test_graph_data.py`:

```python
from app.core.service import interpolate
from app.schemas import InterpolateRequest


def test_interpolate_points_returns_top_level_evaluation() -> None:
    request = InterpolateRequest(
        mode="points",
        points=[["2", "4"], ["5", "1"]],
        methods=["lagrange", "newton", "barycentric", "neville"],
        evaluation_x=["3"],
        exact=True,
    )

    response = interpolate(request)

    assert response["status"] == "ok"
    assert response["evaluations"][0]["best_method"] == "barycentric"
    assert response["evaluations"][0]["method_values"]["neville"] is not None


def test_graph_data_arrays_have_equal_lengths() -> None:
    request = InterpolateRequest(
        mode="function_interval",
        function="sin(x)",
        interval=["-1", "1"],
        node_strategy="equally_spaced",
        node_count=3,
        methods=["barycentric"],
        graph=True,
        exact=False,
    )

    response = interpolate(request)
    graph_data = response["graph_data"]

    lengths = {len(graph_data[key]) for key in ["x", "f_x", "P_x", "error"]}
    assert lengths == {101}
    assert graph_data["source_method"] == "barycentric"
```

- [ ] **Step 2: Run graph/service tests and verify failure**

Run:

```powershell
cd backend
python -m pytest app/tests/test_graph_data.py -v
```

Expected before implementation: import failure for `app.core.service`.

- [ ] **Step 3: Implement educational notes**

Create `backend/app/core/explanations.py`:

```python
def educational_notes() -> list[str]:
    return [
        "Interpolation constructs a polynomial that passes through the supplied nodes.",
        "For n + 1 distinct x-values, there is a unique interpolating polynomial of degree at most n.",
        "Distinct x-values are required because repeated x-values make the interpolation formulas divide by zero.",
        "Lagrange form is useful for showing basis polynomials and the interpolation formula.",
        "Newton form is useful for divided-difference tables and adding nodes.",
        "Barycentric form is preferred as the default numerical evaluator for values and graphing.",
        "Neville's method is useful when only a target-specific value is needed.",
    ]
```

- [ ] **Step 4: Implement graph data generation**

Create `backend/app/core/graph_data.py`:

```python
import sympy as sp

from app.core.domain import InterpolationProblem
from app.core.methods.barycentric import evaluate_barycentric
from app.core.precision import format_value


def _sample_bounds(problem: InterpolationProblem) -> tuple[float, float]:
    xs = [float(sp.N(node.x)) for node in problem.nodes]
    return min(xs), max(xs)


def build_graph_data(problem: InterpolationProblem, *, sample_count: int = 101) -> dict[str, object] | None:
    if not problem.graph:
        return None
    left, right = _sample_bounds(problem)
    if sample_count < 2:
        sample_count = 2
    step = (right - left) / (sample_count - 1)
    x_values: list[str] = []
    f_values: list[str | None] = []
    p_values: list[str | None] = []
    errors: list[str | None] = []
    for index in range(sample_count):
        x_float = left + step * index
        x_expr = sp.Float(str(x_float), problem.precision)
        x_values.append(format_value(x_expr, precision=problem.precision))
        try:
            p_expr = evaluate_barycentric(problem.nodes, x_expr)
            p_text = format_value(p_expr, precision=problem.precision)
        except Exception:
            p_text = None
            p_expr = None
        p_values.append(p_text)
        if problem.function_evaluator is None and problem.original_function is None:
            f_values.append(None)
            errors.append(None)
            continue
        try:
            f_expr = sp.simplify(problem.original_function.subs(sp.Symbol("x"), x_expr)) if problem.original_function is not None else None
            f_text = format_value(f_expr, precision=problem.precision)
            f_values.append(f_text)
            errors.append(format_value(abs(f_expr - p_expr), precision=problem.precision) if p_expr is not None else None)
        except Exception:
            f_values.append(None)
            errors.append(None)
    return {
        "x": x_values,
        "f_x": f_values,
        "P_x": p_values,
        "error": errors,
        "source_method": "barycentric",
        "method_graphs": None,
    }
```

- [ ] **Step 5: Implement service orchestration**

Create `backend/app/core/service.py`:

```python
import sympy as sp

from app.core.errors import InterpolationError
from app.core.explanations import educational_notes
from app.core.graph_data import build_graph_data
from app.core.methods.barycentric import build_barycentric
from app.core.methods.lagrange import build_lagrange
from app.core.methods.neville import build_neville
from app.core.methods.newton import build_newton
from app.core.normalization import normalize_request
from app.core.precision import comparison_tolerances
from app.schemas import InterpolateRequest


def _method_success(payload: dict[str, object]) -> dict[str, object]:
    warnings = payload.pop("warnings", [])
    return {"status": "ok", **payload, "warnings": warnings, "error": None}


def _method_failure(exc: Exception) -> dict[str, object]:
    if isinstance(exc, InterpolationError):
        error = {"code": exc.code, "message": exc.message, "details": exc.details}
    else:
        error = {"code": "method_failed", "message": str(exc), "details": {}}
    return {"status": "error", "warnings": [], "error": error}


def _run_methods(problem) -> dict[str, dict[str, object]]:
    builders = {
        "lagrange": build_lagrange,
        "newton": build_newton,
        "barycentric": build_barycentric,
        "neville": build_neville,
    }
    results = {}
    for method in problem.methods:
        try:
            results[method] = _method_success(
                builders[method](problem.nodes, precision=problem.precision, evaluation_x=problem.evaluation_x)
            )
        except Exception as exc:
            results[method] = _method_failure(exc)
    return results


def _top_level_evaluations(problem, methods: dict[str, dict[str, object]]) -> list[dict[str, object]]:
    evaluations = []
    for target in problem.evaluation_x:
        method_values = {}
        for method, result in methods.items():
            value = None
            for item in result.get("evaluations", result.get("target_results", [])):
                if item.get("x") == target:
                    value = item.get("value")
            method_values[method] = value
        best_method = "barycentric" if method_values.get("barycentric") is not None else next(
            (name for name in ["newton", "lagrange", "neville"] if method_values.get(name) is not None),
            None,
        )
        evaluations.append(
            {
                "x": target,
                "best_P_x": method_values.get(best_method) if best_method is not None else None,
                "best_method": best_method,
                "method_values": method_values,
                "f_x": None,
                "absolute_error": None,
                "warnings": [],
            }
        )
    return evaluations


def interpolate(request: InterpolateRequest) -> dict[str, object]:
    problem = normalize_request(request)
    method_results = _run_methods(problem)
    ok_count = sum(1 for result in method_results.values() if result["status"] == "ok")
    status = "ok" if ok_count == len(method_results) else "partial"
    lagrange_or_newton = method_results.get("lagrange") if method_results.get("lagrange", {}).get("status") == "ok" else method_results.get("newton")
    polynomial = {
        "expanded": lagrange_or_newton.get("expanded") if lagrange_or_newton else None,
        "factored": str(sp.factor(lagrange_or_newton.get("polynomial"))) if lagrange_or_newton and lagrange_or_newton.get("polynomial") is not None else None,
        "lagrange_form": method_results.get("lagrange", {}).get("summation_form"),
        "newton_form": method_results.get("newton", {}).get("nested_form"),
        "latex_expanded": lagrange_or_newton.get("latex_expanded") if lagrange_or_newton else None,
        "latex_lagrange": method_results.get("lagrange", {}).get("latex_lagrange"),
        "latex_newton": method_results.get("newton", {}).get("latex_newton"),
        "expanded_omitted_reason": None,
    }
    return {
        "status": status,
        "response_version": "1.0",
        "metadata": {"tolerance": comparison_tolerances(problem.precision)},
        "input_summary": {
            "mode": problem.mode,
            "node_count": len(problem.nodes),
            "degree": len(problem.nodes) - 1,
            "methods_requested": problem.methods,
            "precision": problem.precision,
            "exact": problem.exact,
            "function_known": problem.original_function is not None,
            "graph_requested": problem.graph,
            "sorted_nodes": problem.sorted_nodes,
        },
        "nodes": [{"index": node.index, "x": node.x_text, "y": node.y_text} for node in problem.nodes],
        "degree": len(problem.nodes) - 1,
        "polynomial": polynomial,
        "methods": method_results,
        "evaluations": _top_level_evaluations(problem, method_results),
        "graph_data": build_graph_data(problem),
        "warnings": problem.warnings,
        "educational_notes": educational_notes(),
    }
```

- [ ] **Step 6: Run graph/service tests**

Run:

```powershell
cd backend
python -m pytest app/tests/test_graph_data.py -v
```

Expected: graph/service tests pass.

- [ ] **Step 7: Update API/frontend docs and commit**

Update `docs/API_CONTRACT.md` and `docs/FRONTEND_HANDOFF.md` if the implemented field names differ from the design. Update `docs/HANDOFF.md` and `docs/PLAN.md`.

Run:

```powershell
git add backend/app/core/graph_data.py backend/app/core/explanations.py backend/app/core/service.py backend/app/tests/test_graph_data.py docs
git commit -m "feat: orchestrate interpolation responses"
```

## Task 9: API Routes And Contract Tests

**Files:**
- Modify: `backend/app/api/routes.py`
- Create: `backend/app/tests/test_api.py`
- Modify: `docs/API_CONTRACT.md`
- Modify: `docs/FRONTEND_HANDOFF.md`
- Modify: `docs/HANDOFF.md`
- Modify: `docs/PLAN.md`

- [ ] **Step 1: Write API tests**

Create `backend/app/tests/test_api.py`:

```python
from fastapi.testclient import TestClient

from app.main import app


def test_validate_function_accepts_safe_expression() -> None:
    client = TestClient(app)

    response = client.post("/api/validate-function", json={"function": "sin(x)"})

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_validate_function_rejects_unsafe_expression() -> None:
    client = TestClient(app)

    response = client.post("/api/validate-function", json={"function": "__import__('os').system('dir')"})

    assert response.status_code == 400
    assert response.json()["status"] == "error"
    assert response.json()["error"]["code"] == "unsafe_expression"


def test_interpolate_points_contract() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/interpolate",
        json={
            "mode": "points",
            "points": [["2", "4"], ["5", "1"]],
            "methods": ["lagrange", "newton", "barycentric", "neville"],
            "precision": 50,
            "exact": True,
            "evaluation_x": ["3"],
        },
    )

    body = response.json()
    assert response.status_code == 200
    assert body["response_version"] == "1.0"
    assert body["status"] == "ok"
    assert body["degree"] == 1
    assert body["polynomial"]["expanded"] == "6 - x" or body["polynomial"]["expanded"] == "-x + 6"


def test_interpolate_duplicate_x_error() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/interpolate",
        json={"mode": "points", "points": [["2", "4"], ["2", "5"]]},
    )

    assert response.status_code == 400
    assert response.json()["status"] == "error"
    assert response.json()["error"]["code"] == "duplicate_x"
```

- [ ] **Step 2: Run API tests and verify failure**

Run:

```powershell
cd backend
python -m pytest app/tests/test_api.py -v
```

Expected before route implementation: `404 Not Found` failures for new endpoints.

- [ ] **Step 3: Implement API routes**

Modify `backend/app/api/routes.py`:

```python
import sympy as sp
from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.core.errors import InterpolationError
from app.core.parser import parse_function
from app.core.service import interpolate
from app.schemas import FunctionValidationRequest, InterpolateRequest

router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "interpolation-backend",
        "version": "0.1.0",
    }


@router.post("/api/validate-function")
def validate_function(request: FunctionValidationRequest) -> JSONResponse | dict[str, object]:
    try:
        parsed = parse_function(request.function)
    except InterpolationError as exc:
        return JSONResponse(status_code=400, content=exc.to_response())
    return {
        "status": "ok",
        "function": request.function,
        "normalized_expression": str(parsed.expression),
        "latex": sp.latex(parsed.expression),
        "allowed_symbols": ["x"],
    }


@router.post("/api/interpolate")
def interpolate_endpoint(request: InterpolateRequest) -> JSONResponse | dict[str, object]:
    try:
        return interpolate(request)
    except InterpolationError as exc:
        return JSONResponse(status_code=400, content=exc.to_response())
```

- [ ] **Step 4: Run API tests**

Run:

```powershell
cd backend
python -m pytest app/tests/test_api.py -v
```

Expected: all API tests pass.

- [ ] **Step 5: Update API docs and commit**

Update `docs/API_CONTRACT.md`, `docs/FRONTEND_HANDOFF.md`, `docs/HANDOFF.md`, and `docs/PLAN.md` with implemented route behavior.

Run:

```powershell
git add backend/app/api/routes.py backend/app/tests/test_api.py docs
git commit -m "feat: expose interpolation API endpoints"
```

## Task 10: Full Verification, README, And Handoff

**Files:**
- Modify: `backend/README.md`
- Create: `backend/scripts/verify-backend.ps1`
- Modify: `docs/API_CONTRACT.md`
- Modify: `docs/FRONTEND_HANDOFF.md`
- Modify: `docs/HANDOFF.md`
- Modify: `docs/PLAN.md`

- [ ] **Step 1: Add verification script**

Create `backend/scripts/verify-backend.ps1`:

```powershell
$ErrorActionPreference = "Stop"

python -m pytest
python -m ruff check .
```

- [ ] **Step 2: Expand README with API examples**

Modify `backend/README.md` so it includes:

````markdown
## Example Request

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

## Frontend Rule

The frontend must not recompute interpolation. It should render backend response fields, warnings, method tables, and graph-ready arrays.
````

- [ ] **Step 3: Run targeted tests**

Run:

```powershell
cd backend
python -m pytest app/tests/test_parser.py
python -m pytest app/tests/test_api.py
```

Expected: both commands pass.

- [ ] **Step 4: Run full verification**

Run:

```powershell
cd backend
python -m pytest
python -m ruff check .
```

Expected: pytest passes and ruff reports no lint errors.

- [ ] **Step 5: Update handoff and plan**

Update `docs/HANDOFF.md` with:

- files created and modified
- exact commands run
- pass/fail results
- skipped tests, if any
- known issues and risks
- next backend step
- Claude Opus frontend first step

Update `docs/PLAN.md` milestone statuses to match completed implementation.

- [ ] **Step 6: Commit final backend verification docs**

Run:

```powershell
git add backend/README.md backend/scripts/verify-backend.ps1 docs
git commit -m "docs: finalize backend verification handoff"
```

## Implementation Notes

- Do not build a frontend in this repository.
- Do not use raw `eval`.
- Do not let methods parse inputs independently.
- Do not let methods define independent precision policy.
- Do not use NumPy `polyfit` as the main interpolation engine.
- Do not claim tests passed unless commands were actually run and recorded in `docs/HANDOFF.md`.
- If dependency installation fails, record the exact failure in `docs/HANDOFF.md` and stop before claiming backend completion.
- If any test fails, fix the defect before proceeding to final handoff.
