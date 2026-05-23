# Implementation Plan: frontend-analysis-bench-overhaul

> Convert the feature design into a series of prompts for a code-generation
> LLM that will implement each step with incremental progress. Make sure
> that each prompt builds on the previous prompts, and ends with wiring
> things together. There should be no hanging or orphaned code that
> isn't integrated into a previous step. Focus ONLY on tasks that
> involve writing, modifying, or testing code.

## Overview

This plan implements `design.md` for `frontend-analysis-bench-overhaul`.
Work is grouped into the seven implementation groups defined in
`design.md` section 4: Group A Foundation, Group B Mode layouts,
Group C Math input typography & spacing, Group D Method emphasis &
method details, Group E Error & warning hierarchy, Group F Results
panel & chrome polish, Group G Verification + live tests + handoff.

The implementation language is **TypeScript** in the existing
`frontend/` React + Vite project. No new languages or frameworks are
introduced. Tasks are scoped tightly so each one can be reviewed and
executed in a single sub-agent turn (typically one component or one
focused concern per task).

Property-based tests are intentionally not used in this feature
(visual and structural UI alignment is not a pure-function or
universal-property domain). Verification routes through the
Requirement 9 fixed commands plus the Requirement 10 live-test
scenarios. There is no Correctness Properties section in `design.md`,
and there are no PBT sub-tasks below.

## Hard Rules (Standing Constraint, Requirement 1)

These rules apply to every task in this plan. They are NOT optional
and are NOT to be relaxed by any sub-task.

- No file under `backend/` is modified, created, or deleted.
  (Requirement 1.1)
- No request shape, response shape, or endpoint path defined in
  `docs/API_CONTRACT.md` is changed. (Requirements 1.2, 1.3, 1.4)
- No interpolation algorithm is implemented, replaced, or overridden
  in client code. (Requirement 1.5)
- The frontend renders only the values returned by the backend
  response (polynomial values, evaluations, weights, divided-
  difference tables, Neville tables, basis polynomials, graph data)
  and never derives new numerical values for display, including chart
  curves and table cells. (Requirements 1.6, 1.7)
- Math.js or any equivalent client-side math library is NOT used as
  the source of truth for any displayed numerical result. Where used,
  it is restricted to non-authoritative purposes such as input
  formatting or syntax highlighting. (Requirements 1.8, 1.9)
- All numeric user input is passed to the backend as strings.
  (Requirement 1.10)
- Pre-coding deliverables in `design.md` are already complete and
  approved. The four-deliverable structure (PRODUCT summary, DESIGN /
  design.json summary, UI audit, implementation plan) is the contract
  for `design.md`; it MUST NOT be reorganized to satisfy default Kiro
  Spec Format section names. (Requirement 8)

## Tasks

- [x] 1. Group A — Foundation: tokens, voices, focus, motion
  - [x] 1.1 Add a single `.font-label` voice handle in `index.css`
    - Define `.font-label` with the `label` token (font-family IBM Plex
      Sans Variable, font-size 0.625rem, font-weight 500, letter-
      spacing 0.05em, line-height 1, text-transform uppercase) so the
      `label` voice has a canonical CSS handle to replace the ad-hoc
      `text-[10px] uppercase tracking-wider font-medium` strings.
    - File: `frontend/src/index.css`
    - _Requirements: 2.3, 5.2, 8.6 (label voice token)_
  - [x] 1.2 Update the `select` primitive to match the design-system input shape
    - Set the trigger to 32px height (`h-8`), `lg` radius (`rounded-lg`),
      `4px 10px` padding to match `input-default`, and a 3px focus ring
      at `ring/50` opacity in `--ring`. Keep the native semantics; only
      restyle.
    - File: `frontend/src/components/ui/select.tsx`
    - _Requirements: 2.10, 5.7, 5.8_
  - [x] 1.3 Update the `switch` primitive to show the canonical 3px focus ring
    - Replace the default 2px focus offset with the 3px ring at
      `ring/50` opacity in `--ring` so every interactive element shares
      the same focus signature.
    - File: `frontend/src/components/ui/switch.tsx`
    - _Requirements: 2.10_
  - [x] 1.4 Audit and confirm reduced-motion and Three-Voice handles in `index.css`
    - Verify that the `@media (prefers-reduced-motion: reduce)` block
      already disables `.transition-subtle` and `.animate-in-results`,
      and that `.font-math`, `.font-numeric`, body-font, and the new
      `.font-label` handle are all routed through their declared
      stacks. Add inline comments documenting that the four voices and
      reduced-motion contract are intentional. No behavioral change.
    - File: `frontend/src/index.css`
    - _Requirements: 2.3, 2.11, 5.1, 5.2_

