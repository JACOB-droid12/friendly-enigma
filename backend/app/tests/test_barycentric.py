import sympy as sp

from app.core.domain import Node
from app.core.methods.barycentric import build_barycentric, evaluate_barycentric


def test_barycentric_evaluation_matches_line() -> None:
    nodes = [
        Node(index=0, x=sp.Integer(2), y=sp.Integer(4), x_text="2", y_text="4"),
        Node(index=1, x=sp.Integer(5), y=sp.Integer(1), x_text="5", y_text="1"),
    ]

    result = build_barycentric(nodes, precision=50, evaluation_x=["3"])

    assert result["weights"] == [
        {"index": 0, "x": "2", "weight": "-1/3"},
        {"index": 1, "x": "5", "weight": "1/3"},
    ]
    assert result["evaluations"] == [{"x": "3", "value": "3"}]


def test_barycentric_exact_node_hit_returns_node_y() -> None:
    nodes = [
        Node(index=0, x=sp.Integer(2), y=sp.Integer(4), x_text="2", y_text="4"),
        Node(index=1, x=sp.Integer(5), y=sp.Integer(1), x_text="5", y_text="1"),
    ]

    assert evaluate_barycentric(nodes, sp.Integer(2)) == sp.Integer(4)
