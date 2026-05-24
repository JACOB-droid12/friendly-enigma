import math
from typing import Any

import sympy as sp

from app.core.domain import Node
from app.core.errors import InterpolationError
from app.core.parser import X
from app.core.precision import format_value, to_sympy

MAX_TAYLOR_ORDER = 20


def build_taylor(
    nodes: list[Node],
    *,
    precision: int,
    evaluation_x: list[str],
    function_expression: sp.Expr | None,
    method_options: dict[str, Any],
) -> dict[str, Any]:
    del nodes
    if function_expression is None:
        raise InterpolationError(
            "unsupported_taylor_function",
            "Taylor polynomials require a parsed function expression.",
            {"missing": "function"},
        )
    center, order = _parse_options(method_options, precision=precision)
    terms, expression = _terms(function_expression, center=center, order=order, precision=precision)
    polynomial = sp.expand(expression)
    evaluations = []
    for target in evaluation_x:
        target_value = to_sympy(target, exact=True, precision=precision)
        evaluations.append(
            {
                "x": target,
                "value": format_value(polynomial.subs(X, target_value), precision=precision),
            }
        )
    return {
        "center": format_value(center, precision=precision),
        "order": order,
        "series_name": "Maclaurin" if sp.simplify(center) == 0 else "Taylor",
        "terms": terms,
        "taylor_form": str(expression),
        "expanded": str(polynomial),
        "polynomial": polynomial,
        "latex_expanded": sp.latex(polynomial),
        "latex_taylor": sp.latex(expression),
        "evaluations": evaluations,
        "remainder_note": (
            "Taylor's theorem writes f(x) = P_n(x) + R_n(x), where "
            "R_n(x) = f^(n+1)(xi) / (n+1)! * (x - c)^(n+1) for some xi "
            "between c and x when the derivative exists."
        ),
        "steps": [
            "Choose the Taylor center c and requested order n.",
            "Compute derivatives f^(k)(c) for k = 0 through n.",
            "Build each term f^(k)(c) / k! * (x - c)^k.",
            "Sum the terms to form the Taylor polynomial P_n(x).",
        ],
        "warnings": [],
    }


def _parse_options(method_options: dict[str, Any], *, precision: int) -> tuple[sp.Expr, int]:
    if "center" not in method_options:
        raise InterpolationError(
            "unsupported_taylor_function",
            "Taylor method_options must include a center value.",
            {"missing_option": "center"},
        )
    if "order" not in method_options:
        raise InterpolationError(
            "unsupported_taylor_function",
            "Taylor method_options must include an order value.",
            {"missing_option": "order"},
        )
    center = to_sympy(str(method_options["center"]), exact=True, precision=precision)
    order = _parse_order(method_options["order"])
    return center, order


def _parse_order(raw_order: Any) -> int:
    if isinstance(raw_order, bool):
        raise _invalid_order(raw_order)
    try:
        order = int(raw_order)
    except (TypeError, ValueError) as exc:
        raise _invalid_order(raw_order) from exc
    if str(raw_order) != str(order) and not isinstance(raw_order, int):
        raise _invalid_order(raw_order)
    if order < 0 or order > MAX_TAYLOR_ORDER:
        raise InterpolationError(
            "unsupported_taylor_function",
            "Taylor order must be between 0 and 20.",
            {"order": raw_order, "min_order": 0, "max_order": MAX_TAYLOR_ORDER},
        )
    return order


def _invalid_order(raw_order: Any) -> InterpolationError:
    return InterpolationError(
        "unsupported_taylor_function",
        "Taylor order must be an integer.",
        {"order": raw_order},
    )


def _terms(
    function_expression: sp.Expr,
    *,
    center: sp.Expr,
    order: int,
    precision: int,
) -> tuple[list[dict[str, Any]], sp.Expr]:
    terms: list[dict[str, Any]] = []
    expression = sp.Integer(0)
    for term_order in range(order + 1):
        derivative = sp.diff(function_expression, X, term_order)
        _raise_for_unsupported(derivative, label="derivative", order=term_order)
        derivative_at_center = sp.simplify(derivative.subs(X, center))
        _raise_for_unsupported(
            derivative_at_center, label="derivative_at_center", order=term_order
        )
        coefficient = sp.simplify(derivative_at_center / math.factorial(term_order))
        term = sp.simplify(coefficient * (X - center) ** term_order)
        expression += term
        terms.append(
            {
                "order": term_order,
                "derivative": str(derivative),
                "derivative_at_center": format_value(derivative_at_center, precision=precision),
                "coefficient": format_value(coefficient, precision=precision),
                "term": str(term),
                "latex_term": sp.latex(term),
            }
        )
    return terms, sp.simplify(expression)


def _raise_for_unsupported(value: sp.Expr, *, label: str, order: int) -> None:
    if (
        value.has(sp.I, sp.zoo, sp.nan, sp.oo, -sp.oo, sp.Derivative)
        or value.is_real is False
    ):
        raise InterpolationError(
            "unsupported_taylor_function",
            "Taylor derivative terms must be real and fully symbolic at the selected center.",
            {"artifact": label, "order": order, "value": str(value)},
        )
