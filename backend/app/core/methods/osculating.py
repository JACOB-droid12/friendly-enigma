from typing import Any

import sympy as sp

from app.core.domain import DerivativeDatum, Node
from app.core.errors import InterpolationError
from app.core.methods.hermite import _nested_expression, _newton_expression
from app.core.methods.repeated_nodes import build_confluent_repeated_nodes
from app.core.parser import X
from app.core.precision import format_value, to_sympy, values_close


def build_osculating(
    nodes: list[Node],
    *,
    precision: int,
    evaluation_x: list[str],
    derivatives: list[DerivativeDatum],
    method_options: dict[str, Any],
    function_expression: sp.Expr | None = None,
) -> dict[str, Any]:
    orders_by_node_index = _orders_by_node(nodes, method_options, precision=precision)
    derivative_values = _derivative_values(
        nodes,
        orders_by_node_index,
        derivatives,
        function_expression=function_expression,
        precision=precision,
    )
    repeated = build_confluent_repeated_nodes(
        nodes,
        orders_by_node_index=orders_by_node_index,
        derivative_values=derivative_values,
        precision=precision,
        method_name="osculating",
    )
    expression = _newton_expression(repeated.repeated_x, repeated.coefficients)
    polynomial = sp.expand(expression)
    degree = _polynomial_degree(polynomial)
    constraint_degree = len(repeated.repeated_x) - 1
    evaluations = [
        {
            "x": target,
            "value": format_value(
                polynomial.subs(X, to_sympy(target, exact=True, precision=precision)),
                precision=precision,
            ),
        }
        for target in evaluation_x
    ]
    return {
        "orders": [
            {
                "node_index": node.index,
                "x": format_value(node.x, precision=precision),
                "max_order": orders_by_node_index[node.index],
            }
            for node in nodes
        ],
        "repeated_nodes": repeated.rendered_repeated_nodes,
        "confluent_divided_difference_table": repeated.rendered_table,
        "coefficients": [
            format_value(coefficient, precision=precision) for coefficient in repeated.coefficients
        ],
        "nested_form": str(_nested_expression(repeated.repeated_x, repeated.coefficients)),
        "expanded": str(polynomial),
        "polynomial": polynomial,
        "degree": degree,
        "latex_expanded": sp.latex(polynomial),
        "latex_osculating": sp.latex(expression),
        "evaluations": evaluations,
        "steps": [
            "Choose the maximum derivative order required at each node.",
            "Repeat each node once for the value and once for each required derivative order.",
            "Fill confluent divided differences with f^(k)(x_i) / k! for repeated nodes.",
            "Use the first row as Newton coefficients and expand the result for display.",
        ],
        "warnings": _osculating_warnings(
            degree=degree,
            constraint_degree=constraint_degree,
        ),
    }


def _orders_by_node(
    nodes: list[Node], method_options: dict[str, Any], *, precision: int
) -> dict[int, int]:
    raw_orders = method_options.get("orders") or []
    if not raw_orders:
        return {node.index: 1 for node in nodes}

    result = {node.index: 0 for node in nodes}
    seen_nodes: set[int] = set()
    for item in raw_orders:
        x_text = str(item["x"])
        x_expr = to_sympy(x_text, exact=True, precision=precision)
        matching = [node for node in nodes if _same_x(node.x, x_expr, precision=precision)]
        if not matching:
            raise InterpolationError(
                "derivative_node_not_found",
                "Osculating order references an x-value that is not an interpolation node.",
                {"method": "osculating", "x": x_text},
            )
        node = matching[0]
        order = int(item["order"])
        if node.index in seen_nodes:
            raise InterpolationError(
                "duplicate_derivative_order",
                (
                    "Osculating method options repeat a node; each order entry defines one "
                    "maximum order per node."
                ),
                {"method": "osculating", "x": x_text, "order": order},
            )
        seen_nodes.add(node.index)
        result[node.index] = order
    return result


def _derivative_values(
    nodes: list[Node],
    orders_by_node_index: dict[int, int],
    derivatives: list[DerivativeDatum],
    *,
    function_expression: sp.Expr | None,
    precision: int,
) -> dict[tuple[int, int], sp.Expr]:
    if function_expression is None:
        _raise_for_derivative_data_at_unknown_nodes(nodes, derivatives, precision=precision)

    values: dict[tuple[int, int], sp.Expr] = {}
    for node in nodes:
        for order in range(1, orders_by_node_index[node.index] + 1):
            if function_expression is not None:
                values[(node.index, order)] = _function_derivative_at_node(
                    function_expression, node, order=order, precision=precision
                )
                continue

            match = _derivative_match(node, derivatives, order=order, precision=precision)
            if match is None:
                raise InterpolationError(
                    "missing_derivative_data",
                    (
                        "Osculating interpolation requires derivative data for each requested "
                        "node and order."
                    ),
                    {
                        "method": "osculating",
                        "x": format_value(node.x, precision=precision),
                        "order": order,
                    },
                )
            values[(node.index, order)] = match.value
    return values


