# Plan — Interpolating Polynomial Program Backend

## Objective
Build the backend and numerical engine for the interpolation program.

## Milestones
| Milestone | Status | Acceptance Criteria |
|---|---|---|
| Repository/documentation setup | Completed | `AGENTS.md`, `docs/HANDOFF.md`, `docs/PLAN.md`, `docs/API_CONTRACT.md`, and `docs/FRONTEND_HANDOFF.md` exist and describe the current pre-implementation state. |
| Detailed implementation plan | Completed | `docs/superpowers/plans/2026-05-22-interpolation-backend-implementation.md` exists and breaks the approved design into backend-only, test-first implementation tasks. |
| Core schemas and validation | Not started | Pydantic schemas accept the three input modes; validation rejects duplicate x-values, unsafe mode combinations, insufficient nodes, invalid precision, and non-real values. |
| Safe function parser | Not started | SymPy parsing uses a whitelist, rejects unknown symbols/names, rejects unsafe expressions, and never uses `eval`. |
| Precision handling | Not started | Numeric strings are preserved until explicit conversion; exact mode converts decimal strings to SymPy Rational when possible; high-precision mode uses mpmath with requested precision. |
| Lagrange method | Not started | Returns basis polynomials, unsimplified summation form, expanded polynomial, LaTeX, and educational steps. |
| Newton divided differences | Not started | Returns full divided-difference table, coefficients, nested Newton form, LaTeX, and educational steps. |
| Barycentric evaluation | Not started | Returns barycentric weights and evaluates requested targets; agrees with original nodes; documents double-precision SciPy limitations if SciPy is used. |
| Neville method | Not started | Returns triangular approximation table for each requested target. |
| Graph data generation | Not started | Returns arrays only, without rendering, for `f(x)`, `P_x`, and error on requested graph domain. |
| FastAPI endpoint | Not started | `GET /health`, `POST /api/interpolate`, and `POST /api/validate-function` match `docs/API_CONTRACT.md`. |
| Tests | Not started | pytest covers lecture examples, method agreement at original nodes, duplicate x rejection, invalid function rejection, API success, and API error paths. |
| API/frontend handoff documentation | Started | Initial planned contract exists; update after implementation if behavior changes. |

## Implementation Order
1. Repository/documentation setup
2. Detailed implementation plan
3. Core schemas and validation
4. Safe function parser
5. Precision handling
6. Lagrange method
7. Newton divided differences
8. Barycentric evaluation
9. Neville method
10. Graph data generation
11. FastAPI endpoint
12. Tests
13. API/frontend handoff documentation

## Validation Commands
Run these from the repository root unless noted otherwise:

```powershell
python --version
cd backend
python -m pip install -e ".[dev]"
python -m pytest
python -m ruff check .
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Optional API smoke checks once the server is running:

```powershell
Invoke-RestMethod -Uri http://127.0.0.1:8000/health
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/api/interpolate -ContentType 'application/json' -Body '{"mode":"points","points":[["2","4"],["5","1"]],"methods":["lagrange","newton","barycentric"],"precision":50,"exact":true,"evaluation_x":["3"]}'
```

## Stop-and-Fix Rules
- If duplicate x-values are accepted, stop and fix validation.
- If unsafe function strings execute or parse, stop and fix parser security.
- If numeric input is silently converted to float before precision handling, stop and fix precision handling.
- If Lagrange/Newton/Barycentric disagree at original nodes, stop and fix math engine.
- If tests are failing, do not claim completion.

## Remaining Work
- Choose execution mode for `docs/superpowers/plans/2026-05-22-interpolation-backend-implementation.md`: subagent-driven implementation or inline execution.
- Create backend package structure.
- Add dependency metadata.
- Implement all math core modules.
- Implement FastAPI endpoint layer.
- Implement tests.
- Run tests and update handoff files with exact results.
- Update API and frontend handoff docs after actual endpoint behavior is implemented.
