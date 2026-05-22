import sympy as sp

from app.core.domain import Node
from app.core.precision import format_value, to_sympy


def _neville_table(nodes: list[Node], target: sp.Expr) -> list[list[sp.Expr | None]]:
    n = len(nodes)
    table: list[list[sp.Expr | None]] = [[None for _ in range(n)] for _ in range(n)]
    for index, node in enumerate(nodes):
        table[index][0] = node.y
    for order in range(1, n):
        for row in range(n - order):
            left = table[row + 1][order - 1]
            right = table[row][order - 1]
            numerator = (target - nodes[row].x) * left - (target - nodes[row + order].x) * right
            denominator = nodes[row + order].x - nodes[row].x
            table[row][order] = sp.simplify(numerator / denominator)
    return table


def build_neville(
    nodes: list[Node], *, precision: int, evaluation_x: list[str]
) -> dict[str, object]:
    if not evaluation_x:
        return {
            "target_results": [],
            "tables": [],
            "warnings": [
                {
                    "code": "neville_requires_evaluation_x",
                    "message": "Neville's method requires target x-values.",
                    "details": {},
                }
            ],
        }
    tables = []
    target_results = []
    for target in evaluation_x:
        target_value = to_sympy(target, exact=True, precision=precision)
        table = _neville_table(nodes, target_value)
        rows = [
            [
                format_value(value, precision=precision) if value is not None else None
                for value in row
            ]
            for row in table
        ]
        result = table[0][len(nodes) - 1]
        target_results.append({"x": target, "value": format_value(result, precision=precision)})
        tables.append({"x": target, "rows": rows})
    return {"target_results": target_results, "tables": tables, "warnings": []}
