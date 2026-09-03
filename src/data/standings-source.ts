import { resolveAssetUrl } from './asset-url'
import { leagues, type LeagueSlug } from './leagues'
import { validateStandings } from './validate-standings'
import type { StandingsFile } from '../types/standings'

export async function loadStandings(slug: LeagueSlug, signal?: AbortSignal): Promise<StandingsFile> {
  const response = await fetch(resolveAssetUrl(`data/${slug}.json`), { signal, cache: 'no-cache' })
  if (!response.ok) throw new Error(`Standings file returned ${response.status}. Please try again.`)
  const data: unknown = await response.json()
  validateStandings(data, leagues.find((league) => league.slug === slug)!)
  return data
}
