# Requirements Document

## Introduction

The Polynomial Interpolation frontend exists, builds, and is wired to the backend, but it does not yet match the project's design system, "The Analysis Bench" (defined in `PRODUCT.md`, `DESIGN.md`, and `.impeccable/design.json`). The user has identified concrete UI defects: the X + f(x) and Interval input modes feel cramped and waste horizontal space, math inputs lack typographic hierarchy, error displays put backend codes ahead of human language, and the four interpolation methods are not visually balanced according to their pedagogical roles.

This feature is a frontend-only design-system alignment and UI overhaul. The backend, the API contract, the numerical engine, and the interpolation logic are out of scope and must remain untouched. The frontend must continue to render backend results exactly as returned, never recomputing math on the client and never treating any client-side library (such as Math.js) as the source of truth.

The deliverable is structured as four pre-coding artifacts (a PRODUCT summary, a DESIGN summary, a per-component UI audit, and an implementation plan) followed by an in-place UI overhaul, verified by `tsc -b`, `npm run build`, `npm run lint`, the impeccable detector, and a list of live-test scenarios against the running backend, and finally a handoff update to `docs/HANDOFF.md` and `docs/FRONTEND_HANDOFF.md`.

## Glossary

- **Frontend**: The React application located under `frontend/` in this repository, including all files in `frontend/src/`.
- **Backend**: The FastAPI service located under `backend/`. It is read-only for this feature.
- **The Analysis Bench**: The named design system for this product, defined by `PRODUCT.md`, `DESIGN.md`, and `.impeccable/design.json`. The frontend is the implementation surface for this design system.
- **Design Tokens**: The OKLCH color values, typography voices, radii, spacing scale, motion easings and durations, and component snippets defined in `DESIGN.md` and `.impeccable/design.json`.
- **Three-Voice Typography**: The mandated typography system: Iowan Old Style (with Palatino, Georgia, serif fallbacks) for the scholarly display voice, IBM Plex Sans Variable (with system-ui sans fallbacks) for interface text, and JetBrains Mono (with Fira Code, SF Mono, monospace fallbacks) for every mathematical numeric value, formula, coefficient, and table cell.
- **Tinted Neutral Rule**: The DESIGN.md rule that every neutral surface and text color must be tinted toward hue 250 (blue-slate) and that pure `#000` and pure `#fff` are prohibited.
- **Inset Containment Rule**: The DESIGN.md rule that warnings and notices must use `ring-1 ring-inset` with a semantic color rather than a thick colored side-stripe border.
- **Input Mode**: One of three values selected via the input mode tabs: `points`, `x_values_with_function` (referred to in the UI as "X + f(x)"), or `function_interval` (referred to in the UI as "Interval").
- **Method**: One of the four interpolation methods returned by the backend: `lagrange`, `newton`, `barycentric`, `neville`.
- **Method Emphasis**: The visual and informational balance among the four methods that communicates each method's pedagogical role: Lagrange for construction (basis polynomials), Newton for construction (divided-difference table), Barycentric for stable evaluation, Neville for target-specific recursion.
- **Backend Error Code**: The string in the `error.code` field of an error response (for example `too_few_nodes`, `unsafe_expression`).
- **Backend Error Message**: The string in the `error.message` field of an error response, written in human-readable language.
- **Pre-coding Deliverables**: Four written sections produced before any frontend code is changed: (1) PRODUCT.md summary, (2) DESIGN.md / design.json summary, (3) per-component UI audit, (4) implementation plan. These live in `design.md` for this spec.
- **Verification Commands**: The fixed list of post-implementation commands defined in Requirement 9.
- **Live-Test Scenarios**: The fixed list of post-implementation manual checks against the running backend defined in Requirement 10.
- **Handoff Documents**: `docs/HANDOFF.md` and `docs/FRONTEND_HANDOFF.md`.
- **Math Input**: Any input field whose primary purpose is to accept a mathematical value or expression: x, y, x-values, evaluation targets, interval endpoints, node count, function expressions.

## Requirements

### Requirement 1: Backend Authority Preservation (Hard Rules)

**User Story:** As a backend owner, I want the frontend overhaul to preserve every aspect of backend authority, so that the API contract, numerical engine, and interpolation logic remain the single source of truth.

