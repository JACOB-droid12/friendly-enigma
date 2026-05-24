# Implementation Plan: frontend-design-system-overhaul

> Convert the feature design into a series of prompts for a code-generation
> LLM that will implement each step with incremental progress. Make sure
> that each prompt builds on the previous prompts, and ends with wiring
> things together. There should be no hanging or orphaned code that
> isn't integrated into a previous step. Focus ONLY on tasks that
> involve writing, modifying, or testing code.

## Overview

This plan implements `design.md` for `frontend-design-system-overhaul`,
the polish pass on top of the already-aligned baseline produced by
`frontend-analysis-bench-overhaul`. Work is grouped into the same
seven implementation groups defined in `design.md` Section 9: Group A
Foundation, Group B Mode layouts, Group C Math input typography &
spacing, Group D Method emphasis & method details, Group E Error &
warning hierarchy, Group F Results panel & chrome polish, Group G
Verification + live visual check + handoff.

Most tasks in Groups A, C, E, and F are audit-and-confirm: the prior
spec already landed the design-system surfaces, and this pass
re-asserts them rather than rewriting them. Behavioral edits live in
Group B (X + f(x) `md:min-w-[10rem]` minimum, Interval mode field-
label voice, Compute blocking on out-of-range node count) and Group D
(canonical Method Selector descriptions and role-tag voice, Method
Details initial-tab fallback guard). Group G is the fixed verification
commands plus the Live Visual Check (with documented fallback per
Requirement 11) plus the handoff updates required by Requirements 11,
12, 13, and 14.

The implementation language is **TypeScript** in the existing
`frontend/` React + Vite project. No new languages, frameworks, or
client-side numerical libraries are introduced. Tasks are scoped
tightly so each one can be reviewed and executed in a single sub-
agent turn (typically one file or one focused concern per task).

Property-based tests are intentionally not used in this feature.
Visual and structural UI alignment of an existing React surface
against a documented design system is not a pure-function or
universal-property domain; the prior spec
`frontend-analysis-bench-overhaul` made the same call. There is no
Correctness Properties section in `design.md`, and there are no PBT
sub-tasks below. The Kiro Spec Format diagnostic that flags a missing
Correctness Properties section is a "recommended" warning, not an
error, and is intentionally accepted for this spec.

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
  and never derives new numerical values for display, including
  chart curves and table cells. (Requirements 1.6, 1.7)
- No client-side interpolation math is added. No new interpolation
  method is introduced; only `lagrange`, `newton`, `barycentric`,
  and `neville` are presented. (Requirements 1.5, 1.9)
- No new product feature outside the polish-pass scope is added; no
  sidebar rebuild, no dark-mode rework, no new chart type, no new
  computational mode. (Requirement 1.10)
- All numeric user input continues to be passed to the backend as
  strings. (Requirement 1.8)
- No new design token, no new font, no new shadow or radius scale,
  no new motion handle is introduced; the pass uses only the tokens
  already published in `DESIGN.md` and `.impeccable/design.json`,
  and edits to those two files are out of scope. (Requirement 2.2)
- No property-based test sub-tasks are added in this plan; the
  design's Testing Strategy section documents why PBT does not
  apply to visual/structural UI alignment, and the prior spec
  `frontend-analysis-bench-overhaul` made the same call.
- Modifications are restricted to Implementation Files under
  `frontend/src/` (plus the strictly-necessary frontend
  configuration siblings named in the requirements Glossary) and
  Reporting Files (`docs/HANDOFF.md`, `docs/FRONTEND_HANDOFF.md`)
  per Requirement 1.11.

## Tasks

