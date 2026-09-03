# Points-First League Table

Football standings drawn on a points axis. Teams with the same points share a
row; every integer total between first and last has an equally tall row.
Wide point spreads scroll with the page so names remain readable.

[Open the demo](https://mateuszdropinski.github.io/league-table-visualizer/)

## Current demo

Five fictional leagues, each with five season snapshots. Open the control panel
in the bottom-right corner to choose a league and stage. Select, hover over, or
focus a team to read its record. Escape closes the card; Enter or Space toggles
it. Amber marks indicate fewer matches played than the busiest team.

The standings are synthetic layout fixtures, not live football results.
Records are generated independently per team, so league-wide totals do not
necessarily balance. `mock:validate` checks fixture conventions and individual
records, not whether the entire table could result from a real season.
The real API data pipeline, favourites, and multi-league view are future work.

## Local development

Use Node.js 24 and pnpm 10.27.0 (the version in `package.json`).

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:5173/league-table-visualizer/`.
Development-only arrow shortcuts change stage (left/right) and league (up/down).

```sh
pnpm test           # layout, matches-behind, and card positioning tests
pnpm mock:validate  # checks all 25 synthetic fixtures
pnpm build         # TypeScript checks and production build
pnpm preview       # serve the production build locally
```

`pnpm mock:generate` deterministically regenerates `public/crests` and
`public/data/mock`. These directories contain generated assets only.

## GitHub Pages

In Settings > Pages, set Source to **GitHub Actions**.
The [Pages workflow](.github/workflows/pages.yml) runs on pushes to `main`, pull
requests targeting `main`, and manual dispatches from the Actions tab.
Every run installs the locked dependencies, runs the tests, validates the mock
fixtures, and builds the app. Successful runs on `main` upload `dist` and deploy
through the `github-pages` environment. Pull requests only validate the build.

The Vite base path is `/league-table-visualizer/`. JavaScript, CSS, data, crests,
and the favicon all resolve beneath that path. No API key or personal access
token is needed for this demo's deployment.

The workflow follows [GitHub's custom Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Structure

- `src/lib`: pure layout calculations and sizing hooks.
- `src/components`: table, team cards, and demo controls.
- `src/data`: static JSON loading and asset URL resolution.
- `src/types`: shared standings and mock index contracts.
- `scripts`: deterministic fixture generation and fixture checks.
- `tests`: Node's built-in test runner, using native TypeScript support.

Before connecting real standings, add runtime schema validation and a separate
provider-aware validator. Preserve provider ranking and account for points
deductions and each league's tiebreakers instead of applying mock rules to them.
