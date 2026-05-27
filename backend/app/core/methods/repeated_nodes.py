from dataclasses import dataclass
from typing import Any

import sympy as sp

from app.core.domain import DerivativeDatum, Node
from app.core.errors import InterpolationError
from app.core.precision import format_value


@dataclass(slots=True)
class RepeatedNodeResult:
    repeated_x: list[sp.Expr]
    repeated_y: list[sp.Expr]
    table: list[list[sp.Expr | None]]
    coefficients: list[sp.Expr]
    derivatives_by_node_index: dict[int, DerivativeDatum]
    rendered_repeated_nodes: list[dict[str, Any]]
    rendered_table: list[list[str | None]]


@dataclass(slots=True)
class ConfluentNodeResult:
    repeated_x: list[sp.Expr]
    repeated_y: list[sp.Expr]
    table: list[list[sp.Expr | None]]
    coefficients: list[sp.Expr]
    rendered_repeated_nodes: list[dict[str, Any]]
    rendered_table: list[list[str | None]]


def build_first_derivative_repeated_nodes(
    nodes: list[Node],
    derivatives: list[DerivativeDatum],
    *,
    precision: int,
    method_name: str,
) -> RepeatedNodeResult:
    _reject_unsupported_orders(derivatives, method_name=method_name)
    derivatives_by_node_index = _first_derivatives_by_node(nodes, derivatives, method_name)
    missing = [
        format_value(node.x, precision=precision)
        for node in nodes
        if node.index not in derivatives_by_node_index
    ]
    if missing:
        raise InterpolationError(
            "missing_derivative_data",
            f"{method_name} requires first-derivative data at every interpolation node.",
            {"method": method_name, "missing_x": missing, "required_order": 1},
        )

    repeated_x: list[sp.Expr] = []
    repeated_y: list[sp.Expr] = []
    rendered_repeated_nodes: list[dict[str, Any]] = []
    for node in nodes:
        derivative = derivatives_by_node_index[node.index]
        for _ in range(2):
            repeated_x.append(node.x)
            repeated_y.append(node.y)
            rendered_repeated_nodes.append(
                {
                    "index": len(rendered_repeated_nodes),
                    "source_node_index": node.index,
                    "x": format_value(node.x, precision=precision),
                    "y": format_value(node.y, precision=precision),
                    "first_derivative": format_value(derivative.value, precision=precision),
                }
            )

    table = _hermite_divided_difference_table(
        repeated_x, repeated_y, derivatives_by_node_index, nodes
    )
    coefficients = [table[0][index] for index in range(len(repeated_x))]
    rendered_table = [
        [format_value(value, precision=precision) if value is not None else None for value in row]
        for row in table
    ]
    return RepeatedNodeResult(
        repeated_x=repeated_x,
        repeated_y=repeated_y,
        table=table,
        coefficients=coefficients,
        derivatives_by_node_index=derivatives_by_node_index,
        rendered_repeated_nodes=rendered_repeated_nodes,
        rendered_table=rendered_table,
    )


def build_confluent_repeated_nodes(
    nodes: list[Node],
    *,
    orders_by_node_index: dict[int, int],
    derivative_values: dict[tuple[int, int], sp.Expr],
    precision: int,
    method_name: str,
) -> ConfluentNodeResult:
    repeated_x: list[sp.Expr] = []
    repeated_y: list[sp.Expr] = []
    repeated_source_node_indices: list[int] = []
    rendered_repeated_nodes: list[dict[str, Any]] = []

    for node in nodes:
        max_order = orders_by_node_index.get(node.index, 0)
        for derivative_order in range(max_order + 1):
            derivative_value = (
                node.y
                if derivative_order == 0
                else _required_derivative_value(
                    derivative_values,
                    node_index=node.index,
                    order=derivative_order,
                    method_name=method_name,
                )
            )
            repeated_x.append(node.x)
            repeated_y.append(node.y)
            repeated_source_node_indices.append(node.index)
            rendered_repeated_nodes.append(
                {
                    "index": len(rendered_repeated_nodes),
                    "source_node_index": node.index,
                    "x": format_value(node.x, precision=precision),
                    "y": format_value(node.y, precision=precision),
                    "derivative_order": derivative_order,
                    "derivative_value": format_value(derivative_value, precision=precision),
                }
            )

    table = _confluent_divided_difference_table(
        repeated_x,
        repeated_y,
        repeated_source_node_indices,
        derivative_values,
        method_name=method_name,
    )
    coefficients = [table[0][index] for index in range(len(repeated_x))]
    rendered_table = [
        [format_value(value, precision=precision) if value is not None else None for value in row]
        for row in table
    ]

    return ConfluentNodeResult(
        repeated_x=repeated_x,
        repeated_y=repeated_y,
        table=table,
        coefficients=coefficients,
        rendered_repeated_nodes=rendered_repeated_nodes,
        rendered_table=rendered_table,
    )


