from time import perf_counter

import sympy as sp

from app.core.service import interpolate
from app.schemas import InterpolateRequest


def test_interpolate_points_returns_top_level_evaluation() -> None:
    request = InterpolateRequest(
        mode="points",
        points=[["2", "4"], ["5", "1"]],
        methods=["lagrange", "newton", "barycentric", "neville"],
        evaluation_x=["3"],
        exact=True,
    )

    response = interpolate(request)

    assert response["status"] == "ok"
    assert response["evaluations"][0]["best_method"] == "barycentric"
    assert response["evaluations"][0]["method_values"]["neville"] is not None


def test_graph_data_arrays_have_equal_lengths() -> None:
    request = InterpolateRequest(
        mode="function_interval",
        function="sin(x)",
        interval=["-1", "1"],
        node_strategy="equally_spaced",
        node_count=3,
        methods=["barycentric"],
        graph=True,
        exact=False,
    )

    response = interpolate(request)
    graph_data = response["graph_data"]

    lengths = {len(graph_data[key]) for key in ["x", "f_x", "P_x", "error"]}
    assert lengths == {101}
    assert graph_data["source_method"] == "barycentric"


def test_exact_decimal_graph_sampling_preserves_endpoint_text() -> None:
    request = InterpolateRequest(
        mode="points",
        points=[["0.1", "0.01"], ["0.3", "0.09"]],
        methods=["barycentric"],
        graph=True,
        exact=True,
        precision=80,
    )

    response = interpolate(request)
    graph_data = response["graph_data"]

    assert graph_data["x"][0] == "0.1"
    assert graph_data["x"][-1] == "0.3"
    assert sp.Rational(graph_data["P_x"][-1]) == sp.Rational("0.09")


def test_exact_function_graph_sampling_avoids_symbolic_timeout() -> None:
    request = InterpolateRequest(
        mode="x_values_with_function",
        x_values=["1.0", "1.3", "1.6", "1.9", "2.2"],
        function="cos(x)",
        methods=["newton_forward"],
        evaluation_x=["1.5"],
        graph=True,
        exact=True,
    )

    start = perf_counter()
    response = interpolate(request)
    elapsed_seconds = perf_counter() - start

    assert elapsed_seconds < 5
    assert response["status"] == "ok"
    assert response["graph_data"]["source_method"] == "barycentric"
    assert len(response["graph_data"]["x"]) == 101
    assert len(response["graph_data"]["P_x"]) == 101


def test_taylor_graph_samples_taylor_polynomial() -> None:
    request = InterpolateRequest(
        mode="function_interval",
        function="cos(x)",
        interval=["-1", "1"],
        node_count=5,
        methods=["taylor"],
        method_options={"taylor": {"center": "0", "order": 2}},
        graph=True,
        exact=False,
    )

    response = interpolate(request)
    graph_data = response["graph_data"]
    sample_index = graph_data["x"].index("0.5")

    assert graph_data["source_method"] == "taylor"
    assert sp.Rational(graph_data["P_x"][sample_index]) == sp.Rational("0.875")


def test_hermite_graph_samples_hermite_polynomial() -> None:
    request = InterpolateRequest(
        mode="points",
        points=[["0", "1"], ["1", "4"]],
        methods=["hermite"],
        derivatives=[
            {"x": "0", "order": 1, "value": "2"},
            {"x": "1", "order": 1, "value": "4"},
        ],
        graph=True,
        exact=True,
    )

    response = interpolate(request)
    graph_data = response["graph_data"]
    sample_index = graph_data["x"].index("0.5")

    assert graph_data["source_method"] == "hermite"
    assert graph_data["P_x"][sample_index] == "2.25"
