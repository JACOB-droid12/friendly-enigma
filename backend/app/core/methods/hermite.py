from typing import Any

import sympy as sp

from app.core.domain import DerivativeDatum, Node
from app.core.methods.repeated_nodes import (
    RepeatedNodeResult,
    build_first_derivative_repeated_nodes,
)
from app.core.parser import X
from app.core.precision import format_value, to_sympy, values_close

MAX_BASIS_NODE_COUNT = 5


def build_hermite_divided_difference(
    nodes: list[Node],
    *,
    precision: int,
    evaluation_x: list[str],
    derivatives: list[DerivativeDatum],
) -> dict[str, Any]:
    repeated = build_first_derivative_repeated_nodes(
        nodes, derivatives, precision=precision, method_name="hermite_divided_difference"
    )
    return _base_payload(nodes, repeated, precision=precision, evaluation_x=evaluation_x)


def build_hermite(
    nodes: list[Node],
    *,
    precision: int,
    evaluation_x: list[str],
    derivatives: list[DerivativeDatum],
    exact: bool = True,
) -> dict[str, Any]:
    repeated = build_first_derivative_repeated_nodes(
        nodes, derivatives, precision=precision, method_name="hermite"
    )
    payload = _base_payload(nodes, repeated, precision=precision, evaluation_x=evaluation_x)
    warnings = list(payload["warnings"])
    payload["basis_form"] = _basis_form(
        nodes, repeated, payload["polynomial"], precision=precision, exact=exact
    )
    if payload["basis_form"]["status"] == "omitted":
        warnings.append(
            {
                "code": "expanded_polynomial_omitted",
                "message": (
                    "Hermite basis-form output was omitted because the symbolic basis is large."
                ),
                "details": {
                    "artifact": "hermite_basis_form",
                    "node_count": len(nodes),
                    "max_included_node_count": MAX_BASIS_NODE_COUNT,
                },
            }
        )
    payload["warnings"] = warnings
    return payload


def _base_payload(
    nodes: list[Node],
    repeated: RepeatedNodeResult,
    *,
    precision: int,
    evaluation_x: list[str],
) -> dict[str, Any]:
    expression = _newton_expression(repeated.repeated_x, repeated.coefficients)
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
        "repeated_nodes": repeated.rendered_repeated_nodes,
        "divided_difference_table": repeated.rendered_table,
        "coefficients": [
            format_value(coefficient, precision=precision) for coefficient in repeated.coefficients
        ],
        "nested_form": str(_nested_expression(repeated.repeated_x, repeated.coefficients)),
        "expanded": str(polynomial),
        "polynomial": polynomial,
        "latex_expanded": sp.latex(polynomial),
        "latex_hermite": sp.latex(expression),
        "evaluations": evaluations,
        "steps": [
            (
                "Repeat each interpolation node once for the function value and once for its "
                "derivative."
            ),
            "Use the known first derivative for divided differences with repeated nodes.",
            "Complete the divided-difference table and use the first row as Hermite coefficients.",
            "Build the Hermite polynomial in Newton form and expand it only as a display artifact.",
        ],
        "warnings": [],
    }


def _newton_expression(repeated_x: list[sp.Expr], coefficients: list[sp.Expr]) -> sp.Expr:
    expression = coefficients[0]
    factor = sp.Integer(1)
    for index in range(1, len(coefficients)):
        factor *= X - repeated_x[index - 1]
        expression += coefficients[index] * factor
    return sp.simplify(expression)


def _nested_expression(repeated_x: list[sp.Expr], coefficients: list[sp.Expr]) -> sp.Expr:
    expression = coefficients[-1]
    for index in range(len(coefficients) - 2, -1, -1):
        expression = coefficients[index] + (X - repeated_x[index]) * expression
    return sp.simplify(expression)


def _basis_form(
    nodes: list[Node],
    repeated: RepeatedNodeResult,
    polynomial: sp.Expr,
    *,
    precision: int,
    exact: bool = True,
) -> dict[str, Any]:
    if len(nodes) > MAX_BASIS_NODE_COUNT:
        return {
            "status": "omitted",
            "reason": "symbolic_basis_too_large",
            "node_count": len(nodes),
            "max_included_node_count": MAX_BASIS_NODE_COUNT,
        }
    terms = []
    expression = sp.Integer(0)
    for index, node in enumerate(nodes):
        lagrange_basis = _lagrange_basis(nodes, index)
        basis_derivative_at_node = sp.diff(lagrange_basis, X).subs(X, node.x)
        value_basis = sp.simplify(
            (1 - 2 * (X - node.x) * basis_derivative_at_node) * lagrange_basis**2
        )
        derivative_basis = sp.simplify((X - node.x) * lagrange_basis**2)
        first_derivative = repeated.derivatives_by_node_index[node.index].value
        expression += node.y * value_basis + first_derivative * derivative_basis
        terms.append(
            {
                "node_index": node.index,
                "x": format_value(node.x, precision=precision),
                "f_x": format_value(node.y, precision=precision),
                "f_prime_x": format_value(first_derivative, precision=precision),
                "lagrange_basis": str(lagrange_basis),
                "value_basis": str(value_basis),
                "derivative_basis": str(derivative_basis),
                "latex_lagrange_basis": sp.latex(lagrange_basis),
                "latex_value_basis": sp.latex(value_basis),
                "latex_derivative_basis": sp.latex(derivative_basis),
            }
        )
    expanded = sp.expand(expression)
    return {
        "status": "included",
        "formula": "H_i(x)=(1-2(x-x_i)L_i'(x_i))L_i(x)^2, K_i(x)=(x-x_i)L_i(x)^2",
        "terms": terms,
        "expanded": str(expanded),
        "latex": sp.latex(expression),
        "matches_divided_difference": _polynomials_match(
            expanded, polynomial, exact=exact, precision=precision
        ),
    }


def _polynomials_match(left: sp.Expr, right: sp.Expr, *, exact: bool, precision: int) -> bool:
    difference = sp.expand(left - right)
    if exact:
        return sp.simplify(difference) == 0
    coefficient_precision = max(8, precision - 1)
    try:
        polynomial = sp.Poly(difference, X)
    except sp.PolynomialError:
        return values_close(difference, 0, precision=coefficient_precision)
    return all(
        values_close(coefficient, 0, precision=coefficient_precision)
        for coefficient in polynomial.coeffs()
    )


def _lagrange_basis(nodes: list[Node], index: int) -> sp.Expr:
    numerator = sp.Integer(1)
    denominator = sp.Integer(1)
    node = nodes[index]
    for other_index, other in enumerate(nodes):
        if other_index == index:
            continue
        numerator *= X - other.x
        denominator *= node.x - other.x
    return sp.simplify(numerator / denominator)
