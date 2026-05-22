# Interpolation Backend

FastAPI backend and numerical computation engine for a Numerical Analysis interpolation program.

## Scope

This repository owns backend math, validation, precision, tests, and JSON API contracts only. The React frontend is owned separately by Claude Opus.

## Endpoints

- `GET /health`
- `POST /api/interpolate`
- `POST /api/validate-function`

## Verification

```powershell
python -m pytest
python -m ruff check .
```

## Example Request

```json
{
  "mode": "points",
  "points": [["2", "4"], ["5", "1"]],
  "methods": ["lagrange", "newton", "barycentric", "neville"],
  "precision": 50,
  "exact": true,
  "evaluation_x": ["3"],
  "graph": false
}
```

## Frontend Rule

The frontend must not recompute interpolation. It should render backend response fields, warnings, method tables, and graph-ready arrays.

## Notes

- Numeric user inputs are accepted as strings.
- Exact mode uses SymPy rational values where possible.
- High-precision numeric mode uses mpmath/SymPy precision handling.
- Graph output is data only; the backend does not render charts.
