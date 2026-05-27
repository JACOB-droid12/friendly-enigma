# V2 Release Candidate Notes

Date: 2026-05-27

## Implemented

- V1 interpolation methods: Lagrange, Newton divided differences, Barycentric Lagrange, and Neville.
- Phase 2 lecture methods: Newton Forward, Newton Backward, Stirling, Hermite divided difference, Hermite basis, Taylor/Maclaurin, and natural cubic spline.
- Backend-owned graph data generation for standard interpolation, Taylor, Hermite, and cubic spline.
- Exact mode uses SymPy rational values where possible.
- Numeric mode parses numeric strings through the high-precision path and uses backend precision-aware comparisons for finite-difference spacing, spline continuity, and Hermite consistency checks.
- Vercel preview plumbing uses a single Vite static frontend plus FastAPI serverless adapter project.
- RC hardening:
  - Stirling now computes through direct centered finite-difference formula terms instead of a Lagrange fallback.
  - `input_summary.sorted_nodes` is live for supported methods that reorder input nodes.
  - `method_options` schema validation rejects unknown option blocks and non-strict Taylor option types.
  - Display precision controls, graph line differentiation, and evaluation best-method help were polished.

## Deferred

- `osculating` remains accepted by the API but not implemented; it returns method-level `method_not_implemented`.
- Cubic spline boundary conditions other than `natural` remain deferred and return `unsupported_boundary_condition`.
- Production promotion requires explicit approval.
- Preview access mode remains a decision point. The current safe default is to keep existing Vercel Deployment Protection/SSO unchanged unless explicitly approved.

## Verification

Latest committed preview before this RC pass:

- Preview URL: `https://interpolation-workbench-bnuyc0i94-marvillarq20-3593s-projects.vercel.app`
- Deployment id: `dpl_9gUubAmn1UbbkF97WgZjFTGieaUW`
- Production: not promoted.

Fresh post-RC local verification on 2026-05-27:

- Backend: `.\.venv\Scripts\python.exe -m pytest` -> 100 passed.
- Backend deprecation gate: `.\.venv\Scripts\python.exe -m pytest -W error::DeprecationWarning` -> 100 passed.
- Backend Ruff: `.\.venv\Scripts\python.exe -m ruff check .` -> `All checks passed!`.
- Frontend lint: `npm run lint` -> exit 0.
- Frontend build: `npm run build` -> exit 0 with existing Vite large-chunk warning.
- Frontend tests: `npm test` -> 14 files / 62 tests passed.

Fresh post-RC preview verification will be recorded in `docs/HANDOFF.md` and `docs/PLAN.md` after the final deploy/smoke step in this session.

Fresh post-RC preview deployment on 2026-05-27:

- Preview URL: `https://interpolation-workbench-c85z59ylk-marvillarq20-3593s-projects.vercel.app`
- Deployment id: `dpl_9ciPFpehZqwSuGnR7drBJqwWbV3u`
- Ready state: `READY`
- Smoke checks through authenticated `vercel curl`: `/health`, `/api/validate-function`, Linear Lagrange, Newton Forward cos(x), corrected Stirling, and unsorted-node cubic spline all returned HTTP 200 with expected contract fields.
- Direct unauthenticated request to `/health` returned HTTP 401 Vercel Authentication, so Deployment Protection remains enabled.

## Known Caveats

- Preview may remain protected by Vercel Deployment Protection/SSO. Public/professor access needs an explicit access-mode decision.
- `.impeccable/critique/screens/` and `.kiro/` contain tracked tooling/audit assets. They were inspected but not broadly removed in this RC pass.
- The frontend bundle still carries Vite large-chunk warnings because the graph and polynomial renderers depend on heavier visualization/math display libraries. Current build output: main JS 725.00 kB / 211.84 kB gzip, GraphCard chunk 378.60 kB / 109.73 kB gzip, PolynomialCard chunk 6.55 kB / 2.30 kB gzip, CSS 92.11 kB / 19.37 kB gzip.
