# V2 Release Train Roadmap Design

## Purpose

This design turns the May 26, 2026 audit findings into a gated release roadmap for the Interpolation and Polynomial Approximation / Lecture Method Workbench.

The roadmap covers all audit priorities: deployment blockers, mathematical correctness, API contract drift, public sharing readiness, frontend polish, repository hygiene, and release documentation. It is a planning artifact only. It does not authorize production promotion, frontend redesign, endpoint changes, or new method scope beyond the approved gates below.

## Current Context

The project is close to V2.0 release-candidate status but is not there yet. Backend and frontend verification passed during the audit, but the repo still has uncommitted deploy work, tracked local artifacts, and several correctness or contract issues.

The main audit findings that drive this roadmap are:

- The graph-timeout fix and Vercel deploy artifacts need to be committed, pushed, deployed, smoke-tested, and recorded.
- `Lecture/~$cumentation.docx` is tracked and should be untracked while keeping the rest of `Lecture/` unless the user explicitly chooses otherwise.
- `frontend/vite-open-program.log` needs ignore coverage.
- Stirling currently returns a Lagrange-derived value and a forward-difference table labeled as centered-difference output.
- `input_summary.sorted_nodes` exists in backend and frontend types but is never set to `True`.
- Pydantic v1-style config emits a deprecation warning.
- `method_options` accepts loose shapes at the schema boundary.
- Public preview access and production promotion are separate decisions.

## Selected Approach

Use a four-gate release train:

1. Preview Gate.
2. Release Candidate Gate.
3. Public/Professor Gate.
4. Polish Gate.

This approach keeps the practical preview work moving without pretending the P1 correctness and contract issues are optional. It also gives each gate a clear verification bar and keeps ownership clean between Codex backend/deployment work and Claude Opus frontend work.

## Alternatives Considered

### Fast Public Preview First

This would clear P0 deploy blockers, ship a preview, then handle correctness and polish later. It is fast, but it risks people treating the preview as release-candidate quality before the Stirling and API drift issues are fixed.

### Mathematical Correctness First

This would fix Stirling, `sorted_nodes`, schema validation, and missing tests before any new preview. It is defensible academically, but it leaves the current dirty-tree/deploy mismatch unresolved and delays having a reproducible preview baseline.

### Clean Release Package First

This would focus on docs, repo cleanup, and release notes before deploy and correctness work. It is orderly, but it front-loads paperwork before the deployment and math risks are closed.

### Selected Release Train

The release train combines the strengths of the alternatives: it starts with a reproducible preview baseline, then closes correctness/API gaps before RC, then handles shareability and production approval, then lands polish.

## Gate 1: Preview Gate

### Objective

Make the current deploy state reproducible from git and create a verified Vercel preview without changing numerical behavior.

### Work Packages

#### P0-A Deploy State Commit

Commit the existing graph-timeout fix, Vercel adapter/config, runtime requirements, same-origin API fallback, and coordination docs already in the worktree.

Expected files include:

- `.gitignore`
- `.python-version`
- `.vercelignore`
- `api/index.py`
- `backend/app/core/graph_data.py`
- `backend/app/tests/test_graph_data.py`
- `frontend/src/lib/api-client.ts`
- `requirements.txt`
- `vercel.json`
- `docs/FRONTEND_HANDOFF.md`
- `docs/HANDOFF.md`
- `docs/PLAN.md`

Do not stage `.impeccable/critique/2026-05-26T13-30-00Z__frontend-audit.md` or generated cache files.

#### P0-B Repo Hygiene Commit

Untrack `Lecture/~$cumentation.docx`, leave the rest of `Lecture/` tracked unless the user explicitly chooses to untrack the whole folder, and add ignore coverage for future Word lock files and `frontend/vite-open-program.log`.

#### P0-C Verification And Preview

Run backend and frontend verification, push the branch, deploy a new Vercel preview, and smoke-test:

- `GET /health`
- `POST /api/validate-function`
- Linear Lagrange `/api/interpolate`
- Newton Forward cos(x) `/api/interpolate`

#### P0-D Evidence Docs

Update `docs/HANDOFF.md` and `docs/PLAN.md` with the preview URL, deployment id when available, commands run, status codes, smoke results, failures if any, and remaining risks.

### Preview Gate Exit Criteria

- Deploy state and graph-timeout fix are committed.
- Repo hygiene cleanup is committed separately.
- Branch is pushed to `origin/codex/interpolation-backend-v1`.
- A new Vercel preview URL exists from the pushed branch state.
- Four smoke requests return 200 and match the documented contract.
- Coordination docs record exact evidence.
- No production promotion has occurred.

## Gate 2: Release Candidate Gate

### Objective

Close correctness and API contract drift before calling the project V2.0 RC.

### Work Packages

#### P1-A Stirling Correction

Replace the Lagrange fallback in `build_stirling` with an actual centered-difference Stirling evaluator. Emit terms that match the lecture formula structure and add backend tests against known values.

Frontend updates should be limited to rendering any new backend fields or removing temporary caveats. Larger UI work remains Opus-owned.

#### P1-B Reordered Nodes Contract

Wire `input_summary.sorted_nodes` so cubic spline reordering is documented at the response-summary level as well as through the method warning. Add backend coverage for unsorted spline input and frontend coverage for the `Reordered` badge.

#### P1-C Schema Hardening

Migrate Pydantic config from legacy `class Config` to v2 `model_config`, then tighten `method_options` validation so numeric fields that must be strings are rejected at the schema layer when provided as numbers.

#### P1-D Guardrail Tests

