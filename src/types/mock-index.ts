/*
  Shape of `public/data/mock/index.json`, written by the mock generator and
  read only by the dev switcher. It exists so the switcher can list what is
  available without the league rosters and points profiles being bundled into
  the app, and so adding a mock league needs no change to the app code.
*/

export interface MockSnapshotEntry {
  /** 1-based, 1 is the season opening and 5 the final table. */
  index: number
  label: string
  /** Filename within the mock data directory. */
  file: string
  roundsPlayed: number
  totalRounds: number
  /** Distinct point totals, so the number of team rows the table will draw. */
  levels: number
  /** Points between the leader and the last team, the height of the axis. */
  spread: number
}

export interface MockLeagueEntry {
  id: number
  slug: string
  name: string
  country: string
  season: number
  /** What this league puts in front of the layout engine. */
  character: string
  teamCount: number
  snapshots: MockSnapshotEntry[]
}

export interface MockIndex {
  leagues: MockLeagueEntry[]
}
