def method_metadata() -> dict[str, dict[str, object]]:
    return {
        "lagrange": {
            "family": "global_polynomial",
            "role": "construction",
            "lecture_construction_method": True,
        },
        "newton": {
            "family": "global_polynomial",
            "role": "construction",
            "lecture_construction_method": True,
        },
        "barycentric": {
            "family": "global_polynomial",
            "role": "stable_evaluator",
            "lecture_construction_method": False,
        },
        "neville": {
            "family": "target_specific",
            "role": "target_specific",
            "lecture_construction_method": True,
        },
        "newton_forward": {
            "family": "equal_spacing",
            "role": "construction",
            "lecture_construction_method": True,
        },
        "newton_backward": {
            "family": "equal_spacing",
            "role": "construction",
            "lecture_construction_method": True,
        },
        "stirling": {
            "family": "equal_spacing",
            "role": "centered_construction",
            "lecture_construction_method": True,
        },
        "hermite_divided_difference": {
            "family": "derivative_data",
            "role": "construction",
            "lecture_construction_method": True,
        },
        "hermite": {
            "family": "derivative_data",
            "role": "construction",
            "lecture_construction_method": True,
        },
        "osculating": {
            "family": "derivative_data",
            "role": "generalized_derivative_matching",
            "lecture_construction_method": True,
        },
        "taylor": {
            "family": "function_derivative",
            "role": "local_approximation",
            "lecture_construction_method": True,
        },
        "cubic_spline": {
            "family": "piecewise",
            "role": "piecewise_approximation",
            "lecture_construction_method": True,
        },
    }
