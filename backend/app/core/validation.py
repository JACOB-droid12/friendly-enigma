from __future__ import annotations

from typing import Any

import sympy as sp

from app.core.domain import Node
from app.core.errors import InterpolationError


def _is_real_expr(value: sp.Expr) -> bool:
    if value.has(sp.I, sp.zoo, sp.nan, sp.oo, -sp.oo):
        return False
    return value.is_real is not False


def validate_nodes(nodes: list[Node]) -> InterpolationError | None:
    if len(nodes) < 2:
        return InterpolationError("too_few_nodes", "At least two interpolation nodes are required.")
    duplicates: list[str] = []
    for index, node in enumerate(nodes):
        if not _is_real_expr(node.x) or not _is_real_expr(node.y):
            return InterpolationError(
                "non_real_value",
                "Interpolation nodes must contain real values only.",
                {"node": index},
            )
        for previous in nodes[:index]:
            if sp.simplify(node.x - previous.x) == 0:
                duplicates.append(node.x_text)
    if duplicates:
        return InterpolationError(
            "duplicate_x",
            "x-values must be distinct.",
            {"duplicates": sorted(set(duplicates))},
        )
    return None


def raise_for_invalid_nodes(nodes: list[Node]) -> None:
    error = validate_nodes(nodes)
    if error is not None:
        raise error


def validate_interval(
    interval: list[str] | None, *, exact: bool, precision: int
) -> tuple[sp.Expr, sp.Expr]:
    from app.core.precision import to_sympy

    if interval is None or len(interval) != 2:
        raise InterpolationError("invalid_interval", "Interval must contain exactly two values.")
    left = to_sympy(interval[0], exact=exact, precision=precision)
    right = to_sympy(interval[1], exact=exact, precision=precision)
    if not _is_real_expr(left) or not _is_real_expr(right) or not bool(left < right):
        raise InterpolationError(
            "invalid_interval",
            "Interval bounds must be real values with left bound less than right bound.",
            {"interval": interval},
        )
    return left, right


def validate_node_count(node_count: int | None) -> int:
    if node_count is None or node_count < 2:
        raise InterpolationError("invalid_node_count", "Node count must be at least 2.")
    return node_count


def validation_warnings(
    nodes: list[Node], *, node_strategy: str | None = None
) -> list[dict[str, Any]]:
    warnings: list[dict[str, Any]] = []
    degree = len(nodes) - 1
    if degree >= 10:
        warnings.append(
            {
                "code": "high_degree_warning",
                "message": "High-degree interpolation may be numerically unstable.",
                "details": {"degree": degree},
            }
        )
    sorted_x = sorted(nodes, key=lambda node: float(sp.N(node.x)))
    spacings = [
        abs(sp.N(sorted_x[index + 1].x - sorted_x[index].x, 30))
        for index in range(len(sorted_x) - 1)
    ]
    if spacings:
        min_spacing = min(spacings)
        max_abs_x = max(abs(sp.N(node.x, 30)) for node in nodes)
        if min_spacing < sp.Float("1e-10") * max(1, float(max_abs_x)):
            warnings.append(
                {
                    "code": "close_x_warning",
                    "message": "Some x-values are very close and may cause poor conditioning.",
                    "details": {"minimum_spacing": str(min_spacing)},
                }
            )
    if degree >= 10 and (node_strategy == "equally_spaced" or _is_equally_spaced(sorted_x)):
        warnings.append(
            {
                "code": "runge_warning",
                "message": "High-degree equally spaced interpolation may oscillate.",
                "details": {"degree": degree},
            }
        )
    return warnings


def _is_equally_spaced(sorted_nodes: list[Node]) -> bool:
    if len(sorted_nodes) < 3:
        return False
    spacing = sp.simplify(sorted_nodes[1].x - sorted_nodes[0].x)
    return all(
        sp.simplify((sorted_nodes[index + 1].x - sorted_nodes[index].x) - spacing) == 0
        for index in range(1, len(sorted_nodes) - 1)
    )
