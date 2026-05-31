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

    assert request.method_options.taylor is not None
    assert request.method_options.taylor.center == "0"
    assert request.derivatives[0].value == "0"


def test_osculating_phase2_method_is_routed_not_deferred() -> None:
    request = InterpolateRequest(
        mode="points",
        points=[["0", "1"], ["1", "4"]],
        methods=["osculating"],
        method_options={
            "osculating": {"orders": [{"x": "0", "order": 1}, {"x": "1", "order": 1}]}
        },
        derivatives=[
            {"x": "0", "order": 1, "value": "2"},
            {"x": "1", "order": 1, "value": "4"},
        ],
        evaluation_x=["1/2"],
    )

    response = interpolate(request)

    assert response["status"] == "ok"
    assert response["methods"]["osculating"]["status"] == "ok"
    assert response["methods"]["osculating"]["evaluations"][0]["value"] == "9/4"


def test_phase2_method_metadata_marks_barycentric_as_support_method() -> None:
    from app.core.methods.metadata import method_metadata

    metadata = method_metadata()

    assert metadata["barycentric"]["role"] == "stable_evaluator"
    assert metadata["barycentric"]["lecture_construction_method"] is False
    assert metadata["newton_forward"]["family"] == "equal_spacing"
    assert metadata["cubic_spline"]["family"] == "piecewise"
