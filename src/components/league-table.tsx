import { useLayoutEffect, useMemo, useRef, useState } from 'react'

import { computeGrid, type GridRow } from '../lib/layout-engine'
import type { LeagueAccent } from '../lib/league-accent'
import { matchesBehind, mostPlayed } from '../lib/matches-behind'
import { CHIP_MODES, chipInnerGap, chipLayout, lineWidth, rowLineBudget, rowMetrics, tableWidth, TOUCH_TABLE_WIDTH, type ChipWidths, type RowMetrics } from '../lib/row-metrics'
import { useElementSize } from '../lib/use-element-size'
import { useViewportHeight } from '../lib/use-viewport-height'
import type { StandingsFile, TeamStanding } from '../types/standings'
import { TeamChip } from './team-chip'
import { TeamCardScope } from './team-card-scope'
import { TeamChipContent } from './team-chip-content'

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

  const grid = useMemo(() => computeGrid(standings.teams, viewportHeight), [standings.teams, viewportHeight])
  const compact = size.width < TOUCH_TABLE_WIDTH
  const metrics = useMemo(() => rowMetrics(grid.rowHeight, compact), [grid.rowHeight, compact])
  const played = useMemo(() => mostPlayed(standings.teams), [standings.teams])
  const measurementRef = useRef<HTMLDivElement>(null)
  const [widths, setWidths] = useState<Record<string, ChipWidths>>({})

  // Measure the same markup/fonts that the actual buttons use. Long names,
  // two-digit ranks, diacritics and games-in-hand markers all count exactly.
  useLayoutEffect(() => {
    const measure = () => {
      if (!measurementRef.current) return
      const next: Record<string, ChipWidths> = {}
      standings.teams.forEach((team, index) => {
        const elements = measurementRef.current!.querySelectorAll<HTMLElement>(`[data-measure-team="${index}"]`)
        next[team.id] = Object.fromEntries(CHIP_MODES.map((mode, modeIndex) => [
          mode, Math.ceil(elements[modeIndex].getBoundingClientRect().width),
        ])) as ChipWidths
      })
      setWidths(next)
    }
    measure()
    document.fonts.addEventListener('loadingdone', measure)
    return () => document.fonts.removeEventListener('loadingdone', measure)
  }, [standings.teams, metrics, compact, played])

  const ready = size.width > 0 && standings.teams.every(team => widths[team.id])
  const horizontalInset = metrics.pointsColumnWidth + metrics.cellPadding * 2 + 2
  const requiredWidth = ready ? Math.max(...grid.rows.map(row =>
    lineWidth(row.teams.map(team => widths[team.id].full), metrics.chipGap),
  )) + horizontalInset + 1 : 864
  const width = tableWidth(size.width, requiredWidth)
  const maxLines = rowLineBudget(metrics, grid.rowHeight, grid.scrolls)

  return (
    <TeamCardScope>
    <div ref={ref} className="w-full">
      <div ref={measurementRef} aria-hidden="true" className="invisible fixed h-0 w-0 overflow-hidden pointer-events-none">
        {standings.teams.flatMap((team, index) => CHIP_MODES.map(mode => (
          <span key={`${team.id}-${mode}`} data-measure-team={index} className="flex w-max items-center"
            style={{ gap: chipInnerGap(metrics, compact), lineHeight: 1.35 }}>
            <TeamChipContent team={team} mode={mode} metrics={metrics} compact={compact} behind={matchesBehind(team, played)} />
          </span>
        )))}
      </div>
      {ready && grid.rows.length > 0 && (
        <table
          className="mx-auto table-fixed border-collapse"
          style={{ width, height: grid.height, backgroundImage: AXIS_GRADIENT }}
        >
          <caption className="sr-only">
            {standings.league.name}, {standings.league.season}/{String(standings.league.season + 1).slice(-2)}.
            Standings checked {standings.checkedAt}. Each row is a points total, highest first.
          </caption>
          <colgroup>
            <col style={{ width: metrics.pointsColumnWidth }} />
            <col />
          </colgroup>
          <tbody>
            {grid.rows.map((row) => (
              <PointRow
                key={row.points}
                row={row}
                height={grid.rowHeight}
                metrics={metrics}
                accent={accent}
                width={width}
                widths={widths}
                compact={compact}
                maxLines={maxLines}
                mostPlayed={played}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
    </TeamCardScope>
  )
}

interface PointRowProps {
  row: GridRow<TeamStanding>
  height: number
  metrics: RowMetrics
  accent: LeagueAccent
  width: number
  widths: Record<string, ChipWidths>
  compact: boolean
  maxLines: number
  /** The whole table's played count, which is what marks a row's teams as behind. */
  mostPlayed: number
}

function PointRow({ row, height, metrics, accent, width, widths, compact, maxLines, mostPlayed }: PointRowProps) {
  const occupied = row.teams.length > 0
  const contentWidth = Math.max(0, width - metrics.pointsColumnWidth - metrics.cellPadding * 2 - 2)
  const layout = chipLayout(metrics, row.teams.map(team => widths[team.id]), contentWidth, maxLines)

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
            data-layout={layout.mode}
            data-lines={layout.lines.length}
            className="overflow-x-auto"
            style={{ scrollbarWidth: 'none', paddingBlock: metrics.cellPadding }}
          >
            <div className="flex flex-col" style={{ gap: metrics.chipRowGap }}>
              {layout.lines.map((line, lineIndex) => (
                <div key={lineIndex} className="flex flex-nowrap items-center" style={{ gap: metrics.chipGap }}>
                  {line.map(index => {
                    const team = row.teams[index]
                    return <TeamChip
                      key={team.id}
                      team={team}
                      mode={layout.mode}
                      metrics={metrics}
                      width={widths[team.id][layout.mode]}
                      compact={compact}
                      behind={matchesBehind(team, mostPlayed)}
                    />
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </td>
    </tr>
  )
}
