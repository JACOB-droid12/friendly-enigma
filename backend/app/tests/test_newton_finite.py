import sympy as sp

from app.core.domain import Node
from app.core.errors import InterpolationError
from app.core.methods.newton_finite import (
    build_newton_backward,
    build_newton_forward,
    build_stirling,
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
        Node(index=index, x=sp.Rational(x), y=sp.Rational(y), x_text=x, y_text=y)
        for index, (x, y) in enumerate(data)
    ]


def test_newton_forward_lecture_example_evaluates_x_1_5() -> None:
    result = build_newton_forward(_lecture_nodes(), precision=50, evaluation_x=["1.5"])

    assert result["evaluations"][0]["x"] == "1.5"
    assert (
        sp.Abs(
            sp.Rational(result["evaluations"][0]["value"]) - sp.Rational("0.5118200")
        )
        < sp.Rational("1e-7")
    )
    assert result["spacing_h"] == "3/10"
    assert result["anchor_index"] == 0


def test_newton_backward_lecture_example_evaluates_x_2() -> None:
    result = build_newton_backward(_lecture_nodes(), precision=50, evaluation_x=["2"])

    assert result["evaluations"][0]["x"] == "2"
    assert (
        sp.Abs(sp.Rational(result["evaluations"][0]["value"]) - sp.Rational("0.2238754"))
        < sp.Rational("1e-7")
    )
    assert result["spacing_h"] == "3/10"
    assert result["anchor_index"] == 4


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
