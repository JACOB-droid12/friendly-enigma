import sympy as sp

from app.core.domain import InterpolationProblem
from app.core.methods.barycentric import evaluate_barycentric
from app.core.parser import X
from app.core.precision import format_decimal


def _sample_bounds(problem: InterpolationProblem) -> tuple[float, float]:
    xs = [float(sp.N(node.x)) for node in problem.nodes]
    return min(xs), max(xs)


def build_graph_data(
    problem: InterpolationProblem, *, sample_count: int = 101
) -> dict[str, object] | None:
    if not problem.graph:
        return None
    left, right = _sample_bounds(problem)
    sample_count = max(sample_count, 2)
    step = (right - left) / (sample_count - 1)
    x_values: list[str] = []
    f_values: list[str | None] = []
    p_values: list[str | None] = []
    errors: list[str | None] = []
    for index in range(sample_count):
        x_expr = sp.Float(str(left + step * index), problem.precision)
        x_values.append(format_decimal(x_expr, precision=problem.precision) or "0")
        try:
            p_expr = evaluate_barycentric(problem.nodes, x_expr)
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
        "source_method": "barycentric",
        "method_graphs": None,
    }
