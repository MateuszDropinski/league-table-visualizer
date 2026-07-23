# Progress

Running log of what is built, what was decided along the way, and what comes
next. Updated at the end of each task.

## Status

| Task | State | Notes |
| ---- | ----- | ----- |
| 01 Scaffolding | Done | Commit `bca6b89`, pushed |
| 02 Mock data and dev switcher | Done | Commit `acebe73`, not yet pushed |
| 03 Layout engine | Done | Pure module plus 17 tests |
| 04 Table UI | Done | Points axis on screen, zone bands deferred to task 05 |
| 05 Leagues and shell | Next | Also owns the league config the table now needs |
| 06 Data pipeline | Not started | |
| 07 Polish and launch | Not started | Now also owns the Pages deploy |

## What exists now

```
scripts/            mock generation and validation, run by node directly
tests/              node:test unit tests, also run by node directly
src/types/          standings.ts is the contract shared with the future pipeline
src/data/           asset url resolution and the static JSON fetchers
src/lib/            layout-engine.ts, the points axis maths, plus the content
                    ladder, the accent colours and the resize hook
src/components/     the table, the header, the chips and the fallback panel
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
- **Layout output carries `top` offsets** as well as heights, so the table can
  absolutely position rows and animate resizes rather than reflowing a stack.
- **A tier that flattens the axis is refused, even when it fits.** This is the
  one place the implementation reads CLAUDE.md against its own letter. Picking
  the largest tier that fits put a 20 team final table in Comfortable rows on a
  900px screen, where 640px of rows left 195px of axis for 75 points, 13 of the
  19 gaps sat on their floor, and the 19 point chasm rendered 4.9 times the
  smallest gap instead of 19. So `computeLayout` now solves every tier that fits
  and takes the largest whose tallest gap reaches at least 60 percent of its
  true ratio against the shortest (`MIN_GAP_TRUTH`). The same table now renders
  Compact with an exact axis. This is the core principle applied literally:
  degrade row content, never the proportionality of gaps.
- **Gap floors dropped to 8/4/3/2 across the ladder** (CLAUDE.md allows 2 to 8).
  At 6px, Compact started misrepresenting a wide spread at around 780px and the
  table gave up its names for Dense far too early. At 4px, names survive down to
  roughly 700px of axis.
- **Tier choice is monotonic in container height** across all 25 snapshots, so
  dragging a window never flips the table back and forth. There is a test.
- **Zone bands are not built.** They are optional in task 04 and the bands are
  per league data (title, Europe, relegation) that belongs in the config task 05
  introduces. Inventing them for five fictional leagues first would have meant
  throwing the guesses away.
- **`src/lib/league-accent.ts` is a placeholder for the league config.** The
  table needs an identity colour now, task 05 owns the file that should hold it.

## Open questions for later

- **TypeScript 7.0.2** was installed as latest, the Go rewrite. Everything
  passes on it. Pin to `^5` if any tooling turns out to disagree with it.
- **React 18** is pinned per CLAUDE.md while 19 is the current default from
  pnpm. Worth revisiting whether CLAUDE.md should move to 19 instead.
- **`MIN_GAP_TRUTH` at 0.6 is a judgement call.** It reads well on all 25
  snapshots but it is the number that decides when a table gives up its names,
  so it is the first thing to reach for if the ladder ever feels wrong.
- **The chip width thresholds are eyeballed**, not measured. `chipMode` switches
  on 170px and 104px per team, which suits the mock names at the mock type
  sizes. Real club names are longer and may want measuring properly.
- **Micro rows leave the right hand side of a wide screen empty**, since the
  content is a 9px crest and a points number. It is honest but stark. Worth a
  look in task 07.
- **No favicon**, so every load logs a 404 for `/favicon.ico`. Task 07.

## Next: task 05, leagues and shell

Per `plan/05-leagues-and-shell.md`. Two things there are already waiting:

- The **leagues config file** should absorb `src/lib/league-accent.ts`, which
  holds the gradient per league slug and a hash fallback for anything missing.
- **Zone bands** were left out of task 04 because they need that same config.
  The table positions everything from `layout.items[].top`, so a band is an
  absolutely positioned element behind the rows, in the same coordinate space.

The 25 snapshots stay the test set. The two extremes to keep checking are
`nordic-serien-1` (every team level, one row, no gaps at all) and
`albion-league-5` (20 rows and a 75 point spread including one 19 point gap).
`pnpm dev` plus the arrow keys walks all of them.
