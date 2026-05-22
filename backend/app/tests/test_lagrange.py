import sympy as sp

from app.core.domain import Node
from app.core.methods.lagrange import build_lagrange


def test_lagrange_two_point_polynomial() -> None:
    nodes = [
        Node(index=0, x=sp.Integer(2), y=sp.Integer(4), x_text="2", y_text="4"),
        Node(index=1, x=sp.Integer(5), y=sp.Integer(1), x_text="5", y_text="1"),
    ]

    result = build_lagrange(nodes, precision=50, evaluation_x=["3"])

    assert sp.expand(result["polynomial"]) == 6 - sp.Symbol("x")
    assert result["evaluations"] == [{"x": "3", "value": "3"}]
    assert len(result["basis_polynomials"]) == 2
