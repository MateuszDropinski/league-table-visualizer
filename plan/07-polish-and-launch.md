# Task 07: Polish and launch

## Goal
Ship-quality pass before connecting live standings.

The mock demo now has a Pages workflow and README. The remaining checks below
apply to the eventual live-data release.

## What to build
- Verify all 25 mock snapshots (5 leagues x 5 season stages) visually on
  common viewports: mobile portrait, small laptop (around 1366x768), large
  desktop. Verify uniform row heights and readable names; wide spreads intentionally scroll with the document.
- Accessibility pass: team cards linked to their buttons, keyboard activation, readable contrast,
  and visible focus states.
- Favicon, title, meta description, social preview image.
- README explaining the concept with a screenshot, the data pipeline, and a
  note that the project uses API-Football.
- GitHub Pages deploy is implemented for the demo: a GitHub Actions workflow
  that builds on push to main and publishes the `dist` output using the
  official Pages actions (not a gh-pages branch push), with the repository
  Pages source set to GitHub Actions. CI installs and builds via pnpm.
  Confirm the live URL serves correctly under the configured base path.
- Enable the hourly cron with the real key in secrets, confirm the first
  automated commit lands and the deployed site reflects it.

## Why
The app launches against real standings the moment the leagues kick off; the
mock scenarios are the safety net proving the layout holds all season.

Deployment lands last so the site goes public already working, and so the two
workflows that touch the repository (Pages publish and the data cron) are set
up and verified together rather than months apart.
