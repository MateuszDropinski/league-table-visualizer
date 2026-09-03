# Points-First League Table

Football standings drawn on a points axis. Teams with the same points share a
row; every integer total between first and last has an equally tall row.
Wide spreads scroll with the page so names remain readable.

[Open the table](https://mateuszdropinski.github.io/league-table-visualizer/)

## Current standings

Premier League, La Liga, Bundesliga, Serie A, Ligue 1 and Ekstraklasa.
The committed 2026/27 standings were checked on **3 September 2026** and contain
114 clubs. These are manually maintained snapshots, not live scores.

Choose a league in the left sidebar. On narrow screens, the menu button opens
a popover from a floating button at the bottom right. No mobile sidebar takes
space from the table.
League links have shareable hashes, for example `#ekstraklasa`, and browser
Back/Forward restores the selection. There is no extra padding below the table. League abbreviations are omitted.

Hover, tap, or focus a club for its record. Only one club card is open at a time;
moving between clubs replaces the previous card immediately. Escape closes the card;
Enter or Space toggles it. Amber marks mean fewer matches played than the
busiest team. The source's order and shared positions are preserved.

## Responsive layout and colour

Clubs have a minimum readable width of 176px for their crest, position and name.
Crowded totals wrap, and the busiest total determines the minimum height of
**every** points row. The document may grow and scroll; the points scale remains
uniform. Touch layouts have 44px targets. If even a single label cannot fit,
clubs use crests alone with accessible names and full detail cards.

Positions use brighter, semibold text at the same size as club names.
Brand-inspired colours tint navigation and the page background. The green/red
points axis still communicates direction. The accents are adapted for a dark
interface, rather than presented as exact corporate colour specifications.
References checked 3 September 2026:

- [Premier League](https://www.premierleague.com/): purple.
- [LaLiga](https://www.laliga.com/en-GB): coral red.
- [Bundesliga](https://www.bundesliga.com/en/bundesliga): red.
- [Serie A](https://www.legaseriea.it/): blue.
- [Ligue 1](https://ligue1.com/en) and [its brand designers](https://www.leroytremblot.com/en/ligue1-mcdonalds): electric blue and pink.
- [Ekstraklasa](https://ekstraklasa.org/): navy and blue.

## Manual data updates

No football API, API key, scheduled scraper or runtime standings service is
used. The browser loads one committed JSON file from `public/data/` per league.
Club badges use the public image URLs provided by the standings sites.

When an update is requested:

1. Read the current published season tables at the URLs in each file's `sources`.
   Prefer the league's official table and cross-check against another publisher
   when possible. Check the season explicitly, especially around summer rollover.
2. Replace each affected league's full table: points, matches, W/D/L, goals,
   goal difference and published rank. Preserve club IDs and source ordering.
   Do not apply a generic goal-difference tiebreaker across leagues.
3. Record the verification date in `checkedAt` and retain the source links.
   Record deductions as a signed `pointsAdjustment` plus `adjustmentNote`.
   Leave `form: []` unless the chronological results have been verified.
4. Run `pnpm data:validate`, `pnpm test` and `pnpm build`, then commit and push
   to `main`. GitHub Actions rebuilds and deploys the updated static files.

The validator checks schema, all six league identities and club counts,
unique clubs, dates, ranks, individual records and league-wide accounting.
Both the browser and CI reject malformed data. Loading failures retain the
previous table, identify it and offer Retry.

## Sources

| League | Primary standings | Cross-check |
| --- | --- | --- |
| Premier League | [Sky Sports](https://www.skysports.com/premier-league-table) | [GOAL](https://www.goal.com/en-gb/premier-league/table/2kwbbcootiqqgmrzs6o5inle5) |
| La Liga | [Sky Sports](https://www.skysports.com/la-liga-table) | [LaLiga](https://www.laliga.com/en-GB/laliga-easports/standing) |
| Bundesliga | [Bundesliga](https://www.bundesliga.com/en/bundesliga/table) | [Sky Sports](https://www.skysports.com/bundesliga-table) |
| Serie A | [Sky Sports](https://www.skysports.com/serie-a-table) | [ESPN](https://www.espn.co.uk/football/table/_/league/ita.1) |
| Ligue 1 | [Sky Sports](https://www.skysports.com/ligue-1-table) | [SoccerSTATS](https://www.soccerstats.com/latest.asp?league=france) |
| Ekstraklasa | [Ekstraklasa](https://ekstraklasa.org/tabela/2026-2027/) | |

Bundesliga positions come from the official table, which shares positions for
exact ties; some secondary publishers number those ties sequentially. Recent
form is omitted in this snapshot because its chronological sequence was not
verified for every league.

## Development

Use Node.js 24 and pnpm 10.27.0 (the version in `package.json`).

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm data:validate
pnpm build
pnpm preview
```

Open `http://localhost:5173/league-table-visualizer/` for local development.
Tests cover synthetic edge cases and all six real tables; no fictional leagues
or generated crests ship with the site.

## GitHub Pages

Settings > Pages > Source must be **GitHub Actions**.
The [Pages workflow](.github/workflows/pages.yml) tests, validates and builds on
pushes to `main`, pull requests targeting `main`, and manual dispatch.
Successful `main` builds deploy `dist`; pull requests only validate the build.
The Vite base is `/league-table-visualizer/`.

## Structure

- `public/data`: manually verified standings and source metadata.
- `src/data`: league configuration, static loading, runtime validation.
- `src/components`: table, team cards and league navigation.
- `src/lib`: pure layout calculations and sizing hooks.
- `scripts/validate-standings.ts`: validation used by CI and manual updates.
- `tests`: Node's test runner using native TypeScript support.
- `plan`: historical development notes; current data policy is described above.