#### Acceptance Criteria

1. THE Frontend SHALL NOT modify any file under `backend/` during this feature.
2. THE Frontend SHALL NOT change any request shape defined in `docs/API_CONTRACT.md`.
3. THE Frontend SHALL NOT change any response shape defined in `docs/API_CONTRACT.md`.
4. THE Frontend SHALL NOT change any endpoint path served by the backend.
5. THE Frontend SHALL NOT implement, replace, or override any interpolation algorithm in client code.
6. WHEN the backend response contains polynomial values, evaluations, weights, divided-difference tables, Neville tables, basis polynomials, or graph data, THE Frontend SHALL render those values, and SHALL render only the values returned by the backend response.
7. THE Frontend SHALL NOT recompute, resample, smooth, interpolate, or otherwise derive new numerical values for display from backend numerical results, including but not limited to graph curves, polynomial evaluations, and table cells.
8. THE Frontend SHALL NOT use Math.js, mathjs, or any equivalent client-side math library as the source of truth for any displayed numerical result.
9. WHERE Math.js or any equivalent library is used in the Frontend, THE Frontend SHALL restrict its use to non-authoritative purposes such as input formatting, parsing user input strings into request payloads, or syntax highlighting, and the result of any such use SHALL NOT replace, supplement, or correct backend output.
10. THE Frontend SHALL pass all numeric user input to the backend as strings, consistent with `docs/API_CONTRACT.md`.

### Requirement 2: Design-System Alignment with The Analysis Bench

**User Story:** As a numerical-analysis student or instructor, I want the UI to look and feel like the documented design system "The Analysis Bench", so that the application reads as a premium scholarly workbench rather than a generic SaaS form.

#### Acceptance Criteria

1. THE Frontend SHALL use the OKLCH color tokens defined in `DESIGN.md` and mirrored in `.impeccable/design.json` for background, foreground, primary, secondary, muted, accent, destructive, warning, info, border, input, and ring.
2. THE Frontend SHALL NOT use `#000`, `#fff`, or untinted neutral grays in any visible UI surface, in accordance with the Tinted Neutral Rule.
3. THE Frontend SHALL apply the Three-Voice Typography system: Iowan Old Style serif for the application identity mark and any scholarly display heading, IBM Plex Sans Variable for all interface text, and JetBrains Mono with `font-variant-numeric: tabular-nums` for every mathematical numeric value, formula text, coefficient, weight, table cell, and coordinate.
4. THE Frontend SHALL NOT render any number that represents a computed result, coordinate, coefficient, weight, divided-difference cell, Neville cell, or table entry in the body sans-serif voice.
5. THE Frontend SHALL contain warnings and informational notices using `ring-1 ring-inset` with a semantic color, in accordance with the Inset Containment Rule.
6. THE Frontend SHALL NOT use any colored side-stripe border greater than 1px on cards, warnings, or callouts.
7. THE Frontend SHALL NOT use gradient text, decorative backdrop-blur, frosted-glass effects, bounce or elastic easing, or purple-to-blue "AI app" gradients.
8. THE Frontend SHALL apply card containment using a thin outline (`ring-1` at the foreground/10 opacity prescribed by `DESIGN.md`) at rest, with shadows appearing only as a response to hover, focus, selection, or importance.
9. THE Frontend SHALL NOT nest one card directly inside another card; section structure within a card SHALL use tonal layering, separators, or section headers instead.
10. THE Frontend SHALL include a visible focus ring on every interactive element with a width between 2px and 4px and the `ring/50` opacity prescribed by `DESIGN.md`, with a target value of 3px.
11. WHERE the user has set `prefers-reduced-motion: reduce`, THE Frontend SHALL disable non-essential animations.
12. THE Frontend SHALL NOT use Inter, Arial, or system-default sans-serif as the primary interface font.

### Requirement 3: X + f(x) Mode Layout

**User Story:** As a user entering a function and a list of x-values, I want the X + f(x) input mode to use the available horizontal space effectively, so that the function expression and x-value list are easy to read and edit.

#### Acceptance Criteria

