import { useCallback, useEffect, useMemo, useState } from 'react'

import { LeagueTable } from './components/league-table'
import { loadMockIndex, loadMockSnapshot } from './data/standings-source'
import { DemoControls, type MockSelection } from './components/demo-controls'
import { leagueAccent } from './lib/league-accent'
import type { MockIndex } from './types/mock-index'
import type { StandingsFile } from './types/standings'

export function App() {
  const [index, setIndex] = useState<MockIndex | null>(null)
  const [selection, setSelection] = useState<MockSelection | null>(null)
  const [standings, setStandings] = useState<StandingsFile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [indexAttempt, setIndexAttempt] = useState(0)
  const [snapshotAttempt, setSnapshotAttempt] = useState(0)

  const accent = useMemo(
    () => leagueAccent(standings?.league.slug ?? ''),
    [standings?.league.slug],
  )

  const fail = useCallback((cause: unknown) => {
    // An aborted fetch is a normal consequence of switching snapshots quickly
    // or of StrictMode running effects twice, not something to surface.
    if (cause instanceof DOMException && cause.name === 'AbortError') return
    setError(cause instanceof Error ? cause.message : String(cause))
    setLoading(false)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setError(null)
    setLoading(true)
    loadMockIndex(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        if (!data.leagues?.length || data.leagues.some((league) => !league.snapshots?.length)) {
          throw new Error('No demo snapshots are available.')
        }
        setIndex(data)
        const first = data.leagues[0]
        setSelection({
          leagueSlug: first.slug,
          // Open on the final table, the widest spread and the most
          // interesting thing to look at before the engine exists.
          snapshotIndex: first.snapshots[first.snapshots.length - 1].index,
        })
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) fail(cause)
      })
    return () => controller.abort()
  }, [fail, indexAttempt])

  useEffect(() => {
    if (!index || !selection) return

    const league =
      index.leagues.find((l) => l.slug === selection.leagueSlug) ?? index.leagues[0]
    const snapshot =
      league.snapshots.find((s) => s.index === selection.snapshotIndex) ?? league.snapshots[0]

    const controller = new AbortController()
    setError(null)
    setLoading(true)
    loadMockSnapshot(snapshot.file, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        setStandings(data)
        setLoading(false)
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) fail(cause)
      })
    return () => controller.abort()
  }, [index, selection, fail, snapshotAttempt])

  const retry = () => {
    if (index) setSnapshotAttempt((attempt) => attempt + 1)
    else setIndexAttempt((attempt) => attempt + 1)
  }

  // Nothing above or below the table: the whole viewport height is the axis,
  // which is the only way a row per point has room to be worth looking at.
  // League switching becomes buttons floating over it, not a header.
  //
  // Heights are minimums, not fixed: a table wider than the screen can take
  // makes this grow past the viewport and the page scrolls with it.
  return (
    <main className="flex min-h-dvh justify-center bg-slate-950 text-slate-100">
      <h1 className="sr-only">Points-First League Table demo</h1>
      {standings && (
        <div className="w-full max-w-3xl px-4 pb-24" aria-busy={loading}>
          <LeagueTable standings={standings} accent={accent} />
        </div>
      )}

      {(loading || error) && (
        <div className="fixed left-1/2 top-4 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-lg border border-slate-700 bg-slate-900 p-4 shadow-lg">
          <p role={error ? 'alert' : 'status'} className="text-sm text-slate-200">
            {error ? 'Could not load standings.' : 'Loading standings...'}
            {standings && ` Still showing ${standings.league.name}, stage ${standings.snapshot?.index ?? ''}.`}
          </p>
          {error && (
            <>
              <p className="mt-2 break-words text-xs text-slate-400">{error}</p>
              <button type="button" onClick={retry} className="mt-3 rounded border border-slate-500 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-emerald-400">
                Retry
              </button>
            </>
          )}
        </div>
      )}

      {index && selection && (
        <DemoControls index={index} selection={selection} onSelect={setSelection} />
      )}
    </main>
  )
}
