# Phase 2 Lecture Method Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the interpolation backend into a staged lecture-method workbench covering equal-spacing, derivative-data, Taylor, and natural cubic spline methods while preserving the stable v1 API endpoints and backend-source-of-truth boundary.

**Architecture:** Keep FastAPI/Pydantic at the API boundary, normalize requests once, run pure method modules, and return backend-generated method artifacts and graph data. Phase 2 adds optional request blocks and method-specific response payloads under the existing `POST /api/interpolate` contract; no public per-method endpoints are introduced.

**Tech Stack:** Python 3.11+, FastAPI, Pydantic, SymPy, mpmath, SciPy where practical, pytest, ruff, PowerShell verification commands, React/TypeScript frontend handoff documentation only unless user changes scope.

---

## File Structure

### Existing Files To Preserve

- `backend/app/schemas.py` - v1 request and response models; extend literals and optional Phase 2 config fields without removing v1 fields.
- `backend/app/core/domain.py` - internal normalized problem dataclasses; extend with method options and derivative data after P2.0 contract lock.
- `backend/app/core/normalization.py` - request-to-problem conversion; keep all numeric input conversion through `core/precision.py`.
- `backend/app/core/validation.py` - shared validation and warnings; add reusable method eligibility helpers.
- `backend/app/core/service.py` - selected-method orchestration and response assembly; add Phase 2 builder routing.
- `backend/app/core/graph_data.py` - backend graph arrays; add piecewise source support in P2.4.
- `backend/app/core/parser.py` - safe SymPy parser shared by `/api/validate-function` and `/api/interpolate`; reuse for Taylor.
- `backend/app/core/precision.py` - exact/high-precision conversion and formatting; all new methods must use it.
- `backend/app/core/methods/*.py` - pure method modules only; no FastAPI or frontend imports.
- `docs/API_CONTRACT.md` - update whenever request/response/error/warning shape changes.
- `docs/FRONTEND_HANDOFF.md` - update for every frontend-relevant Phase 2 payload.
- `docs/HANDOFF.md` - update after each meaningful change group with exact commands and results.
- `docs/PLAN.md` - update milestone status when completed, blocked, changed, or found wrong.

### New Backend Files

- `backend/app/core/methods/finite_differences.py` - equal-spacing validation, finite-difference tables, target guidance, and formula term helpers.
- `backend/app/core/methods/newton_finite.py` - `newton_forward`, `newton_backward`, and `stirling` builders.
- `backend/app/core/methods/repeated_nodes.py` - Hermite/osculating repeated-node table helpers.
- `backend/app/core/methods/hermite.py` - Hermite divided-difference and Hermite basis method builders.
- `backend/app/core/methods/taylor.py` - Taylor derivative/term/polynomial builder.
- `backend/app/core/methods/piecewise.py` - piecewise interval models and backend-only piecewise evaluation helpers.
- `backend/app/core/methods/cubic_spline.py` - natural cubic spline method builder.
- `backend/app/core/methods/metadata.py` - method family, lecture coverage, and frontend display metadata returned by docs or optional API metadata fields.

### New Backend Tests

- `backend/app/tests/test_phase2_contract.py` - backward compatibility and optional-field contract tests.
- `backend/app/tests/test_finite_differences.py` - equal-spacing, forward/backward table, and target guidance helper tests.
- `backend/app/tests/test_newton_finite.py` - Newton forward/backward/Stirling method tests.
- `backend/app/tests/test_repeated_nodes.py` - derivative-data expansion and repeated-node divided-difference helper tests.
- `backend/app/tests/test_hermite.py` - Hermite divided-difference and Hermite basis method tests.
- `backend/app/tests/test_taylor.py` - Taylor parser/derivative/term/polynomial tests.
- `backend/app/tests/test_cubic_spline.py` - natural cubic spline segment and continuity tests.

### New Planning/Audit Files

- `docs/superpowers/specs/phase-2-lecture-method-workbench/requirements.md`
- `docs/superpowers/specs/phase-2-lecture-method-workbench/design.md`
- `docs/superpowers/specs/phase-2-lecture-method-workbench/tasks.md`
- `docs/PHASE_2_FINAL_AUDIT.md` - created in P2.5.

---

## P2.0 - Contract And Architecture Prep

### Task P2.0.1: Lock Phase 2 API Contract Shape

**Files:**
- Modify: `backend/app/schemas.py`
- Modify: `docs/API_CONTRACT.md`
- Test: `backend/app/tests/test_phase2_contract.py`

- [ ] **Step 1: Write contract tests before schema changes**

Create `backend/app/tests/test_phase2_contract.py` with these tests:

