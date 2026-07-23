/*
  The standings shape produced by both the mock generator and, later, the
  API-Football pipeline. One file per league (per snapshot while mocking), so
  the app only ever fetches a single static JSON to draw a table.

  Anything added here has to be produced by both sources, otherwise the switch
  from mocks to real data stops being a no-op for the app.
*/

/** A single result, most recent LAST in `TeamStanding.form`. */
export type FormResult = 'W' | 'D' | 'L'

export interface TeamStanding {
  /** Stable within a league. Real data uses the API-Football team id. */
  id: number
  name: string
  /** Pre-shortened label for the Compact tier, so the UI never truncates blind. */
  shortName: string
  /**
   * Absolute `https://` URL, or a path relative to the app base for bundled
   * assets. Resolve with `resolveAssetUrl` rather than using it directly.
   */
  logo: string
  /** 1-based, already reflects the league's tiebreakers. */
  rank: number
  points: number
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  /** Stored rather than derived, so the file matches what the source reported. */
  goalDifference: number
  /** Up to the last 5 results, most recent last. Shorter early in a season. */
  form: FormResult[]
}

export interface LeagueMeta {
  /** API-Football league id for real leagues, a synthetic id for mocks. */
  id: number
  /** Kebab-case, matches the JSON filename stem. */
  slug: string
  name: string
  country: string
  /** Starting year, so 2025 means the 2025/26 season. */
  season: number
}

/**
 * Present only in mock files. The real pipeline emits a league's current state
 * and has no concept of a snapshot, so the app must treat this as optional.
 */
export interface SnapshotMeta {
  /** 1-based, 1 is the season opening and 5 the final table. */
  index: number
  label: string
  roundsPlayed: number
  totalRounds: number
  /** Short note on the table shape this snapshot exists to exercise. */
  character: string
}

export interface StandingsFile {
  league: LeagueMeta
  /** ISO 8601 UTC, drives the "updated X ago" label. */
  fetchedAt: string
  snapshot?: SnapshotMeta
  /** Ordered by `rank` ascending. */
  teams: TeamStanding[]
}
