# Progress

Running log of what is built, what was decided along the way, and what comes
next. Updated at the end of each task.

## Status

| Task | State | Notes |
| ---- | ----- | ----- |
| 01 Scaffolding | Done | Commit `bca6b89`, pushed |
| 02 Mock data and dev switcher | Done | Commit `acebe73`, not yet pushed |
| 03 Layout engine | Next | |
| 04 Table UI | Not started | |
| 05 Leagues and shell | Not started | |
| 06 Data pipeline | Not started | |
| 07 Polish and launch | Not started | Now also owns the Pages deploy |

## What exists now

```
scripts/            mock generation and validation, run by node directly
src/types/          standings.ts is the contract shared with the future pipeline
src/data/           asset url resolution and the static JSON fetchers
src/dev/            mock switcher, dropped from production builds
public/crests/      24 generated SVG crests
public/data/mock/   25 snapshots plus index.json
```

Commands:

```bash
pnpm dev            # http://localhost:5173/league-table-visualizer/
pnpm build          # tsc -b then vite build
pnpm typecheck
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

## Open questions for later

- **TypeScript 7.0.2** was installed as latest, the Go rewrite. Everything
  passes on it. Pin to `^5` if any tooling turns out to disagree with it.
- **React 18** is pinned per CLAUDE.md while 19 is the current default from
  pnpm. Worth revisiting whether CLAUDE.md should move to 19 instead.
- The current screen is a **placeholder ranked list**, not the product. It has
  fixed 26px rows that happen to fit 20 teams, with no fit guarantee. Task 03
  replaces it with the real engine.

## Next: task 03, the layout engine

Per `plan/03-layout-engine.md`, the substance is:

1. Group teams into occupied point levels and compute the gaps between them.
2. Pick the largest row tier that fits, then distribute residual space across
   gaps proportionally to their size in points, subject to a per-gap minimum
   and a per-point maximum.
3. Fall back to a friendly panel, never a broken or scrolling table, when even
   the Micro tier cannot fit.

The 25 snapshots are the test set. The two extremes to keep checking are
`nordic-serien-1` (every team level, one row, no gaps at all) and
`albion-league-5` (20 rows and a 75 point spread including one 19 point gap).
