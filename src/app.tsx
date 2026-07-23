import { useCallback, useEffect, useState } from 'react'

import { resolveAssetUrl } from './data/asset-url'
import { loadMockIndex, loadMockSnapshot } from './data/standings-source'
import { MockSwitcher, type MockSelection } from './dev/mock-switcher'
import { formatRelativeTime } from './lib/relative-time'
import type { MockIndex } from './types/mock-index'
import type { FormResult, StandingsFile, TeamStanding } from './types/standings'

const FORM_COLOURS: Record<FormResult, string> = {
  W: 'bg-emerald-500',
  D: 'bg-amber-500',
  L: 'bg-rose-600',
}

const FORM_LABELS: Record<FormResult, string> = { W: 'win', D: 'draw', L: 'loss' }

/*
  Placeholder listing, not the product.

  The points axis, proportional gaps and the fit-always tier ladder all arrive
  with the layout engine in task 03. This is a plain ranked list whose only job
  is to prove the mock snapshots load, parse and render, and to give the dev
  switcher something to visibly change. Rows are deliberately tiny so that 20
  teams still fit without scrolling, since the document itself cannot scroll.
*/
function TeamRow({ team }: { team: TeamStanding }) {
  return (
    <li className="flex h-[26px] items-center gap-2 border-b border-slate-800/60 px-2 text-xs">
      <span className="w-5 shrink-0 text-right font-mono text-[10px] text-slate-500">
        {team.rank}
      </span>
      <img
        src={resolveAssetUrl(team.logo)}
        alt=""
        className="h-4 w-4 shrink-0"
        width={16}
        height={16}
      />
      <span className="min-w-0 flex-1 truncate text-slate-200">{team.name}</span>

      <span className="hidden w-8 shrink-0 text-right font-mono text-[10px] text-slate-500 sm:inline">
        {team.played}
      </span>
      <span className="hidden w-16 shrink-0 text-right font-mono text-[10px] text-slate-500 sm:inline">
        {team.won}-{team.drawn}-{team.lost}
      </span>
      <span className="w-9 shrink-0 text-right font-mono text-[10px] text-slate-400">
        {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
      </span>

      <span className="hidden w-14 shrink-0 gap-0.5 md:flex" aria-label="recent form">
        {team.form.map((result, i) => (
          <span
            key={i}
            className={`h-2.5 w-2.5 rounded-[2px] ${FORM_COLOURS[result]}`}
            title={FORM_LABELS[result]}
          />
        ))}
      </span>

      <span className="w-8 shrink-0 text-right font-mono text-sm font-semibold text-slate-50">
        {team.points}
      </span>
    </li>
  )
}

export function App() {
  const [index, setIndex] = useState<MockIndex | null>(null)
  const [selection, setSelection] = useState<MockSelection | null>(null)
  const [standings, setStandings] = useState<StandingsFile | null>(null)
  const [error, setError] = useState<string | null>(null)

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
      <div className="flex h-full items-center justify-center bg-slate-950 px-6 text-center">
        <div className="max-w-sm">
          <p className="text-sm font-semibold text-rose-400">Could not load standings</p>
          <p className="mt-2 font-mono text-xs leading-relaxed text-slate-500">{error}</p>
        </div>
      </div>
    )
  }

  if (!standings || !index || !selection) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-950">
        <p className="text-sm text-slate-500">Loading standings...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-slate-950 text-slate-100">
      <header className="flex shrink-0 items-baseline justify-between gap-4 border-b border-slate-800 px-3 py-2">
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold tracking-tight">
            {standings.league.name}
          </h1>
          <p className="truncate text-[11px] text-slate-500">
            {standings.league.country}, {standings.league.season}/
            {String((standings.league.season + 1) % 100).padStart(2, '0')}
            {standings.snapshot
              ? `, round ${standings.snapshot.roundsPlayed} of ${standings.snapshot.totalRounds}`
              : ''}
          </p>
        </div>
        <p className="shrink-0 text-[11px] text-slate-500">
          updated {formatRelativeTime(standings.fetchedAt)}
        </p>
      </header>

      <ol className="min-h-0 flex-1">
        {standings.teams.map((team) => (
          <TeamRow key={team.id} team={team} />
        ))}
      </ol>

      {import.meta.env.DEV && (
        <MockSwitcher index={index} selection={selection} onSelect={setSelection} />
      )}
    </div>
  )
}
