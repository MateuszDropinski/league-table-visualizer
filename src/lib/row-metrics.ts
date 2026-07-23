/*
  What fits inside a row, derived from the one number the engine decides: its
  height.

  There are no tiers any more. Row height is whatever the container divided by
  the point spread comes to, floored at `MIN_ROW_HEIGHT`, so every size here is
  a continuous function of it rather than a step on a ladder. The caps are on
  content only: a 150px row in a six point early season table does not want a
  90px crest, and nothing here ever changes the row height itself.

  A name is never dropped. The floor exists precisely so there is always room
  for one, and when the row is too narrow the name is truncated rather than
  replaced by its crest.
*/

export interface RowMetrics {
  logoSize: number
  /** Width of the points column, wide enough for a three digit total. */
  pointsColumnWidth: number
  pointsFontSize: number
  nameFontSize: number
  /** Horizontal space between teams sharing a total. */
  chipGap: number
  /** Vertical padding inside a cell, which has to vanish before the row does. */
  cellPadding: number
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

/*
  The ratios come from the four tiers this replaced, which were sized by eye
  against the mock crests and names: a 24px row carried a 16px crest, 13px
  points and a 12px name. That row is now the shortest one there is, so those
  numbers are what the floor has to produce.
*/
export function rowMetrics(rowHeight: number): RowMetrics {
  const pointsFontSize = clamp(rowHeight * 0.5, 6, 18)

  return {
    logoSize: clamp(rowHeight * 0.7, 4, 28),
    // Tracks the type rather than the row, since what it has to hold is "100".
    pointsColumnWidth: Math.round(pointsFontSize * 2.4 + 18),
    pointsFontSize,
    nameFontSize: clamp(rowHeight * 0.46, 6, 15),
    chipGap: clamp(rowHeight * 0.36, 3, 14),
    cellPadding: clamp(rowHeight * 0.12, 0, 6),
  }
}

/** Whether a team is worth its full name or only its pre-shortened one. */
export type ChipMode = 'full' | 'short'

/**
 * Picks which form of the name a team gets.
 *
 * A row never wraps onto a second line, so a total held by eight teams gives
 * each of them an eighth of the width. The full name goes first, then the short
 * name, and past that the name truncates rather than disappearing. The
 * threshold is per team width in pixels, measured against the longest mock
 * names at the relevant type size.
 */
export function chipMode(metrics: RowMetrics, teamCount: number, contentWidth: number): ChipMode {
  if (teamCount === 0) return 'full'

  const perTeam = (contentWidth - metrics.chipGap * (teamCount - 1)) / teamCount
  return perTeam >= 170 ? 'full' : 'short'
}
