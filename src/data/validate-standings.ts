import type { StandingsFile } from '../types/standings.ts'

type ExpectedLeague = { slug: string; name: string; country: string; teamCount: number }

function requireValue(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Invalid standings: ${message}`)
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const integer = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value)
const https = (value: unknown): boolean => {
  if (!text(value)) return false
  try { return new URL(value).protocol === 'https:' } catch { return false }
}

/** Shared by the browser and CI. Accounting checks never re-sort a source table. */
export function validateStandings(value: unknown, expected: ExpectedLeague): asserts value is StandingsFile {
  requireValue(record(value), 'expected an object')
  const { league, checkedAt, sources, teams } = value
  requireValue(record(league), 'missing league metadata')
  requireValue(league.slug === expected.slug && league.name === expected.name && league.country === expected.country, 'league does not match requested file')
  requireValue(integer(league.id) && league.id > 0 && integer(league.season) && league.season >= 2000, 'invalid league identity or season')
  requireValue(text(checkedAt) && /^\d{4}-\d{2}-\d{2}$/.test(checkedAt) && Number.isFinite(Date.parse(checkedAt)) && new Date(checkedAt).toISOString().slice(0, 10) === checkedAt, 'invalid checked date')
  requireValue(checkedAt <= new Date().toISOString().slice(0, 10), 'checked date is in the future')
  requireValue(Array.isArray(sources) && sources.length > 0, 'missing published sources')
  for (const source of sources) requireValue(record(source) && text(source.name) && https(source.url), 'invalid source')
  requireValue(Array.isArray(teams) && teams.length === expected.teamCount, `expected ${expected.teamCount} clubs`)
  const ids = new Set<number>()
  const names = new Set<string>()
  let previousRank = 0
  let previousPoints = Infinity
  let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0
  for (const [index, team] of teams.entries()) {
    requireValue(record(team), `club ${index + 1} is not an object`)
    const fields = ['id', 'rank', 'points', 'played', 'won', 'drawn', 'lost', 'goalsFor', 'goalsAgainst', 'goalDifference'] as const
    for (const field of fields) requireValue(integer(team[field]), `${team.name}: invalid ${field}`)
    requireValue(text(team.name) && text(team.shortName) && https(team.logo), 'missing club name or badge URL')
    const t = team as unknown as StandingsFile['teams'][number]
    requireValue(t.id > 0 && !ids.has(t.id) && !names.has(t.name), `${t.name}: duplicate or invalid identity`)
    ids.add(t.id); names.add(t.name)
    requireValue(t.rank >= 1 && t.rank <= index + 1 && t.rank >= previousRank && (t.rank === previousRank || t.rank === index + 1), `${t.name}: invalid published rank`)
    requireValue(t.points <= previousPoints, `${t.name}: points order is inconsistent`)
    requireValue(t.rank !== previousRank || t.points === previousPoints, `${t.name}: shared rank has different points`)
    previousRank = t.rank; previousPoints = t.points
    requireValue([t.played, t.won, t.drawn, t.lost, t.goalsFor, t.goalsAgainst].every((n) => n >= 0), `${t.name}: negative record`)
    requireValue(t.played <= (expected.teamCount - 1) * 2, `${t.name}: too many matches`)
    requireValue(t.won + t.drawn + t.lost === t.played, `${t.name}: W+D+L differs from played`)
    const adjustment = t.pointsAdjustment ?? 0
    requireValue(integer(adjustment) && (adjustment === 0 || text(t.adjustmentNote)), `${t.name}: undocumented points adjustment`)
    requireValue(t.won * 3 + t.drawn + adjustment === t.points, `${t.name}: points do not match record`)
    requireValue(t.goalsFor - t.goalsAgainst === t.goalDifference, `${t.name}: goal difference is inconsistent`)
    requireValue(Array.isArray(t.form) && t.form.length <= Math.min(5, t.played) && t.form.every((r) => ['W', 'D', 'L'].includes(r)), `${t.name}: invalid recent form`)
    wins += t.won; draws += t.drawn; losses += t.lost; goalsFor += t.goalsFor; goalsAgainst += t.goalsAgainst
  }
  requireValue(wins === losses && draws % 2 === 0, 'league-wide results do not balance')
  requireValue(goalsFor === goalsAgainst, 'league-wide goals do not balance')
}
