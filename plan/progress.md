# Progress

Running log of what is built, what was decided along the way, and what comes
next. Updated at the end of each task.

## Public demo deployment

The public mock demo now builds and deploys through `.github/workflows/pages.yml`.
Pushes to main deploy after unit tests, fixture validation, and the production
build pass. Pull requests run the same checks without deploying.

- Demo controls are in `src/components/demo-controls.tsx` and ship in production.
  Arrow-key shortcuts remain development-only. League, season, stage, and the
  fictional-data label are visible in the collapsed control.
- Loading failures keep the last successful table and controls available, with
  a retry action and an explicit previous-table notice.
- Team cards support button activation, an accessible description relationship,
  hover transfer, and viewport-constrained placement with regression tests.
- The README covers local setup, Pages deployment, and synthetic-data limits.
  The mock validator must not be reused unchanged for real provider standings.
- Real data, favourites, and the multi-league shell remain future work.

The sections below record earlier development decisions. References to a
missing deploy workflow or a development-only switcher describe the old state.

## Status

| Task | State | Notes |
| ---- | ----- | ----- |
| 01 Scaffolding | Done | Commit `bca6b89`, pushed |
| 02 Mock data and dev switcher | Done | Commit `acebe73` |
| 03 Layout engine | Done, then rebuilt | The tier and gap engine it describes is gone, see below |
| 04 Table UI | Done, then rebuilt | Header, fallback panel and gap labels went with it |
| 05 Leagues and shell | Next | Owns the league config, and has an open question the rebuild created |
| 06 Data pipeline | Not started | |
| 07 Polish and launch | Not started | Now also owns the Pages deploy |

## The rebuild: a row per point value

Tasks 03 and 04 built what CLAUDE.md originally described: occupied levels,
gaps between them, pixel heights shared out proportionally, and a four tier
ladder (Comfortable, Compact, Dense, Micro) that degraded row content until the
table fit the screen. It worked and it was well tested, and it was the wrong
product.

The problem showed up on the 20 team final tables. Fitting them meant Dense or
Micro rows, and a Micro row is a 9px crest and a points number: a table you
cannot read, whose only remaining virtue is that it fits. Meanwhile the whole
apparatus of gap minimums, per-point caps and `MIN_GAP_TRUTH` existed to stop
proportional gap arithmetic from lying about distance on a tight screen.

Both problems have the same answer, and it is a simpler layout than either:

**Every point value gets a row, and every row is the same height.** A gap is not
a spacer, it is the run of empty rows where nobody scored that many points.
Three empty rows is three points, everywhere, always. There is no proportional
maths left to get wrong, so `MIN_GAP_TRUTH`, the gap floors, the per-point cap
and the tier ladder all deleted themselves. `layout-engine.ts` went from 393
lines to 108.

**Rows have a floor of 22px and the grid does not shrink below it.** A wide
spread on a short screen makes the grid taller than the viewport and the page
scrolls. This is the change of mind: the original rule was that the table always
fits, and the new rule is that a row is always readable. A row too short to hold
a team name is not worth fitting on screen.

Consequences worth knowing:

- **The name is now the thing that never goes.** The Dense and Micro tiers
  dropped names for tooltips; nothing does that any more. Names truncate, and
  every chip carries its full record in a `title`.
- **The header and the "too small" panel are gone.** Nothing sits above or below
  the axis: the table is the page. There is no viewport short enough to need a
  fallback, because scrolling is the fallback.
- **Gap labels are gone too.** An empty row keeps its own points number in the
  left column, which says "97, nobody" more precisely than a "12 pts" caption in
  the middle of a void ever did.
- **The engine is handed the viewport height, not a container's.** The element
  around the table is now as tall as the table, so measuring it would be asking
  the grid about itself. `use-viewport-height.ts` reads `window.innerHeight`,
  which keeps the grid out of a feedback loop with its own size.

## What exists now

