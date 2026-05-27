# Plan — Interpolating Polynomial Program Backend

## Objective
Build the backend and numerical engine for the interpolation program.

## Current Status
v1 backend implementation is complete in `backend/` with FastAPI endpoints, shared parser/normalization/precision layers, pure interpolation method modules, orchestration, graph-data generation, tests, and verification script. V1+ frontend lecture example loading, guided explanation/defense notes, result quality / warnings guide, and current V1+ browser compute smoke are complete without backend/API contract changes. Phase 2 P2.0 contract and architecture prep, P2.1 equal-spacing implementation, P2.2 first-derivative Hermite implementation, P2.3 Taylor implementation, P2.4 natural cubic spline implementation, and P2.5 final audit are complete with release caveats. Candidate A numeric-mode tolerance hardening is complete: finite-difference equal-spacing, finite Newton method eligibility, cubic-spline continuity checks, and Hermite basis/divided-difference match checks now preserve exact symbolic comparison for `exact=true` and use backend precision-aware tolerance for `exact=false`. Backend Phase 2 is verified under Python 3.12.13 using `backend/.venv`. Phase 2 frontend workbench (spec `phase-2-frontend-workbench`) is implemented under `frontend/src/` and verified on 2026-05-26 with `npm run build`, `npm run lint`, and `npm test` exit 0 plus the documented Browser QA Matrix. A reciprocal graph node plotting regression was fixed on 2026-05-26 by replacing frontend `parseFloat` chart conversion with strict numeric-string parsing that understands exact rational `a/b` node strings; the backend/API contract and interpolation math were unchanged. Verification for the graph fix passed `npm run lint`, `npm run build`, `npm test` (58 tests), a backend reciprocal smoke, and Browser DOM/SVG QA on `http://127.0.0.1:5173/`. V2 RC backend correctness work is in progress on 2026-05-27: Stirling now evaluates through direct centered finite-difference terms, `input_summary.sorted_nodes` is wired from method reordering warnings, and Pydantic v2/method option hardening is implemented with targeted regressions passing. A post-audit Vercel preview deployment from the committed branch state is ready at `https://interpolation-workbench-bnuyc0i94-marvillarq20-3593s-projects.vercel.app`, deployment id `dpl_9gUubAmn1UbbkF97WgZjFTGieaUW`, using a single-project Vite static + FastAPI serverless adapter architecture. Production has not been promoted. A 2026-05-25 `py -3.13` attempt failed before test execution because Windows could not create the WindowsApps Python 3.13 process, but the Python 3.11+ gate is closed by the passing Python 3.12.13 verification.

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
| Graph data generation | Completed | Returns backend-generated arrays for `x`, `f_x`, `P_x`, and `error`; no graph rendering is implemented. Standard interpolation uses barycentric graph sampling, cubic spline uses spline segments, and Taylor/Hermite graph samples use their method-owned polynomials. |
| FastAPI endpoints | Completed | `GET /health`, `POST /api/interpolate`, and `POST /api/validate-function` are implemented. |
| Tests | Completed | 89 backend tests cover parser safety, API contract paths, validation, normalization, precision, all methods, graph data, and lecture examples. |
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
| Vercel preview deployment | Completed 2026-05-26 | Single Vercel project `interpolation-workbench` is linked and preview-deployed. `vercel.json` builds `frontend/` with Vite, serves `frontend/dist`, rewrites `/health` and `/api/:path*` to `api/index.py`, and preserves SPA refresh fallback. `.python-version` pins Python 3.12 for Vercel function packaging; `.vercelignore` and function `excludeFiles` omit `Lecture/`, tests, caches, local virtualenvs, generated frontend output, and tool artifacts. Initial verified preview `https://interpolation-workbench-n8b0juxdx-marvillarq20-3593s-projects.vercel.app` was Ready, deployment id `dpl_Exdc1EiCKtrGyHaQGLJtaH3BxVtL`, function bundle `api/index` 21.21 MB. Backend pytest/Ruff/wrapper passed under Python 3.12.13; frontend build/lint/test passed; API smoke and browser smoke passed. Production not promoted; preview remains behind Vercel Deployment Protection/SSO. Superseded by the graph-timeout fix preview in the next milestone row. |
| Vercel graph timeout fix | Completed 2026-05-26 | Fixed graph-enabled serverless timeouts for exact function-backed examples by changing graph-only barycentric sampling from repeated symbolic simplification to precomputed numeric barycentric sampling at the requested precision. Endpoint paths, request shape, response shape, and method outputs are unchanged. Regression `test_exact_function_graph_sampling_avoids_symbolic_timeout` added. Backend verification passed with `python -m pytest` -> 74 passed and `python -m ruff check .` -> `All checks passed!`. New preview `https://interpolation-workbench-l5rm96fe6-marvillarq20-3593s-projects.vercel.app` is Ready, deployment id `dpl_7YuDqCSX4yPXVXmgNdmsi7kxwfHv`; deployed graph smoke for `newton_forward`, `newton_backward`, `stirling`, Taylor, Linear Lagrange, and Cubic Spline returned 200 with 101 graph samples. |
| Candidate A numeric-mode tolerance hardening | Completed 2026-05-26 | Fixed exact-zero fragility in numeric mode for finite-difference equal-spacing, `newton_forward` / `newton_backward` / `stirling` eligibility, cubic-spline continuity checks, and Hermite basis-vs-divided-difference matching. Exact mode still uses symbolic equality. Numeric mode uses backend precision-aware tolerance and keeps SymPy high-precision values. Added positive and negative guardrail tests proving decimal equal spacing and tiny residual continuity/match cases pass while truly unequal or mismatched cases still fail. Backend verification passed with `python -m pytest -q` -> 86 passed and `python -m ruff check .` -> `All checks passed!`. Candidate B remains deferred. |
| Graph accuracy and reliability fix | Completed 2026-05-26 | Fixed graph-data correctness for Taylor and Hermite by sampling successful method-owned polynomials instead of barycentric node interpolation. Fixed exact decimal graph endpoint drift by keeping sample bounds and steps in SymPy space instead of Python `float`. Added graph regressions for Taylor, Hermite, and exact decimal endpoints. Backend verification passed with `python -m pytest backend/app/tests -q` -> 89 passed. |
| Post-audit preview deploy from committed state | Completed 2026-05-26 | Branch `codex/interpolation-backend-v1` pushed with deploy plumbing, graph reliability, numeric-mode tolerance hardening, docs evidence, and repo hygiene commits. New Vercel preview `https://interpolation-workbench-bnuyc0i94-marvillarq20-3593s-projects.vercel.app`, deployment id `dpl_9gUubAmn1UbbkF97WgZjFTGieaUW`, is Ready. Local verification passed: backend `pytest` -> 89 passed / 1 existing Pydantic warning, backend Ruff -> `All checks passed!`, frontend lint/build/test -> pass (Vite chunk-size warning only). Vercel smoke passed for `/health`, `/api/validate-function`, Linear Lagrange `/api/interpolate`, and Newton Forward cos(x) `/api/interpolate`. Production not promoted. |
| Reciprocal graph node plotting fix | Completed 2026-05-26 | Fixed frontend Recharts node plotting for exact rational node strings by replacing `parseFloat` with strict graph numeric parsing for integer/decimal/scientific/rational strings. Added regression coverage for reciprocal nodes `(0,1)`, `(1/2,2/3)`, `(1,1/2)`, `(3/2,2/5)`, `(2,1/3)`. Backend reciprocal smoke confirmed existing API output was correct and point-only graph responses still omit `f(x)` and true error curves. Frontend verification passed with `npm run lint`, `npm run build`, and `npm test` -> 58 tests. Browser DOM/SVG QA confirmed five node markers at half-step x positions and legend limited to `Nodes` and `P(x)`. |
| V2 RC backend correctness/API hardening | Completed locally 2026-05-27 | Replaced Stirling's Lagrange fallback with direct centered Stirling finite-difference term summation, exposed `methods.stirling.evaluations[].terms`, wired `input_summary.sorted_nodes` from method-level `nodes_reordered` warnings, migrated strict Pydantic models to v2 `model_config`, hardened `method_options` to accepted structured blocks and strict Taylor center/order types, and added targeted regressions for Stirling terms, spline reordering summary, schema guardrails, method disagreement warnings, high-degree warnings, and Phase 2 option compatibility. Backend verification passed: `.\.venv\Scripts\python.exe -m pytest` -> 97 passed, `.\.venv\Scripts\python.exe -m pytest -W error::DeprecationWarning` -> 97 passed, and Ruff -> `All checks passed!`. Full frontend/repo verification and fresh preview smoke still pending before V2 RC completion is claimed. |

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

