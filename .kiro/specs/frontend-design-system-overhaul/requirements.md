# Requirements Document

## Introduction

The Polynomial Interpolation frontend already builds, lints, type-checks, and passes its smoke tests on baseline commit `b7f7951`, and the prior spec `frontend-analysis-bench-overhaul` aligned the UI to "The Analysis Bench" design system documented in `PRODUCT.md`, `DESIGN.md`, and `.impeccable/design.json`. This spec is a focused polish pass on top of that baseline.

The goal is to take the frontend from "design-system aligned" to "premium, modern scientific workbench" feel, while preserving every aspect of backend authority: the JSON API contract, the endpoint paths, the request and response shapes, and the numerical engine. The frontend renders backend response fields only and never recomputes interpolation math on the client.

This is a polish pass, not a rewrite. The work is scoped to: visual hierarchy and spacing rhythm in the workbench surfaces, input ergonomics across all three input modes, results presentation (Overview, polynomial display with long-formula handling, evaluations, graph, per-method details), error and warning presentation hierarchy, responsiveness on mobile and tablet, keyboard usability, accessible labelling, color-contrast and severity-not-only-by-color, an explicit live visual check pass with a documented fallback, and hard verification commands plus repository hygiene checks. A final report is produced at the end describing what was done, what was verified, and what remains.

The deliverable is structured as a design phase that produces `design.md` for this spec, followed by a controlled, small-step implementation pass, followed by post-implementation verification (`npm run build`, `npm run lint`, `npm test` from `frontend/`, plus `git status --short` and a no-backend-files / no-generated-folders check), followed by a live visual check (or an explicit declaration that the live check could not be performed), followed by a handoff update.

## Glossary

- **Frontend**: The React application located under `frontend/` in this repository, including all files in `frontend/src/`. This spec only modifies files under `frontend/src/` and, where strictly necessary, configuration siblings such as `frontend/index.html`, `frontend/eslint.config.js`, `frontend/vite.config.ts`, or test setup; it does NOT modify any file under `backend/`.
- **Backend**: The FastAPI service located under `backend/`. It is read-only for this spec.
- **Backend API Contract**: The set of endpoint paths and request and response JSON shapes documented in `docs/API_CONTRACT.md`. The contract is fixed for this spec.
- **The Analysis Bench**: The design system named in `PRODUCT.md`, `DESIGN.md`, and `.impeccable/design.json`. The frontend is the implementation surface for this design system.
- **Workbench Surface**: The composed application shell containing the header, the input panel, the action bar, the results panel, and the footer; collectively the "premium, modern scientific workbench" aesthetic register.
- **Workbench Polish**: Visual and ergonomic refinement above the design-system-aligned baseline produced by the prior spec `frontend-analysis-bench-overhaul`. Polish refines spacing, rhythm, hierarchy, scanability, responsiveness, and copy without changing computational behavior, the API contract, or the design tokens themselves.
- **Implementation Files**: All files under `frontend/src/`, plus the strictly-necessary frontend configuration siblings listed under "Frontend"; this is the set of files where production code, styles, and assets live for this spec.
- **Reporting Files**: `docs/HANDOFF.md` and `docs/FRONTEND_HANDOFF.md`; these are documentation files updated for the Final Report and frontend handoff and are explicitly permitted to be modified by this spec even though they are not Implementation Files.
- **Input Mode**: One of three values selected via the input mode tabs: `points` (Points), `x_values_with_function` (X + f(x)), or `function_interval` (Interval).
- **Method**: One of the four interpolation methods returned by the backend: `lagrange`, `newton`, `barycentric`, `neville`.
- **Classroom-Facing Method**: Any of the construction methods presented as the lecture-aligned construction techniques: `lagrange`, `newton`, `neville`.
- **Evaluation Support Method**: `barycentric`, used as the stable numerical evaluator and as the source method for `graph_data`. It is presented as evaluation and graphing support, not as a primary classroom construction method.
- **Method Emphasis Rule**: The visual rule that the three Classroom-Facing Methods receive equal or greater visual weight than the Evaluation Support Method in the method selector and in the Method Details navigation, so that Barycentric does not visually dominate educational sections.
- **Math Input**: Any input field whose primary purpose is to accept a mathematical value or expression: x, y, x-values, evaluation targets, interval endpoints, node count, or function expressions.
- **Long Formula**: Any rendered polynomial form, basis polynomial, divided-difference cell, Neville cell, summation form, or Newton nested form whose rendered width at the current viewport exceeds the available content width of its container.
- **Backend Error Code**: The string in the `error.code` field of an error response (for example `too_few_nodes`, `unsafe_expression`, `duplicate_x`, `invalid_interval`, `function_domain_error`).
- **Backend Error Message**: The string in the `error.message` field of an error response, written in human-readable language.
- **Backend Warning Code**: The string in the `code` field of a warning entry as documented in `docs/API_CONTRACT.md` (for example `high_degree_warning`, `runge_warning`, `extrapolation_warning`, `close_x_warning`, `method_disagreement_warning`).
- **Severe Warning**: A warning whose semantic level is `error` (per the `lib/warnings.ts` catalog), or a per-method `error` field on a `partial`-status response. All other warnings are non-severe and use the warning or info presentation register.
- **Smoke Tests**: The Vitest suite that lives under `frontend/src/`, in particular `frontend/src/components/results/results.smoke.test.tsx`, plus any sibling test files added since baseline `b7f7951`.
- **Live Visual Check**: The act of running the Vite dev server, opening the application in a Chromium-based browser, and inspecting each input mode and the results surfaces at desktop and at a narrow viewport. Performed via a browser automation tool when available, or by the implementer manually otherwise.
- **Verification Commands**: The fixed list of post-implementation commands defined in Requirement 12.
- **Repository Hygiene Checks**: The fixed list of `git`-level checks defined in Requirement 13.
- **Final Report**: The post-implementation summary defined in Requirement 14.
- **Generated Folder**: Any of `node_modules/`, `dist/`, `coverage/`, `.vite/`, or any `*.tsbuildinfo` file produced by the toolchain.
- **Reduced-Motion Preference**: The user-agent setting `prefers-reduced-motion: reduce` exposed via CSS media query.

