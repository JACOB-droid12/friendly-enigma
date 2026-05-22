from __future__ import annotations

import sympy as sp

from app.core.domain import InterpolationProblem, Node
from app.core.errors import InterpolationError
from app.core.parser import X, parse_function
from app.core.precision import format_value, to_sympy
from app.core.validation import (
    raise_for_invalid_nodes,
    validate_interval,
    validate_node_count,
    validation_warnings,
)
from app.schemas import InterpolateRequest


def normalize_request(request: InterpolateRequest) -> InterpolationProblem:
    exact = _effective_exact(request)
    if not request.methods:
        raise InterpolationError("invalid_method", "At least one interpolation method is required.")

    if request.mode == "points":
        nodes = _nodes_from_points(request, exact=exact)
        parsed_function = None
        node_strategy = None
    elif request.mode == "x_values_with_function":
        parsed_function = parse_function(_required_function(request.function))
        nodes = _nodes_from_x_values(request, parsed_function.expression, exact=exact)
        node_strategy = None
    elif request.mode == "function_interval":
        parsed_function = parse_function(_required_function(request.function))
        node_strategy = request.node_strategy or "equally_spaced"
        nodes = _nodes_from_interval(
            request, parsed_function.expression, exact=exact, node_strategy=node_strategy
        )
    else:
        raise InterpolationError(
            "invalid_method", "Unsupported interpolation mode.", {"mode": request.mode}
        )

    raise_for_invalid_nodes(nodes)
    warnings = validation_warnings(nodes, node_strategy=node_strategy)

    return InterpolationProblem(
        mode=request.mode,
        nodes=nodes,
        methods=list(request.methods),
        precision=request.precision,
        exact=exact,
        evaluation_x=list(request.evaluation_x),
        graph=request.graph,
        original_function=parsed_function.expression if parsed_function else None,
        function_evaluator=(
            lambda value: (
                _evaluate_function(parsed_function.expression, value, precision=request.precision)
                if parsed_function
                else None
            )
        ),
        node_strategy=node_strategy,
        sorted_nodes=False,
        warnings=warnings,
    )


def _effective_exact(request: InterpolateRequest) -> bool:
    if request.exact is not None:
        return request.exact
    return request.mode in {"points", "x_values_with_function"}


def _required_function(function: str | None) -> str:
    if function is None or not function.strip():
        raise InterpolationError("unsafe_expression", "A function expression is required.")
    return function


def _nodes_from_points(request: InterpolateRequest, *, exact: bool) -> list[Node]:
    if request.points is None or len(request.points) < 2:
        raise InterpolationError("too_few_nodes", "At least two points are required.")
    nodes: list[Node] = []
    for index, pair in enumerate(request.points):
        if len(pair) != 2:
            raise InterpolationError(
                "non_real_value",
                "Each point must contain exactly two numeric strings.",
                {"point_index": index},
            )
        x_value = to_sympy(pair[0], exact=exact, precision=request.precision)
        y_value = to_sympy(pair[1], exact=exact, precision=request.precision)
        nodes.append(Node(index=index, x=x_value, y=y_value, x_text=pair[0], y_text=pair[1]))
    return nodes


def _nodes_from_x_values(
    request: InterpolateRequest, expression: sp.Expr, *, exact: bool
) -> list[Node]:
    if request.x_values is None or len(request.x_values) < 2:
        raise InterpolationError("too_few_nodes", "At least two x-values are required.")
    nodes: list[Node] = []
    for index, x_text in enumerate(request.x_values):
        x_value = to_sympy(x_text, exact=exact, precision=request.precision)
        y_value = _evaluate_function(expression, x_value, precision=request.precision)
        nodes.append(
            Node(
                index=index,
                x=x_value,
                y=y_value,
                x_text=x_text,
                y_text=format_value(y_value, precision=request.precision) or "",
            )
        )
    return nodes


def _nodes_from_interval(
    request: InterpolateRequest,
    expression: sp.Expr,
    *,
    exact: bool,
    node_strategy: str,
) -> list[Node]:
    if node_strategy == "custom_nodes":
        return _nodes_from_x_values(request, expression, exact=exact)
    node_count = validate_node_count(request.node_count)
    left, right = validate_interval(request.interval, exact=exact, precision=request.precision)
    if node_strategy == "equally_spaced":
        x_values = _equally_spaced(left, right, node_count)
    elif node_strategy == "chebyshev_nodes":
        x_values = _chebyshev_nodes(left, right, node_count, precision=request.precision)
    else:
        raise InterpolationError(
            "invalid_node_count",
            "Unsupported node generation strategy.",
            {"node_strategy": node_strategy},
        )
    nodes: list[Node] = []
    for index, x_value in enumerate(x_values):
        y_value = _evaluate_function(expression, x_value, precision=request.precision)
        nodes.append(
            Node(
                index=index,
                x=x_value,
                y=y_value,
                x_text=format_value(x_value, precision=request.precision) or "",
                y_text=format_value(y_value, precision=request.precision) or "",
            )
        )
    return nodes


def _equally_spaced(left: sp.Expr, right: sp.Expr, node_count: int) -> list[sp.Expr]:
    if node_count == 2:
        return [left, right]
    step = sp.simplify((right - left) / (node_count - 1))
    return [sp.simplify(left + index * step) for index in range(node_count)]


def _chebyshev_nodes(
    left: sp.Expr, right: sp.Expr, node_count: int, *, precision: int
) -> list[sp.Expr]:
    midpoint = (left + right) / 2
    half_width = (right - left) / 2
    return [
        sp.N(midpoint + half_width * sp.cos((2 * index + 1) * sp.pi / (2 * node_count)), precision)
        for index in range(node_count)
    ]


def _evaluate_function(expression: sp.Expr, value: sp.Expr, *, precision: int) -> sp.Expr:
    result = sp.simplify(expression.subs(X, value))
    if result.has(sp.I, sp.zoo, sp.nan, sp.oo, -sp.oo) or result.is_real is False:
        raise InterpolationError(
            "function_domain_error",
            "Function is not real-valued at one or more required nodes.",
            {"x": format_value(value, precision=precision)},
        )
    return result
