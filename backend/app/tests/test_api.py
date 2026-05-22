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