- [x] 2. Group B — Mode layouts (Points, X + f(x), Interval)
  - [x] 2.1 Refactor `XValuesInput.tsx` for full-width and the function-success placement contract
    - Make the function expression input span the full input-card
      content width (no fixed `max-width` below the card content
      width). Make each x-value row's numeric input at least 160px
      wide at viewport widths ≥ 768px and use `flex` with explicit
      `min-width`. Surface the inline function-validation success
      indicator (icon + accessible text) immediately adjacent to the
      function input rather than in the action bar. Keep failure text
      adjacent to the input via `aria-describedby` with the human-
      readable backend message as primary content. Preserve the layout
      width across add, remove, type, and initial-render sequences.
    - File: `frontend/src/components/XValuesInput.tsx`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 5.10_
  - [x] 2.2 Refactor `FunctionIntervalInput.tsx` for the four-block layout, stacking, balanced columns, and inline out-of-range notice
    - Render the function input full-width, then a `[a, b]` two-column
      row, then a node-strategy + node-count two-column row balanced
      `grid-cols-[2fr_1fr]` so the count input is sized to its
      content. Stack both two-column rows below 768px
      (`grid-cols-1 md:grid-cols-2`) without horizontal overflow.
      Place the mathematical notation `a` and `b` in `numeric` voice
      inside `label`-voice field labels. Show an inline destructive
      notice (icon + label + body recovery sentence) when
      `node_count` is below 2 or above 50, and block submission while
      the notice is displayed; do not silently clamp. Add a body-voice
      helper paragraph under the function input symmetric with X +
      f(x). Ensure the API value mapping `equally_spaced`,
      `chebyshev_nodes`, `custom_nodes` for the strategy options
      remains intact.
    - File: `frontend/src/components/FunctionIntervalInput.tsx`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 5.10_
  - [x] 2.3 Tighten `PointsInput.tsx` spacing, placeholders, and Add Point sizing
    - Set vertical row spacing to `space-y-2` (8px), keep the labelled
      grid columns (`i`, `xᵢ`, `yᵢ`, remove) and `gap-2` minimum
      column gap. Replace placeholders that read like default values
      (the literal `0`) with subtle illustrative numeric examples in
      `slate-muted` and `numeric` voice. Align the `Add Point` button
      sizing with `Add X-Value` and `Add Target` so all three editors
      share one secondary-action treatment. Keep the editor stretched
      to the input-card content width.
    - File: `frontend/src/components/PointsInput.tsx`
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 5.9_
  - [x] 2.4 Audit shared mode-tab containers in `InputPanel.tsx`
    - Confirm the outer card and the `grid grid-cols-3 h-9` mode tab
      list pass through to all three modes without imposing a width
      cap below the card content width. If a shared helper paragraph
      slot is needed for the function helper text in modes 2 and 3,
      route it here. No behavioral change unless the audit finds a
      width or padding cap to remove.
    - File: `frontend/src/components/InputPanel.tsx`
    - _Requirements: 3.1, 4.1, 5.6_

- [ ] 3. Checkpoint after Groups A and B
  - Run `npx tsc -b` and `npm run lint` from `frontend/` to confirm
    type and lint health before continuing. Ensure all tests pass,
    ask the user if questions arise.