1. WHEN the input mode is `x_values_with_function`, THE Frontend SHALL render the function expression input across the full width of the input card content area, with no fixed maximum width below the input card's own content width.
2. WHEN the input mode is `x_values_with_function`, THE Frontend SHALL render the x-values list using a layout that fills the available horizontal width of the input card content area at viewport widths of 768px and above.
3. WHEN the input mode is `x_values_with_function` is rendered at viewport widths of 768px and above, THE Frontend SHALL display each x-value row with a numeric monospace input that is at least 160px wide.
4. THE Frontend SHALL render the function-expression label, the x-values label, and the helper text describing allowed functions using the design-system Label and body voices, not as inline plain text.
5. WHILE the input mode is `x_values_with_function` and the user adds an x-value, removes an x-value, performs a sequence of add and remove operations, types into an existing x-value field, or initially renders the panel, THE Frontend SHALL preserve the layout width of the input column without horizontal layout collapse.
6. WHEN the inline function validation succeeds, THE Frontend SHALL display the success state in the design-system primary or info color with an accompanying icon and accessible text label, consistent with Requirement 5.
7. WHEN the inline function validation fails, THE Frontend SHALL display the failure state adjacent to the function input using the design-system destructive color with the human-readable backend message as the primary content, consistent with Requirement 5.

### Requirement 4: Interval Mode Layout

**User Story:** As a user entering a function, an interval, and a node strategy, I want the Interval input mode to feel structured and full-width, so that the four-field layout (function, [a, b], strategy, count) is legible and not cramped.

#### Acceptance Criteria

1. WHEN the input mode is `function_interval`, THE Frontend SHALL render the function expression input across the full width of the input card content area.
2. WHEN the input mode is `function_interval` is rendered at viewport widths of 768px and above, THE Frontend SHALL render the interval start and interval end inputs as a two-column row that occupies the full content width.
3. WHEN the input mode is `function_interval` is rendered at viewport widths of 768px and above, THE Frontend SHALL render the node strategy selector and the node count input as a two-column row that occupies the full content width.
4. WHEN the input mode is `function_interval` is rendered at viewport widths below 768px, THE Frontend SHALL stack the interval endpoints, the node strategy, and the node count vertically without horizontal overflow.
5. THE Frontend SHALL display the interval inputs with explicit field labels containing the mathematical notation `a` and `b`, set in the design-system Label voice.
6. THE Frontend SHALL display the node strategy options using the human-readable labels "Equally Spaced", "Chebyshev Nodes", and "Custom Nodes" with the corresponding API values `equally_spaced`, `chebyshev_nodes`, and `custom_nodes`.
7. IF the node count input has a value below 2 or above 50, THEN THE Frontend SHALL show the constraint inline using the design-system destructive notice pattern and SHALL prevent submission while the inline notice is displayed.
8. THE Frontend SHALL render every numeric value in this mode (interval endpoints, node count, generated nodes when displayed) using the JetBrains Mono numeric voice with tabular-nums.

### Requirement 5: Math Input Typography and Spacing

**User Story:** As a user entering mathematical inputs, I want every math input to feel typographically respected with clear hierarchy and consistent spacing, so that points, x-values, intervals, and evaluation targets read as first-class mathematical content.

#### Acceptance Criteria

1. THE Frontend SHALL render every value typed into a Math Input field using the JetBrains Mono numeric voice with `font-variant-numeric: tabular-nums` and the size scale defined in `DESIGN.md`.
2. THE Frontend SHALL render every Math Input column header (such as `i`, `xᵢ`, `yᵢ`, `a`, `b`) using the design-system Label voice (uppercase, 0.05em letter-spacing, 10–11px).
3. THE Frontend SHALL provide a vertical row spacing of at least the design-system `xs` (4px) between successive Math Input rows in the points editor and at least `sm` (8px) in the x-values editor at viewport widths of 768px and above.
4. THE Frontend SHALL provide a horizontal column gap of at least the design-system `sm` (8px) between adjacent Math Input cells in the points editor and the interval editor.
5. THE Frontend SHALL render the points editor as a labelled grid containing an index column, an x-input column, a y-input column, and a remove-action column, in that order.
6. WHEN the points editor renders 2 to 25 rows, THE Frontend SHALL fill the available width of the input card content area and SHALL not constrain the editor to a narrower maximum width than the surrounding card content.
7. THE Frontend SHALL render every Math Input field at the design-system input height of 32px (default) or larger, with the radius and border treatment defined for `input-default` in `DESIGN.md`.
8. WHEN a Math Input field has focus, THE Frontend SHALL display the 3px ring at 50% opacity in the design-system primary ring color.
9. THE Frontend SHALL render placeholder values in Math Input fields as illustrative numeric examples rendered in the muted text color and the JetBrains Mono numeric voice.
10. THE Frontend SHALL render every helper or descriptive paragraph adjacent to a Math Input using the IBM Plex Sans body voice at the size and color prescribed by `DESIGN.md`.

