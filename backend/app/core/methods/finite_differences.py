from dataclasses import dataclass
from typing import Any

import sympy as sp

from app.core.domain import Node


@dataclass(slots=True)
class SpacingResult:
    is_equal: bool
    h: sp.Expr | None
    spacings: list[sp.Expr]


def equal_spacing(nodes: list[Node]) -> SpacingResult:
    sorted_nodes = sorted(nodes, key=lambda node: float(sp.N(node.x, 30)))
    spacings = [
        sp.simplify(sorted_nodes[index + 1].x - sorted_nodes[index].x)
        for index in range(len(sorted_nodes) - 1)
    ]
    if not spacings:
        return SpacingResult(is_equal=False, h=None, spacings=[])
    first = spacings[0]
    is_equal = all(sp.simplify(spacing - first) == 0 for spacing in spacings[1:])
    return SpacingResult(is_equal=is_equal, h=first if is_equal else None, spacings=spacings)


def build_forward_difference_table(nodes: list[Node]) -> list[list[sp.Expr | None]]:
    n = len(nodes)
    table: list[list[sp.Expr | None]] = [[None for _ in range(n)] for _ in range(n)]
    for row, node in enumerate(nodes):
        table[row][0] = node.y
    for order in range(1, n):
        for row in range(n - order):
            table[row][order] = sp.simplify(table[row + 1][order - 1] - table[row][order - 1])
    return table


def build_backward_difference_table(nodes: list[Node]) -> list[list[sp.Expr | None]]:
    n = len(nodes)
    table: list[list[sp.Expr | None]] = [[None for _ in range(n)] for _ in range(n)]
    for row, node in enumerate(nodes):
        table[row][0] = node.y
    for order in range(1, n):
        for row in range(order, n):
            table[row][order] = sp.simplify(table[row][order - 1] - table[row - 1][order - 1])
    return table


def target_guidance(nodes: list[Node], target: sp.Expr) -> dict[str, Any]:
    sorted_nodes = sorted(nodes, key=lambda node: float(sp.N(node.x, 30)))
    xs = [node.x for node in sorted_nodes]
    left = xs[0]
    right = xs[-1]
    midpoint = sp.simplify((left + right) / 2)
    span = sp.simplify(right - left)
    if bool(abs(target - midpoint) <= abs(span) / 6):
        recommended = "stirling"
    elif bool(target < midpoint):
        recommended = "newton_forward"
    else:
        recommended = "newton_backward"
    return {
        "recommended": recommended,
        "target": str(target),
        "left": str(left),
        "right": str(right),
        "midpoint": str(midpoint),
    }
