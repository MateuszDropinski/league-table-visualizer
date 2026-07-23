# Task 02: Mock data and dev switcher

## Goal
A complete mock data set that lets the whole app be built and visually
validated before purchasing any API access. Mocks mimic the future pipeline
output exactly: same JSON shape, same asset location pattern.

## What to build
- Define the app's standings JSON shape first (team id, name, logo URL,
  points, played, W/D/L, goals for/against, GD, form, rank, plus a
  `fetchedAt` timestamp). Mocks and the future real pipeline both produce it.
- 5 mock leagues with fictional but plausible team names (18 to 20 teams),
  each snapshotted at 5 season stages: 1/5, 2/5, 3/5, 4/5, 5/5. That gives 25
  JSON files under the same `public/data/` pattern the real pipeline will use.
- Deliberately varied characters across leagues so edge cases are covered:
  - round one with all or nearly all teams on equal points,
  - a runaway leader opening a double-digit gap,
  - a two-team title race far ahead of a tight pack,
  - a dense mid-table cluster with several shared point levels,
  - a relegation scrap with teams level on points at the bottom.
  Point totals must stay realistic for the number of rounds played at each stage.
- A set of bundled example SVG crests (simple generated shapes, varied colors
  and silhouettes) referenced by the mocks, verifying SVG logo rendering at
  every row tier down to Micro.
- A dev-only control (hidden in production) to switch league and season stage,
  enabling quick flipping through all 25 snapshots during development.

## Why
The layout engine and UI are the risky parts; the API is a commodity. Building
against 25 curated snapshots proves the fit-always algorithm on every scenario
the real season can throw at it, before spending on the key.
