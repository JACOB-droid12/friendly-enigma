# Plan — Interpolating Polynomial Program Backend

## Objective
Build the backend and numerical engine for the interpolation program.

## Current Status
v1 backend implementation is complete in `backend/` with FastAPI endpoints, shared parser/normalization/precision layers, pure interpolation method modules, orchestration, graph-data generation, tests, and verification script. V1+ frontend lecture example loading is complete without backend/API contract changes.

## Milestones
| Milestone | Status | Acceptance Criteria |
|---|---|---|
| Repository/documentation setup | Completed | `AGENTS.md`, `docs/HANDOFF.md`, `docs/PLAN.md`, `docs/API_CONTRACT.md`, and `docs/FRONTEND_HANDOFF.md` exist. |
| Detailed implementation plan | Completed | `docs/superpowers/plans/2026-05-22-interpolation-backend-implementation.md` exists. |
| Backend scaffolding | Completed | `backend/pyproject.toml`, FastAPI app package, README, and `GET /health` exist. |
| Core schemas and validation | Completed | Pydantic schemas accept v1 request/response shapes; validation rejects duplicate x-values, insufficient nodes, bad intervals, bad node counts, non-real generated values, and invalid methods. |
| Safe function parser | Completed | `core/parser.py` uses the shared SymPy whitelist parser for both `/api/validate-function` and `/api/interpolate`; unsafe expressions are rejected. |
| Precision handling | Completed | `core/precision.py` centralizes numeric string conversion, exact rational conversion, high-precision conversion, formatting, and comparison tolerances. |
| Normalization | Completed | `core/normalization.py` converts points, x-values-with-function, and function-interval modes into canonical nodes. |
| Lagrange method | Completed | Returns basis polynomials, summation form, expanded polynomial, LaTeX, evaluations, and steps. |
| Newton divided differences | Completed | Returns divided-difference table, coefficients, Newton form, LaTeX, evaluations, and steps. |
| Barycentric evaluation | Completed | Returns barycentric weights and stable target evaluations with exact-node handling. |
| Neville method | Completed | Returns triangular approximation table for each requested target and a method warning if no target is provided. |
| Graph data generation | Completed | Returns backend-generated arrays for `x`, `f_x`, `P_x`, and `error`; no graph rendering is implemented. |
| FastAPI endpoints | Completed | `GET /health`, `POST /api/interpolate`, and `POST /api/validate-function` are implemented. |
| Tests | Completed | 43 backend tests cover parser safety, API contract paths, validation, normalization, precision, all methods, graph data, and lecture example. |
| API/frontend handoff documentation | Completed | `docs/API_CONTRACT.md` and `docs/FRONTEND_HANDOFF.md` describe implemented v1 behavior. |
| V1 contract stabilization | Completed 2026-05-23 | Frontend Lagrange basis rendering now consumes the backend `basis` field; smoke coverage guards linear, 1/x, Newton, Neville, barycentric, and backend graph-data rendering cases. |
| V1+ lecture example library | Completed 2026-05-24 | Frontend Examples panel loads the four lecture-aligned examples into existing form inputs and method selections; no backend files, endpoint paths, request shapes, response shapes, or React interpolation math changed. |

## Validation Commands
Run these from `backend/`:

```powershell
python -m pytest
python -m pytest app/tests/test_parser.py
python -m pytest app/tests/test_api.py
python -m ruff check .
```

Optional wrapper:

```powershell
.\scripts\verify-backend.ps1
```

Optional local server smoke check:

```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

## Stop-and-Fix Rules
- If duplicate x-values are accepted, stop and fix validation.
- If unsafe function strings parse as valid, stop and fix `core/parser.py`.
- If numeric input is silently converted to Python `float` before precision handling, stop and fix `core/precision.py` or `core/normalization.py`.
- If methods import FastAPI/Pydantic request models, stop and restore pure core boundaries.
- If tests are failing, do not claim completion.

## Remaining Work
- No required backend v1 implementation work remains.
- No required V1+ lecture example-library work remains.
- Recommended backend next step: rerun the full backend verification under Python 3.11+ to satisfy `backend/pyproject.toml` rather than the current Python 3.10.11 runtime.
- Recommended frontend next step: Claude Opus should review and commit the untracked frontend/design assets that are intended to become the V1 frontend baseline.
- Optional backend hardening: run the same verification commands under Python 3.11+ or 3.13. The current `python` on this machine is Python 3.10.11, while `backend/pyproject.toml` declares the intended Python 3.11+ target.
