# V2 Release Train Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the project from audited-but-not-RC state to a reproducible preview, then to V2.0 RC readiness, then to a shareable public/professor release candidate with post-RC polish tracked separately.

**Architecture:** Use a four-gate release train: Preview Gate, Release Candidate Gate, Public/Professor Gate, and Polish Gate. Each gate has explicit commit boundaries, verification commands, documentation updates, and stop conditions so deployment evidence, math correctness, API contract behavior, and frontend polish are not mixed together.

**Tech Stack:** Python 3.11+ / FastAPI / SymPy / mpmath / pytest / ruff for backend; React / TypeScript / Vite / Vitest / ESLint for frontend; Vercel for preview deployment; git for release-state commits.

---

## Scope Check

This plan intentionally covers the full release train requested by the user. It spans deployment, backend correctness, API contract hardening, release documentation, and frontend polish, but the gates are ordered so each gate can be executed and verified independently.

If time is limited, execute only Tasks 1-6 to complete the Preview Gate. Do not start Tasks 7-12 until the Preview Gate is committed, pushed, deployed, smoke-tested, and documented.

## File Structure

### Deployment And Preview Files

- Modify/commit existing worktree changes: `.gitignore`, `.python-version`, `.vercelignore`, `api/index.py`, `requirements.txt`, `vercel.json`, `frontend/src/lib/api-client.ts`.
- Modify/commit existing backend graph fix: `backend/app/core/graph_data.py`, `backend/app/tests/test_graph_data.py`.
- Modify/commit existing coordination docs: `docs/HANDOFF.md`, `docs/PLAN.md`, `docs/FRONTEND_HANDOFF.md`.
- Modify for hygiene: `frontend/.gitignore`.
- Git index only: untrack `Lecture/~$cumentation.docx` while leaving the local file present.

### Backend Correctness And API Files

- Modify: `backend/app/core/methods/newton_finite.py`.
- Modify: `backend/app/tests/test_newton_finite.py`.
- Modify: `backend/app/core/service.py`.
- Modify: `backend/app/tests/test_api.py`.
- Modify: `backend/app/schemas.py`.
- Modify: `backend/app/tests/test_schemas.py`.
- Review/update as needed: `docs/API_CONTRACT.md`, `docs/HANDOFF.md`, `docs/PLAN.md`, `docs/FRONTEND_HANDOFF.md`.

### Frontend Contract/Test Files

- Modify: `frontend/src/lib/api-types.ts`.
- Modify: `frontend/src/test/interpolate-response.fixtures.ts`.
- Create: `frontend/src/components/results/SummaryCard.test.tsx`.
- Modify only if still needed after backend Stirling fix: `frontend/src/components/results/methods/EqualSpacingDetails.tsx`.
- Modify for polish: `frontend/src/components/results/GraphCard.tsx`, `frontend/src/components/DisplayDigitsControl.tsx`, `frontend/src/components/results/EvaluationTable.tsx`.

### Release Documentation Files

- Create: `RELEASE_NOTES.md`.
- Modify: `docs/HANDOFF.md`.
- Modify: `docs/PLAN.md`.

---

## Preview Gate

### Task 1: Inspect And Commit Existing Deploy State

**Files:**
- Modify already in worktree: `.gitignore`
- Modify already in worktree: `backend/app/core/graph_data.py`
- Modify already in worktree: `backend/app/tests/test_graph_data.py`
- Modify already in worktree: `docs/FRONTEND_HANDOFF.md`
- Modify already in worktree: `docs/HANDOFF.md`
- Modify already in worktree: `docs/PLAN.md`
- Modify already in worktree: `frontend/src/lib/api-client.ts`
- Create already in worktree: `.python-version`
- Create already in worktree: `.vercelignore`
- Create already in worktree: `api/index.py`
- Create already in worktree: `requirements.txt`
- Create already in worktree: `vercel.json`

- [ ] **Step 1: Confirm the worktree contains only the expected dirty deploy files plus ignored local artifacts**

Run:

```powershell
git status --short
```

Expected tracked modifications:

```text
 M .gitignore
 M backend/app/core/graph_data.py
 M backend/app/tests/test_graph_data.py
 M docs/FRONTEND_HANDOFF.md
 M docs/HANDOFF.md
 M docs/PLAN.md
 M frontend/src/lib/api-client.ts
```

Expected untracked deploy artifacts:

```text
?? .python-version
?? .vercelignore
?? api/
?? requirements.txt
?? vercel.json
```

Expected local artifact that must not be staged:

```text
?? .impeccable/critique/2026-05-26T13-30-00Z__frontend-audit.md
```

- [ ] **Step 2: Review deploy-state diff before staging**

Run:

```powershell
git diff -- .gitignore backend/app/core/graph_data.py backend/app/tests/test_graph_data.py docs/FRONTEND_HANDOFF.md docs/HANDOFF.md docs/PLAN.md frontend/src/lib/api-client.ts
git diff --no-index -- NUL api/index.py
git diff --no-index -- NUL requirements.txt
git diff --no-index -- NUL vercel.json
git diff --no-index -- NUL .vercelignore
git diff --no-index -- NUL .python-version
```

Expected:

- `backend/app/core/graph_data.py` contains the graph sampling timeout fix only.
- `backend/app/tests/test_graph_data.py` contains coverage for graph sampling performance/shape.
- `api/index.py`, `requirements.txt`, `vercel.json`, `.vercelignore`, and `.python-version` are deployment plumbing only.
- No endpoint paths, request shapes, response shapes, error codes, or warning codes are changed.

- [ ] **Step 3: Stage only deploy-state files**

Run:

```powershell
git add -- .gitignore .python-version .vercelignore api/index.py backend/app/core/graph_data.py backend/app/tests/test_graph_data.py docs/FRONTEND_HANDOFF.md docs/HANDOFF.md docs/PLAN.md frontend/src/lib/api-client.ts requirements.txt vercel.json
git diff --cached --name-status
```

Expected staged files:

```text
M	.gitignore
A	.python-version
A	.vercelignore
A	api/index.py
M	backend/app/core/graph_data.py
M	backend/app/tests/test_graph_data.py
M	docs/FRONTEND_HANDOFF.md
M	docs/HANDOFF.md
M	docs/PLAN.md
M	frontend/src/lib/api-client.ts
A	requirements.txt
A	vercel.json
```

- [ ] **Step 4: Check staged diff hygiene**

Run:

```powershell
git diff --cached --check
```

Expected:

```text
```

No output and exit code 0. CRLF warnings are acceptable if the command exits 0.

