import assert from 'node:assert/strict'
import test from 'node:test'
import { leagues } from '../src/data/leagues.ts'
import { validateStandings } from '../src/data/validate-standings.ts'
import { readSnapshot } from './snapshots.ts'

test('all six published tables pass schema and accounting checks', () => {
  for (const league of leagues) validateStandings(readSnapshot(`${league.slug}.json`), league)
})

test('malformed, missing and mismatched league files are rejected', () => {
  for (const value of [null, {}, [], { league: null }, readSnapshot('serie-a.json')]) {
    assert.throws(() => validateStandings(value, leagues[0]), /Invalid standings/)
  }
  const data = readSnapshot('premier-league.json')
  data.teams.pop()
  assert.throws(() => validateStandings(data, leagues[0]), /expected 20 clubs/)
})

test('published shared ranks and league-specific tied ordering are preserved', () => {
  const data = readSnapshot('bundesliga.json')
  const original = JSON.stringify(data)
  validateStandings(data, leagues[2])
  assert.equal(JSON.stringify(data), original)
  assert.equal(data.teams[2].rank, data.teams[3].rank)
  // Equal points do not imply universal goal-difference ordering.
  const pl = readSnapshot('premier-league.json')
  ;[pl.teams[0], pl.teams[3]] = [pl.teams[3], pl.teams[0]]
  pl.teams.forEach((team, index) => { team.rank = index + 1 })
  validateStandings(pl, leagues[0])
})

test('bad totals, duplicate clubs and unverified adjustments cannot be published', () => {
  const badPoints = readSnapshot('premier-league.json')
  badPoints.teams[0].points++
  assert.throws(() => validateStandings(badPoints, leagues[0]), /points do not match/)
  const badGoals = readSnapshot('premier-league.json')
  badGoals.teams[0].goalsFor++
  badGoals.teams[0].goalDifference++
  assert.throws(() => validateStandings(badGoals, leagues[0]), /league-wide goals/)
  const duplicate = readSnapshot('premier-league.json')
  duplicate.teams[1].id = duplicate.teams[0].id
  assert.throws(() => validateStandings(duplicate, leagues[0]), /duplicate/)
  const deduction = readSnapshot('premier-league.json')
  const last = deduction.teams.at(-1)!
  last.points -= 3
  last.pointsAdjustment = -3
  assert.throws(() => validateStandings(deduction, leagues[0]), /undocumented/)
  last.adjustmentNote = 'Test-only documented deduction'
  validateStandings(deduction, leagues[0])
})

test('invalid dates and invalid form are rejected', () => {
  const data = readSnapshot('premier-league.json')
  data.checkedAt = '2026-02-30'
  assert.throws(() => validateStandings(data, leagues[0]), /invalid checked date/)
  data.checkedAt = '9999-01-01'
  assert.throws(() => validateStandings(data, leagues[0]), /future/)
  const invalid = readSnapshot('premier-league.json') as unknown as { teams: { form: unknown }[] }
  invalid.teams[0].form = null
  assert.throws(() => validateStandings(invalid, leagues[0]), /invalid recent form/)
})
