---
target: frontend (post-Phase-2, post-2026-05-26 critique fixes)
total_score: 18
p0_count: 0
p1_count: 0
timestamp: 2026-05-26T13-30-00Z
slug: frontend-audit
---
# Audit: frontend (post-Phase-2)

## Audit Health Score

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 3 | Compute button uses `disabled` AND `aria-disabled`, removing focus from a control that needs to broadcast its blocked reason to AT. ResultsPanel tabs convey active state through color alone. |
| 2 | Performance | 4 | `GraphCard` and `PolynomialCard` lazy-loaded; rows memoised in `EvaluationTable`; reduced-motion neutralises every named motion handle plus `animate-pulse`. |
| 3 | Responsive Design | 3 | Several touch targets sit at the 24x24 floor (remove buttons, preset chips, "Load Example", display-digits chips). Tab bar in `ResultsPanel` has no scroll affordance on narrow viewports. |
| 4 | Theming | 4 | Full Tailwind v4 `@theme inline` token system; OKLCH everywhere; dark-mode parity; graph tokens re-resolved via `MutationObserver` on theme change; zero hex literals; zero raw `white`/`black`. |
| 5 | Anti-Patterns | 4 | Detector returns `[]`. Side-stripes >=2px, gradient text, glassmorphism, bounce/elastic, modal-as-first-thought, hero metrics, identical card grids, `font-mono` leaks: all clean. The Three-Voice Rule holds. |
| **Total** | | **18 / 20** | **Excellent (minor polish).** |

### Anti-Patterns Verdict

**Pass.** Nothing here reads as AI-generated. The Inset Containment Rule is enforced project-wide (every notice uses `ring-1 ring-inset` plus a semantic tint, never `border-l-4`); every neutral is tinted toward hue 250; every motion handle lives in `index.css` and is enumerated by name in the `prefers-reduced-motion` block; the example panel was redesigned away from the identical-card-grids wall the prior critique flagged; raw method codes (`hermite_divided_difference`) no longer reach the rendered DOM. Specific evidence:

- `grep_search` for `font-mono` -> 0 hits.
- `grep_search` for `border-(l|r)-(2|4|8)` -> 0 hits.
- `grep_search` for `bg-gradient|background-clip` -> 0 hits.
- `grep_search` for `backdrop-blur` -> 1 hit, in a comment ("Uses a solid surface (not backdrop-blur) to honor the no-glassmorphism rule").
- `grep_search` for `#[0-9a-fA-F]{3,6}` and the literals `\bwhite\b|\bblack\b` -> 0 hits.
- `grep_search` for em dashes in string literals -> 0 user-facing hits (only comments and test `describe` blocks).
- `node detect.mjs --json frontend/src` -> `[]`.

## Executive Summary

- Audit Health Score: **18 / 20 (Excellent, minor polish)**
- Issues found: 0 P0, 0 P1, 5 P2, 4 P3.
- Top critical issues: Compute button disabled-pattern (P2), tab active-state colour-only (P2), mass 24x24 touch targets (P2), no scroll affordance on the result-tab overflow (P2), reduced-motion does not neutralise the spinner inside Compute (P2).
- Recommended next steps in priority order: `/impeccable harden` -> `/impeccable adapt` -> `/impeccable polish`. Each one is a small, focused pass; none of them require redesign work.

## Detailed Findings by Severity

### [P2] Compute button uses both `disabled` and `aria-disabled`, dropping the blocked-reason from AT users

- **Location**: `frontend/src/App.tsx` ~lines 360-378.
- **Category**: Accessibility.
- **Impact**: When the form is blocked (no backend, node count out of range, or equal-spacing ineligible), Compute is rendered with `disabled={...}` AND `aria-disabled={...}`. Native `disabled` removes the button from the focus order in every major browser, so screen-reader and keyboard users never receive the `aria-describedby="compute-status"` text or the `title` tooltip. The current `compute-status` paragraph also only renders for the offline path, not for the form-block paths. Users who cannot see the dimmed button get no explanation for why it does not respond.
- **WCAG/Standard**: WCAG 3.3.1 Error Identification, 3.3.3 Error Suggestion, 4.1.2 Name, Role, Value.
- **Recommendation**: Drop `disabled` in favour of `aria-disabled` alone (or pair `aria-disabled` with a click-handler guard), keep the visual `disabled:opacity-50` hooked through CSS, and render the inline status paragraph for every blocked state, not only `!backendOnline`. The same fix lets keyboard users Tab onto Compute and read the reason aloud.
- **Suggested command**: `/impeccable harden`.

