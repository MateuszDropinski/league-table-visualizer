/*
  Unit tests for the layout engine, run by node's own test runner with
  `pnpm test`. No browser and no React, which is the whole point of keeping the
  engine pure.

  The real mock snapshots are pulled in at the end as a sweep, because the 25
  tables were generated to cover exactly the shapes the engine has to survive.
*/

import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { computeGrid, type Placeable } from '../src/lib/layout-engine.ts'
import type { StandingsFile } from '../src/types/standings.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const mockDir = join(root, 'public', 'data', 'mock')

/** Points totals in, one placeable per total, in the order given. */
const table = (...points: number[]): Placeable[] => points.map((p) => ({ points: p }))

/** Shapes taken from the mock leagues, so the cases match what the app renders. */
const LATE_SEASON = [97, 78, 75, 73, 68, 65, 62, 57, 54, 52, 50, 49, 47, 45, 43, 40, 37, 33, 28, 22]
const EARLY_SEASON = [7, 6, 6, 6, 5, 5, 5, 5, 4, 4, 4, 4, 4, 4, 3, 3, 3, 3, 2, 2]

test('one row per point value, occupied or not, highest first', () => {
  const grid = computeGrid(table(...EARLY_SEASON), 800)

  // 7 down to 2 inclusive, so six rows, and every one of them is occupied here.
  assert.equal(grid.rows.length, 6)
  assert.equal(grid.spread, 5)
  assert.deepEqual(
    grid.rows.map((row) => row.points),
    [7, 6, 5, 4, 3, 2],
  )
  assert.deepEqual(
    grid.rows.map((row) => row.teams.length),
    [1, 3, 4, 6, 4, 2],
  )
})

test('unoccupied point values still get a row', () => {
  const grid = computeGrid(table(97, 78, 77), 800)

  // 97 down to 77 is 21 rows, of which 18 are empty. Those empty rows are the
  // 19 point gap, and they are why nothing has to be measured to see it.
  assert.equal(grid.rows.length, 21)
  assert.equal(grid.spread, 20)

  const empty = grid.rows.filter((row) => row.teams.length === 0)
  assert.equal(empty.length, 18)
  assert.deepEqual(
    empty.map((row) => row.points),
    [96, 95, 94, 93, 92, 91, 90, 89, 88, 87, 86, 85, 84, 83, 82, 81, 80, 79],
  )

  // Every point value in the range appears exactly once, in descending order.
  assert.deepEqual(
    grid.rows.map((row) => row.points),
    Array.from({ length: 21 }, (_, i) => 97 - i),
  )
})

test('teams sharing a total share a row, in input order', () => {
  const teams = EARLY_SEASON.map((points, i) => ({ points, rank: i + 1 }))
  const grid = computeGrid(teams, 800)

  const ranks = grid.rows.flatMap((row) => row.teams.map((team) => team.rank))
  assert.deepEqual(
    ranks,
    teams.map((team) => team.rank),
  )
})

test('the grid fills exactly the height it is given', () => {
  for (const height of [200, 480, 720, 900, 1440, 2400]) {
    const grid = computeGrid(table(...LATE_SEASON), height)
    assert.ok(Math.abs(grid.height - height) < 1e-9, `${height}px grid came to ${grid.height}px`)
    assert.ok(Math.abs(grid.rowHeight * grid.rows.length - height) < 1e-9)
  }
})

test('row height is the container divided by the point spread, with no floor', () => {
  // 97 down to 22 is 76 rows. At 900px that is 11.8px a row, and at 300px it is
  // under 4, which the engine returns rather than refusing. Nothing clamps.
  const teams = table(...LATE_SEASON)

  assert.equal(computeGrid(teams, 900).rows.length, 76)
  assert.ok(Math.abs(computeGrid(teams, 900).rowHeight - 900 / 76) < 1e-9)
  assert.ok(Math.abs(computeGrid(teams, 300).rowHeight - 300 / 76) < 1e-9)
  assert.ok(computeGrid(teams, 300).rowHeight < 4)

  // A six point early season table gets enormous rows at the same height, which
  // is the behaviour worth looking at before any cap is added back.
  assert.ok(Math.abs(computeGrid(table(...EARLY_SEASON), 900).rowHeight - 150) < 1e-9)
})

test('a league where every team is level is a single row', () => {
  const grid = computeGrid(table(...new Array(20).fill(1)), 800)

  assert.equal(grid.rows.length, 1)
  assert.equal(grid.spread, 0)
  assert.equal(grid.rows[0].points, 1)
  assert.equal(grid.rows[0].teams.length, 20)
  assert.equal(grid.rowHeight, 800)
  assert.equal(grid.height, 800)
})

test('an empty table lays out to nothing rather than throwing', () => {
  const grid = computeGrid([], 800)
  assert.deepEqual(grid.rows, [])
  assert.equal(grid.height, 0)
  assert.equal(grid.rowHeight, 0)
  assert.equal(grid.spread, 0)
})

test('negative point totals are laid out like any other range', () => {
  // No league does this, but nothing in the engine should assume otherwise.
  const grid = computeGrid(table(2, 0, -1), 400)
  assert.deepEqual(
    grid.rows.map((row) => row.points),
    [2, 1, 0, -1],
  )
  assert.equal(grid.rows[1].teams.length, 0)
})

test('every snapshot fills its container exactly, at any height', () => {
  const files = readdirSync(mockDir).filter((f) => f.endsWith('.json') && f !== 'index.json')
  assert.ok(files.length === 25, `expected 25 snapshots, found ${files.length}`)

  for (const file of files) {
    const data = JSON.parse(readFileSync(join(mockDir, file), 'utf8')) as StandingsFile
    const points = data.teams.map((team) => team.points)
    const expectedRows = Math.max(...points) - Math.min(...points) + 1

    // From a phone in landscape with a keyboard up, to a portrait 4K panel.
    for (let height = 120; height <= 2400; height += 1) {
      const grid = computeGrid(data.teams, height)
      const where = `${file} at ${height}px`

      assert.equal(grid.rows.length, expectedRows, `${where} row count`)
      assert.ok(grid.height <= height + 1e-9, `${where} overflows by ${grid.height - height}`)
      assert.ok(grid.height >= height - 1e-9, `${where} leaves ${height - grid.height} unused`)

      // No team is dropped, duplicated or moved off its own total.
      let seen = 0
      for (const row of grid.rows) {
        seen += row.teams.length
        for (const team of row.teams) assert.equal(team.points, row.points, `${where} misplaced`)
      }
      assert.equal(seen, data.teams.length, `${where} lost teams`)
    }
  }
})
