import type { LeagueAccent } from '../lib/league-accent'
import { formatRelativeTime } from '../lib/relative-time'
import type { StandingsFile } from '../types/standings'

interface LeagueHeaderProps {
  standings: StandingsFile
  accent: LeagueAccent
}

/*
  The league's identity, kept deliberately short.

  Every pixel spent here is a pixel the axis does not get, and the axis is the
  product. The gradient carries the identity so the type does not have to.
*/
export function LeagueHeader({ standings, accent }: LeagueHeaderProps) {
  const { league, snapshot, fetchedAt } = standings
  const season = `${league.season}/${String((league.season + 1) % 100).padStart(2, '0')}`

  return (
    <header className="shrink-0">
      <div
        className="h-[3px] w-full"
        style={{ background: `linear-gradient(90deg, ${accent.from}, ${accent.to})` }}
      />
      <div className="flex items-baseline justify-between gap-4 px-4 pb-2 pt-2.5">
        <div className="min-w-0">
          <h1 className="truncate text-[15px] font-semibold leading-tight tracking-tight">
            {league.name}
          </h1>
          <p className="truncate text-[11px] leading-tight text-slate-500">
            {league.country} &middot; {season}
            {snapshot ? ` · round ${snapshot.roundsPlayed} of ${snapshot.totalRounds}` : ''}
          </p>
        </div>
        <p className="shrink-0 text-[11px] text-slate-500">
          updated {formatRelativeTime(fetchedAt)}
        </p>
      </div>
    </header>
  )
}