- [x] 4. Group C — Math input typography & spacing
  - [x] 4.1 Replace `font-mono` with `font-numeric` in `XValuesInput.tsx`
    - Apply `font-numeric` (the JetBrains Mono `numeric` voice with
      `tabular-nums`) to the function expression input and to every
      x-value row's numeric input so they pick up the canonical math-
      input voice with `font-variant-numeric: tabular-nums` instead
      of the Tailwind default monospace stack.
    - File: `frontend/src/components/XValuesInput.tsx`
    - _Requirements: 2.3, 2.4, 5.1_
  - [x] 4.2 Route mode-component error and muted text through Tailwind aliases
    - Replace inline `text-[var(--muted-foreground)]` and
      `text-[var(--destructive)]` strings with the Tailwind aliases
      `text-muted-foreground` and `text-destructive` in the
      X-values-with-function and function-interval components, so
      semantic colors are consistent with the rest of the app.
    - Files: `frontend/src/components/XValuesInput.tsx`,
      `frontend/src/components/FunctionIntervalInput.tsx`
    - _Requirements: 2.1, 2.2_
  - [x] 4.3 Apply the `.font-label` voice to every label-voice site
    - Replace ad-hoc `text-[10px] uppercase tracking-wider font-
      medium` (and analogues) with `font-label` (Group A.1) on:
      `PointsInput` table headers (`i`, `xᵢ`, `yᵢ`),
      `FunctionIntervalInput` field labels for `a` and `b`,
      `MethodSelector` role tags, `WarningsDisplay` severity word,
      `NodesTable` and `EvaluationTable` `<TableHead>` cells, the
      Newton divided-difference table header (`f[xᵢ]`, `Δ¹`, `Δ²`,
      …), and the Barycentric weights table header (`i`, `xᵢ`, `wᵢ`).
    - Files: `frontend/src/components/PointsInput.tsx`,
      `frontend/src/components/FunctionIntervalInput.tsx`,
      `frontend/src/components/MethodSelector.tsx`,
      `frontend/src/components/WarningsDisplay.tsx`,
      `frontend/src/components/results/NodesTable.tsx`,
      `frontend/src/components/results/EvaluationTable.tsx`,
      `frontend/src/components/results/MethodDetails.tsx`
    - _Requirements: 2.3, 5.2, 7.9, 7.10, 7.11_
  - [x] 4.4 Surface a visible focus ring and a wider chip in `EvaluationTargets.tsx`
    - Restore the canonical 3px focus ring at `ring/50` on the chip
      input (do not zero `focus-visible:ring-0`) and increase chip
      width so values like `0.95` render without truncation, in
      `numeric` voice, while keeping the rounded chip layout.
    - File: `frontend/src/components/EvaluationTargets.tsx`
    - _Requirements: 2.10, 5.1, 5.7, 5.8_

- [ ] 5. Checkpoint after Group C
  - Run `npx tsc -b`, `npm run build`, and `npm run lint` from
    `frontend/`. Ensure all tests pass, ask the user if questions
    arise.