- [ ] **Step 5: Commit deploy state**

Run:

```powershell
git commit -m "feat(deploy): vercel preview state with graph-timeout fix"
```

Expected:

```text
[codex/interpolation-backend-v1 <sha>] feat(deploy): vercel preview state with graph-timeout fix
```

Do not stage `.impeccable/critique/2026-05-26T13-30-00Z__frontend-audit.md`.

### Task 2: Commit Repository Hygiene Cleanup

**Files:**
- Modify: `frontend/.gitignore`
- Modify: `.gitignore`
- Git index only: `Lecture/~$cumentation.docx`

- [ ] **Step 1: Verify the tracked Word lock file exists in git**

Run:

```powershell
git ls-files Lecture/
```

Expected output includes:

```text
Lecture/~$cumentation.docx
```

- [ ] **Step 2: Add ignore coverage for Word lock files and the Vite log**

Edit `.gitignore` so it contains these lines near other local artifacts:

```gitignore
~$*.docx
Lecture/~$*.docx
```

Edit `frontend/.gitignore` so the Logs section contains this explicit line:

```gitignore
vite-open-program.log
```

- [ ] **Step 3: Untrack the Word lock file without deleting the local file**

Run:

```powershell
git rm --cached -- "Lecture/~$cumentation.docx"
```

Expected:

```text
rm 'Lecture/~$cumentation.docx'
```

- [ ] **Step 4: Verify the local Word lock file was not deleted**

Run:

```powershell
Test-Path -LiteralPath "Lecture/~$cumentation.docx"
```

Expected:

```text
True
```

If the file is absent because Word already removed it, continue; the important state is that git no longer tracks it and future lock files are ignored.

- [ ] **Step 5: Stage hygiene changes**

Run:

```powershell
git add -- .gitignore frontend/.gitignore
git add -u -- "Lecture/~$cumentation.docx"
git diff --cached --name-status
```

Expected staged files:

```text
M	.gitignore
D	Lecture/~$cumentation.docx
M	frontend/.gitignore
```

- [ ] **Step 6: Check staged diff hygiene**

Run:

```powershell
git diff --cached --check
```

Expected no output and exit code 0.

- [ ] **Step 7: Commit hygiene cleanup**

Run:

```powershell
git commit -m "chore(repo): ignore local lock and vite log artifacts"
```

Expected:

```text
[codex/interpolation-backend-v1 <sha>] chore(repo): ignore local lock and vite log artifacts
```

### Task 3: Run Local Verification For Preview Gate

**Files:**
- No edits.

- [ ] **Step 1: Confirm only allowed local artifacts remain dirty**

Run:

```powershell
git status --short
```

Expected:

```text
?? .impeccable/critique/2026-05-26T13-30-00Z__frontend-audit.md
```

If `Lecture/~$cumentation.docx` appears as untracked, verify `.gitignore` rules and leave it untracked/ignored. If deploy files are still dirty, stop and inspect before testing.

- [ ] **Step 2: Run backend tests**

Run:

```powershell
Set-Location backend
.\.venv\Scripts\python.exe -m pytest
```

Expected:

```text
74 passed, 1 warning
```

The exact duration may differ. Stop on any failure.

- [ ] **Step 3: Run backend ruff**

Run:

```powershell
.\.venv\Scripts\python.exe -m ruff check .
```

Expected:

```text
All checks passed!
```

- [ ] **Step 4: Run frontend lint**

Run:

```powershell
Set-Location ..\frontend
npm run lint
```

Expected:

```text
```

Exit code 0 and no lint errors. Stop on any failure.

- [ ] **Step 5: Run frontend build**

Run:

```powershell
npm run build
```

Expected:

```text
✓ built
```

The Vite chunk-size warning is acceptable if the build exits 0.

- [ ] **Step 6: Run frontend tests**

Run:

```powershell
npm test
```

Expected:

```text
Test Files  12 passed
Tests  57 passed
```

Exact spacing and duration may differ. Stop on any failure.

- [ ] **Step 7: Return to repo root**

Run:

```powershell
Set-Location ..
```

Expected current directory:

```text
C:\Users\Emmy Lou\Documents\New project 3
```

### Task 4: Push And Deploy Preview

**Files:**
- No edits.

- [ ] **Step 1: Push the branch**

Run:

```powershell
git push -u origin codex/interpolation-backend-v1
```

Expected:

```text
branch 'codex/interpolation-backend-v1' set up to track 'origin/codex/interpolation-backend-v1'
```

or an up-to-date/tracking confirmation. Stop on push failure.

- [ ] **Step 2: Deploy Vercel preview**

Run:

```powershell
npx vercel deploy --yes
```

Expected:

```text
https://<new-preview-url>.vercel.app
```

Capture the preview URL and any deployment id shown in the Vercel output. Stop on deploy failure and record the failure output in `docs/HANDOFF.md` only after the user approves a docs-only failure record.

### Task 5: Smoke-Test Preview Endpoints

**Files:**
- No edits until all smoke commands pass.

Replace `<new-url>` with the exact preview URL from Task 4.

- [ ] **Step 1: Smoke-test health**

Run:

```powershell
npx vercel curl /health --deployment <new-url>
```

Expected HTTP status: 200.

Expected JSON shape:

```json
{
  "status": "ok",
  "service": "interpolation-backend",
  "version": "0.1.0"
}
```

If Vercel returns SSO or deployment-protection HTML instead of JSON, stop and report that preview access is gated.

- [ ] **Step 2: Smoke-test function validation**

Run:

```powershell
npx vercel curl /api/validate-function --deployment <new-url> -- --request POST --header "Content-Type: application/json" --data '{"function":"sin(x)"}'
```

Expected HTTP status: 200.

Expected JSON fields:

```json
{
  "status": "ok",
  "function": "sin(x)",
  "normalized_expression": "sin(x)",
  "allowed_symbols": ["x"]
}
```

The `latex` string may be `\sin{\left(x \right)}` or equivalent SymPy LaTeX output.

- [ ] **Step 3: Smoke-test Linear Lagrange interpolation**

Run:

```powershell
npx vercel curl /api/interpolate --deployment <new-url> -- --request POST --header "Content-Type: application/json" --data '{"mode":"points","points":[["2","4"],["5","1"]],"methods":["lagrange"],"precision":50,"exact":true,"evaluation_x":["3"],"graph":true}'
```

Expected HTTP status: 200.

Expected JSON assertions:

```text
status == "ok"
response_version == "1.0"
input_summary.mode == "points"
methods.lagrange.status == "ok"
evaluations[0].x == "3"
evaluations[0].best_P_x == "3"
graph_data.source_method == "lagrange"
```

