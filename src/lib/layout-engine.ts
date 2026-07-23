/*
  The points axis layout engine.

  Turns a set of standings plus the height available for the axis into an exact
  vertical layout: which content tier to render at, one uniform row height, and
  the pixel height of every gap between point levels.

  Deliberately pure and free of React, the DOM and the standings type, so it can
  be unit tested in node and driven from a ResizeObserver by the table UI.

  Two invariants outrank everything else:

  1. The result never exceeds the height it was given. There is no scrolling
     fallback anywhere in this app, so when even the Micro tier cannot fit, the
     engine reports that instead of returning a layout that overflows.
  2. Gap heights stay proportional to gap size in points. A 12 point gap is four
     times the height of a 3 point gap, at every viewport size, right up until
     the per gap minimum or the per point cap has to intervene.
*/

/** Anything with a points total can be laid out. Standings rows are the usual input. */
export interface Placeable {
  points: number
}

export type TierId = 'comfortable' | 'compact' | 'dense' | 'micro'

export interface Tier {
  id: TierId
  /**
   * The height rows are guaranteed at this tier, and therefore what tier
   * selection tests against.
   */
  minRowHeight: number
  /**
   * Only Comfortable has room above its minimum. The tighter tiers are fixed,
   * because their content is already stripped down to fit that exact height.
   */
  maxRowHeight: number
  /** Floor for a single gap, so even a 1 point gap still reads as air. */
  minGapHeight: number
}

/** Largest first. Tier selection walks this in order and takes the first that fits. */
export const TIERS: readonly Tier[] = [
  { id: 'comfortable', minRowHeight: 32, maxRowHeight: 56, minGapHeight: 8 },
  { id: 'compact', minRowHeight: 24, maxRowHeight: 24, minGapHeight: 4 },
  { id: 'dense', minRowHeight: 16, maxRowHeight: 16, minGapHeight: 3 },
  { id: 'micro', minRowHeight: 11, maxRowHeight: 11, minGapHeight: 2 },
]

const MICRO = TIERS[TIERS.length - 1]

/**
 * Ceiling on how much height one point of gap may claim. Without it a tall
 * screen in early season, where the whole table spans 4 points, would inflate
 * those few points into voids and lose the "everyone is level" reading.
 */
export const MAX_PIXELS_PER_POINT = 14

/** Below this a gap is plain whitespace. At or above it, it earns its "12 pts" label. */
export const GAP_LABEL_MIN_HEIGHT = 24

/**
 * How much of the truth a tier has to tell before it is allowed to be used.
 *
 * The tallest gap should be as many times the shortest as it is in points. Per
 * gap minimums mean it never quite is, so this is the share of that ratio a
 * tier has to reach. Below it, the axis is flat enough to be misleading and the
 * engine steps down a tier: rows lose content, which CLAUDE.md asks for, rather
 * than the distances losing their meaning, which it forbids.
 *
 * 0.6 comes from the mock tables. A 20 team final standing on a 900px screen
 * renders its 19 point chasm at 4.9 times the smallest gap in the Comfortable
 * tier and 14.9 times in Compact, against a true 19, so this is what separates
 * them.
 */
export const MIN_GAP_TRUTH = 0.6

export interface LayoutRow<T> {
  kind: 'row'
  /** The point total shared by every team in the row. */
  points: number
  /** Input order preserved, so a rank sorted table stays rank sorted. */
  teams: T[]
  height: number
  /** Offset from the top of the axis, for absolute positioning and transitions. */
  top: number
}

export interface LayoutGap {
  kind: 'gap'
  /** Points of the level above this gap. */
  fromPoints: number
  /** Points of the level below this gap. */
  toPoints: number
  /** Size of the gap in points, always at least 1. */
  size: number
  height: number
  /** True once the gap is tall enough to carry its size label legibly. */
  showLabel: boolean
  top: number
}

export type LayoutItem<T> = LayoutRow<T> | LayoutGap

