# Product

## Register

product

## Users

**Primary:** Students taking Numerical Analysis or similar courses who need to understand and verify interpolation methods, not just get a final number.

**Secondary:** Instructors and professors reviewing examples or preparing demonstrations. Engineers and technical users who need quick interpolation checks with full method visibility.

**Context:** The user is working through polynomial interpolation problems (coursework, lecture verification, or engineering spot-checks). They need to see the work, not just the answer. They arrive with data points or a function, and they leave with method-specific outputs rendered in proper mathematical notation alongside warnings about numerical behavior.

## Product Purpose

A numerical-analysis calculator and workbench for interpolation and polynomial approximation. The user enters points, x-values with a function, or a function-interval-node setup, then receives the interpolating polynomial and method outputs in a clear, lecture-aligned format.

**As a learning tool:** Show Lagrange basis polynomials, summation and final polynomial forms, Newton divided-difference tables, Newton polynomial form, Barycentric weights and evaluations, Neville triangular tables, and warnings about high degree, extrapolation, close x-values, Runge behavior, and method disagreement.

**As a verification tool:** Compare selected methods side by side, show evaluated values at target x-values, show f(x) and absolute error when the original function is known, show graph comparison from backend graph data, and preserve backend-generated results exactly.

**Critical boundary:** The frontend makes the math understandable and trustworthy. It must not become the math engine. The backend remains the source of truth for parsing, validation, precision, interpolation, method tables, warnings, graph-ready data, and numerical correctness.

## Brand Personality

Scholarly, precise, trustworthy, premium, modern.

- **Scholarly:** Aligned with numerical analysis lectures, formulas, method tables, and academic notation.
- **Precise:** Values, warnings, methods, and graph data should feel exact and carefully handled.
- **Trustworthy:** The UI makes users confident that backend results, warnings, and method comparisons are not being hidden or decorated away.
- **Premium:** Deliberate layout, typography, spacing, color, motion, and interaction polish. Not decorative clutter.
- **Modern:** Calm, intentional, and contemporary without chasing trends.

## Anti-references

- Generic SaaS dashboard with random cards, gradients, and startup-style polish
- Purple-gradient AI app aesthetic
- Plain admin form
- Toy calculator with oversized colorful buttons
- Cluttered 2005 academic software
- Raw JSON or debug-panel feeling
- Hiding warnings or errors to make the page look cleaner
- Overusing thick left-border callouts or obvious AI UI tropes
- Inter-heavy generic typography that makes the app feel like every other generated dashboard
- Overwhelming density and visual clutter (Wolfram Alpha problem)
- Document-editor appearance (Overleaf problem)
- Too playful or graph-only (Desmos problem)
- Dense, intimidating, old-school tool clutter (MATLAB problem)

## Design Principles

1. **Show the work, not just the answer.** Every method output, intermediate table, and warning the backend produces should be visible and readable. The UI is a window into the computation, not a summary of it.

2. **Math deserves typographic respect.** Formulas, tables, and numeric values are first-class content. They get proper rendering, adequate space, and clear hierarchy. They are never afterthoughts crammed into generic containers.

3. **Warnings are features, not blemishes.** High-degree warnings, conditioning alerts, and method disagreements are pedagogically valuable. Display them prominently and elegantly. Never hide them for aesthetics.

4. **Precision over decoration.** Every visual choice (spacing, color, depth, motion) should serve clarity or hierarchy. If a design element does not help the user understand or trust the output, remove it.

5. **The backend is the authority.** The frontend renders, organizes, and presents. It does not recompute, reinterpret, or editorialize. What the backend says is what the user sees.

## Reference Synthesis

The ideal feel combines: Overleaf's scholarly tone, Desmos's approachable math clarity, MATLAB's technical seriousness, and Wolfram-style structured results, but simpler and cleaner than any of them individually.

The UI should feel like a high-quality scientific workbench, a polished mathematical instrument, a premium technical calculator: modern, calm, and intentional, designed for serious numerical-analysis work.

## Accessibility & Inclusion

Target: WCAG AA compliance where practical.

**Form inputs:**
- Every input needs a visible label or accessible label.
- Input groups need helper text where the expected format is not obvious.
- Validation errors must be shown in text, not only color.
- Backend field-related errors should be associated with the relevant input where practical.

**Warnings and errors:**
- Must be keyboard reachable and readable.
- Color must not be the only indicator of severity.
- Never sacrifice warning visibility for aesthetics.

**Tables and navigation:**
- Tables need proper headers.
- Tabs must be keyboard usable.
- Focus states must be visible.

**Motion and perception:**
- Respect reduced-motion preferences; use subtle motion only.
- Math formulas should remain readable and copyable.
- If KaTeX output is not fully screen-reader friendly, preserve nearby plain-text formula output as a fallback.

**Rationale:** This app is form-heavy, so labels, instructions, and error suggestions matter. WCAG requires labels and instructions for user input and recommends suggestions when input errors are detected and correction is known. The UI should always show backend status, validation state, warnings, and recovery guidance clearly.
