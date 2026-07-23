import { useMemo } from 'react'

import { computeGrid, type GridRow } from '../lib/layout-engine'
import type { LeagueAccent } from '../lib/league-accent'
import { matchesBehind, mostPlayed } from '../lib/matches-behind'
import { chipLayout, rowMetrics, type RowMetrics } from '../lib/row-metrics'
import { useElementSize } from '../lib/use-element-size'
import { useViewportHeight } from '../lib/use-viewport-height'
import type { StandingsFile, TeamStanding } from '../types/standings'
import { TeamChip } from './team-chip'

/*
  The points axis, as an actual table.

  One row per point value, ruled off from its neighbours, so the distance
  between two teams is something you can count rather than something you have
  to judge. Empty rows are the gaps, and they keep their points number: an
  unoccupied 96 is as much a fact about the table as an occupied 97.

  Row height comes from the layout engine, which is handed the viewport height,
  so the grid fills the screen exactly at every size. When the spread is wide
  enough that the row floor bites, the grid is simply taller than the screen and
  the page scrolls, which is why nothing here scrolls on its own: one scrollbar,
  down the right hand edge of the window, where a scrollbar belongs.
*/

/*
  Higher is better, and the axis says so before a single number is read. Green
  at the leader's end, red at the bottom, faint enough at both that it never
  competes with the crests: the rows in the middle of the table should look
  neutral, because that is what they are.
*/
const AXIS_GRADIENT =
  'linear-gradient(to bottom, ' +
  'rgb(16 185 129 / 0.28) 0%, ' +
  'rgb(16 185 129 / 0.05) 38%, ' +
  'rgb(244 63 94 / 0.05) 62%, ' +
  'rgb(244 63 94 / 0.28) 100%)'

interface LeagueTableProps {
  standings: StandingsFile
  accent: LeagueAccent
}

export function LeagueTable({ standings, accent }: LeagueTableProps) {
  // Width only. The height of this element is the height of the table, so
  // asking it how much room the table has would be asking it about itself.
  const [ref, size] = useElementSize<HTMLDivElement>()
  const viewportHeight = useViewportHeight()

  const grid = useMemo(
    () => computeGrid(standings.teams, viewportHeight),
    [standings.teams, viewportHeight],
  )
  const metrics = useMemo(() => rowMetrics(grid.rowHeight), [grid.rowHeight])
  // The line every team's played count is measured against, which is a fact
  // about the table rather than about any one row.
  const played = useMemo(() => mostPlayed(standings.teams), [standings.teams])

  return (
    <div ref={ref} className="w-full">
      {grid.rows.length > 0 && (
        <table
          className="w-full table-fixed border-collapse"
          style={{ height: grid.height, backgroundImage: AXIS_GRADIENT }}
        >
          <tbody>
            {grid.rows.map((row) => (
              <PointRow
                key={row.points}
                row={row}
                height={grid.rowHeight}
                metrics={metrics}
                accent={accent}
                width={size.width}
                mostPlayed={played}
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
  /** The whole table's played count, which is what marks a row's teams as behind. */
  mostPlayed: number
}

function PointRow({ row, height, metrics, accent, width, mostPlayed }: PointRowProps) {
  const occupied = row.teams.length > 0
  const contentWidth = Math.max(0, width - metrics.pointsColumnWidth - metrics.cellPadding * 2)
  const layout = chipLayout(metrics, row.teams.length, contentWidth, height)

  /*
    A ceiling, not a width. Teams sit next to each other from the left at the
    width their own name needs, and this only stops any one of them growing
    past its share of a line, which is what keeps the wrapped line count to
    what the row can paint. Two teams on a total therefore read as two teams
    side by side rather than one at each end of the row.

    The half pixel back stops a line that comes to exactly the full width from
    wrapping its last team on a fractional container.
  */
  const chipMaxWidth =
    layout.perLine === 1
      ? '100%'
      : `calc((100% - ${metrics.chipGap * (layout.perLine - 1) + 0.5}px) / ${layout.perLine})`

  return (
    <tr style={{ height }} className="border-b border-slate-700 last:border-b-0">
      <th
        scope="row"
        className={`border-r text-right align-middle font-semibold tabular-nums ${
          occupied ? 'text-slate-100' : 'text-slate-400'
        }`}
        style={{
          width: metrics.pointsColumnWidth,
          fontSize: metrics.pointsFontSize,
          paddingRight: metrics.cellPadding + 4,
          // The accent marks the totals someone actually holds, so the occupied
          // rows read as the table and the empty ones as the distance between.
          borderRightColor: occupied ? accent.from : 'rgb(51 65 85)',
        }}
      >
        {row.points}
      </th>

      <td
        className="overflow-hidden align-middle"
        style={{ paddingLeft: metrics.cellPadding + 2, paddingRight: metrics.cellPadding }}
      >
        {occupied && (
          <div
            // Wrapping is allowed only when the row is tall enough for a second
            // line. A row that is not stays on one line and lets the names
            // truncate, which is the whole reason the line count is computed.
            className={`flex items-center ${layout.lines > 1 ? 'flex-wrap' : 'flex-nowrap'}`}
            style={{ columnGap: metrics.chipGap, rowGap: metrics.chipRowGap }}
          >
            {row.teams.map((team) => (
              <TeamChip
                key={team.id}
                team={team}
                mode={layout.mode}
                metrics={metrics}
                maxWidth={chipMaxWidth}
                showRank={layout.showRank}
                behind={matchesBehind(team, mostPlayed)}
              />
            ))}
          </div>
        )}
      </td>
    </tr>
  )
}
