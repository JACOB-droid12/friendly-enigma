from dataclasses import dataclass, field
from typing import Any

ERROR_CODES = {
    "duplicate_x",
    "too_few_nodes",
    "invalid_method",
    "invalid_interval",
    "invalid_node_count",
    "non_real_value",
    "unsafe_expression",
    "function_domain_error",
}

WARNING_CODES = {
    "close_x_warning",
    "high_degree_warning",
    "runge_warning",
    "extrapolation_warning",
    "method_disagreement_warning",
    "expanded_polynomial_omitted",
    "neville_requires_evaluation_x",
    "graph_sampling_domain_error",
    "method_failed",
    "nodes_reordered",
}


@dataclass(slots=True)
class InterpolationError(Exception):
    code: str
    message: str
    details: dict[str, Any] = field(default_factory=dict)

    def to_response(self) -> dict[str, Any]:
        return {
            "status": "error",
            "error": {"code": self.code, "message": self.message, "details": self.details},
        }
