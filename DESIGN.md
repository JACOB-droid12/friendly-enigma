---
name: Interpolating Polynomial Calculator
description: A premium scientific workbench for polynomial interpolation and numerical analysis.
colors:
  indigo-deep: "oklch(0.4 0.12 260)"
  indigo-bright: "oklch(0.65 0.15 260)"
  slate-ink: "oklch(0.13 0.02 250)"
  slate-muted: "oklch(0.45 0.02 250)"
  surface-warm: "oklch(0.985 0.001 250)"
  surface-card: "oklch(1 0 0)"
  surface-tinted: "oklch(0.96 0.008 250)"
  amber-caution: "oklch(0.65 0.16 55)"
  amber-caution-text: "oklch(0.3 0.06 55)"
  coral-error: "oklch(0.55 0.22 25)"
  cyan-data: "oklch(0.55 0.12 250)"
  border-subtle: "oklch(0.91 0.008 250)"
typography:
  display:
    fontFamily: "Iowan Old Style, Palatino Linotype, Palatino, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: "IBM Plex Sans Variable, IBM Plex Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "IBM Plex Sans Variable, IBM Plex Sans, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.05em"
  numeric:
    fontFamily: "JetBrains Mono, Fira Code, SF Mono, Cascadia Code, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  section: "32px"
components:
  button-primary:
    backgroundColor: "{colors.indigo-deep}"
    textColor: "oklch(0.98 0.005 260)"
    rounded: "{rounded.lg}"
    padding: "8px 10px"
  button-primary-hover:
    backgroundColor: "oklch(0.35 0.11 260)"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.slate-ink}"
    rounded: "{rounded.lg}"
    padding: "8px 10px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.slate-muted}"
    rounded: "{rounded.lg}"
    padding: "8px 10px"
  input-default:
    backgroundColor: "transparent"
    textColor: "{colors.slate-ink}"
    rounded: "{rounded.lg}"
    padding: "4px 10px"
    height: "32px"
  card-panel:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.slate-ink}"
    rounded: "{rounded.xl}"
    padding: "20px"
  badge-method:
    backgroundColor: "{colors.surface-tinted}"
    textColor: "{colors.slate-ink}"
    rounded: "9999px"
    padding: "2px 8px"
---

# Design System: Interpolating Polynomial Calculator

## 1. Overview

**Creative North Star: "The Analysis Bench"**

A polished scientific workbench for interpolation experiments, where formulas, tables, warnings, and graphs are laid out with clarity and care. This is not a lecture display or a proof notebook alone; it is a working numerical-analysis environment where users enter data, compare methods, inspect tables, evaluate targets, and study graph behavior.

The system draws academic credibility from "The Lecture Instrument" (professor-ready seriousness, scholarly notation) and step-by-step clarity from "The Proof Notebook" (typographic respect for math, nothing extraneous). But the primary metaphor is the bench: organized, precise, modern, and made for real mathematical work.

The Analysis Bench rejects generic SaaS dashboards, purple-gradient AI aesthetics, toy calculators, cluttered 2005 academic software, raw debug panels, and Inter-heavy generated UIs. It also rejects flat, sterile, lifeless interfaces. The bench is alive: color is used with intention, motion responds to interaction, and surfaces have enough depth to feel tactile without becoming decorative.

**Key Characteristics:**
- Scholarly tone aligned with numerical analysis lectures
- Precise controls sized for mathematical input
- Trustworthy presentation that never hides warnings or errors
- Premium polish through typography, spacing, and restrained depth
- Modern and quietly expressive through color, motion, and layout rhythm

## 2. Colors: The Indigo-Slate Palette

A technical palette anchored in indigo and warm slate, with semantic accents for caution, error, data relationships, and success. Color is controlled but present: enough to be memorable, never enough to distract from the mathematics.

### Primary

- **Indigo Deep** (oklch(0.4 0.12 260)): Primary actions, focus rings, active states. The signature color of the bench. Used on buttons, selected tabs, and interactive affordances. Conveys technical trust and scholarly authority.
- **Indigo Bright** (oklch(0.65 0.15 260)): Dark-mode primary, graph lines for f(x), link text. The lighter register of the same hue for contexts where deep indigo lacks contrast.

