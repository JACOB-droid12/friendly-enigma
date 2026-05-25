# Phase 2 Browser QA — V1 / V1+ regression scenarios (task 7.9)

Spec: `.kiro/specs/phase-2-frontend-workbench` · design.md §13.
Backend: `http://127.0.0.1:8000` (uvicorn, terminalId 4).
Frontend: `http://localhost:5173` (Vite dev, terminalId 3).
Browser: Chrome (DevTools MCP) at 1440×900.
Date: 2026-05-25.

These four scenarios prove that adding the Phase 2 method-aware UI did
not regress any V1 / V1+ behavior. Each scenario was driven through
the running stack via the in-page Examples Panel, computed against
the live backend, and verified at the DOM, network, and JSON levels.

No backend files were modified. No `docs/API_CONTRACT.md` edits.
No new endpoint paths.

## Result summary

| Scenario | Pass / Fail | Screenshot |
|---|---|---|
| PHASE2-V1-01 — V1 Linear Lagrange regression | **PASS** | `phase2-v1-01-linear-lagrange.png` |
| PHASE2-V1-02 — V1+ `1/x` regression (function-backed) | **PASS** | `phase2-v1-02-one-over-x.png` |
| PHASE2-V1-03 — V1+ Neville Table regression | **PASS** | `phase2-v1-03-neville.png` |
| PHASE2-V1-04 — V1+ Newton Divided Difference regression | **PASS** | `phase2-v1-04-newton-dd.png` |

Allowed network URL set across all four scenarios: `GET /health`,
`POST /api/interpolate`, `POST /api/validate-function`. No other
backend paths were called. R1.2 satisfied.

## PHASE2-V1-01 — V1 Linear Lagrange regression

- **Pass / Fail:** **PASS.**
- **Screenshot:** `phase2-v1-01-linear-lagrange.png` (full-page).
  Captured on the Methods → Lagrange panel after Compute, showing the
  basis polynomials, summation form, and construction steps; the
  Polynomial card was inspected separately for Expanded/Lagrange.
- **Driven by:** Examples Panel → "Linear Lagrange" → Compute.
- **Inputs:**
  - mode: `points`, points: `[["2","4"], ["5","1"]]`
  - methods: `["lagrange"]`
  - precision: 50, exact: `true`, evaluation_x: `["3"]`, graph: `false`
- **Request body** (verbatim, `POST /api/interpolate` reqid 499,
  HTTP 200):
  ```json
  {
    "mode": "points",
    "methods": ["lagrange"],
    "precision": 50,
    "exact": true,
    "evaluation_x": ["3"],
    "graph": false,
    "points": [["2","4"], ["5","1"]]
  }
  ```
- **Backend response highlights:** top-level `status: "ok"`,
  `degree: 1`, `polynomial.expanded: "6 - x"`,
  `polynomial.lagrange_form: "20/3 - 4*x/3 + x/3 - 2/3"`,
  `polynomial.latex_lagrange: "6 - x"`,
  `methods.lagrange.status: "ok"`,
  `methods.lagrange.basis_polynomials` with two entries
  (`(5/3 - x/3)`, `(x/3 - 2/3)`),
  `methods.lagrange.evaluations: [{"x":"3", "value":"3"}]`,
  `methods.lagrange.steps` with the three lecture steps,
  `methods.lagrange.warnings: []`, `error: null`.
- **DOM fields confirmed:**
  - **Lagrange basis polynomials.** Methods → Lagrange tab renders
    `L₀ = 5/3 - x/3` and `L₁ = x/3 - 2/3` under the BASIS POLYNOMIALS
    section.
  - **Summation form.** The SUMMATION FORM section renders
    `20/3 - 4*x/3 + x/3 - 2/3`.
  - **Expanded form.** Polynomial → Expanded tab renders `6 - x`.
  - **LaTeX.** The Polynomial card surfaces `latex_expanded` (`6 - x`)
    via the KaTeX-rendered formula container; the Lagrange sub-tab
    surfaces `latex_lagrange` similarly.
  - **Steps.** Methods → Lagrange tab renders the three CONSTRUCTION
    STEPS lines verbatim from `methods.lagrange.steps`.
  - **Overview.** SummaryCard renders DEGREE 1, NODES 2, COMPUTE
    PRECISION 50, MODE EXACT, CONSTRUCTION → Lagrange.