export interface FittedLayout<T> {
  fits: true
  tier: Tier
  /** Uniform across every row, by invariant. */
  rowHeight: number
  /** Rows and gaps interleaved, top to bottom. What the renderer walks. */
  items: LayoutItem<T>[]
  rows: LayoutRow<T>[]
  gaps: LayoutGap[]
  /**
   * Sum of every item height. Never greater than the height passed in, give or
   * take the float epsilon that summing twenty divisions leaves behind.
   */
  height: number
  /**
   * Height left over once gaps hit their per point caps. Positive means the
   * table top aligns and stays compact rather than stretching to fill.
   */
  surplus: number
}

export interface TooSmallLayout {
  fits: false
  /**
   * The smallest height that could render this table, from the Micro tier and
   * its 2px gap minimums. Derived from the data, so an 18 team league and a 20
   * team league get different thresholds.
   */
  requiredHeight: number
  /** Occupied point levels the table would have needed. */
  levelCount: number
}

export type Layout<T> = FittedLayout<T> | TooSmallLayout

interface Level<T> {
  points: number
  teams: T[]
}

/**
 * Groups teams onto shared point totals, highest first.
 *
 * This is also where the axis gets cropped to the occupied range: levels only
 * ever exist for totals a team actually holds, so nothing is rendered above the
 * leader or below the last team.
 */
