import sympy as sp

from app.core.domain import DerivativeDatum, Node
from app.core.errors import InterpolationError
from app.core.methods.repeated_nodes import build_first_derivative_repeated_nodes


def _nodes() -> list[Node]:
    return [
        Node(index=0, x=sp.Rational("0"), y=sp.Rational("1"), x_text="0", y_text="1"),
        Node(index=1, x=sp.Rational("1"), y=sp.Rational("4"), x_text="1", y_text="4"),
    ]


def _derivatives() -> list[DerivativeDatum]:
    return [
        DerivativeDatum(
            x=sp.Rational("0"), order=1, value=sp.Rational("2"), x_text="0", value_text="2"
        ),
        DerivativeDatum(
            x=sp.Rational("1"), order=1, value=sp.Rational("4"), x_text="1", value_text="4"
        ),
    ]


def test_first_derivative_repeated_nodes_duplicates_each_node() -> None:
    result = build_first_derivative_repeated_nodes(
        _nodes(), _derivatives(), precision=50, method_name="hermite"
    )

    assert [node["x"] for node in result.rendered_repeated_nodes] == ["0", "0", "1", "1"]
    assert [node["source_node_index"] for node in result.rendered_repeated_nodes] == [0, 0, 1, 1]
    assert result.rendered_table[0][1] == "2"
    assert result.rendered_table[1][1] == "3"
    assert result.rendered_table[2][1] == "4"
    assert result.coefficients == [
        sp.Rational("1"),
        sp.Rational("2"),
        sp.Rational("1"),
        sp.Rational("0"),
    ]


def test_first_derivative_repeated_nodes_rejects_missing_derivative() -> None:
    try:
        build_first_derivative_repeated_nodes(
            _nodes(), _derivatives()[:1], precision=50, method_name="hermite"
        )
    except InterpolationError as exc:
        assert exc.code == "missing_derivative_data"
        assert exc.details["missing_x"] == ["1"]
    else:
        raise AssertionError("Expected Hermite repeated nodes to require f' data at every node.")


def test_first_derivative_repeated_nodes_rejects_higher_order_input_for_hermite() -> None:
    derivatives = [
        *_derivatives(),
        DerivativeDatum(
            x=sp.Rational("1"), order=2, value=sp.Rational("2"), x_text="1", value_text="2"
        ),
    ]

    try:
        build_first_derivative_repeated_nodes(
            _nodes(), derivatives, precision=50, method_name="hermite"
        )
    except InterpolationError as exc:
        assert exc.code == "invalid_derivative_order"
        assert exc.details["supported_orders"] == [1]
    else:
        raise AssertionError("Expected first-derivative Hermite to reject higher orders.")
