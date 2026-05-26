import sympy as sp

from app.core.domain import Node
from app.core.methods.finite_differences import (
    build_backward_difference_table,
    build_forward_difference_table,
    equal_spacing,
    target_guidance,
)
from app.core.precision import to_sympy


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


def _numeric_lecture_nodes() -> list[Node]:
    data = [
        ("1.0", "0.7651977"),
        ("1.3", "0.6200860"),
        ("1.6", "0.4554022"),
        ("1.9", "0.2818186"),
        ("2.2", "0.1103623"),
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


def test_equal_spacing_returns_spacing_for_lecture_nodes() -> None:
    spacing = equal_spacing(_lecture_nodes())

    assert spacing.is_equal
    assert spacing.h == sp.Rational(3, 10)


def test_equal_spacing_accepts_numeric_decimal_nodes_with_precision_tolerance() -> None:
    spacing = equal_spacing(_numeric_lecture_nodes(), exact=False, precision=50)

    assert spacing.is_equal
    assert spacing.h is not None


def test_equal_spacing_rejects_unequal_nodes() -> None:
    nodes = _lecture_nodes()
    nodes[2] = Node(
        index=2,
        x=sp.Rational("1.7"),
        y=nodes[2].y,
        x_text="1.7",
        y_text=nodes[2].y_text,
    )

    spacing = equal_spacing(nodes)

    assert spacing.is_equal is False


def test_equal_spacing_numeric_tolerance_rejects_truly_unequal_nodes() -> None:
    nodes = _numeric_lecture_nodes()
    nodes[2] = Node(
        index=2,
        x=to_sympy("1.61", exact=False, precision=50),
        y=nodes[2].y,
        x_text="1.61",
        y_text=nodes[2].y_text,
    )

    spacing = equal_spacing(nodes, exact=False, precision=50)

    assert spacing.is_equal is False


def test_forward_difference_table_matches_lecture_first_column() -> None:
    table = build_forward_difference_table(_lecture_nodes())

    assert table[0][0] == sp.Rational("0.7651977")
    assert table[0][1] == sp.Rational("-0.1451117")
    assert table[0][2] == sp.Rational("-0.0195721")


def test_backward_difference_table_uses_last_node_differences() -> None:
    table = build_backward_difference_table(_lecture_nodes())

    assert table[-1][0] == sp.Rational("0.1103623")
    assert table[-1][1] == sp.Rational("-0.1714563")
    assert table[-1][2] == sp.Rational("0.0021273")


def test_target_guidance_classifies_front_back_center() -> None:
    nodes = _lecture_nodes()

    assert target_guidance(nodes, sp.Rational("1.1"))["recommended"] == "newton_forward"
    assert target_guidance(nodes, sp.Rational("2.1"))["recommended"] == "newton_backward"
    assert target_guidance(nodes, sp.Rational("1.5"))["recommended"] == "stirling"
