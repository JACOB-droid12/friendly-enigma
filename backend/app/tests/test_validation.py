import sympy as sp

from app.core.domain import Node
from app.core.validation import validate_nodes, validation_warnings


def test_duplicate_x_values_are_rejected() -> None:
    nodes = [
        Node(index=0, x=sp.Integer(2), y=sp.Integer(4), x_text="2", y_text="4"),
        Node(index=1, x=sp.Integer(2), y=sp.Integer(5), x_text="2", y_text="5"),
    ]

    error = validate_nodes(nodes)

    assert error.code == "duplicate_x"


def test_high_degree_equally_spaced_nodes_warn() -> None:
    nodes = [
        Node(index=i, x=sp.Integer(i), y=sp.Integer(i * i), x_text=str(i), y_text=str(i * i))
        for i in range(11)
    ]

    warnings = validation_warnings(nodes, node_strategy="equally_spaced")
    codes = {warning["code"] for warning in warnings}

    assert "high_degree_warning" in codes
    assert "runge_warning" in codes
