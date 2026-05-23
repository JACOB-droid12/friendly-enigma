---
target: frontend (entire website)
command: /impeccable colorize
strategy: Restrained (product register)
timestamp: 2026-05-23T21-30-00Z
slug: frontend-colorize
---

# Colorize Pass: Strategic Color Enrichment

## Register and strategy

**Product, Restrained.** The site is a workbench, not a marketing surface. Per `reference/product.md`: "Product defaults to Restrained." Per `reference/colorize.md`: "semantic-first and almost always Restrained. Accent color is reserved for primary action, current selection, and state indicators. Not decoration. Every color has a consistent meaning across every screen."

So this pass is not a recoloring. It is a strategic extension of the role taxonomy already established in `MethodSelector` (Construction / Stable Evaluator / Target-Specific) and the warning vocabulary (info-cyan, warning-amber, destructive-coral, success-green) into surfaces that previously read as monochrome neutrals.

## Where color was added

Each addition reuses an existing token with an existing meaning. The Semantic Honesty Rule remains intact app-wide.

### 1. ExamplesPanel category tags (entry surface)

The "Lecture / Function / Demo" tags were flat gray pills. Now they are tinted Badges that encode what each example demonstrates without requiring the subtitle:

| Category | Tint | Rationale |
|---|---|---|
| Lecture | primary (indigo) | Curriculum entry. Primary is "interactive or selected" app-wide; an entry-point card on the canonical worked example earns the same hue. |
| Function | info (cyan) | Explores an analytic f(x). Cyan is the "informational" hue used elsewhere for "nodes reordered" notices. |
| Demo | warning (amber) | The Runge example IS the cautionary tale. Amber pre-flags the warning bar that example will produce, keeping amber's app-wide meaning of "numerical caution" intact. |

A first-time visitor scanning the row immediately sees the curriculum / informational / cautionary axis. A returning user can pick "the cautionary one" by color rather than text.

### 2. SummaryCard status chip and Mode chip

- **Status `ok` chip** changed from `default` (primary) to `success` (green). Restores the Semantic Honesty Rule for positive system status. Primary now stays reserved for "interactive or selected" everywhere it appears.
- **Mode cell** changed from a body-voice word ("Exact" / "Numeric") to a tinted chip. Resolves the rhythm complaint flagged in the prior critique ("three numbers and a word"). `Exact` (rationals) reads primary; `Numeric` (mpmath floats) reads info-cyan.

### 3. SummaryCard method badges, role-tinted

The methods row was four identical secondary pills. Now each badge carries its method's role color, mirroring the role taxonomy from `MethodSelector`:

| Method | Role | Badge variant |
|---|---|---|
| Lagrange | Construction | secondary |
| Newton | Construction | secondary |
| Barycentric | Stable Evaluator | default (primary) |
| Neville | Target-Specific | info (cyan) |

A user who selected Barycentric specifically because it is the unique source of graph data sees the same primary indigo on the selector card, in the methods row, and on the active Method Details tab.

### 4. MethodDetails per-method active-tab tints

Same role taxonomy applied to the active state of each tab in Method Details. Construction tabs keep the neutral lifted-pill active state (the most common selections; tinting them would create noise). Barycentric uses primary tint on active. Neville uses info-cyan on active. The role color a user selected a method with echoes back on every method-related surface.

## What was deliberately NOT colored

- **Tab navigation in `ResultsPanel`.** The six top-level result tabs stay neutral with primary tint on active. They are navigation, not categorical state. Tinting them per-tab would compete with the role colors below and break the product register's consistency-IS-affordance rule.
- **The `Methods` selector cards.** Already correctly tinted per role (primary for Barycentric, neutral otherwise). No change.
- **Section headers.** The card-header `bg-muted/30` is structural tonal layering, not categorical. Coloring it would defeat the Flat-at-Rest rule.
- **The Display digits radiogroup.** Functional control, not categorical.
- **The graph.** Already token-driven via `--graph-fx`, `--graph-px`, `--graph-node`, `--graph-error`. The previous critique addressed dark-mode bypass; no further color decisions belong here.
- **The action bar and buttons.** Compute is already primary; Reset is ghost. Coloring the Compute button further would over-emphasize a button that already commands attention through size and position.
- **The function input.** The validation-success message is muted-foreground; pulling cyan in here would compete with the Function category color in the Examples panel.

