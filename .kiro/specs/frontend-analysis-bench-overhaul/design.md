# Design

> Scope of this document. This is the pre-coding design phase for the
> `frontend-analysis-bench-overhaul` feature. Per Requirement 8, it contains
> four deliverables in a fixed order: a PRODUCT.md summary, a DESIGN.md /
> design.json summary, a per-mode and per-component UI audit, and an
> implementation plan. Per Requirement 8.7 it contains analysis and plan
> only, no executable code changes. Per Requirement 8.1 no file under
> `frontend/src/` is modified, created, or deleted as part of this phase.
> Per Requirement 1, the backend, the API contract, and the numerical
> engine are out of scope and remain the source of truth; the frontend
> renders backend results and never recomputes math on the client.
>
> Property-based testing is intentionally not applied to this feature.
> The work is a visual and structural alignment of an existing React UI
> against a documented design system, not a pure-function or universal-
> property domain. Verification is the fixed list in Requirement 9
> (`tsc -b`, `npm run build`, `npm run lint`, the impeccable detector)
> plus the live-test scenarios in Requirement 10 (rendered against the
> running backend). No Correctness Properties section is included.

---

## 1. PRODUCT.md Summary

This summary distills `PRODUCT.md` so the implementation plan can be checked
against the product's intent. Wording is paraphrased; quoted phrases come
straight from `PRODUCT.md`.

### Product register

`product`. The register is professional and scholarly. Copy is direct,
precise, and never marketing-flavored. UI text addresses a numerical-
analysis worker, not a generic SaaS user. There is no playful product
voice and no "AI assistant" voice.

### Users

- Primary: students taking Numerical Analysis or similar courses who
  must understand and verify interpolation methods, not just collect a
  final number. They expect to see basis polynomials, divided-difference
  tables, weights, Neville triangular tables, and warnings.
- Secondary: instructors and professors preparing or reviewing
  demonstrations, plus engineers and technical users running quick
  interpolation checks with full method visibility.
- Context: the user arrives with data points or a function, works
  through method-specific outputs, and leaves with verified results in
  proper mathematical notation alongside numerical-behavior warnings.

### Product purpose

A "numerical-analysis calculator and workbench for interpolation and
polynomial approximation". It serves two intents at once:

- As a learning tool, it shows Lagrange basis polynomials, summation and
  expanded forms, Newton divided-difference tables and nested form,
  Barycentric weights and stable evaluations, Neville triangular tables,
  and pedagogical warnings (high degree, extrapolation, close x-values,
  Runge phenomenon, method disagreement).
- As a verification tool, it compares selected methods side by side,
  evaluates targets, shows `f(x)` and absolute error when the function
  is known, and renders graph comparisons from backend graph data.

The frontend's role is to make the math understandable and trustworthy.
It must not become the math engine. The backend remains the source of
truth for parsing, validation, precision, interpolation, method tables,
warnings, graph-ready data, and numerical correctness. This boundary is
re-asserted as a hard rule by Requirement 1.

### Brand personality

Five words: scholarly, precise, trustworthy, premium, modern.

- Scholarly: aligned with numerical-analysis lectures, formula notation,
  and method tables.
- Precise: values, warnings, methods, and graph data feel exact and
  carefully handled.
- Trustworthy: the UI never hides warnings, errors, or method
  disagreements to look cleaner.
- Premium: deliberate layout, typography, spacing, color, motion, and
  interaction polish, not decorative clutter.
- Modern: calm, intentional, and contemporary without chasing trends.

### Anti-references

The product explicitly rejects these UI tropes. The audit and plan use
this list to flag what to remove or avoid:

- Generic SaaS dashboards, gradient hero cards, startup-style polish.
- Purple-gradient AI app aesthetic.
- Plain admin form treatment.
- Toy calculator with oversized colorful buttons.
- Cluttered 2005 academic software.
- Raw JSON or debug-panel feeling.
- Hiding warnings or errors to make the page look cleaner.
- Thick left-border callouts and obvious AI UI tropes.
- Inter-heavy generic typography.
- Wolfram Alpha density, Overleaf document-editor look, Desmos toy/graph-
  only feel, MATLAB old-school clutter.

### Design principles

`PRODUCT.md` numbers these. They map directly into the audit categories
and the implementation plan.

1. Show the work, not just the answer. Every method output, intermediate
   table, and warning the backend produces should be visible and
   readable.
2. Math deserves typographic respect. Formulas, tables, and numeric
   values are first-class content. They get proper rendering, adequate
   space, and clear hierarchy.
3. Warnings are features, not blemishes. High-degree warnings,
   conditioning alerts, and method disagreements are pedagogically
   valuable. They are displayed prominently, never hidden for
   aesthetics.
4. Precision over decoration. Every visual choice serves clarity or
   hierarchy. If a design element does not help the user understand or
   trust the output, it is removed.
5. The backend is the authority. The frontend renders, organizes, and
   presents. It does not recompute, reinterpret, or editorialize.

### Accessibility targets

`PRODUCT.md` sets WCAG AA where practical. Concrete obligations:

- Every input has a visible or accessible label.
- Input groups have helper text where the expected format is not
  obvious.
- Validation errors are shown in text, not only color.
- Backend field-related errors are associated with the relevant input
  where practical (`aria-describedby` or proximity).
- Warnings and errors are keyboard reachable and readable.
- Color is never the sole indicator of severity; icon and text label
  always pair with color.
- Tables have proper `<th>` headers; tabs are keyboard usable; focus
  states are visible.
- `prefers-reduced-motion` is respected; motion is subtle.
- Math formulas remain readable and copyable; if KaTeX output is not
  fully screen-reader friendly, a plain-text formula fallback is
  preserved nearby.

These targets cross-link with Requirement 2.10 (visible focus ring at
2 to 4px, 3px target, ring/50 opacity), Requirement 2.11 (reduced
motion), Requirement 5.10 (helper paragraphs in body voice), and
Requirement 6.9 (icon plus text label pairing on every notice).

---

## 2. DESIGN.md / design.json Summary

This summary distills `DESIGN.md` and `.impeccable/design.json` so the
audit and plan can cite specific tokens, voices, and rules. Tokens are
named by the keys in `.impeccable/design.json` (Requirement 8.6) and
the rule names from `DESIGN.md`.

### Visual north star

"The Analysis Bench". A polished scientific workbench for interpolation
experiments. Surfaces are organized; formulas, tables, warnings, and
graphs sit on the bench with clarity and care. The system pulls
academic credibility from "The Lecture Instrument" and step-by-step
clarity from "The Proof Notebook", but the dominant metaphor is a real
working bench, not a lecture display or a notebook.

The named rules in `DESIGN.md` and `.impeccable/design.json`:

- The Semantic Honesty Rule. Color always means something. Indigo means
  interactive or selected. `amber-caution` means numerical caution.
  `coral-error` means error or failure. `cyan-data` means informational.
- The Tinted Neutral Rule. Every neutral is tinted toward hue 250
  (blue-slate). Pure `#000`, pure `#fff`, and untinted grays are
  prohibited. Even at chroma 0.005 the tint is present.
- The Three-Voice Rule. Every text element belongs to exactly one of
  three voices: serif for scholarly identity (`display`), sans for
  interface (`body`, `label`), monospace for mathematical values
  (`numeric`). Mixing voices inside a single element is prohibited.
- The Numeric Respect Rule. Mathematical values never use the body
  font. Every coordinate, coefficient, weight, divided-difference cell,
  Neville cell, and inline value uses the `numeric` voice with
  `font-variant-numeric: tabular-nums`.
- The Flat-at-Rest Rule. Surfaces are flat by default. Outlines define
  containment. Shadows and depth appear only as a response to state
  (hover, focus, selection, importance).
- The Inset Containment Rule. Warnings and notices use
  `ring-1 ring-inset` with semantic color, not thick colored side-stripe
  borders. There is no `border-left: 4px` accent stripe pattern.

### Typography

Three voices. Each token name in this document refers to the role keys
in `.impeccable/design.json`:

- `display`: Iowan Old Style with Palatino Linotype, Palatino, Georgia,
  serif fallbacks. 1.25rem, 600, line-height 1.2. Used exactly once on
  screen, on the app identity mark in the header. May appear on
  scholarly mathematical headings; never on interface labels or numeric
  values.
- `body`: IBM Plex Sans Variable with system-ui sans fallbacks. 0.875
  rem, 400, line-height 1.5. All interface text, helper paragraphs, and
  educational notes. Line length is capped at 65 to 75ch for
  readability.
- `label`: IBM Plex Sans Variable. 0.625rem, 500, letter-spacing 0.05em,
  uppercase. Column headers, field labels, category markers,
  uppercase-tracked tags. Compact and structural.
- `numeric`: JetBrains Mono with Fira Code, SF Mono, Cascadia Code,
  monospace fallbacks. 0.6875rem, 400, line-height 1.5,
  `font-variant-numeric: tabular-nums`. The most-used voice in this app.
  Every coordinate, coefficient, weight, table cell, polynomial
  fragment, evaluation result, and inline mathematical value belongs to
  this voice.

`DESIGN.md` and `index.css` provide three CSS handles for these voices:
the body font is set on `body`, the serif voice on `.font-math`, and
the monospace voice on `.font-numeric`. The `label` voice is currently
expressed by ad-hoc Tailwind utilities; the audit treats this as a
lack of a single canonical handle.

### Color system

OKLCH only. Each token is the canonical key in `.impeccable/design.json`
and is consumed in code via the CSS variables in `frontend/src/index.css`.

Primary axis (interactive identity).

- `indigo-deep` (`oklch(0.4 0.12 260)`). Wired to `--primary` and
  `--ring`. Used on primary buttons, focus rings, selected tabs, the
  identity mark badge, primary-tinted method cards, and the graph
  brush stroke. Conveys technical trust and scholarly authority.
- `indigo-bright` (`oklch(0.65 0.15 260)`). Dark-mode primary, also
  used as the `f(x)` graph line color (`oklch(0.55 0.15 260)`, the
  matching tonal step from the same hue ramp).