- **Network URL set observed:** `GET /health` (multiple),
  `POST /api/interpolate` (reqid 499). No other paths.
- **Console:** no errors.
- **Deviations:** none.

## PHASE2-V1-02 — V1+ `1/x` regression (function-backed)

- **Pass / Fail:** **PASS.**
- **Screenshot:** `phase2-v1-02-one-over-x.png` (full-page).
  Captured on the Methods → Lagrange panel after Compute.
- **Driven by:** Examples Panel → "Second-Degree Lagrange" (the
  `f(x) = 1/x at 2, 2.75, 4` lecture entry) → Compute.
- **Inputs:**
  - mode: `x_values_with_function`, x_values: `["2","2.75","4"]`,
    function: `1/x`
  - methods: `["lagrange"]`
  - precision: 50, exact: `true`, evaluation_x: `["3"]`, graph:
    `false`
- **Request body** (verbatim, `POST /api/interpolate` reqid 507,
  HTTP 200):
  ```json
  {
    "mode": "x_values_with_function",
    "methods": ["lagrange"],
    "precision": 50,
    "exact": true,
    "evaluation_x": ["3"],
    "graph": false,
    "x_values": ["2", "2.75", "4"],
    "function": "1/x"
  }
  ```
- **Function validation:** the debounced `POST /api/validate-function`
  (reqid 506) returned the normalized expression and the inline
  "Valid: 1/x" success line rendered above the function field; this
  exercises the V1 function-mode validation pathway end-to-end.
- **Backend response highlights:** `status: "ok"`, `degree: 2`,
  `nodes` with backend-computed exact rationals
  `[{"x":"2","y":"1/2"},{"x":"2.75","y":"4/11"},{"x":"4","y":"1/4"}]`
  (function evaluation owned by the backend per AGENTS.md),
  `polynomial.expanded: "x**2/22 - 35*x/88 + 49/44"`,
  `polynomial.factored: "(4*x**2 - 35*x + 98)/88"`,
  `polynomial.lagrange_form` with three weighted basis polynomials,
  `polynomial.latex_expanded: "\\frac{x^{2}}{22} - \\frac{35 x}{88} +
  \\frac{49}{44}"`,
  `methods.lagrange.evaluations: [{"x":"3","value":"29/88"}]`,
  top-level `evaluations[0].f_x: "1/3"`,
  `evaluations[0].absolute_error: "1/264"`.
- **DOM fields confirmed:**
  - **Function-mode workflow.** The X + f(x) tab is selected, the
    function field carries `1/x`, the inline "Valid: 1/x" success
    line is shown, and the three x-values render as 2, 2.75, 4.
  - **Standard polynomial output.** Polynomial → Expanded tab renders
    `x**2/22 - 35*x/88 + 49/44`. Polynomial → Factored tab is
    available and the Lagrange sub-tab also renders the summation
    form.
  - **Methods → Lagrange tab.** Renders the three Lagrange basis
    polynomials (one per node), the SUMMATION FORM string, and the
    three CONSTRUCTION STEPS.
  - **Evaluations table.** Renders x = 3, Best P(x) = `29/88`, Method
    = lagrange, f(x) = `1/3`, |Error| = `1/264` (verified through
    direct DOM read).
  - **Nodes table.** Renders 2 → 1/2, 2.75 → 4/11, 4 → 1/4 — the
    backend's exact rational evaluation of f(x) per node.
  - **Overview.** SummaryCard renders DEGREE 2, NODES 3, COMPUTE
    PRECISION 50, MODE EXACT, CONSTRUCTION → Lagrange.
- **Network URL set observed:** `GET /health` (multiple),
  `POST /api/validate-function` (reqid 506),
  `POST /api/interpolate` (reqid 507). No other paths.