- [x] 6. Group D — Method emphasis and method details
  - [x] 6.1 Update `MethodSelector.tsx` role labels and one-sentence descriptions
    - Replace the role tags with the canonical pairing: "Construction"
      for Lagrange, "Construction" for Newton, "Stable Evaluator" for
      Barycentric (rendered in primary tint without enlarging or
      reordering the card), "Target-Specific" for Neville. Rewrite
      the one-sentence descriptions to: "Lagrange shows basis
      polynomials and summation form", "Newton shows divided-
      difference tables and nested form", "Barycentric provides
      stable evaluation and is the source for graph data", "Neville
      produces target-specific triangular tables". Keep the order
      Lagrange, Newton, Barycentric, Neville.
    - File: `frontend/src/components/MethodSelector.tsx`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  - [x] 6.2 Restore visible focus and quiet the corner indicator in `MethodSelector.tsx`
    - Apply a `focus-within:` ring on the wrapping `<label>` so the
      hidden checkbox focus is announced as the canonical 3px
      `ring/50` ring. Replace or remove the corner selection-indicator
      dot so the role tag does not fight for the top-right corner;
      express selection state via the existing primary border, primary
      tinted background, and primary ring.
    - File: `frontend/src/components/MethodSelector.tsx`
    - _Requirements: 2.10, 7.1, 7.7_
  - [x] 6.3 Enforce the Method Details section structure and flatten nested-outline drift
    - For each method panel, ensure the section structure is exactly:
      method status row, method-local error (if any), method-local
      warnings (if any), then method-specific content (basis
      polynomials and summation for Lagrange; coefficients, divided-
      difference table, and nested form for Newton; weights table for
      Barycentric; target results and triangular tables for Neville).
      Drop the inner `border` / `rounded-lg ... border` ring on
      basis-polynomial container, Newton coefficient block, and the
      divided-difference table wrapper; rely on `bg-muted/30` tonal
      layering inside the card outline.
    - File: `frontend/src/components/results/MethodDetails.tsx`
    - _Requirements: 2.8, 2.9, 7.8_
  - [x] 6.4 Drop `shadow-sm` at rest from Newton coefficient chips in `MethodDetails.tsx`
    - Remove `shadow-sm` from the Newton coefficient chip surfaces at
      rest. Keep any shadow only as a hover or focus response, in
      compliance with the Flat-at-Rest Rule.
    - File: `frontend/src/components/results/MethodDetails.tsx`
    - _Requirements: 2.8_
  - [x] 6.5 Update Neville table headers to mixed body + numeric voice in `MethodDetails.tsx`
    - Replace the middle-dot separator in the Neville table header
      with a colon (e.g., "Neville Table for x = 3"), with the body
      copy in body voice and the target x-value itself rendered in
      `numeric` voice. Add a `<TableHeader>` row to the Neville table
      so the top edge is not visually empty.
    - File: `frontend/src/components/results/MethodDetails.tsx`
    - _Requirements: 7.10_

- [ ] 7. Checkpoint after Group D
  - Run `npx tsc -b` and `npm run lint` from `frontend/`. Ensure all
    tests pass, ask the user if questions arise.

