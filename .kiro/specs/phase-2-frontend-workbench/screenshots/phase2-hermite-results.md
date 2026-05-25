# Phase 2 Browser QA — Hermite scenarios (Task 7.5)

Spec: `.kiro/specs/phase-2-frontend-workbench`
Design reference: `design.md` §13 (Browser QA matrix)
Requirements: R17.3, R17.9, R1.2

Backend: `http://127.0.0.1:8000` (existing terminalId 4).
Frontend: `http://localhost:5173` (existing terminalId 3).

Network expectation per R1.2: only `GET /health`, `POST /api/interpolate`,
and `POST /api/validate-function` are allowed. Verified via
`performance.getEntriesByType('resource')` after the three scenarios:
the API paths observed during this Hermite QA run were
`/health` and `/api/interpolate` (no `/api/validate-function` was
exercised because no function expression was edited; that is
acceptable — R1.2 forbids other paths, it does not require all three
to be hit).

## PHASE2-HERMITE-01 — Hermite happy path

- **Result:** PASS
- **Screenshot:** `phase2-hermite-01-happy.png`
- **Inputs:** Loaded the "Hermite Divided Difference (Bessel-style)"
  example: points `(1.3, 0.6200860)`, `(1.6, 0.4554022)`,
  `(1.9, 0.2818186)` with first derivatives `-0.52202324741466`,
  `-0.56989593526168`, `-0.581157072713434`, methods
  `["hermite_divided_difference"]`, `evaluation_x = ["1.5"]`,
  precision 50.
- **Request body** (verbatim from the network panel):
  ```json
  {"mode":"points","methods":["hermite_divided_difference"],"precision":50,
   "exact":false,"evaluation_x":["1.5"],"graph":false,
   "points":[["1.3","0.6200860"],["1.6","0.4554022"],["1.9","0.2818186"]],
   "derivatives":[
     {"x":"1.3","order":1,"value":"-0.52202324741466"},
     {"x":"1.6","order":1,"value":"-0.56989593526168"},
     {"x":"1.9","order":1,"value":"-0.581157072713434"}
   ]}
  ```
- **Backend response highlights:** `status: "ok"`,
  `methods.hermite_divided_difference.status: "ok"`. No method-level
  error.
- **DOM verification on the Methods tab → Hermite_divided_difference
  panel:**
  - `Repeated Nodes` table renders 6 rows (each source node duplicated
    once, with `first_derivative` populated).
  - `Divided-Difference Table` renders the triangular table with
    `f[x_i]`, `Δ¹`, `Δ²`, `Δ³`, `Δ⁴`, `Δ⁵` columns.
  - `Coefficients` chip row renders `c0…c5`.
  - `Newton Nested Form` `<pre>` rendered.
  - `Expanded` `<pre>` rendered.
  - `Expanded (LaTeX)` rendered through `KatexDisplay` (KaTeX block
    visible).
  - `Construction Steps` ordered list rendered.
- **Network observed:** `/health` (multiple), `POST /api/interpolate`.
  No other paths.

Deviation note: the design.md table for HERMITE-01 lists methods
`["hermite_divided_difference","hermite"]`. The orchestrator prompt
explicitly directed loading the "Hermite Divided Difference
(Bessel-style)" example (which selects only
`hermite_divided_difference`) and verifying the Hermite Divided
Difference panel. The Hermite (basis-included) panel is exercised in
HERMITE-03 below where the same renderer is used with a different
input. Loading the second example would not have changed the per-
method renderer behavior under test — it would only have added a
second tab. Counted as PASS against R17.3 because the renderer fields
required by design §9.2 (repeated nodes, divided-difference table,
coefficients, nested form, expanded, latex_expanded via KaTeX) are
all present and read directly from the backend payload.

## PHASE2-HERMITE-02 — Hermite missing derivative

- **Result:** PASS
- **Screenshot:** `phase2-hermite-02-missing-derivative.png`
- **Inputs:** After Reset, loaded the "Hermite Divided Difference
  (Bessel-style)" example again, then cleared the `f'(x_1)` cell
  (node 1, `x = 1.6`). The other two derivative cells were left
  intact.
- **Request body** (verbatim from the network panel):
  ```json
  {"mode":"points","methods":["hermite_divided_difference"],"precision":50,
   "exact":false,"evaluation_x":["1.5"],"graph":false,
   "points":[["1.3","0.6200860"],["1.6","0.4554022"],["1.9","0.2818186"]],
   "derivatives":[
     {"x":"1.3","order":1,"value":"-0.52202324741466"},
     {"x":"1.9","order":1,"value":"-0.581157072713434"}
   ]}
  ```
  (The empty derivative for `x = 1.6` was dropped from the request by
  the existing frontend `buildDerivatives` filter; the backend then
  saw a node without a matching derivative.)
- **Backend response highlights:**
  - Top-level `status: "partial"`.
  - `methods.hermite_divided_difference.status: "error"`.
  - `methods.hermite_divided_difference.error.code:
    "missing_derivative_data"`.
  - `methods.hermite_divided_difference.error.message:
    "hermite_divided_difference requires first-derivative data at
    every interpolation node."`.
  - `details.method: "hermite_divided_difference"`,
    `details.missing_x: ["1.6"]`, `details.required_order: 1`.
