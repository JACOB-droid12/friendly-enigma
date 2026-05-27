import pytest
from pydantic import ValidationError

from app.schemas import InterpolateRequest, InterpolateResponse, MethodName


def test_points_request_accepts_numeric_strings() -> None:
    request = InterpolateRequest(
        mode="points",
        points=[["2", "4"], ["5", "1"]],
        methods=["lagrange", "newton", "barycentric"],
        precision=50,
        exact=True,
        evaluation_x=["3"],
    )

    assert request.mode == "points"
    assert request.points == [["2", "4"], ["5", "1"]]
    assert request.methods == ["lagrange", "newton", "barycentric"]


def test_invalid_method_rejected_by_schema() -> None:
    with pytest.raises(ValidationError):
        InterpolateRequest(mode="points", points=[["0", "0"], ["1", "1"]], methods=["bad"])


def test_response_model_accepts_ok_shape() -> None:
    response = InterpolateResponse(
        status="ok",
        response_version="1.0",
        metadata={
            "tolerance": {
                "abs_tol": "1e-46",
                "rel_tol": "1e-46",
                "precision_digits_used_for_comparison": 50,
            }
        },
        input_summary={"mode": "points", "node_count": 2, "degree": 1},
        nodes=[{"index": 0, "x": "2", "y": "4"}, {"index": 1, "x": "5", "y": "1"}],
        degree=1,
        polynomial={"expanded": "-x + 6", "factored": "6 - x"},
        methods={},
        evaluations=[],
        graph_data=None,
        warnings=[],
        educational_notes=[],
    )

    assert response.status == "ok"


def test_method_literal_contains_required_methods() -> None:
    methods: set[MethodName] = {"lagrange", "newton", "barycentric", "neville"}

    assert methods == {"lagrange", "newton", "barycentric", "neville"}


def test_method_options_accept_supported_shapes() -> None:
    request = InterpolateRequest(
        mode="x_values_with_function",
        function="cos(x)",
        x_values=["0", "1"],
        methods=["taylor", "cubic_spline"],
        method_options={
            "taylor": {"center": "0", "order": 3},
            "cubic_spline": {"boundary_condition": "natural"},
        },
    )

    assert request.method_options.taylor is not None
    assert request.method_options.taylor.center == "0"
    assert request.method_options.taylor.order == 3
    assert request.method_options.cubic_spline is not None
    assert request.method_options.cubic_spline.boundary_condition == "natural"


def test_method_options_reject_unknown_method_block() -> None:
    with pytest.raises(ValidationError):
        InterpolateRequest(
            mode="points",
            points=[["0", "0"], ["1", "1"]],
            method_options={"lagrange": {}},
        )


def test_taylor_center_must_be_numeric_string_not_number() -> None:
    with pytest.raises(ValidationError):
        InterpolateRequest(
            mode="x_values_with_function",
            function="cos(x)",
            x_values=["0", "1"],
            methods=["taylor"],
            method_options={"taylor": {"center": 0, "order": 3}},
        )


@pytest.mark.parametrize("bad_order", [True, 3.0, "3.0"])
def test_taylor_order_must_be_strict_integer(bad_order: object) -> None:
    with pytest.raises(ValidationError):
        InterpolateRequest(
            mode="x_values_with_function",
            function="cos(x)",
            x_values=["0", "1"],
            methods=["taylor"],
            method_options={"taylor": {"center": "0", "order": bad_order}},
        )
