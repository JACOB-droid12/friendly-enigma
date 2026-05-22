import sympy as sp

from app.core.domain import Node
from app.core.precision import format_value, to_sympy


def barycentric_weights(nodes: list[Node]) -> list[sp.Expr]:
    weights: list[sp.Expr] = []
    for index, node in enumerate(nodes):
        product = sp.Integer(1)
        for other_index, other in enumerate(nodes):
            if other_index == index:
                continue
            product *= node.x - other.x
        weights.append(sp.simplify(1 / product))
    return weights


def evaluate_barycentric(nodes: list[Node], target: sp.Expr) -> sp.Expr:
    for node in nodes:
        if sp.simplify(target - node.x) == 0:
            return node.y
    weights = barycentric_weights(nodes)
    numerator = sp.Integer(0)
    denominator = sp.Integer(0)
    for weight, node in zip(weights, nodes, strict=True):
        factor = weight / (target - node.x)
        numerator += factor * node.y
        denominator += factor
    return sp.simplify(numerator / denominator)


def build_barycentric(
    nodes: list[Node], *, precision: int, evaluation_x: list[str]
) -> dict[str, object]:
    weights = barycentric_weights(nodes)
    evaluations = []
    for target in evaluation_x:
        target_value = to_sympy(target, exact=True, precision=precision)
        value = evaluate_barycentric(nodes, target_value)
        evaluations.append({"x": target, "value": format_value(value, precision=precision)})
    return {
        "weights": [
            {"index": index, "x": node.x_text, "weight": format_value(weight, precision=precision)}
            for index, (node, weight) in enumerate(zip(nodes, weights, strict=True))
        ],
        "evaluations": evaluations,
        "notes": [
            "Barycentric form is used as the default stable evaluator for values and graphing."
        ],
        "warnings": [],
    }
