# Points-First League Table Visualizer

React, TypeScript, Vite, Tailwind CSS and lucide-react. Static GitHub Pages site.
Use pnpm exclusively; keep the lockfile committed. Node 24 and the pnpm version
in package.json are shared by local development and CI.

## Current product and data policy

Display one league at a time: Premier League, La Liga, Bundesliga, Serie A,
Ligue 1 or Ekstraklasa. Desktop navigation sits beside the table. Mobile uses a
translucent floating bottom-right button opening a popover, with no mobile sidebar. Neither reserves any table height. Keep the whole viewport
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
- Row height is max(22px, viewport height / row count). Wrapping never grows
  the grid. The document scrolls only when the 22px floor requires it.
- Never skip, compress or round away a point value.
- Desktop content varies with row height, with type at least 12px. On phones,
  use 13px names/ranks, 14px points and 24px crests/chips, capped by the
  existing row height (21px crests at the 22px floor).
- Each total independently chooses full name, first three letters, or no name;
  crest and league position always remain visible. Keep source order and full
  accessible names. Measure real labels, including games-in-hand markers.
- Expand the desktop table into available side space before compacting. Prefer
  any fitting single-line state over wrapping. Wrap only if no state fits one
  line, the whole grid fits the viewport, and the row's existing height allows
  it. An impossible density may use one horizontally scrollable crest/rank
  line, without increasing row height or clipping clubs.
- Never show transient loading notifications when switching leagues. Preserve
  visible error recovery and retry.
- Team cards share one active owner per table, render in a portal, stay inside
  the viewport and close on Escape. A delayed dismissal must not close another
  club's card. Describe the interaction as hover or tap.
- Use actual league logos beside league names, with no abbreviations. Use subtle league colour accents and
  bright semibold positions; keep the point-axis direction visually clear.
- Games in hand are measured against the league's busiest club. Their amber
  marker becomes a dot in compact states; it never replaces the league position.

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
