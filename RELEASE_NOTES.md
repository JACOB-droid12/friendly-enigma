# V2 Release Candidate Notes

Date: 2026-06-01

## Implemented

- V1 interpolation methods: Lagrange, Newton divided differences, Barycentric Lagrange, and Neville.
- Phase 2 lecture methods: Newton Forward, Newton Backward, Stirling, Hermite divided difference, Hermite basis, generalized Osculating, Taylor/Maclaurin, and cubic spline.
- Cubic spline boundary modes: `natural`, `clamped`, `not-a-knot`, and `periodic`.
- Backend-owned graph data generation for standard interpolation, Osculating, Taylor, Hermite, and cubic spline.
- Exact mode uses SymPy rational values where possible.
- Numeric mode parses numeric strings through the high-precision path and uses backend precision-aware comparisons for finite-difference spacing, spline continuity, and Hermite consistency checks.
- Vercel preview plumbing uses a single Vite static frontend plus FastAPI serverless adapter project.
- RC hardening:
  - Stirling now computes through direct centered finite-difference formula terms instead of a Lagrange fallback.
  - `input_summary.sorted_nodes` is live for supported methods that reorder input nodes.
  - `method_options` schema validation rejects unknown option blocks and non-strict Taylor option types.
  - Display precision controls, graph line differentiation, and evaluation best-method help were polished.
  - Osculating now uses generalized confluent divided differences with per-node derivative orders.
  - Frontend controls send Osculating derivative orders/data and all implemented cubic spline boundary modes.
  - Chrome DevTools MCP accessibility verification reports Lighthouse Accessibility 100.
  - Windows release verification uses `backend\.venv\Scripts\python.exe` / Python 3.12.13 and a path-safe local Vercel build.

## Release Access

- Production promotion requires explicit approval.
- Fresh current preview access is protected by Vercel Authentication. Do not describe the fresh preview as public.
- Existing production is separate and unchanged from this preview-only run.

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

Fresh post-RC preview verification is recorded in `docs/HANDOFF.md` and `docs/PLAN.md`.

Fresh post-RC preview deployment on 2026-05-27:

- Preview URL: `https://interpolation-workbench-c85z59ylk-marvillarq20-3593s-projects.vercel.app`
- Deployment id: `dpl_9ciPFpehZqwSuGnR7drBJqwWbV3u`
- Ready state: `READY`
- Smoke checks through authenticated `vercel curl`: `/health`, `/api/validate-function`, Linear Lagrange, Newton Forward cos(x), corrected Stirling, and unsorted-node cubic spline all returned HTTP 200 with expected contract fields.
- Direct unauthenticated request to `/health` returned HTTP 401 Vercel Authentication, so Deployment Protection remains enabled.

RC blocker preview deployment on 2026-06-01:

- Preview URL: `https://interpolation-workbench-731dpy4tj-marvillarq20-3593s-projects.vercel.app`
- Deployment id: `dpl_7dpxuQtN7s8MaVReKG39yhxXkdrb`
- Vercel target/status: `preview` / `Ready`
- Production: not promoted or touched.
- Direct unauthenticated Node `fetch` to `/` and `/health` returned HTTP 401 Vercel Authentication.

RC blocker local verification completed so far on 2026-06-01:

- Frontend focused accessibility/control tests: 5 files / 35 tests passed.
- Frontend lint/build: passed; Vite emitted the existing large-chunk advisory.
- Chrome DevTools MCP: no console form-label issues, no unlabeled form fields, Lighthouse Accessibility 100.
- Local Vercel build: `npx vercel build --yes` passed from `W:\` after `.\scripts\bootstrap-release-env.ps1`.

Final preview-only deployment on 2026-06-01:

- Preview URL: `https://interpolation-workbench-eigtee1bc-marvillarq20-3593s-projects.vercel.app`
- Deployment id: `dpl_F4a5VTBgFeNSpCo6sqNaaGUvqZHP`
- Vercel target/status: `preview` / `Ready`
- Preview public access: direct unauthenticated Node `fetch` to `/` and `/health` returned HTTP `401 Unauthorized`.
- Existing production deployment remained separate and unchanged: `https://interpolation-workbench-r7dkw8cmy-marvillarq20-3593s-projects.vercel.app` (`dpl_8eqoGvLoqLosanRus34rRMBVzo3U`), target/status `production` / `Ready`.
- Existing production aliases: `https://interpolation-workbench.vercel.app` and `https://interpolation-workbench-marvillarq20-3593s-projects.vercel.app`.
- Existing production alias public access: unauthenticated `/` and `/health` returned HTTP `200`.
- Production promotion was not run per the user instruction to keep the fresh deployment separate from production.

Final local verification on 2026-06-01:

- Backend pytest: 143 passed.
- Backend Ruff: all checks passed.
- Frontend Vitest: 15 files / 70 tests passed.
- Frontend lint/build: passed; Vite emitted the existing large-chunk advisory.
- Local Vercel build: passed from `W:\`, output `.vercel\output`, target `preview`.
- Chrome DevTools MCP: Osculating UI, clamped spline UI, result tabs, graph/evaluation output, mobile emulation at `320x800`, no console `issue` messages, no unlabeled visible form controls, and Lighthouse snapshot Accessibility `100`.

## Known Caveats

- Fresh current preview is protected by Vercel Authentication. Current-branch public/professor access needs protection disabled by an authorized account owner, preview sharing through an approved access path, or an explicit production promotion.
- `.impeccable/critique/screens/` and `.kiro/` contain tracked tooling/audit assets. They were inspected but not broadly removed in this RC pass.
- The frontend bundle still carries Vite large-chunk warnings because the graph and polynomial renderers depend on heavier visualization/math display libraries. Current build output: main JS 725.00 kB / 211.84 kB gzip, GraphCard chunk 378.60 kB / 109.73 kB gzip, PolynomialCard chunk 6.55 kB / 2.30 kB gzip, CSS 92.11 kB / 19.37 kB gzip.
