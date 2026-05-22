import sympy as sp

from app.core.normalization import normalize_request
from app.schemas import InterpolateRequest


def test_points_mode_normalizes_to_canonical_nodes() -> None:
    request = InterpolateRequest(mode="points", points=[["2", "4"], ["5", "1"]])

    problem = normalize_request(request)

    assert [(node.x, node.y) for node in problem.nodes] == [
        (sp.Integer(2), sp.Integer(4)),
        (sp.Integer(5), sp.Integer(1)),
    ]
    assert problem.exact is True


def test_x_values_with_function_mode_evaluates_backend_function() -> None:
    request = InterpolateRequest(
        mode="x_values_with_function",
        x_values=["2", "2.75", "4"],
        function="1/x",
        evaluation_x=["3"],
    )

    problem = normalize_request(request)

    assert [node.y for node in problem.nodes] == [
        sp.Rational(1, 2),
        sp.Rational(4, 11),
        sp.Rational(1, 4),
    ]
    assert str(problem.original_function) == "1/x"


def test_function_interval_generates_equally_spaced_nodes() -> None:
    request = InterpolateRequest(
        mode="function_interval",
        function="sin(x)",
        interval=["-1", "1"],
        node_strategy="equally_spaced",
        node_count=3,
        exact=False,
    )

    problem = normalize_request(request)

    assert [node.x_text for node in problem.nodes] == ["-1", "0", "1"]
    assert problem.exact is False
