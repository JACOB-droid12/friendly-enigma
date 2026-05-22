# Handoff — Interpolating Polynomial Program Backend

## Current Task
Implement the v1 interpolation backend according to:

- `docs/superpowers/specs/2026-05-22-interpolation-backend-design.md`
- `docs/superpowers/plans/2026-05-22-interpolation-backend-implementation.md`
- `AGENTS.md`

## Current Status
- Overall status: v1 backend implemented.
- Branch: `codex/interpolation-backend-v1`
- Backend status: Implemented under `backend/`.
- API status: Implemented:
  - `GET /health`
  - `POST /api/interpolate`
  - `POST /api/validate-function`
- Math engine status: Implemented pure core modules for Lagrange, Newton divided differences, Barycentric Lagrange, and Neville.
- Parser status: Implemented in `backend/app/core/parser.py`; shared by `/api/validate-function` and `/api/interpolate`.
- Graph-data status: Implemented arrays only; no graph rendering.
- Tests status: Required verification commands passed.
- Frontend status: Not implemented here. Claude Opus owns frontend implementation.

## Scope Boundary
No frontend files were created or edited. The backend owns numerical correctness, parser validation, interpolation, method output, evaluations, warnings, and graph-ready arrays.

## Files Created
| File | Purpose |
|---|---|
| `.gitignore` | Ignore local Codex state, Python cache files, test/lint caches, and virtual environments. |
| `backend/pyproject.toml` | Backend metadata, dependency declaration, pytest config, and ruff config. |
| `backend/README.md` | Backend setup, endpoint scope, example request, and frontend rule. |
| `backend/scripts/verify-backend.ps1` | Optional verification wrapper for pytest and ruff. |
| `backend/app/__init__.py` | App package marker. |
| `backend/app/main.py` | FastAPI application and route registration. |
| `backend/app/api/__init__.py` | API package marker. |
| `backend/app/api/routes.py` | Health, validate-function, and interpolate routes. |
| `backend/app/schemas.py` | FastAPI/Pydantic request and response boundary models. |
| `backend/app/core/__init__.py` | Core package marker. |
| `backend/app/core/domain.py` | Internal dataclasses for nodes, parsed functions, normalized problems, and method results. |
| `backend/app/core/errors.py` | Stable error/warning codes and `InterpolationError`. |
| `backend/app/core/parser.py` | Restricted SymPy parser with explicit whitelist. |
| `backend/app/core/precision.py` | Numeric string parsing, exact/high-precision conversion, formatting, tolerance, and comparison policy. |
| `backend/app/core/validation.py` | Node validation, interval/node-count validation, and numerical warnings. |
| `backend/app/core/normalization.py` | Converts all input modes into canonical interpolation nodes. |
| `backend/app/core/methods/__init__.py` | Method package marker. |
| `backend/app/core/methods/lagrange.py` | Pure Lagrange implementation. |
| `backend/app/core/methods/newton.py` | Pure Newton divided-difference implementation. |
| `backend/app/core/methods/barycentric.py` | Pure barycentric weights and evaluation implementation. |
| `backend/app/core/methods/neville.py` | Pure Neville table implementation. |
| `backend/app/core/graph_data.py` | Backend graph-ready array generation. |
| `backend/app/core/explanations.py` | Educational note text. |
| `backend/app/core/service.py` | Orchestrator layer and response assembly. |
| `backend/app/tests/test_health.py` | Health endpoint test. |
| `backend/app/tests/test_schemas.py` | Schema tests. |
| `backend/app/tests/test_precision.py` | Precision/tolerance tests. |
| `backend/app/tests/test_parser.py` | Safe parser tests. |
| `backend/app/tests/test_validation.py` | Validation/warning tests. |
| `backend/app/tests/test_normalization.py` | Input-mode normalization tests. |
| `backend/app/tests/test_lagrange.py` | Lagrange method tests. |
| `backend/app/tests/test_newton.py` | Newton method tests. |
| `backend/app/tests/test_barycentric.py` | Barycentric method tests. |
| `backend/app/tests/test_neville.py` | Neville method tests. |
| `backend/app/tests/test_graph_data.py` | Graph-data and service tests. |
| `backend/app/tests/test_api.py` | API contract and lecture-regression tests. |

## Files Modified
| File | What changed | Why |
|---|---|---|
| `docs/PLAN.md` | Updated all backend v1 milestones to implemented/completed and recorded remaining work. | Required coordination file update. |
| `docs/API_CONTRACT.md` | Replaced planned contract with implemented endpoint/request/response/error/warning behavior. | Frontend integration source of truth. |
| `docs/FRONTEND_HANDOFF.md` | Updated Claude Opus guidance for implemented backend response fields. | Frontend handoff discipline. |
| `docs/HANDOFF.md` | Rewritten with current implementation state, files changed, commands, test results, risks, and next steps. | Required session handoff. |

## Implemented API Contract
Endpoints:

- `GET /health`
- `POST /api/interpolate`
- `POST /api/validate-function`

Supported interpolation modes:

- `points`
- `x_values_with_function`
- `function_interval`

Supported methods:

- `lagrange`
- `newton`
- `barycentric`
- `neville`

Top-level successful response includes:

- `status`
- `response_version`
- `metadata.tolerance`
- `input_summary`
- `nodes`
- `degree`
- `polynomial`
- `methods`
- `evaluations`
- `graph_data`
- `warnings`
- `educational_notes`

See `docs/API_CONTRACT.md` for exact request/response examples.