def _reject_unsupported_orders(
    derivatives: list[DerivativeDatum], *, method_name: str
) -> None:
    unsupported = sorted({derivative.order for derivative in derivatives if derivative.order != 1})
    if unsupported:
        raise InterpolationError(
            "invalid_derivative_order",
            f"{method_name} currently supports first derivatives only.",
            {
                "method": method_name,
                "received_orders": unsupported,
                "supported_orders": [1],
            },
        )


def _first_derivatives_by_node(
    nodes: list[Node], derivatives: list[DerivativeDatum], method_name: str
) -> dict[int, DerivativeDatum]:
    result: dict[int, DerivativeDatum] = {}
    for node in nodes:
        for derivative in derivatives:
            if derivative.order == 1 and sp.simplify(derivative.x - node.x) == 0:
                result[node.index] = derivative
                break
    if derivatives and not result:
        raise InterpolationError(
            "missing_derivative_data",
            f"{method_name} derivative data does not match the interpolation nodes.",
            {"method": method_name, "node_x": [node.x_text for node in nodes]},
        )
    return result


def _required_derivative_value(
    derivative_values: dict[tuple[int, int], sp.Expr],
    *,
    node_index: int,
    order: int,
    method_name: str,
) -> sp.Expr:
    try:
        return derivative_values[(node_index, order)]
    except KeyError as exc:
        raise InterpolationError(
            "missing_derivative_data",
            f"{method_name} requires derivative data through the requested node order.",
            {"method": method_name, "node_index": node_index, "required_order": order},
        ) from exc


def _confluent_divided_difference_table(
    repeated_x: list[sp.Expr],
    repeated_y: list[sp.Expr],
    repeated_source_node_indices: list[int],
    derivative_values: dict[tuple[int, int], sp.Expr],
    *,
    method_name: str,
) -> list[list[sp.Expr | None]]:
    n = len(repeated_x)
    table: list[list[sp.Expr | None]] = [[None for _ in range(n)] for _ in range(n)]
    for row, value in enumerate(repeated_y):
        table[row][0] = value

    for order in range(1, n):
        for row in range(n - order):
            if sp.simplify(repeated_x[row + order] - repeated_x[row]) == 0:
                derivative_value = _required_derivative_value(
                    derivative_values,
                    node_index=repeated_source_node_indices[row],
                    order=order,
                    method_name=method_name,
                )
                table[row][order] = sp.simplify(derivative_value / sp.factorial(order))
            else:
                table[row][order] = sp.simplify(
                    (table[row + 1][order - 1] - table[row][order - 1])
                    / (repeated_x[row + order] - repeated_x[row])
                )
    return table


def _hermite_divided_difference_table(
    repeated_x: list[sp.Expr],
    repeated_y: list[sp.Expr],
    derivatives_by_node_index: dict[int, DerivativeDatum],
    nodes: list[Node],
) -> list[list[sp.Expr | None]]:
    node_by_x = {node.x: node for node in nodes}
    n = len(repeated_x)
    table: list[list[sp.Expr | None]] = [[None for _ in range(n)] for _ in range(n)]
    for row, value in enumerate(repeated_y):
        table[row][0] = value
    for row in range(n - 1):
        if sp.simplify(repeated_x[row + 1] - repeated_x[row]) == 0:
            node = node_by_x[repeated_x[row]]
            table[row][1] = derivatives_by_node_index[node.index].value
        else:
            table[row][1] = sp.simplify(
                (table[row + 1][0] - table[row][0]) / (repeated_x[row + 1] - repeated_x[row])
            )
    for order in range(2, n):
        for row in range(n - order):
            table[row][order] = sp.simplify(
                (table[row + 1][order - 1] - table[row][order - 1])
                / (repeated_x[row + order] - repeated_x[row])
            )
    return table
