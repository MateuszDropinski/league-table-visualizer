# Progress

Running log of what is built, what was decided along the way, and what comes
next. Updated at the end of each task.

## Status

| Task | State | Notes |
| ---- | ----- | ----- |
| 01 Scaffolding | Done | Commit `bca6b89`, pushed |
| 02 Mock data and dev switcher | Done | Commit `acebe73`, not yet pushed |
| 03 Layout engine | Done | Pure module plus 15 tests, not yet wired to the UI |
| 04 Table UI | Next | Renders the engine output, replaces the placeholder list |
| 05 Leagues and shell | Not started | |
| 06 Data pipeline | Not started | |
| 07 Polish and launch | Not started | Now also owns the Pages deploy |

## What exists now

```
scripts/            mock generation and validation, run by node directly
tests/              node:test unit tests, also run by node directly
src/types/          standings.ts is the contract shared with the future pipeline
src/data/           asset url resolution and the static JSON fetchers
src/lib/            layout-engine.ts, the points axis maths, plus relative time
src/dev/            mock switcher, dropped from production builds
public/crests/      24 generated SVG crests
public/data/mock/   25 snapshots plus index.json
```

Commands:

```bash
pnpm dev            # http://localhost:5173/league-table-visualizer/
pnpm build          # tsc -b then vite build
pnpm typecheck
pnpm test           # node --test over tests/, no browser and no test framework
pnpm mock:generate  # rewrites public/crests and public/data/mock
pnpm mock:validate  # checks every standings file against real table rules
```

In the dev switcher, left and right arrows change season stage, up and down
change league.

## Decisions worth remembering

- **Deploy moved from task 01 to task 07.** The app is developed and validated
  locally against mocks and goes public only once it is worth looking at. Vite
  `base` is already set to the Pages subpath, so wiring the workflow later needs
  no app changes.
- **Mock data lives in `public/data/mock/`, crests in `public/crests/`.** Both
  directories are wiped and rewritten by the generator, which is why they are
  kept clear of the `public/data/<league>.json` pattern the real pipeline will
  use.
- **Mock generation is deterministic.** Seeded randomness and fixed timestamps,
  so regenerating without editing `scripts/mock-source.ts` produces an empty
  diff. The cost is that `fetchedAt` describes a past season, so the "updated X
  ago" label reads in months while developing against mocks.
- **Points come from a points per game profile per league**, not from simulated
  matches. Multiplying by rounds played keeps totals plausible at every stage,
  and equal ppg values are what create the shared point levels and exact ties
  each league is meant to exercise.
- **`scripts/validate-standings.ts` is written against the published JSON**, not
  against generator internals, so it becomes the contract check for the real
  API-Football pipeline in task 06 without changes.
- **No test framework.** `node --test` with type stripping runs the TypeScript
  tests directly, the same way the mock scripts already run, so there is no
  vitest or jsdom to install and nothing extra in the bundle. Tests live in
  `tests/` rather than beside the source because they import with real `.ts`
  extensions, which only the node tsconfig allows.
- **The layout engine is generic over `{ points: number }`**, not tied to
  `TeamStanding`. Tests can build a table from a list of point totals, and the
  module has no imports at all, which is what keeps it runnable under node.
- **Gaps outrank rows for the residual space.** CLAUDE.md picks the row tier
  first, but growing rows greedily inside Comfortable would push every gap onto
  its minimum and make a 12 point gap look like a 3 point one, which is the one
  thing the product cannot do. So rows take the tier minimum, gaps take what
  they can up to 14px per point, and only what is left after that grows rows
  continuously towards 56px. On a 900px screen the final Albion table lands at
  32px rows, and both are satisfied at once at 2170px.
- **Small gaps do clamp to the floor on tight screens**, and that is intended.
  At 900px the 1 and 2 point gaps in a 75 point spread sit at 8px while every
  larger gap stays exactly proportional. The alternative is gaps that vanish.
- **Layout output carries `top` offsets** as well as heights, so task 04 can
  absolutely position rows and animate resizes rather than reflowing a stack.

## Open questions for later

- **TypeScript 7.0.2** was installed as latest, the Go rewrite. Everything
  passes on it. Pin to `^5` if any tooling turns out to disagree with it.
- **React 18** is pinned per CLAUDE.md while 19 is the current default from
  pnpm. Worth revisiting whether CLAUDE.md should move to 19 instead.
- The current screen is still the **placeholder ranked list**, not the product.
  The engine exists but nothing renders it yet. Task 04 replaces the list.
- **A crowded level cannot grow taller**, because row height is uniform by
  invariant. `nordic-serien-1` puts all 20 teams on one row, so task 04 has to
  degrade those chips to logo-only rather than wrapping onto a second line.
- **Gap minimums and the 14px per point cap are guesses** that hold up against
  the 25 snapshots but have never been looked at. Worth revisiting once the
  table is on screen in task 04.

## Next: task 04, the table UI

Per `plan/04-table-ui.md`: a component that measures its container with a
ResizeObserver, calls `computeLayout`, and renders what comes back. The engine
answers every geometry question already, so the work is entirely visual.

What the engine hands over, from `src/lib/layout-engine.ts`:

- `computeLayout(teams, availableHeight)` returns either `fits: true` with a
  tier, one uniform `rowHeight`, and `items` (rows and gaps interleaved, each
  with `height` and `top`), or `fits: false` with the `requiredHeight` that
  drives the too small fallback panel.
- `gap.showLabel` marks the gaps that have earned their "12 pts" caption.
- `surplus` is greater than zero when the table should top align and stay
  compact rather than stretch.
- `TIERS` carries the four tiers by id, which is what the chip content ladder
  keys off.

The 25 snapshots are the test set. The two extremes to keep checking are
`nordic-serien-1` (every team level, one row, no gaps at all) and
`albion-league-5` (20 rows and a 75 point spread including one 19 point gap).