def _same_x(left: sp.Expr, right: sp.Expr, *, precision: int) -> bool:
    if sp.simplify(left - right) == 0:
        return True
    if left.has(sp.Float) or right.has(sp.Float):
        return values_close(left, right, precision=precision)
    return False


def _raise_for_derivative_data_at_unknown_nodes(
    nodes: list[Node], derivatives: list[DerivativeDatum], *, precision: int
) -> None:
    for derivative in derivatives:
        if not any(_same_x(derivative.x, node.x, precision=precision) for node in nodes):
            raise InterpolationError(
                "derivative_node_not_found",
                (
                    "Osculating derivative data references an x-value that is not an "
                    "interpolation node."
                ),
                {"method": "osculating", "x": derivative.x_text, "order": derivative.order},
            )


def _derivative_match(
    node: Node, derivatives: list[DerivativeDatum], *, order: int, precision: int
) -> DerivativeDatum | None:
    for derivative in derivatives:
        if derivative.order == order and _same_x(derivative.x, node.x, precision=precision):
            return derivative
    return None


def _function_derivative_at_node(
    function_expression: sp.Expr, node: Node, *, order: int, precision: int
) -> sp.Expr:
    derivative = sp.diff(function_expression, X, order)
    _raise_for_unsupported_function_value(
        derivative, node=node, order=order, artifact="derivative", allow_symbolic=True
    )
    _raise_for_disagreeing_one_sided_limits(
        derivative, node=node, order=order, precision=precision
    )
    value = sp.simplify(derivative.subs(X, node.x))
    _raise_for_unsupported_function_value(
        value, node=node, order=order, artifact="derivative_at_node"
    )
    return value


def _raise_for_disagreeing_one_sided_limits(
    derivative: sp.Expr, *, node: Node, order: int, precision: int
) -> None:
    try:
        left_limit = sp.simplify(sp.limit(derivative, X, node.x, dir="-"))
        right_limit = sp.simplify(sp.limit(derivative, X, node.x, dir="+"))
    except Exception as exc:
        raise _function_domain_error(
            node=node, order=order, artifact="derivative_limit"
        ) from exc

    _raise_for_unsupported_function_value(
        left_limit, node=node, order=order, artifact="left_derivative_limit"
    )
    _raise_for_unsupported_function_value(
        right_limit, node=node, order=order, artifact="right_derivative_limit"
    )
    if not _same_derivative_limit(left_limit, right_limit, precision=precision):
        raise _function_domain_error(
            node=node, order=order, artifact="one_sided_derivative_limits"
        )


def _same_derivative_limit(left: sp.Expr, right: sp.Expr, *, precision: int) -> bool:
    if sp.simplify(left - right) == 0:
        return True
    if left.has(sp.Float) or right.has(sp.Float):
        return values_close(left, right, precision=precision)
    return False


def _raise_for_unsupported_function_value(
    value: sp.Expr,
    *,
    node: Node,
    order: int,
    artifact: str,
    allow_symbolic: bool = False,
) -> None:
    allowed_symbols = {X} if allow_symbolic else set()
    if (
        value.free_symbols - allowed_symbols
        or value.has(
            sp.I,
            sp.zoo,
            sp.nan,
            sp.oo,
            -sp.oo,
            sp.Derivative,
            sp.Integral,
            sp.Limit,
            sp.DiracDelta,
            sp.SingularityFunction,
        )
        or value.is_real is False
        or (not allow_symbolic and value.is_real is not True)
        or value.is_finite is False
        or (not allow_symbolic and value.is_finite is not True)
    ):
        raise _function_domain_error(node=node, order=order, artifact=artifact)


def _function_domain_error(*, node: Node, order: int, artifact: str) -> InterpolationError:
    return InterpolationError(
        "function_domain_error",
        "Derived osculating derivative must be real, finite, and two-sided at each requested node.",
        {"method": "osculating", "x": node.x_text, "order": order, "artifact": artifact},
    )


def _polynomial_degree(polynomial: sp.Expr) -> int:
    degree = sp.degree(polynomial, X)
    if degree == -sp.oo:
        return 0
    return int(degree)


def _osculating_warnings(*, degree: int, constraint_degree: int) -> list[dict[str, Any]]:
    if constraint_degree < 10:
        return []
    return [
        {
            "code": "high_degree_warning",
            "message": "High-degree osculating interpolation may be numerically unstable.",
            "details": {"degree": degree, "constraint_degree": constraint_degree},
        }
    ]