## Requirements

### Requirement 1: Backend Authority Preservation (Hard Rules)

**User Story:** As a backend owner, I want the polish pass to preserve every aspect of backend authority, so that the API contract, numerical engine, and interpolation logic remain the single source of truth.

#### Acceptance Criteria

1. THE Frontend SHALL NOT modify any file under `backend/` during this spec.
2. THE Frontend SHALL NOT change any endpoint path served by the Backend; the Frontend SHALL continue to call only `GET /health`, `POST /api/interpolate`, and `POST /api/validate-function`.
3. THE Frontend SHALL NOT change any request shape documented in `docs/API_CONTRACT.md`.
4. THE Frontend SHALL NOT change any response shape documented in `docs/API_CONTRACT.md`.
5. THE Frontend SHALL NOT implement, replace, override, or augment any interpolation algorithm in client code.
6. THE Frontend SHALL NOT recompute, resample, smooth, interpolate, or otherwise derive new numerical values from Backend numerical results, including but not limited to `P(x)` values, Lagrange basis polynomials, Newton divided-difference tables, Neville tables, barycentric weights, original-function values `f(x)`, graph samples, and absolute errors.
7. WHEN the Backend response contains polynomial values, evaluations, weights, divided-difference tables, Neville tables, basis polynomials, or graph data, THE Frontend SHALL render the values returned by the Backend, and SHALL render only the values returned by the Backend.
8. THE Frontend SHALL pass all numeric user input to the Backend as strings, consistent with `docs/API_CONTRACT.md`.
9. THE Frontend SHALL NOT add any new interpolation method to the method selector, to the request payload, to the result rendering, or to the design system; only `lagrange`, `newton`, `barycentric`, and `neville` are presented.
10. THE Frontend SHALL NOT add any new product feature outside the scope of "Workbench Polish" defined in the Glossary, except where a small, named addition is strictly necessary for UI clarity (for example, an existing-style label, an accessibility hint, or a viewport-width helper) and is justified in `design.md` for this spec.
11. WHILE this spec is being implemented, THE implementation SHALL only modify Implementation Files (frontend code under `frontend/src/` plus the strictly-necessary frontend configuration siblings named in the Glossary) and Reporting Files (`docs/HANDOFF.md`, `docs/FRONTEND_HANDOFF.md`); modification of Reporting Files is permitted exclusively for Final Report and handoff updates per Requirements 11, 12, 13, and 14, and is not a backend or contract change.

### Requirement 2: Premium Workbench Visual Register

**User Story:** As a numerical-analysis student or instructor, I want the application to read as a premium, modern scientific workbench, so that the surface inspires the same trust as a serious technical instrument and not a generic SaaS dashboard.

#### Acceptance Criteria

