import sympy as sp

from app.core.domain import Node
from app.core.precision import format_value, to_sympy

X = sp.Symbol("x")


def _divided_difference_table(nodes: list[Node]) -> list[list[sp.Expr | None]]:
    n = len(nodes)
    table: list[list[sp.Expr | None]] = [[None for _ in range(n)] for _ in range(n)]
    for row, node in enumerate(nodes):
        table[row][0] = node.y
    for order in range(1, n):
        for row in range(n - order):
            numerator = table[row + 1][order - 1] - table[row][order - 1]
            denominator = nodes[row + order].x - nodes[row].x
            table[row][order] = sp.simplify(numerator / denominator)
    return table


def _newton_polynomial(nodes: list[Node], coefficients: list[sp.Expr]) -> sp.Expr:
    polynomial = coefficients[0]
    factor = sp.Integer(1)
    for index in range(1, len(coefficients)):
        factor *= X - nodes[index - 1].x
        polynomial += coefficients[index] * factor
    return sp.expand(polynomial)


def build_newton(
    nodes: list[Node], *, precision: int, evaluation_x: list[str]
) -> dict[str, object]:
    table = _divided_difference_table(nodes)
    coefficients = [table[0][index] for index in range(len(nodes))]
    polynomial = _newton_polynomial(nodes, coefficients)
    rendered_table = [
        [format_value(value, precision=precision) if value is not None else None for value in row]
        for row in table
    ]
    rendered_coefficients = [format_value(value, precision=precision) for value in coefficients]
    evaluations = []
    for target in evaluation_x:
        target_value = to_sympy(target, exact=True, precision=precision)
        evaluations.append(
            {
                "x": target,
                "value": format_value(polynomial.subs(X, target_value), precision=precision),
            }
        )
    nested_form = _nested_form(nodes, coefficients)
    return {
        "divided_difference_table": rendered_table,
        "coefficients": rendered_coefficients,
        "nested_form": nested_form,
        "expanded": str(polynomial),
        "polynomial": polynomial,
        "latex_expanded": sp.latex(polynomial),
        "latex_newton": sp.latex(_newton_expression(nodes, coefficients)),
        "evaluations": evaluations,
        "steps": [
            "Place y-values in the first divided-difference column.",
            "Compute each higher-order divided difference from neighboring lower-order values.",
            "Use the first row as coefficients in Newton form.",
        ],
        "warnings": [],
    }


def _newton_expression(nodes: list[Node], coefficients: list[sp.Expr]) -> sp.Expr:
    expression = coefficients[0]
    factor = sp.Integer(1)
    for index in range(1, len(coefficients)):
        factor *= X - nodes[index - 1].x
        expression += coefficients[index] * factor
    return expression


def _nested_form(nodes: list[Node], coefficients: list[sp.Expr]) -> str:
    expression = _newton_expression(nodes, coefficients)
    return str(expression)
