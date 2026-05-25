# Phase 2 Browser QA — Deferred Osculating scenario (task 7.8)

Spec: `.kiro/specs/phase-2-frontend-workbench` · design.md §13.
Backend: `http://127.0.0.1:8000` (uvicorn, terminalId 4).
Frontend: `http://localhost:5173` (Vite dev, terminalId 3).
Browser: Chrome (DevTools MCP).
Date: 2026-05-25.

The scenario was exercised in two passes against the running stack:

1. **Pass A — osculating alone.** Loaded the
   "Deferred — Osculating (Bessel-style)" example (Examples Panel)
   and clicked Compute. This is the verbatim PHASE2-OSCULATING-01
   scenario from `design.md` §13.
2. **Pass B — osculating alongside a working sibling
   (`hermite_divided_difference`).** Kept the loaded example, added
   `Hermite Divided Difference` via the Method Selector, and clicked
   Compute again. Pass B exercises the locked decision #4 contract +
   sibling renderer requirement called out in this task and in
   design.md §10.4 / R10.4.

No backend files were modified. No `docs/API_CONTRACT.md` edits.
No new endpoint paths.

## Result

**PASS.** Both passes confirm:

- The deferred-method panel renders the `method_not_implemented`
  notice cleanly, with the `Deferred` badge and the lecture-aware
  copy from `DeferredMethodDetails.tsx`.
- The Method Selector card for `osculating` retains the `Deferred`
  badge and the catalog `deferredNote` line.
- The sibling `hermite_divided_difference` renderer (Pass B) renders
  the full happy-path output: repeated nodes, divided-difference
  table, coefficients, Newton nested form, expanded form, and
  construction steps.
- The network set across both passes is `{ /health,
  /api/interpolate }`, satisfying R1.2.

## Pass A — osculating alone (PHASE2-OSCULATING-01 verbatim)

