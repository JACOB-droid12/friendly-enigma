import re

import sympy as sp
from sympy.core.function import AppliedUndef
from sympy.parsing.sympy_parser import (
    convert_xor,
    implicit_multiplication_application,
    parse_expr,
    standard_transformations,
)

from app.core.domain import ParsedFunction
from app.core.errors import InterpolationError

X = sp.Symbol("x", real=True)

ALLOWED_LOCALS = {
    "x": X,
    "sin": sp.sin,
    "cos": sp.cos,
    "tan": sp.tan,
    "exp": sp.exp,
    "log": sp.log,
    "ln": sp.log,
    "sqrt": sp.sqrt,
    "abs": sp.Abs,
    "Abs": sp.Abs,
    "asin": sp.asin,
    "acos": sp.acos,
    "atan": sp.atan,
    "sinh": sp.sinh,
    "cosh": sp.cosh,
    "tanh": sp.tanh,
    "pi": sp.pi,
    "E": sp.E,
}
SAFE_GLOBALS = {
    "__builtins__": {},
    "Integer": sp.Integer,
    "Float": sp.Float,
    "Rational": sp.Rational,
    "Symbol": sp.Symbol,
    "Function": sp.Function,
}

DISALLOWED_PATTERN = re.compile(
    r"(__|;|=|:|@|\\|\[|\]|\{|\}|\"|'|`|\.|\blambda\b|\bimport\b|\bopen\b)"
)
TRANSFORMATIONS = standard_transformations + (implicit_multiplication_application, convert_xor)


def parse_function(expression: str) -> ParsedFunction:
    text = expression.strip()
    if not text or DISALLOWED_PATTERN.search(text):
        raise InterpolationError(
            "unsafe_expression",
            "Function expression contains unsafe or unsupported syntax.",
            {"expression": expression},
        )
    try:
        parsed = parse_expr(
            text,
            local_dict=ALLOWED_LOCALS,
            global_dict=SAFE_GLOBALS,
            transformations=TRANSFORMATIONS,
            evaluate=True,
        )
    except Exception as exc:
        raise InterpolationError(
            "unsafe_expression",
            "Function expression could not be parsed safely.",
            {"expression": expression},
        ) from exc

    if parsed.free_symbols - {X}:
        raise InterpolationError(
            "unsafe_expression",
            "Function expression may only use the variable x.",
            {"symbols": sorted(str(symbol) for symbol in parsed.free_symbols)},
        )
    if any(isinstance(func, AppliedUndef) for func in parsed.atoms(sp.Function)):
        raise InterpolationError(
            "unsafe_expression",
            "Function expression contains an unknown function.",
            {"expression": expression},
        )
    if parsed.has(sp.I):
        raise InterpolationError(
            "non_real_value",
            "Function expression must be real-valued for real inputs.",
            {"expression": expression},
        )
    return ParsedFunction(expression=sp.simplify(parsed), symbol=X)
