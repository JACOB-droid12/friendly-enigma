import pytest
import sympy as sp

from app.core.domain import DerivativeDatum, Node
from app.core.errors import InterpolationError
from app.core.methods.lagrange import build_lagrange
from app.core.methods.osculating import build_osculating
from app.core.methods.repeated_nodes import build_confluent_repeated_nodes
from app.core.parser import X, parse_function
from app.core.precision import to_sympy


def _nodes(data: list[tuple[str, str]]) -> list[Node]:
    return [
        Node(index=index, x=sp.Rational(x), y=sp.Rational(y), x_text=x, y_text=y)
        for index, (x, y) in enumerate(data)
    ]


def _derivative(x: str, order: int, value: str) -> DerivativeDatum:
    return DerivativeDatum(
        x=sp.Rational(x),
        order=order,
        value=sp.Rational(value),
        x_text=x,
        value_text=value,
    )


def _newton_expression(repeated_x: list[sp.Expr], coefficients: list[sp.Expr]) -> sp.Expr:
    x = sp.symbols("x")
    expression = sp.Integer(0)
    basis = sp.Integer(1)
    for index, coefficient in enumerate(coefficients):
        if index > 0:
            basis *= x - repeated_x[index - 1]
        expression += coefficient * basis
    return sp.expand(expression)


def test_osculating_all_zero_orders_matches_lagrange() -> None:
    nodes = _nodes([("0", "1"), ("1", "3"), ("2", "7")])

    result = build_osculating(
        nodes,
        precision=50,
        evaluation_x=["3"],
        derivatives=[],
        method_options={
            "orders": [
                {"x": "0", "order": 0},
                {"x": "1", "order": 0},
                {"x": "2", "order": 0},
            ]
        },
        function_expression=None,
    )
    lagrange = build_lagrange(nodes, precision=50, evaluation_x=["3"])

    assert (
        sp.expand(sp.sympify(str(result["polynomial"])) - sp.sympify(str(lagrange["polynomial"])))
        == 0
    )
    assert sp.expand(result["polynomial"] - (X**2 + X + 1)) == 0
    assert result["evaluations"][0]["value"] == "13"
    assert result["orders"] == [
        {"node_index": 0, "x": "0", "max_order": 0},
        {"node_index": 1, "x": "1", "max_order": 0},
        {"node_index": 2, "x": "2", "max_order": 0},
    ]


def test_osculating_all_first_orders_matches_hermite() -> None:
    result = build_osculating(
        _nodes([("0", "1"), ("1", "4")]),
        precision=50,
        evaluation_x=["1/2"],
        derivatives=[_derivative("0", 1, "2"), _derivative("1", 1, "4")],
        method_options={"orders": [{"x": "0", "order": 1}, {"x": "1", "order": 1}]},
        function_expression=None,
    )

    assert sp.expand(result["polynomial"] - (X**2 + 2 * X + 1)) == 0
    assert result["evaluations"][0]["value"] == "9/4"


def test_osculating_single_node_is_taylor_equivalent() -> None:
    result = build_osculating(
        _nodes([("0", "1")]),
        precision=50,
        evaluation_x=["1"],
        derivatives=[_derivative("0", 1, "1"), _derivative("0", 2, "1")],
        method_options={"orders": [{"x": "0", "order": 2}]},
        function_expression=None,
    )

    assert sp.expand(result["polynomial"] - (1 + X + X**2 / 2)) == 0
    assert result["evaluations"][0]["value"] == "5/2"


def test_osculating_function_mode_derives_derivatives_safely() -> None:
    result = build_osculating(
        _nodes([("0", "1")]),
        precision=50,
        evaluation_x=["1"],
        derivatives=[],
        method_options={"orders": [{"x": "0", "order": 2}]},
        function_expression=parse_function("exp(x)").expression,
    )

    assert sp.expand(result["polynomial"] - (1 + X + X**2 / 2)) == 0
    assert result["evaluations"][0]["value"] == "5/2"


def test_osculating_supports_mixed_higher_orders() -> None:
    result = build_osculating(
        _nodes([("0", "1"), ("1", "3")]),
        precision=50,
        evaluation_x=["2"],
        derivatives=[
            _derivative("0", 1, "-1"),
            _derivative("0", 2, "0"),
            _derivative("1", 1, "9"),
        ],
        method_options={"orders": [{"x": "0", "order": 2}, {"x": "1", "order": 1}]},
        function_expression=None,
    )

    polynomial = result["polynomial"]
    assert sp.expand(polynomial - (X**4 + 2 * X**3 - X + 1)) == 0
    assert sp.diff(polynomial, X).subs(X, 0) == -1
    assert sp.diff(polynomial, X, 2).subs(X, 0) == 0
    assert sp.diff(polynomial, X).subs(X, 1) == 9
    assert result["evaluations"][0]["value"] == "31"


