# RC Blocker Resolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve the release blockers that currently prevent RC/public readiness for the interpolation workbench.

**Architecture:** Keep math in pure backend core modules and keep the React frontend as a string-preserving API client and renderer. Add generalized osculating interpolation through confluent divided differences, extend cubic spline boundary solving in the existing spline module, then align frontend controls, docs, deployment verification, accessibility evidence, and repo hygiene.

**Tech Stack:** Python 3.12.13 in `backend/.venv`, FastAPI/Pydantic v2, SymPy/mpmath, pytest, Ruff, React 19, TypeScript, Vite, Vitest, Testing Library, Vercel CLI.

---

## File Structure

- Modify `backend/app/schemas.py`: add strict `method_options.osculating`, widen spline boundary options, and validate spline parameter fields.
- Modify `backend/app/core/domain.py`: keep normalized derivative and method option data available to methods.
- Modify `backend/app/core/normalization.py`: preserve string-valued derivative parsing and reject duplicate derivative `(x, order)` entries early.
- Modify `backend/app/core/methods/repeated_nodes.py`: add generalized confluent divided-difference helpers without breaking first-derivative Hermite helpers.
- Create `backend/app/core/methods/osculating.py`: own osculating validation, derivative sourcing, confluent table rendering, polynomial forms, and evaluations.
- Modify `backend/app/core/methods/cubic_spline.py`: replace natural-only branch with boundary-aware second-derivative solving.
- Modify `backend/app/core/service.py`: route `osculating`, include it in polynomial selection, graph source priority, and best-method priority.
- Modify `backend/app/core/graph_data.py`: sample successful `osculating` polynomial the same way Taylor/Hermite are sampled.
- Modify `backend/app/core/methods/metadata.py`, `backend/app/core/explanations.py`, and `backend/app/core/errors.py`: update method metadata, educational notes, and error code catalog.
- Add/modify backend tests under `backend/app/tests/`: `test_osculating.py`, `test_cubic_spline.py`, `test_api.py`, `test_schemas.py`, `test_graph_data.py`, and contract tests.
- Modify frontend API/types in `frontend/src/lib/api-types.ts`.
- Modify frontend input components: `frontend/src/App.tsx`, `frontend/src/components/InputPanel.tsx`, `frontend/src/components/DerivativeInputTable.tsx`, and `frontend/src/components/CubicSplineConfigBlock.tsx`.
- Create `frontend/src/components/results/methods/OsculatingDetails.tsx` and test it.
- Modify `frontend/src/components/results/MethodDetails.tsx`, `GuidedExplanation.tsx`, `ResultQualityGuide.tsx`, examples, and fixtures.
- Modify frontend tests for method config, spline details, graph/evaluation smoke, display digits accessibility, and mobile/browser smoke evidence.
- Modify deployment files: `vercel.json`, root/package helper files if needed, `requirements.txt`, and docs with exact Windows commands.
- Modify docs: `docs/HANDOFF.md`, `docs/PLAN.md`, `docs/API_CONTRACT.md`, `docs/FRONTEND_HANDOFF.md`, `RELEASE_NOTES.md`, `docs/PHASE_2_FINAL_AUDIT.md`, `docs/OPUS_PHASE_2_FRONTEND_HANDOFF.md`, and relevant `.impeccable/critique/*.md`.
- Resolve untracked files: `.codex-local-qa-graph.png`, `.codex-local-qa-mobile.png`, and `.impeccable/critique/2026-05-26T13-30-00Z__frontend-audit.md`.

---

### Task 1: Backend Schema And Validation Contract

**Files:**
- Modify: `backend/app/schemas.py`
- Modify: `backend/app/core/normalization.py`
- Test: `backend/app/tests/test_schemas.py`
- Test: `backend/app/tests/test_api.py`

- [ ] **Step 1: Write schema tests for osculating and spline options**

Add tests that prove accepted and rejected request shapes:

```python
def test_method_options_accept_osculating_orders_and_spline_boundaries() -> None:
    request = InterpolateRequest(
        mode="points",
        points=[["0", "1"], ["1", "2"]],
        methods=["osculating", "cubic_spline"],
        method_options={
            "osculating": {"orders": [{"x": "0", "order": 2}, {"x": "1", "order": 1}]},
            "cubic_spline": {
                "boundary_condition": "clamped",
                "left_derivative": "0",
                "right_derivative": "3",
            },
        },
    )

    assert request.method_options.osculating is not None
    assert request.method_options.osculating.orders[0].x == "0"
    assert request.method_options.osculating.orders[0].order == 2
    assert request.method_options.cubic_spline is not None
    assert request.method_options.cubic_spline.boundary_condition == "clamped"


@pytest.mark.parametrize(
    "options",
    [
        {"osculating": {"orders": [{"x": "0", "order": -1}]}},
        {"osculating": {"orders": [{"x": 0, "order": 1}]}},
        {"osculating": {"orders": [{"x": "0", "order": 1, "extra": "x"}]}},
        {"cubic_spline": {"boundary_condition": "unsupported"}},
        {"cubic_spline": {"boundary_condition": "clamped", "left_derivative": 0}},
    ],
)
def test_method_options_reject_invalid_osculating_and_spline_shapes(options) -> None:
    with pytest.raises(ValidationError):
        InterpolateRequest(
            mode="points",
            points=[["0", "1"], ["1", "2"]],
            methods=["osculating"],
            method_options=options,
        )
```

- [ ] **Step 2: Run schema tests and confirm they fail**

Run:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest app/tests/test_schemas.py -q
```

Expected: failures mention missing `osculating` method option model or invalid boundary literal handling.

- [ ] **Step 3: Implement strict option models**

In `backend/app/schemas.py`, add:

```python
SplineBoundaryCondition = Literal["natural", "clamped", "not-a-knot", "periodic"]


class OsculatingOrderOption(StrictModel):
    x: StrictStr
    order: StrictInt = Field(ge=0, le=10)


class OsculatingMethodOptions(StrictModel):
    orders: list[OsculatingOrderOption] = Field(default_factory=list)


class CubicSplineMethodOptions(StrictModel):
    boundary_condition: SplineBoundaryCondition = "natural"
    left_derivative: StrictStr | None = None
    right_derivative: StrictStr | None = None