- [x] 1. Group A — Foundation: tokens, voices, focus, motion (audit-only)
  - [x] 1.1 Audit `frontend/src/index.css` for tokens, voices, and motion handles
    - Confirm the OKLCH tokens listed in `design.md` Section 2.3 are
      unchanged. Confirm the four typography handles `body`,
      `.font-math`, `.font-numeric` (with `tabular-nums`), and
      `.font-label` are intact. Confirm the motion handles
      `.transition-subtle`, `.transition-colors-fast`,
      `.animate-in-results`, `.animate-row-enter`,
      `.animate-success-pop` are intact, and that all five are
      neutralized under `prefers-reduced-motion: reduce`. No edit
      expected unless the audit finds drift.
    - File: `frontend/src/index.css`
    - _Requirements: 2.1, 2.2, 2.7, 2.9, 10.1_
  - [x] 1.2 Audit `frontend/src/components/ui/input.tsx` for the canonical input shape
    - Confirm the input is `h-8` (32px), `rounded-lg`, transparent
      background, `border-input` outline, and
      `focus-visible:border-ring focus-visible:ring-3
      focus-visible:ring-ring/50` (3px focus ring at `ring/50`
      opacity). No edit expected unless the audit finds drift.
    - File: `frontend/src/components/ui/input.tsx`
    - _Requirements: 2.1, 2.2, 10.1_
  - [x] 1.3 Audit `frontend/src/components/ui/select.tsx` for the canonical select shape
    - Confirm the styled native `<select>` is `h-8`, `rounded-lg`,
      `border-input`, with the same 3px focus ring at `ring/50`
      opacity that the input primitive uses. No edit expected
      unless the audit finds drift.
    - File: `frontend/src/components/ui/select.tsx`
    - _Requirements: 2.1, 2.2, 10.1_
  - [x] 1.4 Audit `frontend/src/components/ui/switch.tsx` for the canonical focus ring
    - Confirm the Base UI `Switch` primitive carries the canonical
      3px focus ring at `ring/50` opacity in `--ring`. No edit
      expected unless the audit finds drift.
    - File: `frontend/src/components/ui/switch.tsx`
    - _Requirements: 2.1, 10.1_
  - [x] 1.5 Audit `frontend/src/components/ui/tabs.tsx` for trigger styling and focus
    - Confirm tab triggers carry `focus-visible:ring-[3px]
      focus-visible:ring-ring/50` and
      `data-active:bg-background data-active:text-foreground`. No
      edit expected unless the audit finds drift.
    - File: `frontend/src/components/ui/tabs.tsx`
    - _Requirements: 2.1, 10.1, 10.9_
  - [x] 1.6 Audit `frontend/src/components/ui/button.tsx` and `button.variants.ts` for Flat-at-Rest
    - Confirm the default variant is flat at rest (no resting
      shadow on the resting state) per the Flat-at-Rest Rule. The
      `class-variance-authority` definition routes any shadow only
      through `hover:` or `data-[state=hover]:`/`focus-visible:`
      states. No edit expected unless the audit finds drift.
    - File: `frontend/src/components/ui/button.tsx`,
      `frontend/src/components/ui/button.variants.ts`
    - _Requirements: 2.5_
  - [x] 1.7 Audit `frontend/src/components/ui/table.tsx` for row separation and scroll wrapper
    - Confirm `Table`, `TableHeader`, `TableHead`, `TableRow`,
      `TableCell` provide `border-b` row separation and that the
      table is wrappable in a horizontal-scroll container. No edit
      expected unless the audit finds drift.
    - File: `frontend/src/components/ui/table.tsx`
    - _Requirements: 2.1, 7.2, 7.5_

- [x] 2. Group B — Mode layouts (Points, X + f(x), Interval)
  - [x] 2.1 Add `md:min-w-[10rem]` to each x-value row input in `XValuesInput.tsx`
    - On the `Input` rendered per x-value row, append
      `md:min-w-[10rem]` to the existing
      `font-numeric text-sm h-8` class so the row's numeric input
      is at least 160px wide at viewport widths of 768px and
      above, even when the surrounding column shrinks. The `md:`
      prefix means the constraint is dropped automatically below
      768px, where the row collapses to fill 100% of the input
      card content width as a single-column stack. Do not change
      the function expression input or any other layout in this
      file. Do not introduce any client-side interpolation math.
    - File: `frontend/src/components/XValuesInput.tsx`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.7, 4.8_
  - [x] 2.2 Upgrade Interval mode field labels to label voice in `FunctionIntervalInput.tsx`
    - Replace `<Label htmlFor=... className="text-xs">` with
      `<Label htmlFor=... className="font-label
      text-muted-foreground">` for all four field labels:
      "Interval Start (a)", "Interval End (b)", "Node Strategy",
      and "Node Count". Keep the inline
      `<span className="font-numeric">a</span>` and
      `<span className="font-numeric">b</span>` so the math
      symbols themselves remain in numeric voice while the
      surrounding label is in label voice. Do not change the row
      grids (`grid-cols-1 md:grid-cols-2` for `[a, b]`,
      `grid-cols-1 md:grid-cols-[2fr_1fr]` for strategy + count),
      do not change the `Select` options, do not change the
      out-of-range notice copy, and do not introduce any client-
      side math.
    - File: `frontend/src/components/FunctionIntervalInput.tsx`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.8_
  - [x] 2.3 Derive `isFormBlocked` and add it to the Compute button in `App.tsx`
    - Add a derived boolean `isFormBlocked` that is `true` when
      `form.mode === "function_interval"` and
      `Number.isFinite(form.nodeCount) &&
      (form.nodeCount < 2 || form.nodeCount > 50)`. Add
      `isFormBlocked` to the Compute button's existing `disabled`
      predicate (alongside `loading || !backendOnline`) and to its
      `aria-disabled` annotation. Reuse the existing
      `computeDisabledReason`/`title` mechanism so the button's
      hover title reads `"Node count out of range (2–50)"` when
      the flag is set. Do not change the request shape, do not
      clamp the value silently, and do not add any client-side
      math. The inline destructive notice in `FunctionIntervalInput`
      already shows the constraint to the user; this task wires
      submission blocking at the action bar.
    - File: `frontend/src/App.tsx`
    - _Requirements: 5.7, 5.8, 8.8_
  - [x] 2.4 Audit `PointsInput.tsx` for spacing rhythm and labelled-grid integrity
    - Confirm the editor uses the labelled grid
      `grid-cols-[2rem_1fr_1fr_2rem]` with `gap-2` (8px) and
      `space-y-2` (8px) between rows, headers in label voice,
      numeric inputs in `font-numeric text-sm h-8`, the index
      column in `font-numeric tabular-nums`, the remove button on
      the canonical 3px focus ring, the Add Point button as
      `<Button variant="outline" size="sm">`, and the helper
      paragraph in body voice. Confirm the editor inherits the
      input card content width without an undeclared cap. No edit
      expected unless the audit finds drift.
    - File: `frontend/src/components/PointsInput.tsx`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 10.10_
  - [x] 2.5 Audit `InputPanel.tsx` for the shared mode-tab container
    - Confirm the outer card and the `grid grid-cols-3 h-9` mode
      tab list pass through to all three input mode components
      without imposing a width cap below the input card content
      width. No edit expected unless the audit finds drift.
    - File: `frontend/src/components/InputPanel.tsx`
    - _Requirements: 3.2, 4.1, 5.1_

