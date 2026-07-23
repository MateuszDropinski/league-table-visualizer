import { resolveAssetUrl } from '../data/asset-url'
import type { ChipMode, RowMetrics } from '../lib/tier-metrics'
import type { TeamStanding } from '../types/standings'

interface TeamChipProps {
  team: TeamStanding
  mode: ChipMode
  metrics: RowMetrics
  /** Cap for the crest when a level is crowded enough to squeeze even the logo. */
  maxLogoSize: number
}

/*
  One team on its point level.

  The title attribute is always set, not only in logo mode, because a truncated
  name and a crest on its own have the same problem: on a desktop the tooltip is
  the way back to the full name, and on touch a long press does the same.
*/
export function TeamChip({ team, mode, metrics, maxLogoSize }: TeamChipProps) {
  const logoSize = Math.max(8, Math.min(metrics.logoSize, maxLogoSize))
  const record = `${team.name}, ${team.points} pts, ${team.played} played, ${
    team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference
  } GD`

  return (
    <div className="flex min-w-0 items-center gap-2" title={record}>
      <img
        src={resolveAssetUrl(team.logo)}
        alt={mode === 'logo' ? team.name : ''}
        width={logoSize}
        height={logoSize}
        style={{ width: logoSize, height: logoSize }}
        className="shrink-0"
      />
      {mode !== 'logo' && (
        <span
          className="truncate font-medium text-slate-200"
          style={{ fontSize: metrics.nameFontSize }}
        >
          {mode === 'full' ? team.name : team.shortName}
        </span>
      )}
    </div>
  )
}