- [x] 8. Group E — Error and warning hierarchy
  - [x] 8.1 Add `ErrorNotice.tsx` shared error renderer with code-to-guidance map
    - Create a new component that takes structured input
      `{ code, message, severity?, layout? }` and renders: primary
      content (human-readable backend `message` in error title
      typography), secondary content (`Code: {code}` in `numeric`
      voice prefixed with the literal label `Code:`), and an optional
      body recovery sentence sourced from a frontend-maintained
      code-to-guidance map keyed by the recognized codes
      `too_few_nodes`, `duplicate_x_values`, `unsafe_expression`,
      `function_domain_error`, `invalid_interval`,
      `no_methods_selected`. Use Inset Containment Rule
      (`ring-1 ring-inset` with `--destructive` tint), and pair an
      icon + text label with the color so severity is never carried
      by color alone.
    - File: `frontend/src/components/ErrorNotice.tsx` (new)
    - _Requirements: 2.5, 2.6, 6.1, 6.2, 6.3, 6.8, 6.9_
  - [x] 8.2 Refactor `App.tsx` to structured error state and consume `ErrorNotice`
    - Replace the serialized `[code] message` parsing helpers
      (`formatErrorMessage`, `getErrorCode`) with structured top-
      level error state of shape `{ code, message }`. Render top-
      level errors with `ErrorNotice` so message is primary and code
      is secondary in `numeric` voice. Keep partial responses
      handled: render successful method outputs and let
      `MethodDetails` carry per-method errors with the same hierarchy.
    - File: `frontend/src/App.tsx`
    - _Requirements: 6.1, 6.2, 6.10_
  - [x] 8.3 Inline `unsafe_expression` and `function_domain_error` in the function-input regions
    - When the backend error code is `unsafe_expression` or
      `function_domain_error`, render the notice inline beneath the
      function input in both X + f(x) and Interval modes using the
      same primary-message-secondary-code-recovery hierarchy from
      `ErrorNotice`. Fall back to the top-level banner when no
      function input is currently mounted.
    - Files: `frontend/src/components/XValuesInput.tsx`,
      `frontend/src/components/FunctionIntervalInput.tsx`
    - _Requirements: 6.4, 6.5_
  - [x] 8.4 Update `WarningsDisplay.tsx` body text colors and severity voice
    - Route warning notice body text through `text-warning-foreground`
      and info notice body text through `text-info-foreground` instead
      of `text-muted-foreground`. Render the severity word in
      `font-label` voice (paired with Group C.3). Ensure each notice
      has icon + text label + color, and is never collapsed by default
      or hidden for cosmetic reasons. If the component branches into
      `error`-level rendering, route it through `ErrorNotice`.
    - File: `frontend/src/components/WarningsDisplay.tsx`
    - _Requirements: 6.6, 6.7, 6.8, 6.9_
  - [x] 8.5 Invert `MethodError` hierarchy in `MethodDetails.tsx`
    - Replace the existing `<strong>{error.code}</strong>: {error.
      message}` render with `ErrorNotice` so the human-readable
      backend message is primary and the code is secondary in
      `numeric` voice prefixed by `Code:`. Apply this inside each
      per-method panel in partial responses.
    - File: `frontend/src/components/results/MethodDetails.tsx`
    - _Requirements: 6.1, 6.2, 6.10_
  - [x] 8.6 Align `MethodWarnings` with `WarningsDisplay` in `MethodDetails.tsx`
    - Render per-method warnings with the same severity label (label
      voice), icon, color tinting, and body hierarchy as the top-level
      `WarningsDisplay` so warning surfaces stay consistent across the
      app.
    - File: `frontend/src/components/results/MethodDetails.tsx`
    - _Requirements: 6.6, 6.7, 6.8, 6.9_
  - [x] 8.7 Implement missing-message fallback in `ErrorNotice.tsx`
    - When the backend `message` is empty or missing, render the
      `code` as the primary content and "Backend did not provide a
      description." as the secondary body sentence so codes are never
      shown standalone.
    - File: `frontend/src/components/ErrorNotice.tsx`
    - _Requirements: 6.11_

- [ ] 9. Checkpoint after Group E
  - Run `npx tsc -b` and `npm run lint` from `frontend/`. Ensure all
    tests pass, ask the user if questions arise.

