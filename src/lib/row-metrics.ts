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
    cellPadding: Math.max(0, Math.min(1, (rowHeight - 21) / 2)),
  }
  const pointsFontSize = clamp(rowHeight * 0.5, MIN_FONT_SIZE, 18)
  const logoSize = clamp(rowHeight * 0.7, 4, 28)
  const nameFontSize = clamp(rowHeight * 0.46, MIN_FONT_SIZE, 15)

  const chipHeight = Math.max(logoSize, nameFontSize * 1.35)
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
    chipHeight,
    cellPadding: Math.max(0, Math.min(rowHeight * 0.12, 6, (rowHeight - chipHeight - 1) / 2)),
  }
}

export const TOUCH_TABLE_WIDTH = 640
export const CHIP_MODES = ['full', 'abbreviated', 'crest'] as const
export type ChipMode = typeof CHIP_MODES[number]
export type ChipWidths = Record<ChipMode, number>

export interface ChipLayout {
  mode: ChipMode
  /** Source-order indexes, grouped into explicit lines to avoid flex rounding. */
  lines: number[][]
  overflow: boolean
}

export function chipInnerGap(metrics: RowMetrics, compact: boolean): number {
  return compact ? 2 : Math.max(3, metrics.chipGap * 0.55)
}

export function lineWidth(widths: readonly number[], gap: number): number {
  return widths.reduce((sum, width) => sum + width, 0) + Math.max(0, widths.length - 1) * gap
}

/** Grow into unused horizontal space before deciding any row's label state. */
export function tableWidth(availableWidth: number, requiredWidth: number): number {
  return Math.max(0, Math.min(availableWidth, Math.max(864, Math.ceil(requiredWidth))))
}

/** Wrapping may use existing height, but must never increase the points grid. */
export function rowLineBudget(metrics: RowMetrics, rowHeight: number, gridScrolls: boolean): number {
  if (gridScrolls) return 1
  const contentHeight = rowHeight - metrics.cellPadding * 2 - 1
  return Math.max(1, Math.floor((contentHeight + metrics.chipRowGap) / (metrics.chipHeight + metrics.chipRowGap)))
}

/** Prefer a single line in the richest state that fits, independently per row. */
export function chipLayout(
  metrics: RowMetrics,
  widths: readonly ChipWidths[],
  contentWidth: number,
  maxLines: number,
): ChipLayout {
  const available = Math.max(0, contentWidth - 1)
  const indexes = widths.map((_, index) => index)
  for (const mode of CHIP_MODES) {
    if (lineWidth(widths.map(width => width[mode]), metrics.chipGap) <= available) {
      return { mode, lines: indexes.length ? [indexes] : [], overflow: false }
    }
  }

  if (maxLines > 1) {
    for (const mode of CHIP_MODES) {
      if (widths.some(width => width[mode] > available)) continue
      const lines: number[][] = []
      let used = 0
      for (const index of indexes) {
        const width = widths[index][mode]
        if (!lines.length || used + metrics.chipGap + width > available) {
          lines.push([index])
          used = width
        } else {
          lines[lines.length - 1].push(index)
          used += metrics.chipGap + width
        }
      }
      if (lines.length <= maxLines) return { mode, lines, overflow: false }
    }
  }

  // At physically impossible densities, keep every crest/rank reachable on
  // one horizontally scrollable line instead of clipping clubs or growing rows.
  return { mode: 'crest', lines: indexes.length ? [indexes] : [], overflow: true }
}
