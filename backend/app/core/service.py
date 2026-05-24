from copy import deepcopy
from typing import Any

import sympy as sp

from app.core.errors import InterpolationError
from app.core.explanations import educational_notes
from app.core.graph_data import build_graph_data
from app.core.methods.barycentric import build_barycentric
from app.core.methods.lagrange import build_lagrange
from app.core.methods.neville import build_neville
from app.core.methods.newton import build_newton
from app.core.methods.newton_finite import (
    build_newton_backward,
    build_newton_forward,
    build_stirling,
)
from app.core.normalization import normalize_request
from app.core.parser import X
from app.core.precision import comparison_tolerances, format_value, to_sympy, values_close
from app.schemas import InterpolateRequest


def interpolate(request: InterpolateRequest) -> dict[str, object]:
    problem = normalize_request(request)
    raw_results, method_results = _run_methods(problem)
    warnings = [*problem.warnings, *_method_disagreement_warnings(problem, method_results)]
    status = (
        "ok" if all(result["status"] == "ok" for result in method_results.values()) else "partial"
    )
    polynomial_source = _polynomial_source(raw_results)
    response = {
        "status": status,
        "response_version": "1.0",
        "metadata": {"tolerance": comparison_tolerances(problem.precision)},
        "input_summary": {
            "mode": problem.mode,
            "node_count": len(problem.nodes),
            "degree": len(problem.nodes) - 1,
            "methods_requested": problem.methods,
            "precision": problem.precision,
            "exact": problem.exact,
            "function_known": problem.original_function is not None,
            "graph_requested": problem.graph,
            "sorted_nodes": problem.sorted_nodes,
        },
        "nodes": [
            {"index": node.index, "x": node.x_text, "y": node.y_text} for node in problem.nodes
        ],
        "degree": len(problem.nodes) - 1,
        "polynomial": _polynomial_block(raw_results, polynomial_source),
        "methods": method_results,
        "evaluations": _top_level_evaluations(problem, method_results),
        "graph_data": build_graph_data(problem),
        "warnings": warnings,
        "educational_notes": educational_notes(),
    }
    return response


def _run_methods(problem) -> tuple[dict[str, dict[str, Any]], dict[str, dict[str, Any]]]:
    builders = {
        "lagrange": build_lagrange,
        "newton": build_newton,
        "barycentric": build_barycentric,
        "neville": build_neville,
        "newton_forward": build_newton_forward,
        "newton_backward": build_newton_backward,
        "stirling": build_stirling,
    }
    raw_results: dict[str, dict[str, Any]] = {}
    api_results: dict[str, dict[str, Any]] = {}
    for method in problem.methods:
        builder = builders.get(method)
        if builder is None:
            failure = _unavailable_method(method)
            raw_results[method] = failure
            api_results[method] = failure
            continue
        try:
            payload = builder(
                problem.nodes,
                precision=problem.precision,
                evaluation_x=problem.evaluation_x,
            )
            raw_results[method] = payload
            api_results[method] = _method_success(payload)
        except Exception as exc:
            failure = _method_failure(exc)
            raw_results[method] = failure
            api_results[method] = failure
    return raw_results, api_results


def _unavailable_method(method: str) -> dict[str, Any]:
    return {
        "status": "error",
        "warnings": [],
        "error": {
            "code": "method_not_implemented",
            "message": f"{method} is planned for Phase 2 but is not implemented in this milestone.",
            "details": {"method": method},
        },
    }


def _method_success(payload: dict[str, Any]) -> dict[str, Any]:
    api_payload = deepcopy(payload)
    api_payload.pop("polynomial", None)
    warnings = api_payload.pop("warnings", [])
    return {"status": "ok", **_json_ready(api_payload), "warnings": warnings, "error": None}


def _method_failure(exc: Exception) -> dict[str, Any]:
    if isinstance(exc, InterpolationError):
        error = {"code": exc.code, "message": exc.message, "details": exc.details}
    else:
        error = {"code": "method_failed", "message": str(exc), "details": {}}
    return {"status": "error", "warnings": [], "error": error}


def _json_ready(value: Any) -> Any:
    if isinstance(value, sp.Basic):
        return str(value)
    if isinstance(value, list):
        return [_json_ready(item) for item in value]
    if isinstance(value, tuple):
        return [_json_ready(item) for item in value]
    if isinstance(value, dict):
        return {key: _json_ready(item) for key, item in value.items()}
    return value


