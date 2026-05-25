# Phase 2 — Equal-Spacing Browser QA Results (Task 7.4)

Spec: `.kiro/specs/phase-2-frontend-workbench`
Scenarios from `design.md` §13.
Frontend: `http://localhost:5173/` (Vite dev server, terminalId 3).
Backend: `http://127.0.0.1:8000` (uvicorn, terminalId 4).
Browser: Chrome via `chrome-devtools` MCP.
Network rule (R1.2): only `GET /health`, `POST /api/validate-function`, and
`POST /api/interpolate` are permitted. All scenarios respected this rule.

---

## PHASE2-EQ-01 — Equal-Spacing happy path — PASS

- Result: **PASS**.
- Screenshot: `phase2-eq-01-happy.png`.
- Inputs:
  - Loaded the "Newton Forward (cos x at 1.0…2.2)" example
    (`mode = x_values_with_function`, `function = cos(x)`,
    `x = ["1.0", "1.3", "1.6", "1.9", "2.2"]`,
    `evaluation_x = ["1.5"]`, `precision = 50`, `exact = true`,
    `graph = false`).
  - Then enabled the additional methods Newton Backward and Stirling
    so the request used `methods = ["newton_forward", "newton_backward",
    "stirling"]`.
- DOM observations:
  - Result Summary shows `status = ok`, `degree = 4`, `nodes = 5`,
    `precision = 50`, `mode = exact`, family chip
    `EQUAL SPACING` carrying `Newton_forward`, `Newton_backward`,
    `Stirling`.
  - Interpolation Nodes table renders all 5 nodes with cos(x) values.
  - No error chips on Result Summary; the only "error" substrings on the
    page are unrelated boilerplate ("method-level error" hint on the
    `osculating` selector card and "Generate plot arrays for f(x), P(x),
    and error" copy on the graph toggle).
- Network requests observed during scenario (fetch / xhr only):
  - `GET http://localhost:5173/health` (200) — multiple polling hits.
  - `POST http://localhost:5173/api/validate-function` (200) — debounced
    validator triggered after the example loaded `cos(x)`.
  - `POST http://localhost:5173/api/interpolate` (200) — single Compute
    request for the three Equal-Spacing methods.
  - No other endpoints were called. Conforms to R1.2.

---

## PHASE2-EQ-02 — Equal-Spacing ineligible (frontend gate) — PASS

- Result: **PASS**.
- Screenshot: `phase2-eq-02-ineligible.png`.
- Inputs:
  - Reset the form, then in `points` mode entered four unequally-spaced
    nodes:
    - `(0, 0)`
    - `(1, 1)`
    - `(2.5, 0)`
    - `(4, 0)`
  - Selected only Equal-Spacing methods: Newton Forward, Newton Backward,
    Stirling. Lagrange and Newton (V1) were unchecked so the entire
    `methods` array is Equal-Spacing only.
- DOM observations:
  - Method Configuration card renders the EqualSpacingHint:
    `Spacing not equal: differences vary beyond tolerance` (intermediate
    states during typing also briefly showed `non-finite value detected`
    while a row was still empty).
  - Compute button has:
    - `disabled = true`
    - `aria-disabled = "true"`
    - `title = "Equal-spacing methods need equally spaced x-values:
      differences vary beyond tolerance"`
  - The button text is still `Compute`. Reset button stayed enabled.
- Network requests observed during scenario (fetch / xhr only):
  - Only `GET http://localhost:5173/health` polling. No new
    `POST /api/interpolate` and no new `POST /api/validate-function`
    request was issued because the gate prevents the click and the
    function field is empty in `points` mode.
  - Conforms to R1.2 and to R4.5 / R5.2 (frontend gate behavior).

---

## PHASE2-EQ-03 — Stirling needs centered count — PASS

- Result: **PASS**.
- Screenshot: `phase2-eq-03-stirling-even.png`.
- Inputs:
  - Loaded the "Stirling (cos x, centered)" example
    (`mode = x_values_with_function`, `function = cos(x)`,
    `x = ["1.0", "1.3", "1.6", "1.9", "2.2"]`,
    `methods = ["stirling"]`, `evaluation_x = ["1.5"]`,
    `precision = 50`, `exact = true`).
  - Added a 6th equally-spaced x-value `2.5` so the request had six
    nodes (even count, five intervals).
  - EqualSpacingHint stayed `Spacing appears equal: h ≈ 0.3`, so the
    frontend gate did NOT trip and Compute was sent to the backend, as
    required to surface the backend method-level error.
- DOM observations:
  - Result Summary shows top-level `status = partial`, `nodes = 6`,
    `degree = 5`, `mode = exact`. Family chip is `EQUAL SPACING` with
    only `Stirling`.
  - The `Methods` tab renders the Stirling panel with `ErrorNotice`
    text:
    - "Stirling's method in Phase 2.1 requires an odd number of equally
      spaced nodes."
    - `Code: stirling_requires_centered_nodes`
  - The Interpolation Nodes table renders all 6 nodes including the
    backend-evaluated `cos(2.5) = -0.801143615547`, confirming the
    sibling renderers stay operational under `partial`.
- Network requests observed during scenario (fetch / xhr only):
  - `GET http://localhost:5173/health` (polling).
  - `POST http://localhost:5173/api/validate-function` (200) — debounced
    after the example loaded `cos(x)`.
  - `POST http://localhost:5173/api/interpolate` (200) — single Compute
    request that returned the partial Stirling error.
  - No other endpoints were called. Conforms to R1.2.

---

## URL set observed across all three scenarios

Subset of the allowed set, exactly as required by R1.2:

- `GET http://localhost:5173/health`
- `POST http://localhost:5173/api/validate-function`
- `POST http://localhost:5173/api/interpolate`

(The dev server proxies `/api/*` and `/health` to
`http://127.0.0.1:8000` per `frontend/vite.config.ts`. Only these three
paths were observed in the DevTools Network panel during task 7.4.)

## Honest deviations / notes

- The pre-existing `phase2-eq-02-ineligible-gate.png` screenshot from
  an earlier run was kept on disk; the canonical screenshot for the
  ineligible scenario referenced by `design.md` §13 is the freshly
  captured `phase2-eq-02-ineligible.png` produced in this task.
- The pre-existing `phase2-eq-01-happy.png` was overwritten with a
  freshly captured screenshot from this task.
- The first attempt at the EQ-03 screenshot failed with a CDP
  `Page.captureScreenshot timed out` warning; a retry seconds later
  succeeded with no other state change.
