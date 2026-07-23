/*
  The points axis layout engine.

  The axis is a grid, not a stack. Every point value between the leader's total
  and the last team's total gets its own row of exactly the same height, whether
  or not a team holds it. A gap is not a spacer between rows, it is simply the
  run of empty rows where nobody scored that many points, which is what makes
  distance readable with no proportional maths at all: three empty rows is three
  points, everywhere, always.

  Deliberately pure and free of React, the DOM and the standings type, so it can
  be unit tested in node and driven from a ResizeObserver by the table UI.

  Rows have a floor and the grid does not shrink below it. A wide spread on a
  short screen therefore overflows, and the page scrolls. That is a change of
  mind about the product, not an accident: a row too short to hold a team name
  is not worth fitting on screen, so the height a row needs wins over showing
  the whole table at once.
*/

/** Anything with a points total can be laid out. Standings rows are the usual input. */
export interface Placeable {
  points: number
}

/**
 * The shortest a row may be, which is what a crest and a readable name need.
 * Rows never go below it, so this is also what decides when a table scrolls.
 *
 * 20px rather than 24: a short name at 10px type still reads at that height,
 * and the four pixels are worth roughly a fifth more of a wide table on screen
 * at once, which is the thing the axis is actually for.
 */
export const MIN_ROW_HEIGHT = 20

export interface GridRow<T> {
  /** The point total this row stands for, occupied or not. */
  points: number
  /**
   * Teams on exactly this total, in input order. Empty for a point value no
   * team holds, which still gets a row of its own.
   */
  teams: T[]
}

export interface Grid<T> {
  /** One per point value, from the leader's total down to the last team's. */
  rows: GridRow<T>[]
  /** Uniform across every row, by invariant. Never below `MIN_ROW_HEIGHT`. */
  rowHeight: number
  /** Points from the leader to the last team, which is one less than the row count. */
  spread: number
  /** What the grid occupies. Greater than the container height when it scrolls. */
  height: number
  /** True once the row floor pushes the grid past the height it was given. */
  scrolls: boolean
}

/**
 * Builds the grid for one league at one container height.
 *
 * `availableHeight` is the viewport, since nothing sits above or below the
 * table and the table is what the page is.
 *
 * Rows share out the height when there is enough of it and sit on
 * `MIN_ROW_HEIGHT` when there is not, in which case `scrolls` is true and the
 * grid is taller than the viewport on purpose.
 */
export function computeGrid<T extends Placeable>(
  teams: readonly T[],
  availableHeight: number,
): Grid<T> {
  if (teams.length === 0) {
    return { rows: [], rowHeight: 0, spread: 0, height: 0, scrolls: false }
  }

  const byPoints = new Map<number, T[]>()
  let top = -Infinity
  let bottom = Infinity

  for (const team of teams) {
    const existing = byPoints.get(team.points)
    if (existing) existing.push(team)
    else byPoints.set(team.points, [team])

    if (team.points > top) top = team.points
    if (team.points < bottom) bottom = team.points
  }

  // Inclusive of both ends, so a league whose leader and last team share a
  // total is one row rather than none.
  const rowCount = top - bottom + 1
  const rowHeight = Math.max(MIN_ROW_HEIGHT, availableHeight / rowCount)
  const height = rowHeight * rowCount

  const rows: GridRow<T>[] = []
  for (let points = top; points >= bottom; points -= 1) {
    rows.push({ points, teams: byPoints.get(points) ?? [] })
  }

  return {
    rows,
    rowHeight,
    spread: top - bottom,
    height,
    scrolls: height > availableHeight + 1e-9,
  }
}