### Requirement 6: Error and Warning Presentation Hierarchy

**User Story:** As a user encountering a backend validation failure or numerical warning, I want the human-readable explanation to be the primary content, so that I can understand what went wrong without first decoding a code string.

#### Acceptance Criteria

1. WHEN the backend returns an error response with both `code` and `message`, THE Frontend SHALL render the human-readable backend message as the primary content of the error display, using the design-system error title typography.
2. WHEN the backend returns an error response with both `code` and `message`, THE Frontend SHALL render the backend error code as secondary content, smaller in size and lower in visual weight than the message, set in the JetBrains Mono numeric voice and prefixed with the label `Code:`.
3. WHEN the Frontend recognizes the backend error code as one of `too_few_nodes`, `duplicate_x_values`, `unsafe_expression`, `function_domain_error`, `invalid_interval`, or `no_methods_selected`, THE Frontend SHALL render an additional sentence of recovery guidance taken from a frontend-maintained code-to-guidance map.
4. WHEN the backend error code is `unsafe_expression` or `function_domain_error`, THE Frontend SHALL display the error inline beneath the function input rather than as a top-level banner.
5. IF inline rendering of an `unsafe_expression` or `function_domain_error` error fails or cannot be performed because no function input is currently mounted, THEN THE Frontend SHALL fall back to the top-level banner display using the same primary-message-secondary-code hierarchy.
6. WHEN the backend returns a warning with a `code` value listed in `docs/API_CONTRACT.md`, THE Frontend SHALL render a human-readable label (such as "High Degree", "Runge Phenomenon", "Close X-Values", "Extrapolation", "Method Disagreement", "Polynomial Omitted", "Neville Info", "Graph Domain Error", "Method Failed", "Nodes Reordered") as the primary header of the notice, with the message as the body content.
7. THE Frontend SHALL NOT hide, collapse by default, or remove any backend warning to make the page visually cleaner.
8. THE Frontend SHALL render every warning and error notice using the Inset Containment Rule (`ring-1 ring-inset`) with the semantic color matching its severity (amber for warning, coral for error, cyan for info).
9. THE Frontend SHALL pair every error and warning notice with both an icon and a text label so that severity is not communicated by color alone.
10. WHEN the response status is `partial`, THE Frontend SHALL render successful method outputs and SHALL display each per-method error within that method's section using the same primary-message-secondary-code hierarchy as top-level errors.
11. WHEN no human-readable message is available from the backend, THE Frontend SHALL display the error code as the primary content and SHALL annotate the display with a generic "Backend did not provide a description" body sentence rather than displaying the code with no explanation.

### Requirement 7: Balanced Method Emphasis

**User Story:** As a learner studying interpolation, I want the four methods to be visually balanced according to their pedagogical roles, so that I understand Lagrange and Newton as construction methods, Barycentric as the stable evaluator, and Neville as the target-specific recursion.

#### Acceptance Criteria

