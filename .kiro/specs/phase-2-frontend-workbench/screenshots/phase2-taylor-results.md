# Phase 2 Browser QA — Taylor scenarios (task 7.6)

Spec: `.kiro/specs/phase-2-frontend-workbench` · design.md §13.
Backend: `http://127.0.0.1:8000` (uvicorn, terminalId 4).
Frontend: `http://localhost:5173` (Vite dev, terminalId 3).
Browser: Chrome (DevTools MCP).
Date: 2026-05-25.

Both scenarios were driven through the existing UI — the Examples
Panel "Taylor (cos x, order 3)" entry for the happy path, then the
function field was edited to `sqrt(x)` for the unsupported path
(keeping the other form values intact: mode `x_values_with_function`,
x = `0, 1`, methods `["taylor"]`, `method_options.taylor =
{ center: "0", order: 3 }`, `evaluation_x = ["1/2"]`). No backend
files were modified.

## PHASE2-TAYLOR-01 — Taylor happy path

- Result: **PASS**.
- Screenshot: `phase2-taylor-01-happy.png`.
- Inputs (request body, exactly as captured from DevTools):
  ```json
  {
    "mode": "x_values_with_function",
    "methods": ["taylor"],
    "precision": 50,
    "exact": true,
    "evaluation_x": ["1/2"],
    "graph": false,
    "x_values": ["0", "1"],
    "function": "cos(x)",
    "method_options": { "taylor": { "center": "0", "order": 3 } }
  }
  ```
- Backend response: `status: "ok"`, `methods.taylor.status: "ok"`.
  Key fields rendered by `TaylorDetails.tsx`:
  - Header row: `center = 0`, `order = 3`, `series = Maclaurin`, plus
    the `Maclaurin (center = 0)` Badge (per design.md §9.3 / R8.3).
  - Term table with all six columns
    (`order`, `derivative`, `f^(k)(c)`, `coefficient`, `term`,
    `LaTeX`) and four rows for orders 0–3:
    `cos(x), -sin(x), -cos(x), sin(x)` with their evaluated-at-zero
    derivatives `1, 0, -1, 0`, coefficients `1, 0, -1/2, 0`, and
    terms `1, 0, -x**2/2, 0`. KaTeX renders the `latex_term`s.
  - Polynomial forms: `taylor_form` and `expanded` both
    `1 - x**2/2`; `latex_taylor` and `latex_expanded` both
    `1 - \frac{x^{2}}{2}`.
  - Evaluation chip: `P(1/2) = 7/8`.
  - `remainder_note` rendered exactly as the backend text, no edits.
  - Construction Steps `<ol>` with the four backend-provided steps.
- Network traffic: only `GET /health`, `POST /api/validate-function`,
  `POST /api/interpolate` (R1.2).
- Deviations: none.

## PHASE2-TAYLOR-02 — Taylor unsupported function

- Result: **PASS**.
- Screenshot: `phase2-taylor-02-unsupported.png`.
- Trigger: same request body as TAYLOR-01 but with
  `"function": "sqrt(x)"`. `sqrt(x)` parses cleanly through the
  backend whitelist, evaluates fine at the listed nodes (so the
  request is not rejected up front by the existing
  `function_domain_error` path), but its derivative at `center = 0`
  evaluates to `zoo` (complex infinity) inside `build_taylor`, so
  `_raise_for_unsupported` raises `unsupported_taylor_function` for
  that method. The function expression itself was not modified;
  only its evaluation at the chosen Taylor center fails.
- Inputs (request body, exactly as captured from DevTools):
  ```json
  {
    "mode": "x_values_with_function",
    "methods": ["taylor"],
    "precision": 50,
    "exact": true,
    "evaluation_x": ["1/2"],
    "graph": false,
    "x_values": ["0", "1"],
    "function": "sqrt(x)",
    "method_options": { "taylor": { "center": "0", "order": 3 } }
  }
  ```
- Backend response: `status: "partial"`, only the `taylor` method
  in the response, with the verbatim error block:
  ```json
  {
    "status": "error",
    "warnings": [],
    "error": {
      "code": "unsupported_taylor_function",
      "message": "Taylor derivative terms must be real and fully symbolic at the selected center.",
      "details": { "artifact": "derivative_at_center", "order": 1, "value": "zoo" }
    }
  }
  ```
- Frontend rendering: the Methods → Taylor panel renders the
  inline `ErrorNotice` (severity `error`, layout `block`) with the
  backend code (`unsupported_taylor_function`) and the backend
  message verbatim. No term table, no polynomial forms, no
  evaluation chips — every collection field is omitted by the
  backend on a method-level error and `TaylorDetails.tsx` short-
  circuits cleanly through its `?? []` / `?.` / `!= null` guards
  (per the renderer comment).
- Network traffic: only `GET /health`, `POST /api/validate-function`,
  `POST /api/interpolate` (R1.2). One earlier exploratory compute
  with `log(x)` returned a top-level `function_domain_error`
  (HTTP 400) before the final `sqrt(x)` compute that produced the
  documented `unsupported_taylor_function` response; this earlier
  attempt is not part of the recorded scenario but is mentioned for
  honesty.
- Actual error code observed: `unsupported_taylor_function`.
- Deviations: design.md §13 phrases the trigger as "Unsafe or
  unsupported function expression"; the actual safest way to drive
  the documented `unsupported_taylor_function` code is a function
  the parser whitelist accepts but whose derivative at the chosen
  center is not finite/real. `sqrt(x)` with center `0` does that.
  Truly unsafe expressions (e.g. `gamma(x)`) would be rejected
  earlier by the parser with `unsafe_expression`, which is a
  different documented code.

## Allowed network URL set (across both scenarios)

- `GET http://localhost:5173/health` (proxied to the backend by
  Vite per `frontend/vite.config.ts`).
- `POST http://localhost:5173/api/validate-function` (debounced
  function validation per design.md §2.1).
- `POST http://localhost:5173/api/interpolate` (single Compute
  endpoint, request body shown above).

No other backend paths were hit. R1.2 satisfied.