1. THE Frontend SHALL preserve the design tokens, the typography voices, the elevation strategy, the badge taxonomy, and the named rules defined in `DESIGN.md` and mirrored in `.impeccable/design.json`; this spec does not change tokens.
2. THE Frontend SHALL NOT introduce a new color palette, a new font family or font system, a new shadow or elevation system, a new spacing scale, a new radius scale, a new motion-easing or motion-duration token, or any other design-token rewrite; only the existing tokens published in `DESIGN.md` and `.impeccable/design.json` are permitted, and edits to those two files are out of scope for this spec.
3. THE Workbench Surface SHALL apply a deliberate vertical rhythm using the spacing scale defined in `DESIGN.md` (`xs` 4px, `sm` 8px, `md` 16px, `lg` 20px, `xl` 24px, section 32px), with adjacent sections separated by at least the `lg` step at viewport widths of 768px and above.
4. THE Workbench Surface SHALL group related controls and outputs so that each card has a single, clearly stated purpose visible in its section header and SHALL NOT pack unrelated controls into one card.
5. THE Workbench Surface SHALL NOT introduce new gradient text, decorative backdrop-blur, frosted-glass effects, bounce or elastic easing, side-stripe accents above 1px, hero-metric templates, or "AI app" gradients.
6. THE Workbench Surface SHALL NOT introduce nested cards; structure inside a card SHALL use tonal layering (`bg-muted/30`), separators, and section headers as already established by the prior spec.
7. THE Workbench Surface SHALL render the application identity mark in the serif display voice and SHALL render every numeric value (table cell, coordinate, weight, coefficient, chart tick) in the JetBrains Mono numeric voice with `font-variant-numeric: tabular-nums`, consistent with the Three-Voice Rule and the Numeric Respect Rule in `DESIGN.md`.
8. THE Workbench Surface SHALL NOT use childish, saturated decorative color or excessive ornamentation; semantic color (indigo for interactive, amber for caution, coral for error, cyan for informational, success-green for positive system status) SHALL retain the meanings established in `DESIGN.md` and SHALL NOT be repurposed for decoration.
9. WHEN the user has set Reduced-Motion Preference, THE Workbench Surface SHALL disable non-essential animations, consistent with `index.css`.

### Requirement 3: Points Mode Input Polish

**User Story:** As a user entering data points, I want the Points mode to feel spacious and scannable, so that I can read existing rows quickly and add or remove rows without the layout flickering.

#### Acceptance Criteria

1. WHEN the Input Mode is `points`, THE Frontend SHALL render the points editor as a labelled grid containing an index column, an x-input column, a y-input column, and a remove-action column, in that order.
2. WHEN the Input Mode is `points` and the editor renders 2 to 25 rows, THE Frontend SHALL fill the available width of the input card content area at viewport widths of 768px and above.
3. THE Frontend SHALL render every Math Input value in the points editor in the JetBrains Mono numeric voice with `tabular-nums`, with an input height of at least 32px and a horizontal column gap of at least the design-system `sm` (8px) between the x-input and the y-input cells.
4. WHEN the points editor renders 2 to 25 rows at viewport widths of 768px and above, THE Frontend SHALL provide a vertical row gap of at least the design-system `xs` (4px) between successive rows, with a target value of `sm` (8px).
5. WHILE the user adds a row, removes a row, performs a sequence of add and remove operations, types into an existing field, or initially renders the editor, THE Frontend SHALL preserve the layout width of the points editor without horizontal layout collapse.
6. THE Frontend SHALL render the index column header `i`, the x-input header (containing `x` followed by an `<sub aria-hidden="true">i</sub>`), and the y-input header (containing `y` followed by an `<sub aria-hidden="true">i</sub>`) using the design-system Label voice, and SHALL provide accessible label text on each header that does not depend on the visual subscript.
7. THE Frontend SHALL render the helper text describing the at-least-2-distinct-points constraint in the body sans voice and SHALL NOT use the numeric voice for this helper.

### Requirement 4: X + f(x) Mode Input Polish

**User Story:** As a user entering a function and a list of x-values, I want the X + f(x) mode to feel structured and full-width, so that the function expression and the x-value list are no longer cramped or visually broken.

#### Acceptance Criteria

1. WHILE the Input Mode is `x_values_with_function`, THE Frontend SHALL render the function expression input filling 100% of the input card content area's available horizontal width, with no applied maximum-width constraint smaller than the input card content area width.
2. WHILE the Input Mode is `x_values_with_function` and the viewport width is 768px or greater, THE Frontend SHALL render the x-values list using a layout that fills 100% of the available horizontal width of the input card content area.
3. WHILE the Input Mode is `x_values_with_function` and the viewport width is 768px or greater, THE Frontend SHALL render each x-value row with a numeric monospace input that is at least 160px wide.
4. WHILE the Input Mode is `x_values_with_function` and the viewport width is below 768px, THE Frontend SHALL render the x-values list as a single-column stack with each numeric monospace input filling 100% of the input card content area's available horizontal width.
5. WHEN inline function validation succeeds for the function expression, THE Frontend SHALL display a success indicator within the function input's row, using the design-system primary or info color paired with both a recognizable icon and a text label that is exposed to assistive technologies, consistent with Requirement 8.
6. IF inline function validation fails for the function expression, THEN THE Frontend SHALL display the failure inline directly beneath the function input, using the design-system destructive notice pattern with the human-readable Backend Error Message as primary content and the Backend Error Code as secondary content, consistent with Requirement 8.
7. WHILE the Input Mode is `x_values_with_function`, WHEN the user adds, removes, or edits any x-value row, THE Frontend SHALL preserve the rendered horizontal width of the input column such that its width does not change as a result of the row mutation.
8. WHILE the Input Mode is `x_values_with_function`, THE Frontend SHALL render every Math Input in the X + f(x) editor using the JetBrains Mono font; the function expression input is a Math Input that may contain non-numeric tokens (operators, parentheses, function names, identifiers) and SHALL use JetBrains Mono without requiring `tabular-nums`, while every numeric Math Input (each x-value row input) SHALL additionally enable the `tabular-nums` typographic feature.

