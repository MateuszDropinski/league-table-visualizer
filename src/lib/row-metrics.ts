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
  /** The league position in front of a name, a shade smaller than the name. */
  rankFontSize: number
  /** Horizontal space between teams sharing a total. */
  chipGap: number
  /** Vertical space between lines of teams, once a shared total wraps. */
  chipRowGap: number
  /** How tall one team reads, crest or name, whichever is taller. */
  chipHeight: number
  /** Vertical padding inside a cell, which has to vanish before the row does. */
  cellPadding: number
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

/*
  The ratios come from the four tiers this replaced, which were sized by eye
  against the mock crests and names: a 24px row carried a 16px crest, 13px
  points and a 12px name. That row is no longer the shortest one there is, but
  it is still the one the proportions were drawn against.
*/
export function rowMetrics(rowHeight: number): RowMetrics {
  const pointsFontSize = clamp(rowHeight * 0.5, 6, 18)
  const logoSize = clamp(rowHeight * 0.7, 4, 28)
  const nameFontSize = clamp(rowHeight * 0.46, 6, 15)

  return {
    logoSize,
    // Tracks the type rather than the row, since what it has to hold is "100".
    pointsColumnWidth: Math.round(pointsFontSize * 2.4 + 18),
    pointsFontSize,
    nameFontSize,
    rankFontSize: Math.max(6, nameFontSize * 0.85),
    chipGap: clamp(rowHeight * 0.36, 3, 14),
    chipRowGap: clamp(rowHeight * 0.06, 2, 10),
    // 1.35 is the line box a name of this size actually paints into, so a line
    // of teams is never estimated shorter than it renders.
    chipHeight: Math.max(logoSize, nameFontSize * 1.35),
    cellPadding: clamp(rowHeight * 0.12, 0, 6),
  }
}

/** Whether a team is worth its full name or only its pre-shortened one. */
export type ChipMode = 'full' | 'short'

export interface ChipLayout {
  mode: ChipMode
  /**
   * The most teams a line has to be able to hold, which is what caps how wide
   * any one of them may be. Teams are not laid out on this: they take the width
   * their name needs and sit next to each other from the left, so a line often
   * holds more than this. It is the guarantee that a line holds no fewer.
   */
  perLine: number
  /** The most lines those teams can come to, so the caller can check it fits. */
  lines: number
  /** False once the position would be taking the room the name needs. */
  showRank: boolean
}

/**
 * The width one team needs before its full name is worth showing rather than
 * its short one. Measured against the longest mock names at the largest type,
 * with the position in front of them accounted for.
 */
const FULL_NAME_WIDTH = 185

/**
 * The width one team needs before its position is worth the room it takes.
 * Under this the crest and a few letters of the name are all there is space
 * for, and the name is the thing that identifies a team.
 */
const RANK_WIDTH = 72

/**
 * How the teams on one point total are arranged, and which form of their names
 * they get.
 *
 * A row is one line by default, so a total held by eight teams squeezes all
 * eight onto it and most of them get a short name. When the row is tall enough
 * to hold more than one line of crests, the teams may wrap instead: a tall row
 * has height going spare and nothing to spend it on, and two lines of full
 * names read better than one line of truncated ones. In the extreme, a league
 * where everybody is level is a single row the height of the screen, and every
 * team gets a line to itself.
 *
 * `perLine` is a width cap rather than a column count. Teams are packed from
 * the left at whatever width their name needs, so a line takes as many as fit
 * and wraps only when it has to, but no team is ever wider than a `perLine`
 * share. That is what holds the line count to `lines`, which in turn is capped
 * by what the row can actually paint, so wrapping never pushes content past the
 * row it belongs to.
 */
export function chipLayout(
  metrics: RowMetrics,
  teamCount: number,
  contentWidth: number,
  rowHeight: number,
): ChipLayout {
  if (teamCount <= 1) return { mode: 'full', perLine: 1, lines: 1, showRank: true }

  const widthPer = (perLine: number) =>
    (contentWidth - metrics.chipGap * (perLine - 1)) / perLine

  // One line is always preferred when it already carries full names, since
  // wrapping only exists to buy width the names need.
  if (widthPer(teamCount) >= FULL_NAME_WIDTH) {
    return { mode: 'full', perLine: teamCount, lines: 1, showRank: true }
  }

  const lineHeight = metrics.chipHeight + metrics.chipRowGap
  const usable = rowHeight - metrics.cellPadding * 2 + metrics.chipRowGap
  const maxLines = Math.max(1, Math.floor(usable / lineHeight))

  // Spread the teams over as many lines as the row allows, which is what makes
  // each of them as wide as possible.
  const perLine = Math.max(1, Math.ceil(teamCount / Math.min(maxLines, teamCount)))

  const share = widthPer(perLine)

  return {
    mode: share >= FULL_NAME_WIDTH ? 'full' : 'short',
    perLine,
    lines: Math.ceil(teamCount / perLine),
    showRank: share >= RANK_WIDTH,
  }
}
