/*
  Regenerates every mock asset: the example crests, the 25 snapshot files and
  the index the dev switcher reads. Run with `pnpm mock:generate`.

  Output is fully deterministic. Every random draw comes from a seed derived
  from the league, team and snapshot, and the timestamps are fixed constants,
  so regenerating without editing the source produces byte identical files and
  an empty diff.
*/

import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildCrest, CREST_COUNT } from './crests.ts'
import type { MockLeague } from './mock-source.ts'
import { MOCK_LEAGUES, SNAPSHOT_DATES, SNAPSHOT_LABELS } from './mock-source.ts'
import type { FormResult, StandingsFile, TeamStanding } from '../src/types/standings.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const crestDir = join(root, 'public', 'crests')
const dataDir = join(root, 'public', 'data', 'mock')

/** mulberry32: tiny, seedable, and stable across Node versions. */
function createRandom(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/**
 * Snaps a points total to one that is actually reachable in `played` games.
 *
 * Every value from 0 to 3P is reachable except 3P-1, which would need P-1 wins
 * plus two draws, one fixture more than has been played. Rounding a points per
 * game profile lands on it easily at low round counts: 2.55 ppg over 3 rounds
 * rounds to 8, and 8 points from 3 games cannot happen.
 */
function makeAchievable(points: number, played: number): number {
  const max = played * 3
  if (points >= max) return max
  return points === max - 1 ? max - 2 : points
}

/**
 * Splits a points total into a win/draw/loss record that actually adds up.
 *
 * The naive split (`points / 3`) yields at most two draws for any total, which
 * looks absurd across a full season. Trading one win for three draws leaves the
 * points untouched (3w + d is invariant) while consuming two losses, so
 * repeating that trade buys a realistic draw count for free. Trades are aimed
 * at a target share of drawn games rather than picked at random, otherwise a
 * low draw sometimes leaves a 38 game season sitting on two draws.
 *
 * The available trades are capped by the losses on hand, which is what keeps
 * runaway winners honest: a 97 point team has only one loss to spend and so
 * stays where it belongs, near the naive split.
 */
function splitRecord(points: number, played: number, rnd: () => number) {
  let won = Math.floor(points / 3)
  let drawn = points - won * 3
  let lost = played - won - drawn

  const targetDrawn = played * (0.22 + rnd() * 0.12)
  const maxTrades = Math.min(won, Math.floor(lost / 2))
  const trades = clamp(Math.round((targetDrawn - drawn) / 3), 0, maxTrades)

  won -= trades
  drawn += trades * 3
  lost -= trades * 2

  return { won, drawn, lost }
}

/** Goals correlate with results, so the table's GD column reads plausibly. */
function buildGoals(
  won: number,
  drawn: number,
  lost: number,
  played: number,
  rnd: () => number,
) {
  const jitter = () => (rnd() * 2 - 1) * played * 0.14
  const goalsFor = Math.max(0, Math.round(won * 1.95 + drawn * 1.0 + lost * 0.62 + jitter()))
  const goalsAgainst = Math.max(0, Math.round(won * 0.62 + drawn * 1.0 + lost * 1.95 + jitter()))
  return { goalsFor, goalsAgainst }
}

/** Last five results drawn from the team's own record, most recent last. */
function buildForm(won: number, drawn: number, lost: number, rnd: () => number): FormResult[] {
  const pool: FormResult[] = [
    ...Array.from({ length: won }, (): FormResult => 'W'),
    ...Array.from({ length: drawn }, (): FormResult => 'D'),
    ...Array.from({ length: lost }, (): FormResult => 'L'),
  ]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(-5)
}

function buildSnapshot(league: MockLeague, leagueIndex: number, snapshotIndex: number): StandingsFile {
  const played = league.rounds[snapshotIndex]
  const totalRounds = (league.teams.length - 1) * 2
  const allSquare = league.allSquareOpener === true && snapshotIndex === 0

  const rows = league.teams.map((entry, teamIndex) => {
    const [name, shortName] = entry.split('|')
    const rnd = createRandom(league.id * 7919 + teamIndex * 131 + snapshotIndex * 17)

    let points: number
    let won: number
    let drawn: number
    let lost: number
    let goalsFor: number
    let goalsAgainst: number
    let form: FormResult[]

    if (allSquare) {
      // Every fixture drawn 1-1, so records are identical down to the last
      // tiebreaker and the whole league collapses onto one occupied level.
      points = 1
      won = 0
      drawn = 1
      lost = 0
      goalsFor = 1
      goalsAgainst = 1
      form = ['D']
    } else {
      // Middle snapshots get a small deterministic wobble so the table is not
      // a perfectly smooth ramp. The opener and the final table stay unwobbled:
      // the opener so early totals stay tightly shared, the final table so each
      // league's designed character lands exactly as the ppg profile specifies.
      const wobble =
        snapshotIndex > 0 && snapshotIndex < 4
          ? Math.round((rnd() * 2 - 1) * 0.5 * Math.sqrt(played))
          : 0

      points = makeAchievable(
        clamp(Math.round(league.ppg[teamIndex] * played) + wobble, 0, played * 3),
        played,
      )
      const record = splitRecord(points, played, rnd)
      won = record.won
      drawn = record.drawn
      lost = record.lost
      const goals = buildGoals(won, drawn, lost, played, rnd)
      goalsFor = goals.goalsFor
      goalsAgainst = goals.goalsAgainst
      form = buildForm(won, drawn, lost, rnd)
    }

    return {
      id: league.id * 100 + teamIndex + 1,
      name,
      shortName,
      logo: `crests/crest-${String(((leagueIndex * 7 + teamIndex) % CREST_COUNT) + 1).padStart(2, '0')}.svg`,
      rank: 0,
      points,
      played,
      won,
      drawn,
      lost,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      form,
      // Kept only to break ties reproducibly, stripped before writing.
      sourceIndex: teamIndex,
    }
  })

  rows.sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      a.sourceIndex - b.sourceIndex,
  )

  const teams: TeamStanding[] = rows.map(({ sourceIndex: _sourceIndex, ...team }, i) => ({
    ...team,
    rank: i + 1,
  }))

  return {
    league: {
      id: league.id,
      slug: league.slug,
      name: league.name,
      country: league.country,
      season: league.season,
    },
    fetchedAt: SNAPSHOT_DATES[snapshotIndex],
    snapshot: {
      index: snapshotIndex + 1,
      label: SNAPSHOT_LABELS[snapshotIndex],
      roundsPlayed: played,
      totalRounds,
      character: league.character,
    },
    teams,
  }
}