- [x] 10. Group F — Results panel and chrome polish
  - [x] 10.1 Flatten outer container in `ResultsPanel.tsx` so tabs read as section navigation
    - Remove the `rounded-xl border bg-card` standalone outline around
      the tab bar (or visually merge the tab bar with the active
      panel) so the tabs sit as section navigation rather than as a
      separate outlined card. Keep `bg-primary/10 text-primary` for
      the active tab; keep keyboard semantics.
    - File: `frontend/src/components/ResultsPanel.tsx`
    - _Requirements: 2.8, 2.9_
  - [x] 10.2 Drop translucency and resting shadow from the masthead and Compute button in `App.tsx`
    - Drop `bg-card/80` translucency on the sticky header in favor of
      opaque `bg-card`. Remove `shadow-sm` from the Compute button at
      rest and apply shadow only on hover or focus, in compliance
      with Flat-at-Rest. Keep the existing `border-b` and
      `sticky top-0` behavior.
    - File: `frontend/src/App.tsx`
    - _Requirements: 2.7, 2.8_
  - [x] 10.3 Drop the inner `border` on KaTeX-display containers in `PolynomialCard.tsx`
    - Remove the inner `border` from `bg-muted/30 rounded-lg p-4
      border` style KaTeX wrappers. Use only tonal layering plus the
      card outline for containment. Keep `role="math"` and the plain-
      text formula fallback adjacent to KaTeX.
    - File: `frontend/src/components/results/PolynomialCard.tsx`
    - _Requirements: 2.8, 2.9_
  - [x] 10.4 Drop inner outlines on Method Details surfaces in `MethodDetails.tsx`
    - Drop the inner `border` on basis-polynomial container, Newton
      coefficient block surface, and divided-difference table wrapper
      so they rely on `bg-muted/30` tonal layering inside the card
      outline.
    - File: `frontend/src/components/results/MethodDetails.tsx`
    - _Requirements: 2.8, 2.9_
  - [x] 10.5 Convert headers to label voice and add scroll wrapper in `NodesTable.tsx`
    - Convert `<TableHead>` cells to `font-label` voice. Wrap the
      table in a horizontal-scroll container so long rationals do not
      cause the row to wrap to two lines. Keep numeric cells in
      `numeric` voice with `tabular-nums`.
    - File: `frontend/src/components/results/NodesTable.tsx`
    - _Requirements: 5.2, 7.9_
  - [x] 10.6 Convert headers to label voice and quiet empty-cell glyph in `EvaluationTable.tsx`
    - Convert `<TableHead>` cells to `font-label` voice. Replace the
      "—" placeholder with a centered muted dot consistent with the
      style used in Method Details tables.
    - File: `frontend/src/components/results/EvaluationTable.tsx`
    - _Requirements: 5.2, 7.9, 7.10, 7.11_
  - [x] 10.7 Rename and unify bullets in `EducationalNotes.tsx`
    - Rename the section heading copy to "Educational Notes" so the
      tab name and the section title agree. Share the custom bullet
      style with `BarycentricDetails` via a single class or utility,
      so the two surfaces no longer duplicate the same `before:`
      pseudo-element rule.
    - File: `frontend/src/components/results/EducationalNotes.tsx`
    - _Requirements: 2.3, 5.10_
  - [x] 10.8 Route Recharts tick/tooltip fonts through the full numeric voice stack in `GraphCard.tsx`
    - Replace the inline `fontFamily: "JetBrains Mono, monospace"`
      strings on `XAxis`, `YAxis`, and the tooltip with a single
      reference to the canonical numeric stack (CSS variable or class
      consumed via `tickStyle`/`tooltipStyle`). Replace the inline
      `text-[var(--destructive)]` references with the Tailwind alias.
      Continue rendering only `graph_data.x`, `graph_data.f_x`,
      `graph_data.P_x`, `graph_data.error`, and the node coordinates;
      no client-side resampling.
    - File: `frontend/src/components/results/GraphCard.tsx`
    - _Requirements: 1.6, 1.7, 2.1, 5.1, 10.7_
  - [x] 10.9 Replace literal destructive color in `HealthIndicator.tsx`
    - Replace the raw `bg-[var(--destructive)]` color literal with the
      Tailwind alias `bg-destructive` so the health dot routes through
      the canonical token alias rather than an inline CSS variable.
    - File: `frontend/src/components/HealthIndicator.tsx`
    - _Requirements: 2.1, 2.2_

- [ ] 11. Checkpoint after Group F
  - Run `npx tsc -b`, `npm run build`, and `npm run lint` from
    `frontend/`. Ensure all tests pass, ask the user if questions
    arise.

