from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

import sympy as sp


@dataclass(slots=True)
class Node:
    index: int
    x: sp.Expr
    y: sp.Expr
    x_text: str
    y_text: str


@dataclass(slots=True)
class ParsedFunction:
    expression: sp.Expr
    symbol: sp.Symbol
    symbol_name: str = "x"


@dataclass(slots=True)
class InterpolationProblem:
    mode: str
    nodes: list[Node]
    methods: list[str]
    precision: int
    exact: bool
    evaluation_x: list[str]
    graph: bool
    original_function: sp.Expr | None = None
    function_evaluator: Callable[[sp.Expr], sp.Expr] | None = None
    node_strategy: str | None = None
    sorted_nodes: bool = False
    warnings: list[dict[str, Any]] = field(default_factory=list)


@dataclass(slots=True)
class MethodResult:
    status: str
    payload: dict[str, Any]
    warnings: list[dict[str, Any]] = field(default_factory=list)
    error: dict[str, Any] | None = None