### Neutral

- **Slate Ink** (oklch(0.13 0.02 250)): Primary text. Tinted toward the indigo hue family; never pure black. All body copy, headings, and numeric values.
- **Slate Muted** (oklch(0.45 0.02 250)): Secondary text, labels, helper copy, placeholder text. Maintains the blue-slate tint at reduced lightness.
- **Surface Warm** (oklch(0.985 0.001 250)): Page background. Nearly white with a whisper of blue warmth. Never pure #fff.
- **Surface Card** (oklch(1 0 0)): Card and panel backgrounds. Sits above the page surface through outline containment, not shadow.
- **Surface Tinted** (oklch(0.96 0.008 250)): Section headers within cards, muted backgrounds, secondary surfaces. The "workbench surface" color.
- **Border Subtle** (oklch(0.91 0.008 250)): Card outlines, input borders, separators. Thin and precise; never heavy.

### Semantic

- **Amber Caution** (oklch(0.65 0.16 55)): Warning icons, warning badge backgrounds, high-degree alerts, Runge phenomenon indicators. Numerical caution, not alarm.
- **Amber Caution Text** (oklch(0.3 0.06 55)): Warning body text. Readable against light warning backgrounds.
- **Coral Error** (oklch(0.55 0.22 25)): Destructive states, validation errors, method failures. Node scatter points on graphs (data points demanding attention).
- **Cyan Data** (oklch(0.55 0.12 250)): Informational badges, info-level notices, data relationship accents. Used sparingly for "nodes reordered" or "polynomial omitted" notices.
- **Success** (oklch(0.6 0.13 155) light, oklch(0.7 0.13 155) dark): Positive system status. Currently used by `HealthIndicator` to mark "Backend connected" so the backend-online state does not have to borrow `--primary` (which is reserved for "interactive or selected"). Pair with a check icon and the literal text "Backend connected" so severity is never carried by color alone. Tokens: `--success`, `--success-foreground`.

### Named Rules

**The Semantic Honesty Rule.** Color always means something. Amber means numerical caution. Coral means error or failure. Indigo means interactive or selected. Cyan means informational. Green-leaning success means positive system status. No color is used decoratively without semantic purpose.