Vercel preview verification commands used on 2026-05-26:

```powershell
npx vercel inspect https://interpolation-workbench-bnuyc0i94-marvillarq20-3593s-projects.vercel.app
npx vercel curl /health --deployment https://interpolation-workbench-bnuyc0i94-marvillarq20-3593s-projects.vercel.app
npx vercel curl /api/validate-function --deployment https://interpolation-workbench-bnuyc0i94-marvillarq20-3593s-projects.vercel.app -- --request POST --header "Content-Type: application/json" --data '{"function":"sin(x)"}'
npx vercel curl /api/interpolate --deployment https://interpolation-workbench-bnuyc0i94-marvillarq20-3593s-projects.vercel.app -- --request POST --header "Content-Type: application/json" --data '{"mode":"points","points":[["2","4"],["5","1"]],"methods":["lagrange"],"precision":50,"exact":true,"evaluation_x":["3"],"graph":true}'
npx vercel curl /api/interpolate --deployment https://interpolation-workbench-bnuyc0i94-marvillarq20-3593s-projects.vercel.app -- --request POST --header "Content-Type: application/json" --data '{"mode":"x_values_with_function","x_values":["1.0","1.3","1.6","1.9","2.2"],"function":"cos(x)","methods":["newton_forward"],"precision":50,"exact":true,"evaluation_x":["1.5"],"graph":true}'
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
- Vercel preview is protected by Deployment Protection/SSO. Keep this in mind for professor/public access, or promote/configure access only after the user explicitly approves.
- Local `npx vercel build --yes` currently fails on this Windows machine because `uv` is not on PATH; remote Vercel builds are passing.
- Candidate B remains deferred. Chebyshev exact-mode Float generation was not changed by Candidate A tolerance hardening or the graph accuracy fix.
- Screenshot capture through the Browser plugin timed out during the reciprocal graph QA pass; DOM/SVG coordinate evidence was recorded instead.
