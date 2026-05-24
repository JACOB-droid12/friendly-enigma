# Plan — Interpolating Polynomial Program Backend

## Objective
Build the backend and numerical engine for the interpolation program.

## Current Status
v1 backend implementation is complete in `backend/` with FastAPI endpoints, shared parser/normalization/precision layers, pure interpolation method modules, orchestration, graph-data generation, tests, and verification script. V1+ frontend lecture example loading and guided explanation/defense notes are complete without backend/API contract changes. Phase 2 P2.0 contract and architecture prep and P2.1 equal-spacing implementation are complete; P2.2 derivative-data implementation is next.

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
| V1+ guided explanation / defense notes | Completed 2026-05-24 | Results area includes a Guide tab that explains existing backend output using lecture-grounded Lagrange, Newton, and Neville emphasis; Barycentric is support-only stable evaluation / graph support; no backend files, endpoint paths, request shapes, response shapes, or React interpolation math changed. |
| Phase 2 scope confirmation | Completed 2026-05-24 | Brainstorming confirmed Approach B: staged comprehensive lecture-method expansion with backend-owned computation, stable endpoints, and frontend handoff only unless scope changes. |
| Phase 2 formal spec | Completed 2026-05-24 | `docs/superpowers/specs/phase-2-lecture-method-workbench/requirements.md`, `design.md`, and `tasks.md` define scope, architecture, milestone tasks, and completion checklist. |
| Phase 2 implementation plan | Completed 2026-05-24 | `docs/superpowers/plans/2026-05-24-phase-2-lecture-method-workbench.md` defines P2.0 through P2.5, with P2.0/P2.1 ready for staged execution. |
| P2.0 contract and architecture prep | Completed 2026-05-24 | Phase 2 method literals, optional `method_options`, string-valued derivative data, method metadata, new warning/error codes, method-not-implemented routing, API docs, frontend handoff docs, and compatibility tests are in place. Backend verification passed with `python -m pytest` -> 48 passed and `python -m ruff check .` -> `All checks passed!`. |
| P2.1 equal-spacing family | Completed 2026-05-24 | Implemented `newton_forward`, `newton_backward`, and `stirling` with finite-difference tables, target guidance, lecture regression tests, API docs, frontend handoff guidance, and backend verification. Backend verification passed with `python -m pytest` -> 58 passed and `python -m ruff check .` -> `All checks passed!`. |
| P2.2 derivative-data family | Next | Implement Hermite divided differences, Hermite basis output when safe, and osculating only after Hermite is stable or explicitly defer with reasons. |
| P2.3 Taylor family | Pending | Implement Taylor polynomial generation from safe parsed functions with derivative terms, LaTeX, evaluations, lecture examples, docs, verification, and separate commit. |
| P2.4 piecewise family | Pending | Implement natural cubic spline with segment coefficients, continuity checks, backend graph samples, docs, verification, and separate commit. |
| P2.5 release candidate | Pending | Complete lecture examples, warning guide, method comparison, full verification, browser QA if frontend changed, final audit, docs, and release caveat handling. |

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
- No required V1+ guided explanation / defense notes work remains.
- Phase 2 P2.1 equal-spacing implementation is complete. Next required milestone is P2.2 derivative-data only.
- Do not implement all Phase 2 methods in one pass.
- Do not add public per-method endpoints.
- Do not move interpolation, finite-difference, Hermite, Taylor, spline, graph-sampling, or error computation into React.
- Recommended backend next step: rerun the full backend verification under Python 3.11+ to satisfy `backend/pyproject.toml` rather than the current Python 3.10.11 runtime.
- Recommended frontend next step: Claude Opus should review and commit the untracked frontend/design assets that are intended to become the V1 frontend baseline.
- Optional backend hardening: run the same verification commands under Python 3.11+ or 3.13. The current `python` on this machine is Python 3.10.11, while `backend/pyproject.toml` declares the intended Python 3.11+ target.