Add targeted tests for warning and comparison behavior that the audit identified as under-covered, especially `nodes_reordered`, `method_disagreement_warning`, and high-degree warning interactions where practical.

### RC Gate Exit Criteria

- Stirling output is computed through the centered formula, not a Lagrange fallback.
- `input_summary.sorted_nodes` is either wired and tested or intentionally removed from the contract with docs updated.
- Pydantic deprecation warning is gone.
- `method_options` shape validation enforces numeric-string boundaries.
- Relevant API contract and frontend handoff docs are updated.
- Full backend verification passes.
- Frontend tests pass for any frontend-relevant behavior.
- No known P1 correctness/API issue remains unresolved or undocumented.

## Gate 3: Public/Professor Gate

### Objective

Make the approved preview consumable by its intended audience and prepare the release package.

### Work Packages

#### PUB-A Access Decision

Decide whether the preview remains SSO-gated, uses a bypass link, or becomes public. This is a user/product decision, not an automatic deploy step.

#### PUB-B Release Notes

Create release notes covering implemented features, deferred items, known caveats, verification evidence, and the exact URL intended for sharing.

#### PUB-C Final Smoke

Run fresh API and browser smoke tests against the exact URL intended for sharing. If production promotion is desired, get explicit approval before promoting.

### Public/Professor Gate Exit Criteria

- Access mode is explicit.
- Release notes exist and match the implemented RC state.
- Fresh smoke evidence is recorded.
- The URL to share is known.
- Production is promoted only if explicitly approved by the user.

## Gate 4: Polish Gate

### Objective

Improve usability, accessibility, repo weight, and maintainability after the release baseline is defensible.

### Work Packages

#### POL-A Accessibility

Address Base UI hidden radio input labeling and add color-blind-safe graph differentiation, such as dashed line styles.

#### POL-B Frontend Clarity

Add best-method rationale help in the evaluation table. Add a Stirling caveat only if the Stirling correction has not landed first.

#### POL-C Repo Weight

Decide what to do with `.impeccable/critique/screens/` and `.kiro/` tracked assets. Use explicit `git rm --cached` for untracking; do not broadly delete local artifacts.

#### POL-D Bundle Audit

Inspect the main frontend bundle and trim obvious unused weight only when the change is low-risk and locally verified.

### Polish Gate Exit Criteria

- Each polish item is landed, explicitly deferred, or moved out of release scope.
- Browser or test evidence is recorded for visible changes.
- Any repo cleanup is intentional and reviewable.

## Dependencies And Ordering

Recommended order:

1. Complete the Preview Gate first to resolve the current dirty-tree/deployment mismatch.
2. Complete the RC Gate second, starting with Stirling because it is the highest-value correctness issue.
3. Complete the Public/Professor Gate third unless an internal preview must be shared earlier. Early shares must be labeled preview, not RC.
4. Complete the Polish Gate last unless a polish item reveals a severe accessibility blocker.

Specific dependencies:

- `P0-C` depends on `P0-A` and `P0-B`.
- `P0-D` depends on successful deploy and smoke-test evidence.
- `PUB-B` should wait until RC scope is known, otherwise release notes will go stale.
- `POL-B` Stirling caveat should be skipped if `P1-A` lands first.
- Production promotion depends on explicit user approval, never on passing tests alone.

## Validation Strategy

### Preview Gate Validation

Run:

```powershell
git status --short
git log --oneline -10
cd backend
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m ruff check .
cd ..\frontend
npm run lint
npm run build
npm test
cd ..
git push -u origin codex/interpolation-backend-v1
npx vercel deploy --yes
```

Then run the four Vercel smoke commands from the audit plan against the new preview URL.

### RC Gate Validation

Run method-specific backend tests first for the changed method or contract behavior, then the full backend suite and ruff. Run frontend tests when response shape or visible behavior changes. Update `docs/API_CONTRACT.md` and `docs/FRONTEND_HANDOFF.md` when frontend-relevant API behavior changes.

### Public/Professor Gate Validation

Use the exact URL that will be shared. Confirm API smoke, browser smoke, and access mode. Record whether the URL is public, SSO-gated, or bypass-token based.

### Polish Gate Validation

Use targeted tests or browser checks per item. For bundle work, record before/after bundle output only if code changes are made.

## Ownership And Boundaries

Codex owns:

- Backend fixes.
- API contract discipline.
- Tests and verification.
- Vercel deployment plumbing.
- Git hygiene.
- Coordination docs.

Claude Opus owns:

- React frontend feature or refactor work.
- UI polish.
- Accessibility polish.
- Bundle trimming.
- Frontend visual changes beyond small contract-driven tests.

Shared boundary:

- If backend response shape changes, Codex updates `docs/API_CONTRACT.md` and `docs/FRONTEND_HANDOFF.md`.
- If frontend behavior must change because of a backend fix, Codex may add minimal tests or docs, but larger UI implementation stays with Opus.
- No frontend scaffolding or redesign work happens in this backend repo unless explicitly authorized.

Hard release boundaries:

- No production promotion without explicit approval.
- No endpoint path, request shape, response shape, error-code, or warning-code changes during the Preview Gate.
- No silent numerical fixes during the Preview Gate.
- No RC claim until P1 correctness/API issues are fixed or explicitly documented as accepted caveats.

## Out Of Scope

- Production promotion without explicit user approval.
- New interpolation methods beyond correcting existing Stirling behavior.
- Frontend redesign.
- Broad repo history rewriting.
- Deleting `.impeccable/critique/*` assets during the Preview Gate.
- Changing `docs/superpowers/specs/*` during implementation sessions that explicitly forbid it.
