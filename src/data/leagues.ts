export const leagues = [
  { slug: 'premier-league', name: 'Premier League', country: 'England', teamCount: 20 },
  { slug: 'la-liga', name: 'La Liga', country: 'Spain', teamCount: 20 },
  { slug: 'bundesliga', name: 'Bundesliga', country: 'Germany', teamCount: 18 },
  { slug: 'serie-a', name: 'Serie A', country: 'Italy', teamCount: 20 },
  { slug: 'ligue-1', name: 'Ligue 1', country: 'France', teamCount: 18 },
  { slug: 'ekstraklasa', name: 'Ekstraklasa', country: 'Poland', teamCount: 18 },
] as const

export type LeagueSlug = typeof leagues[number]['slug']

export function isLeagueSlug(value: string): value is LeagueSlug {
  return leagues.some((league) => league.slug === value)
}
