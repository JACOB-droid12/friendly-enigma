# Hermite Polynomial Crash Fix Design

## Context

The local UI audit found a release-blocking React crash in the valid `Hermite (Basis Form)` flow:

1. Load the Hermite basis-form example.
2. Compute.
3. Open the Polynomial result tab.

The React root unmounted with `TypeError: input.replace is not a function` from `format-numeric.ts`.

Local inspection found the backend response violates the documented top-level polynomial contract. `polynomial.hermite_form` is typed and documented as `string | null`, but `_polynomial_block()` currently assigns `methods.hermite.basis_form` to it. `basis_form` is an object with fields such as `status`, `terms`, `expanded`, and `matches_divided_difference`. `PolynomialCard` passes the value into display-digit string formatters, which call `.replace()`.

## Goals

- Fix the backend API response so all top-level polynomial form fields remain strings or `null`.
- Preserve the rich Hermite basis-form object under `methods.hermite.basis_form`.
- Add frontend resilience so one malformed top-level polynomial field cannot unmount the app.
- Add regression tests for both the backend contract and the React crash path.
- Update coordination docs and frontend handoff notes honestly.

## Non-Goals

- Do not change endpoint paths, request shapes, or method names.
- Do not move interpolation or Hermite math into React.
- Do not redesign the Polynomial tab.
- Do not change Hermite method-detail rendering except as needed for crash prevention.

## Backend Design

`backend/app/core/service.py` should keep `_polynomial_block()` responsible for top-level string forms only.

For Hermite:

- `polynomial.hermite_form` should use `raw_results["hermite"]["nested_form"]` when `methods.hermite` succeeds.
- If `methods.hermite` is absent but `methods.hermite_divided_difference` succeeds, it should keep the existing fallback to `raw_results["hermite_divided_difference"]["nested_form"]`.
- `methods.hermite.basis_form` should remain unchanged and continue to carry the included or omitted basis-form details for the Methods tab.
- `polynomial.latex_hermite` should remain sourced from the backend LaTeX Hermite field.

Backend tests should assert `polynomial.hermite_form` is a string for a valid Hermite basis-form request, not merely truthy. This catches the exact contract regression.

## Frontend Design

`PolynomialCard` should defensively normalize optional top-level polynomial fields before formatting:

- Treat strings as renderable forms.
- Treat `null` and `undefined` as absent.
- Treat any non-string value as absent for rendering and display formatting.

This keeps frontend behavior aligned with the contract while preventing a malformed payload from reaching `formatLiterals()`, `formatPoly()`, or copy controls. The frontend should not stringify objects because that would display `[object Object]` and mask the contract violation as usable output.

Frontend tests should add a regression for a malformed Hermite top-level object payload and assert the component renders without throwing. A focused smoke test should also cover the normal Hermite string path.

## Documentation Design

Update the required coordination files after implementation:

- `docs/HANDOFF.md`: record the blocker, files changed, commands run, test results, failures, risks, and next steps.
- `docs/PLAN.md`: add a completed blocker-fix entry once verification passes.
- `docs/API_CONTRACT.md`: clarify that top-level `polynomial.*_form` fields are strings or `null`; the Hermite basis object is only under `methods.hermite.basis_form`.
- `docs/FRONTEND_HANDOFF.md`: tell Claude Opus that the backend contract has been corrected and that frontend rendering should treat unexpected non-string top-level forms as absent.

## Validation Plan

Focused backend validation:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest app/tests/test_api.py app/tests/test_hermite.py -q
.\.venv\Scripts\python.exe -m ruff check app/core/service.py app/tests/test_api.py
```

Focused frontend validation:

```powershell
cd frontend
npm test -- results.smoke.test.tsx
npm run lint
npm run build
```

If the focused checks expose wider coupling, run the full backend pytest/Ruff and full frontend test suite before completion.

## Risks

- Existing frontend fixtures may have copied the old malformed top-level Hermite object. They should be corrected to match the backend contract.
- The frontend guard must not hide valid Hermite output after the backend fix. Tests should cover the normal string path.
- If another top-level form has a similar object leak, the same string-only guard should prevent a crash while backend tests should catch the contract error.
