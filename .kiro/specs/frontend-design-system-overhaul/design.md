# Design

> Scope of this document. This is the design phase for the
> `frontend-design-system-overhaul` feature, a polish pass on top of
> the already-implemented `frontend-analysis-bench-overhaul` baseline.
> Per Requirement 1 the backend, the API contract documented in
> `docs/API_CONTRACT.md`, and the numerical engine are out of scope and
> remain the source of truth. Per Requirement 2.1 the design tokens in
> `DESIGN.md` and `.impeccable/design.json` are not rewritten or
> extended; this pass uses the existing tokens only. The deliverable is
> a controlled set of small frontend edits under `frontend/src/`,
> grouped into Group A through Group G the same way the prior spec was
> grouped, plus a Method Emphasis section, an Error and Warning
> Hierarchy section, a Live Visual Check plan with a documented
> fallback, and a Verification and Hygiene plan.
>
> Property-based testing is intentionally not applied. The work is a
> visual and structural alignment of an existing React UI against a
> documented design system; it is not a pure-function or
> universal-property domain. The prior spec
> `frontend-analysis-bench-overhaul` made the same call. Verification
> routes through Requirement 12's fixed commands (`npm run build`,
> `npm run lint`, `npm test` from `frontend/`), Requirement 11's Live
> Visual Check, and Requirement 13's repository hygiene checks. No
> Correctness Properties section is included.

---

## Overview

### 1.1 Intent

Take the frontend from "design-system aligned" to "premium, modern
scientific workbench" without rewriting the design system, the
component architecture, the API contract, or the numerical engine.
Polish means refining spacing rhythm, layout structure inside
existing modes, the four-method emphasis, error and warning copy
hierarchy, responsive behavior at the 320, 768, and 1024 breakpoints,
and accessibility details, while staying strictly on the documented
OKLCH tokens, the four typography voices, the elevation strategy, and
the named rules already published in `DESIGN.md` and
`.impeccable/design.json`.

### 1.2 Non-goals

- No new design tokens, no token edits, no new color palette, no new
  font, no new shadow or radius scale (Requirement 2.2).
- No new design rule. The Semantic Honesty Rule, the Tinted Neutral
  Rule, the Three-Voice Rule, the Numeric Respect Rule, the Flat-at-
  Rest Rule, and the Inset Containment Rule continue unchanged.
- No backend changes (Requirement 1.1 to 1.10). No request shape, no
  response shape, no endpoint path. No interpolation logic in the
  client. No client-side resampling of `graph_data`.
- No new product feature outside the polish-pass scope. No sidebar
  rebuild, no dark-mode rework, no new method, no new chart type.
- No PBT (see scope note above).

### 1.3 Approach

A small, controlled set of edits under `frontend/src/`, organized
into the seven implementation groups already established by the prior
spec (Group A Foundation, Group B Mode layouts, Group C Math input
typography and spacing, Group D Method emphasis and method details,
Group E Error and warning hierarchy, Group F Results panel and chrome
polish, Group G Verification and hygiene). The vast majority of the
work in this pass is in Groups B, D, E, and F. Groups A, C, and G are
audit-and-confirm or close-out work.

Every edit is anchored to a specific file under `frontend/src/`,
scoped to a few lines or to a single concern, and verifiable through
the existing smoke tests in
`frontend/src/components/results/results.smoke.test.tsx` plus the
fixed verification commands in Requirement 12.

---

## Architecture

### 2.1 Existing architecture (carried forward, unchanged)

This pass does not change the application's architecture. It is
restated below so the design has one explicit handle on what is
already in place.

```
App.tsx
├── DisplayDigitsProvider (lib/display-digits.tsx)
└── AppShell
    ├── header
    │   ├── identity mark (font-math, "P", indigo-tinted ring badge)
    │   ├── Shortcuts dialog (Base UI Dialog)
    │   ├── Quick reference toggle (lg- only)
    │   ├── ThemeToggle
    │   └── HealthIndicator (success/destructive/checking)
    ├── main
    │   ├── ExamplesPanel  (3 lecture presets with category chips)
    │   ├── grid lg:[1fr_220px]
    │   │   ├── InputPanel
    │   │   │   ├── Tabs (points / x_values_with_function /
    │   │   │   │        function_interval)
    │   │   │   ├── PointsInput
    │   │   │   ├── XValuesInput   (function input + x-values list)
    │   │   │   ├── FunctionIntervalInput
    │   │   │   │   ├── function input
    │   │   │   │   ├── [a, b] row (md:grid-cols-2)
    │   │   │   │   └── strategy + count row (md:grid-cols-[2fr_1fr])
    │   │   │   ├── MethodSelector  (4 cards, Lagrange→Newton→
    │   │   │   │                    Barycentric→Neville)
    │   │   │   ├── PrecisionSettings
    │   │   │   ├── EvaluationTargets
    │   │   │   └── Graph toggle
    │   │   └── QuickReferenceCard (sticky lg+ rail)
    │   ├── inline duplicate-x notice
    │   ├── ActionBar (Compute, Reset, Ctrl/Cmd+Enter hint)
    │   ├── ErrorNotice (top-level, when topError set)
    │   └── ResultsPanel
    │       ├── persistent warning bar
    │       ├── sticky tab nav + DisplayDigitsControl
    │       ├── Overview      (SummaryCard + NodesTable)
    │       ├── Polynomial    (lazy: PolynomialCard + KaTeX)
    │       ├── Evaluations   (EvaluationTable)
    │       ├── Graph         (lazy: GraphCard + Recharts)
    │       ├── Methods       (MethodDetails: nested per-method
    │       │                  panels in fixed order)
    │       └── Notes         (WarningsDisplay + EducationalNotes)
    └── footer
```

### 2.2 Backend authority boundary (Requirement 1)

The polish pass touches no file under `backend/`. The frontend
continues to call `GET /health`, `POST /api/interpolate`, and
`POST /api/validate-function` only. Every request and response shape
remains exactly as documented in `docs/API_CONTRACT.md`. All
mathematical values rendered on screen come from the response
fields: `polynomial.*`, `methods.lagrange.basis_polynomials[].basis`,
`methods.newton.divided_difference_table`,
`methods.barycentric.weights`, `methods.neville.tables`,
`evaluations[]`, `graph_data.x | f_x | P_x | error`, plus the node
list. No client recomputation, no resampling, no client-side
smoothing.

User numeric input continues to be sent as strings. The frontend's
input handlers already preserve this; the polish pass does not
change `lib/api-client.ts` or `lib/api-types.ts`.

### 2.3 Token surface (Requirement 2.1, 2.2)

The pass uses only the OKLCH tokens already defined in
`frontend/src/index.css` and exposed through the Tailwind aliases
defined in the same file's `@theme inline` block. Concretely:

- Color: `--background`, `--foreground`, `--card`, `--card-foreground`,
  `--popover`, `--primary`, `--primary-foreground`, `--secondary`,
  `--secondary-foreground`, `--muted`, `--muted-foreground`,
  `--accent`, `--destructive`, `--destructive-foreground`, `--border`,
  `--input`, `--ring`, `--warning`, `--warning-foreground`, `--info`,
  `--info-foreground`, `--success`, `--success-foreground`, plus the
  graph tokens `--graph-fx`, `--graph-px`, `--graph-node`,
  `--graph-error`, `--graph-brush-stroke`, `--graph-brush-fill`.
- Typography handles: `body` (set on `body`), `.font-math` (display
  voice), `.font-numeric` (numeric voice with `tabular-nums`), and
  `.font-label` (label voice). The four voices are intentional and
  the only typographic entry points the polish pass uses.
- Radius: `sm 4px`, `md 6px`, `lg 8px`, `xl 12px`. Unchanged.
- Spacing: `xs 4px`, `sm 8px`, `md 16px`, `lg 20px`, `xl 24px`,
  `section 32px`. Unchanged.
- Motion: `--ease-standard`, `--ease-out-quart`, `--ease-out-quint`,
  `--ease-out-expo`, `--duration-fast 150ms`, `--duration-normal 200ms`.
  Used through `.transition-subtle`, `.transition-colors-fast`,
  `.animate-in-results`, `.animate-row-enter`, `.animate-success-pop`.
  All five handles continue to be neutralized under
  `prefers-reduced-motion: reduce`.

The polish pass adds no new token, no new variable, no new motion
handle, and no new voice handle. If any new utility is required at
implementation time, it MUST be expressed by composing existing
Tailwind aliases that resolve to the tokens above.

### 2.4 Breakpoint strategy (Requirement 9)

Three breakpoints, all from `.impeccable/design.json`'s `breakpoints`
list. The polish pass treats them as the only viewport contracts.

- 320px to 767px (below `md`). Workbench surface stacks vertically,
  every input mode lays out in a single column, every results
  surface stacks. No page-level horizontal scroll. Tables and the
  chart may scroll horizontally inside their containers.
- 768px to 1023px (`md` and above, below `lg`). Two-column rows
  reappear inside Interval mode and the X + f(x) row layout. The
  Quick Reference rail collapses into the toggle.
- 1024px and above (`lg` and above). The page grid is
  `grid-cols-[1fr_220px]` and the Quick Reference rail is sticky
  alongside the input column.

---

## Components and Interfaces

This section names every component the polish pass touches, what it
does today (the relevant existing behavior), and the polish-pass
delta. Every cited file lives under `frontend/src/`. No new
components are introduced unless explicitly noted; the only new file
the pass may create is a small shared bullet utility used by Theory
notes (Group F.7), and even that is optional.

### 3.1 `App.tsx`

Today.

