# Phase 2 Browser QA — Cubic Spline scenarios (task 7.7)

Spec: `.kiro/specs/phase-2-frontend-workbench` · design.md §13.
Backend: `http://127.0.0.1:8000` (uvicorn, terminalId 4).
Frontend: `http://localhost:5173` (Vite dev, terminalId 3).
Browser: Chrome (DevTools MCP).
Date: 2026-05-25.

Both scenarios were exercised against the running stack. PHASE2-SPLINE-01
was driven through the existing UI (Examples Panel "Cubic Spline
(lecture three-point)" entry plus the Compute button). PHASE2-SPLINE-02
was driven via a direct `fetch("/api/interpolate", ...)` from inside
the localhost:5173 page context — the boundary-condition `<select>`
gates non-natural values to `disabled` `<option>` placeholders per
locked decision #5 in `tasks.md`, so the UI cannot send a
non-natural value, and direct API drive is the documented fallback in
the design.md §13 PHASE2-SPLINE-02 row ("if the boundary selector
permits a non-natural value (it should not by §7.4)"). No backend
files were modified; no `docs/API_CONTRACT.md` edits were made.

## PHASE2-SPLINE-01 — Cubic spline happy path with graph

- **Result:** PASS.
- **Screenshot:** `phase2-spline-01-happy.png` (Graph tab visible
  with the `Cubic_spline` source-method Badge in the top-right of
  the chart card).
- **Inputs:** Loaded the "Cubic Spline (lecture three-point)" example
  (Examples Panel) — points `(1, 2)`, `(2, 3)`, `(3, 5)`,
  `methods: ["cubic_spline"]`, `splineBoundaryCondition: "natural"`,
  `evaluation_x = ["5/2"]`, `graph: true`, `precision: 50`,
  `exact: true`. Then clicked Compute.
- **Request body** (verbatim, from DevTools network panel):
  ```json
  {
    "mode": "points",
    "methods": ["cubic_spline"],
    "precision": 50,
    "exact": true,
    "evaluation_x": ["5/2"],
    "graph": true,
    "points": [["1","2"], ["2","3"], ["3","5"]],
    "method_options": { "cubic_spline": { "boundary_condition": "natural" } }
  }
  ```
- **Backend response highlights** (read directly from the parsed
  response, no fields invented):
  - Top-level `status: "ok"`. `methods.cubic_spline.status: "ok"`.
  - `methods.cubic_spline.boundary_condition: "natural"`.
  - `methods.cubic_spline.ordered_nodes`: `[{ index: 0, x: "1", y: "2" },
    { index: 1, x: "2", y: "3" }, { index: 2, x: "3", y: "5" }]`.
  - `methods.cubic_spline.second_derivatives`: `["0", "3/2", "0"]`.
  - `methods.cubic_spline.segments`: 2 entries with keys
    `["index","interval","coefficients","local_form","expanded","latex"]`.
    Segment 0 covers `[1, 2]` with `a=2, b=3/4, c=0, d=1/4`; segment 1
    covers `[2, 3]` with `a=3, b=3/2, c=3/4, d=-1/4`.
  - `methods.cubic_spline.continuity_checks`: 1 entry at `x = 2`,
    all three continuity flags true.
  - `methods.cubic_spline.evaluations`:
    `[{ x: "5/2", value: "125/32", segment_index: 1,
       within_domain: true }]`.
  - `polynomial.expanded_omitted_reason:
    "piecewise_method_no_global_polynomial"` (drives the piecewise
    notice in `CubicSplineDetails.tsx` per design.md §9.4 / R9.3).
  - `graph_data.source_method:` **`"cubic_spline"`** (the value the
    task requires confirming for R17.5 / R9.4). The full
    `graph_data` payload carries `x` (length 101), `f_x`, `P_x`
    (length 101), `error`, `source_method`, and `method_graphs`
    keys.
- **DOM verification on the Methods → Cubic_spline panel:**
  - `Boundary Condition` heading + `natural` Badge rendered.
  - Piecewise notice text rendered: "This is a piecewise spline; the
    backend does not return a single global polynomial. See the
    Methods tab below for the segment list."
  - `Ordered Nodes` table renders three rows (index/x/y).
  - `Second Derivatives Mᵢ` chip row renders three chips:
    `M₀ = 0`, `M₁ = 3/2`, `M₂ = 0`.
  - `Segments` table renders two rows with columns `index`,
    `interval`, `a`, `b`, `c`, `d`, `local_form`, `expanded`, and
    LaTeX (rendered through KaTeX).
  - `Continuity Checks` table renders one row at `x = 2` with three
    `✓` glyphs paired with `sr-only` "yes" labels (visible in the
    accessibility snapshot as `value continuous` / `S′(x)
    continuous` / `S″(x) continuous` columns reading "yes").
  - `Evaluations` chip renders `P(5/2) = 125/32 (segment 1)` —
    `segment_index` is surfaced per design.md §9.4 (8th item).
  - `Construction Steps` ordered list rendered.
- **Graph tab verification:**
  - The Graph card source-method Badge text is `Cubic_spline`
    (capitalized in the `formatSourceMethod` helper but the
    underlying `graph_data.source_method` is the literal
    `cubic_spline`, confirmed by the parsed response above).
  - Recharts area renders the polynomial curve; nodes legend and
    P(x) legend visible.
- **`graph_data.source_method` observed:** **`"cubic_spline"`**.
- **Network observed:** `GET /health` (multiple), `POST /api/interpolate`.
  No other backend paths.
- **Deviations:** none.

## PHASE2-SPLINE-02 — Cubic spline unsupported boundary

- **Result:** PARTIAL — the network expectation and backend error
  contract are exercised end-to-end, but the rendering path
  (`CubicSplineDetails` showing the inline `ErrorNotice` for
  `unsupported_boundary_condition`) is intentionally NOT driven from
  the UI for this scenario. Per locked decision #5 in
  `tasks.md`, the boundary-condition selector keeps non-natural
  options as `disabled` `<option>` placeholders, so the UI cannot
  send a non-natural value. The renderer's
  `unsupported_boundary_condition` branch is covered by the existing
  unit test
  `frontend/src/components/results/methods/CubicSplineDetails.test.tsx`
  (case "renders inline ErrorNotice for `unsupported_boundary_condition`",
  asserted against the `splineUnsupportedBoundaryResponse` fixture).
- **Screenshot:** `phase2-spline-02-unsupported-boundary.png`
  showing:
  - The Method Configuration card with the Cubic Spline Configuration
    block and the boundary-condition `<select>` value `Natural`.
  - An injected dashed-border preview panel listing all four
    `<option>` rows with their `value`, label, `disabled` state, and
    the exact `title` tooltip text the UI ships
    (e.g. `clamped — disabled — title="Backend currently accepts
    only natural; clamped is deferred."`). This makes the disabled
    placeholders + their tooltip titles visible in a single still
    image because native HTML `<select>` dropdowns cannot be
    programmatically opened for screenshotting.
  - A red-bordered overlay in the bottom-right of the page that
    surfaces the direct fetch result (HTTP 200, top-level
    `status: "partial"`, `methods.cubic_spline.status: "error"`,
    `error.code: "unsupported_boundary_condition"`, the verbatim
    backend message, and `error.details`).
- **How the request was driven** (locked decision #5 forces this
  path): an in-page `fetch("/api/interpolate", ...)` ran from the
  DevTools console via `mcp_chrome_devtools_evaluate_script` so the
  request goes through the same Vite dev proxy
  (`frontend/vite.config.ts`) and the same browser fetch stack the
  app uses. No new endpoint paths were introduced (R1.2 satisfied).
- **Request body** (verbatim, from DevTools network panel):
  ```json
  {
    "mode": "points",
    "methods": ["cubic_spline"],
    "precision": 50,
    "exact": true,
    "evaluation_x": ["5/2"],
    "graph": false,
    "points": [["1","2"], ["2","3"], ["3","5"]],
    "method_options": { "cubic_spline": { "boundary_condition": "clamped" } }
  }
  ```
- **Backend response highlights** (read directly from the parsed
  response, no fields invented):
  - HTTP `200`. Top-level `status: "partial"`.
  - `methods.cubic_spline.status: "error"`. The method block carries
    only `["status","warnings","error"]` keys (no
    `ordered_nodes`/`segments`/etc.), matching the
    `CubicSplineDetails.tsx` "method-level error" guard.
  - `methods.cubic_spline.error.code:`
    **`"unsupported_boundary_condition"`**.
  - `methods.cubic_spline.error.message:` `"P2.4 cubic_spline
    supports the natural boundary condition only."`.
  - `methods.cubic_spline.error.details:`
    `{ "boundary_condition": "clamped", "supported": ["natural"] }`.
  - `polynomial.expanded_omitted_reason: null` (no piecewise notice).
  - `graph_data: null` (graph disabled in the request).
- **Actual error code observed:**
  **`unsupported_boundary_condition`** — matches the design.md §13
  fixture `splineUnsupportedBoundaryResponse` and the contract
  field name verbatim.
- **Network observed:** `GET /health` (multiple),
  `POST /api/interpolate`. No other backend paths.
- **Deviations:**
  - The scenario was exercised through a direct in-page fetch rather
    than the UI selector, because locked decision #5 (and the
    `CubicSplineConfigBlock.tsx` source) constrains the
    `<select>` to `natural`. design.md §13 row PHASE2-SPLINE-02
    explicitly notes this with "if the boundary selector permits a
    non-natural value (it should not by §7.4)". The renderer's
    error path is covered by
    `CubicSplineDetails.test.tsx` per §12.2.
  - The screenshot shows the disabled-placeholder list via an
    injected dashed-border preview panel (not the native dropdown
    open) because Chrome cannot programmatically open a native
    `<select>` for screenshotting.

## Allowed network URL set (across both scenarios)

Collected from `performance.getEntriesByType('resource')` plus the
DevTools Network panel. Backend paths that were hit during this run:

- `GET http://localhost:5173/health` (proxied to the backend by
  Vite per `frontend/vite.config.ts`).
- `POST http://localhost:5173/api/interpolate` (single Compute
  endpoint; both the SPLINE-01 happy compute and the SPLINE-02
  direct fetch went through this path).

`POST /api/validate-function` was not hit because no function
expression was edited in either scenario (Cubic Spline operates on
points only). R1.2 only forbids paths outside
`{ /health, /api/interpolate, /api/validate-function }`; it does
not require all three to be hit. No other backend paths were
called. R1.2 satisfied.