class MethodOptions(StrictModel):
    taylor: TaylorMethodOptions | None = None
    cubic_spline: CubicSplineMethodOptions | None = None
    osculating: OsculatingMethodOptions | None = None
```

- [ ] **Step 4: Add duplicate derivative entry validation**

In `backend/app/core/normalization.py`, after derivative conversion, reject duplicate `(x, order)` pairs:

```python
def _normalize_derivatives(
    derivatives: list[DerivativeData], *, exact: bool, precision: int
) -> list[DerivativeDatum]:
    normalized: list[DerivativeDatum] = []
    seen: set[tuple[str, int]] = set()
    for item in derivatives:
        x_value = to_sympy(item.x, exact=exact, precision=precision)
        key = (format_value(x_value, precision=precision) or item.x, item.order)
        if key in seen:
            raise InterpolationError(
                "duplicate_derivative_data",
                "Derivative data contains duplicate entries for the same x-value and order.",
                {"x": item.x, "order": item.order},
            )
        seen.add(key)
        normalized.append(
            DerivativeDatum(
                x=x_value,
                x_text=item.x,
                order=item.order,
                value=to_sympy(item.value, exact=exact, precision=precision),
                value_text=item.value,
            )
        )
    return normalized
```

- [ ] **Step 5: Run schema/API guardrail tests**

Run:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest app/tests/test_schemas.py app/tests/test_api.py -q
```

Expected: schema tests pass; API tests may still fail only where osculating implementation is not yet routed.

---

### Task 2: Generalized Confluent Divided Differences

**Files:**
- Modify: `backend/app/core/methods/repeated_nodes.py`
- Create: `backend/app/tests/test_osculating.py`
- Test: `backend/app/tests/test_repeated_nodes.py`

- [ ] **Step 1: Add failing tests for table construction**

Create `backend/app/tests/test_osculating.py` with a direct helper-level mixed-order test:

```python
def test_confluent_table_uses_derivative_factorials_for_repeated_nodes() -> None:
    nodes = [
        Node(index=0, x=sp.Integer(0), y=sp.Integer(1), x_text="0", y_text="1"),
        Node(index=1, x=sp.Integer(1), y=sp.Integer(3), x_text="1", y_text="3"),
    ]
    derivatives = {
        (0, 1): sp.Integer(2),
        (0, 2): sp.Integer(6),
        (1, 1): sp.Integer(5),
    }

    repeated = build_confluent_repeated_nodes(
        nodes,
        orders_by_node_index={0: 2, 1: 1},
        derivative_values=derivatives,
        precision=50,
        method_name="osculating",
    )

    assert repeated.repeated_x == [sp.Integer(0), sp.Integer(0), sp.Integer(0), sp.Integer(1), sp.Integer(1)]
    assert repeated.table[0][1] == sp.Integer(2)
    assert repeated.table[0][2] == sp.Integer(3)
    assert repeated.table[3][1] == sp.Integer(5)
```

- [ ] **Step 2: Run helper test and confirm failure**

Run:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest app/tests/test_osculating.py::test_confluent_table_uses_derivative_factorials_for_repeated_nodes -q
```

Expected: import failure for `build_confluent_repeated_nodes`.

- [ ] **Step 3: Add generalized helper without removing Hermite helper**

In `backend/app/core/methods/repeated_nodes.py`, add a `ConfluentNodeResult` dataclass and helper:

```python
@dataclass(slots=True)
class ConfluentNodeResult:
    repeated_x: list[sp.Expr]
    repeated_y: list[sp.Expr]
    table: list[list[sp.Expr | None]]
    coefficients: list[sp.Expr]
    rendered_repeated_nodes: list[dict[str, Any]]
    rendered_table: list[list[str | None]]


def build_confluent_repeated_nodes(
    nodes: list[Node],
    *,
    orders_by_node_index: dict[int, int],
    derivative_values: dict[tuple[int, int], sp.Expr],
    precision: int,
    method_name: str,
) -> ConfluentNodeResult:
    repeated_x: list[sp.Expr] = []
    repeated_y: list[sp.Expr] = []
    rendered_repeated_nodes: list[dict[str, Any]] = []
    for node in nodes:
        max_order = orders_by_node_index[node.index]
        for repeat_order in range(max_order + 1):
            repeated_x.append(node.x)
            repeated_y.append(node.y)
            rendered_repeated_nodes.append(
                {
                    "index": len(rendered_repeated_nodes),
                    "source_node_index": node.index,
                    "x": format_value(node.x, precision=precision),
                    "y": format_value(node.y, precision=precision),
                    "derivative_order": repeat_order,
                    "derivative_value": (
                        format_value(node.y, precision=precision)
                        if repeat_order == 0
                        else format_value(
                            derivative_values[(node.index, repeat_order)],
                            precision=precision,
                        )
                    ),
                }
            )

    table = _confluent_divided_difference_table(
        repeated_x,
        repeated_y,
        nodes,
        orders_by_node_index,
        derivative_values,
    )
    coefficients = [table[0][index] for index in range(len(repeated_x))]
    rendered_table = [
        [format_value(value, precision=precision) if value is not None else None for value in row]
        for row in table
    ]
    return ConfluentNodeResult(
        repeated_x=repeated_x,
        repeated_y=repeated_y,
        table=table,
        coefficients=coefficients,
        rendered_repeated_nodes=rendered_repeated_nodes,
        rendered_table=rendered_table,
    )
```

Add `_confluent_divided_difference_table` that fills confluent repeated entries before ordinary divided differences:

```python
def _confluent_divided_difference_table(
    repeated_x: list[sp.Expr],
    repeated_y: list[sp.Expr],
    nodes: list[Node],
    orders_by_node_index: dict[int, int],
    derivative_values: dict[tuple[int, int], sp.Expr],
) -> list[list[sp.Expr | None]]:
    node_by_x = {node.x: node for node in nodes}
    n = len(repeated_x)
    table: list[list[sp.Expr | None]] = [[None for _ in range(n)] for _ in range(n)]
    for row, value in enumerate(repeated_y):
        table[row][0] = value
    for order in range(1, n):
        for row in range(n - order):
            if sp.simplify(repeated_x[row + order] - repeated_x[row]) == 0:
                node = node_by_x[repeated_x[row]]
                if order <= orders_by_node_index[node.index]:
                    table[row][order] = sp.simplify(
                        derivative_values[(node.index, order)] / sp.factorial(order)
                    )
                    continue
            table[row][order] = sp.simplify(
                (table[row + 1][order - 1] - table[row][order - 1])
                / (repeated_x[row + order] - repeated_x[row])
            )
    return table