- **Console:** no errors.
- **Deviations:** none.

## PHASE2-V1-03 — V1+ Neville Table regression

- **Pass / Fail:** **PASS.**
- **Screenshot:** `phase2-v1-03-neville.png` (full-page).
  Captured on the Methods → Neville panel after Compute, showing the
  Target Results line and the full triangular `Neville Table for x =
  1.5`.
- **Driven by:** Examples Panel → "Neville Table" → Compute.
- **Inputs:**
  - mode: `points`, points: `[["1.0","0.7651977"],
    ["1.3","0.6200860"], ["1.6","0.4554022"], ["1.9","0.2818186"],
    ["2.2","0.1103623"]]`
  - methods: `["neville", "lagrange", "newton"]` (per design.md §13
    row PHASE2-V1-03)
  - precision: 50, exact: `false`, evaluation_x: `["1.5"]`, graph:
    `false`
- **Request body** (verbatim, `POST /api/interpolate` reqid 511,
  HTTP 200):
  ```json
  {
    "mode": "points",
    "methods": ["neville", "lagrange", "newton"],
    "precision": 50,
    "exact": false,
    "evaluation_x": ["1.5"],
    "graph": false,
    "points": [
      ["1.0", "0.7651977"],
      ["1.3", "0.6200860"],
      ["1.6", "0.4554022"],
      ["1.9", "0.2818186"],
      ["2.2", "0.1103623"]
    ]
  }
  ```
- **Backend response highlights:** `status: "ok"`, all three methods
  succeed (`methods.neville.status: "ok"`,
  `methods.lagrange.status: "ok"`, `methods.newton.status: "ok"`),
  `methods.neville.target_results[0]:
  {"x":"1.5","value":"0.51181999423868312757201646090534979423868312757202"}`,
  `methods.neville.tables[0].rows` is the full 5-row lower-triangular
  table with `null` upper-right padding,
  `polynomial.expanded`, `polynomial.lagrange_form`, and
  `polynomial.newton_form` all present.
- **DOM fields confirmed:**
  - **Triangular table for Neville's method (target-specific).**
    Methods → Neville panel renders the heading
    `Neville Table for x = 1.5` and the full lower-triangular table:
    column headers `P0 P1 P2 P3 P4` and rows starting with the
    y-values `0.7651977`, `0.620086`, `0.4554022`, `0.2818186`,
    `0.1103623`. The single converged value `P(1.5) =
    0.511819994239` renders under TARGET RESULTS.
  - **Cross-method panel.** All three method tabs (`neville`,
    `lagrange`, `newton`) appear in the Method Details tab bar in the
    documented order, and switching between them does not break
    layout. Sibling renderers (Lagrange basis polynomials, Newton
    divided-difference table) render alongside the Neville table.
  - **Overview.** SummaryCard renders DEGREE 4, NODES 5, COMPUTE
    PRECISION 50, MODE NUMERIC, CONSTRUCTION → Lagrange + Newton,
    TARGET-SPECIFIC → Neville (family grouping per R11.3, preserved).
- **Network URL set observed:** `GET /health` (multiple),
  `POST /api/interpolate` (reqid 511). No other paths.
- **Console:** no errors.
- **Deviations:** none.

## PHASE2-V1-04 — V1+ Newton Divided Difference regression

- **Pass / Fail:** **PASS.**
- **Screenshot:** `phase2-v1-04-newton-dd.png` (full-page).
  Captured on the Methods → Newton panel after Compute, showing the
  Coefficients block, Divided-Difference Table, Newton Nested Form,
  and Construction Steps.
- **Driven by:** Examples Panel → "Newton Divided Difference" →
  Compute.
- **Inputs:**
  - mode: `points`, points: `[["1.0","0.7651977"],
    ["1.3","0.6200860"], ["1.6","0.4554022"], ["1.9","0.2818186"],
    ["2.2","0.1103623"]]`
  - methods: `["newton"]`
  - precision: 50, exact: `false`, evaluation_x: `["1.5"]`, graph:
    `false`