1. THE Frontend SHALL present the four methods (`lagrange`, `newton`, `barycentric`, `neville`) at equal visual prominence in the method selector, with no method given a larger card, brighter background, or higher z-order than the others except for the role-tag treatment defined below.
2. THE Frontend SHALL display a role tag on each method selector card containing one of: "Construction" for Lagrange, "Construction" for Newton, "Stable Evaluator" for Barycentric, "Target-Specific" for Neville.
3. THE Frontend SHALL render the role tag using the design-system Label voice (10px, 0.05em letter-spacing, uppercase).
4. THE Frontend SHALL render the role tag for `barycentric` using the design-system primary tint to mark it as the recommended evaluator without enlarging or reordering the card.
5. THE Frontend SHALL include a one-sentence description on each method selector card explaining the method's purpose using the language: Lagrange shows basis polynomials and summation form, Newton shows divided-difference tables and nested form, Barycentric provides stable evaluation and is used as the source for graph data, Neville produces target-specific triangular tables.
6. THE Frontend SHALL display the four methods in the order Lagrange, Newton, Barycentric, Neville in the method selector and in the Method Details tabs.
7. WHEN the user selects a single method, THE Frontend SHALL retain the selection state visually using the design-system primary border and primary tinted background as defined in `DESIGN.md`.
8. WHEN the Method Details panel renders a method's content, THE Frontend SHALL use a consistent section structure across methods: a method status row, any method-local error, any method-local warnings, then the method-specific content (basis polynomials and summation for Lagrange; coefficients, divided-difference table, and nested form for Newton; weights table for Barycentric; target results and triangular tables for Neville).
9. THE Frontend SHALL include a header-row label on the Newton divided-difference table with one column label per order (`f[xᵢ]`, `Δ¹`, `Δ²`, …) using the Label voice.
10. THE Frontend SHALL include a header-row label on each Neville table identifying the target x-value above the table using the body voice and rendering the x-value itself in the numeric voice.
11. THE Frontend SHALL include a header-row label on the Barycentric weights table with the columns `i`, `xᵢ`, `wᵢ` using the Label voice.

### Requirement 8: Pre-coding Deliverables in design.md

**User Story:** As a project owner, I want a written design audit and plan before any frontend code is changed, so that the team agrees on what the system says, what the UI currently violates, and what the implementation will do.

#### Acceptance Criteria

1. THE Frontend SHALL NOT have any file under `frontend/src/` modified, created, or deleted as part of this feature until all four Pre-coding Deliverables in `.kiro/specs/frontend-analysis-bench-overhaul/design.md` are complete and approved by the user.
2. WHILE the design phase is in progress, individual Pre-coding Deliverable sections in `design.md` MAY be authored, reviewed, and partially approved independently in any order, and partial review SHALL NOT alone unblock frontend code changes.
2. THE design.md SHALL include a section titled "PRODUCT.md Summary" that summarizes the user types, product purpose, brand personality, anti-references, design principles, and accessibility targets stated in `PRODUCT.md`.
3. THE design.md SHALL include a section titled "DESIGN.md and design.json Summary" that summarizes the named rules (Semantic Honesty, Tinted Neutral, Three-Voice, Numeric Respect, Flat-at-Rest, Inset Containment), the OKLCH palette, the typography voices, the elevation strategy, and the components defined in `DESIGN.md` and mirrored in `.impeccable/design.json`.
4. THE design.md SHALL include a section titled "UI Audit" that lists, for each frontend file under `frontend/src/components/` and for `frontend/src/App.tsx` and `frontend/src/index.css`, what currently follows the design system and what currently violates it, with a per-mode subsection covering Points mode, X + f(x) mode, and Interval mode, and with a per-component subsection for the points editor, the x-values editor, the function-interval editor, the method selector, the precision settings, the evaluation targets, the warnings display, the results panel tabs, the polynomial card, the method details, the graph card, the nodes table, the evaluation table, and the educational notes.
5. THE design.md SHALL include a section titled "Implementation Plan" that lists the ordered, scoped changes needed to bring the Frontend into alignment with the design system, with each item referencing the requirement clauses it satisfies.
6. THE design.md SHALL cite specific token names from `.impeccable/design.json` (such as `indigo-deep`, `slate-ink`, `surface-warm`, `surface-tinted`, `border-subtle`, `amber-caution`, `coral-error`, `cyan-data`) when referring to colors and SHALL cite the typography roles `display`, `body`, `label`, `numeric` when referring to text styling.
7. THE design.md SHALL NOT contain executable code changes; it contains analysis and plan only.

### Requirement 9: Post-implementation Verification Commands

**User Story:** As a project owner, I want a fixed list of verification commands run after the UI overhaul, so that I have a reproducible record of build, type, lint, and design-system compliance.

#### Acceptance Criteria

