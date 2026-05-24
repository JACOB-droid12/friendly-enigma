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

- [ ] Review `Lecture/` and record exact method coverage in docs.
- [ ] Review current backend schema, normalization, validation, service, graph, and method modules.
- [ ] Review current frontend API types and method rendering.
- [ ] Finalize Phase 2 method literals in the API contract.
- [ ] Design optional request blocks for method options, derivative data, Taylor config, and spline config.
- [ ] Design Phase 2 method response payloads.
- [ ] Add or document new warning/error codes.
- [ ] Add helper module shells only if useful without implementing method behavior.
- [ ] Add compatibility tests proving existing v1 requests still pass.
- [ ] Update `docs/API_CONTRACT.md`.
- [ ] Update `docs/FRONTEND_HANDOFF.md`.
- [ ] Update `docs/PLAN.md`.
- [ ] Update `docs/HANDOFF.md`.
- [ ] Run backend tests and lint.
- [ ] Report `git status --short`.
- [ ] Commit P2.0.

## P2.1 - Equal-Spacing Family

- [ ] Add finite-difference helper tests.
- [ ] Implement equal-spacing validator.
- [ ] Implement forward-difference table helper.
- [ ] Implement backward-difference table helper.
- [ ] Implement target-location guidance helper.
- [ ] Add `newton_forward` method builder.
- [ ] Add `newton_backward` method builder.
- [ ] Add `stirling` method builder with strict centered eligibility.
- [ ] Add lecture regression tests for forward, backward, and Stirling examples.
- [ ] Wire method builders into service.
- [ ] Add API tests for method success and ineligible method errors.
- [ ] Update API contract and frontend handoff.
- [ ] Run backend tests and lint.
- [ ] Report `git status --short`.
- [ ] Commit P2.1.

## P2.2 - Derivative-Data Family

- [ ] Design derivative input examples in API contract.
- [ ] Add derivative-data schema or optional request fields.
- [ ] Add derivative validation tests.
- [ ] Implement repeated-node helper tests.
- [ ] Implement repeated-node divided-difference helper.
- [ ] Implement `hermite_divided_difference`.
- [ ] Add Hermite divided-difference lecture regression tests.
- [ ] Implement `hermite` basis output when safe.
- [ ] Add omission warning when Hermite basis output is too large.
- [ ] Implement `osculating` only after Hermite tests are stable.
- [ ] Add osculating tests or explicitly defer with reasons.
- [ ] Update API contract and frontend handoff.
- [ ] Run backend tests and lint.
- [ ] Report `git status --short`.
- [ ] Commit P2.2.

## P2.3 - Taylor Family

- [ ] Finalize Taylor config request shape.
- [ ] Add tests for safe Taylor function parsing and derivative handling.
- [ ] Implement Taylor derivative term generation.
- [ ] Implement Taylor polynomial output.
- [ ] Add Taylor LaTeX and lecture steps.
- [ ] Add Taylor evaluations.
- [ ] Add Taylor remainder note when supported.
- [ ] Add lecture regression tests for cos and sin examples.
- [ ] Wire `taylor` into service and API contract.
- [ ] Update frontend handoff.
- [ ] Run backend tests and lint.
- [ ] Report `git status --short`.
- [ ] Commit P2.3.

## P2.4 - Piecewise Family

- [ ] Finalize spline config request shape.
- [ ] Add natural-spline helper tests.
- [ ] Implement natural cubic spline coefficient solver.
- [ ] Return interval metadata and segment coefficients.
- [ ] Return continuity checks.
- [ ] Add piecewise evaluator for backend graph samples.
- [ ] Ensure top-level polynomial block indicates piecewise/no global polynomial.
- [ ] Add lecture regression test for points `(1, 2)`, `(2, 3)`, `(3, 5)`.
- [ ] Wire `cubic_spline` into service and graph generation.
- [ ] Update API contract and frontend handoff.
- [ ] Run backend tests and lint.
- [ ] Report `git status --short`.
- [ ] Commit P2.4.

## P2.5 - Full Product Polish / Release Candidate

- [ ] Confirm every implemented method has a lecture regression example.
- [ ] Confirm any unimplemented lecture method is explicitly deferred with reasons.
- [ ] Update guided explanation notes for all Phase 2 methods.
- [ ] Update result quality and warning guide docs for all Phase 2 warnings.
- [ ] Update method comparison summary.
- [ ] Run full backend tests.
- [ ] Run backend lint.
- [ ] Run frontend build/lint/test if frontend work has been integrated.
- [ ] Perform browser QA for major frontend flows if frontend changed.
- [ ] Write final audit report.
- [ ] Update `docs/HANDOFF.md`.
- [ ] Update `docs/FRONTEND_HANDOFF.md`.
- [ ] Update `docs/API_CONTRACT.md`.
- [ ] Update `docs/PLAN.md`.
- [ ] Record Python 3.11+ verification result or keep release caveat visible.
- [ ] Report `git status --short`.
- [ ] Commit P2.5 release-candidate docs/code.

## Completion Checklist

Phase 2 is complete only when:

- [ ] all planned lecture methods are implemented or explicitly deferred with reasons
- [ ] existing v1/v1+ behavior still passes
- [ ] API contract docs are updated
- [ ] lecture regression examples exist for each implemented method
- [ ] backend tests pass
- [ ] backend lint passes
- [ ] frontend tests pass if frontend changed
- [ ] frontend build/lint pass if frontend changed
- [ ] browser QA is performed for major frontend flows if frontend changed
- [ ] `docs/HANDOFF.md` and `docs/FRONTEND_HANDOFF.md` are updated
- [ ] no backend/frontend ownership rule is violated
- [ ] final audit report is written
- [ ] Python 3.11+ verification is either passed or clearly documented as not release-complete