### [P2] ResultsPanel tabs convey active state through colour alone

- **Location**: `frontend/src/components/ResultsPanel.tsx` ~lines 132-153 (the custom-styled `TabsPrimitive.Tab` with `bg-primary/10 text-primary` for active vs `text-muted-foreground` for inactive).
- **Category**: Accessibility (and slight anti-pattern pressure).
- **Impact**: The active tab differs from inactive tabs only by indigo tint. There is no underline, no weight change, no ring. Users with low colour vision, dark-on-dark colour-blindness, or a high-contrast OS theme can lose track of the selected tab; they have to reason from which panel is visible below. The DESIGN.md rule "Don't use color as the only indicator of severity. Always pair with icon and text label." applies here too.
- **Recommendation**: Add a 1px bottom border or a 2px after-pseudo underline (the pattern is already in `tabs.tsx`'s `line` variant) on the active state, OR use `font-semibold` for the active label. The icon already differentiates each tab; selection state needs its own non-colour cue.
- **Suggested command**: `/impeccable polish`.

### [P2] Touch targets cluster at 24x24px, the WCAG 2.2 AA floor

- **Location**:
  - Remove buttons in `PointsInput.tsx`, `XValuesInput.tsx`, `EvaluationTargets.tsx`: `w-6 h-6` (24x24).
  - Preset chips in `PrecisionSettings.tsx`: `h-6 px-2`.
  - "Load Example" button in `ExamplesPanel.tsx`: `text-[11px] h-6 px-2`.
  - Display-digits chips in `DisplayDigitsControl.tsx`: `h-6 px-2`.
- **Category**: Responsive Design / Accessibility.
- **Impact**: WCAG 2.5.8 (AA, 2.2) requires 24x24 minimum; WCAG 2.5.5 (AAA) wants 44x44. Multiple of these targets sit at the AA floor with very little spacing buffer (e.g. `EvaluationTargets` chips use `gap-2` = 8px between items, well below the 24-pixel exception). Pencil-grip users, touch users on smaller screens, and users with motor impairments will routinely miss these. The pattern is consistent across the editing surface, so the issue compounds.
- **Recommendation**: Bump remove buttons to 28-32px (`w-7 h-7` or `w-8 h-8`) and either widen preset chips to `h-7` or add `gap-3` between adjacent targets so the 24px exception applies. The bench can absorb a couple of extra pixels without feeling chunky; the design system already defines `size="sm"` (h-7) for the Button primitive, so use it.
- **Suggested command**: `/impeccable adapt`.

### [P2] Tab bar overflow has no scroll affordance on narrow viewports

- **Location**: `frontend/src/components/ResultsPanel.tsx` ~lines 124-153 (`overflow-x-auto py-1 rounded-xl` on the `TabsList`).
- **Category**: Responsive Design.
- **Impact**: Seven result tabs (Overview / Guide / Polynomial / Evaluations / Graph / Methods / Notes) horizontally scroll on viewports below ~720px. There is no fade, gradient, or chevron telling the user there are more tabs to the right. Mobile users (and tablet users in portrait) easily land on Notes only because the chevron-cue is missing. The custom scrollbar (`::-webkit-scrollbar` 6px) helps slightly but isn't always visible.
- **Recommendation**: Add a thin right-fade overlay (`mask-image: linear-gradient(...)` or a faded `::after` element using `bg-gradient-to-l from-background`) whenever the list scrolls; or render a chevron affordance on the right edge that nudges to the next batch. This stays on the right side of the no-glassmorphism rule because it's a mask, not a backdrop blur.
- **Suggested command**: `/impeccable adapt`.

### [P2] `prefers-reduced-motion` does not neutralise the Compute spinner

- **Location**: `frontend/src/App.tsx` line 376 (`<Loader2 className="h-3.5 w-3.5 animate-spin" .../>`); the `index.css` reduced-motion block (lines ~243-263) explicitly leaves `animate-spin` untouched.
- **Category**: Accessibility.
- **Impact**: The CSS comment on the reduced-motion block notes this is intentional ("removing it would imply 'computation has stopped'"). The reasoning is sound but the trade-off is one-sided: users with vestibular sensitivity (the population the reduced-motion preference is built for) get a 360 deg rotating icon they cannot stop. Compute requests are typically <300ms, so the spinner is rendered for vanishingly little time; on a slow backend, a non-rotating "Computing..." text or a 1.5-second pulse would carry the same status message without rotating motion.
- **Recommendation**: Either swap the spinner for a pulsing dot under reduced motion (the Loader2 icon stays, the rotation is dropped via `motion-reduce:animate-none`), or replace the spinner entirely with the text "Computing...". The label already changes; the icon does not need to spin to confirm progress.
- **Suggested command**: `/impeccable harden`.

### [P3] `FormState.exact: boolean | null` has no UI for the third state

- **Location**: `frontend/src/components/InputPanel.tsx` line ~24, paired with `frontend/src/components/PrecisionSettings.tsx` ~line 36.
- **Category**: Anti-pattern / dead code.
- **Impact**: The Switch can only emit `true` / `false`; the type permits `null` but no surface produces it. The dead state suggests "auto" was once intended and dropped. Future refactors may handle a `null` that never arrives, hiding bugs.
- **Recommendation**: Tighten the type to `boolean` if `null` will not be reintroduced, or add the third (auto) state to the Switch with a tri-state aria-checked pattern.
- **Suggested command**: `/impeccable polish`.

### [P3] `GraphCard` interactivity is not keyboard-reachable past the brush

- **Location**: `frontend/src/components/results/GraphCard.tsx` ~lines 207-260.
- **Category**: Accessibility.
- **Impact**: Recharts Brush handles are keyboard-focusable but the line / scatter series and tooltip are not. Mouse users get a per-x tooltip; keyboard users do not. Per the existing PRODUCT.md guidance ("Math formulas should remain readable and copyable"), the underlying numeric tables make this acceptable, but the chart could expose an SR-only data table summarising the source/P(x)/error sequences.
- **Recommendation**: Render an SR-only `<table>` with the `graphData.x`, `graphData.f_x`, `graphData.P_x`, `graphData.error` arrays in the same `role="region"` block. No visual change.
- **Suggested command**: `/impeccable harden`.

### [P3] Fixed pixel widths on the page shell ignore very wide viewports

- **Location**: `frontend/src/App.tsx` lines 288 and 324 (`max-w-[1100px]`).
- **Category**: Responsive Design.
- **Impact**: On 1440-1920 wide displays the Analysis Bench feels like a page in the middle of a desk. Up to ~1280 the layout breathes; beyond that the empty margins start to dominate. Math people frequently sit at large monitors. The cap is intentional and serves line-length on the Methods tab, but the empty bench can fill more space without breaking the 65-75ch rule (text-heavy content can stay capped via `max-w-prose` on its own container).
- **Recommendation**: Either bump to `max-w-[1240px]` and let the right rail / examples breathe, or cap shell at 1100px while opting result panels into a wider container under `xl:`. Keep the prose blocks separately capped.
- **Suggested command**: `/impeccable adapt`.

### [P3] `HealthIndicator` polling effect deps array is empty (intentional, undocumented at the call site)

- **Location**: `frontend/src/components/HealthIndicator.tsx` lines 39-103.
- **Category**: Anti-pattern (subtle).
- **Impact**: The `useEffect` has `[]` deps; `onStatusChange` is captured via a ref to avoid retearing. This is correct, but a future contributor who adds a new prop will probably miss the contract. The component carries a comment ("Stash the latest callback in a ref...") that is helpful, but the empty deps array still produces an `eslint-plugin-react-hooks/exhaustive-deps` rule trip if rules are tightened later.
- **Recommendation**: Add `// eslint-disable-next-line react-hooks/exhaustive-deps` with a one-line reason, OR factor the polling logic into a custom hook so the single-mount semantics are encoded in the API.
- **Suggested command**: `/impeccable polish`.

## Patterns and Systemic Issues

- **Touch targets uniformly sit at 24x24px across the editing surface.** The remove buttons, preset chips, and example "Load" buttons all use `h-6 px-2` or `w-6 h-6`. This is a pattern, not five separate decisions. A single design-system call (raise the floor to `h-7` or `size="sm"` from the Button primitive) closes all of them at once.
- **Active states across tabs/chips lean on colour alone.** `ResultsPanel` tabs (P2 above), `MethodSelector` cards, `PrecisionSettings` preset chips, and `DisplayDigitsControl` chips all use `bg-*/10 text-*` to mark selection. `PrecisionSettings` does pair with `font-semibold`; the others mostly do not. A consistent rule (always pair colour with weight or ring) would lift heuristic 2.5 (Recognition) at the same time.
- **No documented bundle size limit / lighthouse budget.** Lazy-loading is in place (recharts and katex are deferred). It would be cheap to add a `vite-plugin-bundle-visualizer` step or a Lighthouse CI run to lock in the gains.

## Positive Findings

- **Three-Voice typography contract is enforced via four CSS handles.** `index.css` lines 110-176 are explicit and disciplined, including a comment block defending the contract from drift.
- **Reduced-motion neutralises every named motion handle.** The reduced-motion block (`index.css` ~lines 240-270) lists every motion handle introduced and disables it; the only deliberate exclusion (`animate-spin`) is documented inline. This is the strongest reduced-motion implementation I have seen on this codebase.
- **Backend codes route through a shared registry.** `lib/warnings.ts`, `lib/method-metadata.ts`, and `lib/backend-codes.ts` together prevent raw `snake_case` from reaching the user. `EvaluationTable`, `PolynomialCard`, `WarningsDisplay`, and `GuidedExplanation` all read from those centralised maps.
- **Lazy-loading is precise.** `ResultsPanel` defers `recharts` (largest dep, ~80kB gz) until the Graph tab and `katex` until the Polynomial tab. Users who never request graph or open the polynomial sub-tab never download those bundles.
- **Inset Containment Rule scaled to Phase 2.** Eight new methods, eleven new warning codes, zero side-stripe regressions. The `WarningsDisplay` SEVERITY_CLASSES map uses `bg-*/5 ring-1 ring-inset ring-*/15-20` consistently.
- **HealthIndicator pairs colour, icon, and text label.** Severity is never carried by colour alone (Check / X / Loader2 plus "Backend connected" / "Backend offline" / "Connecting..."). Online state uses the dedicated `--success` token rather than borrowing `--primary`.
- **Examples panel addresses the prior critique.** Quick Start / Catalog disclosure is in place; Demo / Function / Lecture taxonomy is back; the colorize-pass register is honoured.

## Recommended Actions

1. **[P2] `/impeccable harden`**: Land the `aria-disabled`-only Compute pattern (with focus retention and inline status for every blocked reason), add a reduced-motion-friendly Compute spinner, and render the SR-only graph data table. These three changes are tightly related (a11y) and share one pass.
2. **[P2] `/impeccable adapt`**: Raise the touch-target floor to `h-7` / `w-7` across remove buttons, preset chips, "Load Example", and display-digits chips; add a right-edge fade or chevron for the result-tab overflow on narrow viewports; consider widening the page shell for ultra-wide displays.
3. **[P2] `/impeccable polish`**: Add a non-colour cue (underline / weight) to the active result tab; resolve the dead `FormState.exact: boolean | null` third state; document or hook-encode the `HealthIndicator` empty-deps invariant.

You can ask me to run these one at a time, all at once, or in any order you prefer.

Re-run `/impeccable audit` after fixes to see your score improve.