## Anti-pattern audit

| Pattern | Status |
|---|---|
| Side-stripe borders | Pass — none introduced |
| Gradient text | Pass — none introduced |
| Glassmorphism / backdrop-blur | Pass — none introduced |
| Bounce / elastic easing | Pass — no motion changes |
| Hero-metric template | Pass — Mode chip is part of an existing 4-cell labeled grid, not a hero metric |
| Identical card grids | Pass — Examples cards differ in title length, subtitle, category tint |
| Modal as first thought | Pass — no new modals |
| Color as only severity indicator | Pass — every tinted badge still has a label word; status chip pairs color with text; method badges read their method name |
| Pure black / white | Pass — every neutral is still tinted toward hue 250 |
| WCAG contrast | Each variant uses the existing `*-foreground` token paired with its tint; tokens are already calibrated for AA in light and dark |

## Color-vs-coverage check (`reference/colorize.md`)

> "Pick a color strategy first per SKILL.md (Restrained / Committed / Full palette / Drenched) and follow its dosage."

Strategy is Restrained. Color coverage on the page after this pass is still well under the "<= 10% of surface" threshold:
- Method-selector cards (one tinted; three neutral).
- Three small example category badges.
- Status chip, Mode chip, methods row in SummaryCard (each chip is a few hundred pixels max).
- One active method tab in Method Details (when on the Methods page).

Everything else stays in the tinted-neutral hue 250 family. The bench reads as a quiet workbench with categorical signal where it earns its keep.

## Files touched

- `frontend/src/components/ui/badge.variants.ts` — added `info` and `success` variants bound to existing `--info` / `--success` tokens.
- `frontend/src/components/ExamplesPanel.tsx` — category type tightened to a discriminated union; category tag rendered as tinted Badge.
- `frontend/src/components/results/SummaryCard.tsx` — status chip uses `success` for `ok`; Mode cell rendered as tinted Badge; methods row uses per-method role tint via `METHOD_BADGE` map.
- `frontend/src/components/results/MethodDetails.tsx` — added `METHOD_TAB_TINT` map; applied to each `TabsTrigger`'s `className`.
- `DESIGN.md` — Badges / Method Tags section now documents the full variant set, the method role taxonomy, the Mode chip rule, the example category table, and the status chip mapping.
- `docs/FRONTEND_HANDOFF.md` — appended Frontend v1.4 colorize-pass section.

## Verification

| Command | Result |
|---|---|
| `npm run build` | PASS — 2553 modules, 1.66s |
| `npm run lint` | PASS — 0 errors, 0 warnings |
| `getDiagnostics` on touched files | PASS — 0 issues |
| Live test: empty bench shows category-tinted example tags | PASS |
| Live test: Linear Lagrange overview shows green `ok`, primary `Exact`, role-tinted methods | PASS |
| Live test: Runge overview shows green `ok`, info-cyan `Numeric`, warning bar | PASS |
| Live test: Method Details active tab tinted per role (light + dark) | PASS |

## Hard Rules Reaffirmed

- Backend behavior unchanged.
- Endpoint paths and JSON contract unchanged.
- Interpolation logic unchanged.
- Frontend renders backend results only.

## Recommended next step

`/impeccable polish` for a final once-over of the new badge surfaces under hover, focus, and disabled states; or `/impeccable harden` to address the remaining P1 a11y findings from the most recent audit (shortcuts dialog focus management, custom tablist aria-labelledby, custom radiogroup arrow-key navigation).