### Requirement 5: Function Interval Mode Input Polish

**User Story:** As a user entering a function, an interval, and a node strategy, I want the Interval mode to feel structured and full-width, so that the four-field layout (function, [a, b], strategy, count) is legible and not cramped.

#### Acceptance Criteria

1. WHEN the Input Mode is `function_interval`, THE Frontend SHALL render the function expression input across the full width of the input card content area.
2. WHEN the Input Mode is `function_interval` and the viewport width is 768px or above, THE Frontend SHALL render the interval start input and the interval end input as a two-column row that occupies the full content width.
3. WHEN the Input Mode is `function_interval` and the viewport width is 768px or above, THE Frontend SHALL render the node strategy selector and the node count input as a row that occupies the full content width with a balanced ratio (the strategy selector wider than the count field).
4. WHEN the Input Mode is `function_interval` and the viewport width is below 768px, THE Frontend SHALL stack the interval endpoints, the node strategy, and the node count vertically without horizontal overflow.
5. THE Frontend SHALL display the interval inputs with explicit field labels containing the mathematical notation `a` and `b`, set in the design-system Label voice, with the `a` and `b` symbols themselves rendered in the numeric voice.
6. THE Frontend SHALL display the node strategy options using the human-readable labels "Equally Spaced", "Chebyshev Nodes", and "Custom Nodes" with the corresponding API values `equally_spaced`, `chebyshev_nodes`, and `custom_nodes`.
7. IF the node count input has a value below 2 or above 50, THEN THE Frontend SHALL show the constraint inline using the design-system destructive notice pattern with the severity word in the Label voice, and SHALL prevent submission while the inline notice is displayed.
8. THE Frontend SHALL render every numeric value in this mode (interval endpoints, node count, generated nodes when displayed) using the JetBrains Mono numeric voice with `tabular-nums`.

### Requirement 6: Method Emphasis (Classroom vs Evaluation Support)

**User Story:** As a learner studying interpolation, I want Lagrange, Newton, and Neville presented as the classroom-facing construction methods and Barycentric presented as the stable evaluator, so that the educational surfaces lead with the construction methods and Barycentric supports rather than dominates.

#### Acceptance Criteria

1. THE Frontend SHALL render the Lagrange, Newton, Barycentric, and Neville method selector cards at identical width, height, padding, corner radius, border weight, typography scale, and z-order, with no card's background saturation exceeding the design-system tinted-badge variant ceiling defined in criterion 6, except for the role-tag tint described in criterion 3.
2. THE Frontend SHALL render the four method cards in the order Lagrange, Newton, Barycentric, Neville in the method selector and SHALL render the four method tabs in the same order in the Method Details panel.
3. THE Frontend SHALL render a role tag on each method selector card and on each Method Details tab using exactly the role labels: "Construction" for Lagrange, "Construction" for Newton, "Stable Evaluator" for Barycentric, "Target-Specific" for Neville.
4. THE Frontend SHALL render each role tag using the design-system Label voice and SHALL NOT, for the Barycentric card or tab relative to the Classroom-Facing Methods (defined as Lagrange, Newton, and Neville), apply a larger scale, heavier border weight, heavier typography weight, higher background saturation, or selection-driven reordering.
5. THE Frontend SHALL render each method's one-sentence description on its selector card using the language: Lagrange shows basis polynomials and summation form, Newton shows divided-difference tables and nested form, Barycentric provides stable evaluation and is used as the source for graph data, Neville produces target-specific triangular tables.
6. THE Frontend SHALL render any method-role color accent (Barycentric primary tint, Neville info-cyan tint) at a saturation no higher than the design-system tinted-badge variants, so that role color is recognized but not dominant in classroom-facing sections.
7. THE Frontend SHALL NOT introduce new copy that frames Barycentric as the primary construction method or that demotes Lagrange, Newton, or Neville from their construction-method role.
8. WHEN the user opens the Method Details panel without an explicit selection, THE Frontend SHALL default to the first available Classroom-Facing Method tab evaluated in the order Lagrange, then Newton, then Neville, and SHALL NOT default to Barycentric while any Classroom-Facing Method tab is available.

