# Hermite Polynomial Crash Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the Hermite Polynomial tab crash by restoring the backend string-only top-level polynomial contract and adding a React guard for malformed form payloads.

**Architecture:** The backend keeps rich Hermite basis details under `methods.hermite.basis_form` and emits only strings or `null` in `polynomial.*_form`. The frontend treats unexpected non-string top-level polynomial fields as absent before display-digit formatting, preventing malformed payloads from reaching string-only formatters.

**Tech Stack:** Python 3.12 / FastAPI / pytest / ruff, React 19 / TypeScript / Vitest / Testing Library / Vite.

---

## File Structure

- Modify `backend/app/tests/test_api.py`: strengthen the Hermite API contract regression so `polynomial.hermite_form` must be a string equal to `methods.hermite.nested_form`.
- Modify `backend/app/core/service.py`: change `_polynomial_block()` to select Hermite `nested_form` for the top-level `polynomial.hermite_form`.
- Modify `frontend/src/components/results/results.smoke.test.tsx`: add normal and malformed Hermite PolynomialCard regressions.
- Modify `frontend/src/components/results/PolynomialCard.tsx`: add a local string-only normalizer and use normalized values for formatting, tab visibility, and copy payloads.
- Modify `docs/HANDOFF.md`: record blocker analysis, files changed, commands run, results, risks, and next steps.
- Modify `docs/PLAN.md`: record the completed blocker fix after validation.
- Modify `docs/API_CONTRACT.md`: clarify top-level polynomial form fields are string-or-null only.
- Modify `docs/FRONTEND_HANDOFF.md`: document the corrected backend contract and frontend malformed-payload guard.

---

### Task 1: Backend Contract Regression

**Files:**
- Modify: `backend/app/tests/test_api.py`

- [ ] **Step 1: Write the failing API assertion**

In `backend/app/tests/test_api.py`, inside `test_interpolate_hermite_methods_contract`, replace:

```python
    assert body["polynomial"]["hermite_form"]
```

with:

```python
    hermite_form = body["polynomial"]["hermite_form"]
    assert isinstance(hermite_form, str)
    assert hermite_form == body["methods"]["hermite"]["nested_form"]
    assert isinstance(body["methods"]["hermite"]["basis_form"], dict)
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run from `backend/`:

```powershell
.\.venv\Scripts\python.exe -m pytest app/tests/test_api.py::test_interpolate_hermite_methods_contract -q
```

Expected result before the backend fix:

```text
FAILED app/tests/test_api.py::test_interpolate_hermite_methods_contract
E       AssertionError: assert False
E        +  where False = isinstance(<dict value>, str)
```

- [ ] **Step 3: Commit is not required yet**

Keep the failing test uncommitted until Task 2 makes it pass.

---

### Task 2: Backend Contract Fix

**Files:**
- Modify: `backend/app/core/service.py`
- Test: `backend/app/tests/test_api.py`

- [ ] **Step 1: Update `_polynomial_block()` to compute a string Hermite form**

In `backend/app/core/service.py`, replace `_polynomial_block()` with:

```python
def _polynomial_block(
    raw_results: dict[str, dict[str, Any]],
    polynomial_source: dict[str, Any] | None,
) -> dict[str, Any]:
    polynomial = polynomial_source.get("polynomial") if polynomial_source else None
    hermite_result = raw_results.get("hermite", {})
    hermite_dd_result = raw_results.get("hermite_divided_difference", {})
    hermite_form = hermite_result.get("nested_form") or hermite_dd_result.get("nested_form")
    return {
        "expanded": polynomial_source.get("expanded") if polynomial_source else None,
        "factored": str(sp.factor(polynomial)) if polynomial is not None else None,
        "lagrange_form": raw_results.get("lagrange", {}).get("summation_form"),
        "newton_form": raw_results.get("newton", {}).get("nested_form"),
        "osculating_form": raw_results.get("osculating", {}).get("nested_form"),
        "hermite_form": hermite_form,
        "taylor_form": raw_results.get("taylor", {}).get("taylor_form"),
        "latex_expanded": polynomial_source.get("latex_expanded") if polynomial_source else None,
        "latex_lagrange": raw_results.get("lagrange", {}).get("latex_lagrange"),
        "latex_newton": raw_results.get("newton", {}).get("latex_newton"),
        "latex_osculating": raw_results.get("osculating", {}).get("latex_osculating"),
        "latex_hermite": raw_results.get("hermite", {}).get("latex_hermite")
        or raw_results.get("hermite_divided_difference", {}).get("latex_hermite"),
        "latex_taylor": raw_results.get("taylor", {}).get("latex_taylor"),
        "expanded_omitted_reason": (
            "piecewise_method_no_global_polynomial"
            if polynomial_source is None
            and raw_results.get("cubic_spline", {}).get("segment_polynomials")
            else None
        ),
    }
