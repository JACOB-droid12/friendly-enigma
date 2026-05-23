---
target: frontend (technical audit)
total_score: 16
p0_count: 0
p1_count: 3
p2_count: 7
p3_count: 6
timestamp: 2026-05-23T13-15-00Z
slug: frontend-audit
---

# Audit Health Score

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 3 | Tabpanel `aria-labelledby` points to a missing id; shortcuts dialog has no focus trap or Esc-to-close; custom `role="tab"` and `role="radio"` groups have no arrow-key navigation. |
| 2 | Performance | 3 | Single ~290 kB gzipped bundle, recharts + katex eagerly loaded, no route or lazy splits. |
| 3 | Theming | 3 | Tokens used everywhere except `GraphCard.tsx` where 5 OKLCH colors are hardcoded and do not flip in dark mode. |
| 4 | Responsive Design | 3 | EvaluationTargets remove button is 20x20 (below WCAG 2.2 AA target size 24x24); X-value input has a 160 px floor that can overflow on narrow viewports. |
| 5 | Anti-Patterns | 4 | No AI tells. Indigo-Slate "Analysis Bench" register is intentional and distinctive. |
| **Total** | | **16/20** | **Good** |

## Anti-Patterns Verdict

**Pass.** No side-stripe borders. No `bg-clip-text`/gradient text. No glassmorphism (the sticky tab nav uses an opaque `bg-background`, with a comment locking that contract). No `#000`/`#fff`. Every neutral is tinted toward hue 250. No hero-metric template (the result summary is a 4-cell labeled grid, not "big number + small label + supporting stats"). No identical card grids (Overview, Polynomial, Evaluations, Methods, Graph, Notes each have distinct internal structure). No bounce/elastic easing. Three-voice typography (Iowan / IBM Plex / JetBrains Mono) is enforced via `.font-math`, `.font-numeric`, `.font-label` handles and used consistently. The Semantic Honesty Rule is honored after the previous critique pass added a dedicated `--success` token to `HealthIndicator`.

The one borderline pattern is the **shortcuts overlay** in `App.tsx` (`role="dialog" aria-modal="true"`). DESIGN.md flags "modal as first thought" as banned. A keyboard shortcut cheat sheet is a defensible modal use, but the implementation doesn't deliver on the contract it claims (focus management, Esc, focus return). Either keep the modal and finish it, or downgrade to a popover anchored to the Shortcuts button. See P1-A11Y-1.

## Executive Summary

- Audit Health Score: **16/20** (Good)
- Issue counts: **P0 = 0, P1 = 3, P2 = 7, P3 = 6**
- Anti-pattern verdict: **Pass.** No AI slop, distinctive register.
- Top issues:
  1. Graph colors hardcoded as light-mode OKLCH literals; the chart stays bright when the rest of the page is dark.
  2. Shortcuts overlay claims `aria-modal="true"` but never moves focus, traps focus, or closes on Esc.
  3. Tab panel `aria-labelledby` points to non-existent ids; the AT-announced relationship is broken.
  4. Disabled `title` attribute is the only signal explaining why Compute is dimmed.
  5. Single 290 kB gzipped bundle, no code splitting for recharts or katex.

## Detailed Findings by Severity

### P1 (Major: fix before release)

**[P1-A11Y-1] Shortcuts dialog has no focus management or Esc handling.**
- **Location:** `frontend/src/App.tsx`, `ShortcutsPopover` (lines 408-437).
- **Category:** Accessibility.
- **Impact:** When the dialog opens, focus stays on the Shortcuts button in the header. Tab moves through the page underneath the overlay (the backdrop is a focusable `<button>` covering the screen, but the overlay content is reachable only by tabbing past every element under it). Esc does not close. Closing does not return focus to the trigger. Keyboard and screen-reader users cannot operate this surface as a dialog.
- **WCAG:** 2.1.2 No Keyboard Trap (inverse: a real dialog must trap focus while open), 2.4.3 Focus Order, 2.4.7 Focus Visible.
- **Recommendation:** Either (a) keep the modal contract and use `<base-ui/react/dialog>` (which the project already depends on via `@base-ui/react`) so focus management, Esc, and focus return are automatic; or (b) replace it with a popover anchored to the Shortcuts button (no `aria-modal`, no overlay).
- **Suggested command:** `/impeccable harden`

