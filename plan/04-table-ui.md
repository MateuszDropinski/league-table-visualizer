# Task 04: Table UI

## Goal
Render one league as the points-axis table, driven entirely by the layout
engine output, with the "see the differences at first sight" experience.

## What to build
- A league table component that measures its container with ResizeObserver,
  calls the layout engine, and renders rows and gaps at the computed heights.
- Team chips per content tier (Comfortable, Compact, Dense, Micro), wrapping
  horizontally when a point level holds several teams, degrading to logo-only
  chips with tooltip when crowded.
- Gap rendering: plain whitespace when small; labeled ("12 pts") with a muted
  centered caption and faint dotted texture when taller than the label
  threshold, so big distances read as intentional and striking.
- A league header: league name, gradient accent from the config, and
  "updated X ago" from `fetchedAt`.
- A "too small" fallback panel for when the layout engine reports the viewport
  is below the Micro floor: league name plus a short friendly message that the
  screen is too short to display point distances properly. Recovers instantly
  to the table when the container grows again.
- Optional subtle zone bands (title, Europe, relegation) behind the axis,
  configured per league.
- Smooth height transitions on resize and on data refresh so the table feels
  alive rather than jumpy.

## Why
The emotional payoff of the app is the first glance: clusters feel tight, big
gaps feel like a fall. Typography, whitespace, and the gap labels carry that.

## Notes
- Read the frontend-design guidance before styling; avoid a generic template
  look. The table itself is the visual identity.
- No table scrolling under any circumstance.
