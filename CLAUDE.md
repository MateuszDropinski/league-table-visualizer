# Points-First League Table Visualizer

React, TypeScript, Vite, Tailwind CSS and lucide-react. Static GitHub Pages site.
Use pnpm exclusively; keep the lockfile committed. Node 24 and the pnpm version
in package.json are shared by local development and CI.

## Current product and data policy

Display one league at a time: Premier League, La Liga, Bundesliga, Serie A,
Ligue 1 or Ekstraklasa. Desktop navigation sits beside the table. Mobile uses a
compact menu rail. Neither reserves any table height. Keep the whole viewport
available to the points axis and do not add bottom padding for floating controls.

The user explicitly chose manually verified static standings. Do not introduce
football APIs, paid providers, API secrets, hourly jobs or automatic scraping.
When requested, read published standings, update public/data/<league>.json,
record checkedAt and source links, validate, commit and deploy. README.md
contains the detailed update procedure. Older API and mock plans are historical.

Preserve each source's league-specific ranking, including shared positions.
Do not sort all leagues using one generic tiebreaker. Club IDs are stable local
identifiers. Store documented deductions as pointsAdjustment and adjustmentNote.
Never invent recent form; an empty form array means not verified.

Both runtime loading and CI use src/data/validate-standings.ts. The validator
checks schema, individual records and league-wide results/goals. New season
club counts must be updated in src/data/leagues.ts if the competition changes.

## Layout invariants

- Every integer point value between highest and lowest occupied totals gets a
  row, including empty levels. All rows have exactly equal height.
- Row height is max(22px, viewport height / row count). A wide spread on a short
  screen deliberately scrolls the document. Never create a nested table scroller.
- Never skip, compress or round away a point value. Do not force short rows to
  fit when this makes names unreadable.
- Content sizes vary continuously with row height, with type at least 12px.
- Shared-point clubs keep the source's order and pack from the left. Wrap only
  when the row can hold the resulting lines. Names may shorten or truncate;
  every club opens a full record on hover, focus or tap.
- Team cards render in a portal, stay inside the viewport and close on Escape.
- Games in hand are measured against the league's busiest club. Their amber
  marker takes priority over displaying rank when horizontal room is limited.

## Commands and deployment

pnpm dev, pnpm test, pnpm data:validate, pnpm build, pnpm preview.
The GitHub Pages workflow runs tests, validation and build on pull requests and
main pushes. Only main deploys. No football API key is needed.

## Conventions

- Lowercase kebab-case filenames.
- No em dashes in code comments, UI copy or docs.
- Prefer local state and props; no external state library.
- Keep future ideas distinct from implemented behavior. plan/ contains the
  development history; its old mock/API tasks do not override this policy.
