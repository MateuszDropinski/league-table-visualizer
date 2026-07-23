import { useCallback, useEffect, useMemo, useState } from 'react'

import { LeagueTable } from './components/league-table'
import { loadMockIndex, loadMockSnapshot } from './data/standings-source'
import { MockSwitcher, type MockSelection } from './dev/mock-switcher'
import { leagueAccent } from './lib/league-accent'
import type { MockIndex } from './types/mock-index'
import type { StandingsFile } from './types/standings'

export function App() {
  const [index, setIndex] = useState<MockIndex | null>(null)
  const [selection, setSelection] = useState<MockSelection | null>(null)
  const [standings, setStandings] = useState<StandingsFile | null>(null)
  const [error, setError] = useState<string | null>(null)

  const accent = useMemo(
    () => leagueAccent(standings?.league.slug ?? ''),
    [standings?.league.slug],
  )

  const fail = useCallback((cause: unknown) => {
    // An aborted fetch is a normal consequence of switching snapshots quickly
    // or of StrictMode running effects twice, not something to surface.
    if (cause instanceof DOMException && cause.name === 'AbortError') return
    setError(cause instanceof Error ? cause.message : String(cause))
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    loadMockIndex(controller.signal)
      .then((data) => {
        setIndex(data)
        const first = data.leagues[0]
        setSelection({
          leagueSlug: first.slug,
          // Open on the final table, the widest spread and the most
          // interesting thing to look at before the engine exists.
          snapshotIndex: first.snapshots[first.snapshots.length - 1].index,
        })
      })
      .catch(fail)
    return () => controller.abort()
  }, [fail])

  useEffect(() => {
    if (!index || !selection) return

    const league =
      index.leagues.find((l) => l.slug === selection.leagueSlug) ?? index.leagues[0]
    const snapshot =
      league.snapshots.find((s) => s.index === selection.snapshotIndex) ?? league.snapshots[0]

    const controller = new AbortController()
    loadMockSnapshot(snapshot.file, controller.signal).then(setStandings).catch(fail)
    return () => controller.abort()
  }, [index, selection, fail])

  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-950 px-6 text-center">
        <div className="max-w-sm">
          <p className="text-sm font-semibold text-rose-400">Could not load standings</p>
          <p className="mt-2 font-mono text-xs leading-relaxed text-slate-500">{error}</p>
        </div>
      </div>
    )
  }

  if (!standings || !index || !selection) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-950">
        <p className="text-sm text-slate-500">Loading standings...</p>
      </div>
    )
  }

  // Nothing above or below the table: the whole viewport height is the axis,
  // which is the only way a row per point has room to be worth looking at.
  // League switching becomes buttons floating over it, not a header.
  //
  // Heights are minimums, not fixed: a table wider than the screen can take
  // makes this grow past the viewport and the page scrolls with it.
  return (
    <div className="flex min-h-dvh justify-center bg-slate-950 text-slate-100">
      <div className="w-full max-w-3xl px-4">
        <LeagueTable standings={standings} accent={accent} />
      </div>

      {import.meta.env.DEV && (
        <MockSwitcher index={index} selection={selection} onSelect={setSelection} />
      )}
    </div>
  )
}