- [ ] **Step 4: Smoke-test Newton Forward cos(x) interpolation**

Run:

```powershell
npx vercel curl /api/interpolate --deployment <new-url> -- --request POST --header "Content-Type: application/json" --data '{"mode":"x_values_with_function","x_values":["1.0","1.3","1.6","1.9","2.2"],"function":"cos(x)","methods":["newton_forward"],"precision":50,"exact":true,"evaluation_x":["1.5"],"graph":true}'
```

Expected HTTP status: 200.

Expected JSON assertions:

```text
status == "ok"
methods.newton_forward.status == "ok"
methods.newton_forward.forward_difference_table is non-empty
evaluations[0].x == "1.5"
evaluations[0].best_method == "newton_forward"
graph_data.source_method == "newton_forward"
```

### Task 6: Record Preview Evidence

**Files:**
- Modify: `docs/HANDOFF.md`
- Modify: `docs/PLAN.md`

- [ ] **Step 1: Add preview evidence to `docs/HANDOFF.md`**

Append a new dated entry with this structure, replacing values with actual output:

```markdown
## 2026-05-26 — Post-Audit Preview Deploy

### Commands Run

- `git push -u origin codex/interpolation-backend-v1` — success.
- `npx vercel deploy --yes` — success.
- `npx vercel curl /health --deployment <new-url>` — HTTP 200.
- `npx vercel curl /api/validate-function --deployment <new-url> -- --request POST --header "Content-Type: application/json" --data '{"function":"sin(x)"}'` — HTTP 200.
- `npx vercel curl /api/interpolate --deployment <new-url> -- --request POST --header "Content-Type: application/json" --data '{"mode":"points","points":[["2","4"],["5","1"]],"methods":["lagrange"],"precision":50,"exact":true,"evaluation_x":["3"],"graph":true}'` — HTTP 200.
- `npx vercel curl /api/interpolate --deployment <new-url> -- --request POST --header "Content-Type: application/json" --data '{"mode":"x_values_with_function","x_values":["1.0","1.3","1.6","1.9","2.2"],"function":"cos(x)","methods":["newton_forward"],"precision":50,"exact":true,"evaluation_x":["1.5"],"graph":true}'` — HTTP 200.

### Preview

- URL: `<new-url>`
- Deployment id: `<deployment-id-or-not-shown>`
- Production promoted: No.

### Smoke Results

- `/health`: returned JSON status `ok`.
- `/api/validate-function`: accepted `sin(x)`.
- Linear Lagrange interpolate: returned `best_P_x == "3"`.
- Newton Forward cos(x): returned method status `ok` and graph data.

### Remaining Risks

- Preview access mode still needs Public/Professor Gate confirmation.
- Stirling centered-formula correction remains in the RC Gate.
- `input_summary.sorted_nodes` wiring remains in the RC Gate.
```

- [ ] **Step 2: Add preview milestone evidence to `docs/PLAN.md`**

Update the Vercel preview milestone so it includes:

```markdown
- Post-audit preview URL: `<new-url>`
- Deployment id: `<deployment-id-or-not-shown>`
- Verified 2026-05-26 with `/health`, `/api/validate-function`, Linear Lagrange `/api/interpolate`, and Newton Forward cos(x) `/api/interpolate`.
- Production promotion remains pending explicit user approval.
```

- [ ] **Step 3: Stage only post-deploy docs**

Run:

```powershell
git add -- docs/HANDOFF.md docs/PLAN.md
git diff --cached --name-status
```

Expected staged files:

```text
M	docs/HANDOFF.md
M	docs/PLAN.md
```

- [ ] **Step 4: Check staged docs diff**

Run:

```powershell
git diff --cached --check
```

Expected no output and exit code 0.

- [ ] **Step 5: Commit post-deploy evidence**

Run:

```powershell
git commit -m "docs: record post-audit preview deploy"
```

Expected:

```text
[codex/interpolation-backend-v1 <sha>] docs: record post-audit preview deploy
```

- [ ] **Step 6: Push post-deploy docs**

Run:

```powershell
git push
```

Expected push success.

- [ ] **Step 7: Report Preview Gate final state**

Run:

```powershell
git status --short
git log --oneline -10
```

Expected:

- Only intentionally untracked ignored/local artifacts remain.
- The latest commits include deploy state, hygiene cleanup, and post-deploy docs.

---

## Release Candidate Gate

### Task 7: Correct Stirling Centered-Difference Evaluation

**Files:**
- Modify: `backend/app/core/methods/newton_finite.py`
- Modify: `backend/app/tests/test_newton_finite.py`
- Modify if contract shape changes: `docs/API_CONTRACT.md`
- Modify if frontend-relevant shape changes: `docs/FRONTEND_HANDOFF.md`

- [ ] **Step 1: Add failing Stirling tests**

Edit `backend/app/tests/test_newton_finite.py` and replace `test_stirling_returns_centered_payload_for_lecture_nodes` with:

```python
def test_stirling_returns_centered_payload_for_lecture_nodes() -> None:
    result = build_stirling(_lecture_nodes(), precision=50, evaluation_x=["1.5"])

    evaluation = result["evaluations"][0]

    assert result["center_index"] == 2
    assert result["center_x"] == "8/5"
    assert evaluation["x"] == "1.5"
    assert evaluation["s"] == "-1/3"
    assert evaluation["target_guidance"]["recommended"] == "stirling"
    assert evaluation["terms"]
    assert [term["order"] for term in evaluation["terms"]] == [0, 1, 2, 3, 4]
    assert (
        sp.Abs(sp.Rational(evaluation["value"]) - sp.Rational("0.0707372"))
        < sp.Rational("1e-7")
    )
    assert result["centered_difference_table"][2][0] == "2277011/5000000"
    assert result["centered_difference_table"][1][1] == "-823419/5000000"
    assert result["centered_difference_table"][2][1] == "-867918/5000000"
    assert result["centered_difference_table"][1][2] == "-121997/12500000"
    assert result["centered_difference_table"][0][3] == "125717/5000000"
    assert result["centered_difference_table"][1][3] == "30896/1250000"
    assert result["centered_difference_table"][0][4] == "-2133/5000000"
```

Add this separate regression test to the same file:

```python
def test_stirling_value_matches_lagrange_interpolant_without_calling_lagrange_fallback() -> None:
    result = build_stirling(_lecture_nodes(), precision=50, evaluation_x=["1.5"])

    terms = [sp.Rational(term["value"]) for term in result["evaluations"][0]["terms"]]
    summed_terms = sum(terms, sp.Integer(0))

    assert sp.simplify(summed_terms - sp.Rational(result["evaluations"][0]["value"])) == 0
    assert (
        sp.Abs(sp.Rational(result["evaluations"][0]["value"]) - sp.Rational("0.0707372"))
        < sp.Rational("1e-7")
    )
```

- [ ] **Step 2: Run the Stirling tests and verify failure**

Run:

```powershell
Set-Location backend
.\.venv\Scripts\python.exe -m pytest app/tests/test_newton_finite.py::test_stirling_returns_centered_payload_for_lecture_nodes app/tests/test_newton_finite.py::test_stirling_value_matches_lagrange_interpolant_without_calling_lagrange_fallback -v
```

Expected before implementation:

```text
FAILED
```

The failure should be because `evaluations[0]` has no `terms` and/or the returned value does not match `0.0707372`.

- [ ] **Step 3: Add centered-product helper functions**

Edit `backend/app/core/methods/newton_finite.py` and add these helpers after `_rising_product`:

```python
def _stirling_even_product(s: sp.Expr, order: int) -> sp.Expr:
    product = s**2
    for offset in range(1, order // 2):
        product *= s**2 - offset**2
    return sp.simplify(product)


def _stirling_odd_product(s: sp.Expr, order: int) -> sp.Expr:
    product = s
    for offset in range(1, (order + 1) // 2):
        product *= s**2 - offset**2
    return sp.simplify(product)


def _stirling_term(
    forward_table: list[list[sp.Expr | None]],
    *,
    center: int,
    order: int,
    s: sp.Expr,
) -> sp.Expr:
    if order == 0:
        value = forward_table[center][0]
        if value is None:
            raise InterpolationError("method_failed", "Missing center value for Stirling.")
        return value

    if order % 2 == 0:
        row = center - order // 2
        difference = forward_table[row][order]
        if difference is None:
            raise InterpolationError("method_failed", "Missing even centered difference.")
        return sp.simplify(_stirling_even_product(s, order) * difference / math.factorial(order))

    left_row = center - (order + 1) // 2
    right_row = left_row + 1
    left_difference = forward_table[left_row][order]
    right_difference = forward_table[right_row][order]
    if left_difference is None or right_difference is None:
        raise InterpolationError("method_failed", "Missing odd centered difference pair.")
    averaged_difference = sp.simplify((left_difference + right_difference) / 2)
    return sp.simplify(
        _stirling_odd_product(s, order) * averaged_difference / math.factorial(order)
    )
```

- [ ] **Step 4: Replace the Lagrange fallback in `build_stirling`**

In `backend/app/core/methods/newton_finite.py`, replace this block:

```python
        value = _lagrange_reference_value(nodes, target_value)
        evaluations.append(
            {
                "x": target,
                "s": format_value(s, precision=precision),
                "value": format_value(value, precision=precision),
                "target_guidance": guidance,
            }
        )
```

with:

```python
        value = sp.Integer(0)
        terms = []
        for order in range(len(nodes)):
            term = _stirling_term(forward_table, center=center, order=order, s=s)
            value += term
            terms.append({"order": order, "value": format_value(term, precision=precision)})
        evaluations.append(
            {
                "x": target,
                "s": format_value(s, precision=precision),
                "value": format_value(sp.simplify(value), precision=precision),
                "terms": terms,
                "target_guidance": guidance,
            }
        )
```

- [ ] **Step 5: Update Stirling steps text**

In `build_stirling`, replace the `steps` list with:

```python
        "steps": [
            "Verify that x-values are equally spaced and that the node count is odd.",
            "Choose the center node and compute s = (x - x_center) / h.",
            "Use Stirling's centered formula: even orders use the centered even difference; odd orders use the average of the adjacent odd differences.",
        ],
```

- [ ] **Step 6: Remove the unused Lagrange helper**

Delete `_lagrange_reference_value` from `backend/app/core/methods/newton_finite.py`.

- [ ] **Step 7: Run Stirling tests**

Run:

```powershell
.\.venv\Scripts\python.exe -m pytest app/tests/test_newton_finite.py -v
```

Expected:

```text
4 passed
```

The count may increase if additional tests exist by execution time. Stop on failure.

- [ ] **Step 8: Run backend verification**

Run:

```powershell
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m ruff check .
```

Expected:

```text
74 passed
All checks passed!
```

The test count may be higher after new tests. The Pydantic deprecation warning may remain until Task 9.

- [ ] **Step 9: Update API docs if the Stirling `terms` field was not already documented**

If `docs/API_CONTRACT.md` does not list `methods.stirling.evaluations[].terms`, add this exact bullet under the Stirling/equal-spacing method response section:

```markdown
- `evaluations[].terms`: array of `{ order: number, value: string }` terms summed by the centered Stirling formula. Odd-order terms use the average of the adjacent odd differences; even-order terms use the centered even difference.
```

If the field is already documented, do not edit `docs/API_CONTRACT.md`.

- [ ] **Step 10: Commit Stirling correction**

Run:

```powershell
git status --short
git add -- backend/app/core/methods/newton_finite.py backend/app/tests/test_newton_finite.py docs/API_CONTRACT.md docs/FRONTEND_HANDOFF.md
git diff --cached --name-status
git diff --cached --check
git commit -m "fix(stirling): compute via centered-difference formula"
```

Expected staged files include only files actually changed. If `docs/API_CONTRACT.md` or `docs/FRONTEND_HANDOFF.md` did not change, omit them from `git add`.

### Task 8: Wire `input_summary.sorted_nodes`

**Files:**
- Modify: `backend/app/core/service.py`
- Modify: `backend/app/tests/test_api.py`
- Create: `frontend/src/components/results/SummaryCard.test.tsx`
- Modify only if fixture needs explicit sorted state: `frontend/src/test/interpolate-response.fixtures.ts`
- Modify if behavior is contract-relevant: `docs/API_CONTRACT.md`
- Modify if frontend handoff needs note: `docs/FRONTEND_HANDOFF.md`

- [ ] **Step 1: Add backend failing test for summary reordering**

Add this test to `backend/app/tests/test_api.py` after `test_interpolate_cubic_spline_method_contract`:

