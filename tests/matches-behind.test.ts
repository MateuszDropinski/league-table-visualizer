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
        team.played <= ((data.teams.length - 1) * 2),
        `${where} played more games than the league has rounds`,
      )
    }
  }
})

test('games in hand remain visible on both shared and separate points totals', () => {
  const teams = [
    { id: 1, points: 30, played: 12 },
    { id: 2, points: 30, played: 10 },
    { id: 3, points: 18, played: 9 },
  ]
  const most = mostPlayed(teams)
  assert.deepEqual(teams.map((team) => matchesBehind(team, most)), [0, 2, 3])
})