### Requirement 7: Results Surface Polish (Overview, Polynomial, Evaluations, Graph)

**User Story:** As a user reading interpolation results, I want the Overview, Polynomial, Evaluations, and Graph surfaces to feel polished, scannable, and predictable, so that I can locate the polynomial, the evaluation at my target x, the graph, and the warnings without hunting.

#### Acceptance Criteria

1. THE Frontend SHALL render the Overview surface with a single SummaryCard whose four labelled cells (Degree, Nodes, Compute Precision, Mode) use the Label voice for the headers and the numeric voice for the values, plus the status chip mapping (`ok` reads success, `partial` reads warning, error reads destructive) defined in `DESIGN.md`.
2. THE Frontend SHALL render the Overview surface with the NodesTable, with table headers in the Label voice, table cells in the numeric voice with `tabular-nums`, and the table wrapped in a horizontally scrolling container so long rationals do not wrap rows.
3. THE Frontend SHALL render the polynomial display so that any Long Formula wraps gracefully without horizontal page scroll on the Workbench Surface; either the formula container scrolls horizontally inside its card, the LaTeX renders with line breaks, or the rendered formula scales to fit, but the page itself SHALL NOT acquire a horizontal scroll bar at viewport widths of 320px and above.
4. THE Frontend SHALL render the Polynomial surface with the four polynomial forms (expanded, factored, Lagrange form, Newton form) navigable as already established and SHALL render every numeric literal in the numeric voice via the existing display-precision-aware formatter, without recomputing any coefficient.
5. THE Frontend SHALL render the Evaluations surface as a table where each row corresponds to a target x-value and each column corresponds to either the Best `P(x)`, the per-method `P(x)`, the original `f(x)` when known, or the absolute error when known, with all cells in the numeric voice with `tabular-nums` and missing cells rendered as the centered muted-dot placeholder paired with `aria-label="not available"`.
6. THE Frontend SHALL render the Graph surface using only the arrays `graph_data.x`, `graph_data.f_x`, `graph_data.P_x`, `graph_data.error`, and the node coordinates, and SHALL NOT compute additional `P_x` or `f_x` samples in the client.
7. THE Frontend SHALL pair the Graph surface with a visible legend identifying each plotted series, an accessible name on the chart region, and Recharts axis ticks rendered in the canonical numeric font fallback chain.
8. THE Frontend SHALL NOT collapse, hide, or remove the Overview SummaryCard, the NodesTable, the polynomial forms, the evaluations table, the graph, or any backend warning to make the page visually cleaner.

### Requirement 8: Error and Warning Presentation Hierarchy

**User Story:** As a user encountering a Backend validation failure or a numerical warning, I want the human-readable explanation to lead and the technical code to support, so that I can understand what went wrong without first decoding a code string and without losing the technical detail entirely.

#### Acceptance Criteria