**The Tinted Neutral Rule.** Every neutral is tinted toward hue 250 (blue-slate). Pure black (#000), pure white (#fff), and untinted grays are prohibited. Even at chroma 0.005, the tint is present.

## 3. Typography: The Three-Voice System

**Display Font:** Iowan Old Style (with Palatino Linotype, Palatino, Georgia, serif fallbacks)
**Body Font:** IBM Plex Sans Variable (with system-ui, sans-serif fallbacks)
**Numeric Font:** JetBrains Mono (with Fira Code, SF Mono, Cascadia Code, monospace fallbacks)

**Character:** A three-voice system that separates scholarly context (serif), interface text (humanist sans), and mathematical values (monospace). The serif voice appears only in the app identity mark and mathematical headings, lending academic credibility without making the interface feel like a document. IBM Plex Sans carries the working interface: clear, technical, never generic. JetBrains Mono handles every numeric value, formula, coefficient, and table cell, giving mathematical output the fixed-width precision it deserves.

### Hierarchy

- **Display** (600, 1.25rem/20px, line-height 1.2): App title in the header. Serif voice. Used exactly once on screen.
- **Section Heading** (600, 0.875rem/14px, line-height 1.4): Card section titles ("Interpolation Data", "Method Details", "Polynomial Forms"). Sans voice. Compact and authoritative.
- **Body** (400, 0.875rem/14px, line-height 1.5): Descriptions, helper text, educational notes. Sans voice. Max line length 65-75ch for readability.
- **Label** (500, 0.625rem/10px, letter-spacing 0.05em, uppercase): Column headers, field labels, category markers. Sans voice. Small, precise, and structural.
- **Numeric** (400, 0.6875rem/11px, line-height 1.5, tabular-nums): All mathematical values, coefficients, table cells, coordinates, precision displays. Monospace voice. The most-used typographic role in this application.

### Named Rules

**The Three-Voice Rule.** Every piece of text belongs to exactly one voice: serif (scholarly identity), sans (interface), or mono (mathematical values). Mixing voices within a single element is prohibited. A heading is never monospace. A coefficient is never sans-serif.

**The Numeric Respect Rule.** Mathematical values are never set in the body font. Every number that represents a computed result, coordinate, coefficient, weight, or table entry uses the numeric voice (JetBrains Mono, tabular-nums). This includes inline values like "P(3) = 6" in helper text.

## 4. Elevation: Outlined Surfaces with Tactile Response

The Analysis Bench uses a hybrid elevation system: tonal layering and thin outlines for containment at rest, with subtle depth appearing as a response to state changes and importance.

At rest, surfaces are flat. Cards are defined by `ring-1 ring-foreground/10` (a 1px outline at 10% foreground opacity) against the slightly darker page background. This creates clear containment without the visual weight of shadows. Section headers within cards use `bg-muted/30` tonal layering to separate structural zones.

Depth appears purposefully:
- Selected tabs gain a subtle `shadow-sm` to feel lifted from their siblings.
- Important result panels (polynomial display, graph) may use a soft ambient glow on hover.
- Method cards in their active/selected state feel tactile through background color shift and subtle scale.
- Warnings use inset rings (`ring-1 ring-inset`) with semantic color to feel contained and deliberate.

### Named Rules

**The Flat-at-Rest Rule.** Surfaces are flat by default. Outlines define containment. Shadows and depth appear only as responses to state (hover, focus, selection, importance). A card that is not being interacted with has no shadow.

**The Inset Containment Rule.** Warnings and notices use `ring-1 ring-inset` with semantic color rather than heavy borders or side-stripes. This creates elegant containment without the visual weight of `border-left: 4px solid`.

## 5. Components

### Buttons

- **Shape:** Gently curved (8px radius, `rounded-lg`). Compact height (32px default, 36px large).
- **Primary:** Indigo Deep background, near-white text. Padding 8px 10px. Translates down 1px on active press (`translate-y-px`). Hover darkens slightly.
- **Focus:** 3px ring in `ring/50` with border shift to ring color. Visible and precise.
- **Outline:** Transparent background, subtle border, hover fills with muted background.
- **Ghost:** No border, no background. Hover reveals muted fill. Used for secondary actions (Reset).
- **Disabled:** 50% opacity, pointer-events none. Never removes the button from layout.
- **Character:** Precise, tactile, and quietly expressive. Small enough for a math workbench, responsive enough to feel alive.

### Cards / Panels

- **Corner Style:** Generous curves (12px radius, `rounded-xl`). Distinguishes panels from inputs.
- **Background:** Surface Card (oklch(1 0 0)) against the warmer page background.
- **Containment:** `ring-1 ring-foreground/10`. No shadow at rest.
- **Internal Structure:** Section header with `bg-muted/30` and bottom border. Content area with consistent `p-5` padding.
- **Overflow:** `overflow-hidden` on the card; internal scrolling for tables and formulas.
- **Character:** Clean containers that organize without dominating. The math inside is the star; the card is the frame.

### Inputs / Fields

- **Style:** Transparent background, 1px border (`border-input`), 8px radius. Height 32px. Monospace font for numeric inputs.
- **Focus:** Border shifts to ring color, 3px ring appears at 50% opacity. Clear and immediate.
- **Error:** Border shifts to destructive color, ring appears in destructive/20. Error text appears below in destructive color.
- **Disabled:** 50% opacity, muted background fill, cursor not-allowed.
- **Point Editor:** Grid layout with index column, x-input, y-input, remove button. Compact 1.5-unit vertical spacing between rows. Remove button reveals on hover, invisible when disabled.

### Tabs

- **Style:** Muted background pill container (3px padding). Triggers are compact (text-xs), with rounded-md shape inside the container.
- **Active State:** Background shifts to card color, text becomes foreground, subtle shadow-sm appears. In line variant, an underline indicator appears instead.
- **Keyboard:** Full arrow-key navigation, visible focus ring on focus-visible.
- **Character:** The primary navigation pattern for this app. Method selection, polynomial form switching, and input mode switching all use tabs. They must feel precise and immediately responsive.

### Tables (Numerical)

- **Style:** Full-width within their container. No outer border (the card provides containment). Bottom borders between rows.
- **Headers:** Font-medium, foreground color, left-aligned, 10px height. Proper `<th>` elements.
- **Cells:** Monospace font (11px), compact padding (8px horizontal, 6px vertical), left-aligned. Tabular-nums for column alignment.
- **Hover:** Rows highlight with `bg-muted/50` on hover.
- **Empty cells:** Rendered as a centered dot (`·`) in muted-foreground/30. Never blank.
- **Overflow:** Horizontal scroll within the card when tables exceed width.

### Warnings / Notices

- **Style:** Rounded-lg container with inset ring. No side-stripe borders. Icon + label + message layout.
- **Warning level:** `bg-warning/5` background, `ring-1 ring-inset ring-warning/20` containment, amber icon, uppercase label in warning color, muted-foreground message text.
- **Info level:** `bg-info/5` background, `ring-1 ring-inset ring-info/15` containment, cyan icon.
- **Error level:** `bg-destructive/10` background, destructive text color, destructive icon.
- **Character:** Warnings are features, not blemishes. They are always visible, always readable, and never hidden for aesthetics. The styling is elegant but never minimizes the message.

### Badges / Method Tags

- **Style:** Full-radius pill shape (9999px). Compact height (20px). Text-xs with medium weight.
- **Variants:** Primary (indigo), secondary (tinted surface), warning (amber background), info (cyan background), success (green background), outline (border only), destructive (coral tint), ghost (transparent), link (underline-on-hover).
- **Method role taxonomy:** When the methods row in `SummaryCard` echoes the user's selection, each badge carries its method's role color: Construction methods (Lagrange, Newton) keep secondary/neutral, the Stable Evaluator (Barycentric, the unique source of graph data) uses primary, and Target-Specific (Neville) uses info-cyan. The Method Details tabs use the same taxonomy on their active state so the role anchor is consistent across surfaces. Method labels everywhere come from `lib/method-metadata.ts` (full label or short label depending on context). Raw snake_case enum strings (`hermite_divided_difference`, etc.) must never reach the rendered DOM.
- **Mode chip:** The Result Summary "Mode" cell renders as a tinted Badge instead of body-voice text so the four-cell rhythm stays in the numeric/label voice. Exact (rationals) reads primary, Numeric (mpmath floats) reads info-cyan, matching the same cyan used for informational notices.
- **Example category chips (Examples panel):** Lecture is secondary (neutral curriculum tag), Function is info-cyan (informational about an analytic f(x)), Demo is warning amber (a deferred or cautionary surface, e.g. the Osculating deferred state). The Examples panel splits into a 4-card "Quick Start" row visible on first paint (Linear Lagrange, Newton Divided Difference, Second-Degree Lagrange, Cubic Spline) and an 8-card "Lecture Catalog" hidden behind a `Show <n> more lecture examples` disclosure. The catalog covers the rest of the Phase 2 method catalog (equal-spacing, Hermite, Taylor, deferred Osculating). Amber's app-wide meaning of "numerical caution" stays intact.
- **Status chip (Result Summary header):** "ok" reads success-green (positive system status, same token used by `HealthIndicator`), "partial" reads warning amber, errors read destructive coral.
- **Usage:** Method names in result summary, status indicators, warning counts, node-reordered flags, mode chip, example category chips.

### Graph Panel

- **Container:** Standard card treatment (rounded-xl, ring containment, section header).
- **Chart Area:** Clean grid with low-opacity dashed lines (0.2 opacity). Monospace axis labels at 10px.
- **Lines:** f(x) in Indigo Bright (oklch(0.55 0.15 260), 2px stroke). P(x) in warm amber (oklch(0.65 0.18 45), 2px stroke). Error in Coral (oklch(0.55 0.2 25), 1.5px stroke).
- **Nodes:** Coral scatter points. Visually distinct from lines.
- **Tooltip:** Monospace content, 11px, rounded-lg with border. Precision formatting (6 significant figures for values, exponential for errors).
- **Character:** Feels like a premium scientific plot area. Clean, readable, with enough color to distinguish data series at a glance.

### Formula Display (KaTeX)

- **Container:** `bg-muted/30` background with subtle border, rounded-lg, generous padding (16px).
- **Font size:** 1.1em (slightly larger than body for readability).
- **Overflow:** Horizontal scroll with hidden vertical overflow. Padding above and below for breathing room.
- **Copyable variant:** Monospace pre block with `bg-muted/50`, border, rounded-lg, 12px padding. Copy button reveals on hover (top-right, small, outlined).
- **Display digits parity:** Both the rendered KaTeX and the plain-text fallback respect the user's Display digits selection (6 / 12 / 25 / Full). The plain text rounds through `formatPolynomial` (expanded form) or `formatNumericLiteralsInString` (factored / Lagrange / Newton / Hermite / Taylor forms); the KaTeX rounds through `formatLatexLiterals`, which only touches numeric tokens and leaves `\frac`, `\left`, `\right`, identifiers, and braces unchanged. The Copy button always copies the unrounded backend string so full precision is available even when Display is set to 6 or 12.
- **Character:** Formulas are first-class content. They get space, proper rendering, and the ability to be copied. Never crammed into tight containers.

## 6. Do's and Don'ts

### Do:

- **Do** use OKLCH for all color definitions. Reduce chroma as lightness approaches 0 or 100.
- **Do** tint every neutral toward hue 250 (blue-slate), even at chroma 0.005.
- **Do** use the three-voice typography system consistently: serif for scholarly identity, sans for interface, mono for all mathematical values.
- **Do** cap body text line length at 65-75ch.
- **Do** use `ring-1 ring-inset` with semantic color for warning/notice containment.
- **Do** show all backend warnings prominently and elegantly. Warnings are pedagogically valuable.
- **Do** use tabular-nums on all numeric displays for proper column alignment.
- **Do** use purposeful animation: smooth tab transitions, gentle hover states, clean result appearance, copy-button reveal.
- **Do** use exponential ease-out curves (quart/quint/expo) for all transitions.
- **Do** respect `prefers-reduced-motion` by disabling non-essential animations.
- **Do** provide visible focus states on every interactive element (3px ring, ring/50 opacity).
- **Do** associate validation errors with their relevant inputs using aria-describedby or proximity.
- **Do** preserve plain-text formula output alongside KaTeX rendering for accessibility.
- **Do** use color with semantic purpose: indigo for interactive, amber for caution, coral for error, cyan for informational.

### Don't:

- **Don't** use `#000` or `#fff`. Every neutral must carry the blue-slate tint.
- **Don't** use `border-left` or `border-right` greater than 1px as a colored accent stripe on cards, warnings, or callouts. Use inset rings or background tints instead.
- **Don't** use gradient text (`background-clip: text` with gradient). Use solid color with weight or size for emphasis.
- **Don't** use glassmorphism, backdrop-blur, or frosted-glass effects decoratively.
- **Don't** use bounce or elastic easing. These feel dated and toy-like.
- **Don't** animate CSS layout properties (width, height, margin, padding).
- **Don't** nest cards inside cards. A card is a top-level container; its internal structure uses sections, separators, and tonal layering.
- **Don't** use modals as the first solution. Exhaust inline and progressive alternatives.
- **Don't** hide warnings or errors to make the page look cleaner. Warnings are features.
- **Don't** use Inter, Arial, or system-default sans-serif as the primary font. IBM Plex Sans is the interface voice.
- **Don't** use purple-to-blue gradients, neon accents, or "AI app" aesthetic patterns.
- **Don't** use the hero-metric template (big number, small label, gradient accent). The summary card uses a grid of labeled values, not hero metrics.
- **Don't** use identical card grids (same-sized cards with icon + heading + text repeated). Each result section has distinct internal structure.
- **Don't** use oversized colorful buttons or toy-calculator styling.
- **Don't** sacrifice warning visibility, error clarity, or mathematical precision for visual aesthetics.
- **Don't** use em dashes in UI copy. Use commas, colons, semicolons, periods, or parentheses.
- **Don't** use slow transitions (>300ms) or distracting shimmer effects.
- **Don't** use color as the only indicator of severity. Always pair with icon and text label.