```

- [ ] **Step 2: Run the focused API test and verify it passes**

Run from `backend/`:

```powershell
.\.venv\Scripts\python.exe -m pytest app/tests/test_api.py::test_interpolate_hermite_methods_contract -q
```

Expected result:

```text
1 passed
```

- [ ] **Step 3: Run focused backend Hermite/API coverage**

Run from `backend/`:

```powershell
.\.venv\Scripts\python.exe -m pytest app/tests/test_api.py app/tests/test_hermite.py -q
```

Expected result:

```text
passed
```

- [ ] **Step 4: Run focused backend lint**

Run from `backend/`:

```powershell
.\.venv\Scripts\python.exe -m ruff check app/core/service.py app/tests/test_api.py
```

Expected result:

```text
All checks passed!
```

- [ ] **Step 5: Commit backend fix**

Run from the repository root:

```powershell
git add backend/app/core/service.py backend/app/tests/test_api.py
git commit -m "fix: keep hermite polynomial form string-valued"
```

---

### Task 3: Frontend Crash Regression

**Files:**
- Modify: `frontend/src/components/results/results.smoke.test.tsx`

- [ ] **Step 1: Import `fireEvent` and Hermite fixture**

At the top of `frontend/src/components/results/results.smoke.test.tsx`, change the imports to:

```typescript
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { DisplayDigitsProvider } from "@/lib/display-digits"
import type { InterpolateResponse, MethodName, PolynomialData } from "@/lib/api-types"
import { EvaluationTable } from "./EvaluationTable"
import { GraphCard } from "./GraphCard"
import { MethodDetails } from "./MethodDetails"
import { PolynomialCard } from "./PolynomialCard"
import {
  hermiteResponse,
  linearPointsResponse,
  oneOverXResponse,
} from "@/test/interpolate-response.fixtures"
```

- [ ] **Step 2: Add the normal and malformed Hermite regressions**

Inside the `describe("interpolation result smoke rendering", () => { })` block, add these tests after the linear points test:

```typescript
  it("renders the Hermite polynomial tab when the top-level Hermite form is a string", () => {
    renderWithDisplay(<PolynomialCard polynomial={hermiteResponse.polynomial} />)

    fireEvent.click(screen.getByRole("tab", { name: "Hermite" }))

    expect(screen.getByLabelText("Copy Hermite form")).toBeInTheDocument()
    expect(screen.getByText(hermiteResponse.polynomial.hermite_form!)).toBeInTheDocument()
  })

  it("does not crash when a malformed response sends the Hermite basis object as the top-level form", () => {
    const malformedPolynomial = Object.assign({}, hermiteResponse.polynomial, {
      hermite_form: hermiteResponse.methods.hermite.basis_form,
    }) as unknown as PolynomialData

    renderWithDisplay(<PolynomialCard polynomial={malformedPolynomial} />)

    expect(screen.getByRole("tab", { name: "Expanded" })).toBeInTheDocument()
    expect(screen.queryByRole("tab", { name: "Hermite" })).not.toBeInTheDocument()
  })
