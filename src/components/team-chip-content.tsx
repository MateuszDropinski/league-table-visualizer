import { resolveAssetUrl } from '../data/asset-url'
import type { ChipMode, RowMetrics } from '../lib/row-metrics'
import { firstThreeLetters } from '../lib/team-label'
import type { TeamStanding } from '../types/standings'

interface TeamChipContentProps {
  team: TeamStanding
  mode: ChipMode
  metrics: RowMetrics
  compact: boolean
  behind: number
}

/** Shared by visible chips and their inert width measurements. */
export function TeamChipContent({ team, mode, metrics, compact, behind }: TeamChipContentProps) {
  return <>
    <img
      src={resolveAssetUrl(team.logo)} alt=""
      width={metrics.logoSize} height={metrics.logoSize}
      style={{ width: metrics.logoSize, height: metrics.logoSize }}
      className="shrink-0 object-contain"
    />
    <span className="shrink-0 font-semibold tabular-nums text-slate-100" style={{ fontSize: metrics.rankFontSize }}>
      {team.rank}.
    </span>
    {mode !== 'crest' && <span
      className={`shrink-0 whitespace-nowrap font-medium text-slate-200 ${mode === 'abbreviated' ? 'font-mono' : ''}`}
      style={{ fontSize: metrics.nameFontSize }}
    >
      {mode === 'abbreviated' ? firstThreeLetters(team.name) : team.name}
    </span>}
    {behind > 0 && (compact || mode === 'crest' ? (
      <span aria-hidden="true" className="shrink-0 rounded-full bg-amber-300" style={{
        width: Math.max(3, metrics.logoSize * 0.22), height: Math.max(3, metrics.logoSize * 0.22),
      }} />
    ) : (
      <span aria-hidden="true" className="shrink-0 rounded-sm bg-amber-400/15 font-semibold tabular-nums text-amber-300"
        style={{ fontSize: metrics.rankFontSize, paddingInline: Math.max(2, metrics.rankFontSize * 0.25) }}>
        -{behind}
      </span>
    ))}
  </>
}
