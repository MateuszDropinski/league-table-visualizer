# Points-First League Table Visualizer

A React + TypeScript app that renders football league standings on a points axis
instead of a ranked list. The vertical distance between teams is proportional to
their points difference, so gaps and clusters are visible at first sight.

## Core product principle

The axis is one row per point value and every row is the same height, so the
distance between two teams is something you can count rather than judge: three
row intervals is three points, in every league, on every screen.

Row height is the viewport divided by the number of point values, floored at
`MIN_ROW_HEIGHT` (22px), which is what a crest and a readable name need. A wide
spread on a short screen therefore makes the grid taller than the viewport and
the page scrolls. That is deliberate: a row too short to hold a team name is not
worth fitting on screen, so the height a row needs wins over showing the whole
table at once.

This replaces the original fit-always rule, which degraded rows through a tier
ladder until a 20 team final table was a column of unreadable crests. What never
degrades is the axis itself: rows are never uneven, and no point value is ever
skipped, compressed or rounded away.

## Tech stack

- React 18, TypeScript, Vite
- Tailwind CSS, lucide-react
- Hosted on GitHub Pages (static only, no servers)
- Data pipeline: GitHub Actions cron workflow fetching API-Football, committing static JSON

## Dev commands

```bash
pnpm dev           # local dev server
pnpm build         # production build
pnpm preview       # preview production build
```

The project uses pnpm exclusively: `pnpm install`, `pnpm add`, and a committed
`pnpm-lock.yaml`. CI workflows must set up pnpm and use it for install and build.

The mock demo deploys through `.github/workflows/pages.yml` on push to main.
Pull requests run tests, fixture validation, and the production build without
deploying. Node 24 is selected through `.node-version`, and pnpm uses the
version in `package.json`. The real API pipeline remains future work.

## Mock-first development

The app is developed and validated entirely on mock data before any API key is
purchased. Mocks live as static JSON in the same shape and location pattern as
the real pipeline output, so switching to real data changes nothing in the app.

- 5 mock leagues with fictional but realistic team names.
- Each mock league is snapshotted at 5 season stages: 1/5 (start, heavy point
  sharing, near-empty axis), 2/5, 3/5, 4/5, and 5/5 (final table, widest spread).
- The stages differ in character across leagues to cover edge cases: a runaway
  leader with a huge gap, a tight cluster mid-table, a two-team title race far
  ahead of the pack, a relegation scrap with several teams level, all teams on
  equal points at round one.
- Some snapshots include postponements, so teams are behind on matches played: a
  runaway leader two matches light, a title race where one of the two has a game
  to play, and marked teams both alone on a level and sharing one. Their points
  come from the matches they actually played, so they sit lower on the axis than
  the season will leave them, which is the reason the mark is worth showing.
- Team logos are bundled example SVGs (simple generated crests in varied
  shapes and colors) referenced by the mock JSON, ensuring SVG logos render
  correctly at every row height from the floor up.
- A demo control panel (league + stage) exposes all 25 snapshots in development
  and production. Only the arrow-key shortcuts are development-only.
- Fixtures are generated per team and need not balance across the league.
  The mock validator checks fixture conventions, not real-season feasibility.

## Data architecture

There is NO runtime call to API-Football from the browser. Ever.
The API key must never appear in client code or the bundle.

- A scheduled GitHub Actions workflow (hourly cron) calls API-Football standings
  for each configured league and writes one JSON file per league into `public/data/`
  (for example `public/data/ekstraklasa.json`), then commits if content changed.
- The key lives in GitHub repository secrets as `API_FOOTBALL_KEY`.
- The frontend fetches these JSON files as plain static assets relative to the app base path.
- Each JSON file includes a `fetchedAt` timestamp which the UI shows as "updated X ago".
- No client-side cache TTL logic is needed; freshness is the pipeline's job.

League IDs (API-Football): Premier League 39, La Liga 140, Bundesliga 78,
Serie A 135, Ligue 1 61, Ekstraklasa 106.
API docs: https://www.api-football.com/documentation-v3

## Layout engine (the heart of the app)

The axis is a grid, not a stack of rows separated by spacers. Every point value
between the leader's total and the last team's total gets a row of exactly the
same height, whether or not a team holds it.

