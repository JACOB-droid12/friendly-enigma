# V2 Preview Deploy State Design

## Purpose

This design covers the post-audit Goal 1 work for the Interpolation and Polynomial Approximation / Lecture Method Workbench: commit the current V2 deploy-ready state, resolve small repository hygiene issues, push the branch, create a new Vercel preview deployment, verify the public API surface, and record the outcome in coordination docs.

The goal is release-candidate preparation only. This design does not include production promotion, backend numerical changes, frontend refactors, public API changes, or new interpolation methods.

## Current Context

The repository is on `codex/interpolation-backend-v1`. The audit identified a verified but uncommitted graph-timeout fix and Vercel deployment prep files. The live worktree contains these deployment-related changes:

- Backend graph sampling performance fix and test coverage.
- Vercel serverless adapter and deployment config.
- Runtime dependency file for Vercel packaging.
- Same-origin frontend API-base fallback.
- Coordination doc updates describing the deploy state.

The live worktree also has local-only artifacts that must not be bundled into product commits, including `.impeccable/critique/2026-05-26T13-30-00Z__frontend-audit.md` and generated Python cache files under `api/__pycache__/`.

`Lecture/` is not currently dirty in `git status`, but `Lecture/~$cumentation.docx` is tracked. That Word lock file should be untracked and future Word lock files should be ignored.

## Selected Approach

Use a conservative multi-commit workflow:

1. Commit the deploy state and graph-timeout fix.
2. Commit repository hygiene separately.
3. Run full backend and frontend verification from a clean tracked state.
4. Push the branch.
5. Deploy a new Vercel preview.
6. Smoke-test the documented public endpoints.
7. Update coordination docs with exact deploy and smoke-test evidence.
8. Commit and push the post-deploy documentation update.

This approach keeps functional deploy work separate from cleanup and separates pre-deploy code state from post-deploy evidence. It also makes rollback and review clearer than one large mixed commit.

## Alternatives Considered

### Single Combined Commit

One commit could include graph-timeout fix, deployment config, hygiene cleanup, and post-deploy docs. This is faster, but it makes the history harder to review because product behavior, deployment plumbing, cleanup, and external deployment evidence are mixed together.

### Deploy Before Committing

Deploying directly from the dirty worktree would test the local state quickly, but it would preserve the audit problem: the preview would not correspond cleanly to a committed tree. That is unacceptable for release-candidate preparation.

### Separate Backend, Frontend, Deploy, and Docs Commits

This is the most granular option, but the current worktree already represents one coherent deploy state. Splitting too finely would add noise without improving review quality. The selected approach keeps the meaningful boundaries while avoiding needless fragmentation.

## Commit Boundaries

### Deploy State Commit

Include only files required for the graph-timeout fix and preview deployment:

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

Do not stage `.impeccable/critique/2026-05-26T13-30-00Z__frontend-audit.md`.

Do not stage generated files under `api/__pycache__/`.

Suggested commit message:

```text
feat(deploy): vercel preview state with graph-timeout fix
```

### Repository Hygiene Commit

Untrack `Lecture/~$cumentation.docx` while leaving the file present locally if possible. Add ignore coverage for future Word lock files and for `frontend/vite-open-program.log`.

Suggested commit message:

```text
chore(repo): ignore local lock and vite log artifacts
```

### Post-Deploy Docs Commit

After the preview deployment and smoke tests complete, update coordination docs only:

- `docs/HANDOFF.md`
- `docs/PLAN.md`

Record the new preview URL, deployment id when available, exact commands run, status codes, smoke-test results, failures if any, and remaining risks.

Suggested commit message:

```text
docs: record post-audit preview deploy
```

## Deployment Architecture

The Vercel preview keeps a single-project same-origin deployment:

- Vite builds the frontend into `frontend/dist`.
- Vercel serves the static frontend.
- `api/index.py` exposes the FastAPI app as the Python serverless entrypoint.
- `/health` and `/api/:path*` rewrite to `/api/index`.
- SPA routes rewrite to `/index.html`.

The frontend client uses `VITE_API_BASE_URL` when provided and otherwise falls back to same-origin requests. This preserves local flexibility while keeping the deployed preview simple.

No CORS change is part of this design because the selected preview architecture is same-origin. CORS readiness is a later production-hardening task.

## Data and API Contract

The public API surface must remain unchanged:

- `GET /health`
- `POST /api/validate-function`
- `POST /api/interpolate`

No endpoint paths, request JSON, response JSON, error codes, or warning codes may change during this goal. The graph-timeout fix may change performance characteristics only; it must not change the documented graph-data shape.

## Error Handling and Stop Conditions

Stop and report the failure if any required verification command fails:

- Backend pytest.
- Backend ruff.
- Frontend lint.
- Frontend build.
- Frontend vitest.
- Git push.
- Vercel deploy.
- Any Vercel smoke request returning a non-200 status.
- Any Vercel smoke payload that does not match the documented contract.

Do not silently patch new backend numerical behavior, frontend components, endpoint shapes, or deployment architecture while handling this goal. If a failure requires a change outside the approved scope, stop and report the needed decision.

## Verification Plan

Run the following local verification from the repository root unless noted:

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
```

After local verification passes, push:

```powershell
git push -u origin codex/interpolation-backend-v1
```

Deploy:

```powershell
npx vercel deploy --yes
```

Smoke-test the new preview URL:

```powershell
npx vercel curl /health --deployment <new-url>
npx vercel curl /api/validate-function --deployment <new-url> -- --request POST --header "Content-Type: application/json" --data '{"function":"sin(x)"}'
npx vercel curl /api/interpolate --deployment <new-url> -- --request POST --header "Content-Type: application/json" --data '{"mode":"points","points":[["2","4"],["5","1"]],"methods":["lagrange"],"precision":50,"exact":true,"evaluation_x":["3"],"graph":true}'
npx vercel curl /api/interpolate --deployment <new-url> -- --request POST --header "Content-Type: application/json" --data '{"mode":"x_values_with_function","x_values":["1.0","1.3","1.6","1.9","2.2"],"function":"cos(x)","methods":["newton_forward"],"precision":50,"exact":true,"evaluation_x":["1.5"],"graph":true}'
```

## Acceptance Criteria

The goal is complete when:

- The deploy state and graph-timeout fix are committed.
- The repository hygiene cleanup is committed separately.
- The branch is pushed to `origin/codex/interpolation-backend-v1`.
- A new Vercel preview URL is created from the pushed branch state.
- `/health`, `/api/validate-function`, Linear Lagrange interpolation, and cos(x) Newton Forward interpolation smoke tests pass against the new preview.
- `docs/HANDOFF.md` and `docs/PLAN.md` record exact deploy and smoke-test evidence.
- The final worktree has only explicitly deferred local artifacts, or is clean if those artifacts are intentionally removed or ignored.

## Out of Scope

- Production promotion.
- Stirling formula correction.
- `input_summary.sorted_nodes` wiring.
- Pydantic v2 schema migration.
- CORS middleware.
- Frontend UX polish.
- Bundle-size optimization.
- Deleting `.impeccable/critique/*` assets.
- Changing `docs/API_CONTRACT.md` unless a verified contract drift is found, which should stop the goal rather than be fixed silently.