```

- [ ] **Step 3: Run the focused frontend test and verify it fails**

Run from `frontend/`:

```powershell
npm test -- results.smoke.test.tsx
```

Expected result before the frontend guard:

```text
FAIL src/components/results/results.smoke.test.tsx
TypeError: input.replace is not a function
```

- [ ] **Step 4: Keep the failing frontend test uncommitted**

Keep the failing test uncommitted until Task 4 makes it pass.

---

### Task 4: Frontend Guard Fix

**Files:**
- Modify: `frontend/src/components/results/PolynomialCard.tsx`
- Test: `frontend/src/components/results/results.smoke.test.tsx`

- [ ] **Step 1: Add a string-only normalizer**

In `frontend/src/components/results/PolynomialCard.tsx`, add this helper after `interface PolynomialCardProps`:

```typescript
function stringForm(value: unknown): string | null {
  return typeof value === "string" ? value : null
}
```

- [ ] **Step 2: Normalize top-level polynomial fields before formatting**

Inside `PolynomialCard`, immediately after the `useDisplayDigits()` call, add:

```typescript
  const expanded = stringForm(polynomial.expanded)
  const factored = stringForm(polynomial.factored)
  const lagrangeForm = stringForm(polynomial.lagrange_form)
  const newtonForm = stringForm(polynomial.newton_form)
  const hermiteForm = stringForm(polynomial.hermite_form)
  const taylorForm = stringForm(polynomial.taylor_form)
  const expandedLatexForm = stringForm(polynomial.latex_expanded)
  const lagrangeLatexForm = stringForm(polynomial.latex_lagrange)
  const newtonLatexForm = stringForm(polynomial.latex_newton)
  const hermiteLatexForm = stringForm(polynomial.latex_hermite)
  const taylorLatexForm = stringForm(polynomial.latex_taylor)
  const expandedOmittedReason = stringForm(polynomial.expanded_omitted_reason)
```

- [ ] **Step 3: Use normalized fields in the formatter calls**

Replace the existing formatter block with:

```typescript
  const expandedFormatted = formatPoly(expanded)
  const factoredText = formatLiterals(factored)
  const lagrangeText = formatLiterals(lagrangeForm)
  const newtonText = formatLiterals(newtonForm)
  const hermiteText = formatLiterals(hermiteForm)
  const taylorText = formatLiterals(taylorForm)
  const expandedLatex = formatLatex(expandedLatexForm)
  const lagrangeLatex = formatLatex(lagrangeLatexForm)
  const newtonLatex = formatLatex(newtonLatexForm)
  const hermiteLatex = formatLatex(hermiteLatexForm)
  const taylorLatex = formatLatex(taylorLatexForm)
```

- [ ] **Step 4: Use normalized fields for tab visibility and omission reason**

Replace:

```typescript
  const showHermite = polynomial.hermite_form != null
  const showTaylor = polynomial.taylor_form != null
```

with:

```typescript
  const showHermite = hermiteForm != null
  const showTaylor = taylorForm != null
```

Replace:

```typescript
  const isPiecewiseNoGlobal =
    polynomial.expanded_omitted_reason === "piecewise_method_no_global_polynomial"
```

with:

```typescript
  const isPiecewiseNoGlobal =
    expandedOmittedReason === "piecewise_method_no_global_polynomial"
```

Replace:

```typescript
    polynomial.expanded_omitted_reason && !isPiecewiseNoGlobal
      ? resolveBackendCodePayload(polynomial.expanded_omitted_reason, null)
```

with:

```typescript
    expandedOmittedReason && !isPiecewiseNoGlobal
      ? resolveBackendCodePayload(expandedOmittedReason, null)
