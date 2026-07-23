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
  /** Fixtures this team is behind the rest of the league, 0 when level. */
  gamesInHand: number
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

  A team with games in hand carries a mark after its name, because its place on
  the axis is provisional and the axis does not say so on its own. The mark
  survives crowding: on a row too tight for the count it becomes a dot, which
  costs almost nothing and still says "this one is not settled". It never
  disappears, since a distance that may be wrong is worth more of the row than
  the position that sits next to it.
*/
export function TeamChip({
  team,
  mode,
  metrics,
  maxWidth,
  showRank,
  gamesInHand,
}: TeamChipProps) {
  const record = `${team.name}, ${team.rank}. on ${team.points} pts, ${team.played} played, ${
    team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference
  } GD${
    gamesInHand > 0
      ? `, ${gamesInHand} game${gamesInHand === 1 ? '' : 's'} in hand`
      : ''
  }`

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

      {gamesInHand > 0 &&
        (showRank ? (
          <span
            aria-hidden="true"
            className="shrink-0 rounded-sm bg-amber-400/15 font-semibold tabular-nums text-amber-300"
            style={{
              fontSize: metrics.rankFontSize,
              paddingInline: Math.max(2, metrics.rankFontSize * 0.25),
            }}
          >
            +{gamesInHand}
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
    </div>
  )
}
