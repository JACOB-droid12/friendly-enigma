import pytest

from app.core.errors import InterpolationError
from app.core.parser import parse_function


@pytest.mark.parametrize(
    "expression",
    ["sin(x)", "cos(x)", "exp(x)", "log(x)", "ln(x)", "sqrt(x)", "abs(x)", "pi*x", "E**x"],
)
def test_allowed_function_expressions_parse(expression: str) -> None:
    parsed = parse_function(expression)

    assert parsed.symbol_name == "x"
    assert parsed.expression.free_symbols <= {parsed.symbol}


@pytest.mark.parametrize(
    "expression",
    [
        "__import__('os').system('dir')",
        "open('file')",
        "lambda x: x",
        "x.__class__",
        "y + 1",
        "unknown_func(x)",
    ],
)
def test_unsafe_or_unknown_function_expressions_raise(expression: str) -> None:
    with pytest.raises(InterpolationError) as exc_info:
        parse_function(expression)

    assert exc_info.value.code == "unsafe_expression"