```

- [ ] **Step 5: Use normalized fields in copy controls**

In the JSX, replace all `polynomial.<field>` references used as `text` fallback or `fullPrecisionText` with the normalized variables:

```typescript
fullPrecisionText={expanded}
fullPrecisionText={factored}
text={factoredText || factored}
fullPrecisionText={lagrangeForm}
text={lagrangeText || lagrangeForm}
fullPrecisionText={newtonForm}
text={newtonText || newtonForm}
fullPrecisionText={hermiteForm}
text={hermiteText || hermiteForm}
fullPrecisionText={taylorForm}
text={taylorText || taylorForm}
```

Keep the surrounding labels and tab structure unchanged.

- [ ] **Step 6: Run the focused frontend smoke test**

Run from `frontend/`:

```powershell
npm test -- results.smoke.test.tsx
```

Expected result:

```text
PASS src/components/results/results.smoke.test.tsx
```

- [ ] **Step 7: Run frontend lint and build**

Run from `frontend/`:

```powershell
npm run lint
npm run build
```

Expected result:

```text
npm run lint: no ESLint errors
npm run build: Vite build completes; existing large-chunk advisory is acceptable
```

- [ ] **Step 8: Commit frontend fix**

Run from the repository root:

```powershell
git add frontend/src/components/results/PolynomialCard.tsx frontend/src/components/results/results.smoke.test.tsx
git commit -m "fix: guard polynomial forms before display formatting"
```

---

### Task 5: Coordination Docs

**Files:**
- Modify: `docs/HANDOFF.md`
- Modify: `docs/PLAN.md`
- Modify: `docs/API_CONTRACT.md`
- Modify: `docs/FRONTEND_HANDOFF.md`

- [ ] **Step 1: Update `docs/API_CONTRACT.md`**

In the `Success Response Shape` section after the `polynomial` example, add:

```markdown
Top-level `polynomial.*_form` fields are display strings or `null`. Rich structured method artifacts stay under `methods.<method>`. In particular, `polynomial.hermite_form` is a string such as the Hermite nested form; the Hermite basis object is only returned as `methods.hermite.basis_form`.
```

- [ ] **Step 2: Update `docs/FRONTEND_HANDOFF.md`**

Near the top of `docs/FRONTEND_HANDOFF.md`, add:

```markdown
## Hermite Polynomial Crash Fix (2026-06-05)

The backend top-level polynomial contract has been corrected for Hermite. `polynomial.hermite_form` is now string-or-null and uses the Hermite nested form when Hermite succeeds. The structured basis-form object remains under `methods.hermite.basis_form`.

Frontend renderers should continue treating top-level `polynomial.*_form` fields as strings only. `PolynomialCard` defensively treats unexpected non-string top-level forms as absent so a malformed payload cannot reach display-digit string formatters and unmount the React root.
```

- [ ] **Step 3: Update `docs/PLAN.md`**

Add this milestone row in the Milestones table after Task 10:

```markdown
| Hermite polynomial crash fix | Completed 2026-06-05 | Fixed the valid Hermite Basis Form UI crash by restoring the backend contract that top-level `polynomial.hermite_form` is string-or-null, keeping the structured basis object under `methods.hermite.basis_form`, and hardening `PolynomialCard` against malformed non-string top-level forms. Focused backend and frontend validation passed; see `docs/HANDOFF.md` for exact commands. |
```

- [ ] **Step 4: Update `docs/HANDOFF.md`**

At the top of `docs/HANDOFF.md`, add:

```markdown
## Current Task
Hermite Polynomial tab crash blocker is fixed locally on `codex/interpolation-backend-v1` as of 2026-06-05.

Root cause:

- `backend/app/core/service.py` returned the structured `methods.hermite.basis_form` object as top-level `polynomial.hermite_form`.
- `frontend/src/components/results/PolynomialCard.tsx` treated top-level polynomial forms as strings and passed the object into display-digit formatting, causing `TypeError: input.replace is not a function`.