```

- [ ] **Step 4: Run repeated-node and new helper tests**

Run:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest app/tests/test_repeated_nodes.py app/tests/test_osculating.py -q
```

Expected: existing Hermite repeated-node tests pass; new direct helper test passes; other osculating tests may not exist yet.

---

### Task 3: Backend Osculating Method

**Files:**
- Create: `backend/app/core/methods/osculating.py`
- Modify: `backend/app/core/service.py`
- Modify: `backend/app/core/graph_data.py`
- Modify: `backend/app/core/methods/metadata.py`
- Modify: `backend/app/core/explanations.py`
- Test: `backend/app/tests/test_osculating.py`
- Test: `backend/app/tests/test_api.py`
- Test: `backend/app/tests/test_graph_data.py`

- [ ] **Step 1: Write failing osculating equivalence and validation tests**

Add tests:

```python
def test_osculating_all_zero_orders_matches_lagrange() -> None:
    result = build_osculating(
        _nodes([("0", "1"), ("1", "3"), ("2", "7")]),
        precision=50,
        evaluation_x=["3"],
        derivatives=[],
        method_options={"orders": [{"x": "0", "order": 0}, {"x": "1", "order": 0}, {"x": "2", "order": 0}]},
        function_expression=None,
    )

    assert sp.expand(result["polynomial"]) == sp.expand(1 + X + X**2)
    assert result["evaluations"][0]["value"] == "13"


def test_osculating_all_first_orders_matches_hermite() -> None:
    result = build_osculating(
        _nodes([("0", "0"), ("1", "1")]),
        precision=50,
        evaluation_x=["1/2"],
        derivatives=[
            DerivativeDatum(x=sp.Integer(0), x_text="0", order=1, value=sp.Integer(0), value_text="0"),
            DerivativeDatum(x=sp.Integer(1), x_text="1", order=1, value=sp.Integer(2), value_text="2"),
        ],
        method_options={"orders": [{"x": "0", "order": 1}, {"x": "1", "order": 1}]},
        function_expression=None,
    )

    assert sp.expand(result["polynomial"] - X**2) == 0
    assert result["evaluations"][0]["value"] == "1/4"


def test_osculating_single_node_is_taylor_equivalent() -> None:
    result = build_osculating(
        [Node(index=0, x=sp.Integer(0), y=sp.Integer(1), x_text="0", y_text="1")],
        precision=50,
        evaluation_x=["1"],
        derivatives=[
            DerivativeDatum(x=sp.Integer(0), x_text="0", order=1, value=sp.Integer(1), value_text="1"),
            DerivativeDatum(x=sp.Integer(0), x_text="0", order=2, value=sp.Integer(1), value_text="1"),
        ],
        method_options={"orders": [{"x": "0", "order": 2}]},
        function_expression=None,
    )

    assert sp.expand(result["polynomial"] - (1 + X + X**2 / 2)) == 0
    assert result["evaluations"][0]["value"] == "5/2"


def test_osculating_rejects_missing_required_derivative() -> None:
    with pytest.raises(InterpolationError) as exc:
        build_osculating(
            _nodes([("0", "1"), ("1", "2")]),
            precision=50,
            evaluation_x=[],
            derivatives=[],
            method_options={"orders": [{"x": "0", "order": 2}, {"x": "1", "order": 0}]},
            function_expression=None,
        )

    assert exc.value.code == "missing_derivative_data"
```

- [ ] **Step 2: Run osculating tests and confirm failure**

Run:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest app/tests/test_osculating.py -q
```

Expected: import failure for `build_osculating`.

- [ ] **Step 3: Implement `build_osculating`**

Create `backend/app/core/methods/osculating.py` with:

```python
from typing import Any

import sympy as sp

from app.core.domain import DerivativeDatum, Node
from app.core.errors import InterpolationError
from app.core.methods.hermite import _nested_expression, _newton_expression
from app.core.methods.repeated_nodes import build_confluent_repeated_nodes
from app.core.parser import X
from app.core.precision import format_value, to_sympy


def build_osculating(
    nodes: list[Node],
    *,
    precision: int,
    evaluation_x: list[str],
    derivatives: list[DerivativeDatum],
    method_options: dict[str, Any],
    function_expression: sp.Expr | None = None,
) -> dict[str, Any]:
    orders_by_node_index = _orders_by_node(nodes, method_options, precision=precision)
    derivative_values = _derivative_values(
        nodes,
        orders_by_node_index,
        derivatives,
        function_expression=function_expression,
        precision=precision,
    )
    repeated = build_confluent_repeated_nodes(
        nodes,
        orders_by_node_index=orders_by_node_index,
        derivative_values=derivative_values,
        precision=precision,
        method_name="osculating",
    )
    expression = _newton_expression(repeated.repeated_x, repeated.coefficients)
    polynomial = sp.expand(expression)
    evaluations = [
        {
            "x": target,
            "value": format_value(
                polynomial.subs(X, to_sympy(target, exact=True, precision=precision)),
                precision=precision,
            ),
        }
        for target in evaluation_x
    ]
    return {
        "orders": [
            {
                "node_index": node.index,
                "x": format_value(node.x, precision=precision),
                "max_order": orders_by_node_index[node.index],
            }
            for node in nodes
        ],
        "repeated_nodes": repeated.rendered_repeated_nodes,
        "confluent_divided_difference_table": repeated.rendered_table,
        "coefficients": [
            format_value(coefficient, precision=precision) for coefficient in repeated.coefficients
        ],
        "nested_form": str(_nested_expression(repeated.repeated_x, repeated.coefficients)),
        "expanded": str(polynomial),
        "polynomial": polynomial,
        "latex_expanded": sp.latex(polynomial),
        "latex_osculating": sp.latex(expression),
        "evaluations": evaluations,
        "steps": [
            "Choose the maximum derivative order required at each node.",
            "Repeat each node once for the value and once for each required derivative order.",
            "Fill confluent divided differences with f^(k)(x_i) / k! for repeated nodes.",
            "Use the first row as Newton coefficients and expand the result for display.",
        ],
        "warnings": [],
    }
