import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { resolveAssetUrl } from '../data/asset-url'
import type { FormResult, TeamStanding } from '../types/standings'

/*
  The card behind a team chip.

  A chip can be nine characters of a name at 12px type, which is enough to know
  who a team is and nothing else. Everything the standings file knows about them
  lives here instead: the record, the goals, the recent form, and whether their
  place on the axis is provisional.

  It renders in a portal because the row it belongs to clips its own overflow,
  and it is positioned against the chip in viewport coordinates rather than laid
  out in the document, so a card near the top of the table is not cut off by the
  edge of the screen. It never takes pointer events: it is something to read,
  not something to interact with, and a card that swallowed the pointer would
  flicker as soon as the cursor crossed it.
*/

/** Kept in step with the width the card is given, since it positions itself. */
const CARD_WIDTH = 268
/** Breathing room from the chip, and from the edges of the screen. */
const OFFSET = 10
const MARGIN = 8

interface TeamTooltipProps {
  team: TeamStanding
  /** Fixtures short of the rest of the league, 0 when level. */
  behind: number
  /** Where the chip is, in viewport coordinates. */
  anchor: DOMRect
}

export function TeamTooltip({ team, behind, anchor }: TeamTooltipProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [placement, setPlacement] = useState<{ left: number; top: number } | null>(null)

  /*
    Measured rather than estimated: the card's height depends on whether the
    team has form to show and whether it is behind, and placing it above the
    chip needs the real number. Laid out once, before paint, so it never appears
    in the wrong place first.
  */
  useLayoutEffect(() => {
    const card = ref.current
    if (!card) return

    const { height } = card.getBoundingClientRect()
    const above = anchor.top - OFFSET - height
    const below = anchor.bottom + OFFSET

    setPlacement({
      left: Math.min(
        Math.max(MARGIN, anchor.left + anchor.width / 2 - CARD_WIDTH / 2),
        window.innerWidth - CARD_WIDTH - MARGIN,
      ),
      // Above by preference, since the pointer is at the chip and a card under
      // it covers the rows the reader was just comparing against.
      top: above >= MARGIN ? above : below,
    })
  }, [anchor, team.id])

  const goals = `${team.goalsFor}:${team.goalsAgainst}`
  const gd = team.goalDifference > 0 ? `+${team.goalDifference}` : String(team.goalDifference)

  return createPortal(
    <div
      ref={ref}
      role="tooltip"
      className="pointer-events-none fixed z-50 rounded-lg border border-slate-700 bg-slate-900/97 p-3 text-slate-200 shadow-xl shadow-black/50"
      style={{
        width: CARD_WIDTH,
        left: placement?.left ?? 0,
        top: placement?.top ?? 0,
        // Hidden rather than unmounted for the one frame before it is measured,
        // so the layout it is measured from is the layout it is painted in.
        visibility: placement ? 'visible' : 'hidden',
      }}
    >
      <div className="flex items-center gap-2">
        <img src={resolveAssetUrl(team.logo)} alt="" width={28} height={28} className="shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-100">{team.name}</p>
          <p className="text-xs text-slate-400">
            {ordinal(team.rank)} of the table
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
        <Stat label="Points" value={team.points} strong />
        <Stat label="Played" value={team.played} />
        <Stat label="Goals" value={goals} />
        <Stat label="Difference" value={gd} />
      </div>

      <div className="mt-2.5 flex items-center gap-1.5 text-xs tabular-nums text-slate-400">
        <span className="text-emerald-400">{team.won}W</span>
        <span>{team.drawn}D</span>
        <span className="text-rose-400">{team.lost}L</span>
      </div>

      {team.form.length > 0 && (
        <div className="mt-2.5 flex items-center gap-1.5">
          <span className="text-xs text-slate-500">Form</span>
          <div className="flex gap-1">
            {team.form.map((result, i) => (
              <FormPill key={`${result}-${i}`} result={result} />
            ))}
          </div>
        </div>
      )}

      {behind > 0 && (
        <p className="mt-2.5 border-t border-slate-700 pt-2 text-xs text-amber-300">
          {behind} {behind === 1 ? 'match' : 'matches'} behind the rest of the league, so this
          position is not settled yet.
        </p>
      )}
    </div>,
    document.body,
  )
}

function Stat({
  label,
  value,
  strong,
}: {
  label: string
  value: string | number
  strong?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-slate-500">{label}</span>
      <span
        className={`tabular-nums ${strong ? 'text-sm font-semibold text-slate-100' : 'text-slate-200'}`}
      >
        {value}
      </span>
    </div>
  )
}

/** The last five results, most recent last, which is the order they are stored in. */
function FormPill({ result }: { result: FormResult }) {
  const tone =
    result === 'W'
      ? 'bg-emerald-500/20 text-emerald-300'
      : result === 'L'
        ? 'bg-rose-500/20 text-rose-300'
        : 'bg-slate-600/40 text-slate-300'

  return (
    <span
      className={`flex h-4 w-4 items-center justify-center rounded-sm text-[12px] font-semibold leading-none ${tone}`}
    >
      {result}
    </span>
  )
}

function ordinal(rank: number): string {
  const tens = rank % 100
  if (tens >= 11 && tens <= 13) return `${rank}th`

  switch (rank % 10) {
    case 1:
      return `${rank}st`
    case 2:
      return `${rank}nd`
    case 3:
      return `${rank}rd`
    default:
      return `${rank}th`
  }
}