Neutral axis (the bench).

- `slate-ink` (`oklch(0.13 0.02 250)`). Wired to `--foreground`. Primary
  text, headings, numeric values. Tinted toward hue 250; never pure
  black.
- `slate-muted` (`oklch(0.45 0.02 250)`). Wired to `--muted-foreground`.
  Secondary text, labels, helper copy, placeholders.
- `surface-warm` (`oklch(0.985 0.001 250)`). Wired to `--background`.
  The page surface. Almost-white with a whisper of blue-slate warmth.
- `surface-card` (`oklch(1 0 0)`). Wired to `--card` and `--popover`.
  Card and panel backgrounds.
- `surface-tinted` (`oklch(0.96 0.008 250)`). The "workbench surface"
  color. Wired to `--secondary` and `--muted` (the latter at slightly
  lower chroma). Section headers within cards typically render as
  `bg-muted/30` (a 30% mix of this token over the card).
- `border-subtle` (`oklch(0.91 0.008 250)`). Wired to `--border` and
  `--input`. Card outlines, input borders, separators. Thin and
  precise; never heavy.

Semantic axis.

- `amber-caution` (`oklch(0.65 0.16 55)`). Numerical caution.
  Backgrounds at `5%`, inset rings at `20%`, icons at full token color.
- `amber-caution-text` (`oklch(0.3 0.06 55)`). Body text on amber-tinted
  surfaces. Wired to `--warning-foreground`.
- `coral-error` (`oklch(0.55 0.22 25)`). Validation errors, method
  failures, destructive actions, scatter-point nodes on the graph.
  Wired to `--destructive`.
- `cyan-data` (`oklch(0.55 0.12 250)`). Informational notices: nodes
  reordered, polynomial omitted, Neville info. Wired to `--info`.

Two non-canonical hues appear only inside chart strokes and may be
accepted as data-channel colors: warm amber `oklch(0.65 0.18 45)` for
the `P(x)` line, and the `coral-error` ramp at `oklch(0.55 0.2 25)` for
error and node strokes. These are explicitly chart-only; they are not
introduced into chrome surfaces.

The implementation plan must remove every literal `#000`, `#fff`, raw
Tailwind gray, or untinted neutral that appears in component sources
and route them through the OKLCH tokens above.

### Spacing and layout

`DESIGN.md` defines a discrete spacing scale: `xs 4px`, `sm 8px`, `md
16px`, `lg 20px`, `xl 24px`, `section 32px`. Card content uses `lg`
padding (the `card-panel` token specifies `padding: 20px`); section
headers use `12px 20px`; rows in numeric editors should sit at `xs`
or `sm` vertical spacing.

Radius scale: `sm 4px`, `md 6px`, `lg 8px`, `xl 12px`. Buttons and
inputs use `lg`. Cards and large panels use `xl`. Pill badges use
`9999px`.

Layout rules from `DESIGN.md`:

- Cards never nest. A card is a top-level container; internal structure
  uses tonal layering (`bg-muted/30`), separators, or section headers.
- The Flat-at-Rest Rule means cards are defined by `ring-1 ring-
  foreground/10` with no shadow at rest; shadows appear only as a
  response to selection, hover, focus, or importance.
- Mobile-first column collapse is expected at the documented `md`
  breakpoint (`768px`). Two-column rows in input cards stack below
  this breakpoint.

### Form and input treatment

The `input-default` component token specifies `height 32px`, radius
`lg` (8px), `4px 10px` padding, transparent background, and a 1px
`border-input` outline. Focus shifts the border to ring color and
applies a 3px ring at `ring/50` opacity (Requirement 2.10).

Numeric inputs use the `numeric` voice with `tabular-nums`. Placeholder
text is rendered in `slate-muted` and the `numeric` voice when the
field accepts a math value. Field labels are rendered in `label` voice
(uppercase, 0.05em letter-spacing, 10 to 11px).

The points editor is a labelled grid: index column, x-input column,
y-input column, remove-action column, in that order. Vertical row
spacing is at least `xs` (4px); horizontal column gap is at least `sm`
(8px). The editor fills available card content width and is not capped
to a narrower max-width than the surrounding card content
(Requirements 5.3, 5.4, 5.6).

The interval editor renders the function expression on its own row
across the full content width, then a two-column row for `a` and `b`,
then a two-column row for node strategy and node count. Below 768px
these stack (Requirement 4.1 to 4.4).

### Method and result presentation

Methods are presented at equal visual prominence in the selector and
in the Method Details tabs (Requirement 7.1). Each method card carries
a role tag in `label` voice (Requirement 7.2 to 7.4):

- Lagrange: "Construction".
- Newton: "Construction".
- Barycentric: "Stable Evaluator", rendered in the primary tint to mark
  it as the recommended evaluator without enlarging the card.
- Neville: "Target-Specific".

Order across the selector and Method Details tabs is fixed: Lagrange,
Newton, Barycentric, Neville (Requirement 7.6).

Each method card includes a one-sentence description framed by purpose
(Requirement 7.5):

- Lagrange shows basis polynomials and summation form.
- Newton shows divided-difference tables and nested form.
- Barycentric provides stable evaluation and is the source for graph
  data.
- Neville produces target-specific triangular tables.

Method Details panels share a fixed structure (Requirement 7.8): a
status row, any method-local error, any method-local warnings, then
the method-specific content. Tables are labelled (Requirement 7.9 to
7.11): Newton with one column per order (`f[xᵢ]`, `Δ¹`, `Δ²`, ...),
Neville with the target x above each table, Barycentric with `i`,
`xᵢ`, `wᵢ`. All numbers in these tables use the `numeric` voice with
`tabular-nums`.

Tables follow the `DESIGN.md` table conventions: no outer border (the
card provides containment), bottom borders between rows, headers in
`label` voice, cells in `numeric` voice, empty cells render as a
centered muted dot rather than blank, horizontal scroll inside the
card when needed.

### Warning and error treatment

The Inset Containment Rule binds every notice to `ring-1 ring-inset`
with a semantic color from the OKLCH palette:

- Warning level: `bg-warning/5` background, `ring-1 ring-inset ring-
  warning/20`, `amber-caution` icon, `label`-voice severity word in
  warning color, message in `body` voice on `slate-muted`.
- Error level: `bg-destructive/10` background, `coral-error` icon and
  text, `body`-voice message in destructive color.
- Info level: `bg-info/5` background, `ring-1 ring-inset ring-info/15`,
  `cyan-data` icon. Used for `nodes_reordered`, `polynomial_omitted`,
  and `neville_requires_evaluation_x`.

There is no left-stripe accent and no decorative border greater than
1px on cards, warnings, or callouts (Requirement 2.6).

Hierarchy inside an error notice (Requirement 6.1 to 6.5):

- The human-readable backend `message` is the primary content, set in
  the error title typography.
- The backend `code` is secondary, smaller, lower visual weight, set
  in `numeric` voice and prefixed by the literal label `Code:`.
- A frontend-maintained code-to-guidance map adds one recovery sentence
  for the recognized codes (`too_few_nodes`, `duplicate_x_values`,
  `unsafe_expression`, `function_domain_error`, `invalid_interval`,
  `no_methods_selected`).
- `unsafe_expression` and `function_domain_error` render inline beneath
  the function input, with a fall-through to a top-level banner if no
  function input is currently mounted.
- When the message is missing, the code becomes the primary content and
  a generic body sentence ("Backend did not provide a description.")
  fills the secondary slot. Codes never appear standalone.

Warnings always include the human-readable label specified in
`WarningsDisplay` (Requirement 6.6) and an icon plus text label so
severity is never communicated by color alone (Requirement 6.9). They
are never hidden, collapsed by default, or removed for cosmetic
reasons (Requirement 6.7).

### Motion rules

`.impeccable/design.json` exposes four motion tokens, mirrored in
`frontend/src/index.css`:

- `ease-standard` (`cubic-bezier(0.4, 0, 0.2, 1)`). Default easing for
  hover, focus, and color transitions.
- `ease-out-expo` (`cubic-bezier(0.16, 1, 0.3, 1)`). Entrance and
  result-panel appearance.
- `duration-fast` (`150ms`). Hover, focus rings, button press feedback.
- `duration-normal` (`200ms`). Tab transitions, card state changes,
  copy-button reveal.

Rules:

- No bounce or elastic easing.
- No CSS-layout-property animation (no animating width, height, margin,
  padding).
- No slow transitions over 300ms, no shimmer.
- `prefers-reduced-motion: reduce` disables non-essential animations
  (Requirement 2.11). The current `index.css` already disables
  `.transition-subtle` and `.animate-in-results` under reduced motion.

### Accessibility rules

Distilled from `DESIGN.md` and `PRODUCT.md`:

- Visible focus on every interactive element. Width 2 to 4px, target
  3px, opacity `ring/50`, ring color `--ring` (Requirement 2.10).
- Color is never the sole severity indicator. Every notice is icon plus
  text label plus color (Requirement 6.9).
- Validation errors are associated with the relevant input via
  `aria-describedby` or proximity.
- Tabs are keyboard usable; tables have proper `<th>`; KaTeX nodes
  carry `role="math"` and an accessible label; a plain-text formula
  copy is preserved alongside KaTeX where helpful.
- Reduced motion respected.
- Bench is keyboard-navigable in source order: header, examples panel,
  input panel, action bar, results.

These tie into specific requirement clauses: 2.10 (focus), 2.11
(reduced motion), 5.7 to 5.8 (input height and focus ring), 6.9 (icon
plus text label), 7.9 to 7.11 (table headers).

---

## 3. Current UI audit against DESIGN.md

This audit walks the current `frontend/src/` tree against the rules in
section 2. Each item is read directly from the files; the audit is per
mode (Points, X + f(x), Interval) and per component, plus `App.tsx` and
`index.css`. Per Requirement 8.1 nothing is edited here. Per
Requirement 8.4 every component listed in the requirement is covered.

### 3.1 Per-mode audit

The mode tabs live in `InputPanel.tsx` (lines 39 to 88). All three modes
share the same outer card and tab list (`grid grid-cols-3 h-9`). The
points editor renders inside the same `p-5` card content area as the
other modes.