```

Add `_orders_by_node` and `_derivative_values` in the same file:

```python
def _orders_by_node(
    nodes: list[Node], method_options: dict[str, Any], *, precision: int
) -> dict[int, int]:
    raw_orders = method_options.get("orders") or []
    if not raw_orders:
        return {node.index: 1 for node in nodes}
    result = {node.index: 0 for node in nodes}
    matched: set[tuple[int, int]] = set()
    for item in raw_orders:
        x_expr = to_sympy(item["x"], exact=True, precision=precision)
        matching = [node for node in nodes if sp.simplify(node.x - x_expr) == 0]
        if not matching:
            raise InterpolationError(
                "derivative_node_not_found",
                "Osculating order references an x-value that is not an interpolation node.",
                {"x": item["x"]},
            )
        node = matching[0]
        key = (node.index, item["order"])
        if key in matched:
            raise InterpolationError(
                "duplicate_derivative_order",
                "Osculating method options repeat the same node and order.",
                {"x": item["x"], "order": item["order"]},
            )
        matched.add(key)
        result[node.index] = item["order"]
    return result


def _derivative_values(
    nodes: list[Node],
    orders_by_node_index: dict[int, int],
    derivatives: list[DerivativeDatum],
    *,
    function_expression: sp.Expr | None,
    precision: int,
) -> dict[tuple[int, int], sp.Expr]:
    values: dict[tuple[int, int], sp.Expr] = {}
    for node in nodes:
        for order in range(1, orders_by_node_index[node.index] + 1):
            if function_expression is not None:
                value = sp.simplify(sp.diff(function_expression, X, order).subs(X, node.x))
                if value.has(sp.I, sp.zoo, sp.nan, sp.oo, -sp.oo) or value.is_real is False:
                    raise InterpolationError(
                        "function_domain_error",
                        "Derived osculating derivative is not real-valued at a node.",
                        {"x": node.x_text, "order": order},
                    )
                values[(node.index, order)] = value
                continue
            matches = [
                datum
                for datum in derivatives
                if datum.order == order and sp.simplify(datum.x - node.x) == 0
            ]
            if len(matches) != 1:
                raise InterpolationError(
                    "missing_derivative_data",
                    "Osculating interpolation requires derivative data for each requested node and order.",
                    {"x": node.x_text, "order": order},
                )
            values[(node.index, order)] = matches[0].value
    return values
```

- [ ] **Step 4: Route osculating through service and graph data**

In `backend/app/core/service.py`:

```python
from app.core.methods.osculating import build_osculating

builders = {
    ...
    "osculating": build_osculating,
}
derivative_methods = {"hermite_divided_difference", "hermite", "osculating"}
function_methods = {"taylor", "osculating"}
```

Update polynomial and best-method priority:

```python
for method in ("osculating", "taylor", "hermite", "hermite_divided_difference", "lagrange", "newton"):
    ...

for method in (
    "osculating",
    "hermite",
    "hermite_divided_difference",
    "taylor",
    ...
):
    ...
```

In `backend/app/core/graph_data.py`, include:

```python
for method in ("osculating", "taylor", "hermite", "hermite_divided_difference"):
    result = (raw_results or {}).get(method)
    if result and result.get("polynomial") is not None:
        return method, result["polynomial"]
```

- [ ] **Step 5: Add API and graph tests**

Add tests proving function-derived osculating derivatives and graph source:

```python
def test_interpolate_osculating_function_mode_derives_derivatives(client: TestClient) -> None:
    response = client.post(
        "/api/interpolate",
        json={
            "mode": "x_values_with_function",
            "x_values": ["0"],
            "function": "exp(x)",
            "methods": ["osculating"],
            "method_options": {"osculating": {"orders": [{"x": "0", "order": 2}]}},
            "evaluation_x": ["1"],
            "graph": True,
            "exact": True,
            "precision": 50,
        },
    )

    body = response.json()
    assert response.status_code == 200
    assert body["methods"]["osculating"]["status"] == "ok"
    assert body["methods"]["osculating"]["evaluations"][0]["value"] == "5/2"
    assert body["graph_data"]["source_method"] == "osculating"
```

- [ ] **Step 6: Run backend osculating target suite**

Run:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest app/tests/test_osculating.py app/tests/test_api.py app/tests/test_graph_data.py -q
```

Expected: all targeted osculating/API/graph tests pass.

---

### Task 4: Cubic Spline Boundary Conditions

**Files:**
- Modify: `backend/app/core/methods/cubic_spline.py`
- Modify: `backend/app/core/service.py`
- Test: `backend/app/tests/test_cubic_spline.py`
- Test: `backend/app/tests/test_api.py`

- [ ] **Step 1: Replace unsupported-boundary test with implemented-boundary tests**

In `backend/app/tests/test_cubic_spline.py`, replace the clamped rejection test with:

```python
def test_clamped_cubic_spline_enforces_endpoint_derivatives() -> None:
    result = build_cubic_spline(
        _nodes([("0", "0"), ("1", "1"), ("2", "4")]),
        precision=50,
        evaluation_x=["1/2"],
        method_options={
            "boundary_condition": "clamped",
            "left_derivative": "0",
            "right_derivative": "4",
        },
    )

    first = result["segment_polynomials"][0]
    last = result["segment_polynomials"][-1]
    assert sp.simplify(sp.diff(first, X).subs(X, 0)) == 0
    assert sp.simplify(sp.diff(last, X).subs(X, 2)) == 4


def test_not_a_knot_cubic_spline_enforces_third_derivative_continuity() -> None:
    result = build_cubic_spline(
        _nodes([("0", "0"), ("1", "1"), ("2", "0"), ("3", "1")]),
        precision=50,
        evaluation_x=[],
        method_options={"boundary_condition": "not-a-knot"},
    )

    segments = result["segment_polynomials"]
    assert sp.simplify(sp.diff(segments[0], X, 3).subs(X, 1) - sp.diff(segments[1], X, 3).subs(X, 1)) == 0
    assert sp.simplify(sp.diff(segments[1], X, 3).subs(X, 2) - sp.diff(segments[2], X, 3).subs(X, 2)) == 0


def test_periodic_cubic_spline_enforces_periodic_endpoint_conditions() -> None:
    result = build_cubic_spline(
        _nodes([("0", "0"), ("1", "1"), ("2", "0")]),
        precision=50,
        evaluation_x=[],
        method_options={"boundary_condition": "periodic"},
    )

    first = result["segment_polynomials"][0]
    last = result["segment_polynomials"][-1]
    assert sp.simplify(first.subs(X, 0) - last.subs(X, 2)) == 0
    assert sp.simplify(sp.diff(first, X).subs(X, 0) - sp.diff(last, X).subs(X, 2)) == 0
    assert sp.simplify(sp.diff(first, X, 2).subs(X, 0) - sp.diff(last, X, 2).subs(X, 2)) == 0


def test_clamped_cubic_spline_requires_endpoint_derivatives() -> None:
    with pytest.raises(InterpolationError) as exc:
        build_cubic_spline(
            _nodes([("0", "0"), ("1", "1")]),
            precision=50,
            evaluation_x=[],
            method_options={"boundary_condition": "clamped"},
        )

    assert exc.value.code == "missing_boundary_parameter"
```

