import { useEffect, useState } from 'react'

import { LeagueNavigation } from './components/league-navigation'
import { LeagueTable } from './components/league-table'
import { isLeagueSlug, leagues, type LeagueSlug } from './data/leagues'
import { loadStandings } from './data/standings-source'
import { leagueAccent } from './lib/league-accent'
import type { StandingsFile } from './types/standings'

function leagueFromLocation(): LeagueSlug {
  const value = window.location.hash.slice(1)
  return isLeagueSlug(value) ? value : leagues[0].slug
}

export function App() {
  const [selected, setSelected] = useState(leagueFromLocation)
  const [standings, setStandings] = useState<StandingsFile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const onHashChange = () => setSelected(leagueFromLocation())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    loadStandings(selected, controller.signal).then((data) => {
      if (controller.signal.aborted) return
      setStandings(data)
      setLoading(false)
      document.title = `${data.league.name} · Points-First League Table`
      window.scrollTo({ top: 0, behavior: 'instant' })
    }).catch((reason: unknown) => {
      if (controller.signal.aborted) return
      setError(reason instanceof Error ? reason.message : 'Please try again.')
      setLoading(false)
    })
    return () => controller.abort()
  }, [selected, attempt])

  const accent = leagueAccent(standings?.league.slug ?? selected)

  return (
    <main className="min-h-dvh bg-slate-950 text-slate-100" style={{ backgroundImage: `radial-gradient(ellipse at top right, ${accent.from}1f, transparent 65%)`, backgroundAttachment: 'fixed' }}>
      <h1 className="sr-only">Points-First League Table</h1>
      <LeagueNavigation selected={selected} standings={standings} />
      <div className="flex min-h-dvh justify-center lg:pl-52">
        {standings && (
          <div className="w-full max-w-4xl px-1 sm:px-4" aria-busy={loading}>
            <LeagueTable key={standings.league.slug} standings={standings} accent={leagueAccent(standings.league.slug)} />
          </div>
        )}
      </div>
      {(loading || error) && (
        <div className="fixed left-1/2 top-4 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-lg border border-slate-700 bg-slate-900 p-4 shadow-lg">
          <p role={error ? 'alert' : 'status'} className="text-sm text-slate-200">
            {error ? 'Could not load standings.' : 'Loading standings…'}
            {standings && ` Still showing ${standings.league.name}.`}
          </p>
          {error && <>
            <p className="mt-2 break-words text-xs text-slate-400">{error}</p>
            <button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-3 rounded border border-slate-500 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-emerald-400">Retry</button>
          </>}
        </div>
      )}
    </main>
  )
}
