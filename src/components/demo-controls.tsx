import { useEffect, useState } from 'react'
import { ChevronDown, Layers, MoveVertical, SlidersHorizontal } from 'lucide-react'

import type { MockIndex } from '../types/mock-index'

export interface MockSelection {
  leagueSlug: string
  /** 1-based, matching `MockSnapshotEntry.index`. */
  snapshotIndex: number
}

interface DemoControlsProps {
  index: MockIndex
  selection: MockSelection
  onSelect: (selection: MockSelection) => void
}

/** Collapsible controls shared by local development and the public mock demo. */
export function DemoControls({ index, selection, onSelect }: DemoControlsProps) {
  const [open, setOpen] = useState(false)

  const league =
    index.leagues.find((l) => l.slug === selection.leagueSlug) ?? index.leagues[0]
  const snapshot =
    league.snapshots.find((s) => s.index === selection.snapshotIndex) ?? league.snapshots[0]

  useEffect(() => {
    if (!import.meta.env.DEV) return

    function onKeyDown(event: KeyboardEvent) {
      // Leave the dropdowns alone when they have focus, otherwise arrow keys
      // would move the selection twice per press.
      const target = event.target as HTMLElement | null
      if (target && /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) return
      if (event.metaKey || event.ctrlKey || event.altKey) return

      const leagueAt = (offset: number) => {
        const i = index.leagues.findIndex((l) => l.slug === league.slug)
        const next = index.leagues[(i + offset + index.leagues.length) % index.leagues.length]
        // Hold the season stage while changing league, so the same point in
        // the season can be compared straight across.
        onSelect({ leagueSlug: next.slug, snapshotIndex: selection.snapshotIndex })
      }

      const snapshotAt = (offset: number) => {
        const count = league.snapshots.length
        const i = league.snapshots.findIndex((s) => s.index === snapshot.index)
        const next = league.snapshots[(i + offset + count) % count]
        onSelect({ leagueSlug: league.slug, snapshotIndex: next.index })
      }

      switch (event.key) {
        case 'ArrowRight':
          snapshotAt(1)
          break
        case 'ArrowLeft':
          snapshotAt(-1)
          break
        case 'ArrowDown':
          leagueAt(1)
          break
        case 'ArrowUp':
          leagueAt(-1)
          break
        default:
          return
      }
      event.preventDefault()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [index, league, snapshot, selection.snapshotIndex, onSelect])

  const selectClass =
    'w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs ' +
    'text-slate-100 outline-none focus:border-emerald-400'

  const stats = (
    <div className="flex gap-3 font-mono text-xs text-slate-500">
      <span className="flex items-center gap-1" title="Occupied point levels, so team rows">
        <Layers className="h-3 w-3" />
        {snapshot.levels} occupied levels
      </span>
      <span className="flex items-center gap-1" title="Points from leader to last place">
        <MoveVertical className="h-3 w-3" />
        {snapshot.spread} pts
      </span>
    </div>
  )

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Choose demo league and season stage: ${league.name}`}
        aria-expanded={false}
        className="fixed bottom-3 right-3 z-30 flex max-w-[calc(100vw-1.5rem)] flex-wrap items-center justify-end gap-2 rounded-lg border border-slate-700 bg-slate-900/90 py-1.5 pl-3 pr-3.5 text-slate-300 shadow-lg backdrop-blur hover:border-slate-600"
      >
        <SlidersHorizontal className="h-3 w-3 text-slate-500" />
        <span className="text-xs font-medium">Demo: {league.name}</span>
        <span className="font-mono text-xs text-slate-500">
          {league.season}/{String(league.season + 1).slice(-2)} · stage {snapshot.index}/{league.snapshots.length}
        </span>
      </button>
    )
  }

  return (
    <aside aria-label="Demo controls" className="fixed bottom-3 right-3 z-30 max-h-[calc(100dvh-1.5rem)] w-72 max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-lg border border-slate-700 bg-slate-900/95 p-3 text-slate-200 shadow-xl backdrop-blur">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
        <span>Mock data</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="-m-1 flex items-center gap-1 p-1 font-mono normal-case tracking-normal hover:text-slate-300"
          title="Collapse, so the panel stops covering the axis"
        >
          Close
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      <label className="mb-2 block">
        <span className="mb-1 block text-xs uppercase tracking-wider text-slate-500">
          League
        </span>
        <select
          className={selectClass}
          value={league.slug}
          onChange={(e) =>
            onSelect({ leagueSlug: e.target.value, snapshotIndex: selection.snapshotIndex })
          }
        >
          {index.leagues.map((entry) => (
            <option key={entry.slug} value={entry.slug}>
              {entry.name} ({entry.teamCount})
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs uppercase tracking-wider text-slate-500">
          Season stage
        </span>
        <select
          className={selectClass}
          value={snapshot.index}
          onChange={(e) =>
            onSelect({ leagueSlug: league.slug, snapshotIndex: Number(e.target.value) })
          }
        >
          {league.snapshots.map((entry) => (
            <option key={entry.index} value={entry.index}>
              {entry.label}, round {entry.roundsPlayed} of {entry.totalRounds}
            </option>
          ))}
        </select>
      </label>

      <p className="mt-3 text-xs leading-relaxed text-slate-400">
        Fictional teams and sample standings for the {league.season}/{String(league.season + 1).slice(-2)} season.
        These are layout examples, not live football results.
      </p>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">
        Each row is one point value. Select a team for its record.
        An amber minus or dot means fewer matches played than the busiest team.
      </p>

      <div className="mt-2 border-t border-slate-800 pt-2">{stats}</div>

      {import.meta.env.DEV && (
        <p className="mt-2 text-xs leading-snug text-slate-400">
          Arrow keys: left and right change stage, up and down change league.
        </p>
      )}
    </aside>
  )
}