```python
from app.schemas import InterpolateRequest


def test_v1_points_request_still_valid_without_phase2_fields() -> None:
    request = InterpolateRequest(
        mode="points",
        points=[["2", "4"], ["5", "1"]],
        methods=["lagrange", "newton", "barycentric", "neville"],
        precision=50,
        exact=True,
        evaluation_x=["3"],
        graph=False,
    )

    assert request.methods == ["lagrange", "newton", "barycentric", "neville"]
    assert request.points == [["2", "4"], ["5", "1"]]


def test_phase2_method_literals_are_accepted() -> None:
    request = InterpolateRequest(
        mode="points",
        points=[["1.0", "0.7651977"], ["1.3", "0.6200860"]],
        methods=[
            "newton_forward",
            "newton_backward",
            "stirling",
            "hermite_divided_difference",
            "hermite",
            "osculating",
            "taylor",
            "cubic_spline",
        ],
    )

    assert request.methods == [
        "newton_forward",
        "newton_backward",
        "stirling",
        "hermite_divided_difference",
        "hermite",
        "osculating",
        "taylor",
        "cubic_spline",
    ]


def test_phase2_optional_blocks_keep_numeric_values_as_strings() -> None:
    request = InterpolateRequest(
        mode="x_values_with_function",
        function="cos(x)",
        x_values=["0", "0.3", "0.6"],
        methods=["taylor", "hermite_divided_difference"],
        method_options={
            "taylor": {"center": "0", "order": 3},
            "cubic_spline": {"boundary_condition": "natural"},
        },
        derivatives=[
            {"x": "0", "order": 1, "value": "0"},
            {"x": "0.3", "order": 1, "value": "-0.2955202067"},
        ],
    )

    assert request.method_options["taylor"]["center"] == "0"
    assert request.derivatives[0]["value"] == "0"
```

- [ ] **Step 2: Run the contract tests and verify failure**

Run:

```powershell
cd backend
python -m pytest app/tests/test_phase2_contract.py -v
```

Expected before implementation: the Phase 2 method literal test fails validation and optional blocks are rejected as extra fields.

- [ ] **Step 3: Extend schema types**

Modify `backend/app/schemas.py`:

```python
from typing import Any, Literal

MethodName = Literal[
    "lagrange",
    "newton",
    "barycentric",
    "neville",
    "newton_forward",
    "newton_backward",
    "stirling",
    "hermite_divided_difference",
    "hermite",
    "osculating",
    "taylor",
    "cubic_spline",
]


class DerivativeData(StrictModel):
    x: str
    order: int = Field(ge=1, le=10)
    value: str
```

Add to `InterpolateRequest`:

```python
method_options: dict[str, dict[str, Any]] = Field(default_factory=dict)
derivatives: list[DerivativeData] = Field(default_factory=list)
```

- [ ] **Step 4: Run the contract tests**

Run:

```powershell
cd backend
python -m pytest app/tests/test_phase2_contract.py -v
```

Expected: all tests in `test_phase2_contract.py` pass.

- [ ] **Step 5: Update API contract**

Update `docs/API_CONTRACT.md` to include:

- expanded method list
- `method_options` request field
- `derivatives` request field
- derivative data object shape
- `taylor.center`, `taylor.order`
- `cubic_spline.boundary_condition = "natural"` as the only supported P2.4 boundary
- note that Phase 2 method-specific ineligibility returns method-level errors when normalization succeeds

- [ ] **Step 6: Run targeted compatibility tests**

Run:

```powershell
cd backend
python -m pytest app/tests/test_schemas.py app/tests/test_api.py app/tests/test_phase2_contract.py -v
```

Expected: schema/API compatibility remains green.

### Task P2.0.2: Extend Domain and Service Routing With Explicit Unavailable Method Errors

**Files:**
- Modify: `backend/app/core/domain.py`
- Modify: `backend/app/core/normalization.py`
- Modify: `backend/app/core/service.py`
- Modify: `backend/app/core/errors.py`
- Test: `backend/app/tests/test_phase2_contract.py`

- [ ] **Step 1: Add tests for selected but unimplemented Phase 2 methods**

Append to `backend/app/tests/test_phase2_contract.py`:

```python
from app.core.service import interpolate


def test_unimplemented_phase2_method_returns_method_error_not_400() -> None:
    request = InterpolateRequest(
        mode="points",
        points=[["1.0", "0.7651977"], ["1.3", "0.6200860"], ["1.6", "0.4554022"]],
        methods=["newton_forward"],
        evaluation_x=["1.5"],
    )

    response = interpolate(request)

    assert response["status"] == "partial"
    assert response["methods"]["newton_forward"]["status"] == "error"
    assert response["methods"]["newton_forward"]["error"]["code"] == "method_not_implemented"
```

- [ ] **Step 2: Run the new test and verify failure**

Run:

```powershell
cd backend
python -m pytest app/tests/test_phase2_contract.py::test_unimplemented_phase2_method_returns_method_error_not_400 -v
```

Expected before implementation: service raises a key error or generic `method_failed`.

- [ ] **Step 3: Add warning/error codes**

Modify `backend/app/core/errors.py`:

```python
ERROR_CODES = {
    "duplicate_x",
    "too_few_nodes",
    "invalid_method",
    "invalid_interval",
    "invalid_node_count",
    "non_real_value",
    "unsafe_expression",
    "function_domain_error",
    "method_not_implemented",
    "unequal_spacing",
    "stirling_requires_centered_nodes",
    "missing_derivative_data",
    "invalid_derivative_order",
    "unsupported_taylor_function",
    "unsupported_boundary_condition",
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
    "nodes_reordered",
    "target_not_recommended_for_method",
    "piecewise_method_no_global_polynomial",
}
```

- [ ] **Step 4: Extend the normalized problem**

Modify `backend/app/core/domain.py`:

```python
@dataclass(slots=True)
class DerivativeDatum:
    x: sp.Expr
    order: int
    value: sp.Expr
    x_text: str
    value_text: str


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
    method_options: dict[str, dict[str, Any]] = field(default_factory=dict)
    derivatives: list[DerivativeDatum] = field(default_factory=list)
```

- [ ] **Step 5: Normalize optional blocks**

Modify `backend/app/core/normalization.py` so the returned `InterpolationProblem` includes:

```python
method_options=dict(request.method_options),
derivatives=_normalize_derivatives(request, exact=exact),
```

Add:

```python
def _normalize_derivatives(request: InterpolateRequest, *, exact: bool) -> list[DerivativeDatum]:
    derivatives: list[DerivativeDatum] = []
    for item in request.derivatives:
        x_value = to_sympy(item.x, exact=exact, precision=request.precision)
        derivative_value = to_sympy(item.value, exact=exact, precision=request.precision)
        derivatives.append(
            DerivativeDatum(
                x=x_value,
                order=item.order,
                value=derivative_value,
                x_text=item.x,
                value_text=item.value,
            )
        )
    return derivatives
```

- [ ] **Step 6: Add unavailable method routing**

Modify `backend/app/core/service.py`:

```python
def _unavailable_method(method: str) -> dict[str, Any]:
    return {
        "status": "error",
        "warnings": [],
        "error": {
            "code": "method_not_implemented",
            "message": f"{method} is planned for Phase 2 but is not implemented in this milestone.",
            "details": {"method": method},
        },
    }
```

Then in `_run_methods`, before calling the builder:

```python
builder = builders.get(method)
if builder is None:
    failure = _unavailable_method(method)
    raw_results[method] = failure
    api_results[method] = failure
    continue
```

- [ ] **Step 7: Run P2.0 tests**

Run:

```powershell
cd backend
python -m pytest app/tests/test_phase2_contract.py app/tests/test_api.py -v
```

Expected: all selected tests pass; v1 API tests continue passing.

### Task P2.0.3: Add Method Metadata Helper

**Files:**
- Create: `backend/app/core/methods/metadata.py`
- Test: `backend/app/tests/test_phase2_contract.py`
- Modify: `docs/FRONTEND_HANDOFF.md`

- [ ] **Step 1: Add metadata tests**

Append to `backend/app/tests/test_phase2_contract.py`:

```python
from app.core.methods.metadata import method_metadata


def test_phase2_method_metadata_marks_barycentric_as_support_method() -> None:
    metadata = method_metadata()

    assert metadata["barycentric"]["role"] == "stable_evaluator"
    assert metadata["barycentric"]["lecture_construction_method"] is False
    assert metadata["newton_forward"]["family"] == "equal_spacing"
    assert metadata["cubic_spline"]["family"] == "piecewise"
```

- [ ] **Step 2: Run metadata test and verify failure**

Run:

```powershell
cd backend
python -m pytest app/tests/test_phase2_contract.py::test_phase2_method_metadata_marks_barycentric_as_support_method -v
```

Expected before implementation: import failure for `metadata`.

- [ ] **Step 3: Implement metadata helper**

Create `backend/app/core/methods/metadata.py`:

```python
def method_metadata() -> dict[str, dict[str, object]]:
    return {
        "lagrange": {
            "family": "global_polynomial",
            "role": "construction",
            "lecture_construction_method": True,
        },
        "newton": {
            "family": "global_polynomial",
            "role": "construction",
            "lecture_construction_method": True,
        },
        "barycentric": {
            "family": "global_polynomial",
            "role": "stable_evaluator",
            "lecture_construction_method": False,
        },
        "neville": {
            "family": "target_specific",
            "role": "target_specific",
            "lecture_construction_method": True,
        },
        "newton_forward": {
            "family": "equal_spacing",
            "role": "construction",
            "lecture_construction_method": True,
        },
        "newton_backward": {
            "family": "equal_spacing",
            "role": "construction",
            "lecture_construction_method": True,
        },
        "stirling": {
            "family": "equal_spacing",
            "role": "centered_construction",
            "lecture_construction_method": True,
        },
        "hermite_divided_difference": {
            "family": "derivative_data",
            "role": "construction",
            "lecture_construction_method": True,
        },
        "hermite": {
            "family": "derivative_data",
            "role": "construction",
            "lecture_construction_method": True,
        },
        "osculating": {
            "family": "derivative_data",
            "role": "generalized_derivative_matching",
            "lecture_construction_method": True,
        },
        "taylor": {
            "family": "function_derivative",
            "role": "local_approximation",
            "lecture_construction_method": True,
        },
        "cubic_spline": {
            "family": "piecewise",
            "role": "piecewise_approximation",
            "lecture_construction_method": True,
        },
    }
```

- [ ] **Step 4: Run metadata tests**

Run:

```powershell
cd backend
python -m pytest app/tests/test_phase2_contract.py -v
```

Expected: all P2.0 contract tests pass.

- [ ] **Step 5: Update frontend handoff**

Update `docs/FRONTEND_HANDOFF.md` with the Phase 2 method family/role mapping and the rule that frontend renders metadata and backend payloads only.

### Task P2.0.4: P2.0 Verification and Commit

**Files:**
- Modify: `docs/HANDOFF.md`
- Modify: `docs/PLAN.md`

- [ ] **Step 1: Run backend verification**

Run:

```powershell
cd backend
python -m pytest
python -m ruff check .
```