1. WHEN the Backend returns an error response with both `code` and `message`, THE Frontend SHALL render the human-readable Backend Error Message as the primary content of the error display, using the design-system error title typography.
2. WHEN the Backend returns an error response with both `code` and `message`, THE Frontend SHALL render the Backend Error Code as secondary content, smaller in size and lower in visual weight than the message, set in the JetBrains Mono numeric voice and prefixed with the label `Code:`.
3. THE Frontend SHALL NOT hide, collapse by default, or remove the Backend Error Code from the error display.
4. WHEN the Frontend recognizes the Backend Error Code as one of `too_few_nodes`, `duplicate_x`, `unsafe_expression`, `function_domain_error`, `invalid_interval`, or `no_methods_selected`, THE Frontend SHALL render an additional sentence of recovery guidance taken from a frontend-maintained code-to-guidance map, consistent with the existing `ErrorNotice` behavior; the implementation SHALL verify each code key in the code-to-guidance map against `docs/API_CONTRACT.md` or the frontend's API type definitions before adding or modifying it, and SHALL NOT introduce a guidance entry for any code that does not appear in either source.
5. WHEN the Backend Error Code is `unsafe_expression` or `function_domain_error` AND a function input is currently mounted, THE Frontend SHALL display the error inline beneath the function input rather than as a top-level banner.
6. IF inline rendering of an `unsafe_expression` or `function_domain_error` cannot be performed because no function input is currently mounted, THEN THE Frontend SHALL fall back to the top-level banner display using the same primary-message-secondary-code hierarchy.
7. WHEN the Backend returns a warning with a `code` value listed in `docs/API_CONTRACT.md`, THE Frontend SHALL render a human-readable label (such as "High Degree", "Runge Phenomenon", "Close X-Values", "Extrapolation", "Method Disagreement", "Polynomial Omitted", "Neville Info", "Graph Domain Error", "Method Failed", "Nodes Reordered") as the primary header of the notice, with the message as the body content, sourced from the existing warnings catalog.
8. THE Frontend SHALL render every error and warning notice using the Inset Containment Rule (`ring-1 ring-inset`) with the semantic color matching its severity (amber for warning, coral for error, cyan for info, success-green never used for warnings) and SHALL pair the notice with both an icon and a text severity word so severity is not communicated by color alone.
9. THE Frontend SHALL render Severe Warnings with the destructive register and SHALL render non-severe warnings with the warning or info register, so that a Severe Warning visually reads more urgent than a non-severe warning without making non-severe warnings feel alarming.
10. WHEN the response status is `partial`, THE Frontend SHALL render successful method outputs and SHALL display each per-method error within that method's section using the same primary-message-secondary-code hierarchy as top-level errors.
11. WHEN no human-readable message is available from the Backend, THE Frontend SHALL display the Backend Error Code as the primary content and SHALL annotate the display with a generic "Backend did not provide a description" body sentence rather than displaying the code with no explanation.
12. THE Frontend SHALL NOT hide any Backend warning to make the page visually cleaner; warnings SHALL remain visible without requiring the user to click, expand, or change tabs to reveal them.

### Requirement 9: Responsiveness, Mobile, and Tablet Layout

**User Story:** As a user on a laptop, a tablet, or a phone, I want the workbench to remain usable and readable across viewport sizes, so that I can enter data, read results, and inspect the graph on whichever device I have at hand.

#### Acceptance Criteria

1. WHEN the viewport width is 1024px or above, THE Workbench Surface SHALL present the input panel and the results panel in a layout that uses the available horizontal width without forcing the user to scroll horizontally to read primary content.
2. WHEN the viewport width is between 768px and 1023px, THE Workbench Surface SHALL present input controls and results in a layout that fits the viewport without forcing the user to scroll horizontally to read primary content.
3. WHEN the viewport width is between 320px and 767px, THE Workbench Surface SHALL stack input controls vertically, SHALL stack results sections vertically, and SHALL NOT force the user to scroll horizontally on the Workbench Surface itself; horizontal scrolling within a constrained container (a wide table, a Long Formula container, the chart) is permitted.
4. WHEN the viewport width is between 320px and 767px, THE Frontend SHALL render the Polynomial surface, the Evaluations table, the Graph surface, and the Method Details panel without truncating values, without overlapping controls, and without losing the Label or numeric voice.
5. WHEN the viewport width is between 320px and 767px, THE Frontend SHALL keep all backend warnings visible in their existing presentation register without collapsing them behind a tap target.
6. WHEN the viewport width is between 320px and 767px, THE Method Details navigation SHALL remain reachable, with the four method tabs scrollable horizontally inside their container if necessary, and SHALL preserve the Method Emphasis Rule from Requirement 6.

### Requirement 10: Accessibility, Keyboard Usability, and Labelling

**User Story:** As a user relying on the keyboard, a screen reader, or a high-contrast environment, I want every interactive element to be reachable and announced clearly, so that the workbench is usable beyond mouse-only, sighted, full-color contexts.

#### Acceptance Criteria

1. THE Frontend SHALL provide a visible focus ring on every interactive element using a width between 2px and 4px and the `ring/50` opacity prescribed by `DESIGN.md`, with a target value of 3px.
2. THE Frontend SHALL ensure every button, input, select, switch, tab, table header, and chart region has either a visible label or an `aria-label` (or equivalent accessible name) that describes its purpose.
3. THE Frontend SHALL NOT communicate severity, status, or selection state by color alone; every status indicator SHALL be paired with at least one of an icon, a text label, or a textual severity word.
4. THE Frontend SHALL maintain text and interactive-element color contrast at the WCAG AA threshold of 4.5:1 for normal-size text and 3:1 for large-size text, using the existing OKLCH tokens; this spec does not change tokens but verifies pairings remain compliant after polish.
5. THE Frontend SHALL preserve and not regress the existing keyboard shortcuts (`Ctrl/Cmd+Enter` Compute, `Alt+R` Reset, `?` toggle help) and SHALL preserve the existing `aria-keyshortcuts` annotations on the Compute and Reset controls.
6. THE Frontend SHALL preserve and not regress the existing screen-reader treatment of KaTeX output, where the rendered KaTeX is `aria-hidden` and an adjacent `sr-only` plain-text label carries the formula content, including the rounded plain-text expression already produced by the display-precision pipeline.
7. THE Frontend SHALL preserve and not regress the existing `aria-label` and `aria-hidden` patterns on Math Input subscripts and on numeric table headers (`x`, `y`, `xᵢ`, `yᵢ`, `wᵢ`, `f[xᵢ]`, `Δᵏ`, `P[k]`).
8. THE Frontend SHALL preserve and not regress the existing `prefers-reduced-motion: reduce` handling that disables `.transition-subtle` and `.animate-in-results`.
9. WHEN keyboard focus is on the Method Details navigation, THE Frontend SHALL allow the user to move between method tabs using the arrow keys, with a visible focus indicator on the active tab.
10. THE Frontend SHALL preserve the labelled-grid pattern in the Points and X-Values editors so that screen readers announce the index, x-input, and y-input columns clearly without depending on visual subscripts.

