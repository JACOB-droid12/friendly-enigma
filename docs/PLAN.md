# Plan — Interpolating Polynomial Program Backend

## Objective
Build the backend and numerical engine for the interpolation program.

## Current Status
v1 backend implementation is complete in `backend/` with FastAPI endpoints, shared parser/normalization/precision layers, pure interpolation method modules, orchestration, graph-data generation, tests, and verification script. V1+ frontend lecture example loading and guided explanation/defense notes are complete without backend/API contract changes. Phase 2 P2.0 contract and architecture prep, P2.1 equal-spacing implementation, P2.2 first-derivative Hermite implementation, P2.3 Taylor implementation, P2.4 natural cubic spline implementation, and P2.5 final audit are complete with release caveats. Backend Phase 2 is complete under local Python 3.10.11 verification; full product release still requires Python 3.11+ verification and Claude Opus Phase 2 frontend/browser QA.

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
| P2.2 derivative-data family | Completed 2026-05-24 | Implemented `hermite_divided_difference` and `hermite` with first-derivative repeated-node tables, Hermite polynomial output, low-degree basis output, lecture regression tests, API docs, frontend handoff guidance, and backend verification. `osculating` is explicitly deferred because generalized derivative-order repeated-node support is not yet implemented or tested. Backend verification passed with `python -m pytest` -> 65 passed and `python -m ruff check .` -> `All checks passed!`. |
| P2.3 Taylor family | Completed 2026-05-24 | Implemented `taylor` with safe parsed functions, center/order options, derivative term list, Taylor/Maclaurin polynomial output, LaTeX, evaluations, remainder note, lecture regression tests, API docs, frontend handoff guidance, and backend verification. Backend verification passed with `python -m pytest` -> 70 passed and `python -m ruff check .` -> `All checks passed!`. |
| P2.4 piecewise family | Completed 2026-05-24 | Implemented natural `cubic_spline` with segment coefficients, interval metadata, continuity checks, spline-backed graph samples, piecewise no-global-polynomial response behavior, API docs, frontend handoff guidance, and backend verification. Backend verification passed with `python -m pytest` -> 73 passed and `python -m ruff check .` -> `All checks passed!`. |
| P2.5 release candidate | Completed with release caveats 2026-05-24 | Final audit written to `docs/PHASE_2_FINAL_AUDIT.md`. Backend verification passed with `python -m pytest` -> 73 passed and `python -m ruff check .` -> `All checks passed!`. Frontend verification passed with `npm run build`, `npm run lint`, and `npm test` -> 4 files / 17 tests passed. Full Phase 2 product release remains gated by Python 3.11+ verification and Claude Opus frontend/browser QA. |

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
- Backend Phase 2 P2.5 final audit is complete in `docs/PHASE_2_FINAL_AUDIT.md`.
- Full product release-candidate status is not complete until Python 3.11+ verification and Claude Opus Phase 2 frontend/browser QA are complete.
- `osculating` remains explicitly deferred because generalized derivative-order repeated-node support is not implemented or tested.
- Do not implement all Phase 2 methods in one pass.
- Do not add public per-method endpoints.
- Do not move interpolation, finite-difference, Hermite, Taylor, spline, graph-sampling, or error computation into React.
- Recommended backend next step: rerun the full backend verification under Python 3.11+ to satisfy `backend/pyproject.toml` rather than the current Python 3.10.11 runtime.
- Recommended frontend next step: Claude Opus should review and commit the untracked frontend/design assets that are intended to become the V1 frontend baseline.
- Optional backend hardening: run the same verification commands under Python 3.11+ or 3.13. The current `python` on this machine is Python 3.10.11, while `backend/pyproject.toml` declares the intended Python 3.11+ target.