```python
def test_interpolate_cubic_spline_reordered_nodes_sets_input_summary_flag() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/interpolate",
        json={
            "mode": "points",
            "points": [["3", "5"], ["1", "2"], ["2", "3"]],
            "methods": ["cubic_spline"],
            "method_options": {"cubic_spline": {"boundary_condition": "natural"}},
            "evaluation_x": ["5/2"],
            "precision": 50,
            "exact": True,
        },
    )

    body = response.json()

    assert response.status_code == 200
    assert body["status"] == "ok"
    assert body["input_summary"]["sorted_nodes"] is True
    assert body["methods"]["cubic_spline"]["warnings"][0]["code"] == "nodes_reordered"
    assert body["methods"]["cubic_spline"]["ordered_nodes"] == [
        {"index": 1, "x": "1", "y": "2"},
        {"index": 2, "x": "2", "y": "3"},
        {"index": 0, "x": "3", "y": "5"},
    ]
```

- [ ] **Step 2: Run backend test and verify failure**

Run:

```powershell
Set-Location backend
.\.venv\Scripts\python.exe -m pytest app/tests/test_api.py::test_interpolate_cubic_spline_reordered_nodes_sets_input_summary_flag -v
```

Expected before implementation:

```text
FAILED
```

The expected failure is `False is True` for `input_summary.sorted_nodes`.

- [ ] **Step 3: Implement summary flag in `service.py`**

In `backend/app/core/service.py`, add this helper after `_method_failure`:

```python
def _nodes_reordered(method_results: dict[str, dict[str, Any]]) -> bool:
    for result in method_results.values():
        for warning in result.get("warnings", []):
            if warning.get("code") == "nodes_reordered":
                return True
    return False
```

In `interpolate`, replace:

```python
            "sorted_nodes": problem.sorted_nodes,
```

with:

```python
            "sorted_nodes": problem.sorted_nodes or _nodes_reordered(method_results),
```

- [ ] **Step 4: Run backend summary test**

Run:

```powershell
.\.venv\Scripts\python.exe -m pytest app/tests/test_api.py::test_interpolate_cubic_spline_reordered_nodes_sets_input_summary_flag -v
```

Expected:

```text
PASSED
```

- [ ] **Step 5: Add frontend SummaryCard badge test**

Create `frontend/src/components/results/SummaryCard.test.tsx` with:

```tsx
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { SummaryCard } from "./SummaryCard"
import { cubicSplineResponse } from "@/test/interpolate-response.fixtures"

describe("SummaryCard", () => {
  it("renders the reordered badge when input_summary.sorted_nodes is true", () => {
    render(
      <SummaryCard
        data={{
          ...cubicSplineResponse,
          input_summary: {
            ...cubicSplineResponse.input_summary,
            sorted_nodes: true,
          },
        }}
      />,
    )

    expect(screen.getByText("Reordered")).toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Run frontend SummaryCard test**

Run:

```powershell
Set-Location ..\frontend
npm test -- SummaryCard
```

Expected:

```text
SummaryCard.test.tsx
1 passed
```

- [ ] **Step 7: Run backend and frontend verification**

Run:

```powershell
Set-Location ..\backend
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m ruff check .
Set-Location ..\frontend
npm test
```

Expected:

- Backend tests pass.
- Ruff passes.
- Frontend tests pass with one additional test file/test.

- [ ] **Step 8: Update API contract docs**

In `docs/API_CONTRACT.md`, update the `input_summary.sorted_nodes` description to state:

```markdown
- `sorted_nodes`: boolean. `true` when one or more selected methods reordered the input nodes for computation, currently emitted for natural cubic spline when input points are not already sorted by increasing x-value.
```

In `docs/FRONTEND_HANDOFF.md`, add a note:

```markdown
- `input_summary.sorted_nodes` is now live. The SummaryCard `Reordered` badge should appear when the backend sets this field to `true`; method-level `nodes_reordered` warnings still carry the ordered index details.
```

- [ ] **Step 9: Commit sorted_nodes wiring**

Run:

```powershell
Set-Location ..
git add -- backend/app/core/service.py backend/app/tests/test_api.py frontend/src/components/results/SummaryCard.test.tsx docs/API_CONTRACT.md docs/FRONTEND_HANDOFF.md
git diff --cached --check
git commit -m "feat(api): surface cubic spline reordering in input summary"
```

Expected commit success.

### Task 9: Migrate Pydantic Config And Tighten Method Options

**Files:**
- Modify: `backend/app/schemas.py`
- Modify: `backend/app/tests/test_schemas.py`
- Modify: `docs/API_CONTRACT.md` if validation behavior wording changes

- [ ] **Step 1: Add schema tests for method option type rejection**

Add these tests to `backend/app/tests/test_schemas.py`:

```python
def test_taylor_center_must_be_a_string() -> None:
    with pytest.raises(ValidationError):
        InterpolateRequest(
            mode="x_values_with_function",
            x_values=["0", "1"],
            function="cos(x)",
            methods=["taylor"],
            method_options={"taylor": {"center": 0, "order": 3}},
        )


def test_cubic_spline_boundary_condition_must_be_natural_literal() -> None:
    with pytest.raises(ValidationError):
        InterpolateRequest(
            mode="points",
            points=[["1", "2"], ["2", "3"], ["3", "5"]],
            methods=["cubic_spline"],
            method_options={"cubic_spline": {"boundary_condition": "clamped"}},
        )


def test_unknown_method_options_are_rejected() -> None:
    with pytest.raises(ValidationError):
        InterpolateRequest(
            mode="points",
            points=[["1", "2"], ["2", "3"]],
            methods=["lagrange"],
            method_options={"lagrange": {"unexpected": True}},
        )
```

- [ ] **Step 2: Run schema tests and verify failure**

Run:

```powershell
Set-Location backend
.\.venv\Scripts\python.exe -m pytest app/tests/test_schemas.py -v
```

Expected before implementation:

```text
FAILED
```

At least `test_taylor_center_must_be_a_string` and `test_unknown_method_options_are_rejected` should fail before schema hardening.

- [ ] **Step 3: Replace legacy Pydantic config**

In `backend/app/schemas.py`, replace:

```python
from typing import Any, Literal

from pydantic import BaseModel, Field
```

with:

```python
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, StrictStr
```

Replace:

```python
class StrictModel(BaseModel):
    class Config:
        extra = "forbid"
```

with:

```python
class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")
```

- [ ] **Step 4: Add strict method option models**

In `backend/app/schemas.py`, add these models after `DerivativeData`:

```python
class TaylorMethodOptions(StrictModel):
    center: StrictStr
    order: int = Field(ge=0, le=20)


class CubicSplineMethodOptions(StrictModel):
    boundary_condition: Literal["natural"] = "natural"