- [ ] **Step 2: Run spline tests and confirm failure**

Run:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest app/tests/test_cubic_spline.py -q
```

Expected: clamped/not-a-knot/periodic tests fail because current code raises `unsupported_boundary_condition`.

- [ ] **Step 3: Implement boundary-aware second derivative solver**

In `backend/app/core/methods/cubic_spline.py`, replace `_natural_second_derivatives` with:

```python
def _second_derivatives(
    nodes: list[Node],
    *,
    boundary_condition: str,
    method_options: dict[str, Any],
    precision: int,
) -> list[sp.Expr]:
    n = len(nodes)
    h = [sp.simplify(nodes[index + 1].x - nodes[index].x) for index in range(n - 1)]
    matrix = sp.zeros(n, n)
    rhs = sp.zeros(n, 1)

    for row in range(1, n - 1):
        matrix[row, row - 1] = h[row - 1]
        matrix[row, row] = 2 * (h[row - 1] + h[row])
        matrix[row, row + 1] = h[row]
        rhs[row] = 6 * (
            (nodes[row + 1].y - nodes[row].y) / h[row]
            - (nodes[row].y - nodes[row - 1].y) / h[row - 1]
        )

    if boundary_condition == "natural":
        matrix[0, 0] = 1
        matrix[n - 1, n - 1] = 1
    elif boundary_condition == "clamped":
        left = _required_boundary_value(method_options, "left_derivative", precision=precision)
        right = _required_boundary_value(method_options, "right_derivative", precision=precision)
        matrix[0, 0] = 2 * h[0]
        matrix[0, 1] = h[0]
        rhs[0] = 6 * ((nodes[1].y - nodes[0].y) / h[0] - left)
        matrix[n - 1, n - 2] = h[-1]
        matrix[n - 1, n - 1] = 2 * h[-1]
        rhs[n - 1] = 6 * (right - (nodes[-1].y - nodes[-2].y) / h[-1])
    elif boundary_condition == "not-a-knot":
        if n < 4:
            raise InterpolationError(
                "insufficient_nodes",
                "Not-a-knot cubic spline requires at least four nodes.",
                {"boundary_condition": boundary_condition, "node_count": n},
            )
        matrix[0, 0] = h[1]
        matrix[0, 1] = -(h[0] + h[1])
        matrix[0, 2] = h[0]
        matrix[n - 1, n - 3] = h[-1]
        matrix[n - 1, n - 2] = -(h[-2] + h[-1])
        matrix[n - 1, n - 1] = h[-2]
    elif boundary_condition == "periodic":
        if sp.simplify(nodes[0].y - nodes[-1].y) != 0:
            raise InterpolationError(
                "invalid_boundary_condition",
                "Periodic cubic spline requires the first and last y-values to match.",
                {"boundary_condition": boundary_condition},
            )
        matrix[0, 0] = 1
        matrix[0, n - 1] = -1
        matrix[n - 1, 0] = 2 * h[0]
        matrix[n - 1, 1] = h[0]
        matrix[n - 1, n - 2] = h[-1]
        matrix[n - 1, n - 1] = 2 * h[-1]
        rhs[n - 1] = 6 * (
            (nodes[1].y - nodes[0].y) / h[0]
            - (nodes[-1].y - nodes[-2].y) / h[-1]
        )
    else:
        raise InterpolationError(
            "unsupported_boundary_condition",
            "Cubic spline boundary condition is not implemented.",
            {"boundary_condition": boundary_condition, "supported": ["natural", "clamped", "not-a-knot", "periodic"]},
        )

    solution = matrix.LUsolve(rhs)
    return [sp.simplify(value) for value in solution]
```

Add:

```python
def _required_boundary_value(
    method_options: dict[str, Any], key: str, *, precision: int
) -> sp.Expr:
    value = method_options.get(key)
    if value is None or value == "":
        raise InterpolationError(
            "missing_boundary_parameter",
            "Clamped cubic spline requires endpoint derivative parameters.",
            {"missing": key},
        )
    return to_sympy(value, exact=True, precision=precision)
```

- [ ] **Step 4: Wire solver and response metadata**

In `build_cubic_spline`, replace the natural-only guard and call:

```python
boundary_condition = method_options.get("boundary_condition", "natural")
second_derivatives = _second_derivatives(
    ordered_nodes,
    boundary_condition=boundary_condition,
    method_options=method_options,
    precision=precision,
)
```

Return:

```python
"boundary_condition": boundary_condition,
"boundary_parameters": _boundary_parameters(method_options, precision=precision),
"steps": _steps_for_boundary(boundary_condition),
```

- [ ] **Step 5: Run spline and API tests**

Run:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest app/tests/test_cubic_spline.py app/tests/test_api.py -q
```

Expected: natural/clamped/not-a-knot/periodic tests pass; API contract tests pass with updated expectations.

---

### Task 5: Frontend Request Controls And Types

**Files:**
- Modify: `frontend/src/lib/api-types.ts`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/InputPanel.tsx`
- Modify: `frontend/src/components/DerivativeInputTable.tsx`
- Modify: `frontend/src/components/CubicSplineConfigBlock.tsx`
- Test: `frontend/src/components/InputPanel.MethodConfig.test.tsx`

- [ ] **Step 1: Write failing frontend config tests**

Add tests that select Osculating and spline modes:

```tsx
it("renders order-aware derivative inputs for osculating", () => {
  render(<InputPanel form={{ ...baseForm, methods: ["osculating"] }} onChange={vi.fn()} />)

  expect(screen.getByText("Derivative Data")).toBeInTheDocument()
  expect(screen.getByRole("spinbutton", { name: /maximum derivative order for node 0/i })).toBeInTheDocument()
  expect(screen.getByRole("textbox", { name: /derivative order 1 for node 0/i })).toBeInTheDocument()
})

