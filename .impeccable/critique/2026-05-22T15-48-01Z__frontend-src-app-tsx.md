---
target: frontend/src/App.tsx
total_score: 29
p0_count: 0
p1_count: 0
timestamp: 2026-05-22T15-48-01Z
slug: frontend-src-app-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Health indicator present, loading skeletons good; no progress feedback during computation beyond "Computing…" |
| 2 | Match System / Real World | 4 | Domain-appropriate language throughout; mathematical notation used correctly |
| 3 | User Control and Freedom | 3 | Reset available; no undo for individual field changes; can't revert to previous computation |
| 4 | Consistency and Standards | 3 | Mostly consistent; method selector uses custom checkboxes while other inputs use standard controls |
| 5 | Error Prevention | 2 | No inline validation before submit; duplicate x-values only caught server-side; no confirmation for reset |
| 6 | Recognition Rather Than Recall | 3 | Quick Reference panel helps; evaluation targets section unclear without prior knowledge |
| 7 | Flexibility and Efficiency | 2 | No keyboard shortcuts; no way to paste tabular data; no presets or examples to load |
| 8 | Aesthetic and Minimalist Design | 3 | Clean and purposeful; results section is long and undifferentiated vertically |
| 9 | Error Recovery | 3 | Error messages are clear with codes; function validation available; errors don't wipe form state |
| 10 | Help and Documentation | 3 | Quick Reference sidebar is good; no contextual tooltips on precision or node strategy |
| **Total** | | **29/40** | **Good** |

## Anti-Patterns Verdict

**LLM assessment**: Passes the slop test. Three-voice typography, OKLCH palette, inset ring warnings, and custom method selector with role badges are distinctive and intentional. Results section card repetition is the only concern.

**Deterministic scan**: Clean. Zero findings.

## Overall Impression

Well-crafted scientific tool that respects its domain. Biggest opportunity: interaction flow asks users to configure everything upfront, compute, then scroll through long results. No progressive reveal, no quick iteration path, no navigational structure in results.

## What's Working

1. Typography system: three-voice separation creates scholarly credibility
2. Warning treatment: inset rings with semantic color, icon + label + message
3. Method selector: card-based multi-select with role badges teaches while choosing

## Priority Issues

**[P2] Results section lacks navigation for its length**
After computation, ~1500px vertical scroll with no way to jump to sections or collapse irrelevant ones.
Fix: Sticky mini-nav or anchor links; collapsible sections.

**[P2] No inline validation or error prevention before compute**
Duplicate x-values, empty fields, invalid expressions only caught server-side.
Fix: Client-side validation on blur, inline function validation, automatic behavior.

**[P2] No presets, examples, or quick-start path**
First-time users face empty fields with no way to get a quick successful result.
Fix: 2-3 preset examples as buttons above input area.

**[P3] Graph lacks interactivity and context**
Static chart with no zoom, no node labels on hover, no correlation to tables.
Fix: Node labels, brush/zoom, crosshair cursor.

**[P3] Quick Reference sidebar disappears on smaller desktop viewports**
Hidden below lg breakpoint; laptop users lose contextual help.
Fix: Collapsible panel or popover always visible.

## Persona Red Flags

**Alex (Power User)**: No keyboard shortcuts for Compute. Can't paste tabular data. No bulk-add for evaluation targets. Precision slider requires mouse.

**Jordan (First-Timer)**: Tab labels assume prior knowledge. "Node Strategy" unexplained. "Evaluation Targets" unclear. No placeholder examples in inputs. Results volume overwhelming with no guidance.

**Sam (Accessibility-Dependent)**: KaTeX aria-label doesn't convey formula content. Precision slider has empty aria-valuetext. Color partially distinguishes notice types (icons help).

## Minor Observations

- Header backdrop-blur is borderline glassmorphism
- HealthIndicator uses raw Tailwind colors instead of semantic palette
- Footer "Backend owns numerical correctness" is developer-facing language
- Neville empty state doesn't link to Evaluation Targets input
- Newton divided-difference table lacks header row