- [x] 12. Group G — Verification, live tests, and handoff
  - [x] 12.1 Run `npx tsc -b` from `frontend/` and record the exit result
    - Working directory: `frontend/`. Command:
      `npx tsc -b`. Record the exit code and full output verbatim for
      the handoff.
    - _Requirements: 9.1, 9.5, 11.4_
  - [x] 12.2 Run `npm run build` from `frontend/` and record the exit result
    - Working directory: `frontend/`. Command:
      `npm run build`. Record the exit code and the build summary.
    - _Requirements: 9.2, 9.5, 11.4_
  - [x] 12.3 Run `npm run lint` from `frontend/` and record the exit result
    - Working directory: `frontend/`. Command:
      `npm run lint`. Confirm zero ESLint errors. Warnings are
      acceptable but must be enumerated for the handoff.
    - _Requirements: 9.3, 9.5, 11.4_
  - [x] 12.4 Run `impeccable detect "C:\Users\Emmy Lou\Documents\New project 3"` and record findings
    - Run from the repository root. Confirm zero P0 and zero P1
      findings. Record any P2 or P3 findings for the handoff.
    - _Requirements: 9.4, 9.5, 11.4_
  - [x] 12.5 Live test: linear Lagrange (Points example, evaluation at x = 3)
    - Against the running backend, load the points example with
      `(2, 4)` and `(5, 1)` and evaluation target `x = 3`. Confirm
      the polynomial renders as `P(x) = 6 − x` and the evaluation as
      `P(3) = 3`. Record pass/fail and any deviation.
    - _Requirements: 10.1, 11.5_
  - [x] 12.6 Live test: 1/x example (X + f(x), evaluation at x = 3)
    - Load `f(x) = 1/x`, x-values `[2, 2.75, 4]`, evaluation target
      `x = 3`. Confirm the evaluation is `P(3) = 29/88` (≈ 0.32955).
      Record pass/fail and any deviation.
    - _Requirements: 10.2, 11.5_
  - [x] 12.7 Live test: Newton divided-difference table renders with header row
    - Run any example that yields a non-empty
      `divided_difference_table`. Confirm the table renders with a
      labelled header row (`f[xᵢ]`, `Δ¹`, `Δ²`, …) and one row per
      node. Record pass/fail.
    - _Requirements: 10.3, 11.5_
  - [x] 12.8 Live test: Neville triangular tables render with target-x header
    - Run any example with one or more `evaluation_x`. Confirm each
      Neville table renders as a triangular table with a header
      identifying the target x-value (body voice for the prefix,
      `numeric` voice for the value). Record pass/fail.
    - _Requirements: 10.4, 11.5_
  - [x] 12.9 Live test: Barycentric weights table renders with `i`, `xᵢ`, `wᵢ`
    - Run any example with Barycentric selected. Confirm the weights
      table has columns `i`, `xᵢ`, `wᵢ` (label voice) and one row per
      node (numeric voice with tabular-nums). Record pass/fail.
    - _Requirements: 10.5, 11.5_
  - [x] 12.10 Live test: warnings and errors render with the Requirement 6 hierarchy
    - Run Runge and a deliberate validation failure (for example a
      one-point Points request and an `unsafe_expression`). Confirm
      warnings render with the human-readable label first and stay
      visible without user action; confirm errors render with the
      backend `message` as primary content, the code as secondary in
      `numeric` voice with `Code:` prefix, and the recovery sentence
      where the code is recognized. Confirm `unsafe_expression` and
      `function_domain_error` render inline beneath the function
      input. Record pass/fail.
    - _Requirements: 10.6, 11.5_
  - [x] 12.11 Live test: graph rendering uses only backend `graph_data` arrays
    - Run Runge with `graph: true`. Open the browser devtools network
      tab; confirm the chart consumes only `graph_data.x`,
      `graph_data.f_x`, `graph_data.P_x`, `graph_data.error`, and the
      node coordinates. Confirm no client-side resampling, smoothing,
      or recomputation. Record pass/fail.
    - _Requirements: 1.6, 1.7, 10.7, 11.5_
  - [x] 12.12 Update `docs/HANDOFF.md` with the feature record
    - Append a section recording this feature with the five
      subsections required by Requirement 11: "DESIGN.md Alignment
      Review Summary" (rules audited and audit result), "What
      Changed" (every frontend file modified, created, or removed),
      "Commands Run" (each Requirement 9 verification command with
      its working directory and exit result, copied from tasks 12.1
      to 12.4), "Live-Test Results" (each Requirement 10 scenario
      with pass or fail outcome, copied from tasks 12.5 to 12.11),
      and "Remaining Caveats" (deferred items, accepted warnings).
      Do not claim any command or live test passed unless it was
      actually executed and observed.
    - File: `docs/HANDOFF.md`
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.8_
  - [x] 12.13 Update `docs/FRONTEND_HANDOFF.md` with the new behavior
    - Update the frontend handoff to reflect the new layout
      (full-width X + f(x) and Interval modes, balanced
      strategy/count row, stacked-below-md behavior), the new error
      hierarchy (message primary, code secondary, recovery sentence
      where recognized, inline routing for `unsafe_expression` and
      `function_domain_error`), the canonical method emphasis (role
      tags Construction / Construction / Stable Evaluator /
      Target-Specific, Barycentric primary tint, fixed order Lagrange
      → Newton → Barycentric → Neville), and the chrome polish
      (Flat-at-Rest header and Compute button, no inner outlines on
      KaTeX or method-detail surfaces, label-voice table headers).
    - File: `docs/FRONTEND_HANDOFF.md`
    - _Requirements: 11.7_