it("enables implemented spline boundary conditions and renders clamped derivative fields", async () => {
  const onChange = vi.fn()
  render(<InputPanel form={{ ...baseForm, methods: ["cubic_spline"] }} onChange={onChange} />)

  const select = screen.getByLabelText(/boundary condition/i)
  await userEvent.selectOptions(select, "clamped")

  expect(onChange).toHaveBeenCalled()
  expect(screen.getByRole("textbox", { name: /left endpoint derivative/i })).toBeInTheDocument()
  expect(screen.getByRole("textbox", { name: /right endpoint derivative/i })).toBeInTheDocument()
})
```

- [ ] **Step 2: Run targeted frontend tests and confirm failure**

Run:

```powershell
cd frontend
npm test -- InputPanel.MethodConfig.test.tsx
```

Expected: tests fail because Osculating derivative-order controls and enabled spline modes do not exist.

- [ ] **Step 3: Update frontend API types**

In `frontend/src/lib/api-types.ts`, widen types:

```ts
export type SplineBoundaryCondition = "natural" | "clamped" | "not-a-knot" | "periodic"

export interface OsculatingOrderOption {
  x: string
  order: number
}

export interface OsculatingMethodOptions {
  orders: OsculatingOrderOption[]
}

export interface CubicSplineMethodOptions {
  boundary_condition: SplineBoundaryCondition
  left_derivative?: string
  right_derivative?: string
}

export interface MethodOptions {
  taylor?: TaylorMethodOptions
  cubic_spline?: CubicSplineMethodOptions
  osculating?: OsculatingMethodOptions
}
```

Update result type:

```ts
export interface OsculatingResult extends HermiteDividedDifferenceResult {
  orders?: Array<{ node_index: number; x: string; max_order: number }>
  repeated_nodes?: Array<RepeatedNode & { derivative_order?: number; derivative_value?: string }>
  confluent_divided_difference_table?: Array<Array<string | null>>
  latex_osculating?: string | null
}
```

- [ ] **Step 4: Add form state fields and request builder output**

In `frontend/src/components/InputPanel.tsx` and `frontend/src/App.tsx`, add:

```ts
osculatingOrders: Array<{ x: string; order: number }>
splineLeftDerivative: string
splineRightDerivative: string
```

In `buildMethodOptions`:

```ts
if (form.methods.includes("osculating")) {
  out.osculating = {
    orders: syncOsculatingOrders(form).map((entry) => ({
      x: entry.x,
      order: entry.order,
    })),
  }
}