1. WHEN the implementation phase is complete, THE Frontend SHALL pass `tsc -b` executed with the working directory set to `frontend/` with zero TypeScript errors.
2. WHEN the implementation phase is complete, THE Frontend SHALL pass `npm run build` executed with the working directory set to `frontend/` with a successful exit code.
3. WHEN the implementation phase is complete, THE Frontend SHALL pass `npm run lint` executed with the working directory set to `frontend/` with zero ESLint errors; ESLint warnings are acceptable.
4. WHEN the implementation phase is complete, THE Frontend SHALL pass the impeccable detector invoked as `impeccable detect "C:\Users\Emmy Lou\Documents\New project 3"` with zero P0 findings and zero P1 findings.
5. WHEN any of the four verification commands fail, THE implementation phase SHALL be considered incomplete until the failures are resolved or documented as accepted with a recorded justification in `docs/HANDOFF.md`.

### Requirement 10: Live-Test Scenarios

**User Story:** As a project owner, I want a fixed list of live-test scenarios run against the running backend, so that I have human-verified evidence that the overhauled UI still renders backend results faithfully.

#### Acceptance Criteria

1. WHEN the backend is running and the implementation phase is complete, THE Frontend SHALL successfully load the points example with `(2, 4)` and `(5, 1)` and an evaluation target `x = 3`, and SHALL display the polynomial as `P(x) = 6 − x` and the evaluation as `P(3) = 3`.
2. WHEN the backend is running and the implementation phase is complete, THE Frontend SHALL successfully load the X + f(x) example with `f(x) = 1/x`, x-values `[2, 2.75, 4]`, and evaluation target `x = 3`, and SHALL display the evaluation `P(3) = 29/88` (approximately `0.32955`).
3. WHEN the backend response includes a non-empty `divided_difference_table` for Newton, THE Frontend SHALL render the table with a labelled header row and one row per node.
4. WHEN the backend response includes one or more Neville tables, THE Frontend SHALL render each table as a triangular table with a header identifying the target x-value.
5. WHEN the backend response includes barycentric weights, THE Frontend SHALL render the weights as a labelled table with columns `i`, `xᵢ`, `wᵢ` and one row per node.
6. WHEN the backend response includes warnings or errors, THE Frontend SHALL display them in the human-readable form prescribed by Requirement 6 and SHALL keep them visible without requiring user action to reveal.
7. WHEN the backend response includes `graph_data`, THE Frontend SHALL render the chart using only the arrays `graph_data.x`, `graph_data.f_x`, `graph_data.P_x`, `graph_data.error`, and the node coordinates, and SHALL NOT compute additional `P_x` or `f_x` samples in the client.

### Requirement 11: Handoff Documentation Update

**User Story:** As a coordinating maintainer, I want the handoff documents updated at the end of this feature, so that the next session has an accurate, dated record of what the UI overhaul did and what verification produced.

#### Acceptance Criteria

1. WHEN the implementation phase is complete, THE Frontend SHALL have a corresponding update committed to `docs/HANDOFF.md` containing a section that records this feature.
2. THE handoff entry in `docs/HANDOFF.md` SHALL include a "DESIGN.md Alignment Review Summary" subsection naming the design rules audited and the result of that audit.
3. THE handoff entry in `docs/HANDOFF.md` SHALL include a "What Changed" subsection listing each frontend file modified, created, or removed.
4. THE handoff entry in `docs/HANDOFF.md` SHALL include a "Commands Run" subsection listing each verification command from Requirement 9 with its working directory and exit result.
5. THE handoff entry in `docs/HANDOFF.md` SHALL include a "Live-Test Results" subsection listing each live-test scenario from Requirement 10 with a pass or fail outcome and any deviation noted.
6. THE handoff entry in `docs/HANDOFF.md` SHALL include a "Remaining Caveats" subsection listing any known limitations, deferred items, or accepted warnings.
7. WHEN frontend-relevant behavior changes (for example layout structure, error rendering, or method emphasis), THE Frontend SHALL have a matching update applied to `docs/FRONTEND_HANDOFF.md` reflecting the new behavior.
8. IF a verification command from Requirement 9 or a live-test scenario from Requirement 10 was not actually executed and observed in this feature's session, THEN the handoff updates SHALL NOT claim that the command or test passed.