Expected: all backend tests pass and ruff reports `All checks passed!`.

- [ ] **Step 2: Update coordination docs**

Update `docs/HANDOFF.md` with:

- files changed
- exact commands run
- pass/fail output
- Python 3.11+ caveat if the current interpreter is not 3.11+
- no frontend files changed in P2.0 unless that actually changed

Update `docs/PLAN.md`:

- mark Phase 2 P2.0 as completed only if tests/lint passed
- set next milestone to P2.1 equal-spacing implementation

- [ ] **Step 3: Report git status**

Run:

```powershell
git status --short
```

Expected: only intended P2.0 files plus any pre-existing unrelated working-tree changes are shown. Do not stage unrelated changes.

- [ ] **Step 4: Commit P2.0**

Stage only P2.0 files. If unrelated pre-existing changes remain in `docs/HANDOFF.md` or `docs/PLAN.md`, stage hunks carefully or pause for user direction before committing those files.

Suggested commit:

```powershell
git add backend/app/schemas.py backend/app/core/domain.py backend/app/core/errors.py backend/app/core/normalization.py backend/app/core/service.py backend/app/core/methods/metadata.py backend/app/tests/test_phase2_contract.py docs/API_CONTRACT.md docs/FRONTEND_HANDOFF.md
git commit -m "feat: prepare phase 2 interpolation contract"
```

---

## P2.1 - Equal-Spacing Family

### Task P2.1.1: Finite-Difference Helpers

**Files:**
- Create: `backend/app/core/methods/finite_differences.py`
- Test: `backend/app/tests/test_finite_differences.py`

- [ ] **Step 1: Write helper tests**

Create `backend/app/tests/test_finite_differences.py`:

```python
import sympy as sp

from app.core.domain import Node
from app.core.methods.finite_differences import (
    build_backward_difference_table,
    build_forward_difference_table,
    equal_spacing,
    target_guidance,
)


def _lecture_nodes() -> list[Node]:
    data = [
        ("1.0", "0.7651977"),
        ("1.3", "0.6200860"),
        ("1.6", "0.4554022"),
        ("1.9", "0.2818186"),
        ("2.2", "0.1103623"),
    ]
    return [
        Node(index=i, x=sp.Rational(x), y=sp.Rational(y), x_text=x, y_text=y)
        for i, (x, y) in enumerate(data)
    ]


def test_equal_spacing_returns_spacing_for_lecture_nodes() -> None:
    spacing = equal_spacing(_lecture_nodes())

    assert spacing.is_equal
    assert spacing.h == sp.Rational(3, 10)


def test_equal_spacing_rejects_unequal_nodes() -> None:
    nodes = _lecture_nodes()
    nodes[2] = Node(index=2, x=sp.Rational("1.7"), y=nodes[2].y, x_text="1.7", y_text=nodes[2].y_text)

    spacing = equal_spacing(nodes)

    assert spacing.is_equal is False


def test_forward_difference_table_matches_lecture_first_column() -> None:
    table = build_forward_difference_table(_lecture_nodes())

    assert table[0][0] == sp.Rational("0.7651977")
    assert table[0][1] == sp.Rational("-0.1451117")
    assert table[0][2] == sp.Rational("-0.0195705")


def test_backward_difference_table_uses_last_node_differences() -> None:
    table = build_backward_difference_table(_lecture_nodes())

    assert table[-1][0] == sp.Rational("0.1103623")
    assert table[-1][1] == sp.Rational("-0.1714563")
    assert table[-1][2] == sp.Rational("0.0021273")


def test_target_guidance_classifies_front_back_center() -> None:
    nodes = _lecture_nodes()

    assert target_guidance(nodes, sp.Rational("1.1"))["recommended"] == "newton_forward"
    assert target_guidance(nodes, sp.Rational("2.1"))["recommended"] == "newton_backward"
    assert target_guidance(nodes, sp.Rational("1.5"))["recommended"] == "stirling"
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
cd backend
python -m pytest app/tests/test_finite_differences.py -v
```

Expected before implementation: import failure for `finite_differences`.

- [ ] **Step 3: Implement helper module**

Create `backend/app/core/methods/finite_differences.py`:

```python
from dataclasses import dataclass
from typing import Any

import sympy as sp

from app.core.domain import Node


@dataclass(slots=True)
class SpacingResult:
    is_equal: bool
    h: sp.Expr | None
    spacings: list[sp.Expr]


def equal_spacing(nodes: list[Node]) -> SpacingResult:
    sorted_nodes = sorted(nodes, key=lambda node: float(sp.N(node.x, 30)))
    spacings = [
        sp.simplify(sorted_nodes[index + 1].x - sorted_nodes[index].x)
        for index in range(len(sorted_nodes) - 1)
    ]
    if not spacings:
        return SpacingResult(is_equal=False, h=None, spacings=[])
    first = spacings[0]
    is_equal = all(sp.simplify(spacing - first) == 0 for spacing in spacings[1:])
    return SpacingResult(is_equal=is_equal, h=first if is_equal else None, spacings=spacings)


def build_forward_difference_table(nodes: list[Node]) -> list[list[sp.Expr | None]]:
    n = len(nodes)
    table: list[list[sp.Expr | None]] = [[None for _ in range(n)] for _ in range(n)]
    for row, node in enumerate(nodes):
        table[row][0] = node.y
    for order in range(1, n):
        for row in range(n - order):
            table[row][order] = sp.simplify(table[row + 1][order - 1] - table[row][order - 1])
    return table


def build_backward_difference_table(nodes: list[Node]) -> list[list[sp.Expr | None]]:
    n = len(nodes)
    table: list[list[sp.Expr | None]] = [[None for _ in range(n)] for _ in range(n)]
    for row, node in enumerate(nodes):
        table[row][0] = node.y
    for order in range(1, n):
        for row in range(order, n):
            table[row][order] = sp.simplify(table[row][order - 1] - table[row - 1][order - 1])
    return table


def target_guidance(nodes: list[Node], target: sp.Expr) -> dict[str, Any]:
    sorted_nodes = sorted(nodes, key=lambda node: float(sp.N(node.x, 30)))
    xs = [node.x for node in sorted_nodes]
    left = xs[0]
    right = xs[-1]
    midpoint = sp.simplify((left + right) / 2)
    span = sp.simplify(right - left)
    if bool(abs(target - midpoint) <= abs(span) / 6):
        recommended = "stirling"
    elif bool(target < midpoint):
        recommended = "newton_forward"
    else:
        recommended = "newton_backward"
    return {
        "recommended": recommended,
        "target": str(target),
        "left": str(left),
        "right": str(right),
        "midpoint": str(midpoint),
    }
```

- [ ] **Step 4: Run helper tests**

Run:

```powershell
cd backend
python -m pytest app/tests/test_finite_differences.py -v
```

Expected: all finite-difference helper tests pass.

### Task P2.1.2: Newton Forward and Backward Methods

**Files:**
- Create: `backend/app/core/methods/newton_finite.py`
- Modify: `backend/app/core/service.py`
- Test: `backend/app/tests/test_newton_finite.py`

- [ ] **Step 1: Write method tests**

Create `backend/app/tests/test_newton_finite.py`:

```python
import sympy as sp

from app.core.domain import Node
from app.core.methods.newton_finite import build_newton_backward, build_newton_forward


def _lecture_nodes() -> list[Node]:
    data = [
        ("1.0", "0.7651977"),
        ("1.3", "0.6200860"),
        ("1.6", "0.4554022"),
        ("1.9", "0.2818186"),
        ("2.2", "0.1103623"),
    ]
    return [
        Node(index=i, x=sp.Rational(x), y=sp.Rational(y), x_text=x, y_text=y)
        for i, (x, y) in enumerate(data)
    ]


def test_newton_forward_lecture_example_evaluates_x_1_5() -> None:
    result = build_newton_forward(_lecture_nodes(), precision=50, evaluation_x=["1.5"])

    assert result["evaluations"][0]["x"] == "1.5"
    assert sp.Abs(sp.Rational(result["evaluations"][0]["value"]) - sp.Rational("0.5118200")) < sp.Rational("1e-7")
    assert result["spacing_h"] == "3/10"
    assert result["anchor_index"] == 0


def test_newton_backward_lecture_example_evaluates_x_2() -> None:
    result = build_newton_backward(_lecture_nodes(), precision=50, evaluation_x=["2"])

    assert result["evaluations"][0]["x"] == "2"
    assert sp.Abs(sp.Rational(result["evaluations"][0]["value"]) - sp.Rational("0.2238754")) < sp.Rational("1e-7")
    assert result["spacing_h"] == "3/10"
    assert result["anchor_index"] == 4
```

- [ ] **Step 2: Run method tests and verify failure**

Run:

```powershell
cd backend
python -m pytest app/tests/test_newton_finite.py -v
```

Expected before implementation: import failure for `newton_finite`.

- [ ] **Step 3: Implement forward/backward methods**

Create `backend/app/core/methods/newton_finite.py` with:

```python
import math
from typing import Any

import sympy as sp

from app.core.domain import Node
from app.core.errors import InterpolationError
from app.core.methods.finite_differences import (
    build_backward_difference_table,
    build_forward_difference_table,
    equal_spacing,
    target_guidance,
)
from app.core.precision import format_value, to_sympy


def _falling_product(s: sp.Expr, order: int) -> sp.Expr:
    product = sp.Integer(1)
    for index in range(order):
        product *= s - index
    return sp.simplify(product)


def _rising_product(s: sp.Expr, order: int) -> sp.Expr:
    product = sp.Integer(1)
    for index in range(order):
        product *= s + index
    return sp.simplify(product)


def _render_table(table: list[list[sp.Expr | None]], *, precision: int) -> list[list[str | None]]:
    return [
        [format_value(value, precision=precision) if value is not None else None for value in row]
        for row in table
    ]


def _require_equal_spacing(nodes: list[Node]) -> sp.Expr:
    spacing = equal_spacing(nodes)
    if not spacing.is_equal or spacing.h is None:
        raise InterpolationError(
            "unequal_spacing",
            "Newton finite-difference methods require equally spaced x-values.",
            {"spacings": [str(item) for item in spacing.spacings]},
        )
    return spacing.h


def build_newton_forward(
    nodes: list[Node], *, precision: int, evaluation_x: list[str]
) -> dict[str, Any]:
    h = _require_equal_spacing(nodes)
    table = build_forward_difference_table(nodes)
    evaluations = []
    for target in evaluation_x:
        target_value = to_sympy(target, exact=True, precision=precision)
        s = sp.simplify((target_value - nodes[0].x) / h)
        value = nodes[0].y
        terms = [{"order": 0, "value": format_value(nodes[0].y, precision=precision)}]
        for order in range(1, len(nodes)):
            delta = table[0][order]
            term = sp.simplify(_falling_product(s, order) * delta / math.factorial(order))
            value += term
            terms.append({"order": order, "value": format_value(term, precision=precision)})
        evaluations.append(
            {
                "x": target,
                "s": format_value(s, precision=precision),
                "value": format_value(sp.simplify(value), precision=precision),
                "terms": terms,
                "target_guidance": target_guidance(nodes, target_value),
            }
        )
    return {
        "forward_difference_table": _render_table(table, precision=precision),
        "spacing_h": format_value(h, precision=precision),
        "anchor_index": 0,
        "evaluations": evaluations,
        "steps": [
            "Verify that x-values are equally spaced.",
            "Build the forward-difference table from the first node.",
            "Use s = (x - x0) / h in Newton's forward-difference formula.",
        ],
        "warnings": [],
    }


def build_newton_backward(
    nodes: list[Node], *, precision: int, evaluation_x: list[str]
) -> dict[str, Any]:
    h = _require_equal_spacing(nodes)
    table = build_backward_difference_table(nodes)
    last = len(nodes) - 1
    evaluations = []
    for target in evaluation_x:
        target_value = to_sympy(target, exact=True, precision=precision)
        s = sp.simplify((target_value - nodes[last].x) / h)
        value = nodes[last].y
        terms = [{"order": 0, "value": format_value(nodes[last].y, precision=precision)}]
        for order in range(1, len(nodes)):
            nabla = table[last][order]
            term = sp.simplify(_rising_product(s, order) * nabla / math.factorial(order))
            value += term
            terms.append({"order": order, "value": format_value(term, precision=precision)})
        evaluations.append(
            {
                "x": target,
                "s": format_value(s, precision=precision),
                "value": format_value(sp.simplify(value), precision=precision),
                "terms": terms,
                "target_guidance": target_guidance(nodes, target_value),
            }
        )
    return {
        "backward_difference_table": _render_table(table, precision=precision),
        "spacing_h": format_value(h, precision=precision),
        "anchor_index": last,
        "evaluations": evaluations,
        "steps": [
            "Verify that x-values are equally spaced.",
            "Build the backward-difference table from the last node.",
            "Use s = (x - xn) / h in Newton's backward-difference formula.",
        ],
        "warnings": [],
    }
```

- [ ] **Step 4: Wire builders into service**

Modify `backend/app/core/service.py`:

```python
from app.core.methods.newton_finite import build_newton_backward, build_newton_forward
```

Add to `builders`:

```python
"newton_forward": build_newton_forward,
"newton_backward": build_newton_backward,
```

- [ ] **Step 5: Run method tests**

Run:

```powershell
cd backend
python -m pytest app/tests/test_finite_differences.py app/tests/test_newton_finite.py -v
```

Expected: all finite-difference and Newton finite tests pass.

### Task P2.1.3: Stirling Method

**Files:**
- Modify: `backend/app/core/methods/newton_finite.py`
- Modify: `backend/app/core/service.py`
- Test: `backend/app/tests/test_newton_finite.py`

- [ ] **Step 1: Add Stirling tests**

Append to `backend/app/tests/test_newton_finite.py`:

```python
from app.core.errors import InterpolationError
from app.core.methods.newton_finite import build_stirling


def test_stirling_requires_odd_node_count_for_first_phase() -> None:
    nodes = _lecture_nodes()[:4]

    try:
        build_stirling(nodes, precision=50, evaluation_x=["1.5"])
    except InterpolationError as exc:
        assert exc.code == "stirling_requires_centered_nodes"
    else:
        raise AssertionError("Expected Stirling to reject even node count in P2.1")


def test_stirling_returns_centered_payload_for_lecture_nodes() -> None:
    result = build_stirling(_lecture_nodes(), precision=50, evaluation_x=["1.5"])

    assert result["center_index"] == 2
    assert result["center_x"] == "8/5"
    assert result["evaluations"][0]["x"] == "1.5"
    assert result["evaluations"][0]["target_guidance"]["recommended"] == "stirling"
    assert result["centered_difference_table"]
```

- [ ] **Step 2: Run Stirling tests and verify failure**

Run:

```powershell
cd backend
python -m pytest app/tests/test_newton_finite.py::test_stirling_requires_odd_node_count_for_first_phase app/tests/test_newton_finite.py::test_stirling_returns_centered_payload_for_lecture_nodes -v
```

Expected before implementation: import failure for `build_stirling`.

- [ ] **Step 3: Implement strict Stirling payload**

Add to `backend/app/core/methods/newton_finite.py`:

