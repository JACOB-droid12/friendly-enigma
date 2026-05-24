from fastapi.testclient import TestClient

from app.main import app


def test_validate_function_accepts_safe_expression() -> None:
    client = TestClient(app)

    response = client.post("/api/validate-function", json={"function": "sin(x)"})

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_validate_function_rejects_unsafe_expression() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/validate-function", json={"function": "__import__('os').system('dir')"}
    )

    assert response.status_code == 400
    assert response.json()["status"] == "error"
    assert response.json()["error"]["code"] == "unsafe_expression"


def test_interpolate_points_contract() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/interpolate",
        json={
            "mode": "points",
            "points": [["2", "4"], ["5", "1"]],
            "methods": ["lagrange", "newton", "barycentric", "neville"],
            "precision": 50,
            "exact": True,
            "evaluation_x": ["3"],
        },
    )

    body = response.json()
    assert response.status_code == 200
    assert body["response_version"] == "1.0"
    assert body["status"] == "ok"
    assert body["degree"] == 1
    assert body["polynomial"]["expanded"] in {"6 - x", "-x + 6"}
    assert body["evaluations"][0]["best_P_x"] == "3"


def test_interpolate_duplicate_x_error() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/interpolate",
        json={"mode": "points", "points": [["2", "4"], ["2", "5"]]},
    )

    assert response.status_code == 400
    assert response.json()["status"] == "error"
    assert response.json()["error"]["code"] == "duplicate_x"


def test_interpolate_lecture_one_over_x_example() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/interpolate",
        json={
            "mode": "x_values_with_function",
            "x_values": ["2", "2.75", "4"],
            "function": "1/x",
            "methods": ["lagrange", "newton", "barycentric", "neville"],
            "precision": 50,
            "exact": True,
            "evaluation_x": ["3"],
        },
    )

    body = response.json()
    evaluation = body["evaluations"][0]
    assert response.status_code == 200
    assert evaluation["best_P_x"] == "29/88"
    assert evaluation["f_x"] == "1/3"
    assert evaluation["absolute_error"] == "1/264"


def test_interpolate_equal_spacing_methods_contract() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/interpolate",
        json={
            "mode": "points",
            "points": [
                ["1.0", "0.7651977"],
                ["1.3", "0.6200860"],
                ["1.6", "0.4554022"],
                ["1.9", "0.2818186"],
                ["2.2", "0.1103623"],
            ],
            "methods": ["newton_forward", "newton_backward", "stirling"],
            "evaluation_x": ["1.5", "2"],
            "precision": 50,
            "exact": True,
        },
    )

    body = response.json()

    assert response.status_code == 200
    assert body["methods"]["newton_forward"]["status"] == "ok"
    assert body["methods"]["newton_backward"]["status"] == "ok"
    assert body["methods"]["stirling"]["status"] == "ok"
    assert body["evaluations"][0]["best_method"] == "newton_forward"
    assert body["methods"]["newton_forward"]["forward_difference_table"]
    assert body["methods"]["newton_backward"]["backward_difference_table"]
    assert body["methods"]["stirling"]["centered_difference_table"]


def test_interpolate_hermite_methods_contract() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/interpolate",
        json={
            "mode": "points",
            "points": [
                ["1.3", "0.6200860"],
                ["1.6", "0.4554022"],
                ["1.9", "0.2818186"],
            ],
            "derivatives": [
                {"x": "1.3", "order": 1, "value": "-0.52202324741466"},
                {"x": "1.6", "order": 1, "value": "-0.56989593526168"},
                {"x": "1.9", "order": 1, "value": "-0.581157072713434"},
            ],
            "methods": ["hermite_divided_difference", "hermite"],
            "evaluation_x": ["1.5"],
            "precision": 50,
            "exact": True,
        },
    )

    body = response.json()

    assert response.status_code == 200
    assert body["status"] == "ok"
    assert body["methods"]["hermite_divided_difference"]["status"] == "ok"
    assert body["methods"]["hermite"]["status"] == "ok"
    assert body["methods"]["hermite_divided_difference"]["repeated_nodes"]
    assert body["methods"]["hermite_divided_difference"]["divided_difference_table"]
    assert body["methods"]["hermite"]["basis_form"]["status"] == "included"
    assert body["evaluations"][0]["best_method"] == "hermite"
    assert body["polynomial"]["hermite_form"]


def test_interpolate_hermite_missing_derivative_returns_method_error() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/interpolate",
        json={
            "mode": "points",
            "points": [["0", "1"], ["1", "4"]],
            "methods": ["hermite"],
            "evaluation_x": ["1/2"],
            "precision": 50,
            "exact": True,
        },
    )

    body = response.json()

    assert response.status_code == 200
    assert body["status"] == "partial"
    assert body["methods"]["hermite"]["status"] == "error"
    assert body["methods"]["hermite"]["error"]["code"] == "missing_derivative_data"


def test_interpolate_taylor_method_contract() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/interpolate",
        json={
            "mode": "x_values_with_function",
            "function": "cos(x)",
            "x_values": ["0", "1"],
            "methods": ["taylor"],
            "method_options": {"taylor": {"center": "0", "order": 3}},
            "evaluation_x": ["1/2"],
            "precision": 50,
            "exact": True,
        },
    )

    body = response.json()

    assert response.status_code == 200
    assert body["status"] == "ok"
    assert body["methods"]["taylor"]["status"] == "ok"
    assert body["methods"]["taylor"]["expanded"] in {"1 - x**2/2", "-x**2/2 + 1"}
    assert body["methods"]["taylor"]["evaluations"][0]["value"] == "7/8"
    assert body["methods"]["taylor"]["terms"]
    assert body["evaluations"][0]["best_method"] == "taylor"
    assert body["polynomial"]["taylor_form"]


def test_interpolate_cubic_spline_method_contract() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/interpolate",
        json={
            "mode": "points",
            "points": [["1", "2"], ["2", "3"], ["3", "5"]],
            "methods": ["cubic_spline"],
            "method_options": {"cubic_spline": {"boundary_condition": "natural"}},
            "evaluation_x": ["5/2"],
            "precision": 50,
            "exact": True,
            "graph": True,
        },
    )

    body = response.json()

    assert response.status_code == 200
    assert body["status"] == "ok"
    assert body["methods"]["cubic_spline"]["status"] == "ok"
    assert body["methods"]["cubic_spline"]["segments"]
    assert body["methods"]["cubic_spline"]["continuity_checks"][0]["value_continuous"] is True
    assert body["evaluations"][0]["best_method"] == "cubic_spline"
    assert body["evaluations"][0]["best_P_x"] == "125/32"
    assert body["polynomial"]["expanded"] is None
    assert body["polynomial"]["expanded_omitted_reason"] == "piecewise_method_no_global_polynomial"
    assert body["graph_data"]["source_method"] == "cubic_spline"
    assert body["graph_data"]["P_x"]