**[P1-THEME-1] Graph colors hardcoded as light-mode OKLCH literals; do not adapt to dark mode.**
- **Location:** `frontend/src/components/results/GraphCard.tsx` lines 154, 165, 174, 179, 211 (5 hardcoded `oklch(...)` strings).
- **Category:** Theming.
- **Impact:** When the user switches to dark mode, the page surfaces invert but the graph keeps light-mode strokes (`oklch(0.55 0.15 260)` for f(x), `oklch(0.65 0.18 45)` for P(x), `oklch(0.55 0.2 25)` for nodes/error, `oklch(0.4 0.12 260)` and `oklch(0.96 0.008 250)` for the brush). The brush fill in particular (`oklch(0.96 0.008 250)`) is a near-white panel that stays bright on the dark canvas. DESIGN.md's "Tinted Neutral Rule" plus the dark-mode token contract are bypassed for the most data-dense surface in the app.
- **WCAG:** 1.4.11 Non-text Contrast (data-encoding lines must remain perceivable across themes).
- **Recommendation:** Read tokens via `getComputedStyle(document.documentElement).getPropertyValue('--primary')` once per render, or expose explicit graph tokens (`--graph-fx`, `--graph-px`, `--graph-node`, `--graph-error`, `--graph-brush-stroke`, `--graph-brush-fill`) in `index.css` with both light and dark values, and reference them through CSS custom properties in the component. Recharts accepts arbitrary stroke strings, so `var(--graph-fx)` works directly.
- **Suggested command:** `/impeccable colorize` (then `/impeccable harden` to also handle the brush track).

**[P1-A11Y-2] `role="tabpanel"` and `role="tab"` not wired together.**
- **Location:** `frontend/src/components/ResultsPanel.tsx` lines 73-95 (tab buttons) and line 108 (panel).
- **Category:** Accessibility.
- **Impact:** The panel uses `aria-labelledby={activeTab}`, where `activeTab` is a string like `"overview"`. The tab buttons have `key={tab.id}` but no `id={tab.id}` attribute. Screen readers cannot announce "Overview tabpanel labeled by Overview tab" because the labelledby reference is dangling. Additionally, the buttons declare `role="tab"` but the keyboard interaction model for a tablist (Left/Right arrow keys to move between tabs, Home/End to jump) is not implemented; only mouse click switches tabs.
- **WCAG:** 4.1.2 Name, Role, Value (the labelledby relationship is invalid); ARIA Authoring Practices "Tabs" pattern (arrow-key navigation expected).
- **Recommendation:** Add `id={`results-tab-${tab.id}`}` to each tab button, change `aria-labelledby` to match, and add a `keydown` handler on the tablist container that moves focus + selection between tab buttons on Left/Right/Home/End. Or, simpler, replace the bespoke tab implementation in `ResultsPanel.tsx` with the existing `Tabs`/`TabsList`/`TabsTrigger` primitives from `components/ui/tabs.tsx` (already used elsewhere in the app), which Base UI handles correctly out of the box.
- **Suggested command:** `/impeccable harden`

### P2 (Minor: fix in the next pass)

**[P2-A11Y-1] Disabled-state explanation lives only in `title`.**
- **Location:** `frontend/src/App.tsx` Compute button (line 322), `ExamplesPanel.tsx` Compute button (line 117).
- **Category:** Accessibility.
- **Impact:** When the backend is offline, the buttons are disabled and the only explanation ("Backend offline") is in the native `title` tooltip. Native tooltips are not exposed reliably to screen readers, vanish on touch devices, and require the user to hover for ~1 second. The user is told the button is disabled but not why.
- **WCAG:** 3.3.1 Error Identification, 3.3.3 Error Suggestion (disabled state is a soft error).
- **Recommendation:** Render an inline status line below the action bar when `!backendOnline` ("Backend offline. Compute will be available when the API responds."). Wire it up with `aria-describedby` on the Compute button. The HealthIndicator already shows status in the header, so this can be a single shared message bound to that state.
- **Suggested command:** `/impeccable clarify`

**[P2-A11Y-2] Hidden checkboxes inside `MethodSelector` lose visible focus.**
- **Location:** `frontend/src/components/MethodSelector.tsx` lines 70-79.
- **Category:** Accessibility.
- **Impact:** The actual `<input type="checkbox">` is `sr-only`. The label has `focus-within:ring-2 focus-within:ring-ring/50` so a ring appears on the parent label when the input is focused. This works in modern browsers, but the ring sits around the entire clickable card, which makes it ambiguous which control is focused when the user is tabbing through four method cards in sequence (focus moves between sibling labels and the ring tracks the same shape it always has).
- **WCAG:** 2.4.7 Focus Visible (perceivable but ambiguous).
- **Recommendation:** Either expose the native checkbox visually (small square in the top-left of the card) or add a more distinctive focused state (e.g. inset border + `data-focused` background tint). The current "subtle ring" reads as a hover state.
- **Suggested command:** `/impeccable polish`