Definitions:
- Row: one point value. The teams on that total sit in it, in standings order.
  A row no team holds is an empty point level.
- Spread: leader's points minus last team's points. The row count is the spread
  plus one, since both ends are inclusive.
- The axis is cropped to the occupied range. Values below the last team are
  never rendered.

Invariants:
- Row height is uniform across every row, occupied or empty.
- Distance is exact by construction. A 12 point gap is twelve rows and a 3 point
  gap is three, so there is no proportional arithmetic to get wrong and no
  minimum height that can flatten a small gap into a lie.
- Row height never goes below `MIN_ROW_HEIGHT`.

Per render, and on resize:
1. Group teams by points, take the top and bottom totals, emit one row per value
   from the top down.
2. `rowHeight = max(MIN_ROW_HEIGHT, availableHeight / rowCount)`.
3. `height = rowHeight * rowCount`. When that exceeds the height it was given,
   the grid reports `scrolls` and is taller than the screen on purpose.

The height handed to the engine is the window's, not a container's, because the
element around the table is now as tall as the table itself and cannot be asked
how much room there is. Taking it from the viewport keeps the grid out of a
feedback loop with its own size.

There are no content tiers. Everything inside a row (crest size, points type,
name type, chip gaps, padding) is a continuous function of row height, capped
so a very tall early season row does not grow a giant crest.

Type has a floor of its own: nothing is ever set below 12px, name, points or
league position. That floor is where `MIN_ROW_HEIGHT` comes from, since 22px is
the shortest row a 12px line fits into with its padding. The two move together
and neither can be lowered on its own.

A team name is
never dropped: below about 185px per team the pre-shortened name is used, and
below about 72px the league position goes, but the name only ever truncates.
Every chip opens a details card so an ellipsis has a way back.

Matches behind are marked on the chip, because a points axis states a distance
and a team short of a fixture has not earned its place on it yet. The reference
is the most matches any team in the table has played, never a round number:
API-Football standings carry a played count and no dependable current round, so
this is the only definition the real pipeline and the mocks can share, and it
correctly marks nobody when a whole round is postponed. Football calls this
games in hand, from the point of view of the team that gains by it; the table
states it as a minus ("-2") against the team that has played fewer, because a
minus is what the axis is showing. The mark degrades to a dot when the row is
too crowded for digits, and it outranks the league position: a distance that may
be wrong is worth more of the row than the number saying where a team sits.

Every chip opens a card, on hover, on keyboard focus or on tap, carrying what a
row of 12px type cannot: points, matches played, the W/D/L record, goals for and
against, goal difference, recent form and the matches behind caveat. The chip is
a real button so it is reachable and announced without being told how. The card
renders in a portal, since the row clips its own overflow, and positions itself
against the chip in viewport coordinates, above it by preference so it never
covers the rows being compared against.

Teams sharing a total are packed from the left at the width their own name
needs. When the row is tall enough for more than one line they wrap onto several
lines rather than squeezing onto one, so an all-level opening round reads as a
list with a line per team rather than twenty crests jammed edge to edge.

There is no "too small" fallback panel. The row floor plus a scrolling page is
the answer to a short screen.

## App structure conventions

- Leagues config file: league name, API-Football id, JSON asset path, gradient
  colors (hardcoded, identity-appropriate per league), any future metadata.
- Favourites: default to top 5 leagues plus Ekstraklasa, persisted in localStorage.
- Desktop: all favourited leagues in a wrapping CSS grid. Mobile: one league at
  a time with a dropdown picker split into starred and unstarred sections,
  inline star toggling. The desktop grid predates the scrolling axis and the two
  need reconciling before task 05 builds it; see `plan/05-leagues-and-shell.md`.
- State: useState and props locally, React Context for favourites and visible
  leagues. No external state libraries.
- Optional zone bands (title, European spots, relegation) as subtle background
  tints behind the axis.

## Conventions

- File naming always lowercase kebab-case: `layout-engine.ts`, `team-row.tsx`, `app.tsx`.
- No em dashes anywhere: not in code comments, not in UI copy, not in docs.
- The table never scrolls inside its own container. When the grid outgrows the
  viewport it is the document that scrolls, with one scrollbar down the right
  hand edge of the window, where a scrollbar belongs.
- Task files describe what to build and why; they do not prescribe code or
  exact file names, only directory-level architecture.
