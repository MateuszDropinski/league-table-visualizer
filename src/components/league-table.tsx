import { useEffect, useMemo } from 'react'

import { computeGrid, type GridRow } from '../lib/layout-engine'
import type { LeagueAccent } from '../lib/league-accent'
import { chipMode, rowMetrics, type RowMetrics } from '../lib/row-metrics'
import { useElementSize } from '../lib/use-element-size'
import type { StandingsFile, TeamStanding } from '../types/standings'
import { TeamChip } from './team-chip'

/*
  The points axis, as an actual table.

  One row per point value, ruled off from its neighbours, so the distance
  between two teams is something you can count rather than something you have
  to judge. Empty rows are the gaps, and they keep their points number: an
  unoccupied 96 is as much a fact about the table as an occupied 97.

  Row height comes from the layout engine, which is handed the measured height
  of the container, so the grid fills it exactly at every size.
*/

interface LeagueTableProps {
  standings: StandingsFile
  accent: LeagueAccent
}

export function LeagueTable({ standings, accent }: LeagueTableProps) {
  const [ref, size] = useElementSize<HTMLDivElement>()

  const grid = useMemo(
    () => computeGrid(standings.teams, size.height),
    [standings.teams, size.height],
  )
  const metrics = useMemo(() => rowMetrics(grid.rowHeight), [grid.rowHeight])

  /*
    Row height on every resize, for picking the floor and ceiling it should
    eventually have. The container height is in there too, so a row height that
    reads well can be turned straight into the viewport it needs.

    Dev only: `import.meta.env.DEV` is a literal false in a production build, so
    the whole body folds away.
  */
  useEffect(() => {
    if (!import.meta.env.DEV || size.height === 0 || grid.rows.length === 0) return

    console.log(
      `[axis] ${standings.league.slug} ${standings.snapshot?.index ?? '-'}/5  ` +
        `${size.height}px / ${grid.rows.length} rows = ${grid.rowHeight.toFixed(2)}px  ` +
        `spread ${grid.spread} pts  ` +
        `logo ${metrics.logoSize.toFixed(1)}  pts ${metrics.pointsFontSize.toFixed(1)}  ` +
        `name ${metrics.nameFontSize.toFixed(1)}` +
        (grid.scrolls ? `  SCROLLS, ${Math.ceil(grid.height - size.height)}px over` : ''),
    )
  }, [standings.league.slug, standings.snapshot?.index, size.height, grid, metrics])

  return (
    // Measuring the content box gives the visible height even once this
    // scrolls, which is exactly what the engine needs: it decides whether the
    // grid overflows, so it must never be handed the overflowing height back.
    <div ref={ref} className="h-full w-full overflow-y-auto overflow-x-hidden">
      {size.height > 0 && grid.rows.length > 0 && (
        <table className="w-full table-fixed border-collapse" style={{ height: grid.height }}>
          <tbody>
            {grid.rows.map((row) => (
              <PointRow
                key={row.points}
                row={row}
                height={grid.rowHeight}
                metrics={metrics}
                accent={accent}
                width={size.width}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

interface PointRowProps {
  row: GridRow<TeamStanding>
  height: number
  metrics: RowMetrics
  accent: LeagueAccent
  width: number
}

function PointRow({ row, height, metrics, accent, width }: PointRowProps) {
  const occupied = row.teams.length > 0
  const contentWidth = Math.max(0, width - metrics.pointsColumnWidth - metrics.cellPadding * 2)
  const mode = chipMode(metrics, row.teams.length, contentWidth)
  const shared = row.teams.length > 1

  return (
    <tr style={{ height }} className="border-b border-slate-800/80 last:border-b-0">
      <th
        scope="row"
        className={`border-r text-right align-middle font-semibold tabular-nums ${
          occupied ? 'text-slate-100' : 'text-slate-700'
        }`}
        style={{
          width: metrics.pointsColumnWidth,
          fontSize: metrics.pointsFontSize,
          paddingRight: metrics.cellPadding + 4,
          // The accent marks the totals someone actually holds, so the occupied
          // rows read as the table and the empty ones as the distance between.
          borderRightColor: occupied ? accent.from : 'rgb(30 41 59 / 0.8)',
        }}
      >
        {row.points}
      </th>

      <td
        className="overflow-hidden align-middle"
        style={{ paddingLeft: metrics.cellPadding + 6, paddingRight: metrics.cellPadding }}
      >
        {occupied && (
          <div className="flex items-center" style={{ gap: metrics.chipGap }}>
            {row.teams.map((team) => (
              <TeamChip key={team.id} team={team} mode={mode} metrics={metrics} shared={shared} />
            ))}
          </div>
        )}
      </td>
    </tr>
  )
}
