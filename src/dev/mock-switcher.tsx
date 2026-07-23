import { useEffect } from 'react'
import { Layers, MoveVertical } from 'lucide-react'

import type { MockIndex } from '../types/mock-index'

export interface MockSelection {
  leagueSlug: string
  /** 1-based, matching `MockSnapshotEntry.index`. */
  snapshotIndex: number
}

interface MockSwitcherProps {
  index: MockIndex
  selection: MockSelection
  onSelect: (selection: MockSelection) => void
}

/*
  Dev-only control for flipping through the 25 mock snapshots.

  Rendered behind `import.meta.env.DEV`, which Vite replaces with a literal
  false in a production build, so the whole component drops out at bundle time.

  Arrow keys are wired up because checking a layout change against every
  snapshot means moving through them dozens of times, and reaching for two
  dropdowns each time makes that tedious enough to skip.
*/
export function MockSwitcher({ index, selection, onSelect }: MockSwitcherProps) {
  const league =
    index.leagues.find((l) => l.slug === selection.leagueSlug) ?? index.leagues[0]
  const snapshot =
    league.snapshots.find((s) => s.index === selection.snapshotIndex) ?? league.snapshots[0]

  useEffect(() => {
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

  return (
    <aside className="fixed bottom-3 left-3 z-50 w-64 rounded-lg border border-slate-700 bg-slate-900/95 p-3 text-slate-200 shadow-xl backdrop-blur">
      <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        <span>Mock data</span>
        <span className="font-mono normal-case tracking-normal">dev only</span>
      </div>

      <label className="mb-2 block">
        <span className="mb-1 block text-[10px] uppercase tracking-wider text-slate-500">
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
        <span className="mb-1 block text-[10px] uppercase tracking-wider text-slate-500">
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

      <p className="mt-2 text-[11px] leading-snug text-slate-400">{league.character}</p>

      <div className="mt-2 flex gap-3 border-t border-slate-800 pt-2 font-mono text-[10px] text-slate-500">
        <span className="flex items-center gap-1" title="Occupied point levels, so team rows">
          <Layers className="h-3 w-3" />
          {snapshot.levels} rows
        </span>
        <span className="flex items-center gap-1" title="Points from leader to last place">
          <MoveVertical className="h-3 w-3" />
          {snapshot.spread} pts
        </span>
      </div>

      <p className="mt-2 text-[10px] leading-snug text-slate-600">
        Arrow keys: left and right change stage, up and down change league.
      </p>
    </aside>
  )
}