class MethodOptions(StrictModel):
    taylor: TaylorMethodOptions | None = None
    cubic_spline: CubicSplineMethodOptions | None = None
```

In `InterpolateRequest`, replace:

```python
    method_options: dict[str, dict[str, Any]] = Field(default_factory=dict)
```

with:

```python
    method_options: MethodOptions = Field(default_factory=MethodOptions)
```

- [ ] **Step 5: Preserve dictionary behavior for service normalization**

In `backend/app/core/normalization.py`, replace:

```python
        method_options=dict(request.method_options),
```

with:

```python
        method_options=request.method_options.model_dump(exclude_none=True),
```

- [ ] **Step 6: Run schema tests**

Run:

```powershell
.\.venv\Scripts\python.exe -m pytest app/tests/test_schemas.py -v
```

Expected:

```text
PASSED
```

- [ ] **Step 7: Run backend tests with deprecations as errors**

Run:

```powershell
.\.venv\Scripts\python.exe -m pytest -W error::DeprecationWarning
.\.venv\Scripts\python.exe -m ruff check .
```

Expected:

- No Pydantic deprecation warning.
- All tests pass.
- Ruff passes.

- [ ] **Step 8: Update API contract validation wording**

In `docs/API_CONTRACT.md`, update the method options section so it states:

```markdown
`method_options` only accepts the implemented option blocks:

- `taylor`: `{ "center": "<numeric string>", "order": <integer 0..20> }`
- `cubic_spline`: `{ "boundary_condition": "natural" }`

Unknown method option blocks and extra keys inside known option blocks are rejected by schema validation.
```

- [ ] **Step 9: Commit schema hardening**

Run:

```powershell
git add -- backend/app/schemas.py backend/app/core/normalization.py backend/app/tests/test_schemas.py docs/API_CONTRACT.md
git diff --cached --check
git commit -m "refactor(schemas): use pydantic v2 config and strict method options"
```

Expected commit success.

### Task 10: Add Guardrail Tests

**Files:**
- Modify: `backend/app/tests/test_api.py`
- Modify: `backend/app/tests/test_validation.py` only if high-degree coverage needs a direct API-level assertion

- [ ] **Step 1: Add method disagreement warning test**

Add this test to `backend/app/tests/test_api.py`:

```python
def test_method_disagreement_warning_when_taylor_and_lagrange_differ() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/interpolate",
        json={
            "mode": "x_values_with_function",
            "function": "cos(x)",
            "x_values": ["0", "1"],
            "methods": ["lagrange", "taylor"],
            "method_options": {"taylor": {"center": "0", "order": 0}},
            "evaluation_x": ["1"],
            "precision": 50,
            "exact": True,
        },
    )

    body = response.json()
    warning_codes = {warning["code"] for warning in body["warnings"]}

    assert response.status_code == 200
    assert body["status"] == "ok"
    assert "method_disagreement_warning" in warning_codes
```

- [ ] **Step 2: Run the new guardrail test**

Run:

```powershell
Set-Location backend
.\.venv\Scripts\python.exe -m pytest app/tests/test_api.py::test_method_disagreement_warning_when_taylor_and_lagrange_differ -v
```

Expected:

```text
PASSED
```

If it fails because both methods agree for the chosen value, change the evaluation target to `"1/2"` and keep Taylor order 0 so Taylor returns `1` while Lagrange returns the line through `cos(0)` and `cos(1)`.

- [ ] **Step 3: Confirm high-degree warnings are already covered**

Run:

```powershell
.\.venv\Scripts\python.exe -m pytest app/tests/test_validation.py::test_high_degree_equally_spaced_nodes_warn -v
```

Expected:

```text
PASSED
```

No new high-degree test is required unless this test is absent or failing.

- [ ] **Step 4: Run backend verification**

Run:

```powershell
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m ruff check .
```

Expected all backend tests and ruff pass.

- [ ] **Step 5: Commit guardrail tests**

Run:

```powershell
git add -- backend/app/tests/test_api.py backend/app/tests/test_validation.py
git diff --cached --check
git commit -m "test(api): cover method disagreement and warning guardrails"
```

Expected commit success. If `backend/app/tests/test_validation.py` did not change, omit it from `git add`.

### Task 11: RC Gate Documentation And Verification

**Files:**
- Modify: `docs/HANDOFF.md`
- Modify: `docs/PLAN.md`
- Modify if changed in previous tasks: `docs/API_CONTRACT.md`
- Modify if frontend-relevant: `docs/FRONTEND_HANDOFF.md`

- [ ] **Step 1: Run full RC verification**

Run:

```powershell
Set-Location backend
.\.venv\Scripts\python.exe -m pytest -W error::DeprecationWarning
.\.venv\Scripts\python.exe -m ruff check .
Set-Location ..\frontend
npm run lint
npm run build
npm test
Set-Location ..
```

Expected:

- Backend pytest passes with no deprecation warning.
- Ruff passes.
- Frontend lint passes.
- Frontend build passes; Vite chunk warning is acceptable.
- Frontend tests pass.

- [ ] **Step 2: Update handoff with RC Gate evidence**

Append this structure to `docs/HANDOFF.md`:

```markdown
## 2026-05-26 — RC Gate Verification

### Completed

- Stirling now computes through the centered-difference formula and returns summed `terms`.
- `input_summary.sorted_nodes` is live for cubic spline node reordering.
- Pydantic schema config uses v2 `model_config`.
- `method_options` rejects unknown blocks and non-string numeric fields at schema validation.
- Guardrail tests cover method disagreement warning behavior.

### Commands Run

- `backend\.venv\Scripts\python.exe -m pytest -W error::DeprecationWarning` — success.
- `backend\.venv\Scripts\python.exe -m ruff check .` — success.
- `npm run lint` in `frontend/` — success.
- `npm run build` in `frontend/` — success, Vite chunk warning only if present.
- `npm test` in `frontend/` — success.

### Remaining RC Risks

- Production promotion has not been requested or performed.
- Public/professor access mode still needs explicit decision.
```

- [ ] **Step 3: Update plan milestones**

In `docs/PLAN.md`, mark the RC Gate items complete with:

```markdown
- Stirling centered-formula correction: Completed 2026-05-26.
- `input_summary.sorted_nodes` contract wiring: Completed 2026-05-26.
- Pydantic v2 schema config and strict method options: Completed 2026-05-26.
- Guardrail warning tests: Completed 2026-05-26.
```

- [ ] **Step 4: Commit RC docs**

Run:

```powershell
git add -- docs/HANDOFF.md docs/PLAN.md docs/API_CONTRACT.md docs/FRONTEND_HANDOFF.md
git diff --cached --check
git commit -m "docs: record v2 rc gate verification"
```

Expected commit success. Omit unchanged docs from `git add`.

---

## Public/Professor Gate

### Task 12: Create Release Notes

**Files:**
- Create: `RELEASE_NOTES.md`
- Modify: `docs/HANDOFF.md`
- Modify: `docs/PLAN.md`

- [ ] **Step 1: Create release notes**

Create `RELEASE_NOTES.md` with:

```markdown
# V2.0 Release Notes