- [x] 3. Checkpoint after Groups A and B
  - Run `npm run build` and `npm run lint` from `frontend/` to
    confirm type and lint health before continuing. Ensure all
    tests pass, ask the user if questions arise.

- [x] 4. Group C — Math input typography & spacing (audit-only)
  - [x] 4.1 Audit `XValuesInput.tsx` numeric voice routing
    - Confirm the function expression `Input` and every x-value
      row `Input` carry `font-numeric` so they pick up
      `tabular-nums` via the `.font-numeric` rule in `index.css`.
      The x-value row also picks up `md:min-w-[10rem]` from task
      2.1; this audit does not undo that. No edit expected unless
      the audit finds drift.
    - File: `frontend/src/components/XValuesInput.tsx`
    - _Requirements: 2.7, 4.8_
  - [x] 4.2 Audit `FunctionIntervalInput.tsx` numeric voice on values
    - Confirm every numeric `Input` (interval endpoints, node
      count) and the function expression input carry
      `font-numeric`, with `tabular-nums` routed through the
      `.font-numeric` rule. The label-voice upgrade landed in task
      2.2; this audit checks numeric routing only. No edit
      expected unless the audit finds drift.
    - File: `frontend/src/components/FunctionIntervalInput.tsx`
    - _Requirements: 2.7, 5.5, 5.8_
  - [x] 4.3 Audit `EvaluationTargets.tsx` chip width and visible focus
    - Confirm the chip wrapper carries
      `focus-within:ring-2 focus-within:ring-ring/50
      focus-within:ring-inset` so the inner `Input`'s `ring-0`
      still announces focus through the wrapper, and that the
      chip width (`w-32`, 128px) accommodates values like `0.95`
      plus the remove control without truncation. The chip value
      is in numeric voice. No edit expected unless the audit
      finds drift.
    - File: `frontend/src/components/EvaluationTargets.tsx`
    - _Requirements: 2.7, 10.1_
  - [x] 4.4 Audit `WarningsDisplay.tsx` severity word and body voice
    - Confirm the severity word is in `font-label` voice, the
      body uses `text-warning-foreground` /
      `text-info-foreground` / `text-destructive` per severity,
      and each notice pairs icon, text severity word, and color
      so severity is never carried by color alone. No edit
      expected unless the audit finds drift.
    - File: `frontend/src/components/WarningsDisplay.tsx`
    - _Requirements: 8.7, 8.8, 8.9, 10.3_
  - [x] 4.5 Audit results-table headers and body cells for voice routing
    - Confirm `<TableHead>` cells in `NodesTable.tsx` and
      `EvaluationTable.tsx` use `font-label`, that body cells use
      `font-numeric` with `tabular-nums`, and that
      `MethodDetails.tsx` table headers (Newton `f[xᵢ]` and
      `Δᵏ`, Barycentric `i`/`xᵢ`/`wᵢ`, Neville `P[k]`) are in
      `font-label`. No edit expected unless the audit finds
      drift.
    - Files: `frontend/src/components/results/NodesTable.tsx`,
      `frontend/src/components/results/EvaluationTable.tsx`,
      `frontend/src/components/results/MethodDetails.tsx`
    - _Requirements: 7.2, 7.5, 10.7_

- [x] 5. Checkpoint after Group C
  - Run `npm run build` and `npm run lint` from `frontend/`.
    Ensure all tests pass, ask the user if questions arise.

