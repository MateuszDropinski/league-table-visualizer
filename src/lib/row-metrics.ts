export interface RowMetrics {
  logoSize: number
  /** Width of the points column, wide enough for a three digit total. */
  pointsColumnWidth: number
  pointsFontSize: number
  nameFontSize: number
  /**
   * The league position uses the same font size as the name for legibility.
   */
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

/**
 * The desktop type floor. Compact mobile rows use the explicit metrics below.
 *
 * Below this a name stops being read and starts being decoded, which is worth
 * less than the row it saves. It is also what sets `MIN_ROW_HEIGHT`: the floor
 * is the shortest row a line of this type fits into, so the two move together
 * and neither can be lowered on its own.
 */
export const MIN_FONT_SIZE = 12

/*
  The ratios come from the four tiers this replaced, which were sized by eye
  against representative crests and names: a 24px row carried a 16px crest, 13px
  points and a 12px name. That row is no longer the shortest one there is, but
  it is still the one the proportions were drawn against.
*/
export function rowMetrics(rowHeight: number, compact = false): RowMetrics {
  if (compact) return {
    logoSize: 18,
    pointsColumnWidth: 34,
    pointsFontSize: 12,
    nameFontSize: 11,
    rankFontSize: 11,
    chipGap: 6,
    chipRowGap: 2,
    chipHeight: 20,
    cellPadding: 1,
  }
  const pointsFontSize = clamp(rowHeight * 0.5, MIN_FONT_SIZE, 18)
  const logoSize = clamp(rowHeight * 0.7, 4, 28)
  const nameFontSize = clamp(rowHeight * 0.46, MIN_FONT_SIZE, 15)

  return {
    logoSize,
    // Tracks the type rather than the row, since what it has to hold is "100".
    pointsColumnWidth: Math.round(pointsFontSize * 2.4 + 18),
    pointsFontSize,
    nameFontSize,
    rankFontSize: nameFontSize,
    chipGap: clamp(rowHeight * 0.36, 3, 14),
    chipRowGap: clamp(rowHeight * 0.06, 2, 10),
    // 1.35 is the line box a name of this size actually paints into, so a line
    // of teams is never estimated shorter than it renders.
    chipHeight: Math.max(logoSize, nameFontSize * 1.35),
    cellPadding: clamp(rowHeight * 0.12, 0, 6),
  }
}

/** Readable label width, including crest, position and games-in-hand marker. */
export const MIN_TEAM_WIDTH = 176
export const MIN_CREST_WIDTH = 44
export const FULL_NAME_WIDTH = 220
export const TOUCH_TABLE_WIDTH = 640
export type ChipMode = 'full' | 'short' | 'abbreviated' | 'crest'

export interface ChipLayout {
  mode: ChipMode
  perLine: number
  lines: number
  showRank: boolean
  minWidth: number
}

/** Width decides wrapping. The grid grows to fit, instead of crushing names. */
export function chipLayout(metrics: RowMetrics, teamCount: number, contentWidth: number, compact = false): ChipLayout {
  if (compact) {
    // Prefer names. A third line triggers the next denser representation.
    const tiers = [
      { mode: 'full', width: 144 },
      { mode: 'abbreviated', width: 72 },
      { mode: 'crest', width: 44 },
    ] as const
    for (const tier of tiers) {
      const minWidth = Math.min(Math.max(0, contentWidth), tier.width)
      const capacity = Math.max(1, Math.floor((contentWidth + metrics.chipGap - 0.5) / (tier.width + metrics.chipGap)))
      const perLine = Math.max(1, Math.min(teamCount, capacity))
      const lines = Math.ceil(teamCount / perLine)
      if (tier.mode === 'crest' || (contentWidth >= tier.width && lines < 3)) {
        return { mode: tier.mode, minWidth, perLine, lines, showRank: true }
      }
    }
  }
  const mode = contentWidth < MIN_TEAM_WIDTH ? 'crest' : 'short'
  const minWidth = Math.min(contentWidth, mode === 'crest' ? MIN_CREST_WIDTH : MIN_TEAM_WIDTH)
  const capacity = Math.max(1, Math.floor((contentWidth + metrics.chipGap) / (minWidth + metrics.chipGap)))
  const perLine = Math.max(1, Math.min(teamCount, capacity))
  const share = (contentWidth - metrics.chipGap * (perLine - 1)) / perLine
  return {
    mode: mode === 'crest' ? mode : share >= FULL_NAME_WIDTH ? 'full' : 'short',
    perLine,
    lines: Math.ceil(teamCount / perLine),
    showRank: mode !== 'crest',
    minWidth,
  }
}

/**
 * Use capped content sizes to guarantee wrapping fits without a resize loop.
 * Call for each total; the largest minimum preserves the exact points axis.
 */
export function minimumRowHeight(teamsOnRow: number, tableWidth: number): number {
  if (tableWidth <= 0 || teamsOnRow === 0) return 22
  const compact = tableWidth < TOUCH_TABLE_WIDTH
  const metrics = rowMetrics(1000, compact)
  const contentWidth = Math.max(0, tableWidth - metrics.pointsColumnWidth - metrics.cellPadding * 2 - 2)
  const { lines } = chipLayout(metrics, teamsOnRow, contentWidth, compact)
  if (lines <= 1 && !compact) return 22
  const chipHeight = metrics.chipHeight
  return Math.ceil(lines * chipHeight + Math.max(0, lines - 1) * metrics.chipRowGap + metrics.cellPadding * 2 + (compact ? 1 : 2))
}
