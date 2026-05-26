import math
from typing import Any

import sympy as sp

from app.core.domain import Node
from app.core.errors import InterpolationError
from app.core.methods.finite_differences import (
    build_backward_difference_table,
    build_forward_difference_table,
    equal_spacing,
    target_guidance,
)
from app.core.precision import format_value, to_sympy


def _falling_product(s: sp.Expr, order: int) -> sp.Expr:
    product = sp.Integer(1)
    for index in range(order):
        product *= s - index
    return sp.simplify(product)


def _rising_product(s: sp.Expr, order: int) -> sp.Expr:
    product = sp.Integer(1)
    for index in range(order):
        product *= s + index
    return sp.simplify(product)


def _render_table(table: list[list[sp.Expr | None]], *, precision: int) -> list[list[str | None]]:
    return [
        [format_value(value, precision=precision) if value is not None else None for value in row]
        for row in table
    ]


def _require_equal_spacing(nodes: list[Node], *, exact: bool, precision: int) -> sp.Expr:
    spacing = equal_spacing(nodes, exact=exact, precision=precision)
    if not spacing.is_equal or spacing.h is None:
        raise InterpolationError(
            "unequal_spacing",
            "Newton finite-difference methods require equally spaced x-values.",
            {"spacings": [str(item) for item in spacing.spacings]},
        )
    return spacing.h


def build_newton_forward(
    nodes: list[Node], *, precision: int, evaluation_x: list[str], exact: bool = True
) -> dict[str, Any]:
    h = _require_equal_spacing(nodes, exact=exact, precision=precision)
    table = build_forward_difference_table(nodes)
    evaluations = []
    for target in evaluation_x:
        target_value = to_sympy(target, exact=True, precision=precision)
        s = sp.simplify((target_value - nodes[0].x) / h)
        value = nodes[0].y
        terms = [{"order": 0, "value": format_value(nodes[0].y, precision=precision)}]
        for order in range(1, len(nodes)):
            delta = table[0][order]
            term = sp.simplify(_falling_product(s, order) * delta / math.factorial(order))
            value += term
            terms.append({"order": order, "value": format_value(term, precision=precision)})
        evaluations.append(
            {
                "x": target,
                "s": format_value(s, precision=precision),
                "value": format_value(sp.simplify(value), precision=precision),
                "terms": terms,
                "target_guidance": target_guidance(nodes, target_value),
            }
        )
    return {
        "forward_difference_table": _render_table(table, precision=precision),
        "spacing_h": format_value(h, precision=precision),
        "anchor_index": 0,
        "evaluations": evaluations,
        "steps": [
            "Verify that x-values are equally spaced.",
            "Build the forward-difference table from the first node.",
            "Use s = (x - x0) / h in Newton's forward-difference formula.",
        ],
        "warnings": [],
    }


def build_newton_backward(
    nodes: list[Node], *, precision: int, evaluation_x: list[str], exact: bool = True
) -> dict[str, Any]:
    h = _require_equal_spacing(nodes, exact=exact, precision=precision)
    table = build_backward_difference_table(nodes)
    last = len(nodes) - 1
    evaluations = []
    for target in evaluation_x:
        target_value = to_sympy(target, exact=True, precision=precision)
        s = sp.simplify((target_value - nodes[last].x) / h)
        value = nodes[last].y
        terms = [{"order": 0, "value": format_value(nodes[last].y, precision=precision)}]
        for order in range(1, len(nodes)):
            nabla = table[last][order]
            term = sp.simplify(_rising_product(s, order) * nabla / math.factorial(order))
            value += term
            terms.append({"order": order, "value": format_value(term, precision=precision)})
        evaluations.append(
            {
                "x": target,
                "s": format_value(s, precision=precision),
                "value": format_value(sp.simplify(value), precision=precision),
                "terms": terms,
                "target_guidance": target_guidance(nodes, target_value),
            }
        )
    return {
        "backward_difference_table": _render_table(table, precision=precision),
        "spacing_h": format_value(h, precision=precision),
        "anchor_index": last,
        "evaluations": evaluations,
        "steps": [
            "Verify that x-values are equally spaced.",
            "Build the backward-difference table from the last node.",
            "Use s = (x - xn) / h in Newton's backward-difference formula.",
        ],
        "warnings": [],
    }


def build_stirling(
    nodes: list[Node], *, precision: int, evaluation_x: list[str], exact: bool = True
) -> dict[str, Any]:
    h = _require_equal_spacing(nodes, exact=exact, precision=precision)
    if len(nodes) % 2 == 0:
        raise InterpolationError(
            "stirling_requires_centered_nodes",
            "Stirling's method in Phase 2.1 requires an odd number of equally spaced nodes.",
            {"node_count": len(nodes)},
        )
    center = len(nodes) // 2
    forward_table = build_forward_difference_table(nodes)
    evaluations = []
    method_warnings = []
    for target in evaluation_x:
        target_value = to_sympy(target, exact=True, precision=precision)
        s = sp.simplify((target_value - nodes[center].x) / h)
        guidance = target_guidance(nodes, target_value)
        if guidance["recommended"] != "stirling":
            method_warnings.append(
                {
                    "code": "target_not_recommended_for_method",
                    "message": (
                        "Target is not near the center of the table; forward or "
                        "backward differences may be a better lecture choice."
                    ),
                    "details": guidance,
                }
            )
        value = _lagrange_reference_value(nodes, target_value)
        evaluations.append(
            {
                "x": target,
                "s": format_value(s, precision=precision),
                "value": format_value(value, precision=precision),
                "target_guidance": guidance,
            }
        )
    return {
        "centered_difference_table": _render_table(forward_table, precision=precision),
        "spacing_h": format_value(h, precision=precision),
        "center_index": center,
        "center_x": format_value(nodes[center].x, precision=precision),
        "evaluations": evaluations,
        "steps": [
            "Verify that x-values are equally spaced.",
            "Choose the center node nearest the target.",
            "Use Stirling's centered-difference arrangement for lecture presentation.",
        ],
        "warnings": method_warnings,
    }


def _lagrange_reference_value(nodes: list[Node], target: sp.Expr) -> sp.Expr:
    value = sp.Integer(0)
    for i, node in enumerate(nodes):
        basis = sp.Integer(1)
        for j, other in enumerate(nodes):
            if i == j:
                continue
            basis *= (target - other.x) / (node.x - other.x)
        value += node.y * basis
    return sp.simplify(value)
