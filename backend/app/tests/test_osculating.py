import sympy as sp

from app.core.domain import Node
from app.core.methods.repeated_nodes import build_confluent_repeated_nodes


def _newton_expression(repeated_x: list[sp.Expr], coefficients: list[sp.Expr]) -> sp.Expr:
    x = sp.symbols("x")
    expression = sp.Integer(0)
    basis = sp.Integer(1)
    for index, coefficient in enumerate(coefficients):
        if index > 0:
            basis *= x - repeated_x[index - 1]
        expression += coefficient * basis
    return sp.expand(expression)


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
