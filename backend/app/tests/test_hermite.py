import sympy as sp

from app.core.domain import DerivativeDatum, Node
from app.core.methods.hermite import _basis_form, build_hermite, build_hermite_divided_difference
from app.core.methods.repeated_nodes import build_first_derivative_repeated_nodes
from app.core.precision import to_sympy


def _lecture_nodes() -> list[Node]:
    data = [
        ("1.3", "0.6200860"),
        ("1.6", "0.4554022"),
        ("1.9", "0.2818186"),
    ]
    return [
        Node(index=index, x=sp.Rational(x), y=sp.Rational(y), x_text=x, y_text=y)
        for index, (x, y) in enumerate(data)
    ]


def _numeric_lecture_nodes() -> list[Node]:
    data = [
        ("1.3", "0.6200860"),
        ("1.6", "0.4554022"),
        ("1.9", "0.2818186"),
    ]
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


def _lecture_derivatives() -> list[DerivativeDatum]:
    data = [
        ("1.3", "-0.52202324741466"),
        ("1.6", "-0.56989593526168"),
        ("1.9", "-0.581157072713434"),
    ]
    return [
        DerivativeDatum(
            x=sp.Rational(x), order=1, value=sp.Rational(value), x_text=x, value_text=value
        )
        for x, value in data
    ]


def _numeric_lecture_derivatives() -> list[DerivativeDatum]:
    data = [
        ("1.3", "-0.52202324741466"),
        ("1.6", "-0.56989593526168"),
        ("1.9", "-0.581157072713434"),
    ]
    return [
        DerivativeDatum(
            x=to_sympy(x, exact=False, precision=50),
            order=1,
            value=to_sympy(value, exact=False, precision=50),
            x_text=x,
            value_text=value,
        )
        for x, value in data
    ]


def _quadratic_nodes() -> list[Node]:
    return [
        Node(index=0, x=sp.Rational("0"), y=sp.Rational("1"), x_text="0", y_text="1"),
        Node(index=1, x=sp.Rational("1"), y=sp.Rational("4"), x_text="1", y_text="4"),
    ]


def _quadratic_derivatives() -> list[DerivativeDatum]:
    return [
        DerivativeDatum(
            x=sp.Rational("0"), order=1, value=sp.Rational("2"), x_text="0", value_text="2"
        ),
        DerivativeDatum(
            x=sp.Rational("1"), order=1, value=sp.Rational("4"), x_text="1", value_text="4"
        ),
    ]


def test_hermite_divided_difference_lecture_example_evaluates_x_1_5() -> None:
    result = build_hermite_divided_difference(
        _lecture_nodes(), precision=50, evaluation_x=["1.5"], derivatives=_lecture_derivatives()
    )

    assert result["repeated_nodes"][0]["x"] == "13/10"
    assert result["divided_difference_table"][0][1] == "-26101162370733/50000000000000"
    assert result["coefficients"][0] == "310043/500000"
    assert result["evaluations"][0]["x"] == "1.5"
    assert (
        abs(
            sp.Rational(result["evaluations"][0]["value"])
            - sp.Rational("0.511827703911461698765432098765")
        )
        < sp.Rational("1e-28")
    )


def test_hermite_returns_basis_form_for_low_degree_data() -> None:
    result = build_hermite(
        _quadratic_nodes(), precision=50, evaluation_x=["1/2"], derivatives=_quadratic_derivatives()
    )

    assert result["expanded"] == "x**2 + 2*x + 1"
    assert result["evaluations"][0]["value"] == "9/4"
    assert result["basis_form"]["status"] == "included"
    assert result["basis_form"]["terms"][0]["value_basis"]
    assert result["basis_form"]["terms"][0]["derivative_basis"]


def test_numeric_hermite_basis_accepts_tiny_float_residual_coefficients() -> None:
    result = build_hermite(
        _numeric_lecture_nodes(),
        precision=50,
        evaluation_x=["1.5"],
        derivatives=_numeric_lecture_derivatives(),
        exact=False,
    )

    assert result["basis_form"]["matches_divided_difference"] is True


def test_numeric_hermite_basis_does_not_hide_real_mismatch() -> None:
    nodes = _numeric_lecture_nodes()
    derivatives = _numeric_lecture_derivatives()
    repeated = build_first_derivative_repeated_nodes(
        nodes, derivatives, precision=50, method_name="hermite"
    )
    result = build_hermite(
        nodes,
        precision=50,
        evaluation_x=[],
        derivatives=derivatives,
        exact=False,
    )
    basis_form = _basis_form(
        nodes,
        repeated,
        result["polynomial"] + sp.Float("1e-20", 50),
        precision=50,
        exact=False,
    )

    assert basis_form["matches_divided_difference"] is False
