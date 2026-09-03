import { useCallback, useEffect, useId, useRef, useState } from 'react'

import { resolveAssetUrl } from '../data/asset-url'
import type { ChipMode, RowMetrics } from '../lib/row-metrics'
import type { TeamStanding } from '../types/standings'
import { TeamTooltip } from './team-tooltip'
import { useTeamCard } from './team-card-scope'

interface TeamChipProps {
  team: TeamStanding
  mode: ChipMode
  metrics: RowMetrics
  /** The most of the line one team may take, not the width it is given. */
  maxWidth: string
  minWidth: number
  touchTarget: boolean
  /** False on a crowded row, where the position costs more than it is worth. */
  showRank: boolean
  /** Fixtures this team is short of the rest of the league, 0 when level. */
  behind: number
}

/*
  One team on its point total: crest, position, name.

  The crest leads, because it is what a team is recognised by across a table of
  twenty of them, and the position follows it as a note on the name rather than
  a column of its own. It takes exactly the width of its own digits: a box wide
  enough for two of them would line the names up, but it does so by parking a
  digit of empty space between the crest and a single figure position, and that
  gap reads as a mistake every time a leader is on screen.

  Chips keep a readable minimum width and wrap within their point row. On an
  exceptionally narrow screen, the crest retains an accessible full name.
  Everything the chip cannot say is in the shared card opened by hover, focus
  or tap. Only its active owner renders a card.

  A team behind on matches played carries a mark, because its place on the axis
  is provisional and the axis does not say so on its own. It reads as a minus,
  since being short of a fixture is what put the team lower than its season will
  leave it. The mark survives crowding: on a row too tight for the count it
  becomes a dot, which costs almost nothing and still says "this one is not
  settled". It never disappears, since a distance that may be wrong is worth
  more of the row than the position that sits next to it.
*/
export function TeamChip({ team, mode, metrics, maxWidth, minWidth, touchTarget, showRank, behind }: TeamChipProps) {
  const { activeId, activate, release } = useTeamCard()
  const ref = useRef<HTMLButtonElement>(null)
  const tooltipId = useId()
  const pointerActive = useRef(false)
  const openOnPress = useRef(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout>>()
  const [anchor, setAnchor] = useState<DOMRect | null>(null)
  const open = activeId === team.id && anchor !== null

  const show = useCallback(() => {
    clearTimeout(hideTimer.current)
    if (ref.current) setAnchor(ref.current.getBoundingClientRect())
    activate(team.id)
  }, [activate, team.id])
  const hide = useCallback(() => {
    clearTimeout(hideTimer.current)
    setAnchor(null)
    release(team.id)
  }, [release, team.id])
  const hideSoon = useCallback(() => {
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(hide, 150)
  }, [hide])

  useEffect(() => () => clearTimeout(hideTimer.current), [])

  /*
    The page scrolls under an open card, so the anchor is re-read rather than
    remembered. Capture phase, since the scroll may happen in any ancestor.
    Escape closes it, and so does a press anywhere else, which is what dismisses
    a card opened by tapping on a touch screen.
  */
  useEffect(() => {
    if (!open) return

    const reposition = () => show()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') hide()
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (!ref.current?.contains(target) && !document.getElementById(tooltipId)?.contains(target)) hide()
    }

    window.addEventListener('scroll', reposition, { capture: true, passive: true })
    window.addEventListener('resize', reposition)
    window.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('scroll', reposition, { capture: true })
      window.removeEventListener('resize', reposition)
      window.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open, show, hide, tooltipId])

  const record = `${team.name}, ${team.rank}. on ${team.points} pts, ${team.played} played, ${
    team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference
  } GD${behind > 0 ? `, ${behind} ${behind === 1 ? 'match' : 'matches'} behind` : ''}`

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label={record}
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        aria-controls={open ? tooltipId : undefined}
        // A real button rather than a focusable div: it is the only element a
        // screen reader announces with its label and reaches by keyboard
        // without being told how, and focus alone opens the card.
        className="flex min-w-0 cursor-pointer items-center rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        style={{ maxWidth, minWidth, minHeight: touchTarget ? 44 : undefined, gap: Math.max(3, metrics.chipGap * 0.55), lineHeight: 1.35 }}
        // Hover is a mouse gesture. A tap is a press, and toggling on press is
        // what lets a card be dismissed by tapping the same chip again.
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse') show()
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === 'mouse' && document.activeElement !== ref.current) hideSoon()
        }}
        onPointerDown={() => {
          pointerActive.current = true
          openOnPress.current = open
        }}
        onPointerCancel={() => { pointerActive.current = false }}
        onClick={(event) => {
          pointerActive.current = false
          const wasOpen = event.detail === 0 ? open : openOnPress.current
          ;(wasOpen ? hide : show)()
        }}
        onFocus={() => { if (!pointerActive.current) show() }}
        onBlur={(event) => {
          pointerActive.current = false
          if (!document.getElementById(tooltipId)?.contains(event.relatedTarget as Node | null)) hide()
        }}
      >
        <img
          src={resolveAssetUrl(team.logo)}
          alt=""
          width={metrics.logoSize}
          height={metrics.logoSize}
          style={{ width: metrics.logoSize, height: metrics.logoSize }}
          className="shrink-0 object-contain"
        />
        {showRank && (
          <span
            className="shrink-0 font-semibold tabular-nums text-slate-100"
            style={{ fontSize: metrics.rankFontSize }}
          >
            {team.rank}.
          </span>
        )}
        <span
          className={mode === 'crest' ? 'sr-only' : 'truncate font-medium text-slate-200'}
          style={{ fontSize: metrics.nameFontSize }}
        >
          {mode === 'full' ? team.name : team.shortName}
        </span>

        {behind > 0 &&
          (showRank ? (
            <span
              aria-hidden="true"
              className="shrink-0 rounded-sm bg-amber-400/15 font-semibold tabular-nums text-amber-300"
              style={{
                fontSize: metrics.rankFontSize,
                paddingInline: Math.max(2, metrics.rankFontSize * 0.25),
              }}
            >
              -{behind}
            </span>
          ) : (
            <span
              aria-hidden="true"
              className="shrink-0 rounded-full bg-amber-300"
              style={{
                width: Math.max(3, metrics.logoSize * 0.22),
                height: Math.max(3, metrics.logoSize * 0.22),
              }}
            />
          ))}
      </button>

      {open && anchor && (
        <TeamTooltip
          id={tooltipId}
          team={team}
          behind={behind}
          anchor={anchor}
          onPointerEnter={show}
          onPointerLeave={() => {
            if (document.activeElement !== ref.current && !document.getElementById(tooltipId)?.contains(document.activeElement)) hideSoon()
          }}
          onBlur={(target) => { if (target !== ref.current) hide() }}
        />
      )}
    </>
  )
}