```
scripts/            mock generation and validation, run by node directly
tests/              node:test unit tests, also run by node directly
src/types/          standings.ts is the contract shared with the future pipeline
src/data/           asset url resolution and the static JSON fetchers
src/lib/            layout-engine.ts (the grid), row-metrics.ts (what fits in a
                    row), matches-behind.ts, the accent colours, the viewport
                    and element hooks
src/components/     the table, the team chips and the tooltip card
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
change league. It starts collapsed to a pill in the bottom right, because the
open panel floats over the axis and was hiding the last six rows of a 20 team
table, which is the part worth looking at.

`src/lib/relative-time.ts` is currently unused: it belonged to the league header
the rebuild deleted. It stays because the "updated X ago" label it formats is
task 05 and 07 work.

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
  ago" label will read in months while developing against mocks.
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
  `TeamStanding`. Tests build a grid from a list of point totals, and the module
  has no imports at all, which is what keeps it runnable under node.
- **Type has a floor of 12px and the row floor is derived from it.** Nothing is
  set smaller than 12px, name, points or position, because below that a name is
  decoded rather than read. A 12px line paints about 16.2px, and with the
  padding a row keeps at each end, 22px is the shortest row it fits into. So
  `MIN_ROW_HEIGHT` is not a number anyone picked: lowering it means shrinking
  the type, which is the thing the floor exists to protect. The row floor was
  24px, then 20px on the argument that a 10px name still reads, and that
  argument is what the 12px rule overturns.
- **A tall row spends its height on lines, not on bigger crests.** Once a row
  can paint more than one line of names, teams sharing that total wrap instead
  of squeezing: `nordic-serien-1`, where all 18 teams are level, is one row the
  height of the screen with a line per team. Content sizes are capped precisely
  so the leftover height goes there.
- **Matches behind are measured against the busiest team, not a round number.**
  A points axis asserts a distance, and a team short of a fixture has not earned
  its place on it, so the chip carries a mark. The reference has to be the
  highest played count in the table: API-Football standings report played per
  team and no dependable current round, and taking the maximum also gets the
  postponed-round case right by marking nobody. The mark is "-2" where there is
  room and a dot where there is not, and it is kept when the position is
  dropped, because a distance that may be wrong matters more than a rank.
- **It reads as a minus, not as games in hand.** Football says a team has two
  games in hand, which is the advantage framing and the reason the module was
  first called that. The axis is showing the opposite: a team sitting lower than
  its season will leave it, because of matches it has not played. So the UI, the
  copy and now the module say matches behind, and the sign agrees with what the
  reader is looking at.
- **Every chip opens a card rather than a browser tooltip.** A chip can be nine
  characters of a name, and a native `title` is a hover only, unstyleable, half
  second delayed answer to that. The card carries points, played, W/D/L, goals,
  difference and form, opens on hover, focus or tap, and closes on leave, blur,
  Escape or a press elsewhere. It renders through a portal because the row cell
  clips its overflow, and it re-reads its anchor on scroll rather than
  remembering it, since the page underneath it moves.
- **The mock generator can postpone fixtures.** A `missed` entry per league
  takes games off a team at one snapshot, and its points follow from the games
  it actually played rather than being pro rated, which is what makes the mark
  worth rendering: the team sits lower than its season will leave it. Six teams
  across five snapshots carry marks of +1, +2 and +3, alone on a level and
  sharing one. Snapshot 5 and the all square opener are deliberately left level,
  a finished season having no games in hand and that opener being defined by
  everybody having played the same single round.
- **`validate-standings.ts` now allows a team to be behind the round count**, by
  up to three games, and still refuses any team ahead of it. That relaxation is
  part of the contract the real pipeline will be checked against.
- **Chip widths are a ceiling, not a column layout.** Teams take the width their
  own name needs and sit next to each other from the left; `perLine` only stops
  any one of them growing past its share, which is what holds the wrapped line
  count to what the row can paint. Two teams on a total therefore read as two
  teams side by side, not one at each end of the row.
- **The document scrolls, never the table.** `index.css` styles the window
  scrollbar and reserves its gutter with `scrollbar-gutter: stable`, so
  switching between a table that fits and one that does not never shifts the
  axis sideways.
- **Zone bands are still not built.** They are optional in task 04 and they are
  per league data (title, Europe, relegation) belonging to the config task 05
  introduces.
- **`src/lib/league-accent.ts` is a placeholder for the league config.** The
  table needs an identity colour now, task 05 owns the file that should hold it.

## Open questions for later

- **The desktop multi-league grid needs rethinking**, since a grid cell is no
  longer a height the table will respect. See `plan/05-leagues-and-shell.md`.
- **The matches behind mark has no legend.** The amber "-2" and its dot are
  `aria-hidden`, and the card that explains them has to be opened per team.
  A reader who never hovers sees an amber number with no key anywhere on screen.
  The accessibility pass in task 07 should decide whether the table needs a
  visible legend, and whether 20 chips as 20 tab stops is the right keyboard
  order or wants grouping.
- **The tooltip card is not covered by a test.** There is no jsdom here by
  choice, so its positioning, the portal and the open and close gestures are
  checked by hand only. Worth remembering before it grows more behaviour.
- **`FULL_NAME_WIDTH` (185px) and `RANK_WIDTH` (72px) are eyeballed**, not
  measured. They suit the mock names at the mock type sizes. Real club names are
  longer and may want measuring properly.
- **TypeScript 7.0.2** was installed as latest, the Go rewrite. Everything
  passes on it. Pin to `^5` if any tooling turns out to disagree with it.
- **React 18** is pinned per CLAUDE.md while 19 is the current default from
  pnpm. Worth revisiting whether CLAUDE.md should move to 19 instead.
- **A very wide spread is a long scroll.** A 75 point spread at the 22px floor
  is 76 rows and 1672px of page, more than two screens on a laptop. That is the
  intended
  trade now, but task 07 should look at whether the leader stays findable after
  scrolling down to the relegation zone.
- **No favicon**, so every load logs a 404 for `/favicon.ico`. Task 07.

## Next: task 05, leagues and shell

Per `plan/05-leagues-and-shell.md`. Waiting there:

- The **leagues config file** should absorb `src/lib/league-accent.ts`, which
  holds the gradient per league slug and a hash fallback for anything missing.
- **Zone bands** need that same config. Every row is at a known offset in a
  uniform grid, so a band is an absolutely positioned element behind the rows.
- **The desktop layout question above** should be settled before the grid is
  built rather than during.

The 25 snapshots stay the test set. The two extremes to keep checking are
`nordic-serien-1` (every team level, a single row, now one line per team) and
`albion-league-5` (a 75 point spread, which is 76 rows and scrolls on anything
short of a very tall screen). `pnpm dev` plus the arrow keys walks all of them.

For the matches behind mark, the snapshots that carry one are `albion-league-4`
(the leader on +2), `iberia-primera-3` (+1 in the title race, +2 near the foot),
`rheinland-liga-2` (+1 on a level shared by five teams, which is where the dot
fallback shows up), `vistula-ekstraliga-3` and `nordic-serien-2` (+3).