function main() {
  // Both directories are generated in full, so wiping them keeps renamed or
  // removed leagues from leaving orphans behind. Windows refuses to remove a
  // directory that any process is sitting in, and holds brief locks after
  // writes, so retry rather than failing the run half finished.
  const wipe = (dir: string) =>
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 150 })
  wipe(crestDir)
  wipe(dataDir)
  mkdirSync(crestDir, { recursive: true })
  mkdirSync(dataDir, { recursive: true })

  for (let i = 0; i < CREST_COUNT; i++) {
    writeFileSync(join(crestDir, `crest-${String(i + 1).padStart(2, '0')}.svg`), buildCrest(i))
  }

  const index = MOCK_LEAGUES.map((league, leagueIndex) => {
    const snapshots = SNAPSHOT_LABELS.map((label, snapshotIndex) => {
      const file = `${league.slug}-${snapshotIndex + 1}.json`
      const standings = buildSnapshot(league, leagueIndex, snapshotIndex)
      writeFileSync(join(dataDir, file), `${JSON.stringify(standings, null, 2)}\n`)

      const points = standings.teams.map((t) => t.points)
      return {
        index: snapshotIndex + 1,
        label,
        file,
        roundsPlayed: standings.snapshot?.roundsPlayed ?? 0,
        totalRounds: standings.snapshot?.totalRounds ?? 0,
        levels: new Set(points).size,
        spread: points[0] - points[points.length - 1],
      }
    })

    return {
      id: league.id,
      slug: league.slug,
      name: league.name,
      country: league.country,
      season: league.season,
      character: league.character,
      teamCount: league.teams.length,
      snapshots,
    }
  })

  writeFileSync(join(dataDir, 'index.json'), `${JSON.stringify({ leagues: index }, null, 2)}\n`)

  const files = MOCK_LEAGUES.length * SNAPSHOT_LABELS.length
  console.log(`Wrote ${CREST_COUNT} crests and ${files} snapshots plus index.json`)
  for (const league of index) {
    const shape = league.snapshots
      .map((s) => `${s.label} ${s.levels}L/${s.spread}pts`)
      .join('  ')
    console.log(`  ${league.slug.padEnd(20)} ${shape}`)
  }
}

main()