**[P2-A11Y-3] DisplayDigitsControl lacks arrow-key navigation.**
- **Location:** `frontend/src/components/DisplayDigitsControl.tsx`.
- **Category:** Accessibility.
- **Impact:** The container has `role="radiogroup"` and the buttons have `role="radio"`. ARIA practices for radiogroup require Left/Right arrow keys to move selection (and focus) between radios. Currently only Tab works to focus and Space/Enter to select.
- **WCAG:** ARIA Authoring Practices "Radio Group" pattern.
- **Recommendation:** Add a `keydown` handler that moves selection (and `tabindex`) between siblings on ArrowLeft/ArrowRight/ArrowUp/ArrowDown.
- **Suggested command:** `/impeccable harden`

**[P2-RESPONSIVE-1] EvaluationTargets remove button is below WCAG 2.2 AA target size.**
- **Location:** `frontend/src/components/EvaluationTargets.tsx` line 50 (`w-5 h-5`, 20x20 px).
- **Category:** Responsive Design (touch targets).
- **Impact:** WCAG 2.2 SC 2.5.8 Target Size (Minimum) requires interactive controls to be at least 24x24 px or have 24x24 spacing around them. 20x20 fails. PointsInput and XValuesInput both use `w-6 h-6` (24x24, exactly at the minimum). EvaluationTargets is the outlier.
- **WCAG:** 2.5.8 Target Size (Minimum), AA.
- **Recommendation:** Bump to `w-6 h-6` and resize the chip body to compensate, or pad the surrounding chip so the 24x24 spacing rule is met.
- **Suggested command:** `/impeccable adapt`

**[P2-RESPONSIVE-2] Sticky tab nav offset is hardcoded to a guessed header height.**
- **Location:** `frontend/src/components/ResultsPanel.tsx` line 61 (`sticky top-[60px]`).
- **Category:** Responsive Design.
- **Impact:** The header in `App.tsx` is `py-3.5` plus content height, which lands somewhere near 60 px in light layout but drifts under dense viewports (mobile `text-[11px]` subtitle wraps), causing the tab nav to cover the last line of the header or float a few px below it. Any header content edit silently breaks the alignment.
- **Recommendation:** Either apply `position: sticky; top: 0` to the tab nav after the header is no longer needed (move the tab nav out of the result panel into the page chrome), or use a CSS variable set on the header (`--header-h`) and reference it: `top: var(--header-h)`.
- **Suggested command:** `/impeccable adapt`

**[P2-PERF-1] Single 290 kB gzipped bundle, no code splitting.**
- **Location:** Whole app. Build output (recorded in last critique): 975 kB unminified, 290 kB gzipped.
- **Category:** Performance.
- **Impact:** Recharts (used only on the Graph tab when the user opts into graph output) and KaTeX (used on Polynomial and Methods tabs) are loaded on first paint. First-time visitors who only want to see "P(3) = ?" pay the cost of the visualization stack.
- **Recommendation:** Lazy-load `GraphCard` and `KatexDisplay` via `React.lazy`. Wrap the lazy component in `<Suspense>` with a `Skeleton` fallback. Expected gzipped delta: roughly 80-100 kB out of the initial route.
- **Suggested command:** `/impeccable optimize`

**[P2-PERF-2] HealthIndicator polls every 30 s with no backoff.**
- **Location:** `frontend/src/components/HealthIndicator.tsx` line 35.
- **Category:** Performance / Reliability.
- **Impact:** The interval keeps firing whether the tab is visible, hidden, or the device is on cellular. On a flaky backend, every 30 s the user gets a network request that may stall and consume battery. The `onStatusChange` dependency is currently a stable setter so the effect doesn't reset, but if a future caller passes an inline callback, the polling loop will reset every parent re-render.
- **Recommendation:** Add `document.visibilityState === "hidden"` short-circuit, exponential backoff on consecutive failures, and wrap `onStatusChange` in `useCallback` at the call site (or `useEvent`-style ref) to make the dependency truly stable.
- **Suggested command:** `/impeccable optimize`