### Requirement 11: Live Visual Check (with Documented Fallback)

**User Story:** As a project owner, I want the polish pass verified by a real visual check in a browser, so that the "premium workbench" claim is supported by direct observation; if a live check cannot be performed, I want that limitation stated explicitly rather than silently skipped.

#### Acceptance Criteria

1. WHEN the implementation phase is complete, THE Frontend SHALL be subjected to a Live Visual Check that covers, at minimum, the following scenarios: Points mode at desktop and at narrow viewport, X + f(x) mode at desktop and at narrow viewport, Function Interval mode at desktop and at narrow viewport, the results surfaces (Overview, Polynomial, Evaluations, Graph, Method Details for all four methods, Notes) with at least one Backend response, and an error state surfaced through the canonical error hierarchy.
2. WHILE conducting the Live Visual Check, THE implementation SHALL run the Vite dev server with the Backend reachable at the documented dev address, OR SHALL run the production build via `npm run preview` against a reachable Backend; either is acceptable.
3. WHEN the Live Visual Check has been performed via a browser automation tool (such as the Chrome DevTools MCP), THE Final Report SHALL state which tool was used and SHALL list each scenario from clause 1 with a pass-or-fail outcome; captured screenshots are preferred but optional, and the Final Report SHALL reference any screenshots that were captured (saved under `.kiro/specs/frontend-design-system-overhaul/screenshots/` or under `.impeccable/critique/screens/`) without requiring a screenshot per scenario.
4. WHEN the Live Visual Check has been performed manually (without a browser automation tool), THE Final Report SHALL state that the check was performed manually, list each scenario from clause 1 with a pass-or-fail outcome, and SHALL note any deviation from the canonical scenario list.
5. IF the Live Visual Check cannot be performed because the dev server cannot be started in the working environment, the Backend cannot be reached, or no browser is available, THEN THE Final Report SHALL state explicitly that live browser inspection was not performed, SHALL state the reason, and SHALL identify which scenarios were therefore unverified.
6. WHEN the Live Visual Check is performed, THE check SHALL include a page-level horizontal-scroll inspection at a viewport width of 320px (or the narrowest viewport the tool supports at or above 320px) for the following surfaces: Points mode, X + f(x) mode, Function Interval mode, the Polynomial surface, the Evaluations table, the Graph surface, and the Method Details panel; a surface SHALL pass this check only when the document scrolling element does not exhibit horizontal overflow at that viewport, and the Final Report SHALL record the page-level horizontal-scroll outcome per surface.
7. THE Final Report SHALL NOT claim that the Live Visual Check passed if the check was not actually performed and observed in this spec's session.

### Requirement 12: Post-Implementation Verification Commands

**User Story:** As a project owner, I want a fixed list of verification commands run after the polish pass, so that I have a reproducible record of build, lint, and test results and so that the existing smoke coverage cannot silently regress.

#### Acceptance Criteria

1. WHEN the implementation phase is complete, THE Frontend SHALL pass `npm run build` executed with the working directory set to `frontend/` with a successful exit code; this script transitively runs `tsc -b` and `vite build` as defined in `frontend/package.json`.
2. WHEN the implementation phase is complete, THE Frontend SHALL pass `npm run lint` executed with the working directory set to `frontend/` with zero ESLint errors; pre-existing `react-refresh/only-export-components` warnings on shadcn primitive files are accepted.
3. WHEN the implementation phase is complete, THE Frontend SHALL pass `npm test` executed with the working directory set to `frontend/` with a successful exit code, including the Smoke Tests in `frontend/src/components/results/results.smoke.test.tsx` and any sibling test files added since baseline `b7f7951`.
4. THE Smoke Tests SHALL continue to assert backend-rendering correctness (linear points example polynomial and `P(3)`, the f(x)=1/x evaluation `29/88`, Lagrange basis from the `basis` field, Newton divided differences, Neville triangular tables, barycentric weights, and Graph rendering from backend `graph_data`) and SHALL NOT be relaxed, skipped, or removed to make this spec pass.
5. IF a Verification Command from clauses 1, 2, or 3 fails, THEN the implementation phase SHALL be considered incomplete until the failures are resolved or documented as accepted with a recorded justification in the Final Report and in `docs/HANDOFF.md`.
6. THE Final Report SHALL list each Verification Command with its working directory and exit result.

