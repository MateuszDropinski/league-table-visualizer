import { resolveAssetUrl } from '../data/asset-url'
import type { ChipMode, RowMetrics } from '../lib/row-metrics'
import type { TeamStanding } from '../types/standings'

interface TeamChipProps {
  team: TeamStanding
  mode: ChipMode
  metrics: RowMetrics
  /** True when the total is shared, so the teams split the row between them. */
  shared: boolean
}

/*
  One team on its point total.

  The name is always rendered. When several teams share a total they split the
  row evenly and each name truncates, which is why every chip carries a title:
  an ellipsis needs a way back to the full name, on desktop by hover and on
  touch by long press.
*/
export function TeamChip({ team, mode, metrics, shared }: TeamChipProps) {
  const record = `${team.name}, ${team.points} pts, ${team.played} played, ${
    team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference
  } GD`

  return (
    <div
      className={`flex min-w-0 items-center ${shared ? 'flex-1' : ''}`}
      style={{ gap: Math.max(3, metrics.chipGap * 0.55) }}
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
      <span
        className="truncate font-medium text-slate-200"
        style={{ fontSize: metrics.nameFontSize }}
      >
        {mode === 'full' ? team.name : team.shortName}
      </span>
    </div>
  )
}
