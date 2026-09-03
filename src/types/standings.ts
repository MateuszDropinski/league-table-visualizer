/** Recent results in chronological order. An empty array means not verified. */
export type FormResult = 'W' | 'D' | 'L'

export interface TeamStanding {
  /** Stable local identifier, independent of position. */
  id: number
  name: string
  shortName: string
  /** Public badge URL, or an asset path relative to the application base. */
  logo: string
  /** Source-published position, including shared positions. */
  rank: number
  points: number
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  /** Signed adjustment, e.g. -3 for a documented points deduction. */
  pointsAdjustment?: number
  adjustmentNote?: string
  form: FormResult[]
}

export interface LeagueMeta {
  id: number
  slug: string
  name: string
  country: string
  /** Starting year: 2026 means 2026/27. */
  season: number
}

export interface StandingsSource {
  name: string
  url: string
}

export interface StandingsFile {
  league: LeagueMeta
  /** Date the published standings were manually checked, YYYY-MM-DD. */
  checkedAt: string
  /** Primary source first; subsequent entries are cross-checks. */
  sources: StandingsSource[]
  /** Preserve published order. Do not apply a universal tiebreaker. */
  teams: TeamStanding[]
}
