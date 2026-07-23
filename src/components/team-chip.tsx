import { resolveAssetUrl } from '../data/asset-url'
import type { ChipMode, RowMetrics } from '../lib/row-metrics'
import type { TeamStanding } from '../types/standings'

interface TeamChipProps {
  team: TeamStanding
  mode: ChipMode
  metrics: RowMetrics
  /** The most of the line one team may take, not the width it is given. */
  maxWidth: string
  /** False on a crowded row, where the position costs more than it is worth. */
  showRank: boolean
}

/*
  One team on its point total: crest, position, name.

  The crest leads, because it is what a team is recognised by across a table of
  twenty of them, and the position follows it as a note on the name rather than
  a column of its own. It takes exactly the width of its own digits: a box wide
  enough for two of them would line the names up, but it does so by parking a
  digit of empty space between the crest and a single figure position, and that
  gap reads as a mistake every time a leader is on screen.

  The chip is as wide as its own name and no wider, so teams sharing a total sit
  next to each other from the left rather than spread across the row. Past the
  cap it truncates, which is why every chip carries a title: an ellipsis needs a
  way back to the full name, on desktop by hover and on touch by long press.
*/
export function TeamChip({ team, mode, metrics, maxWidth, showRank }: TeamChipProps) {
  const record = `${team.name}, ${team.rank}. on ${team.points} pts, ${team.played} played, ${
    team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference
  } GD`

  return (
    <div
      className="flex min-w-0 items-center"
      style={{ maxWidth, gap: Math.max(3, metrics.chipGap * 0.55) }}
      title={record}
    >
      <img
        src={resolveAssetUrl(team.logo)}
        alt=""
        width={metrics.logoSize}
        height={metrics.logoSize}
        style={{ width: metrics.logoSize, height: metrics.logoSize }}
        className="shrink-0"
      />
      {showRank && (
        <span
          className="shrink-0 tabular-nums text-slate-400"
          style={{ fontSize: metrics.rankFontSize }}
        >
          {team.rank}.
        </span>
      )}
      <span
        className="truncate font-medium text-slate-200"
        style={{ fontSize: metrics.nameFontSize }}
      >
        {mode === 'full' ? team.name : team.shortName}
      </span>
    </div>
  )
}
