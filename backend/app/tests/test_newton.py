import sympy as sp

from app.core.domain import Node
from app.core.methods.newton import build_newton


def test_newton_divided_differences_for_two_points() -> None:
    nodes = [
        Node(index=0, x=sp.Integer(2), y=sp.Integer(4), x_text="2", y_text="4"),
        Node(index=1, x=sp.Integer(5), y=sp.Integer(1), x_text="5", y_text="1"),
    ]

    result = build_newton(nodes, precision=50, evaluation_x=["3"])

    assert result["coefficients"] == ["4", "-1"]
    assert result["divided_difference_table"][0][:2] == ["4", "-1"]
    assert result["evaluations"] == [{"x": "3", "value": "3"}]