if (form.methods.includes("cubic_spline")) {
  out.cubic_spline = {
    boundary_condition: form.splineBoundaryCondition,
  }
  if (form.splineBoundaryCondition === "clamped") {
    out.cubic_spline.left_derivative = form.splineLeftDerivative
    out.cubic_spline.right_derivative = form.splineRightDerivative
  }
}
```

In `buildDerivatives`, emit higher-order Osculating derivative entries for points mode:

```ts
if (form.methods.includes("osculating") && form.mode === "points") {
  return form.derivatives
    .filter((d) => d.x.trim() !== "" && d.value.trim() !== "")
    .map((d) => ({ x: d.x, order: d.order, value: d.value }))
}
```

- [ ] **Step 5: Update controls**

Refactor `DerivativeInputTable` props to:

```ts
export interface DerivativeInputTableProps {
  xs: string[]
  derivatives: Array<{ x: string; order: number; value: string }>
  maxOrders?: Array<{ x: string; order: number }>
  mode: "first-derivative" | "osculating"
  onChange: (next: Array<{ x: string; order: number; value: string }>) => void
  onMaxOrdersChange?: (next: Array<{ x: string; order: number }>) => void
  className?: string
}
```

For Osculating rows, render one max-order number input per node and derivative text inputs for orders `1..max_order`.

Update `CubicSplineConfigBlock` to enable all implemented options:

```tsx
<option value="natural">Natural</option>
<option value="clamped">Clamped</option>
<option value="not-a-knot">Not-a-Knot</option>
<option value="periodic">Periodic</option>
```

Render clamped fields:

```tsx
{boundaryCondition === "clamped" && (
  <div className="grid gap-3 sm:grid-cols-2">
    <Input aria-label="Left endpoint derivative" value={leftDerivative} onChange={(e) => onLeftDerivativeChange(e.target.value)} />
    <Input aria-label="Right endpoint derivative" value={rightDerivative} onChange={(e) => onRightDerivativeChange(e.target.value)} />
  </div>
)}
```

- [ ] **Step 6: Run targeted frontend config tests**

Run:

```powershell
cd frontend
npm test -- InputPanel.MethodConfig.test.tsx
```

Expected: tests pass.

---

### Task 6: Frontend Osculating Result Rendering

**Files:**
- Create: `frontend/src/components/results/methods/OsculatingDetails.tsx`
- Create: `frontend/src/components/results/methods/OsculatingDetails.test.tsx`
- Modify: `frontend/src/components/results/MethodDetails.tsx`
- Modify: `frontend/src/components/results/GuidedExplanation.tsx`
- Modify: `frontend/src/components/results/ResultQualityGuide.tsx`
- Modify: `frontend/src/test/interpolate-response.fixtures.ts`

- [ ] **Step 1: Add result fixture and failing renderer test**

Add `osculatingSuccessResponse` with `methods.osculating.status === "ok"` and a confluent table. Test:

```tsx
it("renders osculating orders, confluent table, polynomial forms, and evaluations", () => {
  render(
    <DisplayDigitsProvider>
      <OsculatingDetails result={osculatingSuccessResponse.methods.osculating!} />
    </DisplayDigitsProvider>,
  )

  expect(screen.getByText("Osculating Orders")).toBeInTheDocument()
  expect(screen.getByText("Confluent Divided-Difference Table")).toBeInTheDocument()
  expect(screen.getByText(/P\(x\)/i)).toBeInTheDocument()
  expect(screen.getByText("1/2")).toBeInTheDocument()
})
```

- [ ] **Step 2: Run renderer test and confirm failure**

Run:

```powershell
cd frontend
npm test -- OsculatingDetails.test.tsx
```

Expected: import failure for `OsculatingDetails`.

- [ ] **Step 3: Implement `OsculatingDetails`**

Use the existing Hermite/EqualSpacing detail style:

```tsx
export function OsculatingDetails({ result }: { result: OsculatingResult }) {
  const { format, formatLiterals } = useDisplayDigits()
  if (result.status === "error") {
    return <ErrorNotice code={result.error?.code} message={result.error?.message ?? "Osculating failed"} layout="block" />
  }

  return (
    <div className="space-y-4">
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Osculating Orders</h3>
        <Table>{/* map result.orders */}</Table>
      </section>
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Confluent Divided-Difference Table</h3>
        <pre className="text-[11px] font-numeric bg-muted/30 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
          {formatLiterals(tableRowsToText(result.confluent_divided_difference_table ?? []))}
        </pre>
      </section>
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Newton Form</h3>
        <pre className="text-[11px] font-numeric bg-muted/30 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
          {format(result.nested_form ?? "")}
        </pre>
      </section>
    </div>
  )
}
```

- [ ] **Step 4: Replace deferred routing**

In `MethodDetails.tsx`, render:

```tsx
{data.methods.osculating && (
  <TabsContent value="osculating" className="mt-4">
    <OsculatingDetails result={data.methods.osculating} />
  </TabsContent>
)}
```

Remove Osculating-specific deferred copy from `GuidedExplanation.tsx`, `ResultQualityGuide.tsx`, and fixtures.

- [ ] **Step 5: Run frontend result tests**

Run:

```powershell
cd frontend
npm test -- OsculatingDetails.test.tsx results.smoke.test.tsx GuidedExplanation.test.tsx ResultQualityGuide.test.tsx
```

Expected: targeted result-rendering tests pass.

---

### Task 7: Accessibility Verification And Fix

**Files:**
- Modify: `frontend/src/components/DisplayDigitsControl.tsx` if needed
- Modify: `frontend/src/components/DisplayDigitsControl.test.tsx`
- Optional Modify: `frontend/package.json` if adding an accessibility test dependency is practical
- Test: `frontend/src/components/DisplayDigitsControl.test.tsx`

- [ ] **Step 1: Add a regression test for labelled display precision controls**

Extend `DisplayDigitsControl.test.tsx`:

```tsx
it("exposes every display precision radio with an accessible name", () => {
  render(
    <DisplayDigitsProvider>
      <DisplayDigitsControl />
    </DisplayDigitsProvider>,
  )

  expect(screen.getByRole("radiogroup", { name: /display precision/i })).toBeInTheDocument()
  expect(screen.getByRole("radio", { name: "6" })).toBeInTheDocument()
  expect(screen.getByRole("radio", { name: "12" })).toBeInTheDocument()
  expect(screen.getByRole("radio", { name: "25" })).toBeInTheDocument()
  expect(screen.getByRole("radio", { name: "Full" })).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the display control test**

Run:

```powershell
cd frontend
npm test -- DisplayDigitsControl.test.tsx
```

Expected: pass if the current `aria-labelledby` fix is sufficient in jsdom; fail if hidden Base UI inputs still lack names in role queries.

- [ ] **Step 3: Fix labels if the test fails**

If hidden controls are exposed without names, add `aria-label` to each `Radio.Root` while keeping visible labels:

```tsx
<Radio.Root
  key={String(opt)}
  value={String(opt)}
  aria-label={label}
  aria-labelledby={optionLabelId}
  ...
>
  <span id={optionLabelId}>{label}</span>
</Radio.Root>
```

If Chrome still reports native hidden inputs, add a wrapping labelled control only if Base UI forwards it to the native input:

```tsx
<Radio.Root aria-label={`Display precision ${label}`} ...>
```

- [ ] **Step 4: Record automated/browser accessibility evidence**

Use available Browser/Playwright tooling to open the local app and inspect the issue panel or accessibility tree. Record the exact result in `docs/HANDOFF.md`.

---

### Task 8: Local Vercel Build And Windows Commands

**Files:**
- Modify: `vercel.json`
- Add or Modify: root `package.json` if a repo-level script is needed
- Modify: `docs/PLAN.md`
- Modify: `docs/HANDOFF.md`
- Modify: `RELEASE_NOTES.md`

- [ ] **Step 1: Reproduce local Vercel build failure**

Run:

```powershell
npx vercel build --yes
```

Expected before fix: failure mentions `uv` missing from PATH or another exact local build blocker.

- [ ] **Step 2: Apply repository-level fix**

Prefer a Vercel config that avoids relying on local `uv` from PATH. If Vercel Python packaging still invokes `uv`, add a checked-in install/bootstrap script and document it:

```json
{
  "scripts": {
    "vercel:build": "vercel build --yes"
  }
}
```

If the required fix is installing `uv`, use a copy-pasteable Windows command in docs:

```powershell
backend\.venv\Scripts\python.exe -m pip install uv
$env:PATH = "$(Resolve-Path backend\.venv\Scripts);$env:PATH"
npx vercel build --yes
```

If Vercel ignores local virtualenv `uv`, use Vercel project config that invokes frontend build directly and lets Python requirements install through the supported Vercel builder path.

- [ ] **Step 3: Verify local Vercel build passes**

Run:

```powershell
npx vercel build --yes
```

Expected: exit 0 and Vite build output with only existing chunk-size warning.

- [ ] **Step 4: Update Windows release commands**

In docs, replace launcher caveats with:

```powershell
cd backend
.\.venv\Scripts\python.exe --version
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m ruff check .
```

Expected Python version: `Python 3.12.13`.

---

### Task 9: Docs, Audit Text, And Repo Hygiene

**Files:**
- Modify: `docs/HANDOFF.md`
- Modify: `docs/PLAN.md`
- Modify: `docs/API_CONTRACT.md`
- Modify: `docs/FRONTEND_HANDOFF.md`
- Modify: `RELEASE_NOTES.md`
- Modify: `docs/PHASE_2_FINAL_AUDIT.md`
- Modify: `docs/OPUS_PHASE_2_FRONTEND_HANDOFF.md`
- Modify: `.impeccable/critique/2026-05-26T13-30-00Z__frontend-audit.md`
- Move or delete: `.codex-local-qa-graph.png`, `.codex-local-qa-mobile.png`

- [ ] **Step 1: Find stale release-limitation text**

Run:

```powershell
rg -n "osculating.*deferred|method_not_implemented|unsupported_boundary_condition|Deployment Protection|py -3.13|uv.*PATH|Phase 2.*pending|No label associated|public-ready|RC" docs RELEASE_NOTES.md .impeccable
```

Expected: list of stale and current references to audit.

- [ ] **Step 2: Update API contract**

Document:

```markdown
### Osculating

Request:
`methods: ["osculating"]`
`method_options.osculating.orders: [{ "x": "0", "order": 2 }]`
Point/data mode requires derivative entries for each requested order:
`derivatives: [{ "x": "0", "order": 1, "value": "1" }]`.
Function-backed modes derive derivative values from the parsed function.

Response includes `orders`, `repeated_nodes`, `confluent_divided_difference_table`,
`coefficients`, `nested_form`, `expanded`, `latex_expanded`, `latex_osculating`,
`evaluations`, `steps`, `warnings`, and `error`.
```

Document spline boundaries:

```markdown
`method_options.cubic_spline.boundary_condition` accepts `natural`, `clamped`,
`not-a-knot`, and `periodic`. Clamped requires `left_derivative` and
`right_derivative` numeric strings.
```

- [ ] **Step 3: Update PLAN and HANDOFF current state**

Record exact files changed, commands run, pass/fail outcomes, deployment URLs, local Vercel build result, accessibility result, and remaining blockers.

- [ ] **Step 4: Resolve untracked artifacts**

If screenshots remain useful evidence, move them:

```powershell
New-Item -ItemType Directory -Force docs\evidence
Move-Item -LiteralPath .codex-local-qa-graph.png -Destination docs\evidence\2026-05-27-local-qa-graph.png
Move-Item -LiteralPath .codex-local-qa-mobile.png -Destination docs\evidence\2026-05-27-local-qa-mobile.png
```

If they are obsolete, delete them with:

```powershell
Remove-Item -LiteralPath .codex-local-qa-graph.png
Remove-Item -LiteralPath .codex-local-qa-mobile.png
```

Use one of those two actions, then record which action was used in `docs/HANDOFF.md`.

- [ ] **Step 5: Run doc consistency search**

Run:

```powershell
rg -n "osculating.*deferred|non-natural.*unsupported|unsupported_boundary_condition.*natural|py -3.13.*limitation|uv.*PATH.*fails|Phase 2 frontend.*pending" docs RELEASE_NOTES.md .impeccable
```

Expected: no stale contradiction remains. Current historical mentions are acceptable only when explicitly marked superseded with current status nearby.

---

### Task 10: Full Verification, Deployment, And Final Status

**Files:**
- Modify: `docs/HANDOFF.md`
- Modify: `docs/PLAN.md`
- Modify: `RELEASE_NOTES.md`

- [ ] **Step 1: Run full backend verification**

Run:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m ruff check .
```

Expected: all backend tests pass and Ruff prints `All checks passed!`.

- [ ] **Step 2: Run full frontend verification**

Run:

```powershell
cd frontend
npm run lint
npm run build
npm test
```

Expected: lint/build/test exit 0. Existing Vite chunk-size warning may remain only if documented.

- [ ] **Step 3: Run local Vercel build verification**

Run:

```powershell
npx vercel build --yes
```

Expected: exit 0.

- [ ] **Step 4: Start local app and run browser smoke**

Start backend and frontend:

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

```powershell
cd frontend
npm run dev -- --host 127.0.0.1
```

Use Browser/Playwright smoke to verify:

- Osculating UI accepts derivative orders and computes.
- Cubic spline boundary selector enables implemented modes and clamped fields compute.
- Result tabs render method details, polynomial, evaluations, graph, guide, and warnings.
- Graph/evaluation output appears for Osculating and spline.
- Mobile layout at `320x800` has no incoherent overlap.
- Accessibility issue is absent or recorded with exact evidence.

- [ ] **Step 5: Deploy preview and attempt production promotion**

Run:

```powershell
npx vercel deploy --yes
npx vercel inspect <preview-url>
```

If production promotion is permitted:

```powershell
npx vercel promote <preview-url> --yes
npx vercel inspect <production-url>
```

If protection or SSO blocks public access, record the exact HTTP response and Vercel account/project limitation. Do not claim public readiness while the only reachable URL is protected.

- [ ] **Step 6: Final repo hygiene and summary**

Run:

```powershell
git status --short
```

Expected: clean after intentional commits, or only an explicitly documented external blocker.

Final response must include:

- Exact files changed.
- Schema/API changes.
- Osculating implementation summary.
- Cubic spline boundary implementation summary.
- Deployment status and URLs.
- Local build/Python launcher resolution.
- Accessibility result.
- Docs updated.
- Tests added.
- Commands run with pass/fail summary.
- Final git status.
- Remaining blockers, if any.

---

## Self-Review

Spec coverage:

- Osculating backend, function mode derivatives, point mode derivative data, validation, graph/evaluation, frontend UI, result rendering, docs, and tests are covered by Tasks 1, 2, 3, 5, 6, 9, and 10.
- Cubic spline boundaries and validation are covered by Tasks 1, 4, 5, 9, and 10.
- Production deployment, protected access status, local Vercel build, and Windows Python commands are covered by Tasks 8 and 10.
- Accessibility is covered by Task 7 and browser smoke in Task 10.
- Stale docs and untracked artifacts are covered by Task 9.
- Full verification and final status are covered by Task 10.

Placeholder scan:

- The plan contains no placeholder markers or unnamed future work.
- Every code-changing task includes concrete files, code shapes, and commands.

Type consistency:

- Backend method option names are `method_options.osculating.orders`, `method_options.cubic_spline.boundary_condition`, `left_derivative`, and `right_derivative`.
- Frontend type names match backend request names and preserve string numeric values.
- Osculating result fields are consistently named `orders`, `repeated_nodes`, `confluent_divided_difference_table`, `coefficients`, `nested_form`, `expanded`, `latex_expanded`, `latex_osculating`, and `evaluations`.
