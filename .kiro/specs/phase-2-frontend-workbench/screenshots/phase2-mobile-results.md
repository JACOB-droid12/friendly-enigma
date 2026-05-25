# Phase 2 — Mobile QA results

Browser QA scope: 320px viewport overflow check (Task 7.10, Requirement
R14.1, R17.8, R17.9). Executed in Chrome DevTools MCP against
`http://localhost:5173/` while the backend ran at
`http://127.0.0.1:8000`.

## Scenario PHASE2-MOBILE-01 — 320px overflow check

- Status: **PASS**
- Viewport tested: 320 × 800 (mobile + touch emulation; verified
  `window.innerWidth === 320`).
- Inputs exercised:
  1. **Cubic Spline (lecture three-point)** example, then Compute,
     then switch to the **Methods** tab so the segments table renders.
  2. **Hermite Divided Difference (Bessel-style)** example, then
     Compute, then switch to the **Methods** tab so the 6x6 repeated-
     node divided-difference table and the long expanded-LaTeX line
     render. (Selected as a second stress case: it is one of the
     widest layouts the workbench produces.)
- Screenshots:
  - `phase2-mobile-01-320px.png` — full-page screenshot of the cubic-
    spline result on the Methods tab at 320px (segments table visible
    inside `overflow-x-auto rounded-lg`).
  - `phase2-mobile-01-320px-hermite.png` — full-page screenshot of the
    Hermite divided-difference result on the Methods tab at 320px
    (repeated-node table, 6x6 divided-difference table, long expanded
    LaTeX).

### DOM assertion output (R14.1)

DOM assertion: `document.documentElement.scrollWidth <=
document.documentElement.clientWidth`. Run on the main document on
the result page after each Compute via
`mcp_chrome_devtools_evaluate_script`.

| State | scrollWidth | clientWidth | bodyScrollWidth | bodyClientWidth | viewportWidth | overflowing |
|---|---|---|---|---|---|---|
| Cubic spline result, Methods tab (segments table visible) | 320 | 320 | 320 | 320 | 320 | `false` |
| Hermite DD result, Methods tab (6x6 DD table + long expanded LaTeX) | 320 | 320 | 320 | 320 | 320 | `false` |

The offender walk (`document.body.querySelectorAll('*')` looking for
elements with `getBoundingClientRect().right > viewportWidth + 0.5`)
returned an empty array in both states: no element extends past the
320px viewport at the page level. The wide tables and the 700+
character expanded-LaTeX line are contained by their existing
horizontal-scroll wrappers (R14.3) and do not lift the document
scroll width.

### Network URL set (R1.2)

Captured via `mcp_chrome_devtools_list_network_requests` (resource
types `xhr` + `fetch`). Only the contract-permitted endpoints were
hit, both via the Vite dev proxy on port 5173:

- `GET /health` (multiple, healthcheck poll)
- `POST /api/interpolate` (twice — once for the cubic spline compute,
  once for the Hermite divided-difference compute)

`POST /api/validate-function` was not exercised in this scenario
because both example inputs use the `points` mode, which never
validates a function expression. R1.2's allow-list is `GET /health`,
`POST /api/interpolate`, `POST /api/validate-function`; nothing
outside that set was observed.

### Console (R17 hygiene)

No `error` or `warn` console messages were emitted during the run.

### Deviations / notes

- The Chrome DevTools `resize_page` tool resizes the outer browser
  window rather than the page viewport, which left
  `window.innerWidth === 500` after the initial resize. The actual
  320px viewport was achieved by switching to device viewport
  emulation via `mcp_chrome_devtools_emulate` with
  `viewport: "320x800x1,mobile,touch"`. All numbers above were
  captured under that 320px emulation, not the wider browser window.
  This deviation matches the spec intent of "viewport ≥320px"
  (design.md §3 architecture diagram) and R14.1.
