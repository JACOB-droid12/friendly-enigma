import sympy as sp

from app.core.domain import Node
from app.core.errors import InterpolationError
from app.core.methods.cubic_spline import _continuity_checks, build_cubic_spline
from app.core.parser import X
from app.core.precision import to_sympy


def _nodes() -> list[Node]:
    return [
        Node(index=0, x=sp.Rational("1"), y=sp.Rational("2"), x_text="1", y_text="2"),
        Node(index=1, x=sp.Rational("2"), y=sp.Rational("3"), x_text="2", y_text="3"),
        Node(index=2, x=sp.Rational("3"), y=sp.Rational("5"), x_text="3", y_text="5"),
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


def test_cubic_spline_rejects_unsupported_boundary_condition() -> None:
    try:
        build_cubic_spline(
            _nodes(),
            precision=50,
            evaluation_x=[],
            method_options={"boundary_condition": "clamped"},
        )
    except InterpolationError as exc:
        assert exc.code == "unsupported_boundary_condition"
    else:
        raise AssertionError("Expected P2.4 cubic spline to support natural boundary only.")