## Features

- V1 interpolation methods: Lagrange, Newton divided differences, Barycentric Lagrange, and Neville.
- Equal-spacing methods: Newton Forward, Newton Backward, and Stirling centered-difference interpolation.
- Derivative-data methods: Hermite divided-difference and Hermite basis form for first derivatives.
- Function-derivative method: Taylor/Maclaurin expansion with configured center and order.
- Piecewise method: natural cubic spline with segment coefficients and continuity checks.
- Graph-data generation for frontend rendering; the backend does not render graphs.
- Exact rational mode and high-precision numeric mode.
- Educational steps, LaTeX forms, warnings, and frontend handoff metadata.

## Deferred

- Osculating interpolation remains accepted by schema but returns `method_not_implemented`.
- Cubic spline boundary conditions other than `natural` remain deferred.
- Production promotion requires explicit user approval.

## Verification

- Backend pytest: recorded in `docs/HANDOFF.md`.
- Backend ruff: recorded in `docs/HANDOFF.md`.
- Frontend lint/build/test: recorded in `docs/HANDOFF.md`.
- Vercel preview smoke: recorded in `docs/HANDOFF.md`.

## Known Risks

- Public/professor access depends on Vercel deployment protection settings.
- Bundle size may still trigger Vite chunk-size warning.
```

- [ ] **Step 2: Commit release notes**

Run:

```powershell
git add -- RELEASE_NOTES.md
git diff --cached --check
git commit -m "docs: add v2 release notes"
```

Expected commit success.

### Task 13: Public Access Decision And Final Smoke

**Files:**
- Modify: `docs/HANDOFF.md`
- Modify: `docs/PLAN.md`

- [ ] **Step 1: Stop for access-mode decision**

Ask the user:

```text
Which access mode should this release use: keep Vercel SSO protection, create/share a bypass link, or make the preview public?
```

Do not guess. Do not promote production.

- [ ] **Step 2: Run final API smoke against the exact sharing URL**

After the user chooses access mode and provides any needed bypass URL/token, run the same four smoke commands from Task 5 against the exact URL that will be shared.

Expected:

- HTTP 200 for all four commands.
- JSON contract matches Task 5 expected fields.

- [ ] **Step 3: Browser smoke**

Use the Browser plugin or Playwright only if the URL is accessible from the local environment. Check:

```text
1. Load the shared URL.
2. Run the Linear Lagrange quick-start flow.
3. Run the cos(x) Newton Forward flow with graph enabled.
4. Confirm the result tabs render without blank graph or console errors.
```

Record observed result. If SSO blocks browser smoke, record the access block honestly.

- [ ] **Step 4: Record public/professor gate evidence**

Append to `docs/HANDOFF.md`:

```markdown
## 2026-05-26 — Public/Professor Gate

### Access Mode

- Selected mode: `<SSO | bypass link | public preview>`
- Shared URL: `<url>`
- Production promoted: No.

### Final Smoke

- API health: `<result>`
- API validate-function: `<result>`
- API Linear Lagrange: `<result>`
- API Newton Forward cos(x): `<result>`
- Browser smoke: `<result>`
```

Update `docs/PLAN.md` with the same URL and access mode.

- [ ] **Step 5: Commit public/professor docs**

Run:

```powershell
git add -- docs/HANDOFF.md docs/PLAN.md
git diff --cached --check
git commit -m "docs: record public preview access and final smoke"
git push
```

Expected commit and push success.

---

## Polish Gate

### Task 14: Add Color-Blind-Safe Graph Line Differentiation

**Files:**
- Modify: `frontend/src/components/results/GraphCard.tsx`

- [ ] **Step 1: Inspect existing graph line definitions**

Run:

```powershell
rg -n "Line|strokeDasharray|dataKey|P_x|f_x" frontend/src/components/results/GraphCard.tsx
```

Expected: locate the Recharts `<Line>` components for `f_x` and `P_x`.

- [ ] **Step 2: Modify line styles**

In `frontend/src/components/results/GraphCard.tsx`, keep `P_x` solid and add a dashed style to the `f_x` line:

```tsx
strokeDasharray="5 4"
```

The `f_x` line should retain its current color and all existing props. Do not change graph-data parsing.

- [ ] **Step 3: Run frontend tests and build**

Run:

```powershell
Set-Location frontend
npm test -- GraphCard
npm run build
Set-Location ..
```

Expected tests/build pass.

- [ ] **Step 4: Commit graph accessibility polish**

Run:

```powershell
git add -- frontend/src/components/results/GraphCard.tsx
git diff --cached --check
git commit -m "feat(frontend): differentiate graph lines without relying on color"
```

Expected commit success.

### Task 15: Add Best-Method Rationale Tooltip

**Files:**
- Modify: `frontend/src/components/results/EvaluationTable.tsx`
- Test if existing pattern supports it: create or modify `frontend/src/components/results/EvaluationTable.test.tsx`

- [ ] **Step 1: Add stable rationale copy**

Use this exact rationale text:

```text
Best method is selected by backend priority among available successful methods: Hermite, Taylor, spline, stable barycentric, Newton/Lagrange, then target-specific methods.
```

Add it as a `title` attribute or an accessible tooltip to the existing best-method chip in `EvaluationTable.tsx`. Do not alter backend selection priority.

- [ ] **Step 2: Add/modify frontend test**

If no `EvaluationTable.test.tsx` exists, create it with:

```tsx
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { EvaluationTable } from "./EvaluationTable"
import { linearPointsResponse } from "@/test/interpolate-response.fixtures"
import { DisplayDigitsProvider } from "@/lib/display-digits"

