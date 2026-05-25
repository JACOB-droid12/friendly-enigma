# Plan — Interpolating Polynomial Program Backend

## Objective
Build the backend and numerical engine for the interpolation program.

## Current Status
v1 backend implementation is complete in `backend/` with FastAPI endpoints, shared parser/normalization/precision layers, pure interpolation method modules, orchestration, graph-data generation, tests, and verification script. V1+ frontend lecture example loading, guided explanation/defense notes, result quality / warnings guide, and current V1+ browser compute smoke are complete without backend/API contract changes. Phase 2 P2.0 contract and architecture prep, P2.1 equal-spacing implementation, P2.2 first-derivative Hermite implementation, P2.3 Taylor implementation, P2.4 natural cubic spline implementation, and P2.5 final audit are complete with release caveats. Backend Phase 2 is verified under Python 3.12.13 using `backend/.venv`. Phase 2 frontend workbench (spec `phase-2-frontend-workbench`) is implemented under `frontend/src/` and verified on 2026-05-26 with `npm run build`, `npm run lint`, and `npm test` exit 0 plus the documented Browser QA Matrix (PHASE2-EQ-01..03, PHASE2-HERMITE-01..03, PHASE2-TAYLOR-01..02, PHASE2-SPLINE-01, PHASE2-OSCULATING-01, PHASE2-V1-01..04, PHASE2-MOBILE-01 PASS; PHASE2-SPLINE-02 PARTIAL because the UI gates non-natural boundary conditions per locked decision #5 and the renderer error path is covered by a unit test); no `backend/` file was modified and `docs/API_CONTRACT.md` was not modified (R18.4). A 2026-05-25 `py -3.13` attempt failed before test execution because Windows could not create the WindowsApps Python 3.13 process, but the Python 3.11+ gate is closed by the passing Python 3.12.13 verification.

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
| V1+ result quality / warnings guide | Completed 2026-05-24 | Existing Guide tab includes a frontend-only trust and warnings guide based on `status`, `warnings`, `evaluations`, and `graph_data`; no backend files, endpoint paths, request shapes, response shapes, or React interpolation math changed. |
| Phase 2 scope confirmation | Completed 2026-05-24 | Brainstorming confirmed Approach B: staged comprehensive lecture-method expansion with backend-owned computation, stable endpoints, and frontend handoff only unless scope changes. |
| Phase 2 formal spec | Completed 2026-05-24 | `docs/superpowers/specs/phase-2-lecture-method-workbench/requirements.md`, `design.md`, and `tasks.md` define scope, architecture, milestone tasks, and completion checklist. |
| Phase 2 implementation plan | Completed 2026-05-24 | `docs/superpowers/plans/2026-05-24-phase-2-lecture-method-workbench.md` defines P2.0 through P2.5, with P2.0/P2.1 ready for staged execution. |
| P2.0 contract and architecture prep | Completed 2026-05-24 | Phase 2 method literals, optional `method_options`, string-valued derivative data, method metadata, new warning/error codes, method-not-implemented routing, API docs, frontend handoff docs, and compatibility tests are in place. Backend verification passed with `python -m pytest` -> 48 passed and `python -m ruff check .` -> `All checks passed!`. |
| P2.1 equal-spacing family | Completed 2026-05-24 | Implemented `newton_forward`, `newton_backward`, and `stirling` with finite-difference tables, target guidance, lecture regression tests, API docs, frontend handoff guidance, and backend verification. Backend verification passed with `python -m pytest` -> 58 passed and `python -m ruff check .` -> `All checks passed!`. |
| P2.2 derivative-data family | Completed 2026-05-24 | Implemented `hermite_divided_difference` and `hermite` with first-derivative repeated-node tables, Hermite polynomial output, low-degree basis output, lecture regression tests, API docs, frontend handoff guidance, and backend verification. `osculating` is explicitly deferred because generalized derivative-order repeated-node support is not yet implemented or tested. Backend verification passed with `python -m pytest` -> 65 passed and `python -m ruff check .` -> `All checks passed!`. |
| P2.3 Taylor family | Completed 2026-05-24 | Implemented `taylor` with safe parsed functions, center/order options, derivative term list, Taylor/Maclaurin polynomial output, LaTeX, evaluations, remainder note, lecture regression tests, API docs, frontend handoff guidance, and backend verification. Backend verification passed with `python -m pytest` -> 70 passed and `python -m ruff check .` -> `All checks passed!`. |
| P2.4 piecewise family | Completed 2026-05-24 | Implemented natural `cubic_spline` with segment coefficients, interval metadata, continuity checks, spline-backed graph samples, piecewise no-global-polynomial response behavior, API docs, frontend handoff guidance, and backend verification. Backend verification passed with `python -m pytest` -> 73 passed and `python -m ruff check .` -> `All checks passed!`. |
| P2.5 release candidate | Completed with release caveats 2026-05-24 | Final audit written to `docs/PHASE_2_FINAL_AUDIT.md`. Backend verification passed with `python -m pytest` -> 73 passed and `python -m ruff check .` -> `All checks passed!`; Python 3.11+ verification later passed with `.\.venv\Scripts\python.exe -m pytest` -> 73 passed and `.\.venv\Scripts\python.exe -m ruff check .` -> `All checks passed!` under Python 3.12.13. Frontend verification passed with `npm run build`, `npm run lint`, and `npm test` -> 4 files / 17 tests passed. Current V1+ browser compute smoke passed through DevTools using a static/proxy server. Full Phase 2 product release remains gated by Claude Opus frontend/browser QA for the not-yet-implemented Phase 2 controls/renderers. |
| Phase 2 frontend workbench | Completed 2026-05-26 | Spec `phase-2-frontend-workbench` (R1–R18) implemented under `frontend/src/` with 13 modified + 19 new files. The Method Selector now renders a family-grouped catalog (`MethodSelector.catalog.ts`); the Adaptive "Method Configuration" card hosts `EqualSpacingHint`, `DerivativeInputTable`, `TaylorConfigBlock`, and `CubicSplineConfigBlock`; family renderers `EqualSpacingDetails`, `HermiteDetails`, `TaylorDetails`, `CubicSplineDetails`, and `DeferredMethodDetails` live under `frontend/src/components/results/methods/`; `PolynomialCard`, `SummaryCard`, `GuidedExplanation`, and `ResultQualityGuide` are extended for Phase 2; lecture-aligned Examples Panel V2 entries cover every implemented Phase 2 method plus the deferred `osculating`. Verification commands (run from `frontend/`) recorded exit 0: `npm run build`, `npm run lint`, and `npm test` (57 / 57 Vitest tests). Browser QA Matrix outcomes: PHASE2-EQ-01..03 PASS, PHASE2-HERMITE-01..03 PASS, PHASE2-TAYLOR-01..02 PASS, PHASE2-SPLINE-01 PASS, PHASE2-SPLINE-02 PARTIAL (UI gates non-natural per locked decision #5; renderer error path covered by `CubicSplineDetails.test.tsx`), PHASE2-OSCULATING-01 PASS (with sibling renderer pass), PHASE2-V1-01..04 PASS, PHASE2-MOBILE-01 PASS at 320×800 emulation. No `backend/` file was modified (R1.1) and `docs/API_CONTRACT.md` was not modified (R18.4). Full file-by-file change log, exact command exit codes, and per-scenario observations live in `docs/HANDOFF.md` "Session: Phase 2 Frontend Workbench (2026-05-26)" and `docs/FRONTEND_HANDOFF.md` "Phase 2 Frontend Workbench (2026-05-26)". |

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

Python 3.11+ verification environment used on 2026-05-25:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m ruff check .
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
- No required V1+ result quality / warnings guide work remains.
- Current V1+ browser compute smoke passed for linear Lagrange graph output and the `1/x` function-backed lecture example.
- Backend Phase 2 P2.5 final audit is complete in `docs/PHASE_2_FINAL_AUDIT.md`.
- Dedicated Claude Opus Phase 2 frontend implementation handoff is available at `docs/OPUS_PHASE_2_FRONTEND_HANDOFF.md`.
- Phase 2 frontend workbench implementation and browser QA are complete; see milestone row above and the Phase 2 sections of `docs/HANDOFF.md` and `docs/FRONTEND_HANDOFF.md`.
- Python 3.11+ verification is complete under Python 3.12.13 in `backend/.venv`.
- `osculating` remains explicitly deferred because generalized derivative-order repeated-node support is not implemented or tested. The frontend keeps `osculating` visible in the Method Selector with a "Deferred" badge and renders the backend's `method_not_implemented` response via `DeferredMethodDetails` (locked decision #3).
- PHASE2-SPLINE-02 is recorded as PARTIAL because the cubic spline boundary-condition `<select>` keeps non-natural options as `disabled` placeholders (locked decision #5), so the UI cannot send a non-natural value. The renderer's `unsupported_boundary_condition` error path is covered by `frontend/src/components/results/methods/CubicSplineDetails.test.tsx`.
- Honest Phase 2 frontend caveats recorded in `docs/HANDOFF.md` and `docs/FRONTEND_HANDOFF.md`: PHASE2-TAYLOR-02 was triggered with `sqrt(x)` whose derivative at `center = 0` is `zoo`, exercising the documented `unsupported_taylor_function` path rather than `unsafe_expression`; PHASE2-MOBILE-01 used `mcp_chrome_devtools_emulate` with viewport `320x800x1,mobile,touch` because `resize_page` clamps the outer browser window only; the "Hermite Divided Difference (Bessel-style)" example seeds `methods: ["hermite_divided_difference"]` only (PHASE2-HERMITE-03 exercises the `hermite` basis-form panel separately). None of these are blockers.
- `docs/API_CONTRACT.md` was not modified by the Phase 2 frontend work; the frontend remains a thin renderer of the documented contract plus a method-aware input layer (R18.4).
- Do not implement all Phase 2 methods in one pass.
- Do not add public per-method endpoints.
- Do not move interpolation, finite-difference, Hermite, Taylor, spline, graph-sampling, or error computation into React.
- Recommended frontend next step: Claude Opus should review and commit the untracked frontend/design assets that are intended to become the V1 frontend baseline.
- Frontend QA note for Claude Opus: Chrome DevTools reports one `No label associated with a form field` issue for hidden Base UI display-precision radio inputs.
- Optional backend hardening: keep using `backend/.venv\Scripts\python.exe` for release verification unless the broken WindowsApps `py -3.13` launcher target is repaired.
- Current Git hygiene note: tracked `Lecture/` files are currently deleted in the worktree. Codex did not stage or commit those deletions; restore or intentionally commit them separately before calling the repository clean.
