export interface LeagueAccent {
  from: string
  to: string
}

// Brand-inspired accents adapted for the dark UI. References: README.md.
const ACCENTS: Record<string, LeagueAccent> = {
  'premier-league': { from: '#8c48ff', to: '#c4a2ff' },
  'la-liga': { from: '#ff4b44', to: '#ffa39e' },
  bundesliga: { from: '#c80a00', to: '#ff8d86' },
  'serie-a': { from: '#0057b8', to: '#63caff' },
  'ligue-1': { from: '#085fff', to: '#ff7fde' },
  ekstraklasa: { from: '#001ca7', to: '#68baff' },
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
