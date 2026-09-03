export interface LeagueAccent {
  from: string
  to: string
}

const ACCENTS: Record<string, LeagueAccent> = {
  // Real leagues, from their own visual identities.
  'premier-league': { from: '#963cff', to: '#00ff87' },
  'la-liga': { from: '#ff4b44', to: '#ffb400' },
  bundesliga: { from: '#d20515', to: '#f4f4f4' },
  'serie-a': { from: '#0d5eaf', to: '#00c4ff' },
  'ligue-1': { from: '#1e40af', to: '#dcff4f' },
  ekstraklasa: { from: '#dc143c', to: '#ffd700' },
}

const FALLBACK: LeagueAccent[] = [
  { from: '#38bdf8', to: '#818cf8' },
  { from: '#fb7185', to: '#fbbf24' },
  { from: '#34d399', to: '#22d3ee' },
  { from: '#c084fc', to: '#f472b6' },
]

/** Never fails, so an unconfigured league still gets a stable colour of its own. */
export function leagueAccent(slug: string): LeagueAccent {
  const known = ACCENTS[slug]
  if (known) return known

  let hash = 0
  for (let i = 0; i < slug.length; i += 1) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0
  return FALLBACK[hash % FALLBACK.length]
}
