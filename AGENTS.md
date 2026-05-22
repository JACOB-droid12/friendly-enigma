# AGENTS.md — Interpolating Polynomial Program Backend

## Permanent Project Rules

- This repository is for the backend and numerical computation engine only.
- Do not build, scaffold, or edit a frontend in this repository unless the user explicitly changes scope.
- Claude Opus owns the React frontend implementation.
- Backend work must keep a clean JSON API contract that a React frontend can consume.
- Do not rely on chat history as the source of truth. Keep project state in the coordination files listed below.

## Required Coordination Files

Maintain these files during every meaningful work session:

- `AGENTS.md`: durable project and agent rules.
- `docs/HANDOFF.md`: current project state, exact files changed, commands run, test results, failures, known risks, and next steps.
- `docs/PLAN.md`: implementation plan, milestone status, validation commands, and remaining work.
- `docs/API_CONTRACT.md`: endpoint paths, request JSON, response JSON, validation errors, warnings, and frontend notes.
- `docs/FRONTEND_HANDOFF.md`: Claude Opus integration guidance.

## Implementation Boundaries

- Backend stack: Python 3.11+.
- API stack: FastAPI.
- Math stack: SymPy, mpmath, and SciPy where practical.
- Test stack: pytest.
- Formatting/linting: ruff if practical.
- Do not parse numeric input as normal Python `float` before precision handling.
- Accept user numeric inputs as strings.
- Support exact mode with SymPy Rational when possible.
- Support high_precision mode with mpmath using user-selected decimal precision.
- Do not use `eval` for functions.
- Parse functions through SymPy with an explicit whitelist.
- Keep math logic inside pure core modules. The API layer must orchestrate only.

## Required Math Features

- Lagrange interpolation with basis polynomials, summation form, expanded form, LaTeX, and educational steps.
- Newton divided differences with full divided-difference table, coefficients, nested form, LaTeX, and educational steps.
- Barycentric Lagrange interpolation with weights and stable numerical evaluation.
- Neville's method with target-specific triangular tables.
- Graph-data generation only. Do not render graphs.

## Validation Rules

- Require at least two points or nodes.
- Reject duplicate x-values.
- Reject non-real values unless a future explicit complex mode is added.
- Reject unsafe or unknown function expressions.
- Warn for high degree, especially degree >= 10.
- Warn for equally spaced high-degree interpolation because of possible oscillation.
- Warn for very close x-values because of poor numerical conditioning.
- If nodes are reordered, document the ordering in the response.

## Documentation Discipline

- Update `docs/HANDOFF.md` after every meaningful change group.
- Update `docs/PLAN.md` whenever a milestone is completed, blocked, changed, or found wrong.
- Update `docs/API_CONTRACT.md` whenever endpoint paths, request shape, response shape, or error shape changes.
- Update `docs/FRONTEND_HANDOFF.md` whenever frontend-relevant behavior changes.
- Record exact commands run and failed attempts honestly.
- Do not claim tests passed unless they were actually run.