- **Request body** (verbatim, `POST /api/interpolate` reqid 514,
  HTTP 200):
  ```json
  {
    "mode": "points",
    "methods": ["newton"],
    "precision": 50,
    "exact": false,
    "evaluation_x": ["1.5"],
    "graph": false,
    "points": [
      ["1.0", "0.7651977"],
      ["1.3", "0.6200860"],
      ["1.6", "0.4554022"],
      ["1.9", "0.2818186"],
      ["2.2", "0.1103623"]
    ]
  }
  ```
- **Backend response highlights:** `status: "ok"`, `degree: 4`,
  `methods.newton.status: "ok"`,
  `methods.newton.divided_difference_table` is the populated 5-row
  lower-triangular table (with `null` cells for the upper-right
  padding),
  `methods.newton.coefficients`: `["0.7651977",
  "-0.48370566666666666666666666666666666666666666666667",
  "-0.10873388888888888888888888888888888888888888888889",
  "0.065878395061728395061728395061728395061728395061719",
  "0.0018251028806584362139917695473251028806584362140217"]`,
  `methods.newton.nested_form` and `methods.newton.expanded` both
  populated, `methods.newton.evaluations:
  [{"x":"1.5","value":"0.51181999423868312757201646090534979423868312757202"}]`,
  `polynomial.latex_newton` and `polynomial.latex_expanded` both
  populated.
- **DOM fields confirmed:**
  - **Divided-difference table.** Methods → Newton panel renders the
    `Divided-Difference Table` heading and the full 5-row lower-
    triangular table (columns `f[xi] Δ1 Δ2 Δ3 Δ4`).
  - **Coefficients.** The Coefficients block lists `c0 = 0.7651977`
    through `c4 = 0.00182510288066` (display-truncated; backend
    strings are full-precision, displayed via the digit ladder).
  - **Newton nested form.** The Newton Nested Form block renders the
    full nested-product expression starting `-0.483705666667*x + ...
    + 1.24890336667`.
  - **Expanded form.** Polynomial → Expanded tab renders
    `0.001825...*x**4 + 0.055293...*x**3 - 0.343047...*x**2 +
    0.073391...*x + 0.977735...` (display digits 12).
  - **LaTeX.** Polynomial → Newton sub-tab and Polynomial → Expanded
    sub-tab surface the KaTeX rendering of `latex_newton` and
    `latex_expanded` from the response.
  - **Steps.** Methods → Newton renders the three CONSTRUCTION STEPS:
    "Place y-values in the first divided-difference column.",
    "Compute each higher-order divided difference from neighboring
    lower-order values.", "Use the first row as coefficients in
    Newton form."
  - **Overview.** SummaryCard renders DEGREE 4, NODES 5, COMPUTE
    PRECISION 50, MODE NUMERIC, CONSTRUCTION → Newton.
- **Network URL set observed:** `GET /health` (multiple),
  `POST /api/interpolate` (reqid 514). No other paths.
- **Console:** no errors.
- **Deviations:** none.

## Allowed network URL set (across all four scenarios)

Collected from the DevTools Network panel for the duration of this
QA run. Backend paths called:

- `GET http://localhost:5173/health` (proxied to backend by Vite per
  `frontend/vite.config.ts`).
- `POST http://localhost:5173/api/validate-function` (reqid 506,
  triggered once during V1-02 by the function-field debounce).
- `POST http://localhost:5173/api/interpolate` (reqids 499, 507, 511,
  514 for V1-01, V1-02, V1-03, V1-04 respectively; all HTTP 200).

R1.2 only allows `{ /health, /api/interpolate, /api/validate-function
}` and explicitly forbids any other backend paths. The set above is
strictly a subset of the allowlist. R1.2 satisfied.

## Console

No console errors or warnings from the application across all four
scenarios.

## Deviations

None. The four scenarios match `design.md` §13 PHASE2-V1-01..04
exactly, were driven through the in-app Examples Panel for the
corresponding lecture entries, and the resulting DOM, network, and
JSON state match the documented expectations. The Phase 2 method-aware
UI did not regress any V1 / V1+ behavior.