### Requirement 13: Repository Hygiene Checks

**User Story:** As a project owner, I want repository hygiene verified after the polish pass, so that the change set is unambiguously frontend-only and so that no generated folder is accidentally staged or committed.

#### Acceptance Criteria

1. WHEN the implementation phase is complete, THE implementation SHALL run `git status --short` from the repository root and SHALL include the output in the Final Report.
2. THE `git status --short` output SHALL NOT show any modified, added, deleted, or renamed file under `backend/`; if such a path appears, the implementation phase SHALL be considered incomplete until the path is reverted or the change is reclassified into a separate, explicitly approved spec.
3. THE `git status --short` output SHALL NOT show any staged or modified entry inside a Generated Folder (`node_modules/`, `dist/`, `coverage/`, `.vite/`, or any `*.tsbuildinfo`); if such a path appears, the implementation phase SHALL be considered incomplete until the path is unstaged, reverted, or added to `.gitignore`.
4. THE implementation SHALL NOT commit any Vite build output (the contents of `frontend/dist/`, the contents of any `.vite/` cache directory, or any `*.tsbuildinfo` file) and SHALL NOT commit any test coverage output (the contents of `frontend/coverage/` or any equivalent coverage report directory); these artifacts are produced locally for verification and SHALL remain ignored by `.gitignore`.
5. THE Frontend SHALL NOT modify `.gitignore` to suppress evidence of a Generated Folder being tracked; gitignore changes are permitted only to formally exclude a Generated Folder that was previously not ignored, and any such change SHALL be called out in the Final Report.
6. THE Final Report SHALL state, in plain language, that no file under `backend/` was modified during this spec and that no Generated Folder is staged.

### Requirement 14: Final Report

**User Story:** As a project owner, I want a single Final Report at the end of the polish pass, so that I have an auditable, dated summary of what was planned, what was changed, what was verified, what was visually checked, and what is left.

#### Acceptance Criteria

1. WHEN the implementation phase is complete, THE Frontend SHALL produce a Final Report that records the polish pass; the Final Report SHALL be written into `docs/HANDOFF.md` as a new dated session entry, and SHALL be reflected in `docs/FRONTEND_HANDOFF.md` whenever frontend-relevant behavior changes.
2. THE Final Report SHALL include a "Plan Followed" subsection that summarizes the implementation plan from `design.md` for this spec and notes any deviation from the plan.
3. THE Final Report SHALL include a "Files Changed" subsection that lists every Implementation File modified, created, or removed under `frontend/src/`, grouped by directory, and SHALL list any Reporting File update (`docs/HANDOFF.md`, `docs/FRONTEND_HANDOFF.md`) separately under a "Reporting Files Updated" line within the same subsection.
4. THE Final Report SHALL include a "UI Areas Improved" subsection that describes, in plain language, what changed in the workbench surface, the input modes, the results surfaces, the error and warning hierarchy, and the responsiveness behavior.
5. THE Final Report SHALL include an "API Contract Preservation" subsection that confirms no endpoint path, request shape, or response shape was changed, and confirms no interpolation math was added to or moved into client code.
6. THE Final Report SHALL include a "No Backend Files Changed" subsection that confirms the Repository Hygiene Checks from Requirement 13 passed.
7. THE Final Report SHALL include a "Verification Results" subsection that lists each command from Requirement 12 with its working directory and exit result, and lists the `git status --short` output snapshot from Requirement 13.
8. THE Final Report SHALL include a "Live Visual Check Result" subsection that follows Requirement 11; if the check was performed, the subsection lists each scenario with a pass-or-fail outcome and references any screenshots; if the check was not performed, the subsection states so explicitly and identifies the unverified scenarios.
9. THE Final Report SHALL include a "Remaining UI Issues and Risks" subsection that lists any known limitation, deferred item, or accepted warning.
10. THE Final Report SHALL include a "Recommended Next Step" subsection that names the next reasonable action (for example, code-splitting the bundle, adding a dark-mode visual pass, or extending Method Details copy).
11. IF a Verification Command from Requirement 12 or a scenario from Requirement 11 was not actually executed and observed in this spec's session, THEN the Final Report SHALL NOT claim that the command or scenario passed.
