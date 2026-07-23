import type { Tier, TierId } from './layout-engine'

/*
  The content half of the degradation ladder.

  The engine decides how tall a row is. This decides what still fits inside it:
  logo size, type sizes, and how wide the points column on the axis needs to be.
  Kept beside the engine rather than inside it because none of it changes the
  geometry, and the engine has to stay renderer agnostic.
*/

export interface RowMetrics {
  logoSize: number
  /** Width of the points column, which is also where the axis rail sits. */
  axisWidth: number
  pointsFontSize: number
  nameFontSize: number
  /** Horizontal space between teams sharing a level. */
  chipGap: number
  gapLabelFontSize: number
  /** False from Dense down, where a name has nowhere to go but a tooltip. */
  showName: boolean
}

const BASE: Record<TierId, RowMetrics> = {
  comfortable: {
    logoSize: 22,
    axisWidth: 48,
    pointsFontSize: 15,
    nameFontSize: 13,
    chipGap: 14,
    gapLabelFontSize: 11,
    showName: true,
  },
  compact: {
    logoSize: 16,
    axisWidth: 40,
    pointsFontSize: 13,
    nameFontSize: 12,
    chipGap: 10,
    gapLabelFontSize: 10,
    showName: true,
  },
  dense: {
    logoSize: 12,
    axisWidth: 34,
    pointsFontSize: 11,
    nameFontSize: 0,
    chipGap: 8,
    gapLabelFontSize: 9,
    showName: false,
  },
  micro: {
    logoSize: 9,
    axisWidth: 28,
    pointsFontSize: 9,
    nameFontSize: 0,
    chipGap: 5,
    gapLabelFontSize: 9,
    showName: false,
  },
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

/**
 * Comfortable rows are the only ones with a height range rather than a fixed
 * height, so their contents scale with it. Every other tier is already sized to
 * exactly one row height and returns its table values unchanged.
 */
export function rowMetrics(tier: Tier, rowHeight: number): RowMetrics {
  const base = BASE[tier.id]
  if (tier.id !== 'comfortable') return base

  return {
    ...base,
    logoSize: clamp(Math.round(rowHeight * 0.58), 18, 30),
    pointsFontSize: clamp(Math.round(rowHeight * 0.34), 13, 19),
    nameFontSize: clamp(Math.round(rowHeight * 0.28), 12, 15),
  }
}

export type ChipMode = 'full' | 'short' | 'logo'

/**
 * Picks how much of a team survives at this level.
 *
 * Rows are a fixed height and never wrap onto a second line, so a level holding
 * eight teams has to give up its names whatever tier the table is at. The
 * thresholds are per team width in pixels, measured against the longest mock
 * names at the relevant type size.
 */
export function chipMode(metrics: RowMetrics, teamCount: number, contentWidth: number): ChipMode {
  if (!metrics.showName) return 'logo'

  const perTeam = (contentWidth - metrics.chipGap * (teamCount - 1)) / teamCount
  if (perTeam >= 170) return 'full'
  if (perTeam >= 104) return 'short'
  return 'logo'
}
