from app.core.errors import ERROR_CODES


def test_duplicate_derivative_data_is_registered_error_code() -> None:
    assert "duplicate_derivative_data" in ERROR_CODES