#### 3.1.1 Points mode

Source: `PointsInput.tsx`.

What follows the system.

- Grid layout has the requested columns: index, `xᵢ`, `yᵢ`, remove
  (lines 31 to 64). Header row uses a `label`-voice analog
  (`text-[10px] uppercase tracking-wider text-muted-foreground font-
  medium`) on `slate-muted`.
- Inputs are wired to the `Input` primitive (32px height, `lg` radius,
  transparent background, `border-input`), which maps to the
  `input-default` token.
- Numeric values use `font-numeric` (the `numeric` voice) with
  `tabular-nums` inherited from the `.font-numeric` rule in
  `index.css`.
- Remove action is a `coral-error` ghost icon button that fades to
  invisible when disabled, consistent with Flat-at-Rest.
- Helper paragraph "Enter at least 2 distinct (x, y) pairs..." is
  rendered in the `body` voice on `slate-muted`. Requirement 5.10.

What violates the system.

- The grid is sized in `rem` (`grid-cols-[2rem_1fr_1fr_2rem]`) inside a
  card content area that does have the available width, so this mode
  does not actually break full-width usage. However, the implied min
  width on each numeric column is the column's `1fr`, not the
  Requirement 5.4 minimum cell gap; the gap is `gap-2` (`8px`), which
  meets `sm`. Acceptable today; document as borderline.
- Index column uses the `numeric` voice for the index, which is
  consistent, but the column header says "i" without subscript styling.
  Acceptable.
- Helper paragraph reads "Values are parsed as exact rationals when
  possible" in `body` voice. Acceptable.

What looks cramped, broken, or unfinished.

- Adding many points (above 10) does not change layout, but the gap
  between rows (`space-y-1.5`) sits at 6px, which is below the
  Requirement 5.3 floor of `xs` (4px). It currently meets the rule, but
  the visual rhythm with 32px rows feels tight. Recommend `space-y-2`.
- The "Add Point" button uses the outline variant, which after the
  shadcn refactor renders at default size; the design system specifies
  small `outline` for in-card secondary actions. Cosmetic.

What does not feel premium, modern, academic, or scientific.

- Placeholders cycle "e.g. 2 / e.g. 5 / 0" between the first two rows
  and zero afterwards. The "0" placeholder reads as a default value,
  not an example, and is not in the muted color contract from
  Requirement 5.9. Recommend constant illustrative placeholders that do
  not look like a value (for example "xᵢ" and "yᵢ" in muted numeric
  voice, or empty strings).
- This mode does not currently violate the cramped-layout complaint
  from Requirement 3 to 4; that complaint targets the X + f(x) and
  Interval modes.

#### 3.1.2 X + f(x) mode

Source: `XValuesInput.tsx`.

What follows the system.

- The function input has an `Input` primitive on `lg` radius and 32px
  height. The function-error string is associated to the input via
  `aria-describedby="function-error"` (lines 41 to 46). Validation
  failure text is `text-sm text-[var(--destructive)]`, which routes
  through `coral-error`.
- The function-input label "Function f(x)" uses the `Label` primitive
  (interface voice). Acceptable.
- The allowed-functions helper paragraph is `body` voice in
  `slate-muted`. Acceptable, but inline-coded with `text-xs text-[var(
  --muted-foreground)]` instead of the Tailwind alias.

What violates the system.

- The function input has `className="font-mono"` (line 39). This is
  Tailwind's default monospace stack, not the `numeric` voice. Per
  Requirement 5.1, every Math Input value uses the `JetBrains Mono`
  numeric voice with `tabular-nums`. The `.font-numeric` class is the
  correct handle.
- The x-value rows use `className="font-mono"` (line 65), not
  `font-numeric`, so they inherit Tailwind's default monospace stack
  and lose `tabular-nums`. Same Requirement 5.1 violation.
- Color references are inline CSS variables (`text-[var(
  --muted-foreground)]`, `text-[var(--destructive)]`) instead of the
  Tailwind aliases (`text-muted-foreground`, `text-destructive`). The
  output color is correct but the convention is inconsistent with the
  rest of the app and resists future theming.
