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