```python
def build_stirling(nodes: list[Node], *, precision: int, evaluation_x: list[str]) -> dict[str, Any]:
    h = _require_equal_spacing(nodes)
    if len(nodes) % 2 == 0:
        raise InterpolationError(
            "stirling_requires_centered_nodes",
            "Stirling's method in Phase 2.1 requires an odd number of equally spaced nodes.",
            {"node_count": len(nodes)},
        )
    center = len(nodes) // 2
    forward_table = build_forward_difference_table(nodes)
    evaluations = []
    for target in evaluation_x:
        target_value = to_sympy(target, exact=True, precision=precision)
        s = sp.simplify((target_value - nodes[center].x) / h)
        guidance = target_guidance(nodes, target_value)
        warnings = []
        if guidance["recommended"] != "stirling":
            warnings.append(
                {
                    "code": "target_not_recommended_for_method",
                    "message": "Target is not near the center of the table; forward or backward differences may be a better lecture choice.",
                    "details": guidance,
                }
            )
        value = _lagrange_reference_value(nodes, target_value)
        evaluations.append(
            {
                "x": target,
                "s": format_value(s, precision=precision),
                "value": format_value(value, precision=precision),
                "target_guidance": guidance,
            }
        )
    return {
        "centered_difference_table": _render_table(forward_table, precision=precision),
        "spacing_h": format_value(h, precision=precision),
        "center_index": center,
        "center_x": format_value(nodes[center].x, precision=precision),
        "evaluations": evaluations,
        "steps": [
            "Verify that x-values are equally spaced.",
            "Choose the center node nearest the target.",
            "Use Stirling's centered-difference arrangement for lecture presentation.",
        ],
        "warnings": [],
    }


def _lagrange_reference_value(nodes: list[Node], target: sp.Expr) -> sp.Expr:
    value = sp.Integer(0)
    for i, node in enumerate(nodes):
        basis = sp.Integer(1)
        for j, other in enumerate(nodes):
            if i == j:
                continue
            basis *= (target - other.x) / (node.x - other.x)
        value += node.y * basis
    return sp.simplify(value)
```

This first Stirling implementation returns a centered lecture payload and uses the mathematically equivalent interpolation value for evaluation. A follow-up refinement may expose the exact averaged Stirling term list once the table-index convention is locked to the lecture notation.

- [ ] **Step 4: Wire Stirling into service**

Modify `backend/app/core/service.py`:

```python
from app.core.methods.newton_finite import build_newton_backward, build_newton_forward, build_stirling
```

Add to `builders`:

```python
"stirling": build_stirling,
```

- [ ] **Step 5: Run P2.1 method tests**

Run:

```powershell
cd backend
python -m pytest app/tests/test_finite_differences.py app/tests/test_newton_finite.py -v
```

Expected: all P2.1 method tests pass.

### Task P2.1.4: API Contract and Regression Coverage

**Files:**
- Modify: `docs/API_CONTRACT.md`
- Modify: `docs/FRONTEND_HANDOFF.md`
- Modify: `docs/HANDOFF.md`
- Modify: `docs/PLAN.md`
- Test: `backend/app/tests/test_api.py`

- [ ] **Step 1: Add API tests for equal-spacing methods**

Append to `backend/app/tests/test_api.py`:

```python
def test_interpolate_equal_spacing_methods_contract() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/interpolate",
        json={
            "mode": "points",
            "points": [
                ["1.0", "0.7651977"],
                ["1.3", "0.6200860"],
                ["1.6", "0.4554022"],
                ["1.9", "0.2818186"],
                ["2.2", "0.1103623"],
            ],
            "methods": ["newton_forward", "newton_backward", "stirling"],
            "evaluation_x": ["1.5", "2"],
            "precision": 50,
            "exact": True,
        },
    )

    body = response.json()

    assert response.status_code == 200
    assert body["methods"]["newton_forward"]["status"] == "ok"
    assert body["methods"]["newton_backward"]["status"] == "ok"
    assert body["methods"]["stirling"]["status"] == "ok"
    assert body["methods"]["newton_forward"]["forward_difference_table"]
    assert body["methods"]["newton_backward"]["backward_difference_table"]
    assert body["methods"]["stirling"]["centered_difference_table"]
```

- [ ] **Step 2: Run API test**

Run:

```powershell
cd backend
python -m pytest app/tests/test_api.py::test_interpolate_equal_spacing_methods_contract -v
```

Expected: test passes after service wiring.

- [ ] **Step 3: Update docs**

Update:

- `docs/API_CONTRACT.md` with method response examples for `newton_forward`, `newton_backward`, and `stirling`
- `docs/FRONTEND_HANDOFF.md` with renderer guidance for finite-difference tables and target guidance
- `docs/PLAN.md` to mark P2.1 status accurately
- `docs/HANDOFF.md` with exact commands run

- [ ] **Step 4: Run backend verification**

Run:

```powershell
cd backend
python -m pytest
python -m ruff check .
```

Expected: all backend tests pass and ruff reports `All checks passed!`.

- [ ] **Step 5: Report git status and commit P2.1**

Run:

```powershell
git status --short
```

Then stage only intended P2.1 files and commit:

```powershell
git add backend/app/core/methods/finite_differences.py backend/app/core/methods/newton_finite.py backend/app/core/service.py backend/app/tests/test_finite_differences.py backend/app/tests/test_newton_finite.py backend/app/tests/test_api.py docs/API_CONTRACT.md docs/FRONTEND_HANDOFF.md docs/HANDOFF.md docs/PLAN.md
git commit -m "feat: add equal-spacing interpolation methods"
```

---

## P2.2 - Derivative-Data Family

### Task P2.2.1: Repeated-Node Helper

