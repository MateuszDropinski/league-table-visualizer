export const leagues = [
  { slug: 'premier-league', name: 'Premier League', country: 'England', code: 'PL', teamCount: 20 },
  { slug: 'la-liga', name: 'La Liga', country: 'Spain', code: 'LL', teamCount: 20 },
  { slug: 'bundesliga', name: 'Bundesliga', country: 'Germany', code: 'BL', teamCount: 18 },
  { slug: 'serie-a', name: 'Serie A', country: 'Italy', code: 'SA', teamCount: 20 },
  { slug: 'ligue-1', name: 'Ligue 1', country: 'France', code: 'L1', teamCount: 18 },
  { slug: 'ekstraklasa', name: 'Ekstraklasa', country: 'Poland', code: 'EK', teamCount: 18 },
] as const

export type LeagueSlug = typeof leagues[number]['slug']

export function isLeagueSlug(value: string): value is LeagueSlug {
  return leagues.some((league) => league.slug === value)
}
