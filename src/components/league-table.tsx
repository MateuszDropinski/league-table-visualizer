import { useMemo } from 'react'

import { computeLayout, type LayoutGap, type LayoutRow } from '../lib/layout-engine'
import type { LeagueAccent } from '../lib/league-accent'
import { chipMode, rowMetrics, type RowMetrics } from '../lib/tier-metrics'
import { useElementSize } from '../lib/use-element-size'
import type { StandingsFile, TeamStanding } from '../types/standings'
import { TeamChip } from './team-chip'
import { TooSmallPanel } from './too-small-panel'

/*
  The points axis itself.

  Every number on screen comes from the layout engine, which is handed the exact
  measured height of this container. Rows and gaps are absolutely positioned at
  the offsets it returns, so a resize moves them rather than reflowing a stack,
  and the same offsets can be transitioned.
*/

/** Left padding between the axis rail and the first crest. */
const CONTENT_INSET = 12

interface LeagueTableProps {
  standings: StandingsFile
  accent: LeagueAccent
}

export function LeagueTable({ standings, accent }: LeagueTableProps) {
  const [ref, size] = useElementSize<HTMLOListElement>()
  const { teams } = standings

  const layout = useMemo(() => computeLayout(teams, size.height), [teams, size.height])
  const metrics = useMemo(
    () => (layout.fits ? rowMetrics(layout.tier, layout.rowHeight) : null),
    [layout],
  )

  return (
    <div className="min-h-0 flex-1 px-3 pb-3">
      <ol ref={ref} className="relative h-full overflow-hidden">
        {size.height > 0 && layout.fits && metrics && (
          <>
            {/*
              The rail spans the occupied range only. Stopping it at the last
              team is what makes a top aligned early season table read as a
              short axis rather than a table that failed to fill the screen.
            */}
            <span
              aria-hidden
              className="absolute w-px bg-slate-800"
              style={{ left: metrics.axisWidth, top: 0, height: layout.height }}
            />

            {layout.items.map((item) =>
              item.kind === 'row' ? (
                <TeamLevel
                  key={`row-${item.points}`}
                  row={item}
                  metrics={metrics}
                  accent={accent}
                  width={size.width}
                />
              ) : (
                <PointGap key={`gap-${item.fromPoints}`} gap={item} metrics={metrics} />
              ),
            )}
          </>
        )}

        {size.height > 0 && !layout.fits && <TooSmallPanel league={standings.league.name} />}
      </ol>
    </div>
  )
}

interface TeamLevelProps {
  row: LayoutRow<TeamStanding>
  metrics: RowMetrics
  accent: LeagueAccent
  width: number
}

function TeamLevel({ row, metrics, accent, width }: TeamLevelProps) {
  const contentWidth = Math.max(0, width - metrics.axisWidth - CONTENT_INSET)
  const mode = chipMode(metrics, row.teams.length, contentWidth)
  // What one crest may occupy once the level is shared several ways. In logo
  // mode this is the only thing keeping 20 level teams inside the row.
  const maxLogoSize =
    (contentWidth - metrics.chipGap * (row.teams.length - 1)) / row.teams.length -
    (mode === 'logo' ? 2 : 0)

  return (
    <li
      className="absolute inset-x-0 transition-[top,height] duration-300 ease-out"
      style={{ top: row.top, height: row.height }}
    >
      <div className="flex h-full items-center">
        <span
          className="shrink-0 pr-2.5 text-right font-semibold tabular-nums text-slate-100"
          style={{ width: metrics.axisWidth, fontSize: metrics.pointsFontSize }}
        >
          {row.points}
        </span>

        {/* The tick sits on the rail, so a level is readable as a point on the axis. */}
        <span
          aria-hidden
          className="absolute rounded-full"
          style={{
            left: metrics.axisWidth - 1.5,
            top: '50%',
            width: 4,
            height: 4,
            marginTop: -2,
            background: accent.from,
          }}
        />

        <div
          className="flex min-w-0 flex-1 items-center overflow-hidden"
          style={{ gap: metrics.chipGap, paddingLeft: CONTENT_INSET }}
        >
          {row.teams.map((team) => (
            <TeamChip
              key={team.id}
              team={team}
              mode={mode}
              metrics={metrics}
              maxLogoSize={maxLogoSize}
            />
          ))}
        </div>
      </div>
    </li>
  )
}

function PointGap({ gap, metrics }: { gap: LayoutGap; metrics: RowMetrics }) {
  return (
    <li
      aria-hidden
      className="absolute inset-x-0 transition-[top,height] duration-300 ease-out"
      style={{ top: gap.top, height: gap.height }}
    >
      {/*
        A dotted continuation of the rail. Empty space alone reads as a layout
        that broke, the texture says the distance is the point.
      */}
      <span
        className="absolute inset-y-0 w-px"
        style={{
          left: metrics.axisWidth,
          backgroundImage:
            'repeating-linear-gradient(to bottom, rgb(100 116 139 / 0.55) 0 2px, transparent 2px 6px)',
        }}
      />
      {gap.showLabel && (
        <span
          className="absolute -translate-y-1/2 whitespace-nowrap font-mono tabular-nums text-slate-500"
          style={{
            left: metrics.axisWidth + CONTENT_INSET,
            top: '50%',
            fontSize: metrics.gapLabelFontSize,
          }}
        >
          {gap.size} pts
        </span>
      )}
    </li>
  )
}