- Validation success ("Valid: 1/x") is currently rendered in `App.tsx`
  rather than next to the function input in this component, which
  splits the function-status presentation across two files and breaks
  Requirement 3.6 ("display the success state... adjacent to the
  function input").

What looks cramped, broken, or unfinished.

- The x-value row layout is `flex items-center gap-2` with `<span
  className="text-xs text-[...] w-6 text-right">{i}.</span>` and the
  remove ghost icon (lines 60 to 76). At md+ widths, this works, but:
  - The function input and the x-values list have no enforced full-
    width container, so the user can perceive the content as floating
    in a narrow column when the right-side Quick Reference rail is
    visible. Requirement 3.1 mandates "full width of the input card
    content area, with no fixed maximum width below the input card's
    own content width".
  - At md+ widths the x-value input sits at `flex-1` with no explicit
    minimum width. Requirement 3.3 requires each x-value row's numeric
    monospace input to be at least 160px wide at viewport widths of
    768px and above.
  - The numbered prefix is followed by a `.` and is sized at `w-6`,
    which on long indices (`10.`, `11.`) overflows or right-aligns
    awkwardly.
- Add/remove uses two different icon styles versus `PointsInput.tsx`:
  this component uses `Trash2` from Lucide; the points editor uses
  `X`. Same action, two icons. Cosmetic but reads as unfinished.

What does not feel premium, modern, academic, or scientific.

- The function input does not announce its purpose with the same
  `label` voice as the other math fields. The label is the default
  `Label` (sans, 14px), not the uppercase tracked `label` voice; the
  helper text underneath uses inline color tokens. Together this reads
  as a generic form rather than a math-respecting bench.
- There is no positive validation indicator next to the input itself.
  The success line in `App.tsx` is positioned on the right of the
  action bar, which is far from the field that produced it.
- Placeholder text is `placeholder="e.g. 1/x, sin(x), exp(-x^2)"` in
  the default sans `Input`. This reads as a UI cue, not as math, and
  is not in the `numeric` voice that Requirement 5.9 implies.

#### 3.1.3 Interval mode

Source: `FunctionIntervalInput.tsx`.

What follows the system.

- The function input is a single `Input` row at the top of the form,
  followed by `grid grid-cols-2 gap-4` rows for `[a, b]` and for node
  strategy and node count (lines 53 to 92). This matches the structural
  intent in Requirement 4.1 to 4.3.
- Inputs are `numeric` voice on `font-numeric text-sm h-8` for the
  numeric fields, which complies with the `input-default` token and
  Requirement 4.8.
- Labels use the interface `Label` primitive with `text-xs`. Acceptable
  for compactness.
- The `Select` primitive (`select.tsx`) is the native HTML control
  styled to match the design system. Node strategy options are spelled
  with the human-readable labels "Equally Spaced", "Chebyshev Nodes",
  "Custom Nodes" (Requirement 4.6).

What violates the system.

- `function f(x)` input uses inline color tokens for the error message
  (`text-[var(--destructive)]` line 46). Same convention drift as in X
  + f(x) mode.
- The grid is unconditional `grid-cols-2`. Below 768px this stays
  two-column. Requirement 4.4 requires stacking below md. Today the
  inputs scale narrow and avoid overflow (because the inputs have
  `min-w-0` from the primitive), but they do not stack and become
  cramped at small widths.
- The `Select` styles in `select.tsx` use `h-10 ... px-3 py-2` and a
  `--ring` focus offset of 2px, not the 32px height (`h-8`) and 3px
  ring required by the `input-default` token. The component on the
  page is wrapped to `h-8 text-sm`, but the underlying primitive height
  defaults conflict with the design system.
- The interval inputs read the literal labels "Interval Start (a)" and
  "Interval End (b)". The mathematical notation `a` and `b` should be
  set in `numeric` voice; today they sit inside a sans label and are
  not visually distinguished as math symbols. Requirement 4.5.
- Node count input is a native `type="number"`, with no inline
  out-of-range visual when the value falls below 2 or above 50. Today
  the field clamps to `min={2} max={50}` via the parser
  (`parseInt(e.target.value) || 2`), which silently rewrites the
  value. Requirement 4.7 requires an inline destructive notice and
  prevention of submission when the value is out of range; the current
  control prevents the user from ever reaching that out-of-range state
  in the model. This is a behavioral gap, not a layout one.

What looks cramped, broken, or unfinished.

- At md+ widths the row is split 50/50 between strategy and count, so
  the count input occupies a column far wider than its content. The
  visual rhythm is a wide drop-down then a wide spinner, which reads
  as cramped between unequal contents. Recommend
  `grid-cols-[2fr_1fr]` for that row.
- Below 768px both 2-column rows break to look squeezed because the
  card's outer column shrinks. The layout still does not stack.
- Helper text is missing under the function input in this mode (X +
  f(x) has it). Asymmetric.

What does not feel premium, modern, academic, or scientific.

- The function input here is the same shape as a search box: a single
  row with a placeholder. It does not feel like the construction
  surface of an interpolation problem. There is no visible affordance
  that this is a parsed expression, no syntax-aware accent, and no
  `numeric` voice on the input itself.
- Node strategy uses a vanilla native `<select>`. The styled wrapper
  brings it close to the design system, but the focus ring is 2px and
  off-color from the rest of the app, which reads as the leftover
  shadcn default.

### 3.2 Per-component audit

Each entry cites the source file and the lines or symbols that produced
the finding.

#### 3.2.1 Points editor (`frontend/src/components/PointsInput.tsx`)

Follows.

- Grid columns ordered `i`, `xᵢ`, `yᵢ`, remove (lines 31 to 64),
  matching Requirement 5.5.
- Numeric inputs in `font-numeric` (lines 49, 56), 32px height. Header
  row at 10px uppercase tracked, `slate-muted`, matching the `label`
  voice.
- Helper paragraph in `body` voice (line 79).

Violates.

- The "Add Point" button uses `variant="outline"` with `size="sm"`,
  which produces a 28px control. The system specifies 32px default for
  primary actions and 28px sm for tertiary actions. Acceptable, but
  inconsistent with the `EvaluationTargets` "Add Target" call to action.
- The header row uses ad-hoc utilities (`text-[10px] uppercase tracking-
  wider text-muted-foreground font-medium`) instead of a single
  `label` voice handle. There is no `.font-label` class equivalent.

Cramped, broken, unfinished.

- Row spacing 6px (`space-y-1.5`) versus the `xs` (4px) floor; visually
  okay, but the bench would feel calmer at `space-y-2` (8px) with 32px
  inputs.
- "0" placeholders read as default values; see section 3.1.1.

Premium / academic feel.

- The points editor is the closest piece of the UI to the spirit of
  the system today. Largest improvements are: replace ad-hoc
  `text-[10px] uppercase tracking-wider` snippets with a canonical
  label voice; ensure the editor stretches the card content area
  (already does) and never inherits a narrower max-width when
  embedded; align "Add Point" sizing across editors.

#### 3.2.2 X-values editor (`frontend/src/components/XValuesInput.tsx`)

Follows.

- Has a `Label` for "X-Values"; rows are deletable; the field stack
  uses `space-y-2` for rhythm.

Violates.

- `font-mono` instead of `font-numeric` on the function input (line
  39) and on each x-value input (line 65). Numeric voice violation
  (Requirement 5.1).
- Inline CSS variables (`text-[var(--muted-foreground)]`,
  `text-[var(--destructive)]`) rather than the Tailwind aliases.
- Function-validation success indicator is rendered far from this
  component (Requirement 3.6 violation).
- No enforced minimum width per row at md+ widths (Requirement 3.3).

Cramped, broken, unfinished.

- Two-icon pattern across editors (`Trash2` here vs `X` in
  `PointsInput`); inconsistent.
- Numbered prefix `{i}.` at fixed `w-6` overflows for two-digit i.

Premium / academic feel.

- Feels generic-form because the function input is a sans field, the
  helper paragraph is small grey text, and the success state is on
  another row. The Bench reads as not-yet-bench.

#### 3.2.3 Function-interval editor (`FunctionIntervalInput.tsx`)

Follows.

- Has the structural three-block shape requested by Requirement 4.
- Uses `font-numeric` for numeric inputs.

Violates.

- Inline CSS variable error color (line 46).
- Missing helper paragraph under the function input.
- `Select` primitive uses 40px height and 2px focus ring, off-token
  from `input-default`.
- Mathematical notation `a` and `b` not in `numeric` voice in labels
  (Requirement 4.5).
- Unconditional `grid-cols-2` (Requirement 4.4 stacking missing).
- Node count silently clamps below 2 (Requirement 4.7 inline notice
  missing).

Cramped, broken, unfinished.

- Asymmetric column widths in the strategy/count row.
- Below 768px both rows stay two-column.

Premium / academic feel.

- The function input does not signal "math input" via voice or accent.
- Native `<select>` polish does not match the rest of the bench.

#### 3.2.4 Method selector (`MethodSelector.tsx`)

Follows.

- Card grid (Requirement 7.1) at `grid-cols-1 sm:grid-cols-2 gap-2`.
- Role tag in `label`-voice analog (`text-[10px] uppercase tracking-
  wider`).
- Barycentric tag uses `bg-primary/10 text-primary` to mark it as
  recommended without enlarging the card. Matches Requirement 7.4.
- Selected card uses `border-primary/60 bg-primary/5 ring-1 ring-
  primary/20`, matching Requirement 7.7.

Violates.

- Role labels read "Educational" (Lagrange), "Tables" (Newton), "Stable
  Evaluator" (Barycentric), "Target-Specific" (Neville). Requirement
  7.2 fixes the labels to "Construction" for Lagrange, "Construction"
  for Newton, "Stable Evaluator" for Barycentric, "Target-Specific" for
  Neville. The current "Educational" and "Tables" labels are wrong.
- Method order in the array is `lagrange`, `newton`, `barycentric`,
  `neville`. Matches Requirement 7.6 in this component.
- One-sentence descriptions partially match Requirement 7.5 but the
  Lagrange line ("Basis polynomials, summation form, and step-by-step
  construction") and Newton line ("Divided-difference table,
  coefficients, and nested form") are close, while the Barycentric and
  Neville lines drift from the prescribed wording.
- Hidden `<input type="checkbox">` behind a label is a documented
  pattern, but the focus ring is provided by the surrounding `<label>`
  and is not the 3px `ring/50` ring required on every interactive
  element (Requirement 2.10). The visible focus is currently the
  `transition-subtle` border shift.

Cramped, broken, unfinished.

- The selection indicator dot is a small square at `2.5/2.5` corner
  inset and reads as decorative. The role tag plus the indicator dot
  fight for the same top-right space.
- Description text uses `leading-relaxed` and overflows two lines on
  md viewports for some methods, while staying single-line for others,
  producing uneven card heights.

Premium / academic feel.

- The role tags are correctly compact, but two of the four labels
  carry the wrong word, which reads as inconsistent and slightly
  unfinished. Replacing them with the prescribed "Construction"
  pairing is the bench's most teachable detail.

#### 3.2.5 Precision settings (`PrecisionSettings.tsx`)

Follows.

- Two-row layout: `Exact Mode` switch with body explanation, then a
  precision slider plus number input.
- Number input is `font-numeric text-sm h-8`, on token.
- Slider has `aria-label="Precision slider"`.

Violates.

- The native range input is styled in `index.css` with custom thumb and
  track colors keyed off `--primary`, `--muted`, and `--card`. The track
  shadow uses `oklch(0.13 0.02 250 / 0.15)` directly. Acceptable, but
  the thumb's `aria-valuetext` is not set, which the impeccable
  critique already flagged as an empty announcement.
- The precision input value displayed inline ("{precision} digits") in
  the `numeric` voice; correct.
- The `Switch` primitive is wired through shadcn; its focus state is
  the default 2px ring offset rather than the 3px `ring/50` target.

Cramped, broken, unfinished.

- The number input is `w-16` (64px) and feels tight at 200 with three
  digits. Recommend `w-20`.
- The "Decimal Precision" row stacks label and value on the left and
  on the right of the same row, fine. The slider plus input row mixes
  two interactive controls. With `flex items-center gap-3`, the input
  on the right sometimes pushes the slider too narrow on small
  containers.

Premium / academic feel.

- The control reads as a settings panel, not as a math control. The
  helper sentence "Significant digits for mpmath high-precision
  arithmetic (8 to 200)" is in body voice and acceptable; the
  `numeric` value adjacent to the label is appropriate.

#### 3.2.6 Evaluation targets (`EvaluationTargets.tsx`)

Follows.

- Targets render as chip-shaped pill controls in the `numeric` voice
  inside `bg-muted/50 rounded-md ... border` containers.
- The label "Evaluation Targets" sits above with a body-voice helper
  sentence.

Violates.

- The target input uses `border-0 bg-transparent p-0 focus-visible:
  ring-0`. This removes the 3px focus ring entirely from each chip
  (Requirement 2.10 violation: visible focus on every interactive
  element).
- Helper sentence references "x-values where P(x) will be evaluated
  and compared across methods" in body voice; acceptable.

Cramped, broken, unfinished.

- The target chip width is fixed at `w-20` (80px), which truncates
  longer values like `0.95` plus padding under some font metrics.
- Add Target sits at sm size; consistent with the rest, but the chip
  stack lacks an empty-state line ("No targets yet"), so the section
  appears blank when no targets exist.
- Neville without targets currently shows an inline empty-state
  message in `MethodDetails`; that text should link or scroll up to
  this control. Today it just describes where to add targets.

Premium / academic feel.

- Chips read as casual; the Bench would benefit from a single labelled
  row of `numeric` cells with a discrete "+" affordance, presenting the
  targets as ordered values rather than tags.

#### 3.2.7 Warnings display (`WarningsDisplay.tsx`)

Follows.

- Each notice uses `ring-1 ring-inset` with semantic color (warning vs
  info), with no left-stripe accent. Matches Requirement 2.5 and the
  Inset Containment Rule.
- Each notice has an icon (`AlertTriangle` or `Info`), a label, and a
  message. Color is paired with icon and text. Matches Requirement
  6.9.
- Labels are mapped from backend code to human-readable strings via
  `getWarningLabel()`. Matches Requirement 6.6.

Violates.

- The label is rendered as `text-xs font-semibold uppercase tracking-
  wider text-warning` but message text is rendered as
  `text-muted-foreground` rather than `text-warning-foreground`. For
  warning notices, body text should be `amber-caution-text` or
  destructive-foreground for errors. Today it routes through
  `--muted-foreground` which is `slate-muted`.
- This component does not currently render `error`-level notices; it
  only handles warnings and info. Top-level errors are rendered in
  `App.tsx` as a destructive `Alert` (Requirement 6.1 hierarchy is
  partially satisfied there but with weakening).
- The component does not yet apply the code-to-guidance map for
  recognized error codes (Requirement 6.3); error notices in this
  component branch never appear.

Cramped, broken, unfinished.

- Acceptable structure; visual rhythm is fine.

Premium / academic feel.

- The Bench wants notices that read as authoritative and pedagogical.
  The current label-then-message structure is correct; what is missing
  is a third line for recovery guidance and a consistent secondary
  `Code:` line in `numeric` voice.

#### 3.2.8 Results panel tabs (`ResultsPanel.tsx`)

Follows.

- Tab navigation uses a custom horizontal bar with proper `role="tab"`,
  `aria-selected`, `aria-controls`, and disabled state for missing
  data. Matches the Tabs and accessibility intent of `DESIGN.md`.
- Active tab uses `bg-primary/10 text-primary`, mapping to the primary
  tinted active state.
- Notes tab carries a count badge (`Badge variant="warning"`).

Violates.

- The tabs use a custom bar instead of the shared `Tabs` primitive,
  which means the underline-on-active and `data-active:shadow-sm`
  conventions in `tabs.tsx` are not applied here. The visual weight
  differs from the in-card tabs (input mode tabs, polynomial form
  tabs).
- Disabled tabs render with `text-muted-foreground/40 cursor-not-
  allowed`. Disabled state lacks an explanation of why the tab is
  disabled (no graph, no evaluation_x). Acceptable as today.

Cramped, broken, unfinished.

- The bar lives in a `rounded-xl border bg-card` container, which
  makes it feel like a card containing only tabs. The `DESIGN.md`
  pattern is for tabs to live as section navigation inside a card
  that also contains content. Standalone tab cards read as a stray
  pill panel.

Premium / academic feel.

- The icons used for each tab (`FlaskConical` for Overview, `Function
  Square` for Polynomial, `Table2` for Evaluations, `LineChart` for
  Graph, `BookOpen` for Methods, `AlertTriangle` for Notes) are
  themed but mixed in metaphor. The Bench wants quieter, more uniform
  marks; a single subtle icon family (or no icons) would feel more
  scholarly. Cosmetic.

#### 3.2.9 Polynomial card (`results/PolynomialCard.tsx`)

Follows.

- Card with section header, tab list of forms (`Expanded`, `Factored`,
  `Lagrange`, `Newton`), KaTeX render area on `bg-muted/30 ... border`.
- `CopyableFormula` is a `<pre>` block in `numeric` voice on
  `bg-muted/50 border` with a hover-revealed copy button. Matches the
  formula-display token in `DESIGN.md`.

Violates.

- The KaTeX container is `<div ...>` with `aria-label` and `role="math"`
  (in `KatexDisplay.tsx`). The plain-text formula is preserved in the
  copyable block beneath KaTeX, which is correct, but the `aria-label`
  echoes the LaTeX source rather than a textual rendering. The
  impeccable critique already flagged this; fix is wording, not
  structure.
- The KaTeX wrapper has `bg-muted/30 ... border`, which adds a 1px
  border atop the card outline; this nests an outlined box inside the
  card. With the card already providing `ring-1 ring-foreground/10`,
  the nested outline reads as a small inner card.

Cramped, broken, unfinished.

- The "Not available for this degree" placeholder uses italics; would
  be quieter as the centered muted dot used by tables.

Premium / academic feel.

- This is one of the strongest panels. The KaTeX rendering is sized
  larger than body, the formula is copyable, the four forms are
  available. The remaining drift is the inner-outline nesting.

#### 3.2.10 Method details (`results/MethodDetails.tsx`)

Follows.

- Method tabs render in the requested order Lagrange, Newton,
  Barycentric, Neville (`data.input_summary.methods_requested.filter`
  preserves request order, which is canonical because of the default
  in `App.tsx`).
- Each method panel renders error first, warnings second, content
  third. Matches Requirement 7.8 ordering.
- Newton divided-difference table has a header row with
  `f[xᵢ]`, `Δ¹`, `Δ²`... in `numeric`-voice cells (lines 134 to 142).
  Requirement 7.9.
- Barycentric weights table uses `i`, `xᵢ`, `wᵢ` columns in
  `numeric`-voice cells (lines 195 to 219). Requirement 7.11.
- Neville tables include an `h4` "Neville Table · x = {target_x}"
  header per table (lines 248 to 274). The `x` value is rendered in
  body voice within an `h4`. Requirement 7.10 wants the body label
  with the x-value itself in `numeric` voice.

Violates.

- `MethodError` renders as `Alert variant="destructive"` with the
  inverted hierarchy: `<strong className="font-numeric">{error.code}
  </strong>: {error.message}` (lines 70 to 77). Requirement 6.1 to 6.2
  inverts this: human-readable `message` first as primary content,
  `code` second in `numeric` voice prefixed by `Code:`.
- `MethodWarnings` renders only the message, no severity label; this
  diverges from `WarningsDisplay`, which renders a label-and-message
  structure. Inconsistency across two warning surfaces.
- The Newton coefficients block uses `shadow-sm` chips at rest
  (`bg-card border rounded-md ... shadow-sm`). The Flat-at-Rest Rule
  says no shadow at rest unless the surface is responding to state.
- The basis-polynomial container nests an outlined box (`bg-muted/30
  rounded-lg border p-3`) inside the card; same nested-outline drift.
- Neville `h4` "Neville Table · x = {target_x}" uses an em-dash-like
  middle dot. `PRODUCT.md` rejects em-dashes in UI copy and the
  middle dot reads as decorative.

Cramped, broken, unfinished.

- "Construction Steps" list uses Tailwind's `list-decimal list-inside`,
  which produces visually inconsistent left-edges versus the bench's
  other body content.
- The Neville table renders without a header row (`<TableBody>` only),
  while every other table has a `<TableHeader>`. Visually empty top
  edge.
- Barycentric notes use a custom bullet via `before:` pseudo-element,
  matching the educational notes; consistent.

Premium / academic feel.

- This panel is the most pedagogically dense surface in the app and
  carries the heaviest visual obligation. Today it leans toward "many
  small subsections" rather than "one panel per method"; the bench
  feel suffers when the Newton method shows three or four bordered
  inner boxes.

#### 3.2.11 Graph card (`results/GraphCard.tsx`)

Follows.

- Header with "Graph" title and a `secondary` badge for
  `source_method`.
- Renders only from backend arrays (`graphData.x`, `f_x`, `P_x`,
  `error`, plus `nodes`). No client-side recomputation. Matches
  Requirements 1.6, 1.7, and 10.7.
- Lines use `f(x)` in `oklch(0.55 0.15 260)` (an `indigo-bright` step),
  `P(x)` in warm amber `oklch(0.65 0.18 45)`, error and node points in
  `coral-error` `oklch(0.55 0.2 25)`.
- Brush is wired with `oklch(0.4 0.12 260)` (the `indigo-deep` token)
  and `oklch(0.96 0.008 250)` (the `surface-tinted` token).

Violates.

- Tooltip and tick fonts are inlined as `fontFamily: "JetBrains Mono,
  monospace"` strings in `XAxis`, `YAxis`, and the tooltip. This is
  the `numeric` voice but bypasses the centralized stack and drops the
  Cascadia and Fira Code fallbacks declared in `index.css`.
- Tooltip uses `text-[var(--destructive)]` directly for node lines
  (line 36) instead of the Tailwind alias.
- "Drag the brush below the chart to zoom into a region" sits below
  the chart in 10px muted text. Acceptable, but the helper paragraph
  is in body voice rather than `label` voice on a sub-control.

Cramped, broken, unfinished.

- The error chart and the main chart have different heights (320 vs
  160). When both render, the visual rhythm is fine; when only one
  renders, the section reads as half-tall.
- No node labels on hover at the chart level; the impeccable critique
  flagged this as a P3.

Premium / academic feel.

- The chart already feels like a premium scientific plot. The
  remaining premium gain is consistent typography routing and a
  uniform tick label style.

#### 3.2.12 Nodes table (`results/NodesTable.tsx`)

Follows.

- Card with a section header and a Table primitive containing `i`,
  `xᵢ`, `yᵢ` columns. Numeric voice on cells. Requirement 5.5 alignment
  for tabular display.
- "{nodes.length} nodes defining the polynomial" body-voice subtitle.

Violates.

- Header cells use `text-xs` (12px) in default sans, not `label`
  voice (10px tracked uppercase). Inconsistent with the table headers
  in Method Details (`f[xᵢ]`, `Δ¹`...).
- Table has no horizontal scroll wrapper; if `x` or `y` is a long
  rational, the row wraps to two lines.

Cramped, broken, unfinished.

- For high node counts (11+) the table extends downward without
  pagination or scroll, producing a tall card. Acceptable, but the
  bench prefers a max-height with internal scroll past 10 rows.

Premium / academic feel.

- This is a quiet table that does its job. The biggest premium gain
  is converting the headers to `label` voice and aligning column
  widths.

#### 3.2.13 Evaluation table (`results/EvaluationTable.tsx`)

Follows.

- Card with section header. Headers contain `x`, `Best P(x)`, `Method`,
  per-method columns, `f(x)`, `|Error|`. Numeric voice on numeric
  columns.
- Best method called out with `text-primary font-semibold` and a
  `secondary` badge. Matches Requirement 7.7-style emphasis without
  over-dramatizing.

Violates.

- Header row uses the default `<th>` style from `table.tsx`. Headers
  read as `text-xs` body voice rather than `label` voice. Same drift
  as Nodes table.
- "—" en-dash in cells violates the `PRODUCT.md` rule against em-
  dashes in UI copy. (Strictly an en-dash here, not an em-dash, but
  the Bench prefers the centered muted dot used in Method Details.)

Cramped, broken, unfinished.

- For three methods plus best plus method-name plus f(x) plus error,
  the row is wide and frequently triggers horizontal scroll on
  laptops. Acceptable; consider stickying the `x` column.

Premium / academic feel.

- This is the highest-information table in the app. The `numeric`
  voice already wins; converting headers to `label` voice and adopting
  the muted dot for empty cells lifts it.

#### 3.2.14 Educational notes (`results/EducationalNotes.tsx`)

Follows.

- Card with a section header containing a `BookOpen` icon and "Theory
  Notes" title in body voice.
- Notes are a custom-bulleted `<ul>` with a `before:` pseudo-element
  dot in `bg-primary/15`. Body voice on `slate-muted`.

Violates.

- Heading reads "Theory Notes", but the section title in the
  ResultsPanel tab and in `PRODUCT.md` is "Educational Notes". Light
  inconsistency. Acceptable copy.
- The custom bullet is a 6px primary-tinted dot. The Bench prefers
  consistency: bullet style is duplicated in `BarycentricDetails`
  (`MethodDetails.tsx`). Two near-identical custom bullets in two
  files; should share one rule.

Cramped, broken, unfinished.

- None.

Premium / academic feel.

- Quiet, calm, on-token. Acceptable today; the only premium drift is
  the heading copy.

#### 3.2.15 `App.tsx`

Follows.

- Three-voice typography is applied via `font-math` and `font-numeric`
  classes; body voice via the `body` selector in `index.css`. The
  identity mark badge sits in `bg-primary/8 ring-1 ring-primary/15`,
  matching the Flat-at-Rest and primary-tint conventions.
- Inline validation warnings in App.tsx use `bg-warning/5 ring-1 ring-
  inset ring-warning/20`. Inset Containment Rule honored.
- Reset button is a ghost variant in `text-muted-foreground`; primary
  Compute is a default variant with `shadow-sm`.

Violates.

- The header carries `backdrop-blur-none sticky top-0 z-10` (line
  236), which leaves `bg-card/80` translucent. The impeccable critique
  flagged this as borderline glassmorphism. With `backdrop-blur-none`
  set, the visual is opaque; the `/80` alpha is the active drift.
  Consider opaque `bg-card`.
- `shadow-sm` is applied to the Compute button at rest (line 297).
  Flat-at-Rest is broken on the button. The shadow should appear on
  hover only.
- `formatErrorMessage()` and `getErrorCode()` parse a serialized
  `[code] message` string. Requirement 6.1 to 6.2 expect message and
  code as structured fields, with the error code in `numeric` voice
  prefixed by the literal `Code:`. The current parser yields the
  correct visual but is brittle, and only routes `unsafe_expression` /
  `function_domain_error` into the function input via a different
  path; the error-route map is split between `App.tsx` (top-level)
  and the call sites.
- The action bar places the function-validation success line on the
  right of the action bar (lines 304 to 309), far from the function
  input. Requirement 3.6 wants this success state adjacent to the
  function input.
- Quick Reference card width is hard-coded to 220px (line 286). The
  layout grid is `grid-cols-1 lg:grid-cols-[1fr_220px]`. Acceptable.
- Footer reads "All calculations verified server-side" in body voice;
  `PRODUCT.md` rejects the previous "Backend owns numerical
  correctness" wording. The current wording is acceptable.

Cramped, broken, unfinished.

- The action bar (Compute, Reset, validation success) wraps awkwardly
  on small viewports because the success line is `ml-auto`.
- The Quick Reference rail vanishes below `lg`, replaced by a
  collapsible. Acceptable behavior, already present.

Premium / academic feel.

- Header reads as a polished masthead. The translucent `bg-card/80`
  drifts toward the modern-SaaS look the design system rejects.
  Otherwise on token.

#### 3.2.16 `index.css`

Follows.

- `:root` and `.dark` blocks define the OKLCH tokens documented in
  `DESIGN.md` and mirrored in `.impeccable/design.json`. `slate-ink`,
  `surface-warm`, `surface-card`, `surface-tinted`, `border-subtle`,
  `amber-caution`, `coral-error`, `cyan-data` all wired in.
- `.font-math`, `.font-numeric`, and the body font fall through the
  Three-Voice stack, with `tabular-nums` on `numeric`.
- Reduced-motion media query disables `.transition-subtle` and
  `.animate-in-results`.
- Custom range slider styling routes through `--primary`, `--muted`,
  and `--card`.

Violates.

- There is no `.font-label` (or analog) handle for the `label` voice
  defined in `.impeccable/design.json`. The role is implemented via
  ad-hoc utility strings (`text-[10px] uppercase tracking-wider font-
  medium`) repeated across components.
- `*  { border-color: var(--border); }` sets a default border color
  globally; this is benign but non-canonical.
- Scrollbar styling uses `var(--border)` for thumb and `var(--muted-
  foreground)` for hover. Acceptable.
- The KaTeX font size override `.katex { font-size: 1.1em !important;
  }` uses `!important`; acceptable for KaTeX integration.

Cramped, broken, unfinished.

- The role tokens for `display`, `body`, `label`, and `numeric` are not
  exposed as CSS custom properties (`--font-display` etc.) in
  `:root`, only via class handles. Strictly cosmetic; the system works.

Premium / academic feel.

- Tokens are correctly OKLCH and tinted toward hue 250. The CSS file
  is one of the strongest pieces of system alignment; the only premium
  drift is the missing `label` voice handle.

---

## 4. Implementation Plan

This plan is ordered. Each item lists exact frontend areas to change,
the files likely to be touched, the verification commands to run after
the work in that group, and live-test scenarios that confirm the
group's intent. Each item cites the requirement clauses it satisfies
(per Requirement 8.5).

This plan is analysis only. No code is written here. No file under
`frontend/src/` is modified during this design phase (Requirement 8.1,
8.7).

Sketches in this section are illustrative pseudo-snippets meant to
fix intent. They are not diffs and are not executable changes.

Group A. Foundation: tokens, voices, focus, motion.
Group B. Mode layouts: Points, X + f(x), Interval.
Group C. Math input typography and spacing.
Group D. Method emphasis and method details.
Group E. Error and warning hierarchy.
Group F. Results panel and chrome polish.
Group G. Verification, live tests, and handoff.

### Group A: Foundation tokens, voices, focus, motion

Areas to change:

- Add a single `label` voice CSS handle (for example `.font-label`
  with the `label` token: 0.625rem, 500, letter-spacing 0.05em,
  uppercase). This becomes the canonical replacement for the ad-hoc
  `text-[10px] uppercase tracking-wider font-medium` strings sprinkled
  across components.
- Confirm `--ring` is the `indigo-deep` token and that focus styles
  on every interactive primitive use 3px ring at `ring/50`. Adjust
  `select.tsx` so it uses 32px height, `lg` radius, and the 3px focus
  ring like the `Input` primitive. Adjust the `Switch` primitive to
  show the same 3px focus ring.
- Confirm and document that `prefers-reduced-motion` disables
  `.animate-in-results` and `.transition-subtle`. Already done in
  `index.css`; this group only verifies and documents.

Files likely touched:

- `frontend/src/index.css` (add `.font-label`).
- `frontend/src/components/ui/select.tsx` (height, radius, focus
  ring).
- `frontend/src/components/ui/switch.tsx` (focus ring).

Sketch:

```
.font-label {
  font-family: "IBM Plex Sans Variable", system-ui, sans-serif;
  font-size: 0.625rem; font-weight: 500;
  letter-spacing: 0.05em; line-height: 1; text-transform: uppercase;
}
```

Verification commands (after this group):

- `cd frontend && npx tsc -b`
- `cd frontend && npm run lint`

Live-test scenarios:

- Tab through Compute, Reset, every input, and the method cards.
  Confirm a 3px ring at `ring/50` opacity is visible on every focus.
- With `prefers-reduced-motion: reduce` set in OS settings, click
  Compute. Confirm the results section appears without translation.

Requirement traceability: Requirement 2.1 (OKLCH tokens), 2.2 (Tinted
Neutral), 2.3 (Three-Voice), 2.4 (Numeric Respect on values), 2.10
(focus ring), 2.11 (reduced motion), 5.7 (input height and radius),
5.8 (focus ring on math inputs).

### Group B: Mode layouts (Points, X + f(x), Interval)

Areas to change:

- X + f(x) mode: ensure the function input and x-values list each
  occupy the full width of the input card content area at md+; ensure
  each x-value row's numeric input is at least 160px wide; surface
  the function-validation success state next to the function input
  rather than in the action bar.
- Interval mode: keep the current three-block structure; balance the
  strategy/count row at `grid-cols-[2fr_1fr]` so the count input
  reads as numeric and the strategy reads as a selector; stack both
  2-column rows below 768px (`md:grid-cols-2` plus default
  `grid-cols-1`); render `a` and `b` in `numeric` voice within the
  field labels; show an inline destructive notice when `node_count`
  drifts below 2 or above 50 instead of clamping silently; render
  helper text under the function input symmetric with X + f(x).
- Points mode: align spacing to `space-y-2` between rows; replace "0"
  placeholders with subtle muted illustrative examples in `numeric`
  voice; align "Add Point" sizing with the rest of the editors.

Files likely touched:

- `frontend/src/components/XValuesInput.tsx`
- `frontend/src/components/FunctionIntervalInput.tsx`
- `frontend/src/components/PointsInput.tsx`
- `frontend/src/components/InputPanel.tsx` (only for shared helper
  text or layout grid containers, if any)

Layout sketch (X + f(x), illustrative only):

```
[ Function f(x)  ___________________________________________________ ]
[ helper: allowed functions in label voice                            ]
[ X-Values                                                            ]
[ i=0  [______ 160px+ numeric ______]   [remove]                      ]
[ i=1  [______ 160px+ numeric ______]   [remove]                      ]
[ + Add X-Value                                                       ]
```

Layout sketch (Interval, illustrative only):

```
[ Function f(x)   _________________________________________________ ]
[ Interval Start a   ____________ ]   [ Interval End b   _________ ]
[ Node Strategy   __________________ ]   [ Node Count   ________ ] ]
```

Verification commands:

- `cd frontend && npx tsc -b`
- `cd frontend && npm run build`
- `cd frontend && npm run lint`

Live-test scenarios:

- Switch to X + f(x). Type `1/x`. After 800ms, confirm the green
  "Valid: 1/x" appears next to the function input, not on the action
  bar. Add four x-values. Confirm each row's numeric input is at
  least 160px wide at the laptop breakpoint and that the rows do not
  collapse when adding or removing rows.
- Switch to Interval. Resize the window below 768px and confirm
  `[a, b]` and the strategy/count row stack vertically without
  horizontal overflow. Set `node_count` to 1 and confirm an inline
  destructive notice appears and the Compute button is blocked.
- Switch to Points. Confirm the editor occupies the full card content
  width and rows breathe at `space-y-2`.

Requirement traceability:

- Requirement 3.1 (full-width function input), 3.2 (x-values fill
  width at md+), 3.3 (160px minimum input), 3.4 (label voice on
  function and x-values labels), 3.5 (no horizontal layout collapse),
  3.6 (success state adjacent to function input), 3.7 (failure state
  adjacent with destructive color and human-readable message).
- Requirement 4.1 (full-width function input), 4.2 (`[a, b]` row),
  4.3 (strategy/count row), 4.4 (stacking below 768px), 4.5 (label
  voice and `numeric` `a` and `b`), 4.6 (canonical strategy labels),
  4.7 (inline destructive notice for out-of-range node count), 4.8
  (`numeric` voice on every numeric value).
- Requirement 5.1 to 5.10 (math input typography, spacing, labels,
  helper paragraphs).

### Group C: Math input typography and spacing

Areas to change:

- Replace every `font-mono` on math input fields with `font-numeric`
  so they pick up `JetBrains Mono` plus `tabular-nums`. The
  `XValuesInput` function input and x-value rows are the immediate
  targets.
- Replace inline `text-[var(--muted-foreground)]` and
  `text-[var(--destructive)]` strings with the Tailwind aliases
  `text-muted-foreground` and `text-destructive`. Same colors,
  consistent convention.
- Apply the new `.font-label` handle to: `PointsInput` table headers
  (`i`, `xᵢ`, `yᵢ`), `FunctionIntervalInput` labels for `a` and `b`,
  `MethodSelector` role tags, `WarningsDisplay` severity word,
  `NodesTable` and `EvaluationTable` `<TableHead>` cells, the Newton
  divided-difference table header (`f[xᵢ]`, `Δ¹`...), and the
  Barycentric weights table header (`i`, `xᵢ`, `wᵢ`).
- Ensure `EvaluationTargets` chips have a visible focus state (3px
  ring) and increase chip width to fit values like `0.95` plus
  padding without truncation.

Files likely touched:

- `frontend/src/components/XValuesInput.tsx`
- `frontend/src/components/PointsInput.tsx`
- `frontend/src/components/FunctionIntervalInput.tsx`
- `frontend/src/components/MethodSelector.tsx`
- `frontend/src/components/WarningsDisplay.tsx`
- `frontend/src/components/EvaluationTargets.tsx`
- `frontend/src/components/results/NodesTable.tsx`
- `frontend/src/components/results/EvaluationTable.tsx`
- `frontend/src/components/results/MethodDetails.tsx`

Verification commands:

- `cd frontend && npx tsc -b`
- `cd frontend && npm run build`
- `cd frontend && npm run lint`

Live-test scenarios:

- Compute the Linear Lagrange example. Confirm `xᵢ` and `yᵢ` columns
  in the Nodes table render in `JetBrains Mono` with `tabular-nums`,
  and the column headers render in label voice (10px tracked
  uppercase).
- Compute the 1/x example. Confirm Newton's divided-difference table
  shows `f[xᵢ]`, `Δ¹`, `Δ²` headers in label voice and Barycentric
  weights show `i`, `xᵢ`, `wᵢ` in label voice.
- Compute Runge. Confirm warning labels ("HIGH DEGREE",
  "RUNGE PHENOMENON") render in label voice with the warning
  message in body voice.

Requirement traceability:

- Requirement 2.3 (Three-Voice), 2.4 (Numeric Respect on values).
- Requirement 5.1 (numeric voice with `tabular-nums`), 5.2 (label
  voice on column headers), 5.3 (vertical row spacing), 5.4
  (horizontal column gap), 5.5 (points editor grid columns), 5.6
  (full-width points editor), 5.9 (placeholders in muted numeric
  voice), 5.10 (helper paragraphs in body voice).
- Requirement 7.9 to 7.11 (Newton, Neville, Barycentric table
  headers in label voice).

### Group D: Method emphasis and method details

Areas to change:

- `MethodSelector`: replace role labels with the canonical pairing
  ("Construction" for Lagrange, "Construction" for Newton, "Stable
  Evaluator" for Barycentric, "Target-Specific" for Neville). Keep
  the Barycentric tag in primary tint without enlarging or reordering
  the card.
- `MethodSelector`: rewrite the one-sentence descriptions to match the
  Requirement 7.5 wording: "Lagrange shows basis polynomials and
  summation form", "Newton shows divided-difference tables and nested
  form", "Barycentric provides stable evaluation and is the source for
  graph data", "Neville produces target-specific triangular tables".
- `MethodSelector`: surface a visible focus ring on the underlying
  hidden checkbox via the `<label>` wrapper (use `focus-within:` on
  the wrapper).
- `MethodSelector`: collapse the corner selection-indicator dot into
  a quieter check (or remove it) so the role tag and the indicator do
  not fight for the top-right corner. Keep the selected state
  expressed by border, background, and ring.
- `MethodDetails`: enforce the section structure documented in
  Requirement 7.8 (status, error, warnings, then content). Today the
  order is correct; the change is structural, not behavioral, but
  flatten the nested-outline drift on basis polynomials, coefficients,
  and divided-difference table containers (drop the inner `border` on
  surfaces already inside a card; rely on `bg-muted/30` tonal
  layering).
- `MethodDetails`: align Newton coefficients chips to the Flat-at-Rest
  rule (drop `shadow-sm` at rest; keep on hover only).
- `MethodDetails`: render Neville table headers with the target x in
  body voice and the value itself in `numeric` voice. Replace the
  middle-dot separator with a colon ("Neville Table for x = 3").
- `MethodDetails`: rebuild `MethodError` so the human-readable message
  is primary and the code is `numeric`-voice secondary prefixed with
  `Code:` (handled in Group E).

Files likely touched:

- `frontend/src/components/MethodSelector.tsx`
- `frontend/src/components/results/MethodDetails.tsx`

Sketch (method-card structure, illustrative):

```
[card]
  [Method name (sans 600)]                                [role tag]
  [one-sentence description in body voice]
  [selected indicator: border + bg + ring; no corner dot]
[/card]
```

Verification commands:

- `cd frontend && npx tsc -b`
- `cd frontend && npm run build`
- `cd frontend && npm run lint`
- `impeccable detect "C:\\Users\\Emmy Lou\\Documents\\New project 3"`
  (zero P0 and zero P1 expected, per Requirement 9.4)

Live-test scenarios:

- Confirm method cards show the canonical role pairing: Construction,
  Construction, Stable Evaluator (in primary tint), Target-Specific.
- Confirm the four method cards in the selector are at equal visual
  prominence (no card larger or brighter than the others; only the
  Barycentric tag uses primary tint).
- Compute the 1/x example with Neville selected and an evaluation
  target at `x = 3`. Confirm the Neville section shows a header that
  identifies the target and the target value in `numeric` voice.
- Compute Runge with all four methods. Confirm the Method Details
  tabs appear in the order Lagrange, Newton, Barycentric, Neville.

Requirement traceability:

- Requirement 7.1 (equal visual prominence), 7.2 (role tags), 7.3
  (label voice on role tag), 7.4 (Barycentric primary tint), 7.5
  (descriptions), 7.6 (order), 7.7 (selection state styling), 7.8
  (Method Details structure), 7.9 (Newton header row), 7.10 (Neville
  header row), 7.11 (Barycentric header row).
- Requirement 2.8 (card containment), 2.9 (no nested cards).

### Group E: Error and warning hierarchy

Areas to change:

- Replace the serialized `[code] message` string handling in `App.tsx`
  with structured error state (`{ code, message }`). Create a small
  shared error renderer that takes `{ code, message }` plus optional
  `guidance` and produces:
  - Title: human-readable `message` in error title typography.
  - Secondary: `Code: {code}` in `numeric` voice prefixed by the
    literal label.
  - Body: optional recovery guidance from a frontend-maintained map
    keyed by `code`. The recognized codes are `too_few_nodes`,
    `duplicate_x_values`, `unsafe_expression`, `function_domain_error`,
    `invalid_interval`, `no_methods_selected`.
- Move `unsafe_expression` and `function_domain_error` into the
  function input region directly (inline beneath the function input)
  in both X + f(x) and Interval modes; fall back to the top-level
  banner when no function input is mounted.
- Inline rendering MUST use the same primary-message-secondary-code
  hierarchy described above.
- `WarningsDisplay`: route warning body text through `text-warning-
  foreground` rather than `text-muted-foreground`; route info body
  text through `text-info-foreground`.
- `MethodDetails.MethodError`: invert hierarchy so the message is the
  primary content and the code is in `numeric` voice on a secondary
  line.
- `MethodDetails.MethodWarnings`: align with `WarningsDisplay` so per-
  method warnings render with the same severity label, icon, and body
  hierarchy as top-level warnings.
- For partial responses: render every successful method's content
  while injecting per-method errors with the same hierarchy
  (Requirement 6.10).
- Handle missing `message`: render the `code` as the primary content
  and "Backend did not provide a description." as the secondary line
  (Requirement 6.11).

Files likely touched:

- `frontend/src/App.tsx` (structured error state, route map)
- `frontend/src/components/WarningsDisplay.tsx`
- `frontend/src/components/results/MethodDetails.tsx`
- `frontend/src/components/XValuesInput.tsx` (inline function error
  block layout)
- `frontend/src/components/FunctionIntervalInput.tsx` (inline function
  error block layout)
- (optional) a new `frontend/src/components/ErrorNotice.tsx` that
  encapsulates the shared error rendering; the design phase only
  notes the candidate location.

Sketch (error notice, illustrative):

```
[!] At least two distinct points are required.
    Code: too_few_nodes
    Add at least two distinct (x, y) pairs and recompute.
```

Verification commands:

- `cd frontend && npx tsc -b`
- `cd frontend && npm run build`
- `cd frontend && npm run lint`
- `impeccable detect "C:\\Users\\Emmy Lou\\Documents\\New project 3"`

Live-test scenarios:

- In Points mode with a single point, click Compute. Confirm a
  destructive notice with primary message "At least two distinct
  points are required.", secondary `Code: too_few_nodes` in numeric
  voice, body recovery sentence.
- In X + f(x), type `__import__("os")` and click Compute. Confirm
  the destructive notice appears inline beneath the function input
  with the human-readable message first, the code second, and the
  recovery sentence third.
- In Interval, set `[a, b]` to `[1, 1]` and click Compute. Confirm
  the destructive notice carries `Code: invalid_interval` and a
  recovery sentence.
- Compute the Runge example. Confirm "HIGH DEGREE" and "RUNGE
  PHENOMENON" warnings render with severity label in label voice and
  body text in `text-warning-foreground`. Confirm both stay visible
  without user action (Requirement 6.7).
- Trigger a partial response (for example by selecting Neville without
  evaluation targets). Confirm successful methods still render and
  the per-method error inside `MethodDetails` follows the same
  primary-message hierarchy.

Requirement traceability:

- Requirement 6.1 to 6.11 (error and warning hierarchy, inline routing
  for function-related codes, partial responses, missing-message
  fallback).
- Requirement 2.5 to 2.6 (Inset Containment, no side stripes).
- Requirement 6.9 (icon plus text label pairing).

### Group F: Results panel and chrome polish

Areas to change:

- `ResultsPanel`: keep tab navigation but flatten the `rounded-xl
  border bg-card` outer container so the tabs sit as section
  navigation rather than as a standalone outlined card. Either remove
  the outer ring on the tab bar or visually merge the tabs with the
  active panel. Keep the `bg-primary/10 text-primary` active state.
- `App.tsx` header: drop `bg-card/80` translucency in favor of opaque
  `bg-card` so the masthead is unambiguously flat at rest. Keep
  `sticky top-0` and the `border-b`.
- `App.tsx` action bar: remove `shadow-sm` from the Compute button at
  rest. Apply shadow only on hover or focus to comply with Flat-at-
  Rest.
- `PolynomialCard`: drop the inner `border` from KaTeX-display
  containers (`bg-muted/30 rounded-lg p-4 border`). The card outline
  already provides containment; tonal layering alone separates the
  formula block.
- `MethodDetails`: drop inner `border` ring on basis-polynomial
  container, on Newton coefficient block, and on the divided-
  difference table wrapper. Use only `bg-muted/30 rounded-lg p-3` for
  tonal layering.
- `NodesTable`: convert `<TableHead>` cells to label voice. Add a
  horizontal scroll wrapper around the table for long rationals.
- `EvaluationTable`: convert `<TableHead>` cells to label voice.
  Replace "—" placeholder with the centered muted dot used elsewhere.
- `EducationalNotes`: rename heading copy to "Educational Notes" so
  the section name is consistent across PRODUCT.md and the tab. Share
  the bullet style with `BarycentricDetails` via a single class or
  utility.
- `GraphCard`: route Recharts tick and tooltip font references through
  the full `numeric` voice stack (or a single CSS variable) rather
  than the inline two-font string.
- `HealthIndicator`: replace the raw `bg-[var(--destructive)]` color
  literal with the Tailwind alias `bg-destructive`.

Files likely touched:

- `frontend/src/components/ResultsPanel.tsx`
- `frontend/src/App.tsx`
- `frontend/src/components/results/PolynomialCard.tsx`
- `frontend/src/components/results/MethodDetails.tsx`
- `frontend/src/components/results/NodesTable.tsx`
- `frontend/src/components/results/EvaluationTable.tsx`
- `frontend/src/components/results/EducationalNotes.tsx`
- `frontend/src/components/results/GraphCard.tsx`
- `frontend/src/components/HealthIndicator.tsx`

Verification commands:

- `cd frontend && npx tsc -b`
- `cd frontend && npm run build`
- `cd frontend && npm run lint`
- `impeccable detect "C:\\Users\\Emmy Lou\\Documents\\New project 3"`

Live-test scenarios:

- Compute Linear Lagrange. Confirm the polynomial card no longer has
  a 1px inner border around the KaTeX block; the card-outline alone
  contains the formula.
- Compute the 1/x example with all four methods. Confirm Method
  Details shows quieter section structure: tonal layering, no inner
  outlines on basis polynomials, coefficients, or the divided-
  difference table; Newton coefficients chips do not carry a shadow
  at rest.
- Confirm the header masthead does not show translucent backdrop
  behavior on scroll (no glassmorphism).
- Confirm the Compute button is flat at rest and gains a soft shadow
  only on hover.

Requirement traceability:

- Requirement 2.7 (no AI gradients or glassmorphism), 2.8 (Flat-at-
  Rest), 2.9 (no nested cards).
- Requirement 5.2 (label voice on column headers), 5.5 (points editor
  grid columns), 5.10 (helper paragraphs).
- Requirement 7.6, 7.8, 7.9, 7.10, 7.11 (method order and table
  headers).
- Requirement 1.6, 1.7 (graph rendering only from backend arrays),
  10.7 (no client recomputation in the chart).

### Group G: Verification, live tests, and handoff

This group is the closing pass; it is run after Groups A through F.

Verification commands (Requirement 9):

- `cd frontend && npx tsc -b` (Requirement 9.1, zero TypeScript
  errors)
- `cd frontend && npm run build` (Requirement 9.2, successful exit)
- `cd frontend && npm run lint` (Requirement 9.3, zero ESLint errors;
  warnings are acceptable)
- `impeccable detect "C:\\Users\\Emmy Lou\\Documents\\New project 3"`
  (Requirement 9.4, zero P0 and zero P1 findings)

Each must pass before this feature is considered complete; failures
must be resolved or accepted with a recorded justification in
`docs/HANDOFF.md` (Requirement 9.5).

Live-test scenarios against the running backend (Requirement 10):

- Linear Lagrange. Points `(2, 4)` and `(5, 1)` with evaluation
  target `x = 3`. Expect polynomial `P(x) = 6 − x` and evaluation
  `P(3) = 3`. (Requirement 10.1.)
- 1/x. X-values `[2, 2.75, 4]` with `f(x) = 1/x` and evaluation
  target `x = 3`. Expect `P(3) = 29/88` (approximately `0.32955`).
  (Requirement 10.2.)
- Newton divided-difference. Compute any example that yields a non-
  empty `divided_difference_table`. Confirm the table renders with
  a labelled header row and one row per node. (Requirement 10.3.)
- Neville. Compute an example with one or more `evaluation_x`.
  Confirm each Neville table renders as a triangular table with a
  header identifying the target x-value. (Requirement 10.4.)
- Barycentric weights. Compute any example with Barycentric selected.
  Confirm the weights table has columns `i`, `xᵢ`, `wᵢ` and one row
  per node. (Requirement 10.5.)
- Warnings and errors. Run Runge and a deliberate validation failure.
  Confirm warnings render with the human-readable hierarchy from
  Requirement 6 and stay visible without user action. (Requirement
  10.6.)
- Graph rendering. Compute Runge with `graph: true`. Open browser
  devtools network tab; confirm the chart consumes only `graph_data.x`,
  `graph_data.f_x`, `graph_data.P_x`, `graph_data.error`, and the
  node coordinates. Confirm no client-side resampling. (Requirement
  10.7, with 1.7 backing.)

Handoff updates (Requirement 11):

- `docs/HANDOFF.md` gains a section recording this feature, with the
  five subsections Requirement 11.2 to 11.6 prescribes:
  - DESIGN.md Alignment Review Summary (rules audited and audit
    result).
  - What Changed (frontend files modified, created, or removed).
  - Commands Run (each verification command from Requirement 9 with
    its working directory and exit result).
  - Live-Test Results (each scenario from Requirement 10 with pass or
    fail outcome and any deviation noted).
  - Remaining Caveats.
- `docs/FRONTEND_HANDOFF.md` gains a matching update reflecting the
  new layout, error hierarchy, and method emphasis behavior
  (Requirement 11.7).
- Any verification command or live-test scenario that was not
  actually executed and observed is not claimed to have passed
  (Requirement 11.8).

Files likely touched:

- `docs/HANDOFF.md`
- `docs/FRONTEND_HANDOFF.md`

Verification commands (this group only):

- The four verification commands listed above.

Live-test scenarios:

- The seven scenarios listed above, executed in order against the
  running backend at `http://127.0.0.1:8000`.

Requirement traceability:

- Requirement 9.1 to 9.5 (post-implementation verification commands).
- Requirement 10.1 to 10.7 (live-test scenarios).
- Requirement 11.1 to 11.8 (handoff documentation update).

---

### Cross-cutting backend-authority assertions

Per Requirement 1, every group above is constrained by the following.
These constraints are restated here so they read as part of the plan,
not as a footnote.

- No file under `backend/` is modified during this feature
  (Requirement 1.1).
- No request shape, response shape, or endpoint path defined in
  `docs/API_CONTRACT.md` is changed (Requirements 1.2, 1.3, 1.4).
- No interpolation algorithm is implemented, replaced, or overridden
  in client code (Requirement 1.5).
- The frontend renders only the values returned by the backend
  response (polynomial values, evaluations, weights, divided-
  difference tables, Neville tables, basis polynomials, and graph
  data) and does not derive new numerical values for display
  (Requirements 1.6, 1.7).
- Math.js or any equivalent client-side library is not used as the
  source of truth for any displayed numerical result; if used, it is
  restricted to non-authoritative purposes such as formatting or
  syntax highlighting and never replaces or corrects backend output
  (Requirements 1.8, 1.9).
- All numeric user input is passed to the backend as strings
  (Requirement 1.10).

These assertions translate into concrete plan rules:

- Group F's `GraphCard` polish does not change which arrays the chart
  consumes; it only routes typography through canonical voices. The
  rendering pipeline still consumes `graph_data.x`, `f_x`, `P_x`,
  `error`, and the node coordinates only.
- Group E's structured error state still uses the backend `code` and
  `message` fields verbatim; the frontend adds a guidance sentence
  but never rewrites the backend message into a different claim about
  what happened.
- Group D's method emphasis adjusts copy, role tags, and structure;
  it does not adjust which methods are available or what the per-
  method tables contain.

### Out-of-scope items

- Backend changes of any kind.
- New API endpoints or new fields on existing endpoints.
- Adding a new client-side numerical library.
- Switching design tokens to another palette family.
- Adding dark-mode toggle UI in this feature (the `.dark` token block
  is already present in `index.css`; surfacing a switch is not part
  of this overhaul).
- Adding keyboard shortcuts (Ctrl+Enter for Compute and similar) is a
  separate UX deferral noted in `docs/HANDOFF.md`.

### End of design phase

Per the workflow, the design phase ends here. The next phase is
`tasks.md`. No `tasks.md` is written by this document, and no file
under `frontend/src/` is edited until the user approves this design
(Requirement 8.1).
