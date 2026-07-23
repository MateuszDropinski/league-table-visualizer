/*
  What fits inside a row, derived from the one number the engine decides: its
  height.

  There are no tiers any more. Row height is whatever the container divided by
  the point spread comes to, so every size here is a continuous function of it
  rather than a step on a ladder. The caps are on content only: a 150px row in
  a six point early season table does not want a 90px crest, and nothing here
  ever changes the row height itself.
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
  /** False once type is too small to read, leaving the crest to carry the team. */
  showName: boolean
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

/** Below this a name is unreadable, so the row keeps the crest and drops the text. */
const NAME_FLOOR = 10

/*
  The ratios come from the four tiers this replaced, which were sized by eye
  against the mock crests and names: a 24px row carried a 16px crest, 13px
  points and a 12px name. Anything much below those and a row that is tall
  enough to read from goes blank for no reason.
*/
export function rowMetrics(rowHeight: number): RowMetrics {
  const nameFontSize = clamp(rowHeight * 0.46, 0, 15)
  const pointsFontSize = clamp(rowHeight * 0.5, 6, 18)

  return {
    logoSize: clamp(rowHeight * 0.7, 4, 28),
    // Tracks the type rather than the row, since what it has to hold is "100".
    pointsColumnWidth: Math.round(pointsFontSize * 2.4 + 18),
    pointsFontSize,
    nameFontSize,
    chipGap: clamp(rowHeight * 0.36, 3, 14),
    cellPadding: clamp(rowHeight * 0.12, 0, 6),
    showName: nameFontSize >= NAME_FLOOR,
  }
}

export type ChipMode = 'full' | 'short' | 'logo'

/**
 * Picks how much of a team survives on its row.
 *
 * A row never wraps onto a second line, so a total held by eight teams has to
 * give up its names however tall the row is. The thresholds are per team width
 * in pixels, measured against the longest mock names at the relevant type size.
 */
export function chipMode(metrics: RowMetrics, teamCount: number, contentWidth: number): ChipMode {
  if (!metrics.showName || teamCount === 0) return 'logo'

  const perTeam = (contentWidth - metrics.chipGap * (teamCount - 1)) / teamCount
  if (perTeam >= 170) return 'full'
  if (perTeam >= 104) return 'short'
  return 'logo'
}
