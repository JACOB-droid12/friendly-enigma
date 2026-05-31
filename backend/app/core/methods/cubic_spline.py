from typing import Any

import sympy as sp

from app.core.domain import Node
from app.core.errors import InterpolationError
from app.core.methods.piecewise import evaluate_piecewise_polynomial
from app.core.parser import X
from app.core.precision import format_value, to_sympy, values_close

SUPPORTED_BOUNDARY_CONDITIONS = ["natural", "clamped", "not-a-knot", "periodic"]


def build_cubic_spline(
    nodes: list[Node],
    *,
    precision: int,
    evaluation_x: list[str],
    method_options: dict[str, Any],
    exact: bool = True,
) -> dict[str, Any]:
    boundary_condition = method_options.get("boundary_condition", "natural")
    ordered_nodes = sorted(nodes, key=lambda node: sp.N(node.x, precision))
    warnings = _ordering_warnings(nodes, ordered_nodes)
    second_derivatives = _second_derivatives(
        ordered_nodes,
        boundary_condition=boundary_condition,
        method_options=method_options,
        precision=precision,
        exact=exact,
    )
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
        "boundary_condition": boundary_condition,
        "boundary_parameters": _boundary_parameters(
            method_options, boundary_condition=boundary_condition, precision=precision, exact=exact
        ),
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
            ordered_nodes, segment_polynomials, precision=precision, exact=exact
        ),
        "evaluations": evaluations,
        "steps": [
            "Order nodes by increasing x-value.",
            _boundary_step(boundary_condition),
            "Solve the boundary-aware linear system for knot second derivatives.",
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


def _second_derivatives(
    nodes: list[Node],
    *,
    boundary_condition: str,
    method_options: dict[str, Any],
    precision: int,
    exact: bool,
) -> list[sp.Expr]:
    node_count = len(nodes)
    h = [sp.simplify(nodes[index + 1].x - nodes[index].x) for index in range(node_count - 1)]
    matrix = sp.zeros(node_count, node_count)
    rhs = sp.zeros(node_count, 1)

    for row in range(1, node_count - 1):
        matrix[row, row - 1] = h[row - 1]
        matrix[row, row] = 2 * (h[row - 1] + h[row])
        matrix[row, row + 1] = h[row]
        slope_right = (nodes[row + 1].y - nodes[row].y) / h[row]
        slope_left = (nodes[row].y - nodes[row - 1].y) / h[row - 1]
        rhs[row] = sp.simplify(6 * (slope_right - slope_left))

    if boundary_condition == "natural":
        matrix[0, 0] = 1
        matrix[node_count - 1, node_count - 1] = 1
    elif boundary_condition == "clamped":
        _apply_clamped_boundary(
            matrix,
            rhs,
            nodes,
            h,
            method_options=method_options,
            precision=precision,
            exact=exact,
        )
    elif boundary_condition == "not-a-knot":
        _apply_not_a_knot_boundary(matrix, nodes, h)
    elif boundary_condition == "periodic":
        _apply_periodic_boundary(matrix, rhs, nodes, h, precision=precision, exact=exact)
    else:
        raise InterpolationError(
            "unsupported_boundary_condition",
            "Cubic spline boundary condition is not implemented.",
            {
                "boundary_condition": boundary_condition,
                "supported": SUPPORTED_BOUNDARY_CONDITIONS,
            },
        )

    solution = matrix.LUsolve(rhs)
    return [sp.simplify(value) for value in solution]


def _apply_clamped_boundary(
    matrix: sp.MutableDenseMatrix,
    rhs: sp.MutableDenseMatrix,
    nodes: list[Node],
    h: list[sp.Expr],
    *,
    method_options: dict[str, Any],
    precision: int,
    exact: bool,
) -> None:
    node_count = len(nodes)
    left = _required_boundary_value(
        method_options, "left_derivative", precision=precision, exact=exact
    )
    right = _required_boundary_value(
        method_options, "right_derivative", precision=precision, exact=exact
    )
    matrix[0, 0] = 2 * h[0]
    matrix[0, 1] = h[0]
    rhs[0] = sp.simplify(6 * ((nodes[1].y - nodes[0].y) / h[0] - left))
    matrix[node_count - 1, node_count - 2] = h[-1]
    matrix[node_count - 1, node_count - 1] = 2 * h[-1]
    rhs[node_count - 1] = sp.simplify(
        6 * (right - (nodes[-1].y - nodes[-2].y) / h[-1])
    )


def _apply_not_a_knot_boundary(
    matrix: sp.MutableDenseMatrix, nodes: list[Node], h: list[sp.Expr]
) -> None:
    node_count = len(nodes)
    if node_count < 4:
        raise InterpolationError(
            "invalid_node_count",
            "Not-a-knot cubic spline requires at least four nodes.",
            {
                "boundary_condition": "not-a-knot",
                "node_count": node_count,
                "minimum_nodes": 4,
            },
        )
    matrix[0, 0] = h[1]
    matrix[0, 1] = -(h[0] + h[1])
    matrix[0, 2] = h[0]
    matrix[node_count - 1, node_count - 3] = h[-1]
    matrix[node_count - 1, node_count - 2] = -(h[-2] + h[-1])
    matrix[node_count - 1, node_count - 1] = h[-2]


def _apply_periodic_boundary(
    matrix: sp.MutableDenseMatrix,
    rhs: sp.MutableDenseMatrix,
    nodes: list[Node],
    h: list[sp.Expr],
    *,
    precision: int,
    exact: bool,
) -> None:
    node_count = len(nodes)
    if not _same_value(nodes[0].y, nodes[-1].y, precision=precision, exact=exact):
        raise InterpolationError(
            "periodic_endpoint_mismatch",
            "Periodic cubic spline requires the first and last y-values to match.",
            {
                "boundary_condition": "periodic",
                "left_y": format_value(nodes[0].y, precision=precision),
                "right_y": format_value(nodes[-1].y, precision=precision),
            },
        )
    matrix[0, 0] = 1
    matrix[0, node_count - 1] = -1
    matrix[node_count - 1, 0] += 2 * h[0]
    matrix[node_count - 1, 1] += h[0]
    matrix[node_count - 1, node_count - 2] += h[-1]
    matrix[node_count - 1, node_count - 1] += 2 * h[-1]
    rhs[node_count - 1] = sp.simplify(
        6 * ((nodes[1].y - nodes[0].y) / h[0] - (nodes[-1].y - nodes[-2].y) / h[-1])
    )


def _required_boundary_value(
    method_options: dict[str, Any], key: str, *, precision: int, exact: bool
) -> sp.Expr:
    value = method_options.get(key)
    if value is None or value == "":
        raise InterpolationError(
            "missing_boundary_parameter",
            "Clamped cubic spline requires endpoint derivative parameters.",
            {"boundary_condition": "clamped", "missing": key},
        )
    return to_sympy(value, exact=exact, precision=precision)


def _same_value(left: sp.Expr, right: sp.Expr, *, exact: bool, precision: int) -> bool:
    if exact:
        return sp.simplify(left - right) == 0
    return values_close(left, right, precision=precision)


def _boundary_parameters(
    method_options: dict[str, Any], *, boundary_condition: str, precision: int, exact: bool
) -> dict[str, str]:
    if boundary_condition != "clamped":
        return {}
    return {
        "left_derivative": format_value(
            to_sympy(method_options["left_derivative"], exact=exact, precision=precision),
            precision=precision,
        ),
        "right_derivative": format_value(
            to_sympy(method_options["right_derivative"], exact=exact, precision=precision),
            precision=precision,
        ),
    }


def _boundary_step(boundary_condition: str) -> str:
    if boundary_condition == "natural":
        return "Use natural boundary conditions S''(x0) = 0 and S''(xn) = 0."
    if boundary_condition == "clamped":
        return "Use clamped boundary conditions to match endpoint first derivatives."
    if boundary_condition == "not-a-knot":
        return (
            "Use not-a-knot boundary conditions to match third derivatives at the first "
            "and last interior knots."
        )
    if boundary_condition == "periodic":
        return (
            "Use periodic boundary conditions to match endpoint value, first derivative, "
            "and second derivative."
        )
    return "Use the requested boundary condition."


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
    nodes: list[Node], segment_polynomials: list[sp.Expr], *, precision: int, exact: bool = True
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
                "value_continuous": _continuous(
                    left_value, right_value, exact=exact, precision=precision
                ),
                "first_derivative_continuous": _continuous(
                    left_first, right_first, exact=exact, precision=precision
                ),
                "second_derivative_continuous": _continuous(
                    left_second, right_second, exact=exact, precision=precision
                ),
                "left_value": format_value(left_value, precision=precision),
                "right_value": format_value(right_value, precision=precision),
                "left_first_derivative": format_value(left_first, precision=precision),
                "right_first_derivative": format_value(right_first, precision=precision),
                "left_second_derivative": format_value(left_second, precision=precision),
                "right_second_derivative": format_value(right_second, precision=precision),
            }
        )
    return checks


def _continuous(left: sp.Expr, right: sp.Expr, *, exact: bool, precision: int) -> bool:
    if exact:
        return sp.simplify(left - right) == 0
    return values_close(left, right, precision=precision)
