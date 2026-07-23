# Points-First League Table Visualizer

A React + TypeScript app that renders football league standings on a points axis
instead of a ranked list. The vertical distance between teams is proportional to
their points difference, so gaps and clusters are visible at first sight.

## Core product principle

The table ALWAYS fits the viewport height. No vertical scrolling, ever.
The visual truth of distances is the product. When space runs out, the app
degrades row content (smaller rows, smaller logos, less text), never the
proportionality of gaps and never by introducing scroll.

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

Deployment is the final task (see `plan/07-polish-and-launch.md`), not yet wired
up. The target is automatic deploy via GitHub Actions on push to main (build and
publish to GitHub Pages). Until then the app is validated locally against mock
data, and `base` in `vite.config.ts` is already set to the Pages subpath so
nothing needs rewiring when the workflow lands.

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
- Team logos are bundled example SVGs (simple generated crests in varied
  shapes and colors) referenced by the mock JSON, ensuring SVG logos render
  correctly at every row tier down to Micro.
- A dev-only switcher (league + stage) makes it possible to flip through all
  25 snapshots quickly while developing the layout engine and UI.

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

Definitions:
- Occupied level: a point total held by at least one team. Teams on the same
  total share one row and wrap horizontally inside it.
- Gap: a run of unoccupied point values between two adjacent occupied levels,
  measured in points.
- The axis is cropped to the occupied range: from the leader's points down to
  the last team's points. Values below the last team are never rendered.

Invariants:
- Row height is uniform across all team rows at any given moment.
- Gap heights are proportional to gap size in points: a 12 point gap is
  visually 4 times taller than a 3 point gap, at every screen size.
- Number of team rows never exceeds number of teams, so a no-scroll fit is
  always achievable (18 rows at the micro floor plus minimal gaps fits any
  reasonable viewport).

Algorithm per render (and on resize, via ResizeObserver):
1. Group teams into occupied levels, compute gaps.
2. Pick the largest row tier (see ladder below) such that
   `levels * rowHeight + sum(minGapHeights) <= viewportHeight`.
   Within the Comfortable tier, row height scales continuously up to its max.
3. Residual space `R = viewport - levels * rowHeight` is distributed across
   gaps proportionally to their point size, subject to:
   - a per-gap minimum so even a 1 point gap reads as air (tier-dependent, 2 to 8px),
   - a per-point maximum (about 14px per point) so tall screens in early season
     do not inflate tiny gaps into voids; if gaps hit their caps and space
     remains, the table top-aligns and stays compact rather than stretching.
4. Gaps taller than about 24px render a muted centered label with the gap size
   ("12 pts"), and a subtle visual texture (faint dotted line) so the space
   reads as intentional distance, not broken layout. Smaller gaps stay as
   unlabeled whitespace.

Minimum height fallback:
If even the Micro tier cannot fit (viewport height below the hard minimum of
`teamCount * microRowHeight + gapCount * 2px` plus header, roughly 300px for an
18 team league), do NOT render a broken or scrolling table. Render a fallback
panel instead: a short friendly message that the screen is too short to display
point distances properly, with the league name still visible. The threshold is
computed from the data, not hardcoded, so it adapts to league size.

Row content degradation ladder (pick highest that fits):
- Comfortable: row 32 to 56px, logo + full name + points (optionally GD).
- Compact: about 24px, smaller logo, truncated name, points.
- Dense: about 16px, logo + points only, name via tooltip or tap.
- Micro: about 11px floor, tiny logo, tiny points text, gap minimum drops to 2px.

Teams sharing a level wrap as horizontal chips within the row; when crowded,
chips degrade to logo-only with tooltip regardless of tier.

## App structure conventions

- Leagues config file: league name, API-Football id, JSON asset path, gradient
  colors (hardcoded, identity-appropriate per league), any future metadata.
- Favourites: default to top 5 leagues plus Ekstraklasa, persisted in localStorage.
- Desktop: all favourited leagues in a wrapping CSS grid. Mobile: one league at
  a time with a dropdown picker split into starred and unstarred sections,
  inline star toggling.
- State: useState and props locally, React Context for favourites and visible
  leagues. No external state libraries.
- Optional zone bands (title, European spots, relegation) as subtle background
  tints behind the axis.

## Conventions

- File naming always lowercase kebab-case: `layout-engine.ts`, `team-row.tsx`, `app.tsx`.
- No em dashes anywhere: not in code comments, not in UI copy, not in docs.
- No vertical scrolling of the table under any circumstances.
- Task files describe what to build and why; they do not prescribe code or
  exact file names, only directory-level architecture.