**Files:**
- Create: `backend/app/core/methods/repeated_nodes.py`
- Test: `backend/app/tests/test_repeated_nodes.py`

- [ ] Write failing tests for derivative coverage and repeated-node expansion.
- [ ] Implement first-derivative Hermite repeated nodes.
- [ ] Verify derivative values are converted through `core/precision.py`.
- [ ] Run `python -m pytest app/tests/test_repeated_nodes.py -v`.

### Task P2.2.2: Hermite Divided Difference

**Files:**
- Create: `backend/app/core/methods/hermite.py`
- Modify: `backend/app/core/service.py`
- Test: `backend/app/tests/test_hermite.py`

- [ ] Write lecture regression test for Hermite divided-difference approximation at `x = 1.5`.
- [ ] Implement `build_hermite_divided_difference`.
- [ ] Return repeated nodes, divided-difference table, coefficients, nested form, expanded form, LaTeX, evaluations, and steps.
- [ ] Wire `hermite_divided_difference` into service.
- [ ] Run `python -m pytest app/tests/test_repeated_nodes.py app/tests/test_hermite.py -v`.

### Task P2.2.3: Hermite Basis and Osculating Decision

**Files:**
- Modify: `backend/app/core/methods/hermite.py`
- Modify: `docs/API_CONTRACT.md`
- Modify: `docs/FRONTEND_HANDOFF.md`

- [ ] Add low-degree Hermite basis-form tests.
- [ ] Implement basis output using lecture formula when symbolic size is reasonable.
- [ ] Add structured omission warning for large basis output.
- [ ] Implement `osculating` only if repeated-node helper supports the required derivative orders with tests.
- [ ] If not implemented, document osculating deferral with exact reason in `docs/PLAN.md` and `docs/HANDOFF.md`.
- [ ] Run backend tests and lint.
- [ ] Commit P2.2 separately.

---

## P2.3 - Taylor Family

### Task P2.3.1: Taylor Contract and Tests

**Files:**
- Create: `backend/app/core/methods/taylor.py`
- Modify: `backend/app/core/service.py`
- Test: `backend/app/tests/test_taylor.py`

- [ ] Write tests for `cos(x)` centered at `0`, orders `2` and `3`.
- [ ] Write tests for `sin(x)` centered at `0`, term list through order `5`.
- [ ] Write tests rejecting unsafe function strings through existing parser behavior.
- [ ] Implement derivative term generation using SymPy differentiation.
- [ ] Return polynomial, terms, LaTeX, evaluations, steps, and remainder note.
- [ ] Wire `taylor` into service.
- [ ] Run `python -m pytest app/tests/test_taylor.py app/tests/test_parser.py app/tests/test_api.py -v`.
- [ ] Update docs and commit P2.3 separately.

---

## P2.4 - Piecewise Family

### Task P2.4.1: Natural Cubic Spline Solver

**Files:**
- Create: `backend/app/core/methods/piecewise.py`
- Create: `backend/app/core/methods/cubic_spline.py`
- Modify: `backend/app/core/graph_data.py`
- Modify: `backend/app/core/service.py`
- Test: `backend/app/tests/test_cubic_spline.py`

- [ ] Write tests for natural spline through `(1, 2)`, `(2, 3)`, `(3, 5)`.
- [ ] Implement tridiagonal natural spline coefficient solve using SymPy exact arithmetic where practical.
- [ ] Return segment coefficients with interval metadata.
- [ ] Return continuity checks at interior knots.
- [ ] Add backend piecewise evaluation for graph samples.
- [ ] Ensure top-level polynomial block uses `expanded_omitted_reason = "piecewise_method_no_global_polynomial"` for spline-only responses.
- [ ] Run `python -m pytest app/tests/test_cubic_spline.py app/tests/test_graph_data.py app/tests/test_api.py -v`.
- [ ] Update docs and commit P2.4 separately.

---

## P2.5 - Release Candidate

### Task P2.5.1: Final Lecture Coverage and QA Audit

**Files:**
- Create: `docs/PHASE_2_FINAL_AUDIT.md`
- Modify: `docs/API_CONTRACT.md`
- Modify: `docs/FRONTEND_HANDOFF.md`
- Modify: `docs/HANDOFF.md`
- Modify: `docs/PLAN.md`

- [ ] Confirm every implemented Phase 2 method has a lecture regression test.
- [ ] Confirm every explicitly deferred method has a documented reason.
- [ ] Run full backend verification:

```powershell
cd backend
python -m pytest
python -m ruff check .
```

- [ ] If frontend files changed, run:

```powershell
cd frontend
npm run build
npm run lint
npm test
```

- [ ] If frontend flows changed, perform browser QA for major flows and record exact results.
- [ ] Write `docs/PHASE_2_FINAL_AUDIT.md` with requirement-by-requirement evidence.
- [ ] Keep Python 3.11+ verification caveat visible unless actually run under Python 3.11+.
- [ ] Report `git status --short`.
- [ ] Commit P2.5 separately.

---

## Execution Notes

- Do not stage unrelated pre-existing changes.
- Do not commit generated folders.
- Do not weaken v1 behavior to make Phase 2 tests pass.
- Do not move numerical correctness into React.
- Do not mark Phase 2 complete until the completion checklist in `docs/superpowers/specs/phase-2-lecture-method-workbench/tasks.md` is satisfied.
