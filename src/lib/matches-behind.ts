/*
  Matches behind: how many fixtures a team is short of the rest of its league.

  This matters more on a points axis than it does in a ranked list. The axis
  says a team is eleven points off the top, and that is a fact about the table,
  but if they are two matches behind it is not yet a fact about the season. The
  distance is the product, so anything that qualifies a distance has to be on
  screen next to it.

  Football usually calls this games in hand, from the point of view of the team
  that gains by it. The table states it the other way round, as a minus against
  the team that has played fewer, because a minus is what the axis is actually
  showing: a position lower than the season is going to leave them.

  The reference is the most matches any team in the table has played. Using
  actual played counts also handles a whole postponed round correctly: nobody
  is behind anybody, and nothing is marked.
*/

/** Anything carrying a played count. Standings rows are the usual input. */
export interface Playable {
  played: number
}

/**
 * The most matches any one team has played, which is the line everybody else is
 * measured against. Zero for an empty table.
 */
export function mostPlayed(teams: readonly Playable[]): number {
  let most = 0
  for (const team of teams) {
    if (team.played > most) most = team.played
  }
  return most
}

/**
 * Matches this team has still to play to draw level with the rest, or 0 when it
 * is not behind. Never negative: a team that has played the most is the
 * reference, not an anomaly.
 */
export function matchesBehind(team: Playable, most: number): number {
  return Math.max(0, most - team.played)
}