**[P2-PERF-3] `EvaluationTable` and `MethodDetails` re-format every cell on every parent state change.**
- **Location:** `frontend/src/components/results/EvaluationTable.tsx`, `MethodDetails.tsx`.
- **Category:** Performance.
- **Impact:** `useDisplayDigits` returns a fresh `format` function whenever `digits` changes. Because the formatted string is recomputed in render rather than memoized, switching from 6 -> 12 -> 25 -> Full re-renders the entire table (potentially 100+ cells in `divided_difference_table` for a high-degree polynomial). Visible jank is small in current data, but the formatted strings are stable per (digits, value) pair.
- **Recommendation:** Memoize `format` per cell with a small WeakMap cache keyed by the input string, or `useMemo` the formatted rows in the table component.
- **Suggested command:** `/impeccable optimize`

### P3 (Polish: nice to have)

**[P3-A11Y-1] Recharts `<Brush>` exposes no `aria-valuetext`.**
- **Location:** `frontend/src/components/results/GraphCard.tsx` line 176.
- **Category:** Accessibility.
- **Impact:** Screen readers announce the brush slider position as "0" with no context. The library does not expose this directly. Documented in the prior critique as a downstream issue.
- **Recommendation:** Track upstream or wrap the brush with a `<div role="region" aria-label="Drag to zoom into a graph region">` and rely on the visible "Drag the brush below the chart to zoom" text already present.
- **Suggested command:** `/impeccable polish`

**[P3-RESPONSIVE-1] X-value input has a 160 px floor inside a flex row.**
- **Location:** `frontend/src/components/XValuesInput.tsx` line 96 (`min-w-[10rem]`).
- **Category:** Responsive Design.
- **Impact:** On viewports below ~360 px wide the parent grid (`grid-cols-[2rem_1fr_2rem]`) plus the 10 rem floor causes horizontal scroll inside the X-Values panel.
- **Recommendation:** Drop `min-w-[10rem]`. The grid `1fr` column already guarantees the input takes the available space.
- **Suggested command:** `/impeccable adapt`

**[P3-COPY-1] `truncateSignificantDigits` truncates rather than rounds.**
- **Location:** `frontend/src/lib/format-numeric.ts` lines 100-130.
- **Category:** Anti-Pattern (data-display honesty).
- **Impact:** A backend value of "0.99999..." displays as "0.9999" at 4 digits, not "1.000". The function deliberately drops the rest to avoid inventing tail digits beyond JS double precision, and the comment explains the choice. But for budgets <= 12 digits where Number-based rounding is safe, the user will read a less accurate number than the rounded form would give. The Polynomial expanded view already routes through `Number.toPrecision`, so this only affects budgets >= 15.
- **Recommendation:** Document the budget cutoff in the UI ("Display 25 truncates rather than rounds") or implement string-based rounding (5-and-up) for the >= 15 path. This is an honesty trade-off, not a bug; document the choice in DESIGN.md if kept.
- **Suggested command:** `/impeccable clarify`

**[P3-CODE-1] React fast-refresh warnings on three UI primitive files.**
- **Location:** `frontend/src/components/ui/badge.tsx`, `button.tsx`, `tabs.tsx` (each exports both a component and a `cva` variants object).
- **Category:** Code quality (developer experience).
- **Impact:** `npm run lint` reports 3 `react-refresh/only-export-components` warnings. No runtime effect; HMR may force full reload when these files change.
- **Recommendation:** Move `buttonVariants`, `badgeVariants`, `tabsListVariants` into sibling `*.variants.ts` files; the components can re-export them.
- **Suggested command:** `/impeccable harden`

**[P3-A11Y-2] `disabled:opacity-0` on row remove buttons hides affordance for sighted mouse users.**
- **Location:** `PointsInput.tsx`, `XValuesInput.tsx` (both `disabled:opacity-0`).
- **Category:** Accessibility (visibility of state).
- **Impact:** When only two rows remain, the remove icon vanishes entirely. The button is still in the DOM and `disabled`, so it's removed from tab order. Fine for AT, but a sighted user sees no visual hint that "you can't go below 2 points". After typing two points and trying to clean up, they may not understand why no remove button appears at all.
- **Recommendation:** Change to `disabled:opacity-30 disabled:cursor-not-allowed` so the affordance is visible-but-faded. Pair with a one-line caption already present ("Enter at least 2 distinct (x, y) pairs.").
- **Suggested command:** `/impeccable clarify`

