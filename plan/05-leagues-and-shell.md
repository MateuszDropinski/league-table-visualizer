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

## Open question: what the desktop grid means now

Multiple leagues side by side is where the concept shines on desktop: you can
compare the shape of title races across countries at a glance. That was written
when every table fit whatever box it was given.

The axis no longer works that way. It sizes its rows against the viewport and
lets the page scroll when the spread is wide, so a grid cell is not a height the
table will respect, and two leagues in a row would scroll independently to
different depths. Worth settling before building rather than during. The
options, roughly:

- Hand each cell a fraction of the viewport and accept that a wide spread
  overflows its cell, with the page scrolling past all of them together.
- Give every visible league the same row height, computed from whichever of them
  has the widest spread, so cells stay comparable and short tables simply end
  early.
- Drop the grid: one league at a time on every screen, with switching, and let
  the axis have the whole window everywhere.