describe("EvaluationTable", () => {
  it("surfaces backend best-method selection rationale", () => {
    render(
      <DisplayDigitsProvider>
        <EvaluationTable
          evaluations={linearPointsResponse.evaluations}
          methodsRequested={linearPointsResponse.input_summary.methods_requested}
        />
      </DisplayDigitsProvider>,
    )

    expect(
      screen.getByTitle(
        "Best method is selected by backend priority among available successful methods: Hermite, Taylor, spline, stable barycentric, Newton/Lagrange, then target-specific methods.",
      ),
    ).toBeInTheDocument()
  })
})
```

If the component uses a tooltip library that does not expose `title`, adapt the test to assert the same rationale text is present in an accessible description.

- [ ] **Step 3: Run targeted frontend test**

Run:

```powershell
Set-Location frontend
npm test -- EvaluationTable
Set-Location ..
```

Expected pass.

- [ ] **Step 4: Commit best-method rationale**

Run:

```powershell
git add -- frontend/src/components/results/EvaluationTable.tsx frontend/src/components/results/EvaluationTable.test.tsx
git diff --cached --check
git commit -m "feat(frontend): explain best-method selection rationale"
```

Expected commit success.

### Task 16: Confirm Display Digits Hidden Input Accessibility

**Files:**
- Modify if needed: `frontend/src/components/DisplayDigitsControl.tsx`

- [ ] **Step 1: Inspect current radio implementation**

Run:

```powershell
Get-Content -Raw frontend/src/components/DisplayDigitsControl.tsx
```

Confirm whether Base UI hidden radio inputs already have accessible labels via visible text, `aria-label`, or `aria-labelledby`.

- [ ] **Step 2: Add label wiring only if absent**

If labels are absent, add stable ids and `aria-labelledby` so each radio item references visible text. Use this pattern for each option:

```tsx
const labelId = `display-digits-${option.value}`
```

and on the visible label:

```tsx
<span id={labelId}>{option.label}</span>
```

and on the radio item/root that Base UI exposes:

```tsx
aria-labelledby={labelId}
```

Do not change display-digit state or values.

- [ ] **Step 3: Run frontend tests**

Run:

```powershell
Set-Location frontend
npm test
npm run lint
Set-Location ..
```

Expected pass.

- [ ] **Step 4: Commit accessibility wiring if changed**

Run:

```powershell
git add -- frontend/src/components/DisplayDigitsControl.tsx
git diff --cached --check
git commit -m "fix(frontend): label display digit radio controls"
```

If no code change was needed, do not commit; instead record in `docs/HANDOFF.md` that inspection found existing label coverage.

### Task 17: Repo Weight Decision

**Files:**
- Modify only with explicit user approval: `.gitignore`
- Git index only with explicit user approval: `.impeccable/critique/screens/*`, `.kiro/*`
- Modify: `docs/HANDOFF.md`

- [ ] **Step 1: Measure tracked repo-weight candidates**

Run:

```powershell
git ls-files .impeccable/critique/screens | Measure-Object
git ls-files .kiro | Measure-Object
```

Record counts.

- [ ] **Step 2: Stop for user decision**

Ask:

```text
For repo-weight cleanup, should we keep tracked critique/tooling assets, untrack screenshots only, or untrack both screenshots and .kiro tooling assets?
```

Do not untrack anything without the user choosing.

- [ ] **Step 3: If user chooses screenshots-only cleanup**

Run:

```powershell
git rm --cached -r -- .impeccable/critique/screens
```

Add to `.gitignore`:

```gitignore
.impeccable/critique/screens/
```

- [ ] **Step 4: If user chooses screenshots plus .kiro cleanup**

Run:

```powershell
git rm --cached -r -- .impeccable/critique/screens .kiro
```

Add to `.gitignore`:

```gitignore
.impeccable/critique/screens/
.kiro/
```

- [ ] **Step 5: Commit chosen repo-weight cleanup**

Run:

```powershell
git add -- .gitignore docs/HANDOFF.md
git diff --cached --check
git commit -m "chore(repo): untrack local critique artifacts"
```

If the user chooses to keep all assets tracked, do not commit; record that decision in `docs/HANDOFF.md` only if the user asks for it.

### Task 18: Bundle Audit

**Files:**
- Modify only if an obvious low-risk trim is found: frontend source files identified by the audit
- Modify: `docs/HANDOFF.md`

- [ ] **Step 1: Capture baseline build output**

Run:

```powershell
Set-Location frontend
npm run build
Set-Location ..
```

Record chunk names and sizes from the build output.

- [ ] **Step 2: Inspect obvious bundle contributors**

Run:

```powershell
rg -n "from \"lucide-react\"|from '@base-ui|from \"@base-ui" frontend/src
```

Look for duplicate or unused imports. Do not refactor component architecture during this task.

- [ ] **Step 3: Apply only mechanical unused-import cleanup**

If an import is unused and TypeScript/ESLint confirms it, remove only that import. Do not replace libraries or redesign controls.

- [ ] **Step 4: Verify bundle audit changes**

Run:

```powershell
Set-Location frontend
npm run lint
npm run build
npm test
Set-Location ..
```

Expected pass.

- [ ] **Step 5: Record bundle evidence**

Append to `docs/HANDOFF.md`:

```markdown
## 2026-05-26 — Bundle Audit

- Baseline build: `<chunk output>`
- Changes made: `<none | unused imports removed from files>`
- Post-change build: `<chunk output>`
```

- [ ] **Step 6: Commit bundle audit docs/code**

Run:

```powershell
git add -- docs/HANDOFF.md frontend/src
git diff --cached --check
git commit -m "chore(frontend): record bundle audit"
```

If no code/docs changed, do not commit.

---

## Final Verification Before Completion

### Task 19: Full Release Train Verification

**Files:**
- No edits unless documenting a failure with user approval.

- [ ] **Step 1: Run backend final verification**

Run:

```powershell
Set-Location backend
.\.venv\Scripts\python.exe -m pytest -W error::DeprecationWarning
.\.venv\Scripts\python.exe -m ruff check .
```

Expected backend tests and ruff pass.

- [ ] **Step 2: Run frontend final verification**

Run:

```powershell
Set-Location ..\frontend
npm run lint
npm run build
npm test
```

Expected frontend lint/build/test pass.

- [ ] **Step 3: Return to repo root and inspect git state**

Run:

```powershell
Set-Location ..
git status --short
git log --oneline -15
```

Expected:

- No unintended dirty tracked files.
- Only intentionally ignored/local artifacts remain.
- Recent commits match the executed tasks.

- [ ] **Step 4: Push final branch**

Run:

```powershell
git push
```

Expected push success.

- [ ] **Step 5: Final report**

Report:

- Preview URL.
- Deployment id if available.
- Public/professor access mode.
- Smoke-test results.
- Backend verification output summary.
- Frontend verification output summary.
- Final `git log --oneline -10`.
- Any intentionally deferred Polish Gate items.