- Owns the form state, top-level error state, function-validation
  state, debounced function-validation effect, and the keyboard
  shortcut hookup. Renders the header, the examples panel, the input
  grid, the inline duplicate-x notice, the action bar, the top-level
  `ErrorNotice` when set, and the `ResultsPanel` when a response is
  loaded.
- Header is `<header className="border-b bg-card sticky top-0 z-10">`.
- Action bar Compute is `<Button size="lg" className="gap-2">` with
  the default variant (no resting shadow set on the button).

Polish pass.

- Confirm and document that the header is opaque `bg-card` (no
  `bg-card/80` translucency, Requirement 2.5). Touch is audit-only;
  no edit expected here unless the audit finds drift.
- Confirm and document that the Compute button is flat at rest
  (Requirement 2.5, Flat-at-Rest Rule). The button-variants file
  routes the default variant through `shadow-sm` only on
  `data-[state=hover]`/`hover:` per the prior spec; this pass
  reaffirms that contract.
- Top-level error rendering already routes through `ErrorNotice`
  (`code` + `message` + recovery sentence). No structural change.
- Inline duplicate-x notice already uses
  `bg-warning/5 ring-1 ring-inset ring-warning/20` plus an icon plus
  text (Inset Containment Rule, Requirement 8.8). No structural
  change.

### 3.2 `components/InputPanel.tsx`

Today.

- Three sections: Interpolation Data (mode tabs + the three input
  components), Methods (`MethodSelector`), Precision and Evaluation
  (`PrecisionSettings`, `EvaluationTargets`, Graph toggle).
- Mode tabs use the shadcn Tabs primitive at `h-9` with three columns.

Polish pass.

- Audit-only. The card and tab shell already match the visual
  register. No edit expected unless an audit finds an undeclared
  width cap that prevents the inner editors from filling the card
  content area at 768px and above (Requirement 4.1, 5.1).

### 3.3 `components/PointsInput.tsx` (Requirement 3)

Today.

- Labelled grid `grid-cols-[2rem_1fr_1fr_2rem]` with `gap-2`
  (8px), `space-y-2` (8px) between rows, header row in `font-label`,
  numeric inputs in `font-numeric text-sm h-8`. Index column carries
  `font-numeric tabular-nums`. Remove button has the canonical
  `focus-visible:ring-3 focus-visible:ring-ring/50` ring.
- Add Point uses `<Button variant="outline" size="sm">`, matching
  `XValuesInput` and `EvaluationTargets`.
- Helper paragraph is `text-xs text-muted-foreground` body voice.

Polish pass delta.

- Confirm row spacing is at the design-system `sm` step (`space-y-2`,
  8px), with the `xs` (4px) floor as the worst-case (Requirement
  3.4). Today's implementation is at `space-y-2`; this pass keeps it.
- Confirm the editor inherits the input card content width and is
  not capped narrower than the card (Requirement 3.2, 3.5). This is
  already the case; the audit re-asserts it.
- Confirm the labelled-grid pattern is preserved so screen readers
  announce index, x, and y columns without depending on the visual
  subscript (Requirement 10.10). Already done via `aria-label` on
  each header cell and on each input.
- No structural edit expected. Points mode is the closest of the
  three modes to the target visual register.

### 3.4 `components/XValuesInput.tsx` (Requirement 4)

Today.

- Function expression `Input` in `font-numeric` with
  `aria-invalid` and `aria-describedby` wired to either the inline
  `ErrorNotice` (`id="function-error"`) or the inline success line
  (`id="function-success"`).
- Allowed-functions helper paragraph in `body` voice.
- X-values list rendered as a `grid grid-cols-[2rem_1fr_2rem]`
  (index, input, remove) inside a `space-y-2` stack. Inputs use
  `font-numeric` (no explicit `text-sm h-8` wrapper, but the
  `Input` primitive defaults to `h-8`).

Polish pass delta.

- Re-affirm Requirement 4.1: the function input fills the input
  card content area at every width. Today the `Input` primitive is
  `w-full min-w-0` and the field's parent is a single column inside
  the card content area; this is preserved.
- Re-affirm Requirement 4.2: at viewport widths of 768px and above,
  the x-values list fills the full available horizontal width.
  Today the list is in a single-column stack (`space-y-2`),
  satisfying this clause.
- Re-affirm Requirement 4.3: each x-value row's numeric input is at
  least 160px wide at md and above. The current `1fr` middle column
  with the surrounding card content typically resolves above 160px,
  but the contract is a minimum; the polish pass ensures the input
  carries an explicit `min-w-[10rem]` (160px) at `md:` so the rule
  holds even when the parent column shrinks. Implementation:
  `className="font-numeric text-sm h-8 md:min-w-[10rem]"` on the
  x-value row Input.
- Re-affirm Requirement 4.4: below 768px, the row remains a
  single-column stack and the input fills 100% of the card content
  width. Today the input is `flex-1` inside a 3-column grid that
  collapses naturally; under 768px, the explicit minimum is dropped
  by removing it from the base class (the prefix `md:` only applies
  at md and above), and the input collapses to `1fr`.
- Re-affirm Requirement 4.5: success state (validated f(x))
  renders adjacent to the function input. Today the success line is
  in this component, immediately under the function input. The
  polish pass makes no structural change here.
- Re-affirm Requirement 4.6: failure state renders inline beneath
  the function input via the shared `ErrorNotice` with
  `severity="error"` and `layout="inline"`. Today this is wired
  through `aria-describedby="function-error"`. The polish pass adds
  no behavioral change.
- Requirement 4.7 (no width thrash on add/remove): the list is a
  single-column stack with `space-y-2`; adding or removing rows
  cannot resize the column. Audit-only.
- Requirement 4.8 (Math Input typography): the function input uses
  `font-numeric` and the x-value rows use `font-numeric`. Both pick
  up `tabular-nums` from the `.font-numeric` rule in `index.css`.
  The function expression voice is JetBrains Mono without
  visually-tabular benefit, but the rule applies; no edit needed.

### 3.5 `components/FunctionIntervalInput.tsx` (Requirement 5)

Today.

- Block 1: function input full-width with inline `ErrorNotice` for
  failures and a body-voice helper paragraph.
- Block 2: `[a, b]` row, `grid-cols-1 md:grid-cols-2 gap-4`. Field
  labels carry the math symbols `a` and `b` in
  `<span className="font-numeric">` inside an `xs`-sized Label.
- Block 3: strategy + count row, `grid-cols-1 md:grid-cols-[2fr_1fr]
  gap-4`. Strategy is the `Select` primitive (32px, lg radius, 3px
  ring), count is a numeric `Input` with `min={2} max={50}` and
  inline `aria-invalid` plus a destructive notice when finite and
  out of range.

Polish pass delta.

- Re-affirm Requirement 5.1: function input full-width. Done.
- Re-affirm Requirement 5.2: `[a, b]` row is two-column at md and
  above. Done.
- Re-affirm Requirement 5.3: strategy and count occupy the full
  content width at md and above with strategy wider than count
  (`md:grid-cols-[2fr_1fr]`). Done.
- Re-affirm Requirement 5.4: at viewport widths below 768px, both
  two-column rows stack vertically without horizontal overflow.
  Today both rows use `grid-cols-1 md:grid-cols-2` (or
  `md:grid-cols-[2fr_1fr]` for the strategy row), so they stack
  below md. Verified.
