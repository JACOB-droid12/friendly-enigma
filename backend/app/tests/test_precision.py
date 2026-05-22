import sympy as sp

from app.core.precision import (
    comparison_tolerances,
    format_value,
    parse_numeric_string,
    values_close,
)


def test_parse_decimal_string_as_exact_rational() -> None:
    value = parse_numeric_string("2.75", exact=True, precision=50)

    assert value == sp.Rational(11, 4)


def test_parse_fraction_string_as_exact_rational() -> None:
    value = parse_numeric_string("1/3", exact=True, precision=50)

    assert value == sp.Rational(1, 3)


def test_high_precision_parse_keeps_decimal_string_precision() -> None:
    value = parse_numeric_string("0.123456789123456789", exact=False, precision=80)

    assert "0.123456789123456789" in format_value(value, precision=30)


def test_comparison_tolerance_leaves_four_guard_digits() -> None:
    tolerances = comparison_tolerances(30)

    assert tolerances["abs_tol"] == "1e-26"
    assert tolerances["rel_tol"] == "1e-26"
    assert tolerances["precision_digits_used_for_comparison"] == 30


def test_values_close_uses_absolute_or_relative_tolerance() -> None:
    assert values_close("1.00000000000000000000000001", "1.0", precision=30)
