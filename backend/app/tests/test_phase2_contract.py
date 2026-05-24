from app.core.service import interpolate
from app.schemas import InterpolateRequest


def test_v1_points_request_still_valid_without_phase2_fields() -> None:
    request = InterpolateRequest(
        mode="points",
        points=[["2", "4"], ["5", "1"]],
        methods=["lagrange", "newton", "barycentric", "neville"],
        precision=50,
        exact=True,
        evaluation_x=["3"],
        graph=False,
    )

    assert request.methods == ["lagrange", "newton", "barycentric", "neville"]
    assert request.points == [["2", "4"], ["5", "1"]]


def test_phase2_method_literals_are_accepted() -> None:
    request = InterpolateRequest(
        mode="points",
        points=[["1.0", "0.7651977"], ["1.3", "0.6200860"]],
        methods=[
            "newton_forward",
            "newton_backward",
            "stirling",
            "hermite_divided_difference",
            "hermite",
            "osculating",
            "taylor",
            "cubic_spline",
        ],
    )

    assert request.methods == [
        "newton_forward",
        "newton_backward",
        "stirling",
        "hermite_divided_difference",
        "hermite",
        "osculating",
        "taylor",
        "cubic_spline",
    ]


def test_phase2_optional_blocks_keep_numeric_values_as_strings() -> None:
    request = InterpolateRequest(
        mode="x_values_with_function",
        function="cos(x)",
        x_values=["0", "0.3", "0.6"],
        methods=["taylor", "hermite_divided_difference"],
        method_options={
            "taylor": {"center": "0", "order": 3},
            "cubic_spline": {"boundary_condition": "natural"},
        },
        derivatives=[
            {"x": "0", "order": 1, "value": "0"},
            {"x": "0.3", "order": 1, "value": "-0.2955202067"},
        ],
    )

    assert request.method_options["taylor"]["center"] == "0"
    assert request.derivatives[0].value == "0"


def test_unimplemented_phase2_method_returns_method_error_not_400() -> None:
    request = InterpolateRequest(
        mode="points",
        points=[["1.0", "0.7651977"], ["1.3", "0.6200860"], ["1.6", "0.4554022"]],
        methods=["hermite"],
        evaluation_x=["1.5"],
    )

    response = interpolate(request)

    assert response["status"] == "partial"
    assert response["methods"]["hermite"]["status"] == "error"
    assert response["methods"]["hermite"]["error"]["code"] == "method_not_implemented"


def test_phase2_method_metadata_marks_barycentric_as_support_method() -> None:
    from app.core.methods.metadata import method_metadata

    metadata = method_metadata()

    assert metadata["barycentric"]["role"] == "stable_evaluator"
    assert metadata["barycentric"]["lecture_construction_method"] is False
    assert metadata["newton_forward"]["family"] == "equal_spacing"
    assert metadata["cubic_spline"]["family"] == "piecewise"
