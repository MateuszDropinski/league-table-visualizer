# Task 03: Layout engine (fit-always points axis)

> Superseded. This was built and then replaced by the row per point value grid.
> Tiers, gap heights, the per-point cap and the "too small" result no longer
> exist. Kept as the record of what was tried and why it gave way. The current
> design is in CLAUDE.md, and the reasoning is under "The rebuild" in
> `plan/progress.md`.

## Goal
A pure, well-tested function that turns standings plus a viewport height into
an exact vertical layout: row tier, row height, and the pixel height of every
gap. This is the product's core and must be independent of React rendering.

## What to build
- A pure module: input is a list of (points, teams) plus available height;
  output is the chosen content tier, uniform row height, ordered list of
  rows and gaps with pixel heights, and per-gap metadata (point size, whether
  it should render a label).
- Logic per the algorithm in CLAUDE.md:
  - crop axis to occupied range (leader down to last team),
  - group shared point totals into single rows,
  - choose the highest content tier that fits, scale row height continuously
    within the Comfortable tier,
  - distribute residual space across gaps proportionally to point size, with
    per-gap minimums (tier dependent) and a per-point cap; top-align compact
    when caps leave surplus,
  - never produce a total height exceeding the viewport. There is no scroll
    fallback; the Micro tier plus 2px gap minimums is the floor,
  - if the viewport is below even the Micro floor (computed from team count
    and gap count, not hardcoded), return a distinct "too small" result so the
    renderer shows the fallback panel instead of a table.
- Unit tests covering: early season heavy sharing, late season wide spread,
  a single dominant gap next to several small ones (relative proportions must
  hold), tiny viewport (Micro tier), tall viewport early season (cap plus
  top-align), all teams equal points (one row, no gaps), viewport below the
  Micro floor (returns the "too small" result, never a scrolling layout).

## Why
Keeping this pure makes the trickiest logic testable without a browser and
lets the React layer stay a dumb renderer driven by ResizeObserver.
