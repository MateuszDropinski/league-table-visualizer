/*
  Checks every standings file on disk against the rules a real league table has
  to obey. Run with `pnpm mock:validate`.

  This exists because the mock generator derives records from a points per game
  profile, and rounding can quietly produce a table that no season could ever
  produce (8 points from 3 games, for one). It is written against the published
  JSON rather than the generator's internals, so it will keep working unchanged
  as the contract check for the real API-Football pipeline.
*/

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { StandingsFile, TeamStanding } from '../src/types/standings.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'public')
const dataDir = join(publicDir, 'data', 'mock')

const problems: string[] = []
const note = (file: string, team: string, message: string) =>
  problems.push(`${file} :: ${team} :: ${message}`)

function checkTeam(file: string, team: TeamStanding, expectedPlayed: number) {
  const who = `#${team.rank} ${team.name}`

  if (team.won + team.drawn + team.lost !== team.played) {
    note(file, who, `W+D+L is ${team.won + team.drawn + team.lost}, played is ${team.played}`)
  }
  if (team.won < 0 || team.drawn < 0 || team.lost < 0) {
    note(file, who, `negative results ${team.won}W ${team.drawn}D ${team.lost}L`)
  }
  if (team.won * 3 + team.drawn !== team.points) {
    note(file, who, `3W+D is ${team.won * 3 + team.drawn}, points is ${team.points}`)
  }
  if (team.points > team.played * 3) {
    note(file, who, `${team.points} points exceeds the ${team.played * 3} available`)
  }
  // The single unreachable total for any number of games played.
  if (team.points === team.played * 3 - 1) {
    note(file, who, `${team.points} points is unreachable from ${team.played} games`)
  }
  if (team.played !== expectedPlayed) {
    note(file, who, `played ${team.played}, expected ${expectedPlayed} for this snapshot`)
  }
  if (team.goalsFor - team.goalsAgainst !== team.goalDifference) {
    note(file, who, `GD is ${team.goalDifference}, GF-GA is ${team.goalsFor - team.goalsAgainst}`)
  }
  if (team.goalsFor < 0 || team.goalsAgainst < 0) {
    note(file, who, `negative goals ${team.goalsFor}:${team.goalsAgainst}`)
  }
  if (team.form.length > 5 || team.form.length > team.played) {
    note(file, who, `form has ${team.form.length} entries for ${team.played} games`)
  }
  if (team.form.some((r) => r !== 'W' && r !== 'D' && r !== 'L')) {
    note(file, who, `form contains an unknown result: ${team.form.join('')}`)
  }
  if (!team.name || !team.shortName) {
    note(file, who, 'missing name or shortName')
  }
  if (!/^https?:\/\//i.test(team.logo) && !existsSync(join(publicDir, team.logo))) {
    note(file, who, `logo not found on disk: ${team.logo}`)
  }
}

function checkFile(file: string) {
  const data = JSON.parse(readFileSync(join(dataDir, file), 'utf8')) as StandingsFile

  if (Number.isNaN(Date.parse(data.fetchedAt))) {
    note(file, '-', `fetchedAt is not a valid date: ${data.fetchedAt}`)
  }
  if (data.teams.length < 18 || data.teams.length > 20) {
    note(file, '-', `${data.teams.length} teams, expected 18 to 20`)
  }

  const ids = new Set(data.teams.map((t) => t.id))
  if (ids.size !== data.teams.length) {
    note(file, '-', 'duplicate team ids')
  }

  data.teams.forEach((team, i) => {
    if (team.rank !== i + 1) {
      note(file, team.name, `rank is ${team.rank} at array position ${i + 1}`)
    }
    // Every tiebreaker in turn, so a table that is merely out of order is
    // caught rather than passing because the points happen to be equal.
    const prev = data.teams[i - 1]
    if (prev) {
      const ordered =
        prev.points > team.points ||
        (prev.points === team.points &&
          (prev.goalDifference > team.goalDifference ||
            (prev.goalDifference === team.goalDifference && prev.goalsFor >= team.goalsFor)))
      if (!ordered) {
        note(file, team.name, `sorted above ${prev.name} despite a worse record`)
      }
    }
    checkTeam(file, team, data.snapshot?.roundsPlayed ?? team.played)
  })
}

const files = readdirSync(dataDir)
  .filter((f) => f.endsWith('.json') && f !== 'index.json')
  .sort()

files.forEach(checkFile)

if (problems.length > 0) {
  console.error(`FAILED: ${problems.length} problem(s) across ${files.length} files\n`)
  problems.slice(0, 40).forEach((p) => console.error(`  ${p}`))
  if (problems.length > 40) console.error(`  ...and ${problems.length - 40} more`)
  process.exit(1)
}

console.log(`OK: ${files.length} standings files pass every check`)
