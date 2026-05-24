from typing import Any

import sympy as sp

from app.core.domain import Node
from app.core.errors import InterpolationError
from app.core.methods.piecewise import evaluate_piecewise_polynomial
from app.core.parser import X
from app.core.precision import format_value, to_sympy


def build_cubic_spline(
    nodes: list[Node],
    *,
    precision: int,
    evaluation_x: list[str],
    method_options: dict[str, Any],
) -> dict[str, Any]:
    boundary_condition = method_options.get("boundary_condition", "natural")
    if boundary_condition != "natural":
        raise InterpolationError(
            "unsupported_boundary_condition",
            "P2.4 cubic_spline supports the natural boundary condition only.",
            {"boundary_condition": boundary_condition, "supported": ["natural"]},
        )
    ordered_nodes = sorted(nodes, key=lambda node: float(sp.N(node.x, precision)))
    warnings = _ordering_warnings(nodes, ordered_nodes)
    second_derivatives = _natural_second_derivatives(ordered_nodes)
    segments, segment_polynomials, segment_intervals = _segments(
        ordered_nodes, second_derivatives, precision=precision
    )
    evaluations = []
    for target in evaluation_x:
        target_value = to_sympy(target, exact=True, precision=precision)
        value, segment_index = evaluate_piecewise_polynomial(
            segment_polynomials, segment_intervals, target_value
        )
        evaluations.append(
            {
                "x": target,
                "value": format_value(value, precision=precision),
                "segment_index": segment_index,
                "within_domain": bool(
                    target_value >= segment_intervals[0][0]
                    and target_value <= segment_intervals[-1][1]
                ),
            }
        )
    return {
        "boundary_condition": "natural",
        "ordered_nodes": [
            {"index": node.index, "x": node.x_text, "y": node.y_text} for node in ordered_nodes
        ],
        "second_derivatives": [
            format_value(value, precision=precision) for value in second_derivatives
        ],
        "segments": segments,
        "segment_polynomials": segment_polynomials,
        "segment_intervals": segment_intervals,
        "continuity_checks": _continuity_checks(
            ordered_nodes, segment_polynomials, precision=precision
        ),
        "evaluations": evaluations,
        "steps": [
            "Order nodes by increasing x-value.",
            "Use natural boundary conditions S''(x0) = 0 and S''(xn) = 0.",
            "Solve the tridiagonal system for knot second derivatives.",
            "Build one cubic segment on each interval and verify continuity at interior knots.",
        ],
        "warnings": warnings,
    }


def evaluate_cubic_spline_result(result: dict[str, Any], target: sp.Expr) -> sp.Expr:
    value, _ = evaluate_piecewise_polynomial(
        result["segment_polynomials"], result["segment_intervals"], target
    )
    return value


def _ordering_warnings(nodes: list[Node], ordered_nodes: list[Node]) -> list[dict[str, Any]]:
    if [node.index for node in nodes] == [node.index for node in ordered_nodes]:
        return []
    return [
        {
            "code": "nodes_reordered",
            "message": "Cubic spline segments are built with nodes ordered by increasing x-value.",
            "details": {"ordered_indices": [node.index for node in ordered_nodes]},
        }
    ]


def _natural_second_derivatives(nodes: list[Node]) -> list[sp.Expr]:
    if len(nodes) == 2:
        return [sp.Integer(0), sp.Integer(0)]
    intervals = len(nodes) - 1
    h = [sp.simplify(nodes[index + 1].x - nodes[index].x) for index in range(intervals)]
    matrix = sp.zeros(len(nodes) - 2, len(nodes) - 2)
    rhs = []
    for row, node_index in enumerate(range(1, len(nodes) - 1)):
        if row > 0:
            matrix[row, row - 1] = h[node_index - 1]
        matrix[row, row] = 2 * (h[node_index - 1] + h[node_index])
        if row < len(nodes) - 3:
            matrix[row, row + 1] = h[node_index]
        slope_right = (nodes[node_index + 1].y - nodes[node_index].y) / h[node_index]
        slope_left = (nodes[node_index].y - nodes[node_index - 1].y) / h[node_index - 1]
        rhs.append(sp.simplify(6 * (slope_right - slope_left)))
    solution = matrix.LUsolve(sp.Matrix(rhs))
    return [sp.Integer(0), *[sp.simplify(value) for value in solution], sp.Integer(0)]


def _segments(
    nodes: list[Node], second_derivatives: list[sp.Expr], *, precision: int
) -> tuple[list[dict[str, Any]], list[sp.Expr], list[tuple[sp.Expr, sp.Expr]]]:
    segments = []
    segment_polynomials = []
    segment_intervals = []
    for index in range(len(nodes) - 1):
        left = nodes[index]
        right = nodes[index + 1]
        h = sp.simplify(right.x - left.x)
        a = left.y
        b = sp.simplify(
            (right.y - left.y) / h
            - h * (2 * second_derivatives[index] + second_derivatives[index + 1]) / 6
        )
        c = sp.simplify(second_derivatives[index] / 2)
        d = sp.simplify((second_derivatives[index + 1] - second_derivatives[index]) / (6 * h))
        local_expression = sp.simplify(
            a + b * (X - left.x) + c * (X - left.x) ** 2 + d * (X - left.x) ** 3
        )
        expanded = sp.expand(local_expression)
        segment_polynomials.append(expanded)
        segment_intervals.append((left.x, right.x))
        segments.append(
            {
                "index": index,
                "interval": {
                    "left": format_value(left.x, precision=precision),
                    "right": format_value(right.x, precision=precision),
                },
                "coefficients": {
                    "a": format_value(a, precision=precision),
                    "b": format_value(b, precision=precision),
                    "c": format_value(c, precision=precision),
                    "d": format_value(d, precision=precision),
                },
                "local_form": str(local_expression),
                "expanded": str(expanded),
                "latex": sp.latex(local_expression),
            }
        )
    return segments, segment_polynomials, segment_intervals


def _continuity_checks(
    nodes: list[Node], segment_polynomials: list[sp.Expr], *, precision: int
) -> list[dict[str, Any]]:
    checks = []
    for knot_index in range(1, len(nodes) - 1):
        knot = nodes[knot_index].x
        left = segment_polynomials[knot_index - 1]
        right = segment_polynomials[knot_index]
        left_value = sp.simplify(left.subs(X, knot))
        right_value = sp.simplify(right.subs(X, knot))
        left_first = sp.simplify(sp.diff(left, X).subs(X, knot))
        right_first = sp.simplify(sp.diff(right, X).subs(X, knot))
        left_second = sp.simplify(sp.diff(left, X, 2).subs(X, knot))
        right_second = sp.simplify(sp.diff(right, X, 2).subs(X, knot))
        checks.append(
            {
                "knot_index": nodes[knot_index].index,
                "x": format_value(knot, precision=precision),
                "value_continuous": sp.simplify(left_value - right_value) == 0,
                "first_derivative_continuous": sp.simplify(left_first - right_first) == 0,
                "second_derivative_continuous": sp.simplify(left_second - right_second) == 0,
                "left_value": format_value(left_value, precision=precision),
                "right_value": format_value(right_value, precision=precision),
                "left_first_derivative": format_value(left_first, precision=precision),
                "right_first_derivative": format_value(right_first, precision=precision),
                "left_second_derivative": format_value(left_second, precision=precision),
                "right_second_derivative": format_value(right_second, precision=precision),
            }
        )
    return checks
