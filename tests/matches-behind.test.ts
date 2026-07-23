/*
  Unit tests for the matches behind arithmetic, and for the claim the app makes
  by rendering it: that a team short of the round count is short on points too,
  so the axis is showing a distance that is not settled yet.
*/

import assert from 'node:assert/strict'
import test from 'node:test'

import { matchesBehind, mostPlayed } from '../src/lib/matches-behind.ts'
import { readSnapshot, snapshotFiles } from './snapshots.ts'

test('a level table marks nobody', () => {
  const teams = [{ played: 24 }, { played: 24 }, { played: 24 }]
  const most = mostPlayed(teams)

  assert.equal(most, 24)
  for (const team of teams) assert.equal(matchesBehind(team, most), 0)
})

test('the count is measured against the busiest team, not a round number', () => {
  // A whole round postponed leaves everybody level, and nothing is marked.
  const teams = [{ played: 22 }, { played: 22 }]
  assert.equal(matchesBehind(teams[0], mostPlayed(teams)), 0)

  // One team behind is marked by the difference.
  const uneven = [{ played: 24 }, { played: 22 }, { played: 23 }]
  const most = mostPlayed(uneven)
  assert.equal(matchesBehind(uneven[1], most), 2)
  assert.equal(matchesBehind(uneven[2], most), 1)
})

test('a team ahead of the reference is never marked negative', () => {
  assert.equal(matchesBehind({ played: 30 }, 24), 0)
})

test('an empty table has no reference and throws nothing', () => {
  assert.equal(mostPlayed([]), 0)
})

test('every snapshot marks only teams that are genuinely short of games', () => {
  for (const file of snapshotFiles()) {
    const data = readSnapshot(file)
    const most = mostPlayed(data.teams)

    for (const team of data.teams) {
      const behind = matchesBehind(team, most)
      const where = `${file} :: ${team.name}`

      assert.equal(behind, most - team.played, `${where} count`)
      assert.ok(behind >= 0, `${where} came out negative`)
      assert.ok(
        team.played <= (data.snapshot?.roundsPlayed ?? most),
        `${where} played more games than the league has rounds`,
      )
    }
  }
})

test('the mock set exercises the mark on shared levels as well as alone', () => {
  let marked = 0
  let markedSharingALevel = 0
  let widest = 0

  for (const file of snapshotFiles()) {
    const data = readSnapshot(file)
    const most = mostPlayed(data.teams)

    for (const team of data.teams) {
      const behind = matchesBehind(team, most)
      if (behind === 0) continue

      marked += 1
      widest = Math.max(widest, behind)
      if (data.teams.some((other) => other.id !== team.id && other.points === team.points)) {
        markedSharingALevel += 1
      }
    }
  }

  assert.ok(marked >= 5, `only ${marked} marked teams in the whole mock set`)
  assert.ok(markedSharingALevel >= 1, 'no marked team shares a row with another')
  assert.ok(widest >= 3, `the widest mark is +${widest}, too narrow to test the count`)
})
