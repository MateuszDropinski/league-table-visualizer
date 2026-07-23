# Task 05: Multi-league shell, favourites, mobile

## Goal
The app around the table: choosing leagues, favourites, responsive layout.

## What to build
- Leagues config module: name, API-Football id, data asset path, gradient
  colors, future-proof for extra metadata.
- Favourites in localStorage, defaulting to the top 5 leagues plus Ekstraklasa,
  managed via React Context.
- Desktop: all favourited leagues in a wrapping CSS grid, each grid cell giving
  its table a bounded height so the fit-always engine has a real constraint.
- Mobile: one league at a time, full viewport height for the table, dropdown
  picker split into starred and unstarred sections with inline star toggles.
- Data loading: fetch the static JSON per visible league, simple loading and
  error states (error state should still render the shell gracefully).

## Why
Multiple leagues side by side is where the concept shines on desktop: you can
compare the shape of title races across countries at a glance.