- Re-affirm Requirement 5.5: math symbols `a` and `b` rendered in
  numeric voice within label-voice field labels. Today the labels
  use `<Label className="text-xs">Interval Start (<span
  className="font-numeric">a</span>)</Label>`; the polish pass
  upgrades the surrounding label to the `font-label` voice handle so
  the entire label is in label voice with the symbol embedded in
  numeric voice. Concretely: replace `<Label htmlFor=... className="
  text-xs">` with `<Label htmlFor=... className="font-label
  text-muted-foreground">` for both `a` and `b` (and for "Node
  Strategy" and "Node Count"), while keeping the inline
  `<span className="font-numeric">a</span>` and `b` so the symbols
  themselves are still numeric voice.
- Re-affirm Requirement 5.6: strategy options are spelled "Equally
  Spaced", "Chebyshev Nodes", "Custom Nodes" with API values
  `equally_spaced`, `chebyshev_nodes`, `custom_nodes`. Done.
- Re-affirm Requirement 5.7: when node count is below 2 or above 50,
  the destructive inline notice fires and submission is prevented.
  The inline notice is already wired; the polish pass also confirms
  that App.tsx blocks the Compute click while `isOutOfRange` is
  true. The current Compute button is disabled by `loading ||
  !backendOnline`; the polish pass extends this to additionally
  disable when `form.mode === "function_interval"` and `nodeCount`
  is finite and outside `[2, 50]`. Implementation: a small derived
  flag in `App.tsx` (`isFormBlocked`) that mirrors the same
  predicate as the inline notice and is added to the Compute
  `disabled` set and to the `aria-disabled` annotation. The
  predicate is the only behavioral addition in this group.
- Re-affirm Requirement 5.8: every numeric value in this mode is
  in `font-numeric` with `tabular-nums`. Done.

### 3.6 `components/MethodSelector.tsx` (Requirement 6)

Today.

- Four cards in fixed order Lagrange, Newton, Barycentric, Neville.
- Role tags are sentence-cased and rendered as `text-[11px]
  font-normal tracking-normal` rather than the canonical
  `font-label` (uppercase tracked). The Barycentric tag uses
  `text-primary/80` and the others use `text-muted-foreground`.
- One-sentence descriptions exist but drift from the canonical
  Requirement 6.5 wording.
- Selected state uses `border-primary/60 bg-primary/5 ring-1
  ring-primary/20`. Focus-within ring is `ring-2`.

Polish pass delta.

- Re-affirm Requirement 6.1: all four method cards render at
  identical width, height, padding, corner radius, border weight,
  typography scale, and z-order. The current `<label>` rule has
  identical styling for all four cards (the only differentiation is
  selection state and the Barycentric tag tint). Audit-only.
- Re-affirm Requirement 6.2: order Lagrange, Newton, Barycentric,
  Neville in both the selector and the Method Details navigation.
  Done in `MethodSelector` and in `MethodDetails` (the latter
  filters by `data.input_summary.methods_requested`, which mirrors
  the request order set in `App.tsx`).
- Update Requirement 6.3: role tags use the canonical pairing
  "Construction" for Lagrange, "Construction" for Newton, "Stable
  Evaluator" for Barycentric, "Target-Specific" for Neville. The
  current implementation already carries these strings; the polish
  pass keeps them.
- Update Requirement 6.4: render role tags using the design-system
  Label voice. Concretely: change the role-tag span class from
  `text-[11px] font-normal tracking-normal` to `font-label`. The
  Barycentric tag stays in `text-primary/80` (the only color
  differentiator); the other three stay in `text-muted-foreground`.
  No size or weight increase relative to the other three cards.
- Update Requirement 6.5: rewrite the four one-sentence
  descriptions to the canonical wording. Today's strings are close
  but drift; the polish pass replaces them as below, keeping the
  same `text-xs text-muted-foreground leading-relaxed` typography:
  - Lagrange: "Lagrange shows basis polynomials and summation
    form."
  - Newton: "Newton shows divided-difference tables and nested
    form."
  - Barycentric: "Barycentric provides stable evaluation and is the
    source for graph data."
  - Neville: "Neville produces target-specific triangular tables."
- Re-affirm Requirement 6.6: role color saturation does not exceed
  the design-system tinted-badge variant ceiling. The current
  Barycentric tag uses `text-primary/80` (text only), and the
  Neville tag uses muted-foreground (no info-cyan tint applied at
  the selector level). Audit-only.
- Re-affirm Requirement 6.7: copy never frames Barycentric as the
  primary construction method or demotes the construction methods.
  The canonical descriptions above satisfy this clause.
- Update Requirement 6.8: when the user opens the Method Details
  panel without an explicit selection, the default tab is the
  first available Classroom-Facing Method (Lagrange, then Newton,
  then Neville) rather than Barycentric. Today the default is
  `availableMethods[0] || "lagrange"`, which is the first method in
  the request order. Because `App.tsx`'s default
  `methods: ["lagrange", "newton"]` puts Lagrange first, today's
  default is Lagrange and complies. The polish pass adds an
  explicit guard: if the available list begins with Barycentric and
  any of Lagrange, Newton, or Neville is also available, the
  initial tab is the first of those three, evaluated in the order
  Lagrange, Newton, Neville. Implementation: small helper at the
  top of `MethodDetails` that picks the initial tab.

### 3.7 `components/results/MethodDetails.tsx` (Requirement 6, 7, 8)

Today.

- Active-tab tint per-method: Lagrange and Newton neutral,
  Barycentric primary tint, Neville info-cyan tint via
  `data-active:` classes. Matches the role taxonomy in 6.4.
- Each panel renders, in order: status row (the warning icon on the
  tab itself), method-local error via shared `ErrorNotice`, method-
  local warnings via shared `ErrorNotice` with `severity="warning"`,
  then method-specific content.
- Newton divided-difference table headers are `f[xᵢ]` and `Δᵏ` in
  `font-label`. Barycentric weights table headers are `i`, `xᵢ`,
  `wᵢ` in `font-label`. Neville tables include a header row of
  `P[k]` columns in `font-label` and an `h3` "Neville Table for x =
  {value}" with body voice prefix and numeric-voice value.

Polish pass delta.

- Re-affirm Requirement 6 method-emphasis order, role tints, and
  the prohibition on demoting construction methods. Audit-only.
- Re-affirm Requirement 7.8 panel structure (status, error,
  warnings, content). Done.
- Re-affirm Requirement 7.9 to 7.11 table headers. Done.
- Audit Lagrange basis container, Newton coefficient block, and
  divided-difference table wrapper for nested-outline drift. The
  current implementation uses `bg-muted/30 rounded-lg p-3` inside
  the card outline (no inner `border`). Audit-only.

### 3.8 `components/results/ResultsPanel.tsx` (Requirement 7, 9)

Today.

- Persistent warning bar above the tab list when `warnings.length >
  0` and the active tab is not Notes. Tab bar is sticky under the
  page header (`top: var(--header-h, 60px)`), opaque `bg-background`,
  no backdrop-blur. Tabs are horizontally scrollable
  (`overflow-x-auto`). Active tab uses `bg-primary/10 text-primary`.
  Notes tab carries a count badge in `warning` variant when warnings
  are present.

Polish pass delta.

- Re-affirm Requirement 7.8 (no surface is hidden to clean up the
  page). The persistent warning bar stays even when the user is on
  a non-Notes tab, and warnings remain visible on the Notes tab.
- Re-affirm Requirement 9.6 (the four method tabs remain reachable
  at narrow viewports because `MethodDetails` lays them out inside
  an `overflow-x-auto` container; today's implementation uses the
  shared `Tabs` primitive which lays out as a flex row, so a small
  audit confirms the row scrolls horizontally inside its card on
  narrow viewports).
- Audit-only otherwise.

### 3.9 `components/results/SummaryCard.tsx` (Requirement 7.1)

Today.

- Card header with title and a status `Badge` (`success` for `ok`,
  `warning` for `partial`, `destructive` for error).
- Four-cell `grid grid-cols-2 sm:grid-cols-4 gap-4` with Degree,
  Nodes, Compute precision, Mode. Each header is in `font-label`,
  each value is `font-numeric`. The Mode cell is a tinted Badge
  ("Exact" or "Numeric").
- Methods row uses the per-method role taxonomy (`secondary` for
  construction methods, `default`/primary for Barycentric, `info`
  for Neville).

Polish pass delta.

- Audit-only. The cell typography, the mode chip, and the methods
  badge taxonomy are already on tokens. Re-affirm Requirement 7.1
  reading: status chip mapping, label-voice headers, numeric-voice
  values.

### 3.10 `components/results/PolynomialCard.tsx` (Requirement 7.3, 7.4)

Today.

- Card with section header. Internal `Tabs` with `Expanded`,
  `Factored`, `Lagrange`, `Newton` tabs. Each tab body uses a
  `bg-muted/30 rounded-lg p-4` container (no inner `border`)
  wrapping `KatexDisplay`, plus a `CopyableFormula` `<pre>` block
  in `font-numeric` on `bg-muted/50 border` with a hover-revealed
  copy button. The "Not available for this degree" placeholder is
  italic body voice.
- Display-precision routing: `formatPoly` for Expanded (drops
  near-zero terms), `formatLiterals` for Factored, Lagrange,
  Newton.

Polish pass delta.

- Re-affirm Requirement 7.3: Long Formula handling. The KaTeX
  display uses `overflow-x: auto` via `.katex-display` in
  `index.css`, and the copyable `<pre>` block uses `overflow-x-auto
  whitespace-pre-wrap break-all`. Together they ensure no
  page-level horizontal scroll at 320px and above. Audit-only.
- Re-affirm Requirement 7.4: every numeric literal is in numeric
  voice via the existing display-precision-aware formatter. Today
  this is correct; the polish pass does not change the formatter.
- Re-affirm Requirement 10.6: KaTeX is `aria-hidden`, and an
  adjacent plain-text formula carries the accessible name. Done in
  `KatexDisplay.tsx`.
- Optional cosmetic: the "Not available" placeholder stays italic
  body voice (the polish pass does not introduce a new placeholder
  glyph here; the centered muted dot is reserved for tables).

### 3.11 `components/results/EvaluationTable.tsx` (Requirement 7.5)

Today.

- Table with columns `x`, `Best P(x)`, `Method`, one column per
  requested method, `f(x)`, `|Error|`. Headers are `font-label`.
  Cells are `font-numeric` with `tabular-nums`. Missing cells render
  as a centered muted dot (`<span aria-label="not available">·</span>`).
  Best cell is `text-primary font-semibold`. Method column uses a
  `secondary` Badge.

Polish pass delta.

- Re-affirm Requirement 7.5: table layout and missing-cell glyph.
  Audit-only.
- Re-affirm Requirement 9.3 (320 to 767px): the table is wrapped in
  an `overflow-x-auto rounded-lg` container, which already scrolls
  horizontally inside its card. No page-level horizontal scroll.

### 3.12 `components/results/GraphCard.tsx` (Requirement 7.6, 7.7, 1.6, 1.7)

Today.

- Reads only `graph_data.x | f_x | P_x | error` and node coords;
  renders a Recharts `ComposedChart` with `f(x)` line, `P(x)` line,
  Nodes scatter, and a Brush. Tooltip and tick fonts pull from the
  full numeric voice stack. Brush stroke and fill come from
  `--graph-brush-stroke` and `--graph-brush-fill`. The card carries
  a visible legend and the chart container has an
  `aria-label="Interpolation graph. Drag the handles below the
  chart to zoom into a region."`.

Polish pass delta.

- Re-affirm Requirement 7.6: only backend arrays drive the chart;
  no client-side recomputation. Audit-only.
- Re-affirm Requirement 7.7: visible legend, accessible chart
  region name, monospace tick labels routed through the canonical
  numeric stack. Done.
- No edit expected.

### 3.13 `components/results/NodesTable.tsx`, `EducationalNotes.tsx`

Today.

- Nodes table headers in `font-label`; cells in `font-numeric`;
  table wrapped in an `overflow-x-auto rounded-lg` container.
- Educational Notes heading reads "Educational Notes" with the
  `BookOpen` icon; bulleted list uses a primary-tinted dot via the
  `before:` pseudo-element.

Polish pass delta.

- Audit-only. Both surfaces already match the visual register the
  prior spec landed.

### 3.14 `components/ErrorNotice.tsx` (Requirement 8)

Today.

- Shared error/warning/info renderer. Renders the canonical
  hierarchy: severity word in `font-label` (block layout only),
  human-readable backend `message` as primary, `Code: {code}`
  secondary in `font-numeric`, optional recovery sentence from a
  frontend-maintained code-to-guidance map (block layout only).
- Containment uses Inset Containment Rule (`ring-1 ring-inset` with
  semantic tint). Severity is paired with icon, color, and text
  label so it is never carried by color alone.
- Missing-message fallback: when `message` is empty, `code` becomes
  primary and "Backend did not provide a description." sits in the
  secondary slot.
- Code-to-guidance map keys today: `too_few_nodes`, `duplicate_x`,
  `unsafe_expression`, `function_domain_error`, `invalid_interval`,
  `no_methods_selected`.

Polish pass delta.

- Re-affirm Requirement 8.1, 8.2, 8.3 (primary message, secondary
  code in numeric voice with `Code:` prefix, code never hidden).
  Audit-only.
- Re-affirm Requirement 8.4 (code-to-guidance map). The five backend
  codes that appear in `docs/API_CONTRACT.md` and that benefit from
  recovery guidance are exactly the ones the map already covers,
  with one alias to fix:
  - `too_few_nodes`. Backend code, present in the contract.
  - `duplicate_x`. Backend code, present in the contract. The
    current map key is `duplicate_x`, which matches the contract.
    Requirement 8.4 lists `duplicate_x` (not `duplicate_x_values`)
    because `duplicate_x` is the actual wire code. The polish pass
    keeps the existing map key as-is.
  - `unsafe_expression`. Backend code, present in the contract.
  - `function_domain_error`. Backend code, present in the contract.
  - `invalid_interval`. Backend code, present in the contract.
  - `no_methods_selected`. Frontend-only synthetic code; not a
    backend wire code. The polish pass keeps the entry because the
    requirement explicitly recognizes it (Requirement 8.4) and the
    frontend can produce it client-side when the user submits with
    zero methods selected; the entry is justified in design and
    flagged as the only synthetic key. No new key is introduced.
- The polish pass does not change the function signature of
  `ErrorNotice`. The component continues to accept `code`,
  `message`, `severity` (`error | warning | info`), `layout`
  (`block | inline`), `id`, `className`.

### 3.15 `components/WarningsDisplay.tsx` (Requirement 8.7, 8.8, 8.9, 8.12)

Today.

- Each notice uses `bg-{severity}/5 ring-1 ring-inset
  ring-{severity}/{15|20}` with an icon, a `font-label` severity
  label, and a `text-xs` body line in
  `text-info-foreground | text-warning-foreground | text-destructive`.
  Severity comes from `lib/warnings.ts`'s catalog by code.

Polish pass delta.

- Re-affirm Requirement 8.7: human-readable label per warning code
  is sourced from `lib/warnings.ts`. The catalog already includes
  every code documented in `docs/API_CONTRACT.md`:
  - Info codes: `nodes_reordered` ("Nodes Reordered"),
    `expanded_polynomial_omitted` ("Polynomial Omitted"),
    `neville_requires_evaluation_x` ("Neville Info").
  - Warning codes: `high_degree_warning` ("High Degree"),
    `runge_warning` ("Runge Phenomenon"), `close_x_warning`
    ("Close X-Values"), `extrapolation_warning` ("Extrapolation"),
    `method_disagreement_warning` ("Method Disagreement"),
    `graph_sampling_domain_error` ("Graph Domain Error").
  - Error-level (rendered with destructive register):
    `method_failed` ("Method Failed").
  This is exactly the set the requirement lists; no map edit
  needed.
- Re-affirm Requirement 8.8: every notice pairs icon, text label,
  and color. Done.
- Re-affirm Requirement 8.9: severe warnings (`severity: error`)
  use the destructive register; non-severe warnings use the warning
  or info register. Done.
- Re-affirm Requirement 8.12: warnings stay visible without click,
  expand, or tab change. Done; the persistent warning bar above the
  Results tab nav and the Notes tab both render the warnings.

### 3.16 UI primitives (`components/ui/*.tsx`)

Today.

- `input.tsx` is `h-8`, `rounded-lg`, transparent background,
  `border-input`, `focus-visible:border-ring focus-visible:ring-3
  focus-visible:ring-ring/50`. Matches `input-default`.
- `select.tsx` is the native `<select>` styled to `h-8`,
  `rounded-lg`, `border-input`, with the same 3px focus ring.
- `switch.tsx` uses the canonical 3px focus ring at `ring/50` via
  the Base UI `Switch` primitive.
- `tabs.tsx` triggers carry `focus-visible:ring-[3px]
  focus-visible:ring-ring/50` and `data-active:bg-background
  data-active:text-foreground`.
- `button.tsx` uses `class-variance-authority`; the default variant
  is flat at rest per `button.variants.ts`.
- `table.tsx` provides `Table`, `TableHeader`, `TableHead`,
  `TableRow`, `TableCell` with `border-b` row separation and a
  responsive horizontal-scroll container.

Polish pass delta.

- Audit-only. The shadcn primitives already conform to the design
  system after the prior spec.

### 3.17 `index.css`

Today.

- OKLCH tokens, four typography handles (`body`, `.font-math`,
  `.font-numeric`, `.font-label`), motion handles, reduced-motion
  block disabling all five motion handles, custom range slider
  styling, scrollbar styling, KaTeX overrides.

Polish pass delta.

- Audit-only. No new token, no new motion handle.

---

## Data Models

The polish pass does not introduce new data shapes. Every model
already lives in `frontend/src/lib/api-types.ts` and remains the
same:

- `InterpolateRequest`, `InterpolateResponse`, `ErrorBody`,
  `WarningBody`, `EvaluationEntry`, `PolynomialData`,
  `LagrangeResult`, `NewtonResult`, `BarycentricResult`,
  `NevilleResult`, `GraphData`, `InputSummary`, `ToleranceMetadata`,
  `FunctionValidationResponse`, `HealthResponse`.

The frontend's `FormState` in `components/InputPanel.tsx` is also
unchanged. The polish pass does not add fields to `FormState` and
does not change how the form maps to `InterpolateRequest` in
`App.tsx`'s `buildRequest`.

The only model-adjacent helper updated by this pass is the
predicate-derived `isFormBlocked` flag in `App.tsx` for Requirement
5.7. The flag is local state; it does not appear in any persisted
shape.

---

## Method Emphasis (Requirement 6)

The Method Emphasis Rule names the visual contract that the three
Classroom-Facing Methods (Lagrange, Newton, Neville) read as the
primary educational construction methods, while Barycentric reads as
the stable evaluator and the source of graph data. The rule is
already partially honored after the prior spec; the polish pass
re-asserts every clause and tightens the role-tag voice and the
default-tab guard.

### 5.1 Fixed order

The selector and the Method Details navigation render the four
methods in this exact order:

1. Lagrange
2. Newton
3. Barycentric
4. Neville

This order is enforced in two places:

- `components/MethodSelector.tsx` defines `ALL_METHODS` as a literal
  array in this order. The polish pass does not change the array.
- `components/results/MethodDetails.tsx` filters
  `data.input_summary.methods_requested` to render the available
  panels. Because `App.tsx`'s default `methods` array is also in
  this order and `Examples` presets keep the order, the rendered
  tab order is canonical.

### 5.2 Role tags (canonical wording)

Every method selector card and every Method Details tab carries one
role tag, in label voice (`font-label`). The wording is fixed:

| Method      | Role tag           |
|-------------|--------------------|
| Lagrange    | `Construction`     |
| Newton      | `Construction`     |
| Barycentric | `Stable Evaluator` |
| Neville     | `Target-Specific`  |

The Barycentric tag is rendered in `text-primary/80` (the design-
system tinted-badge ceiling) and no other card receives a colored
tint. Tag size, weight, padding, and layout are identical across the
four cards. The polish pass updates the role-tag span in
`MethodSelector.tsx` to use the `font-label` voice handle (was
`text-[11px] font-normal tracking-normal`); it does not change the
strings, the order, or the per-method tint.

### 5.3 One-sentence descriptions (canonical wording)

The polish pass replaces the four card descriptions with the
canonical wording from Requirement 6.5:

- Lagrange: "Lagrange shows basis polynomials and summation form."
- Newton: "Newton shows divided-difference tables and nested form."
- Barycentric: "Barycentric provides stable evaluation and is the
  source for graph data."
- Neville: "Neville produces target-specific triangular tables."

The descriptions stay in `text-xs text-muted-foreground
leading-relaxed`, the existing typography for this slot.

### 5.4 Method Details default tab

When the Method Details panel mounts without an explicit selection,
the default tab is the first available Classroom-Facing Method,
evaluated in the order Lagrange → Newton → Neville (Requirement
6.8). Today the default falls out of `availableMethods[0] ||
"lagrange"`, which is correct for the default form state but does
not encode the rule. The polish pass adds a small `pickInitialTab`
helper:

```ts
function pickInitialTab(available: MethodName[]): MethodName {
  // Prefer Classroom-Facing methods in fixed order.
  const classroom: MethodName[] = ["lagrange", "newton", "neville"]
  const first = classroom.find((m) => available.includes(m))
  if (first) return first
  // Fall back to whatever is available (e.g. Barycentric only).
  return available[0] ?? "lagrange"
}
```

The helper is local to `MethodDetails.tsx` and is the only behavior
change in this group.

### 5.5 Active-tab tint

The active-tab tint per method continues the role taxonomy already
implemented:

- Lagrange and Newton (Construction): neutral, the default
  `data-active:bg-background data-active:text-foreground`.
- Barycentric (Stable Evaluator): primary tint via
  `data-active:bg-primary/10 data-active:text-primary`.
- Neville (Target-Specific): info tint via
  `data-active:bg-info/10 data-active:text-info-foreground`.

No edit; the polish pass restates this for the design audit.

### 5.6 Equal visual prominence

The Method Emphasis Rule explicitly forbids enlarging,
brightening, or repositioning the Barycentric card relative to the
Classroom-Facing methods (Requirement 6.4). The polish pass keeps
all four cards at identical width, height, padding, corner radius,
border weight, typography scale, and z-order. The only
differentiation among the four cards is the Barycentric role-tag
tint (`text-primary/80`). The selector layout is
`grid-cols-1 sm:grid-cols-2 gap-2`; that grid is preserved.

---

## Error and Warning Hierarchy (Requirement 8)

This pass treats Requirement 8 as a re-affirm-and-tighten exercise
rather than a rebuild. The shared renderer `ErrorNotice` already
carries the canonical hierarchy. The audit below names every clause,
the file that owns the behavior today, and the polish-pass action
(audit-only or small edit).

### 6.1 Canonical hierarchy

For every error-style notice, the order from top to bottom is:

1. Severity word in `font-label` voice (block layout only, hidden in
   inline layout for compactness).
2. Human-readable Backend Error Message as the primary line, in
   error title typography (`text-sm font-medium leading-tight` plus
   the severity color).
3. Optional secondary `Code: {code}` line in `font-numeric` voice
   (`text-xs text-muted-foreground`).
4. Optional one-sentence recovery guidance from the frontend-
   maintained code-to-guidance map, in body voice
   (`text-xs text-muted-foreground leading-relaxed`).

For every warning notice, the order is:

1. Severity label (one of "High Degree", "Runge Phenomenon", "Close
   X-Values", "Extrapolation", "Method Disagreement", "Polynomial
   Omitted", "Neville Info", "Graph Domain Error", "Method Failed",
   "Nodes Reordered") in `font-label` voice with the matching
   severity color.
2. Backend warning message in body voice using
   `text-{warning|info|destructive}-foreground` so the text is
   readable on the tinted surface.

### 6.2 `ErrorNotice` reuse map

The polish pass reuses the existing `ErrorNotice` component
everywhere a structured error or warning is rendered. Existing
call sites:

| Call site                                         | Severity     | Layout   | Owner file                                            |
|---------------------------------------------------|--------------|----------|-------------------------------------------------------|
| Top-level error banner                             | `error`      | `block`  | `App.tsx`                                             |
| Inline function error (X + f(x))                   | `error`      | `inline` | `XValuesInput.tsx` (id `function-error`)              |
| Inline function error (Interval)                   | `error`      | `inline` | `FunctionIntervalInput.tsx` (id `fn-interval-error`)  |
| Per-method error in partial responses              | `error`      | `block`  | `MethodDetails.tsx` (`MethodError`)                   |
| Per-method warnings                                | `warning`    | `block`  | `MethodDetails.tsx` (`MethodWarnings`)                |

`WarningsDisplay` is a small dedicated renderer for the response-
level warnings array; it predates `ErrorNotice` and uses the same
visual rules (Inset Containment, icon-plus-text-plus-color, label
voice severity word, `text-{severity}-foreground` body). The polish
pass keeps both renderers because they each carry slightly
different obligations: `ErrorNotice` carries the code-to-guidance
map, while `WarningsDisplay` carries the human-readable label
catalog. The two are intentional companions; merging them is out of
scope.

### 6.3 Code-to-guidance map (allowed keys)

The map's keys are verified against `docs/API_CONTRACT.md` (the
"Implemented error codes" list) plus the one synthetic
frontend-only code that Requirement 8.4 explicitly recognizes:

| Key                       | Origin                       | Recovery sentence (existing)                                                                                                  |
|---------------------------|------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| `too_few_nodes`           | Backend (`API_CONTRACT.md`)  | "Add at least two distinct (x, y) points and recompute."                                                                      |
| `duplicate_x`             | Backend (`API_CONTRACT.md`)  | "Make every x-value unique. Each row needs a different x."                                                                    |
| `unsafe_expression`       | Backend (`API_CONTRACT.md`)  | "Use only supported functions: sin, cos, tan, exp, log, ln, sqrt, abs, asin, acos, atan, sinh, cosh, tanh, pi, E."           |
| `function_domain_error`   | Backend (`API_CONTRACT.md`)  | "Choose x-values inside the function's domain. For example, 1/x is undefined at x = 0."                                       |
| `invalid_interval`        | Backend (`API_CONTRACT.md`)  | "Use a finite interval [a, b] with a < b."                                                                                    |
| `no_methods_selected`     | Frontend-only synthetic code | "Select at least one method before computing."                                                                                |

The polish pass makes no key change here. It explicitly rejects any
guidance entry for codes not in the table above (Requirement 8.4
guard). If a future backend contract update adds a new code, the
map is updated only after the new code lands in `docs/API_CONTRACT.md`
and in `lib/api-types.ts` if a typed alias exists.