- [x] 6. Group D — Method emphasis and method details
  - [x] 6.1 Rewrite the four canonical Method Selector descriptions in `MethodSelector.tsx`
    - Replace the four one-sentence descriptions on the method
      selector cards with the canonical wording from
      `design.md` Section 5.3, keeping the existing
      `text-xs text-muted-foreground leading-relaxed`
      typography:
      - Lagrange: "Lagrange shows basis polynomials and
        summation form."
      - Newton: "Newton shows divided-difference tables and
        nested form."
      - Barycentric: "Barycentric provides stable evaluation and
        is the source for graph data."
      - Neville: "Neville produces target-specific triangular
        tables."
      Do not change the card order (Lagrange, Newton,
      Barycentric, Neville), do not change the role tags, do
      not change the per-card layout, do not enlarge or
      brighten the Barycentric card, and do not introduce any
      new copy that frames Barycentric as the primary
      construction method.
    - File: `frontend/src/components/MethodSelector.tsx`
    - _Requirements: 6.1, 6.2, 6.5, 6.7_
  - [x] 6.2 Upgrade Method Selector role tags to label voice in `MethodSelector.tsx`
    - Replace the role-tag span class
      `text-[11px] font-normal tracking-normal
      text-muted-foreground` (and the Barycentric variant
      `text-[11px] font-normal tracking-normal text-primary/80`)
      with `font-label text-muted-foreground` (and
      `font-label text-primary/80` for Barycentric only). Keep
      the role-tag strings exactly as Section 5.2 specifies:
      `Construction` / `Construction` / `Stable Evaluator` /
      `Target-Specific`. Do not change the size, weight,
      padding, or layout of the tag relative to the other three
      cards; the only differentiator across the four cards
      remains the Barycentric tint. Do not introduce any
      decorative color elsewhere on the card.
    - File: `frontend/src/components/MethodSelector.tsx`
    - _Requirements: 6.1, 6.3, 6.4, 6.6, 6.7_
  - [x] 6.3 Add `pickInitialTab` helper to `MethodDetails.tsx`
    - Add a small pure helper at the top of the file:
      ```ts
      function pickInitialTab(available: MethodName[]): MethodName {
        const classroom: MethodName[] = ["lagrange", "newton", "neville"]
        const first = classroom.find((m) => available.includes(m))
        if (first) return first
        return available[0] ?? "lagrange"
      }
      ```
      Replace the existing `availableMethods[0] || "lagrange"`
      initial-tab expression with `pickInitialTab(availableMethods)`
      so the default tab is the first available Classroom-Facing
      Method evaluated in the order Lagrange → Newton → Neville,
      and falls back to whatever is available (for example
      Barycentric only) when no Classroom-Facing Method is
      present. Do not change panel layouts, headers, role tints,
      or per-method content. Do not add any interpolation math.
    - File: `frontend/src/components/results/MethodDetails.tsx`
    - _Requirements: 6.2, 6.8_
  - [x] 6.4 Audit `MethodDetails.tsx` panel structure and inner-outline drift
    - Confirm each method panel renders, in order: status row
      (the warning icon on the tab itself), method-local error
      via `ErrorNotice`, method-local warnings via `ErrorNotice`
      with `severity="warning"`, then method-specific content.
      Confirm the Lagrange basis container, the Newton
      coefficient block, and the divided-difference table
      wrapper use `bg-muted/30 rounded-lg p-3` inside the card
      outline (no inner `border`). Confirm Newton coefficient
      chips are flat at rest. Confirm the Neville table renders
      with a labelled `<TableHeader>` row of `P[k]` columns in
      `font-label` and an `h3` "Neville Table for x = {value}"
      with body-voice prefix and numeric-voice value. No edit
      expected unless the audit finds drift.
    - File: `frontend/src/components/results/MethodDetails.tsx`
    - _Requirements: 2.5, 2.6, 6.2, 7.8, 7.10_

- [x] 7. Checkpoint after Group D
  - Run `npm run build`, `npm run lint`, and `npm test` from
    `frontend/` (the smoke suite exercises Method Details
    rendering). Ensure all tests pass, ask the user if questions
    arise.