**[P3-PERF-1] Lucide icons are imported per-component but the bundler should tree-shake correctly.**
- **Location:** Various.
- **Category:** Performance.
- **Impact:** None measurable: the imports are named, lucide-react is ESM, Vite tree-shakes by default. Listed only as a verification reminder for future audits.
- **Recommendation:** Run `vite build --mode=production` and inspect `dist/assets/*.js` to confirm only the used icons land in the bundle.
- **Suggested command:** `/impeccable optimize`

## Patterns and Systemic Issues

1. **Custom widgets re-implement ARIA patterns instead of reusing Base UI primitives.** ResultsPanel's tab nav, DisplayDigitsControl's radiogroup, ShortcutsPopover's dialog, and PrecisionSettings' preset segmented control are all custom buttons with `role="tab"` / `role="radio"` / `role="dialog"` and incomplete keyboard interaction. The project already depends on `@base-ui/react` (Tabs, Dialog, etc. are present and used elsewhere). Replacing the four custom widgets with Base UI primitives resolves four ARIA gaps in one pass.

2. **Theming is rigorous everywhere except where the most data-rich surface lives.** Tokens, dark-mode variants, OKLCH, and the no-pure-black/white rule are followed in 18 of 19 components. The exception is GraphCard, which is also the surface most affected by a dark-mode visit.

3. **Disabled-state communication is muscle memory.** Several buttons rely on `title` and `aria-disabled` to explain why they are dimmed. None of those signals reach a screen reader or a touch user. A single shared "computing or offline" status region near the action bar would carry the message for every dimmed control on the page.

## Positive Findings (replicate these)

- **Three-voice typography is enforced via CSS handles**, not utility-string copy-paste. `.font-math`, `.font-numeric`, and `.font-label` give every text role exactly one home, and the comment block in `index.css` defends the contract for future contributors.
- **`prefers-reduced-motion` is respected** by neutralizing both animation handles in a single block, with a comment that locks the contract for new motion handles.
- **The Inset Containment Rule is honored without exceptions**: every warning, error, and notice uses `ring-1 ring-inset` with a semantic tint. No side-stripes anywhere in the codebase.
- **`HealthIndicator` no longer uses `--primary` for "online"**; it now uses the dedicated `--success` token, restoring the Semantic Honesty Rule.
- **Numeric values are uniformly `font-numeric` + `tabular-nums`**: tables align cleanly and no value is rendered in the body font.
- **Backend warnings are first-class**: persistent warning bar above the result tabs, badge counter on the Notes tab, full warning detail in `WarningsDisplay` with severity color, label, and message. Warnings cannot be hidden by tab choice.
- **`ErrorNotice` enforces the canonical hierarchy** (severity word, message, code, recovery guidance) in one place and is reused by every error surface in the app.

## Recommended Actions

In priority order:

1. **[P1] `/impeccable harden`** Wire focus management, Esc, and focus return on the shortcuts overlay (or replace it with a popover). Replace the custom tablist in `ResultsPanel.tsx` with the existing Base UI `Tabs` primitive so `aria-labelledby` and arrow keys are correct by construction. Same primitive swap for `DisplayDigitsControl`'s radiogroup.
2. **[P1] `/impeccable colorize`** Move the five hardcoded OKLCH literals in `GraphCard.tsx` into named CSS variables defined for both light and dark modes.
3. **[P2] `/impeccable clarify`** Add an inline "Backend offline" status near the action bar, wired with `aria-describedby` on Compute. Soften `disabled:opacity-0` to `disabled:opacity-30` on row-remove buttons.
4. **[P2] `/impeccable adapt`** Bump EvaluationTargets remove button to 24x24. Replace the hardcoded `top-[60px]` sticky offset with a `--header-h` CSS variable. Drop `min-w-[10rem]` on x-value inputs.
5. **[P2] `/impeccable optimize`** Lazy-load `GraphCard` and `KatexDisplay`. Add visibility-aware backoff to `HealthIndicator`. Memoize formatted cells in `EvaluationTable` and `MethodDetails`.
6. **[P3] `/impeccable polish`** Distinguish the focus state on `MethodSelector` cards from the hover state. Wrap the `<Brush>` slider in a labeled region. Move `cva` variant exports out of the three component files to clear the lint warnings.

> You can ask me to run these one at a time, all at once, or in any order you prefer.
>
> Re-run `/impeccable audit` after fixes to see your score improve.