def _polynomial_source(raw_results: dict[str, dict[str, Any]]) -> dict[str, Any] | None:
    for method in ("lagrange", "newton"):
        result = raw_results.get(method)
        if result and result.get("polynomial") is not None:
            return result
    return None


def _polynomial_block(
    raw_results: dict[str, dict[str, Any]],
    polynomial_source: dict[str, Any] | None,
) -> dict[str, Any]:
    polynomial = polynomial_source.get("polynomial") if polynomial_source else None
    return {
        "expanded": polynomial_source.get("expanded") if polynomial_source else None,
        "factored": str(sp.factor(polynomial)) if polynomial is not None else None,
        "lagrange_form": raw_results.get("lagrange", {}).get("summation_form"),
        "newton_form": raw_results.get("newton", {}).get("nested_form"),
        "latex_expanded": polynomial_source.get("latex_expanded") if polynomial_source else None,
        "latex_lagrange": raw_results.get("lagrange", {}).get("latex_lagrange"),
        "latex_newton": raw_results.get("newton", {}).get("latex_newton"),
        "expanded_omitted_reason": None,
    }


def _top_level_evaluations(problem, methods: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    evaluations = []
    for target in problem.evaluation_x:
        method_values = {}
        for method, result in methods.items():
            value = None
            for item in result.get("evaluations", result.get("target_results", [])):
                if item.get("x") == target:
                    value = item.get("value")
                    break
            method_values[method] = value
        best_method = _best_method(method_values)
        f_x, absolute_error = _function_error(problem, target, method_values.get(best_method))
        evaluations.append(
            {
                "x": target,
                "best_P_x": method_values.get(best_method) if best_method is not None else None,
                "best_method": best_method,
                "method_values": method_values,
                "f_x": f_x,
                "absolute_error": absolute_error,
                "warnings": _target_warnings(problem, target),
            }
        )
    return evaluations


def _best_method(method_values: dict[str, str | None]) -> str | None:
    for method in (
        "barycentric",
        "newton",
        "lagrange",
        "neville",
        "newton_forward",
        "newton_backward",
        "stirling",
    ):
        if method_values.get(method) is not None:
            return method
    return None


def _function_error(problem, target: str, best_value: str | None) -> tuple[str | None, str | None]:
    if problem.original_function is None or best_value is None:
        return None, None
    target_expr = to_sympy(target, exact=problem.exact, precision=problem.precision)
    try:
        f_expr = sp.simplify(problem.original_function.subs(X, target_expr))
        if f_expr.has(sp.I, sp.zoo, sp.nan, sp.oo, -sp.oo) or f_expr.is_real is False:
            return None, None
        p_expr = to_sympy(best_value, exact=True, precision=problem.precision)
        return (
            format_value(f_expr, precision=problem.precision),
            format_value(abs(f_expr - p_expr), precision=problem.precision),
        )
    except Exception:
        return None, None


def _target_warnings(problem, target: str) -> list[dict[str, Any]]:
    target_expr = to_sympy(target, exact=problem.exact, precision=problem.precision)
    min_x = min(node.x for node in problem.nodes)
    max_x = max(node.x for node in problem.nodes)
    if bool(target_expr < min_x) or bool(target_expr > max_x):
        return [
            {
                "code": "extrapolation_warning",
                "message": "Target x is outside the interpolation node range.",
                "details": {"x": target},
            }
        ]
    return []


def _method_disagreement_warnings(
    problem, methods: dict[str, dict[str, Any]]
) -> list[dict[str, Any]]:
    warnings: list[dict[str, Any]] = []
    for target in problem.evaluation_x:
        values = []
        for method, result in methods.items():
            for item in result.get("evaluations", result.get("target_results", [])):
                if item.get("x") == target and item.get("value") is not None:
                    values.append((method, item["value"]))
        if len(values) < 2:
            continue
        first_method, first_value = values[0]
        for method, value in values[1:]:
            if not values_close(first_value, value, precision=problem.precision):
                warnings.append(
                    {
                        "code": "method_disagreement_warning",
                        "message": "Selected interpolation methods disagree beyond tolerance.",
                        "details": {
                            "x": target,
                            "left_method": first_method,
                            "right_method": method,
                        },
                    }
                )
                break
    return warnings