- [x] 13. Final checkpoint
  - Confirm every entry in tasks 12.1 to 12.11 has an honest pass or
    fail outcome recorded in `docs/HANDOFF.md`. Per Requirement 11.8,
    no command or live test may be claimed to have passed unless it
    was actually executed and observed in this session. Ensure all
    tests pass, ask the user if questions arise.

## Notes

- Implementation language is TypeScript in the existing
  `frontend/` React + Vite project. No new languages, frameworks, or
  client-side numerical libraries are introduced.
- Property-based tests are not used in this feature. Verification
  routes through the Requirement 9 fixed commands (`tsc -b`, `npm run
  build`, `npm run lint`, `impeccable detect`) plus the seven
  Requirement 10 live-test scenarios. There is no Correctness
  Properties section in `design.md`, by design.
- No task in this plan is marked optional with `*`. Verification and
  live-test tasks are mandatory under Requirement 9.5 and Requirement
  11.8.
- Backend, API contract, interpolation algorithms, and graph-data
  shape are out of scope and remain unchanged. The frontend renders
  only backend results and never recomputes math on the client.
  (Requirement 1)
- Numeric user input is passed to the backend as strings in every
  task that touches an input control. (Requirement 1.10)
- The Kiro Spec Format diagnostics about missing default sections in
  `design.md` are accepted; the four-deliverable structure (PRODUCT
  summary, DESIGN / design.json summary, UI audit, implementation
  plan) is the contract. `design.md` is not to be reorganized to
  satisfy default section names. (Requirement 8)
- Each task is small enough to be reviewed and executed in a single
  sub-agent turn (typically one component or one focused concern).
- Each task references the requirement clauses it satisfies under
  its `_Requirements:_` line, per Requirement 8.5 traceability.
- Checkpoints sit at group boundaries to surface lint and type drift
  early. Checkpoint tasks are not part of the dependency graph.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["1.4"] },
    { "id": 2, "tasks": ["2.1", "2.2", "2.3", "2.4"] },
    { "id": 3, "tasks": ["4.1", "4.4"] },
    { "id": 4, "tasks": ["4.2"] },
    { "id": 5, "tasks": ["4.3"] },
    { "id": 6, "tasks": ["6.1"] },
    { "id": 7, "tasks": ["6.2"] },
    { "id": 8, "tasks": ["6.3"] },
    { "id": 9, "tasks": ["6.4"] },
    { "id": 10, "tasks": ["6.5"] },
    { "id": 11, "tasks": ["8.1"] },
    { "id": 12, "tasks": ["8.2", "8.4", "8.7"] },
    { "id": 13, "tasks": ["8.3", "8.5"] },
    { "id": 14, "tasks": ["8.6"] },
    { "id": 15, "tasks": ["10.1", "10.3", "10.5", "10.6", "10.7", "10.8", "10.9"] },
    { "id": 16, "tasks": ["10.2", "10.4"] },
    { "id": 17, "tasks": ["12.1", "12.2", "12.3", "12.4"] },
    { "id": 18, "tasks": ["12.5", "12.6", "12.7", "12.8", "12.9", "12.10", "12.11"] },
    { "id": 19, "tasks": ["12.12", "12.13"] }
  ]
}
```
