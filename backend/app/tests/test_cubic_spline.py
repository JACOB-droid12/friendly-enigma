import pytest
import sympy as sp

from app.core.domain import Node
from app.core.errors import InterpolationError
from app.core.methods.cubic_spline import _continuity_checks, build_cubic_spline
from app.core.parser import X
from app.core.precision import to_sympy


def _nodes(data: list[tuple[str, str]] | None = None) -> list[Node]:
    if data is None:
        data = [("1", "2"), ("2", "3"), ("3", "5")]
    return [
        Node(
            index=index,
            x=sp.Rational(x),
            y=sp.Rational(y),
            x_text=x,
            y_text=y,
        )
        for index, (x, y) in enumerate(data)
    ]


def _numeric_nodes() -> list[Node]:
    data = [("1", "2"), ("2", "3"), ("3", "5")]
    return [
        Node(
            index=index,
            x=to_sympy(x, exact=False, precision=50),
            y=to_sympy(y, exact=False, precision=50),
            x_text=x,
            y_text=y,
        )
        for index, (x, y) in enumerate(data)
    ]


def test_natural_cubic_spline_returns_segments_and_continuity_checks() -> None:
    result = build_cubic_spline(
        _nodes(),
        precision=50,
        evaluation_x=["5/2"],
        method_options={"boundary_condition": "natural"},
    )

    assert result["boundary_condition"] == "natural"
    assert result["second_derivatives"] == ["0", "3/2", "0"]
    assert result["segments"][0]["coefficients"] == {
        "a": "2",
        "b": "3/4",
        "c": "0",
        "d": "1/4",
    }
    assert result["segments"][1]["coefficients"] == {
        "a": "3",
        "b": "3/2",
        "c": "3/4",
        "d": "-1/4",
    }
    assert result["continuity_checks"][0]["value_continuous"] is True
    assert result["continuity_checks"][0]["first_derivative_continuous"] is True
    assert result["continuity_checks"][0]["second_derivative_continuous"] is True
    assert result["evaluations"][0]["value"] == "125/32"


def test_numeric_cubic_spline_continuity_accepts_tiny_float_residuals() -> None:
    result = build_cubic_spline(
        _numeric_nodes(),
        precision=50,
        evaluation_x=["5/2"],
        method_options={"boundary_condition": "natural"},
        exact=False,
    )

    check = result["continuity_checks"][0]
    assert check["value_continuous"] is True
    assert check["first_derivative_continuous"] is True
    assert check["second_derivative_continuous"] is True


def test_numeric_continuity_checks_do_not_hide_real_mismatch() -> None:
    residual = sp.Float("1e-20", 50)
    nodes = _numeric_nodes()
    checks = _continuity_checks(
        nodes,
        [X**2, X**2 + residual],
        precision=50,
        exact=False,
    )

    assert checks[0]["value_continuous"] is False


def test_clamped_cubic_spline_enforces_endpoint_derivatives() -> None:
    result = build_cubic_spline(
        _nodes([("0", "0"), ("1", "1"), ("2", "4")]),
        precision=50,
        evaluation_x=["1/2"],
        method_options={
            "boundary_condition": "clamped",
            "left_derivative": "0",
            "right_derivative": "4",
        },
    )

    first = result["segment_polynomials"][0]
    last = result["segment_polynomials"][-1]
    assert result["boundary_condition"] == "clamped"
    assert result["boundary_parameters"] == {
        "left_derivative": "0",
        "right_derivative": "4",
    }
    assert sp.simplify(sp.diff(first, X).subs(X, 0)) == 0
    assert sp.simplify(sp.diff(last, X).subs(X, 2)) == 4


def test_clamped_cubic_spline_requires_endpoint_derivatives() -> None:
    with pytest.raises(InterpolationError) as exc:
        build_cubic_spline(
            _nodes([("0", "0"), ("1", "1")]),
            precision=50,
            evaluation_x=[],
            method_options={"boundary_condition": "clamped"},
        )

    assert exc.value.code == "missing_boundary_parameter"
    assert exc.value.details == {"boundary_condition": "clamped", "missing": "left_derivative"}


def test_not_a_knot_cubic_spline_enforces_third_derivative_continuity() -> None:
    result = build_cubic_spline(
        _nodes([("0", "0"), ("1", "1"), ("2", "0"), ("3", "1")]),
        precision=50,
        evaluation_x=[],
        method_options={"boundary_condition": "not-a-knot"},
    )

    segments = result["segment_polynomials"]
    assert result["boundary_condition"] == "not-a-knot"
    assert sp.simplify(
        sp.diff(segments[0], X, 3).subs(X, 1)
        - sp.diff(segments[1], X, 3).subs(X, 1)
    ) == 0
    assert sp.simplify(
        sp.diff(segments[1], X, 3).subs(X, 2)
        - sp.diff(segments[2], X, 3).subs(X, 2)
    ) == 0


def test_not_a_knot_cubic_spline_requires_four_nodes() -> None:
    with pytest.raises(InterpolationError) as exc:
        build_cubic_spline(
            _nodes([("0", "0"), ("1", "1"), ("2", "0")]),
            precision=50,
            evaluation_x=[],
            method_options={"boundary_condition": "not-a-knot"},
        )

    assert exc.value.code == "invalid_node_count"
    assert exc.value.details["minimum_nodes"] == 4


def test_periodic_cubic_spline_enforces_periodic_endpoint_conditions() -> None:
    result = build_cubic_spline(
        _nodes([("0", "0"), ("1", "1"), ("2", "0")]),
        precision=50,
        evaluation_x=[],
        method_options={"boundary_condition": "periodic"},
    )

    first = result["segment_polynomials"][0]
    last = result["segment_polynomials"][-1]
    assert result["boundary_condition"] == "periodic"
    assert sp.simplify(first.subs(X, 0) - last.subs(X, 2)) == 0
    assert sp.simplify(sp.diff(first, X).subs(X, 0) - sp.diff(last, X).subs(X, 2)) == 0
    assert sp.simplify(
        sp.diff(first, X, 2).subs(X, 0) - sp.diff(last, X, 2).subs(X, 2)
    ) == 0


def test_periodic_cubic_spline_rejects_nonmatching_endpoint_y_values() -> None:
    with pytest.raises(InterpolationError) as exc:
        build_cubic_spline(
            _nodes([("0", "0"), ("1", "1"), ("2", "2")]),
            precision=50,
            evaluation_x=[],
            method_options={"boundary_condition": "periodic"},
        )

    assert exc.value.code == "periodic_endpoint_mismatch"
