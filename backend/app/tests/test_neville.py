import sympy as sp

from app.core.domain import Node
from app.core.methods.neville import build_neville


def test_neville_returns_target_table() -> None:
    nodes = [
        Node(index=0, x=sp.Integer(2), y=sp.Integer(4), x_text="2", y_text="4"),
        Node(index=1, x=sp.Integer(5), y=sp.Integer(1), x_text="5", y_text="1"),
    ]

    result = build_neville(nodes, precision=50, evaluation_x=["3"])

    assert result["target_results"] == [{"x": "3", "value": "3"}]
    assert result["tables"][0]["rows"][0][1] == "3"


def test_neville_without_target_returns_method_warning() -> None:
    nodes = [
        Node(index=0, x=sp.Integer(2), y=sp.Integer(4), x_text="2", y_text="4"),
        Node(index=1, x=sp.Integer(5), y=sp.Integer(1), x_text="5", y_text="1"),
    ]

    result = build_neville(nodes, precision=50, evaluation_x=[])

    assert result["warnings"][0]["code"] == "neville_requires_evaluation_x"
