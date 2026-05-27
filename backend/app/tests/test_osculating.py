import sympy as sp

from app.core.domain import Node
from app.core.methods.repeated_nodes import build_confluent_repeated_nodes


def test_confluent_repeated_nodes_supports_mixed_derivative_orders() -> None:
    nodes = [
        Node(index=0, x=sp.Rational("0"), y=sp.Rational("1"), x_text="0", y_text="1"),
        Node(index=1, x=sp.Rational("1"), y=sp.Rational("4"), x_text="1", y_text="4"),
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