def test_osculating_rejects_missing_required_derivative_data() -> None:
    with pytest.raises(InterpolationError) as exc:
        build_osculating(
            _nodes([("0", "1"), ("1", "2")]),
            precision=50,
            evaluation_x=[],
            derivatives=[_derivative("0", 1, "1")],
            method_options={"orders": [{"x": "0", "order": 2}, {"x": "1", "order": 0}]},
            function_expression=None,
        )

    assert exc.value.code == "missing_derivative_data"
    assert exc.value.details == {"method": "osculating", "x": "0", "order": 2}


def test_osculating_rejects_duplicate_method_option_order() -> None:
    with pytest.raises(InterpolationError) as exc:
        build_osculating(
            _nodes([("0", "1"), ("1", "2")]),
            precision=50,
            evaluation_x=[],
            derivatives=[],
            method_options={"orders": [{"x": "0", "order": 1}, {"x": "0.0", "order": 1}]},
            function_expression=None,
        )

    assert exc.value.code == "duplicate_derivative_order"
    assert exc.value.details == {"method": "osculating", "x": "0.0", "order": 1}


def test_osculating_rejects_order_for_unknown_node() -> None:
    with pytest.raises(InterpolationError) as exc:
        build_osculating(
            _nodes([("0", "1"), ("1", "2")]),
            precision=50,
            evaluation_x=[],
            derivatives=[],
            method_options={"orders": [{"x": "2", "order": 1}]},
            function_expression=None,
        )

    assert exc.value.code == "derivative_node_not_found"
    assert exc.value.details == {"method": "osculating", "x": "2"}


def test_osculating_order_matching_accepts_high_precision_numeric_nodes() -> None:
    nodes = [
        Node(
            index=0,
            x=to_sympy("0.3", exact=False, precision=50),
            y=to_sympy("1.69", exact=False, precision=50),
            x_text="0.3",
            y_text="1.69",
        ),
        Node(
            index=1,
            x=to_sympy("1.3", exact=False, precision=50),
            y=to_sympy("5.29", exact=False, precision=50),
            x_text="1.3",
            y_text="5.29",
        ),
    ]
    derivatives = [
        DerivativeDatum(
            x=to_sympy("0.3", exact=False, precision=50),
            order=1,
            value=to_sympy("2.6", exact=False, precision=50),
            x_text="0.3",
            value_text="2.6",
        ),
        DerivativeDatum(
            x=to_sympy("1.3", exact=False, precision=50),
            order=1,
            value=to_sympy("4.6", exact=False, precision=50),
            x_text="1.3",
            value_text="4.6",
        ),
    ]

    result = build_osculating(
        nodes,
        precision=50,
        evaluation_x=["0.8"],
        derivatives=derivatives,
        method_options={"orders": [{"x": "0.3", "order": 1}, {"x": "1.3", "order": 1}]},
        function_expression=None,
    )

    assert result["evaluations"][0]["value"] == "3.24"


def test_confluent_repeated_nodes_supports_mixed_derivative_orders() -> None:
    nodes = [
        Node(index=0, x=sp.Rational("0"), y=sp.Rational("1"), x_text="0", y_text="1"),
        Node(index=1, x=sp.Rational("1"), y=sp.Rational("3"), x_text="1", y_text="3"),
    ]

    result = build_confluent_repeated_nodes(
        nodes,
        orders_by_node_index={0: 2, 1: 1},
        derivative_values={
            (0, 1): sp.Rational("2"),
            (0, 2): sp.Rational("6"),
            (1, 1): sp.Rational("5"),
        },
        precision=50,
        method_name="osculating",
    )

    assert result.repeated_x == [
        sp.Rational("0"),
        sp.Rational("0"),
        sp.Rational("0"),
        sp.Rational("1"),
        sp.Rational("1"),
    ]
    assert result.table[0][1] == sp.Rational("2")
    assert result.table[0][2] == sp.Rational("3")
    assert result.table[3][1] == sp.Rational("5")
    assert result.table[2][1] == sp.Rational("2")

    x = sp.symbols("x")
    polynomial = _newton_expression(result.repeated_x, result.coefficients)
    assert polynomial.subs(x, 0) == sp.Rational("1")
    assert sp.diff(polynomial, x).subs(x, 0) == sp.Rational("2")
    assert sp.diff(polynomial, x, 2).subs(x, 0) == sp.Rational("6")
    assert polynomial.subs(x, 1) == sp.Rational("3")
    assert sp.diff(polynomial, x).subs(x, 1) == sp.Rational("5")