- [x] 8. Group E — Error and warning hierarchy (audit-only)
  - [x] 8.1 Audit inline error routing for function-related codes in `App.tsx`
    - Confirm `handleCompute` and `handleLoadAndCompute` route
      `unsafe_expression` and `function_domain_error` to
      `functionError` when `form.mode !== "points"` (so the
      error renders inline beneath the function input), and to
      `topError` otherwise (so the error falls back to the
      top-level banner when no function input is mounted).
      Confirm `topError` is a structured `{ code, message }`
      shape consumed by the shared `ErrorNotice`. No edit
      expected unless the audit finds drift.
    - File: `frontend/src/App.tsx`
    - _Requirements: 8.1, 8.2, 8.5, 8.6, 8.10_
  - [x] 8.2 Audit inline `ErrorNotice` wiring in `XValuesInput.tsx`
    - Confirm the inline `ErrorNotice` carries
      `severity="error"` and `layout="inline"`, is wired
      through `aria-describedby="function-error"` on the
      function input, and renders directly beneath the function
      input. Confirm the inline success line (`id=
      "function-success"`) renders adjacent to the function
      input when validation succeeds, with both an icon and a
      text label. No edit expected unless the audit finds
      drift.
    - File: `frontend/src/components/XValuesInput.tsx`
    - _Requirements: 4.5, 4.6, 8.5, 8.8, 10.2, 10.3_
  - [x] 8.3 Audit inline `ErrorNotice` wiring in `FunctionIntervalInput.tsx`
    - Confirm the inline `ErrorNotice` for
      `unsafe_expression` and `function_domain_error` carries
      `severity="error"` and `layout="inline"` and is wired
      through `aria-describedby` on the function input
      (`fn-interval-error`). No edit expected unless the audit
      finds drift.
    - File: `frontend/src/components/FunctionIntervalInput.tsx`
    - _Requirements: 8.5, 8.8, 10.2, 10.3_
  - [x] 8.4 Audit `WarningsDisplay.tsx` against the warnings catalog
    - Confirm `lib/warnings.ts` carries the canonical labels for
      every code documented in `docs/API_CONTRACT.md`:
      `nodes_reordered` ("Nodes Reordered"),
      `expanded_polynomial_omitted` ("Polynomial Omitted"),
      `neville_requires_evaluation_x` ("Neville Info"),
      `high_degree_warning` ("High Degree"), `runge_warning`
      ("Runge Phenomenon"), `close_x_warning` ("Close
      X-Values"), `extrapolation_warning` ("Extrapolation"),
      `method_disagreement_warning` ("Method Disagreement"),
      `graph_sampling_domain_error` ("Graph Domain Error"),
      and the error-level `method_failed` ("Method Failed").
      Confirm `WarningsDisplay` consumes the catalog and routes
      severe warnings (`severity: error`) through the
      destructive register and non-severe warnings through the
      warning or info register. No edit expected unless the
      audit finds drift.
    - Files: `frontend/src/lib/warnings.ts`,
      `frontend/src/components/WarningsDisplay.tsx`
    - _Requirements: 8.7, 8.8, 8.9, 8.12_
  - [x] 8.5 Audit `ErrorNotice.tsx` code-to-guidance map keys
    - Confirm the code-to-guidance map keys are exactly
      `too_few_nodes`, `duplicate_x`, `unsafe_expression`,
      `function_domain_error`, `invalid_interval`, and
      `no_methods_selected` (the last is the only frontend-only
      synthetic key, justified in `design.md` Section 6.3 and
      Requirement 8.4). Confirm no guidance entry exists for
      any code outside this set. Confirm the missing-message
      fallback ("Backend did not provide a description.")
      renders when the backend `message` is empty or missing.
      No edit expected unless the audit finds drift.
    - File: `frontend/src/components/ErrorNotice.tsx`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.11_
  - [x] 8.6 Audit `MethodDetails.tsx` per-method error and warning delegation
    - Confirm `MethodError` (per-method error in partial
      responses) renders through `ErrorNotice` with the
      canonical primary-message-secondary-code hierarchy, and
      that `MethodWarnings` renders through `ErrorNotice` with
      `severity="warning"` and the same hierarchy. Confirm
      neither surface is collapsed by default or hidden for
      cosmetic reasons. No edit expected unless the audit finds
      drift.
    - File: `frontend/src/components/results/MethodDetails.tsx`
    - _Requirements: 8.1, 8.2, 8.10, 8.12_

- [x] 9. Checkpoint after Group E
  - Run `npm run build` and `npm run lint` from `frontend/`.
    Ensure all tests pass, ask the user if questions arise.

- [x] 10. Group F — Results panel and chrome polish (audit-only)
  - [x] 10.1 Audit masthead opacity and Compute button Flat-at-Rest in `App.tsx`
    - Confirm the sticky header is opaque `bg-card` (not
      `bg-card/80`), carries `border-b` and `sticky top-0
      z-10`, and contains no `backdrop-blur` utility. Confirm
      the Compute button's default-variant rendering is flat at
      rest (no resting shadow), with shadow appearing only on
      `hover:` or `focus-visible:`. No edit expected unless the
      audit finds drift.
    - File: `frontend/src/App.tsx`
    - _Requirements: 2.5, 2.7_
  - [x] 10.2 Audit `ResultsPanel.tsx` sticky tab nav and persistent warning bar
    - Confirm the persistent warning bar renders above the tab
      list when `warnings.length > 0` and the active tab is not
      Notes. Confirm the tab nav is sticky under the page
      header (`top: var(--header-h, 60px)`), opaque
      `bg-background` with no backdrop-blur, and horizontally
      scrollable on narrow viewports (`overflow-x-auto`).
      Confirm the active tab uses `bg-primary/10 text-primary`,
      and the Notes tab carries a count badge in `warning`
      variant when warnings are present. Confirm warnings stay
      visible without click, expand, or tab change. No edit
      expected unless the audit finds drift.
    - File: `frontend/src/components/results/ResultsPanel.tsx`
    - _Requirements: 7.8, 8.12, 9.5, 9.6_
  - [x] 10.3 Audit `SummaryCard.tsx` for status chip and voice routing
    - Confirm the four-cell `grid grid-cols-2 sm:grid-cols-4
      gap-4` lays out Degree, Nodes, Compute Precision, Mode
      with headers in `font-label` and values in
      `font-numeric`. Confirm the status chip mapping (`ok` →
      success, `partial` → warning, error → destructive) and
      the per-method badge taxonomy (`secondary` for
      construction methods, `default`/primary for Barycentric,
      `info` for Neville) are intact. No edit expected unless
      the audit finds drift.
    - File: `frontend/src/components/results/SummaryCard.tsx`
    - _Requirements: 7.1, 7.2, 8.9_
  - [x] 10.4 Audit `PolynomialCard.tsx` for Long Formula handling
    - Confirm the KaTeX containers use `bg-muted/30 rounded-lg
      p-4` without an inner `border`, that the `KatexDisplay`
      wraps long output via `overflow-x: auto` on
      `.katex-display`, and that the `CopyableFormula` `<pre>`
      block uses `overflow-x-auto whitespace-pre-wrap
      break-all` so the page itself does not acquire a
      horizontal scroll bar at 320px and above. Confirm KaTeX
      is `aria-hidden` and an adjacent plain-text formula
      carries the accessible name. No edit expected unless the
      audit finds drift.
    - File: `frontend/src/components/results/PolynomialCard.tsx`
    - _Requirements: 7.3, 7.4, 9.3, 10.6_
  - [x] 10.5 Audit `EvaluationTable.tsx` for missing-cell glyph and scroll wrapper
    - Confirm the columns `x`, `Best P(x)`, `Method`, per-method
      `P(x)`, `f(x)`, `|Error|` are present, headers are in
      `font-label`, body cells are in `font-numeric` with
      `tabular-nums`, and missing cells render as a centered
      muted dot with `aria-label="not available"`. Confirm the
      Best cell is `text-primary font-semibold` and the Method
      column uses a `secondary` Badge. Confirm the table is
      wrapped in an `overflow-x-auto rounded-lg` container so
      narrow viewports scroll horizontally inside the card
      without producing a page-level horizontal scroll. No edit
      expected unless the audit finds drift.
    - File: `frontend/src/components/results/EvaluationTable.tsx`
    - _Requirements: 7.5, 9.3, 10.3_
  - [x] 10.6 Audit `GraphCard.tsx` for backend-only data and tick voice
    - Confirm the `ComposedChart` reads only
      `graph_data.x | f_x | P_x | error` and the node
      coordinates and does not perform any client-side
      resampling, smoothing, or recomputation. Confirm tick and
      tooltip fonts route through the canonical numeric stack
      (no inline `JetBrains Mono, monospace` literals; brush
      stroke and fill come from `--graph-brush-stroke` and
      `--graph-brush-fill`). Confirm a visible legend exists,
      and the chart container carries
      `aria-label="Interpolation graph. Drag the handles below
      the chart to zoom into a region."`. No edit expected
      unless the audit finds drift.
    - File: `frontend/src/components/results/GraphCard.tsx`
    - _Requirements: 1.6, 1.7, 7.6, 7.7, 10.2_
  - [x] 10.7 Audit `NodesTable.tsx` and `EducationalNotes.tsx` voice and bullet style
    - Confirm `NodesTable` headers are in `font-label`, body
      cells in `font-numeric` with `tabular-nums`, and the
      table is wrapped in an `overflow-x-auto rounded-lg`
      container. Confirm `EducationalNotes` renders the
      heading "Educational Notes" with the `BookOpen` icon and
      a primary-tinted bullet style via the `before:`
      pseudo-element. No edit expected unless the audit finds
      drift.
    - Files: `frontend/src/components/results/NodesTable.tsx`,
      `frontend/src/components/results/EducationalNotes.tsx`
    - _Requirements: 7.2, 8.12_
  - [x] 10.8 Audit `HealthIndicator.tsx` for token-aliased colors
    - Confirm the health dot routes through `bg-success`,
      `bg-destructive`, and the muted token (no raw
      `bg-[var(--destructive)]` literal), and is paired with
      an icon plus text label so health is never carried by
      color alone. No edit expected unless the audit finds
      drift.
    - File: `frontend/src/components/HealthIndicator.tsx`
    - _Requirements: 2.1, 10.3_
  - [x] 10.9 Audit `MethodSelector.tsx` corner indicator and equal-prominence rendering
    - Confirm no decorative corner dot or selection-indicator
      glyph occupies the top-right of the method selector
      card, and confirm selection state is expressed via
      `border-primary/60 bg-primary/5 ring-1 ring-primary/20`
      only. Confirm the four cards render at identical width,
      height, padding, corner radius, border weight,
      typography scale, and z-order, with the only differ-
      entiator being the Barycentric role-tag tint. No edit
      expected unless the audit finds drift.
    - File: `frontend/src/components/MethodSelector.tsx`
    - _Requirements: 6.1, 6.4, 6.6, 6.7_

- [x] 11. Checkpoint after Group F
  - Run `npm run build`, `npm run lint`, and `npm test` from
    `frontend/`. Ensure all tests pass, ask the user if
    questions arise.

- [x] 12. Group G — Verification, live visual check, and handoff
  - [x] 12.1 Run `npm run build` from `frontend/` and record the exit result
    - Working directory: `frontend/`. Command: `npm run build`.
      Resolves to `tsc -b && vite build` per
      `frontend/package.json`. Record the exit code and the
      build summary verbatim for the handoff. Do not claim
      success unless the command was actually executed and
      observed in this session.
    - _Requirements: 12.1, 12.5, 12.6, 14.7, 14.11_
  - [x] 12.2 Run `npm run lint` from `frontend/` and record the exit result
    - Working directory: `frontend/`. Command: `npm run lint`.
      Resolves to `eslint .`. Confirm zero ESLint errors.
      Pre-existing `react-refresh/only-export-components`
      warnings on shadcn primitive files are accepted; record
      any new warnings for the handoff. Do not claim success
      unless the command was actually executed and observed
      in this session.
    - _Requirements: 12.2, 12.5, 12.6, 14.7, 14.11_
  - [x] 12.3 Run `npm test` from `frontend/` and record the exit result
    - Working directory: `frontend/`. Command: `npm test`.
      Resolves to `vitest run` per `frontend/package.json`.
      Confirm the smoke tests in
      `frontend/src/components/results/results.smoke.test.tsx`
      and any sibling test files added since baseline
      `b7f7951` pass; do not relax, skip, or remove smoke
      assertions to make this spec pass. Do not claim success
      unless the command was actually executed and observed
      in this session.
    - _Requirements: 12.3, 12.4, 12.5, 12.6, 14.7, 14.11_
  - [x] 12.4 Run `git status --short` from the repository root and capture the output
    - Working directory: repository root. Command:
      `git status --short`. Capture the output verbatim for
      the Final Report's Verification Results subsection. Do
      not claim a clean status unless the command was actually
      executed and observed in this session.
    - _Requirements: 13.1, 14.7_
  - [x] 12.5 Confirm no file under `backend/` is modified, added, deleted, or renamed
    - Inspect the `git status --short` output captured in
      task 12.4. Confirm no path under `backend/` appears in
      the modified, added, deleted, or renamed list. If such
      a path appears, treat the implementation phase as
      incomplete until the path is reverted or reclassified
      into a separate, explicitly approved spec. Record the
      check result for the Final Report's "No Backend Files
      Changed" subsection.
    - _Requirements: 1.1, 13.2, 14.6_
  - [x] 12.6 Confirm no Generated Folder is staged or modified
    - Inspect the `git status --short` output captured in
      task 12.4. Confirm no entry under `node_modules/`,
      `dist/` (including `frontend/dist/`), `coverage/`
      (including `frontend/coverage/`), `.vite/`, or any
      `*.tsbuildinfo` is staged or modified. If such a path
      appears, treat the implementation phase as incomplete
      until the path is unstaged, reverted, or formally added
      to `.gitignore`. Do not modify `.gitignore` to suppress
      evidence of a previously-tracked Generated Folder.
      Record the check result for the Final Report's "No
      Backend Files Changed" subsection.
    - _Requirements: 13.3, 13.4, 13.5, 14.6_
  - [x] 12.7 Perform the Live Visual Check or document the fallback per Requirement 11
    - Attempt the Live Visual Check covering the seven
      scenarios in `design.md` Section 7.1: Points mode at
      desktop and at narrow viewport, X + f(x) mode at
      desktop and at narrow viewport, Function Interval mode
      at desktop and at narrow viewport, the results surfaces
      (Overview, Polynomial, Evaluations, Graph, Method
      Details for all four methods, Notes) against at least
      one Backend response, the canonical error hierarchy
      (one validation error and one function error like
      `unsafe_expression`), and the page-level
      horizontal-scroll inspection at 320px for all named
      surfaces. Use the Chrome DevTools MCP integration when
      available; otherwise perform manually in a Chromium-
      based browser. Record each scenario as pass or fail.
      If the live check cannot be performed (dev server not
      runnable, backend unreachable, or no browser
      available), state so explicitly in the Final Report,
      state the reason in plain language, and identify
      which scenarios were therefore unverified. Do NOT
      claim that the live check passed if it was not
      actually performed in this session. Do not start
      long-running dev servers via shell commands; if the
      dev server or backend is required, ask the user to
      start them manually and provide the exact command.
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6,
      11.7, 14.8, 14.11_
  - [x] 12.8 Update `docs/HANDOFF.md` with the dated Final Report entry
    - Append a dated session entry to `docs/HANDOFF.md`
      containing the ten Final Report subsections required by
      Requirement 14: Plan Followed (mirrors this plan's
      Group A through Group G); Files Changed (every
      Implementation File modified, created, or removed under
      `frontend/src/`, grouped by directory, with a
      "Reporting Files Updated" line for `docs/HANDOFF.md`
      and `docs/FRONTEND_HANDOFF.md`); UI Areas Improved
      (workbench surface, input modes, results surfaces,
      error and warning hierarchy, responsiveness behavior);
      API Contract Preservation (no endpoint path, request
      shape, or response shape changed; no interpolation
      math added to or moved into client code); No Backend
      Files Changed (Repository Hygiene Checks from
      Requirement 13 passed, copied from tasks 12.5 and
      12.6); Verification Results (each command from tasks
      12.1 to 12.4 with its working directory and exit
      result, plus the `git status --short` snapshot); Live
      Visual Check Result (per task 12.7, with each scenario
      pass/fail or with the explicit "not performed" note
      and unverified scenario list); Remaining UI Issues and
      Risks; Recommended Next Step. Do not claim a command
      or scenario passed unless it was actually executed and
      observed in this session.
    - File: `docs/HANDOFF.md`
    - _Requirements: 11.3, 11.4, 11.5, 11.7, 12.5, 12.6,
      13.6, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8,
      14.9, 14.10, 14.11_
  - [x] 12.9 Update `docs/FRONTEND_HANDOFF.md` with the polish-pass behavior delta
    - Update the frontend handoff to reflect the four
      behavior-affecting changes in this pass: the explicit
      `md:min-w-[10rem]` minimum on each X + f(x) row input
      at md and above (task 2.1); the label-voice upgrade on
      Interval mode field labels with the inline numeric
      `a`/`b` symbols preserved (task 2.2); the Compute
      button block on out-of-range node count via the
      derived `isFormBlocked` flag (task 2.3); the canonical
      Method Selector descriptions and the role-tag voice
      upgrade (tasks 6.1 and 6.2); the Method Details
      initial-tab fallback guard
      (`pickInitialTab`, evaluated Lagrange → Newton →
      Neville) (task 6.3). Note that everything else in this
      pass is audit-and-confirm: the design tokens, the
      typography voices, the focus rings, the motion
      handles, the error and warning hierarchy, the results
      surfaces, and the Flat-at-Rest chrome are unchanged
      from the prior spec's baseline.
    - File: `docs/FRONTEND_HANDOFF.md`
    - _Requirements: 11.7, 14.1_

- [x] 13. Final checkpoint
  - Confirm every entry in tasks 12.1 to 12.7 has an honest
    pass or fail outcome recorded in `docs/HANDOFF.md`. Per
    Requirements 11.7 and 12.5, no command or live test may
    be claimed to have passed unless it was actually executed
    and observed in this session. Confirm the Final Report's
    "No Backend Files Changed" subsection accurately reflects
    the `git status --short` capture (tasks 12.5 and 12.6).
    Ensure all tests pass, ask the user if questions arise.

## Notes

- Implementation language is TypeScript in the existing
  `frontend/` React + Vite project. No new languages,
  frameworks, or client-side numerical libraries are
  introduced.
- Property-based tests are intentionally NOT used in this
  feature. Visual and structural UI alignment of an existing
  React surface against a documented design system is not a
  pure-function or universal-property domain; the prior spec
  `frontend-analysis-bench-overhaul` made the same call. The
  design's Testing Strategy section documents this. No PBT
  sub-task appears anywhere in this plan.
- The Correctness Properties section is intentionally omitted
  from `design.md` and from this task list. The Kiro Spec
  Format diagnostic that flags a missing Correctness
  Properties section is a "recommended" warning, not an
  error, and is intentionally accepted for this spec.
- Verification routes through the Requirement 12 fixed
  commands (`npm run build`, `npm run lint`, `npm test` from
  `frontend/`), the Requirement 13 hygiene checks
  (`git status --short` from the repository root, no backend
  files changed, no Generated Folder staged), and the
  Requirement 11 Live Visual Check with its documented
  fallback when the live check cannot be performed.
- Tasks marked as "audit-only" do not carry the `*` optional
  suffix because the audit itself is required (Requirement 1
  and the Hard Rules above demand the audit pass). No edit
  is expected unless the audit finds drift.
- Each task references the specific requirement clauses it
  satisfies via the `_Requirements: X.Y, X.Z_` footer
  convention used by the prior spec at
  `.kiro/specs/frontend-analysis-bench-overhaul/tasks.md`.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "2.4", "2.5"] },
    { "id": 2, "tasks": ["4.1", "4.2", "4.3", "4.4", "4.5"] },
    { "id": 3, "tasks": ["6.1", "6.2", "6.3", "6.4"] },
    { "id": 4, "tasks": ["8.1", "8.2", "8.3", "8.4", "8.5", "8.6"] },
    { "id": 5, "tasks": ["10.1", "10.2", "10.3", "10.4", "10.5", "10.6", "10.7", "10.8", "10.9"] },
    { "id": 6, "tasks": ["12.1", "12.2", "12.3", "12.4"] },
    { "id": 7, "tasks": ["12.5", "12.6", "12.7"] },
    { "id": 8, "tasks": ["12.8", "12.9"] }
  ]
}
```