`api-types.ts` carries `ErrorBody` as `{ code: string; message:
string; details: Record<string, unknown> }`; codes are not narrowed
to a string union there, which keeps the map lookup tolerant of
unknown codes (the recovery sentence is simply omitted, leaving the
canonical message + code hierarchy intact).

### 6.4 Inline routing for function-related codes

When the Backend Error Code is `unsafe_expression` or
`function_domain_error` and the active mode is X + f(x) or
Interval, the error renders inline beneath the function input
(Requirement 8.5). Today this is wired in `App.tsx`'s `handleCompute`
and `handleLoadAndCompute` paths:

```ts
if (
  (code === "unsafe_expression" || code === "function_domain_error") &&
  form.mode !== "points"
) {
  setFunctionError({ code, message: err.message })
} else {
  setTopError({ code: err.code, message: err.message })
}
```

The function-error state flows into `XValuesInput.tsx` and
`FunctionIntervalInput.tsx`, each of which renders an
`ErrorNotice` with `severity="error"` and `layout="inline"` directly
beneath the function input.

When the user is in Points mode (no function input mounted), the
same code falls through to the top-level banner via `topError`
(Requirement 8.6). This is already correct.

The polish pass does not change the routing logic. It does check
that the inline `ErrorNotice` is wired through `aria-describedby` on
the function input so screen readers associate the error with the
field. Today this is wired (the `Input` carries
`aria-describedby={describedBy}` where `describedBy` is set to
`function-error` when an error is present and `function-success`
when validation succeeds).

### 6.5 Missing-message fallback (Requirement 8.11)

When the backend returns an error response with a `code` and an
empty `message`, `ErrorNotice` renders the `code` as the primary
content and "Backend did not provide a description." in the
secondary slot. This is already implemented and is exercised by the
`bothMissing` and `missingMessage` branches inside the component.

### 6.6 Severity color contract

- `error`: container `bg-destructive/5 ring-1 ring-inset
  ring-destructive/20`, icon `text-destructive`, primary text
  `text-destructive`, label `text-destructive`. The severity word
  is "Error".
- `warning`: container `bg-warning/5 ring-1 ring-inset
  ring-warning/20`, icon `text-warning`, primary text
  `text-warning-foreground`, label `text-warning`. The severity
  word is "Warning".
- `info`: container `bg-info/5 ring-1 ring-inset ring-info/15`,
  icon `text-info`, primary text `text-info-foreground`, label
  `text-info`. The severity word is "Info".

Color is paired with the icon (`AlertCircle`, `AlertTriangle`,
`Info`) and with the severity word, so severity is never carried
by color alone (Requirement 10.3).

---

## Live Visual Check Plan (Requirement 11)

The Live Visual Check is the post-implementation observation step
that supports the "premium workbench" claim with direct browser
inspection. The plan below is the canonical scenario list, the
preferred tooling, and the documented fallback.

### 7.1 Scenarios

The check covers, at minimum:

1. Points mode at desktop (≥ 1024px) and at narrow viewport
   (≤ 360px).
2. X + f(x) mode at desktop and at narrow viewport.
3. Function Interval mode at desktop and at narrow viewport.
4. Results surfaces against at least one Backend response, covering
   Overview, Polynomial, Evaluations, Graph, Method Details for all
   four methods (Lagrange, Newton, Barycentric, Neville), and
   Notes.
5. Error state surfaced through the canonical hierarchy: at least
   one validation error (`too_few_nodes` or `invalid_interval`) and
   at least one function error (`unsafe_expression`).
6. Page-level horizontal-scroll inspection at 320px (or the
   narrowest viewport the tool reaches at or above 320px) for
   Points mode, X + f(x) mode, Function Interval mode, the
   Polynomial surface, the Evaluations table, the Graph surface,
   and the Method Details panel. Each surface passes only when the
   document scrolling element does not exhibit horizontal overflow.

### 7.2 Tooling and execution

Preferred tooling is the Chrome DevTools MCP integration, which
can drive a Chromium browser, navigate to the running dev server
or production preview, take snapshots, list console messages, and
emulate a 320px viewport.

Execution path:

1. Start the backend with `python -m uvicorn app.main:app --reload
   --host 127.0.0.1 --port 8000` from `backend/` (the user runs
   this; see "Long-running commands" note below).
2. Start the frontend dev server with `npm run dev` from
   `frontend/`, or build and preview with `npm run build` then
   `npm run preview`. The user starts the dev server; the
   implementation does not start long-running processes via shell
   commands.
3. Open the application URL in a Chromium browser via the MCP
   tools (`mcp_chrome_devtools_new_page`).
4. For each scenario in 7.1, take a snapshot
   (`mcp_chrome_devtools_take_snapshot`), capture a screenshot
   (`mcp_chrome_devtools_take_screenshot`, optional but preferred),
   and record any console messages
   (`mcp_chrome_devtools_list_console_messages`).
5. For the 320px page-level horizontal-scroll inspection, resize
   the page (`mcp_chrome_devtools_resize_page`) and assert
   `document.scrollingElement.scrollWidth <=
   document.scrollingElement.clientWidth` via
   `mcp_chrome_devtools_evaluate_script`.

Screenshot storage. Captured screenshots may be saved under
`.kiro/specs/frontend-design-system-overhaul/screenshots/` or
under `.impeccable/critique/screens/` (both locations are
acceptable per Requirement 11.3). The Final Report references the
screenshots that were captured but does not require one per
scenario.

### 7.3 Manual fallback

If a browser automation tool is unavailable (no MCP, no browser, or
the tool fails to connect to the dev server), the implementer
performs the check manually in a Chromium-based browser, follows
the same scenario list, and records each scenario as pass or fail
in the Final Report. The Final Report states "Live Visual Check
performed manually." and notes any deviation from 7.1.

### 7.4 Documented fallback when the live check cannot be performed

If the Live Visual Check cannot be performed because:

- the dev server cannot be started in the working environment
  (port already in use, missing dependency, build failure that
  prevents `npm run dev` from coming up); or
- the backend cannot be reached (the FastAPI service is not
  running, the proxy cannot connect, or the health check fails);
  or
- no browser is available (no Chromium, no automation MCP, no
  manual browser available);

then the Final Report SHALL state explicitly that live browser
inspection was not performed, SHALL state the reason in plain
language, and SHALL identify which scenarios from 7.1 were
therefore unverified (Requirement 11.5).

The Final Report MUST NOT claim that the Live Visual Check passed
if the check was not actually performed in this spec's session
(Requirement 11.7).

### 7.5 Smoke-test backstop

When the Live Visual Check cannot be performed, the smoke-test
suite at `frontend/src/components/results/results.smoke.test.tsx`
remains the structural backstop for the result-rendering surfaces
(linear points example polynomial and `P(3)`, the f(x)=1/x
evaluation `29/88`, Lagrange basis from the `basis` field, Newton
divided differences, Neville triangular tables, barycentric
weights, and Graph rendering from backend `graph_data`). The
smoke tests are not a substitute for the visual check; they assert
that the results surfaces still render the canonical fields, not
that they look polished.

---

## Verification and Hygiene Plan (Requirement 12, 13)

### 8.1 Verification commands (Requirement 12)

Three commands, all run with the working directory set to
`frontend/`, in this order:

1. `npm run build`. Working directory: `frontend/`. Resolves to
   `tsc -b && vite build` per `frontend/package.json`. Must exit
   zero with no TypeScript errors and no Vite build errors.
2. `npm run lint`. Working directory: `frontend/`. Resolves to
   `eslint .`. Must exit zero with zero ESLint errors. Pre-existing
   `react-refresh/only-export-components` warnings on the shadcn
   primitive files are accepted; they predate this pass.
3. `npm test`. Working directory: `frontend/`. Resolves to
   `vitest run` per `frontend/package.json`. Must exit zero with
   the smoke tests in
   `frontend/src/components/results/results.smoke.test.tsx`
   passing, plus any sibling test files added since baseline
   `b7f7951`.

If any command fails, the implementation phase is incomplete until
the failures are resolved or documented as accepted with a
recorded justification in the Final Report and in
`docs/HANDOFF.md` (Requirement 12.5). The Final Report lists each
command with its working directory and exit result (Requirement
12.6).

### 8.2 Repository hygiene checks (Requirement 13)

After the verification commands, run `git status --short` from the
repository root and capture the output verbatim for the Final
Report.

The output:

- MUST NOT show any modified, added, deleted, or renamed file under
  `backend/` (Requirement 13.2). If such a path appears, the
  implementation phase is incomplete until the path is reverted or
  reclassified into a separate, explicitly approved spec.
- MUST NOT show any staged or modified entry inside a Generated
  Folder: `node_modules/`, `dist/`, `coverage/`, `.vite/`, or any
  `*.tsbuildinfo` (Requirement 13.3). If such a path appears, the
  implementation phase is incomplete until the path is unstaged,
  reverted, or added to `.gitignore`.
- The polish pass MUST NOT commit any Vite build output
  (`frontend/dist/`, `.vite/`, `*.tsbuildinfo`) or any test
  coverage output (`frontend/coverage/` or equivalent), per
  Requirement 13.4. These artifacts are produced locally for
  verification only.
- The polish pass MUST NOT modify `.gitignore` to suppress evidence
  of a Generated Folder being tracked (Requirement 13.5). A
  gitignore change is permitted only to formally exclude a
  Generated Folder that was previously not ignored, and any such
  change is called out in the Final Report.

The Final Report states, in plain language, that no file under
`backend/` was modified during this spec and that no Generated
Folder is staged (Requirement 13.6).

### 8.3 Final Report (Requirement 14)

The Final Report is a dated session entry in `docs/HANDOFF.md`,
mirrored as needed in `docs/FRONTEND_HANDOFF.md`. It contains the
ten subsections from Requirement 14:

1. Plan Followed (mirrors this design's Group A through Group G,
   notes any deviation).
2. Files Changed (every implementation file modified under
   `frontend/src/`, grouped by directory; reporting file updates
   listed separately).
3. UI Areas Improved (plain-language description of what changed in
   the workbench surface, the input modes, the results surfaces,
   the error and warning hierarchy, and the responsiveness
   behavior).
4. API Contract Preservation (no endpoint, request shape, or
   response shape changed; no math added to client code).
5. No Backend Files Changed (Requirement 13).
6. Verification Results (each command from 8.1 with working
   directory and exit result, plus the `git status --short`
   output snapshot from 8.2).
7. Live Visual Check Result (per 7.1, 7.2, 7.3, 7.4; honest pass or
   fail per scenario; if not performed, the explicit fallback
   statement).
8. Remaining UI Issues and Risks.
9. Recommended Next Step.
10. Honesty clause: any unrun command or unobserved scenario is
    NOT claimed to have passed.

---

## Implementation Plan (Groups A through G)

The plan below is ordered. Each group lists the files that may be
touched, the polish-pass action per file, the requirement clauses
the action satisfies, and the verification commands that gate the
group. This pass is a polish pass, so most groups are
audit-and-confirm with a few small edits per group.

### Group A. Foundation: tokens, voices, focus, motion

Action.

- Audit `frontend/src/index.css` to confirm: the four typography
  voices are intact (`body`, `.font-math`, `.font-numeric`,
  `.font-label`); the OKLCH tokens are unchanged; the motion
  handles `.transition-subtle`, `.transition-colors-fast`,
  `.animate-in-results`, `.animate-row-enter`,
  `.animate-success-pop` are intact and all five are neutralized
  under `prefers-reduced-motion: reduce`.
- Audit `frontend/src/components/ui/input.tsx`,
  `select.tsx`, `switch.tsx`, `tabs.tsx`, `button.tsx`, `table.tsx`
  to confirm the canonical 32px input height (`h-8`), `lg` radius
  (`rounded-lg`), 3px focus ring at `ring/50`, transparent
  backgrounds, and `border-input` outlines.
- No edit expected unless the audit finds drift.

Files possibly touched.

- `frontend/src/index.css` (audit-only)
- `frontend/src/components/ui/input.tsx` (audit-only)
- `frontend/src/components/ui/select.tsx` (audit-only)
- `frontend/src/components/ui/switch.tsx` (audit-only)
- `frontend/src/components/ui/tabs.tsx` (audit-only)
- `frontend/src/components/ui/button.tsx` (audit-only)
- `frontend/src/components/ui/table.tsx` (audit-only)

Verification.

- `npm run build` in `frontend/`.
- `npm run lint` in `frontend/`.

Requirement traceability.

- 2.1, 2.2 (tokens unchanged).
- 2.7, 9 (Numeric Respect, Three-Voice through unchanged handles).
- 2.9 (reduced motion through unchanged handles).
- 10.1 (focus ring contract).

### Group B. Mode layouts (Points, X + f(x), Interval)

Action.

- `XValuesInput.tsx`: add an explicit `md:min-w-[10rem]` to each
  x-value row's `Input` so Requirement 4.3's 160px minimum holds at
  md and above even when the surrounding column shrinks. Below 768px
  the constraint is dropped automatically (no md prefix). No other
  layout change.
