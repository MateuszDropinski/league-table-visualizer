export const leagues = [
  { slug: 'premier-league', logo: 'https://www.premierleague.com/resources/v1.52.5/i/favicon/favicon-96x96.png', logoOnLight: true, name: 'Premier League', country: 'England', teamCount: 20 },
  { slug: 'la-liga', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/20/LaLiga_2023_Vertical_Logo.svg', logoOnLight: false, name: 'La Liga', country: 'Spain', teamCount: 20 },
  { slug: 'bundesliga', logo: 'https://www.bundesliga.com/assets/favicons/favicon-32x32.png', logoOnLight: false, name: 'Bundesliga', country: 'Germany', teamCount: 18 },
  { slug: 'serie-a', logo: 'https://images.legaseriea.it/image/private/t_q_good/v1762881268/prd/assets/competitions/Serie%20A.png', logoOnLight: true, name: 'Serie A', country: 'Italy', teamCount: 20 },
  { slug: 'ligue-1', logo: 'https://ligue1.com/favicon.ico', logoOnLight: false, name: 'Ligue 1', country: 'France', teamCount: 18 },
  { slug: 'ekstraklasa', logo: 'https://ekstraklasa.org/icon.png?icon.0wu37xahwa004.png', logoOnLight: false, name: 'Ekstraklasa', country: 'Poland', teamCount: 18 },
] as const

export type LeagueSlug = typeof leagues[number]['slug']

export function isLeagueSlug(value: string): value is LeagueSlug {
  return leagues.some((league) => league.slug === value)
}
