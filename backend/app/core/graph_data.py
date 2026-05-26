import sympy as sp

from app.core.domain import InterpolationProblem
from app.core.methods.cubic_spline import evaluate_cubic_spline_result
from app.core.parser import X
from app.core.precision import format_decimal

NumericBarycentricPlan = tuple[list[tuple[sp.Expr, sp.Expr]], list[sp.Expr]]


def _sample_bounds(problem: InterpolationProblem) -> tuple[sp.Expr, sp.Expr]:
    xs = [node.x for node in problem.nodes]
    return min(xs), max(xs)


def build_graph_data(
    problem: InterpolationProblem,
    *,
    raw_results: dict[str, dict[str, object]] | None = None,
    sample_count: int = 101,
) -> dict[str, object] | None:
    if not problem.graph:
        return None
    left, right = _sample_bounds(problem)
    sample_count = max(sample_count, 2)
    step = sp.simplify((right - left) / (sample_count - 1))
    x_values: list[str] = []
    f_values: list[str | None] = []
    p_values: list[str | None] = []
    errors: list[str | None] = []
    spline_result = (raw_results or {}).get("cubic_spline")
    use_spline = bool(spline_result and spline_result.get("segment_polynomials"))
    polynomial_source = None if use_spline else _method_polynomial_source(raw_results or {})
    barycentric_plan = (
        None if use_spline or polynomial_source is not None else _numeric_barycentric_plan(problem)
    )
    for index in range(sample_count):
        x_expr = sp.N(left + step * index, problem.precision)
        x_values.append(format_decimal(x_expr, precision=problem.precision) or "0")
        try:
            if use_spline:
                p_expr = evaluate_cubic_spline_result(spline_result, x_expr)
            elif polynomial_source is not None:
                _, polynomial = polynomial_source
                p_expr = sp.N(polynomial.subs(X, x_expr), problem.precision)
            else:
                p_expr = _evaluate_numeric_barycentric(
                    barycentric_plan, x_expr, precision=problem.precision
                )
            p_text = format_decimal(p_expr, precision=problem.precision)
        except Exception:
            p_expr = None
            p_text = None
        p_values.append(p_text)
        if problem.original_function is None:
            f_values.append(None)
            errors.append(None)
            continue
        try:
            f_expr = sp.simplify(problem.original_function.subs(X, x_expr))
            if f_expr.has(sp.I, sp.zoo, sp.nan, sp.oo, -sp.oo) or f_expr.is_real is False:
                raise ValueError("non-real graph value")
            f_values.append(format_decimal(f_expr, precision=problem.precision))
            errors.append(
                format_decimal(abs(f_expr - p_expr), precision=problem.precision)
                if p_expr is not None
                else None
            )
        except Exception:
            f_values.append(None)
            errors.append(None)
    return {
        "x": x_values,
        "f_x": f_values,
        "P_x": p_values,
        "error": errors,
        "source_method": _source_method(use_spline, polynomial_source),
        "method_graphs": None,
    }


def _method_polynomial_source(
    raw_results: dict[str, dict[str, object]],
) -> tuple[str, sp.Expr] | None:
    for method in ("taylor", "hermite", "hermite_divided_difference"):
        result = raw_results.get(method)
        polynomial = result.get("polynomial") if result else None
        if polynomial is not None:
            return method, polynomial
    return None


def _source_method(
    use_spline: bool, polynomial_source: tuple[str, sp.Expr] | None
) -> str:
    if use_spline:
        return "cubic_spline"
    if polynomial_source is not None:
        return polynomial_source[0]
    return "barycentric"


def _numeric_barycentric_plan(problem: InterpolationProblem) -> NumericBarycentricPlan:
    precision = problem.precision
    nodes = [
        (sp.N(node.x, precision), sp.N(node.y, precision))
        for node in problem.nodes
    ]
    weights: list[sp.Expr] = []
    for index, (x_value, _) in enumerate(nodes):
        product = sp.Float(1, precision)
        for other_index, (other_x, _) in enumerate(nodes):
            if other_index == index:
                continue
            product *= x_value - other_x
        weights.append(sp.Float(1, precision) / product)
    return nodes, weights


def _evaluate_numeric_barycentric(
    plan: NumericBarycentricPlan | None, target: sp.Expr, *, precision: int
) -> sp.Expr:
    if plan is None:
        raise ValueError("numeric barycentric plan is required")
    nodes, weights = plan
    target_value = sp.N(target, precision)
    for x_value, y_value in nodes:
        if target_value == x_value:
            return y_value
    numerator = sp.Float(0, precision)
    denominator = sp.Float(0, precision)
    for weight, (x_value, y_value) in zip(weights, nodes, strict=True):
        factor = weight / (target_value - x_value)
        numerator += factor * y_value
        denominator += factor
    return sp.N(numerator / denominator, precision)