## Math Engine Notes
- Lagrange returns basis polynomials, summation form, expanded polynomial, LaTeX, evaluations, and steps.
- Newton returns divided-difference table, coefficients, Newton form, LaTeX, evaluations, and steps.
- Barycentric returns weights and target evaluations; exact node hits return the node y-value directly.
- Neville returns one triangular table per target; if no target is supplied, it returns `neville_requires_evaluation_x`.
- The lecture example `f(x)=1/x`, nodes `2`, `2.75`, `4`, and target `3` returns:
  - `P(3) = 29/88`
  - `f(3) = 1/3`
  - `absolute_error = 1/264`
- Method modules do not import FastAPI or Pydantic request models.
- `/api/validate-function` and `/api/interpolate` share `core/parser.py`.

## Commands Run
| Command | Result | Notes |
|---|---|---|
| `git rev-parse --show-toplevel; git rev-parse --git-dir; git rev-parse --git-common-dir; git rev-parse --show-superproject-working-tree; git status --short --branch; git remote -v` | PASS | Normal repo checkout; branch was `master`; no remote output. |
| `git checkout -b codex/interpolation-backend-v1` | PASS | Created and switched to implementation branch. |
| `Get-Content -LiteralPath AGENTS.md` | PASS | Re-read durable backend-only instructions. |
| `Get-Content -LiteralPath docs\HANDOFF.md` | PASS | Re-read pre-implementation handoff. |
| `Get-Content -LiteralPath docs\superpowers\specs\2026-05-22-interpolation-backend-design.md` | PASS | Re-read design spec. |
| `Get-Content -LiteralPath docs\superpowers\plans\2026-05-22-interpolation-backend-implementation.md` | PASS | Re-read implementation plan. |
| `python --version` | PASS | Current `python` is `Python 3.10.11`. |
| Python package probe for `fastapi`, `pydantic`, `sympy`, `mpmath`, `scipy`, `pytest`, `ruff`, `httpx` | PASS WITH MISSING TOOLS | Existing packages: FastAPI 0.94.0, Pydantic 1.10.13, SymPy 1.12, mpmath 1.3.0, SciPy 1.15.3, httpx 0.24.1. Missing: pytest, ruff. |
| `python -m pip install pytest ruff` | PASS | Installed pytest 9.0.3 and ruff 0.15.14 for verification. |
| `python -m pytest` | EXPECTED FAIL | Initial red test run after writing tests; failed with missing backend modules. |
| `python -m pytest` | FAIL THEN FIXED | First implementation run failed because old FastAPI could not use `JSONResponse | dict[...]` route annotations. Route annotations were narrowed. |
| `python -m pytest` | FAIL THEN FIXED | Parser needed safe SymPy globals for `Integer`; fixed `core/parser.py`. |
| `python -m pytest` | FAIL THEN FIXED | Test compared SymPy symbols with different assumptions; adjusted test to compare expression text. |
| `python -m pytest` | PASS | 42 tests passed before lecture regression addition. |
| `python -m ruff check .` | FAIL THEN FIXED | Line-length issues; ran formatter and shortened educational-note lines. |
| `python -m ruff format .` | PASS | Reformatted backend Python files. |
| `python -m pytest` and `python -m ruff check .` | PASS | 42 tests passed and ruff passed after formatting. |
| API sample via FastAPI `TestClient` | PASS WITH BUG FOUND | Health and interpolate sample ran; found function substitution bug for top-level `f_x`. |
| `python -m pytest` and `python -m ruff check .` | PASS | 43 tests passed after fixing parser-symbol substitution and adding lecture regression. |
| `py -3.11 --version` | FAIL / NOT AVAILABLE | Python launcher reports Python 3.11 is not installed. |
| `py -3.12 --version` | FAIL / NOT AVAILABLE | Python launcher reports Python 3.12 is not installed. |
| `python -m pytest` | PASS | Final required full suite: 43 passed. |
| `python -m pytest app/tests/test_parser.py` | PASS | Final required parser suite: 15 passed. |
| `python -m pytest app/tests/test_api.py` | PASS | Final required API suite: 5 passed. |
| `python -m ruff check .` | PASS | Final required lint: all checks passed. |

## Final Required Verification Results
All required commands were run from `backend/`:

```powershell
python -m pytest
```

Result: PASS, 43 passed.

```powershell
python -m pytest app/tests/test_parser.py
```

Result: PASS, 15 passed.

```powershell
python -m pytest app/tests/test_api.py
```

Result: PASS, 5 passed.

```powershell
python -m ruff check .
```

Result: PASS, all checks passed.

## Known Issues / Risks
- `backend/pyproject.toml` correctly declares `requires-python = ">=3.11"` per AGENTS.md, but this machine's `python` command is Python 3.10.11. Required verification commands passed on Python 3.10.11 because Python 3.11/3.12 are not installed for the `py` launcher.
- Installed FastAPI/Pydantic are older than the versions declared in `pyproject.toml`, so route annotations were kept compatible with FastAPI 0.94/Pydantic 1.10 while preserving the JSON contract.
- Advanced symbolic-expression explosion handling is not implemented beyond the documented field placeholder `expanded_omitted_reason`; current tests cover low-degree educational examples.
- Graph sampling uses backend-generated floating sample points after canonical nodes are built, as allowed by the design; graph values are strings or null.

## Next Steps
1. Claude Opus can start frontend integration using `docs/API_CONTRACT.md` and `docs/FRONTEND_HANDOFF.md`.
2. If a Python 3.11+ runtime is installed later, rerun the required verification commands with that interpreter.
3. Optional backend hardening: add more high-degree expression-omission tests and domain-edge graph tests.
