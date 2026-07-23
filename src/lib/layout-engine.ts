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

  The one invariant: the grid occupies exactly the height it was given, so the
  table always fits the viewport and never scrolls.
*/

/** Anything with a points total can be laid out. Standings rows are the usual input. */
export interface Placeable {
  points: number
}

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
  /** Uniform across every row, by invariant. Fractional, so the grid fills exactly. */
  rowHeight: number
  /** Points from the leader to the last team, which is one less than the row count. */
  spread: number
  /** What the grid occupies, which is the height it was given. */
  height: number
}

/**
 * Builds the grid for one league at one container height.
 *
 * `availableHeight` is the whole space the table may occupy, since nothing sits
 * above or below it.
 *
 * There is no minimum row height and no fallback for a short screen: rows get
 * whatever `availableHeight / rowCount` comes to, however small. That is
 * deliberate for now, so the behaviour of a 76 row table on a laptop screen is
 * visible rather than hidden behind a floor.
 */
export function computeGrid<T extends Placeable>(
  teams: readonly T[],
  availableHeight: number,
): Grid<T> {
  if (teams.length === 0) {
    return { rows: [], rowHeight: 0, spread: 0, height: 0 }
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
  const rowHeight = availableHeight / rowCount

  const rows: GridRow<T>[] = []
  for (let points = top; points >= bottom; points -= 1) {
    rows.push({ points, teams: byPoints.get(points) ?? [] })
  }

  return { rows, rowHeight, spread: top - bottom, height: rowHeight * rowCount }
}