Files changed:

- `backend/app/core/service.py`
- `backend/app/tests/test_api.py`
- `frontend/src/components/results/PolynomialCard.tsx`
- `frontend/src/components/results/results.smoke.test.tsx`
- `docs/API_CONTRACT.md`
- `docs/FRONTEND_HANDOFF.md`
- `docs/PLAN.md`
- `docs/HANDOFF.md`

Commands run:

| Command | Result |
|---|---|
| `.\.venv\Scripts\python.exe -m pytest app/tests/test_api.py::test_interpolate_hermite_methods_contract -q` from `backend/` before backend fix | FAIL as expected: `polynomial.hermite_form` was a dict, not a string. |
| `.\.venv\Scripts\python.exe -m pytest app/tests/test_api.py::test_interpolate_hermite_methods_contract -q` from `backend/` after backend fix | PASS. |
| `.\.venv\Scripts\python.exe -m pytest app/tests/test_api.py app/tests/test_hermite.py -q` from `backend/` | PASS. |
| `.\.venv\Scripts\python.exe -m ruff check app/core/service.py app/tests/test_api.py` from `backend/` | PASS. |
| `npm test -- results.smoke.test.tsx` from `frontend/` before frontend guard | FAIL as expected with the malformed Hermite payload regression. |
| `npm test -- results.smoke.test.tsx` from `frontend/` after frontend guard | PASS. |
| `npm run lint` from `frontend/` | PASS. |
| `npm run build` from `frontend/` | PASS; existing Vite large-chunk advisory only. |

Notes and risks:

- Backend top-level `polynomial.hermite_form` is now string-or-null. `methods.hermite.basis_form` remains the structured basis artifact.
- `PolynomialCard` now treats unexpected non-string top-level form fields as absent instead of stringifying them.
- Full browser re-certification should rerun the Hermite Basis Form flow and the prior form-label console issue check before release is called UI PASS.
```

If any command result differs from the text above, record the actual result instead of copying the expected row.

- [ ] **Step 5: Commit documentation updates**

Run from the repository root:

```powershell
git add docs/HANDOFF.md docs/PLAN.md docs/API_CONTRACT.md docs/FRONTEND_HANDOFF.md
git commit -m "docs: record hermite polynomial crash fix"
```

---

### Task 6: Final Verification Snapshot

**Files:**
- No planned code changes.

- [ ] **Step 1: Check Git status**

Run from the repository root:

```powershell
git status --short --branch
```

Expected result: the first line identifies `codex/interpolation-backend-v1`, and there are no unstaged implementation or documentation files left unless generated artifacts appear. Do not stage generated build output.

- [ ] **Step 2: Run focused backend verification again if any backend file changed after Task 2**

Run from `backend/`:

```powershell
.\.venv\Scripts\python.exe -m pytest app/tests/test_api.py app/tests/test_hermite.py -q
.\.venv\Scripts\python.exe -m ruff check app/core/service.py app/tests/test_api.py
```

Expected result:

```text
pytest: passed
ruff: All checks passed!
```

- [ ] **Step 3: Run focused frontend verification again if any frontend file changed after Task 4**

Run from `frontend/`:

```powershell
npm test -- results.smoke.test.tsx
npm run lint
npm run build
```

Expected result:

```text
Vitest: PASS
lint: no ESLint errors
build: completes with only the known Vite large-chunk advisory
```

- [ ] **Step 4: Prepare final summary**

Report:

```text
Fixed the Hermite Polynomial tab crash root cause by restoring `polynomial.hermite_form` to a string-valued backend field and adding a React guard against malformed non-string top-level polynomial forms.

Verification run:
- backend focused pytest
- backend focused Ruff
- frontend results smoke test
- frontend lint
- frontend build

Remaining release follow-up:
- rerun browser UI certification for Hermite Basis Form and the Chrome form-label issue before changing UI FAIL to UI PASS.
```