- **Screenshot:** `phase2-osculating-01-deferred.png` (full-page).
  Shows the loaded example, the Method Selector with the
  `Deferred` badge on the Osculating card and the `deferredNote`
  ("Backend currently returns a method-level error; see Methods tab
  for details."), the Method Configuration Derivative-Data block
  with the seeded Bessel-style derivatives, and the Methods tab
  open on the Osculating panel rendering the `Deferred` badge,
  the warning-severity ErrorNotice with `Code: method_not_implemented`,
  and the lecture-aware copy.
- **Inputs (from the seeded example):**
  - mode: `points`
  - points: `[["1.3","0.6200860"], ["1.6","0.4554022"], ["1.9","0.2818186"]]`
  - methods: `["osculating"]`
  - derivatives: `[
      {"x":"1.3","order":1,"value":"-0.52202324741466"},
      {"x":"1.6","order":1,"value":"-0.56989593526168"},
      {"x":"1.9","order":1,"value":"-0.581157072713434"}]`
  - precision: `50`, exact: `false`, evaluation_x: `["1.5"]`,
    graph: `false`.
- **Request body** (verbatim, from DevTools Network panel reqid 374):
  ```json
  {
    "mode": "points",
    "methods": ["osculating"],
    "precision": 50,
    "exact": false,
    "evaluation_x": ["1.5"],
    "graph": false,
    "points": [["1.3","0.6200860"],["1.6","0.4554022"],["1.9","0.2818186"]],
    "derivatives": [
      {"x":"1.3","order":1,"value":"-0.52202324741466"},
      {"x":"1.6","order":1,"value":"-0.56989593526168"},
      {"x":"1.9","order":1,"value":"-0.581157072713434"}
    ]
  }
  ```
- **Backend response highlights (HTTP 200):**
  - Top-level `status: "partial"`.
  - `methods.osculating.status: "error"`.
  - `methods.osculating.error.code:`
    **`"method_not_implemented"`**.
  - `methods.osculating.error.message:`
    `"osculating is planned for Phase 2 but is not implemented in this milestone."`
  - `methods.osculating.error.details: {"method":"osculating"}`.
  - `methods.osculating.warnings: []`.
  - `polynomial.expanded_omitted_reason: null` (no piecewise notice).
  - `graph_data: null`.
- **Actual error code observed:** **`method_not_implemented`**.
- **DOM verification (Methods → Osculating panel):**
  - `Deferred` badge rendered (variant `secondary`).
  - `ErrorNotice` rendered with severity `warning`, including the
    backend message verbatim and the literal `Code:
    method_not_implemented`.
  - Lecture-aware copy from `LECTURE_COPY[osculating]` rendered:
    "Generalized osculating polynomials match higher-order
    derivatives at each node. The backend has not implemented this
    yet; pick Hermite for first-derivative matching."
  - No tables, no derivative entries, no simulated values.
- **Method Selector verification:**
  - Osculating card retains the `Deferred` badge in the top-right
    corner.
  - The `deferredNote` line still renders below the description:
    "Backend currently returns a method-level error; see Methods
    tab for details."
- **Network for pass A only:** `GET /health` (multiple),
  `POST /api/interpolate` (reqid 374, 200). No other paths.

## Pass B — osculating alongside `hermite_divided_difference`

- **Screenshot:** `phase2-osculating-01-with-sibling.png`
  (full-page) showing both Method tabs (`Osculating` + 
  `Hermite_divided_difference`) under Method Details, with the
  Osculating panel selected so the deferred state is visible.
- **Method Selector state:** `osculating` (Deferred badge intact)
  and `hermite_divided_difference` both checked.
- **Request body** (verbatim, from DevTools Network panel reqid 377):
  ```json
  {
    "mode": "points",
    "methods": ["osculating", "hermite_divided_difference"],
    "precision": 50,
    "exact": false,
    "evaluation_x": ["1.5"],
    "graph": false,
    "points": [["1.3","0.6200860"],["1.6","0.4554022"],["1.9","0.2818186"]],
    "derivatives": [
      {"x":"1.3","order":1,"value":"-0.52202324741466"},
      {"x":"1.6","order":1,"value":"-0.56989593526168"},
      {"x":"1.9","order":1,"value":"-0.581157072713434"}
    ]
  }
  ```
- **Backend response highlights (HTTP 200):**
  - Top-level `status: "partial"`.
  - `methods.osculating.status: "error"`,
    `error.code: "method_not_implemented"` (same as Pass A).
  - `methods.hermite_divided_difference.status: "ok"`,
    `error: null`, `warnings: []`.
  - `methods.hermite_divided_difference.repeated_nodes`: 6 entries
    (each of the 3 nodes repeated twice with `first_derivative`).
  - `methods.hermite_divided_difference.divided_difference_table`:
    6×6 lower-triangular table of strings (with `null` cells for
    the upper-right padding).
  - `methods.hermite_divided_difference.coefficients`: 6 strings
    (the first column of the divided-difference table).
  - `methods.hermite_divided_difference.nested_form`: full Newton
    nested form string.
  - `methods.hermite_divided_difference.expanded`: full expanded
    polynomial string.
  - `methods.hermite_divided_difference.evaluations`:
    `[{"x":"1.5","value":"0.51182770391146169876543209876543209876543209876543"}]`.
  - `polynomial.hermite_form`, `polynomial.latex_hermite`, and
    `polynomial.expanded` are populated by the
    `hermite_divided_difference` result (drives the PolynomialCard
    Hermite tab).
  - Top-level `evaluations[0].best_method:
    "hermite_divided_difference"` and
    `method_values: { osculating: null,
    hermite_divided_difference: "0.51182770391146..." }`.
- **Sibling renderer status:** **PASS — full happy-path render.**
  Confirmed in the DOM snapshot:
  - `Hermite_divided_difference` tab is reachable from Method
    Details and selectable while the `Osculating` tab is also
    present.
  - The Hermite Divided Difference panel renders all sections per
    `HermiteDetails.tsx`:
    - `REPEATED NODES` table with all 6 entries (index,
      source_node_index, x, y, f'(x)).
    - `DIVIDED-DIFFERENCE TABLE` rendered as a 6-row lower
      triangular block with `·` placeholders for empty upper-right
      cells.
    - `COEFFICIENTS` block listing c₀…c₅ with values.
    - `NEWTON NESTED FORM` string.
    - `EXPANDED` form (truncated display) and `EXPANDED (LATEX)`
      with the full-precision string.
    - `CONSTRUCTION STEPS` ordered list (4 lecture steps).
  - The `Osculating` tab still renders the deferred panel cleanly
    (the same `Deferred` badge + `method_not_implemented`
    ErrorNotice + lecture-aware copy as Pass A).
  - No layout breakage between the two tabs; the Methods tab bar
    contains both labels and switching between them is responsive.
- **Network for pass B:** `GET /health`, `POST /api/interpolate`
  (reqid 377, 200). No other paths.

## Allowed network URL set (across both passes)

Collected from `performance.getEntriesByType('resource')` plus the
DevTools Network panel. Backend paths called during this run:

- `GET http://localhost:5173/health` (multiple; proxied to backend
  by Vite per `frontend/vite.config.ts`).
- `POST http://localhost:5173/api/interpolate` (reqid 374 for
  Pass A, reqid 377 for Pass B; both HTTP 200).

`POST /api/validate-function` was not hit because no function
expression was edited in either pass (the example is points-mode
with seeded derivatives). R1.2 only forbids paths outside
`{ /health, /api/interpolate, /api/validate-function }`; it does
not require all three to be hit. No other backend paths were
called. R1.2 satisfied.

## Console

No console errors or warnings from the application during either
pass.

## Deviations

None. The scenario was driven through the UI as designed:

- The Examples Panel "Deferred — Osculating (Bessel-style)" entry
  is enabled per locked decision #4 and seeds the form with the
  Bessel-style points + derivatives.
- The Method Selector keeps `osculating` visible with the `Deferred`
  badge per locked decision #3.
- Pass B exercises the sibling-renderer requirement (R10.4) by
  selecting `hermite_divided_difference` alongside `osculating`
  through the Method Selector and observing the Method Details
  rendering both tabs.
