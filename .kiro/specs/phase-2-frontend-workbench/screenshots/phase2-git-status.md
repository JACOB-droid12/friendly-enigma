# Phase 2 — `git status --short` capture (Task 7.14)

Spec: `.kiro/specs/phase-2-frontend-workbench` (R18.2, R18.5)
Working directory: repository root.
Captured 2026-05-26 immediately before task 7.15 (final commit).

## Command and exit

```powershell
PS C:\Users\Emmy Lou\Documents\New project 3> git status --short
```

Exit code: 0.

## Output (verbatim, default `git status --short`; recursive directories
not expanded by default)

```
 M Lecture/DOCUMENTATION_CHANGELOG.md
 D Lecture/GROUP-8-ASL-2024-FINAL-DOCUMENTATION-1.pdf
 D Lecture/download.jpg
 M docs/FRONTEND_HANDOFF.md
 M docs/HANDOFF.md
 M docs/PLAN.md
 M frontend/src/App.examples.test.tsx
 M frontend/src/App.tsx
 M frontend/src/components/ExamplesPanel.tsx
 M frontend/src/components/InputPanel.tsx
 M frontend/src/components/MethodSelector.tsx
 M frontend/src/components/results/GuidedExplanation.tsx
 M frontend/src/components/results/MethodDetails.tsx
 M frontend/src/components/results/PolynomialCard.tsx
 M frontend/src/components/results/ResultQualityGuide.tsx
 M frontend/src/components/results/SummaryCard.tsx
 M frontend/src/lib/api-types.ts
 M frontend/src/lib/warnings.ts
 M frontend/src/test/interpolate-response.fixtures.ts
?? .kiro/specs/phase-2-frontend-workbench/
?? Lecture/~$cumentation.docx
?? frontend/src/components/CubicSplineConfigBlock.tsx
?? frontend/src/components/DerivativeInputTable.tsx
?? frontend/src/components/EqualSpacingHint.tsx
?? frontend/src/components/InputPanel.MethodConfig.test.tsx
?? frontend/src/components/MethodSelector.catalog.ts
?? frontend/src/components/MethodSelector.test.tsx
?? frontend/src/components/TaylorConfigBlock.tsx
?? frontend/src/components/results/methods/
?? frontend/src/lib/equal-spacing.ts
```

## Expanded recursive view (`git status --untracked-files=all --short`)

The two untracked directories above (`.kiro/specs/phase-2-frontend-workbench/`
and `frontend/src/components/results/methods/`) expand as follows.

### `.kiro/specs/phase-2-frontend-workbench/`

```
?? .kiro/specs/phase-2-frontend-workbench/.config.kiro
?? .kiro/specs/phase-2-frontend-workbench/design.md
?? .kiro/specs/phase-2-frontend-workbench/requirements.md
?? .kiro/specs/phase-2-frontend-workbench/tasks.md
?? .kiro/specs/phase-2-frontend-workbench/screenshots/phase2-baseline-load.png
?? .kiro/specs/phase-2-frontend-workbench/screenshots/phase2-eq-01-happy.png
?? .kiro/specs/phase-2-frontend-workbench/screenshots/phase2-eq-01-methods.png
?? .kiro/specs/phase-2-frontend-workbench/screenshots/phase2-eq-02-ineligible-gate.png
?? .kiro/specs/phase-2-frontend-workbench/screenshots/phase2-eq-02-ineligible-with-sibling.png
?? .kiro/specs/phase-2-frontend-workbench/screenshots/phase2-eq-02-ineligible.png
?? .kiro/specs/phase-2-frontend-workbench/screenshots/phase2-eq-03-stirling-even.png
?? .kiro/specs/phase-2-frontend-workbench/screenshots/phase2-eq-results.md
?? .kiro/specs/phase-2-frontend-workbench/screenshots/phase2-hermite-01-happy.png
?? .kiro/specs/phase-2-frontend-workbench/screenshots/phase2-hermite-02-missing-derivative.png
?? .kiro/specs/phase-2-frontend-workbench/screenshots/phase2-hermite-03-basis-omitted.png
?? .kiro/specs/phase-2-frontend-workbench/screenshots/phase2-hermite-results.md
?? .kiro/specs/phase-2-frontend-workbench/screenshots/phase2-mobile-01-320px-hermite.png
?? .kiro/specs/phase-2-frontend-workbench/screenshots/phase2-mobile-01-320px.png
?? .kiro/specs/phase-2-frontend-workbench/screenshots/phase2-mobile-results.md
?? .kiro/specs/phase-2-frontend-workbench/screenshots/phase2-osculating-01-deferred.png
?? .kiro/specs/phase-2-frontend-workbench/screenshots/phase2-osculating-01-with-sibling.png
?? .kiro/specs/phase-2-frontend-workbench/screenshots/phase2-osculating-results.md
?? .kiro/specs/phase-2-frontend-workbench/screenshots/phase2-spline-01-happy.png
?? .kiro/specs/phase-2-frontend-workbench/screenshots/phase2-spline-02-unsupported-boundary.png
?? .kiro/specs/phase-2-frontend-workbench/screenshots/phase2-spline-results.md
?? .kiro/specs/phase-2-frontend-workbench/screenshots/phase2-taylor-01-happy.png
?? .kiro/specs/phase-2-frontend-workbench/screenshots/phase2-taylor-02-unsupported.png
?? .kiro/specs/phase-2-frontend-workbench/screenshots/phase2-taylor-results.md
?? .kiro/specs/phase-2-frontend-workbench/screenshots/phase2-v1-01-linear-lagrange.png
?? .kiro/specs/phase-2-frontend-workbench/screenshots/phase2-v1-02-one-over-x.png
?? .kiro/specs/phase-2-frontend-workbench/screenshots/phase2-v1-03-neville.png
?? .kiro/specs/phase-2-frontend-workbench/screenshots/phase2-v1-04-newton-dd.png
?? .kiro/specs/phase-2-frontend-workbench/screenshots/phase2-v1-results.md
```

