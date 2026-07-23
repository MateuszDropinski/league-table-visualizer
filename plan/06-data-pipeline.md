# Task 06: Data pipeline (GitHub Actions + API-Football)

## Goal
Static JSON standings per league, refreshed hourly by a scheduled workflow,
served as plain assets. The browser never talks to API-Football.

## What to build
- A small Node script (runs only in CI) that:
  - reads the leagues config (name, API-Football id, output file name),
  - calls the API-Football standings endpoint for the current season per league,
  - normalizes the response to the app's own standings shape: team id, name,
    logo URL, points, played, W/D/L, goals for/against, GD, form, rank,
  - writes one JSON file per league into `public/data/`, each including a
    `fetchedAt` ISO timestamp,
  - exits without committing when nothing changed.
- A scheduled workflow (hourly cron, plus manual dispatch) running the script
  with `API_FOOTBALL_KEY` from repository secrets, committing changed JSON.
- The script must output exactly the standings shape defined in task 02, so
  swapping mocks for real data requires zero frontend changes.
- The workflow uses pnpm for any install steps.

## Why
GitHub Pages has no server, so a build-time/cron-time pipeline is the only way
to keep the key secret. It also gives freshness control (bump cron frequency on
match days if wanted) and, as a side effect, a committed history of standings
snapshots that could later power a season timeline feature.

## Notes
- Normalize into the app's own type at the pipeline boundary; the frontend
  must never see raw API-Football shapes.
- Quota context: 6 leagues hourly is about 144 requests per day against 7500.
