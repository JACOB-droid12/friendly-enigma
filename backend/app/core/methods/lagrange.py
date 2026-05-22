import sympy as sp

from app.core.domain import Node
from app.core.precision import format_value, to_sympy

X = sp.Symbol("x")


def _basis_polynomial(nodes: list[Node], index: int) -> sp.Expr:
    numerator = sp.Integer(1)
    denominator = sp.Integer(1)
    node = nodes[index]
    for other_index, other in enumerate(nodes):
        if other_index == index:
            continue
        numerator *= X - other.x
        denominator *= node.x - other.x
    return sp.simplify(numerator / denominator)


def build_lagrange(
    nodes: list[Node], *, precision: int, evaluation_x: list[str]
) -> dict[str, object]:
    basis_entries = []
    terms = []
    for index, node in enumerate(nodes):
        basis = _basis_polynomial(nodes, index)
        term = node.y * basis
        terms.append(term)
        basis_entries.append(
            {
                "index": index,
                "x_i": node.x_text,
                "basis": str(basis),
                "expanded": str(sp.expand(basis)),
                "latex": sp.latex(basis),
            }
        )
    polynomial = sp.expand(sum(terms, sp.Integer(0)))
    evaluations = []
    for target in evaluation_x:
        target_value = to_sympy(target, exact=True, precision=precision)
        evaluations.append(
            {
                "x": target,
                "value": format_value(polynomial.subs(X, target_value), precision=precision),
            }
        )
    return {
        "basis_polynomials": basis_entries,
        "summation_form": " + ".join(str(term) for term in terms),
        "expanded": str(polynomial),
        "polynomial": polynomial,
        "latex_expanded": sp.latex(polynomial),
        "latex_lagrange": sp.latex(sum(terms, sp.Integer(0))),
        "evaluations": evaluations,
        "steps": [
            "Build each Lagrange basis polynomial so it is 1 at its own node and 0 at other nodes.",
            "Multiply each basis polynomial by the corresponding y-value.",
            "Sum the weighted basis polynomials to obtain the interpolating polynomial.",
        ],
        "warnings": [],
    }
