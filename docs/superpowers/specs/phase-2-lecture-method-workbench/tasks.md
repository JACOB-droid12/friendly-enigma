# Phase 2 Lecture Method Workbench Tasks

## Execution Rule

Implement one milestone at a time. Do not implement all Phase 2 methods in one pass.

Each milestone must end with:

- backend tests
- backend lint
- frontend build/lint/test if frontend files changed
- docs updates
- `git status --short`
- a separate milestone commit

## P2.0 - Contract and Architecture Prep

- [x] Review `Lecture/` and record exact method coverage in docs.
- [x] Review current backend schema, normalization, validation, service, graph, and method modules.
- [x] Review current frontend API types and method rendering.
- [x] Finalize Phase 2 method literals in the API contract.
- [x] Design optional request blocks for method options, derivative data, Taylor config, and spline config.
- [x] Design Phase 2 method response payloads.
- [x] Add or document new warning/error codes.
- [x] Add helper module shells only if useful without implementing method behavior.
- [x] Add compatibility tests proving existing v1 requests still pass.
- [x] Update `docs/API_CONTRACT.md`.
- [x] Update `docs/FRONTEND_HANDOFF.md`.
- [x] Update `docs/PLAN.md`.
- [x] Update `docs/HANDOFF.md`.
- [x] Run backend tests and lint.
- [x] Report `git status --short`.
- [x] Commit P2.0.

## P2.1 - Equal-Spacing Family

- [x] Add finite-difference helper tests.
- [x] Implement equal-spacing validator.
- [x] Implement forward-difference table helper.
- [x] Implement backward-difference table helper.
- [x] Implement target-location guidance helper.
- [x] Add `newton_forward` method builder.
- [x] Add `newton_backward` method builder.
- [x] Add `stirling` method builder with strict centered eligibility.
- [x] Add lecture regression tests for forward, backward, and Stirling examples.
- [x] Wire method builders into service.
- [x] Add API tests for method success and ineligible method errors.
- [x] Update API contract and frontend handoff.
- [x] Run backend tests and lint.
- [x] Report `git status --short`.
- [x] Commit P2.1.

## P2.2 - Derivative-Data Family

- [x] Design derivative input examples in API contract.
- [x] Add derivative-data schema or optional request fields.
- [x] Add derivative validation tests.
- [x] Implement repeated-node helper tests.
- [x] Implement repeated-node divided-difference helper.
- [x] Implement `hermite_divided_difference`.
- [x] Add Hermite divided-difference lecture regression tests.
- [x] Implement `hermite` basis output when safe.
- [x] Add omission warning when Hermite basis output is too large.
- [x] Explicitly defer `osculating` after Hermite because generalized derivative-order repeated-node support is not implemented or tested.
- [x] Add osculating tests or explicitly defer with reasons.
- [x] Update API contract and frontend handoff.
- [x] Run backend tests and lint.
- [x] Report `git status --short`.
- [x] Commit P2.2.

## P2.3 - Taylor Family

- [x] Finalize Taylor config request shape.
- [x] Add tests for safe Taylor function parsing and derivative handling.
- [x] Implement Taylor derivative term generation.
- [x] Implement Taylor polynomial output.
- [x] Add Taylor LaTeX and lecture steps.
- [x] Add Taylor evaluations.
- [x] Add Taylor remainder note when supported.
- [x] Add lecture regression tests for cos and sin examples.
- [x] Wire `taylor` into service and API contract.
- [x] Update frontend handoff.
- [x] Run backend tests and lint.
- [x] Report `git status --short`.
- [x] Commit P2.3.

## P2.4 - Piecewise Family

- [x] Finalize spline config request shape.
- [x] Add natural-spline helper tests.
- [x] Implement natural cubic spline coefficient solver.
- [x] Return interval metadata and segment coefficients.
- [x] Return continuity checks.
- [x] Add piecewise evaluator for backend graph samples.
- [x] Ensure top-level polynomial block indicates piecewise/no global polynomial.
- [x] Add lecture regression test for points `(1, 2)`, `(2, 3)`, `(3, 5)`.
- [x] Wire `cubic_spline` into service and graph generation.
- [x] Update API contract and frontend handoff.
- [x] Run backend tests and lint.
- [x] Report `git status --short`.
- [x] Commit P2.4.

## P2.5 - Full Product Polish / Release Candidate

- [x] Confirm every implemented method has a lecture regression example.
- [x] Confirm any unimplemented lecture method is explicitly deferred with reasons.
- [x] Update guided explanation notes for all Phase 2 methods.
- [x] Update result quality and warning guide docs for all Phase 2 warnings.
- [x] Update method comparison summary.
- [x] Run full backend tests.
- [x] Run backend lint.
- [x] Run frontend build/lint/test if frontend work has been integrated.
- [ ] Perform browser QA for major frontend flows if frontend changed. Pending Claude Opus Phase 2 frontend integration.
- [x] Write final audit report.
- [x] Update `docs/HANDOFF.md`.
- [x] Update `docs/FRONTEND_HANDOFF.md`.
- [x] Update `docs/API_CONTRACT.md`.
- [x] Update `docs/PLAN.md`.
- [x] Record Python 3.11+ verification result or keep release caveat visible.
- [x] Report `git status --short`.
- [x] Commit P2.5 release-candidate docs/code.

## Completion Checklist

Phase 2 is complete only when:

- [x] all planned lecture methods are implemented or explicitly deferred with reasons
- [x] existing v1/v1+ behavior still passes
- [x] API contract docs are updated
- [x] lecture regression examples exist for each implemented method
- [x] backend tests pass
- [x] backend lint passes
- [x] frontend tests pass if frontend changed
- [x] frontend build/lint pass if frontend changed
- [ ] browser QA is performed for major frontend flows if frontend changed
- [x] `docs/HANDOFF.md` and `docs/FRONTEND_HANDOFF.md` are updated
- [x] no backend/frontend ownership rule is violated
- [x] final audit report is written
- [x] Python 3.11+ verification is either passed or clearly documented as not release-complete
