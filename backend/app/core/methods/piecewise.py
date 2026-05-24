import sympy as sp


def choose_segment_index(segment_intervals: list[tuple[sp.Expr, sp.Expr]], target: sp.Expr) -> int:
    for index, (left, right) in enumerate(segment_intervals):
        if bool(target >= left) and bool(target <= right):
            return index
    if bool(target < segment_intervals[0][0]):
        return 0
    return len(segment_intervals) - 1


def evaluate_piecewise_polynomial(
    segment_polynomials: list[sp.Expr],
    segment_intervals: list[tuple[sp.Expr, sp.Expr]],
    target: sp.Expr,
) -> tuple[sp.Expr, int]:
    index = choose_segment_index(segment_intervals, target)
    return sp.simplify(segment_polynomials[index].subs(sp.Symbol("x", real=True), target)), index