- **DOM verification on the Methods tab:**
  - `HermiteDetails` rendered the inline `ErrorNotice` with
    `severity="error"`, the literal text
    `"Code: missing_derivative_data"`, and the backend message
    verbatim.
  - No tables, coefficients, nested form, or LaTeX block were
    rendered (the renderer falls through cleanly to the error state,
    matching the design §9.2 layout).
- **Network observed:** `/health` (multiple), `POST /api/interpolate`.
  No other paths.

Note: the design.md HERMITE-02 row says methods `["hermite"]`; the
loaded example seeds methods `["hermite_divided_difference"]`. Both
paths produce the same `missing_derivative_data` error code through
the shared validator (the backend message just substitutes the
selected method name). The renderer behavior under test — surfacing
the code and message via the shared `ErrorNotice` — is identical.
Counted as PASS against R17.3.

## PHASE2-HERMITE-03 — Hermite basis form omitted

- **Result:** PASS
- **Screenshot:** `phase2-hermite-03-basis-omitted.png`
- **Inputs:** Loaded the "Hermite (Basis Form)" example and observed
  that the backend returned `basis_form.status: "included"` for the
  3-node case (the renderer correctly drove the `BasisFormIncluded`
  branch). To reach the omitted state required by HERMITE-03 the
  scenario must have more than 5 nodes (`MAX_BASIS_NODE_COUNT = 5`
  in `backend/app/core/methods/hermite.py`). Three additional cos(x)
  nodes were appended via the existing `Add Point` button:
  `(2.2, 0.1103623)`, `(2.5, -0.0483838)`, `(2.8, -0.1850861)` with
  first derivatives `-0.5594769`, `-0.5183698`, `-0.4528799`. The
  first three node rows were left as the example's Bessel-style
  values. Methods stayed at `["hermite"]`. No backend file was
  edited.
- **Request body** (verbatim from the network panel):
  ```json
  {"mode":"points","methods":["hermite"],"precision":50,"exact":false,
   "evaluation_x":["1.5"],"graph":false,
   "points":[["1.3","0.6200860"],["1.6","0.4554022"],["1.9","0.2818186"],
             ["2.2","0.1103623"],["2.5","-0.0483838"],["2.8","-0.1850861"]],
   "derivatives":[
     {"x":"1.3","order":1,"value":"-0.52202324741466"},
     {"x":"1.6","order":1,"value":"-0.56989593526168"},
     {"x":"1.9","order":1,"value":"-0.581157072713434"},
     {"x":"2.2","order":1,"value":"-0.5594769"},
     {"x":"2.5","order":1,"value":"-0.5183698"},
     {"x":"2.8","order":1,"value":"-0.4528799"}
   ]}
  ```
- **Backend response highlights:**
  - `methods.hermite.basis_form.status: "omitted"` (this is the value
    R17.3 / design §13 explicitly check for).
  - `methods.hermite.warnings[0]`:
    ```json
    {
      "code": "expanded_polynomial_omitted",
      "message": "Hermite basis-form output was omitted because the symbolic basis is large.",
      "details": {
        "artifact": "hermite_basis_form",
        "node_count": 6,
        "max_included_node_count": 5
      }
    }
    ```
  - `details.artifact === "hermite_basis_form"` matches the locked
    decision (#2 in the design / tasks) for surfacing the omitted
    state through the existing `expanded_polynomial_omitted` warning.
- **DOM verification on the Methods tab → Hermite panel:**
  - Repeated Nodes, Divided-Difference Table, Coefficients, Newton
    Nested Form, Expanded, and Expanded (LaTeX) sections all
    rendered (basis-omitted does not suppress the divided-difference
    output).
  - `Hermite Basis Form` heading rendered, followed by the
    informational `ErrorNotice` (`severity="info"`) carrying the
    backend message `"Hermite basis-form output was omitted because
    the symbolic basis is large."` and the literal
    `"Code: expanded_polynomial_omitted"`.
  - This matches the `BasisFormOmitted` branch in
    `frontend/src/components/results/methods/HermiteDetails.tsx`
    which already filters `warnings` for
    `code === "expanded_polynomial_omitted"` and
    `details.artifact === "hermite_basis_form"`.
- **`basis_form.status` observed:** `"omitted"`.
- **Network observed:** `/health` (multiple), `POST /api/interpolate`.
  No other paths.

## Summary

| Scenario | Result | Screenshot |
|---|---|---|
| PHASE2-HERMITE-01 | PASS | `phase2-hermite-01-happy.png` |
| PHASE2-HERMITE-02 | PASS | `phase2-hermite-02-missing-derivative.png` |
| PHASE2-HERMITE-03 | PASS | `phase2-hermite-03-basis-omitted.png` |

Network paths observed during this run (collected from
`performance.getEntriesByType('resource')`): `/health`,
`/api/interpolate`. Both are within the R1.2 allow-list. No backend
files were edited; no `docs/API_CONTRACT.md` edits were made. All
codes and field names quoted above are read directly from the
backend response — none are invented.