### `frontend/src/components/results/methods/`

```
?? frontend/src/components/results/methods/CubicSplineDetails.test.tsx
?? frontend/src/components/results/methods/CubicSplineDetails.tsx
?? frontend/src/components/results/methods/CubicSplineGraphPassthrough.test.tsx
?? frontend/src/components/results/methods/DeferredMethodDetails.test.tsx
?? frontend/src/components/results/methods/DeferredMethodDetails.tsx
?? frontend/src/components/results/methods/EqualSpacingDetails.test.tsx
?? frontend/src/components/results/methods/EqualSpacingDetails.tsx
?? frontend/src/components/results/methods/HermiteDetails.test.tsx
?? frontend/src/components/results/methods/HermiteDetails.tsx
?? frontend/src/components/results/methods/TaylorDetails.test.tsx
?? frontend/src/components/results/methods/TaylorDetails.tsx
```

## Per-acceptance-criterion checks

### No `backend/` path in the output

`findstr backend/` over the full output: zero matches. The acceptance
criterion "Confirm no path under `backend/` appears" is satisfied.

### Phase 2 frontend files (in scope for the commit)

Categorized from the output above:

**Modified (13 frontend files + 3 doc files):**

Frontend (`frontend/src/`):
1. `frontend/src/App.examples.test.tsx`
2. `frontend/src/App.tsx`
3. `frontend/src/components/ExamplesPanel.tsx`
4. `frontend/src/components/InputPanel.tsx`
5. `frontend/src/components/MethodSelector.tsx`
6. `frontend/src/components/results/GuidedExplanation.tsx`
7. `frontend/src/components/results/MethodDetails.tsx`
8. `frontend/src/components/results/PolynomialCard.tsx`
9. `frontend/src/components/results/ResultQualityGuide.tsx`
10. `frontend/src/components/results/SummaryCard.tsx`
11. `frontend/src/lib/api-types.ts`
12. `frontend/src/lib/warnings.ts`
13. `frontend/src/test/interpolate-response.fixtures.ts`

Docs (4 reporting files updated by tasks 7.11 / 7.12 / 7.13):
14. `docs/HANDOFF.md` (Phase 2 frontend session appended)
15. `docs/FRONTEND_HANDOFF.md` (Phase 2 section appended)
16. `docs/PLAN.md` (milestone row + Remaining Work bullets)

**New (19 frontend files + spec + screenshots):**

Frontend (`frontend/src/`):
1. `frontend/src/components/CubicSplineConfigBlock.tsx`
2. `frontend/src/components/DerivativeInputTable.tsx`
3. `frontend/src/components/EqualSpacingHint.tsx`
4. `frontend/src/components/InputPanel.MethodConfig.test.tsx`
5. `frontend/src/components/MethodSelector.catalog.ts`
6. `frontend/src/components/MethodSelector.test.tsx`
7. `frontend/src/components/TaylorConfigBlock.tsx`
8. `frontend/src/components/results/methods/CubicSplineDetails.test.tsx`
9. `frontend/src/components/results/methods/CubicSplineDetails.tsx`
10. `frontend/src/components/results/methods/CubicSplineGraphPassthrough.test.tsx`
11. `frontend/src/components/results/methods/DeferredMethodDetails.test.tsx`
12. `frontend/src/components/results/methods/DeferredMethodDetails.tsx`
13. `frontend/src/components/results/methods/EqualSpacingDetails.test.tsx`
14. `frontend/src/components/results/methods/EqualSpacingDetails.tsx`
15. `frontend/src/components/results/methods/HermiteDetails.test.tsx`
16. `frontend/src/components/results/methods/HermiteDetails.tsx`
17. `frontend/src/components/results/methods/TaylorDetails.test.tsx`
18. `frontend/src/components/results/methods/TaylorDetails.tsx`
19. `frontend/src/lib/equal-spacing.ts`

Spec directory (in scope per task 7.15 staging rules):
- `.kiro/specs/phase-2-frontend-workbench/.config.kiro`
- `.kiro/specs/phase-2-frontend-workbench/design.md`
- `.kiro/specs/phase-2-frontend-workbench/requirements.md`
- `.kiro/specs/phase-2-frontend-workbench/tasks.md`
- `.kiro/specs/phase-2-frontend-workbench/screenshots/` (32 files: 22 PNG screenshots + 8 per-scenario `.md` results files + this `phase2-git-status.md`).

### Out-of-scope paths (will NOT be staged in task 7.15)

These paths appear in `git status --short` but are pre-existing and unrelated
to Phase 2 frontend; per task 7.15 they MUST NOT be staged:

- `Lecture/DOCUMENTATION_CHANGELOG.md` (modified) — Lecture-content tracking.
- `Lecture/GROUP-8-ASL-2024-FINAL-DOCUMENTATION-1.pdf` (deleted).
- `Lecture/download.jpg` (deleted).
- `Lecture/~$cumentation.docx` (untracked Word lock file — should never be tracked).

Each appears in earlier HANDOFF entries as pre-existing repo-state debt
unrelated to Phase 2.

## Confirmation per Requirement R18.2 / R18.5

The `git status --short` output above was actually executed and observed
in this session. No path under `backend/` is present. The output is the
verbatim capture from the terminal.