- `FunctionIntervalInput.tsx`: upgrade the four field labels
  ("Interval Start (a)", "Interval End (b)", "Node Strategy", "Node
  Count") from `text-xs` body voice to `font-label
  text-muted-foreground` so the entire label is in label voice with
  the `<span className="font-numeric">a</span>` and `b` symbols
  preserved as numeric voice. No structural layout change; the row
  grids stay `grid-cols-1 md:grid-cols-2` and
  `grid-cols-1 md:grid-cols-[2fr_1fr]`.
- `App.tsx`: derive an `isFormBlocked` flag that is `true` when
  `form.mode === "function_interval"` and `Number.isFinite(
  form.nodeCount) && (form.nodeCount < 2 || form.nodeCount > 50)`,
  and add it to the Compute button's `disabled` and
  `aria-disabled` set. Reuse the existing
  `computeDisabledReason` for the title (`"Node count out of
  range (2–50)"`).
- `PointsInput.tsx`: audit-only. Already on tokens.

Files possibly touched.

- `frontend/src/components/XValuesInput.tsx`
- `frontend/src/components/FunctionIntervalInput.tsx`
- `frontend/src/App.tsx`
- `frontend/src/components/PointsInput.tsx` (audit-only)
- `frontend/src/components/InputPanel.tsx` (audit-only)

Verification.

- `npm run build` in `frontend/`.
- `npm run lint` in `frontend/`.

Requirement traceability.

- 3.1 to 3.7 (Points polish, audit-only).
- 4.1 to 4.8 (X + f(x) full-width, 160px minimum, success state
  adjacent, inline failure state, Math Input typography).
- 5.1 to 5.8 (Interval four-block layout, label voice on field
  labels, numeric `a` and `b`, balanced strategy/count row,
  stack-below-md, inline out-of-range notice and submission block).
- 9.2, 9.3 (md and below stacking).

### Group C. Math input typography and spacing

Action.

- `XValuesInput.tsx`: audit-only. The function input and x-value
  row inputs already use `font-numeric`. The polish pass confirms
  `tabular-nums` is inherited via the `.font-numeric` rule.
- `FunctionIntervalInput.tsx`: audit-only beyond the label-voice
  upgrade in Group B. Numeric values already use `font-numeric`.
- `EvaluationTargets.tsx`: audit-only. The chip wrapper carries
  `focus-within:ring-2 focus-within:ring-ring/50
  focus-within:ring-inset` so the inner `Input` (which sets
  `ring-0`) still announces focus through the wrapper. The chip
  width is `w-32` (128px), which fits values like `0.95` plus the
  remove control without truncation; no edit needed.
- `MethodSelector.tsx`: change the role-tag span from
  `text-[11px] font-normal tracking-normal text-muted-foreground`
  (or `text-primary/80` for Barycentric) to `font-label
  text-muted-foreground` (or `font-label text-primary/80` for
  Barycentric). This is the single label-voice upgrade in this
  group, paired with the description rewrite in Group D.
- `WarningsDisplay.tsx`: audit-only. Severity word already in
  `font-label`; body in `text-{severity}-foreground`.
- `NodesTable.tsx`, `EvaluationTable.tsx`: audit-only. Headers
  already use `font-label`.
- `MethodDetails.tsx`: audit-only. Headers already use `font-label`.

Files possibly touched.

- `frontend/src/components/MethodSelector.tsx`
- `frontend/src/components/XValuesInput.tsx` (audit-only)
- `frontend/src/components/FunctionIntervalInput.tsx` (audit-only)
- `frontend/src/components/EvaluationTargets.tsx` (audit-only)
- `frontend/src/components/WarningsDisplay.tsx` (audit-only)
- `frontend/src/components/results/NodesTable.tsx` (audit-only)
- `frontend/src/components/results/EvaluationTable.tsx` (audit-only)
- `frontend/src/components/results/MethodDetails.tsx` (audit-only)

Verification.

- `npm run build` in `frontend/`.
- `npm run lint` in `frontend/`.

Requirement traceability.

- 2.7 (Numeric Respect on values).
- 6.4 (label voice on role tags).
- 7.2, 7.5, 7.7 (label voice on table headers, voice on
  evaluations table).
- 10.7 (existing aria patterns preserved).

### Group D. Method emphasis and method details

Action.

- `MethodSelector.tsx`: rewrite the four one-sentence descriptions
  to the canonical wording from Section 5.3, keeping the existing
  `text-xs text-muted-foreground leading-relaxed` typography. Keep
  the role-tag pairing already in place (Section 5.2). Pair with
  the label-voice upgrade in Group C.
- `MethodDetails.tsx`: add `pickInitialTab` helper (Section 5.4)
  and use it for the initial `useState`. No structural change to
  panel layouts, headers, or per-method tints.
- `MethodDetails.tsx`: audit `MethodError` and `MethodWarnings` for
  the canonical hierarchy (already routed through `ErrorNotice` per
  the prior spec). Audit-only.

Files possibly touched.

- `frontend/src/components/MethodSelector.tsx`
- `frontend/src/components/results/MethodDetails.tsx`

Verification.

- `npm run build` in `frontend/`.
- `npm run lint` in `frontend/`.
- `npm test` in `frontend/` (the smoke test exercises Method
  Details rendering).

Requirement traceability.

- 6.1 to 6.8 (Method Emphasis Rule, fixed order, role tags, Stable
  Evaluator tint, canonical descriptions, default tab guard).

### Group E. Error and warning hierarchy

Action.

- Audit-only across all error and warning surfaces, per Section 6.
- `App.tsx`: confirm the inline routing for `unsafe_expression`
  and `function_domain_error` keeps the function-input region as
  the destination when the function input is mounted, and falls
  back to the top-level banner when in Points mode.
- `XValuesInput.tsx`, `FunctionIntervalInput.tsx`: confirm the
  inline `ErrorNotice` is wired through `aria-describedby`.
- `WarningsDisplay.tsx`: confirm the catalog's labels match
  Section 3.15 and Requirement 8.7 wording.
- `ErrorNotice.tsx`: confirm the code-to-guidance map matches
  Section 6.3.
- `MethodDetails.tsx`: confirm `MethodError` and `MethodWarnings`
  delegate to `ErrorNotice`.

Files possibly touched.

- `frontend/src/App.tsx` (audit-only)
- `frontend/src/components/XValuesInput.tsx` (audit-only)
- `frontend/src/components/FunctionIntervalInput.tsx` (audit-only)
- `frontend/src/components/WarningsDisplay.tsx` (audit-only)
- `frontend/src/components/ErrorNotice.tsx` (audit-only)
- `frontend/src/components/results/MethodDetails.tsx` (audit-only)

Verification.

- `npm run build` in `frontend/`.
- `npm run lint` in `frontend/`.

Requirement traceability.

- 8.1 to 8.12 (canonical hierarchy, code-to-guidance map, inline
  routing, label catalog, severity color contract,
  missing-message fallback, partial-response handling, no warning
  hidden for cosmetics).
- 10.3 (severity not by color alone).
- 10.6, 10.7 (existing aria patterns preserved).

### Group F. Results panel and chrome polish

Action.

- `App.tsx`: confirm header is opaque `bg-card` (not `bg-card/80`),
  Compute button is flat at rest, and footer copy is on token.
  Audit-only unless drift is found.
- `ResultsPanel.tsx`: confirm the sticky tab nav uses opaque
  `bg-background` with no backdrop-blur, the tab nav is
  horizontally scrollable on narrow viewports, and the active tab
  uses `bg-primary/10 text-primary`. Audit-only.
- `PolynomialCard.tsx`: audit-only. KaTeX containers are
  `bg-muted/30 rounded-lg p-4` without inner border, the card
  outline provides containment.
- `MethodDetails.tsx`: audit basis polynomials, Newton coefficient
  block, and divided-difference table wrapper for the Flat-at-Rest
  Rule. Today these surfaces are flat at rest; audit-only.
- `EvaluationTable.tsx`: audit-only. Missing-cell glyph already in
  place; headers in `font-label`.
- `NodesTable.tsx`: audit-only. Horizontal-scroll wrapper already
  present; headers in `font-label`.
- `GraphCard.tsx`: audit-only. The chart consumes only backend
  arrays, axis ticks and the tooltip use the canonical numeric
  font stack via `--graph-*` tokens (Requirement 7.7), and the
  `f(x)` line, `P(x)` line, scatter, and brush all read tokens
  rather than literals.
- `EducationalNotes.tsx`: audit-only. Heading reads "Educational
  Notes"; bullet style intentional.
- `HealthIndicator.tsx`: audit-only. Routes through `bg-success`,
  `bg-destructive`, and the muted token; pairs icon with text.
- `MethodSelector.tsx`: cosmetic audit of the corner indicator
  (the prior spec removed the corner dot in favor of the
  `border-primary/60 bg-primary/5 ring-1 ring-primary/20` selected
  state); confirm no decorative corner element returns.

Files possibly touched.

- `frontend/src/App.tsx` (audit-only)
- `frontend/src/components/ResultsPanel.tsx` (audit-only)
- `frontend/src/components/results/PolynomialCard.tsx` (audit-only)
- `frontend/src/components/results/MethodDetails.tsx` (audit-only)
- `frontend/src/components/results/EvaluationTable.tsx` (audit-only)
- `frontend/src/components/results/NodesTable.tsx` (audit-only)
- `frontend/src/components/results/GraphCard.tsx` (audit-only)
- `frontend/src/components/results/EducationalNotes.tsx` (audit-only)
- `frontend/src/components/HealthIndicator.tsx` (audit-only)
- `frontend/src/components/MethodSelector.tsx` (cosmetic audit)

Verification.

- `npm run build` in `frontend/`.
- `npm run lint` in `frontend/`.
- `npm test` in `frontend/` (smoke).

Requirement traceability.

- 2.5, 2.6 (no glassmorphism, no resting shadow on action
  controls, no nested cards).
- 2.7 (Numeric Respect).
- 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8 (results surfaces).
- 9.1, 9.2, 9.3, 9.4, 9.5, 9.6 (responsive behavior).
- 10.7 (preserved aria patterns).

### Group G. Verification, live tests, and handoff

Action.

- Run the three verification commands in Section 8.1.
- Run `git status --short` from the repository root and capture
  the output for the Final Report (Section 8.2).
- Perform the Live Visual Check per Section 7. If the check cannot
  be performed in this environment, follow the documented fallback
  in Section 7.4.
- Update `docs/HANDOFF.md` with the dated session entry containing
  the ten subsections from Requirement 14.
- Update `docs/FRONTEND_HANDOFF.md` with any frontend-relevant
  behavior change from this pass (the role-tag voice upgrade, the
  canonical method descriptions, the explicit 160px x-value input
  minimum, the Compute button block on out-of-range node count).

Files touched.

- `docs/HANDOFF.md`
- `docs/FRONTEND_HANDOFF.md`

Verification.

- The three commands from Section 8.1 are themselves the
  verification for this group.

Requirement traceability.

- 11.1 to 11.7 (Live Visual Check and the documented fallback).
- 12.1 to 12.6 (verification commands, exit results, smoke
  protection).
- 13.1 to 13.6 (repository hygiene checks, no backend files
  modified, no Generated Folder staged, no `.gitignore` evasion).
- 14.1 to 14.11 (Final Report subsections and honesty clause).

---

## Error Handling

This pass does not introduce new error paths. It re-affirms the
existing handling.

- Backend validation failures arrive as HTTP 400 with
  `{ status: "error", error: { code, message, details } }`. The
  frontend's `lib/api-client.ts` raises `ApiError(code, message)`,
  which `App.tsx` catches in `handleCompute`/`handleLoadAndCompute`.
  The catch routes the error to either `functionError` (for
  `unsafe_expression`/`function_domain_error` outside Points mode)
  or `topError` (for everything else), and `ErrorNotice` renders
  the canonical hierarchy.
- Pydantic schema failures (HTTP 422) arrive without the canonical
  `error` body. `lib/api-client.ts` falls back to a synthesized
  message; `ErrorNotice` renders it under the missing-message
  fallback if `code` is absent, or with the canonical hierarchy if
  the synthesized error provides a `code`.
- Network failures (no response, CORS, dev-server proxy down)
  surface as a non-`ApiError` exception. `App.tsx` catches the
  exception, sets `topError` with the generic
  `"An unexpected error occurred"` message, and `ErrorNotice`
  renders the both-missing branch.
- Partial responses (`status: "partial"`) continue to render
  successful methods plus per-method errors via
  `MethodDetails.MethodError`, which delegates to `ErrorNotice`.
- Backend warnings (response-level and per-method) render via
  `WarningsDisplay` (response-level, on the Notes tab and in the
  persistent warning bar) and via `MethodDetails.MethodWarnings`
  (per-method, inside each method panel). Warnings are never
  hidden, collapsed by default, or removed for cosmetic reasons
  (Requirement 8.12).

---

## Testing Strategy

### 11.1 Why no property-based testing

This pass is visual and structural alignment of an existing React
UI against a documented design system. The work is dominated by
copy edits, layout adjustments, voice routing, and label-voice
upgrades, none of which is a pure-function or universal-property
domain. There is no algorithmic content here that benefits from
generating 100 inputs against an invariant. The prior spec
`frontend-analysis-bench-overhaul` made the same call.

The PBT-fit assessment per the design-process guide:

- Pure functions with universal properties? No. The pass touches
  React components and layout classes; the only pure helper added
  is `pickInitialTab`, which is a six-line lookup with three
  meaningful cases that an example test covers exactly.
- Parsers/serializers? No. The component surface does not parse or
  serialize; backend parsing remains in Python.
- Data transformations across an input space? No. The display-
  precision helpers (`formatPoly`, `formatLiterals`, `format`) are
  unchanged in this pass.
- IaC? No.
- Side-effect-only code? No (and PBT would not apply if it were).

### 11.2 What does protect this pass

Three layers, all already in place.

1. The smoke tests in
   `frontend/src/components/results/results.smoke.test.tsx`
   protect the result-rendering contract: linear points polynomial
   and `P(3)`, the f(x)=1/x evaluation `29/88`, Lagrange basis
   from the `basis` field, Newton divided differences, Neville
   triangular tables, barycentric weights, Graph rendering from
   backend `graph_data`. The pass MUST NOT relax, skip, or remove
   these tests (Requirement 12.4).
2. The verification commands in Section 8.1 (build, lint, test)
   gate the pass as a whole.
3. The Live Visual Check (Section 7) supports the "premium
   workbench" claim with direct browser inspection. Where the
   live check cannot be performed, the documented fallback in
   7.4 keeps the limitation explicit (Requirement 11.5).

### 11.3 New example-style tests (optional)

If the polish pass introduces the `pickInitialTab` helper as an
exported function (rather than an inline closure), a small
example-based unit test in `MethodDetails.smoke.test.tsx` (new
file) covers the three meaningful cases:

- `pickInitialTab(["lagrange", "newton", "barycentric"])` → `"lagrange"`.
- `pickInitialTab(["barycentric", "newton"])` → `"newton"` (skips
  Barycentric because Newton is available).
- `pickInitialTab(["barycentric"])` → `"barycentric"` (only choice).

These three cases are deterministic and exhaustive across the
helper's behavior; PBT would not add value.

If the helper stays internal to `MethodDetails`, the case is
covered indirectly by the existing smoke test through the rendered
default tab. The polish pass leaves this decision to
implementation.

### 11.4 Accessibility checks (Requirement 10)

- WCAG AA contrast (Requirement 10.4) is preserved through unchanged
  tokens; the polish pass does not change any color pairing. The
  Final Report records the token surface as unchanged.
- Focus rings (Requirement 10.1) are inherited from unchanged
  primitives; the audit in Group A re-asserts the 3px contract.
- Keyboard shortcuts (`Ctrl/Cmd+Enter`, `Alt+R`, `?`) and the
  `aria-keyshortcuts` annotations in `App.tsx` are preserved
  (Requirement 10.5).
- Screen-reader treatment of KaTeX (Requirement 10.6) is preserved
  in `KatexDisplay.tsx`.
- `aria-label`/`aria-hidden` patterns on Math Input subscripts and
  numeric table headers (Requirement 10.7) are preserved across
  `PointsInput`, `XValuesInput`, `NodesTable`, `EvaluationTable`,
  and `MethodDetails`.
- `prefers-reduced-motion: reduce` (Requirement 10.8) is preserved
  through unchanged motion handles in `index.css`.
- Method tab arrow-key navigation (Requirement 10.9) is preserved
  through the Base UI `Tabs.Tab` primitives.
- Labelled-grid pattern on Points and X-Values editors (Requirement
  10.10) is preserved.

### 11.5 Manual scenarios cross-referenced from Section 7.1

For the Live Visual Check, each scenario maps back to the
requirement clauses it verifies:

- Points mode at desktop and narrow viewport → Requirements 3.1
  to 3.7, 9.1 to 9.5.
- X + f(x) mode at desktop and narrow viewport → Requirements 4.1
  to 4.8, 9.1 to 9.5.
- Function Interval mode at desktop and narrow viewport →
  Requirements 5.1 to 5.8, 9.1 to 9.5.
- Results surfaces with at least one Backend response →
  Requirements 7.1 to 7.8, 9.4.
- Error state through the canonical hierarchy → Requirements 8.1
  to 8.12, 10.3.
- 320px page-level horizontal-scroll inspection per surface →
  Requirements 7.3, 9.3, 9.4, 9.5, 9.6, 11.6.

---

## Cross-cutting Notes

### 12.1 Consistency with the prior spec

This pass treats `frontend-analysis-bench-overhaul`'s implemented
state as the baseline. Many of this design's clauses are
audit-and-confirm rather than rewrite, because the prior spec
already landed: the `font-label` voice handle, the inset-contained
warnings, the Inset Containment Rule, the missing-message fallback
in `ErrorNotice`, the canonical role tags in MethodSelector, the
`pickInitialTab`-style guard implicit in the default form state,
the label-voice table headers, the `bg-muted/30` tonal layering on
Method Details surfaces, the lazy-loaded `GraphCard` and
`PolynomialCard`, the persistent warning bar, and the per-method
active-tab tint.

The polish pass is the smallest controlled set of edits that takes
the surface from "design-system aligned" to "premium, modern
scientific workbench" without rewriting any of the above.

### 12.2 Anti-references re-asserted

This pass also re-asserts every anti-reference from `PRODUCT.md`
and `DESIGN.md`:

- No generic SaaS dashboard, no purple-gradient AI aesthetic, no
  toy calculator, no cluttered 2005 academic clutter, no debug
  panel feel.
- No gradient text, no glassmorphism / backdrop-blur, no bounce or
  elastic easing, no animation of layout properties, no nested
  cards, no modals as a first solution, no hiding of warnings or
  errors for cosmetic reasons.
- No Inter, no system-default sans-serif as the primary font, no
  pure black or pure white, no `border-left` accent stripes above
  1px, no em dashes in UI copy, no slow transitions over 300ms.
- No client-side recomputation of any backend numerical result.

### 12.3 Optional follow-up (out of scope here)

The Final Report's "Recommended Next Step" subsection (Requirement
14.10) names the next reasonable action. Candidates the polish
pass does NOT include:

- Code-splitting beyond the existing `lazy(GraphCard)` and
  `lazy(PolynomialCard)`.
- A dedicated dark-mode visual pass.
- Extending Method Details copy with worked-example walkthroughs.
- Adding a fifth interpolation method or a new chart type.

Any of the above would belong to a separate spec; this pass keeps
its boundary tight at the visual register polish described in
Sections 1 through 11.
