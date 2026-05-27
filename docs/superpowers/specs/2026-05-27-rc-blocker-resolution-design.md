# RC Blocker Resolution Design

## Context

This design amends the earlier Phase 2 and V2 RC plans. The previous release posture allowed several items to remain deferred or limited. The current policy changes those items into release blockers unless an external account, permission, or local environment constraint makes resolution impossible.

The repository remains on the current `codex/interpolation-backend-v1` branch. This work continues from the existing backend, frontend, Vercel plumbing, documentation, and QA evidence. It does not restart the project.

## Goals

Resolve the release blockers before claiming RC or public readiness:

- Implement `osculating` for valid inputs.
- Implement every cubic spline boundary mode currently exposed by the schema, UI, or API contract, or remove unsupported options from all user-facing surfaces.
- Resolve production deployment status and distinguish protected preview access from public production access.
- Make local `npx vercel build --yes` pass on Windows.
- Replace loose Windows Python launcher caveats with copy-pasteable Python 3.12.13 release commands.
- Fix or verify the frontend form-label accessibility issue.
- Remove stale audit and documentation contradictions.
- Resolve untracked QA/audit artifacts and leave the final git status clean unless an explicit blocker remains.

## Osculating Interpolation

The backend will add a real `osculating` method instead of returning `method_not_implemented` for valid input.

The method will use generalized confluent divided differences in repeated-node Newton form. For each distinct base node `x_i`, the method uses derivative orders `0..m_i`, where order 0 is the function value already represented by the node. Repeated entries in the divided-difference table use the confluent rule:

```text
f[x_i repeated k+1 times] = f^(k)(x_i) / k!
```

The output will include repeated nodes, derivative orders used per node, the confluent divided-difference table, coefficients, nested Newton form, expanded polynomial, LaTeX, target evaluations, educational steps, and warnings.

Special cases are part of the design, not separate hacks:

- All `m_i = 0` produces the ordinary interpolation polynomial and should match Lagrange.
- All `m_i = 1` produces first-derivative Hermite behavior.
- A single node with `m_0 > 0` produces the Taylor polynomial centered at that node.
- Mixed orders, including some `m_i > 1`, are supported.

Function-backed modes will derive required derivative values safely from the parsed SymPy expression. Point/data mode will require user-supplied derivative values for every required order `1..m_i`.

The request contract will add an `osculating` method-options block that declares derivative order requirements per node. Existing `derivatives` entries remain string-valued at the API boundary and carry `{ x, order, value }`.

Validation rules:

- Reject duplicate base nodes through existing node validation.
- Reject negative derivative orders.
- Reject missing derivative values in point/data mode.
- Reject duplicate derivative entries for the same `(x, order)`.
- Reject derivative entries whose `x` does not match a base node.
- Reject nonnumeric derivative strings where user values are required.
- Reject unknown `method_options` blocks and unknown keys inside `method_options.osculating`.
- Reject unsafe or non-real derived function derivatives.

Graph data and top-level evaluations will use the successful Osculating polynomial when it is the selected polynomial source, following the existing Taylor/Hermite graph-source pattern.

## Cubic Spline Boundaries

Natural spline remains supported and must continue to pass existing tests.

The implementation will support the boundary modes currently exposed by the frontend placeholder selector and stale contract text: `natural`, `clamped`, `not-a-knot`, and `periodic`, unless implementation proves a mode is incompatible with the current API constraints. If a mode cannot be implemented safely in this pass, it must be removed from the schema, frontend UI, API contract, and docs rather than left as a visible release limitation.

The backend will solve cubic spline second derivatives from a boundary-aware linear system:

- `natural`: endpoint second derivatives are zero.
- `clamped`: endpoint first derivatives are supplied by request options and enforced.
- `not-a-knot`: third-derivative continuity is enforced at the first and last interior knots.
- `periodic`: endpoint values must match, first derivatives match, and second derivatives match.

`method_options.cubic_spline` will validate required parameters, such as endpoint derivatives for clamped mode. The frontend will enable only implemented boundary modes and show fields only for the parameters required by the selected mode.

The response remains piecewise. It continues to return ordered nodes, second derivatives, segment coefficients, local and expanded segment forms, LaTeX, continuity checks, target evaluations, steps, warnings, and spline-backed graph data. Boundary metadata will identify the selected mode and any supplied boundary parameters.

## Frontend Changes

The frontend remains a thin API client and renderer. It will not compute interpolation, derivatives, spline coefficients, graph samples, or error curves.

Derivative input UI will become order-aware:

- Hermite methods keep first-derivative rows.
- Osculating exposes derivative values per node/order according to the selected maximum derivative orders.
- Function-backed Osculating can derive derivatives from the backend, so the UI should not require manual derivative values in that mode.

Spline configuration will enable only implemented boundary modes and show required parameter inputs. Result rendering will replace the deferred Osculating panel with a real Osculating details panel. Existing result tabs, graph rendering, evaluation tables, mobile layout, and accessibility conventions remain in place.

The Chrome issue "No label associated with a form field" will be investigated. If hidden Base UI display-precision controls are exposed to the accessibility tree, labels or ARIA will be fixed. If the fields are not exposed after current fixes, automated accessibility evidence will be recorded.

## Deployment And Local Verification

Local release verification must include a passing `npx vercel build --yes` on Windows. The preferred fix is repository-level and copy-pasteable, such as a Vercel build configuration or bootstrap command that invokes the package manager and Python environment in a PATH-safe way. Remote Vercel success alone is not enough.

Windows backend verification docs will consistently use:

```powershell
backend\.venv\Scripts\python.exe
```

This resolves the stale `py -3.13` launcher caveat for release purposes unless the local launcher can be repaired within the session.

Production deployment will be promoted if the available Vercel account/project permissions allow it. If Deployment Protection, SSO, or account permissions prevent public access, the blocker will be recorded as an exact external access limitation. Preview and production URLs will be recorded separately.

## Documentation And Hygiene

The following files must agree before RC/public readiness is claimed:

- `docs/HANDOFF.md`
- `docs/PLAN.md`
- `docs/API_CONTRACT.md`
- `docs/FRONTEND_HANDOFF.md`
- `RELEASE_NOTES.md`
- applicable audit and critique markdown

Stale text saying Osculating is intentionally deferred, non-natural spline boundaries are intentionally unsupported, Phase 2 frontend controls/browser QA are pending, local Vercel build is blocked by missing `uv`, or the Windows launcher is an unresolved release limitation must be replaced with current facts.

Untracked QA screenshots and audit markdown will be resolved by moving durable evidence into docs, ignoring generated local artifacts, committing intentional evidence, or deleting local-only artifacts.

## Testing

Backend verification:

- Full pytest suite.
- Ruff check.
- New Osculating tests for Lagrange equivalence, Hermite equivalence, Taylor equivalence, a true generalized mixed-order case, and validation failures.
- Cubic spline tests for every implemented boundary mode.

Frontend verification:

- Existing lint, build, and Vitest suite.
- Tests for Osculating derivative-order UI and real result rendering.
- Tests for spline boundary selector and parameter inputs.
- Accessibility test coverage where practical.

Browser or Playwright smoke:

- Osculating UI.
- Spline boundary selector and inputs.
- Result tabs.
- Graph and evaluation output.
- `320x800` mobile layout.
- Accessibility check when tooling is available.

## Release Rule

Do not claim RC or public readiness unless all blocker items above are implemented or resolved, all required tests pass, the local Vercel build passes, deployment access status is verified, and the final git status is clean or has a documented external blocker.