function toLevels<T extends Placeable>(teams: readonly T[]): Level<T>[] {
  const byPoints = new Map<number, T[]>()
  for (const team of teams) {
    const existing = byPoints.get(team.points)
    if (existing) existing.push(team)
    else byPoints.set(team.points, [team])
  }

  return [...byPoints.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([points, levelTeams]) => ({ points, teams: levelTeams }))
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Splits `total` across gaps in proportion to their size in points, with each
 * gap held between `minHeight` and its own per point cap.
 *
 * Clamping one gap changes what every other gap is owed, so this settles by
 * repeated passes. Caps are resolved before minimums on purpose: capping a gap
 * hands height back to the others, so a gap can only be pushed down to its
 * minimum once every cap it might have benefited from is already known.
 */
function distributeGapHeights(total: number, sizes: readonly number[], minHeight: number): number[] {
  const heights = sizes.map(() => 0)
  const settled = sizes.map(() => false)

  let remaining = total
  let freePoints = sizes.reduce((sum, size) => sum + size, 0)

  const settle = (i: number, height: number) => {
    heights[i] = height
    settled[i] = true
    remaining -= height
    freePoints -= sizes[i]
  }

  // Each pass settles at least one gap, so this cannot run longer than there
  // are gaps. The loop bound is belt and braces against a float edge case.
  for (let pass = 0; pass <= sizes.length; pass += 1) {
    if (freePoints <= 0) break

    const overCap: number[] = []
    const underMin: number[] = []

    for (let i = 0; i < sizes.length; i += 1) {
      if (settled[i]) continue
      const share = (remaining * sizes[i]) / freePoints
      if (share > MAX_PIXELS_PER_POINT * sizes[i]) overCap.push(i)
      else if (share < minHeight) underMin.push(i)
    }

    if (overCap.length > 0) {
      for (const i of overCap) settle(i, MAX_PIXELS_PER_POINT * sizes[i])
      continue
    }
    if (underMin.length > 0) {
      for (const i of underMin) settle(i, minHeight)
      continue
    }
    break
  }

  // Whatever is still free is inside its bounds, so a plain proportional split
  // is exact and keeps the ratios the product is built on.
  if (freePoints > 0) {
    for (let i = 0; i < sizes.length; i += 1) {
      if (!settled[i]) heights[i] = (remaining * sizes[i]) / freePoints
    }
  }

  return heights
}

interface Solution {
  tier: Tier
  rowHeight: number
  gapHeights: number[]
}

/** Rows and gaps for one tier, with no judgement about whether it is a good fit. */
function solve(
  tier: Tier,
  levelCount: number,
  gapSizes: readonly number[],
  gapPoints: number,
  availableHeight: number,
): Solution {
  // Rows only grow past the tier minimum with height the gaps have no use for,
  // which is what keeps proportionality ahead of row comfort. Once every gap
  // sits at its per point cap, the leftover is the rows' to take, continuously
  // up to the Comfortable maximum.
  const spareForRows = availableHeight - MAX_PIXELS_PER_POINT * gapPoints
  const rowHeight = clamp(spareForRows / levelCount, tier.minRowHeight, tier.maxRowHeight)

  return {
    tier,
    rowHeight,
    gapHeights: distributeGapHeights(
      availableHeight - rowHeight * levelCount,
      gapSizes,
      tier.minGapHeight,
    ),
  }
}

/**
 * Whether a tier flattens the axis far enough to misrepresent it.
 *
 * Compares the tallest and shortest gap against the ratio their point sizes
 * demand. A table whose gaps are all the same size can never be misrepresented,
 * which is why the comparison is a ratio of ratios rather than a count of gaps
 * sitting on the floor.
 */
function misrepresents({ gapHeights }: Solution, gapSizes: readonly number[]): boolean {
  if (gapSizes.length < 2) return false

  const largest = Math.max(...gapSizes)
  const smallest = Math.min(...gapSizes)
  if (largest === smallest) return false

  const tallest = Math.max(...gapHeights)
  const shortest = Math.min(...gapHeights)
  return tallest / shortest < (largest / smallest) * MIN_GAP_TRUTH
}

/**
 * Computes the layout for one league at one viewport size.
 *
 * `availableHeight` is the space the axis itself may occupy, so the caller
 * subtracts its header and chrome first.
 */
export function computeLayout<T extends Placeable>(
  teams: readonly T[],
  availableHeight: number,
): Layout<T> {
  const levels = toLevels(teams)
  const gapSizes = levels.slice(1).map((level, i) => levels[i].points - level.points)
  const gapPoints = gapSizes.reduce((sum, size) => sum + size, 0)

  if (levels.length === 0) {
    return {
      fits: true,
      tier: TIERS[0],
      rowHeight: 0,
      items: [],
      rows: [],
      gaps: [],
      height: 0,
      surplus: Math.max(availableHeight, 0),
    }
  }

  const floorFor = (tier: Tier) =>
    levels.length * tier.minRowHeight + gapSizes.length * tier.minGapHeight

  const affordable = TIERS.filter((candidate) => floorFor(candidate) <= availableHeight)
  if (affordable.length === 0) {
    return { fits: false, requiredHeight: floorFor(MICRO), levelCount: levels.length }
  }

  // Largest tier whose axis still tells the truth. When every tier that fits
  // would flatten it, stepping down buys nothing, so the largest one is kept
  // and the rows at least stay readable.
  const solved = affordable.map((candidate) =>
    solve(candidate, levels.length, gapSizes, gapPoints, availableHeight),
  )
  const { tier, rowHeight, gapHeights } =
    solved.find((candidate) => !misrepresents(candidate, gapSizes)) ?? solved[0]

  const items: LayoutItem<T>[] = []
  const rows: LayoutRow<T>[] = []
  const gaps: LayoutGap[] = []
  let top = 0

  levels.forEach((level, i) => {
    if (i > 0) {
      const height = gapHeights[i - 1]
      const gap: LayoutGap = {
        kind: 'gap',
        fromPoints: levels[i - 1].points,
        toPoints: level.points,
        size: gapSizes[i - 1],
        height,
        showLabel: height >= GAP_LABEL_MIN_HEIGHT,
        top,
      }
      items.push(gap)
      gaps.push(gap)
      top += height
    }

    const row: LayoutRow<T> = {
      kind: 'row',
      points: level.points,
      teams: level.teams,
      height: rowHeight,
      top,
    }
    items.push(row)
    rows.push(row)
    top += rowHeight
  })

  return {
    fits: true,
    tier,
    rowHeight,
    items,
    rows,
    gaps,
    height: top,
    surplus: availableHeight - top,
  }
}

/**
 * The height below which `computeLayout` reports that the table cannot be
 * drawn. Exposed so the shell can reason about the fallback panel without
 * running a layout first.
 */
export function minimumViableHeight<T extends Placeable>(teams: readonly T[]): number {
  const levels = toLevels(teams)
  if (levels.length === 0) return 0
  return levels.length * MICRO.minRowHeight + (levels.length - 1) * MICRO.minGapHeight
}
