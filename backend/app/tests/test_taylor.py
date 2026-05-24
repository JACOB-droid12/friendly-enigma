from app.core.errors import InterpolationError
from app.core.methods.taylor import build_taylor
from app.core.parser import parse_function


def test_taylor_cos_second_and_third_polynomials_about_zero() -> None:
    expression = parse_function("cos(x)").expression

    second = build_taylor(
        [],
        precision=50,
        evaluation_x=["1/2"],
        function_expression=expression,
        method_options={"center": "0", "order": 2},
    )
    third = build_taylor(
        [],
        precision=50,
        evaluation_x=["1/2"],
        function_expression=expression,
        method_options={"center": "0", "order": 3},
    )

    assert second["expanded"] in {"1 - x**2/2", "-x**2/2 + 1"}
    assert third["expanded"] in {"1 - x**2/2", "-x**2/2 + 1"}
    assert second["evaluations"][0]["value"] == "7/8"
    assert [term["order"] for term in third["terms"]] == [0, 1, 2, 3]
    assert third["remainder_note"]


def test_taylor_sin_maclaurin_terms_through_order_five() -> None:
    result = build_taylor(
        [],
        precision=50,
        evaluation_x=["1"],
        function_expression=parse_function("sin(x)").expression,
        method_options={"center": "0", "order": 5},
    )

    assert result["expanded"] == "x**5/120 - x**3/6 + x"
    assert len(result["terms"]) == 6
    assert result["terms"][1]["derivative_at_center"] == "1"
    assert result["terms"][3]["term"] == "-x**3/6"
    assert result["terms"][5]["term"] == "x**5/120"
    assert result["series_name"] == "Maclaurin"


def test_taylor_rejects_unsafe_function_through_existing_parser() -> None:
    try:
        parse_function("__import__('os').system('dir')")
    except InterpolationError as exc:
        assert exc.code == "unsafe_expression"
    else:
        raise AssertionError("Expected unsafe Taylor function input to be rejected by parser.")


def test_taylor_requires_center_and_order_options() -> None:
    try:
        build_taylor(
            [],
            precision=50,
            evaluation_x=[],
            function_expression=parse_function("cos(x)").expression,
            method_options={"center": "0"},
        )
    except InterpolationError as exc:
        assert exc.code == "unsupported_taylor_function"
        assert exc.details["missing_option"] == "order"
    else:
        raise AssertionError("Expected Taylor to require an explicit order option.")
