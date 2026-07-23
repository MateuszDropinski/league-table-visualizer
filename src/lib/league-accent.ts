/*
  The two colour gradient each league is drawn with.

  Task 05 gives leagues a proper config file and this map folds into it. It sits
  on its own for now because the table already needs an identity colour and the
  mock leagues are the only ones that exist. Real slugs are here too, so the
  switch to live data does not arrive with every league looking the same.
*/

export interface LeagueAccent {
  from: string
  to: string
}

const ACCENTS: Record<string, LeagueAccent> = {
  // Mock leagues, picked to be told apart at a glance while flipping snapshots.
  'albion-league': { from: '#8b5cf6', to: '#ec4899' },
  'iberia-primera': { from: '#f97316', to: '#e11d48' },
  'rheinland-liga': { from: '#ef4444', to: '#f59e0b' },
  'vistula-ekstraliga': { from: '#10b981', to: '#a3e635' },
  'nordic-serien': { from: '#22d3ee', to: '#3b82f6' },

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
