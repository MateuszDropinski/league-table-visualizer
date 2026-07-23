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

import {
  computeLayout,
  GAP_LABEL_MIN_HEIGHT,
  MAX_PIXELS_PER_POINT,
  minimumViableHeight,
  TIERS,
  type FittedLayout,
  type Placeable,
} from '../src/lib/layout-engine.ts'
import type { StandingsFile } from '../src/types/standings.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const mockDir = join(root, 'public', 'data', 'mock')

const [COMFORTABLE, COMPACT, DENSE, MICRO] = TIERS

/** Points totals in, one placeable per total, in the order given. */
const table = (...points: number[]): Placeable[] => points.map((p) => ({ points: p }))

function fitted<T extends Placeable>(teams: readonly T[], height: number): FittedLayout<T> {
  const layout = computeLayout(teams, height)
  assert.ok(layout.fits, `expected a layout at ${height}px, got the too small result`)
  return layout
}

/** Shapes taken from the mock leagues, so the cases match what the app renders. */
const LATE_SEASON = [97, 78, 75, 73, 68, 65, 62, 57, 54, 52, 50, 49, 47, 45, 43, 40, 37, 33, 28, 22]
const EARLY_SEASON = [7, 6, 6, 6, 5, 5, 5, 5, 4, 4, 4, 4, 4, 4, 3, 3, 3, 3, 2, 2]

test('groups shared totals into one row and crops the axis to the occupied range', () => {
  const layout = fitted(table(...EARLY_SEASON), 800)

  assert.equal(layout.rows.length, 6, 'six distinct point totals, six rows')
  assert.deepEqual(
    layout.rows.map((row) => row.points),
    [7, 6, 5, 4, 3, 2],
  )
  assert.deepEqual(
    layout.rows.map((row) => row.teams.length),
    [1, 3, 4, 6, 4, 2],
  )
  // Nothing above the leader or below the last team, and the gaps are the
  // one point steps between the occupied totals.
  assert.equal(layout.gaps.length, 5)
  assert.deepEqual(
    layout.gaps.map((gap) => gap.size),
    [1, 1, 1, 1, 1],
  )
  assert.equal(layout.items.length, 11, 'rows and gaps interleaved')
  assert.equal(layout.items[0].kind, 'row')
  assert.equal(layout.items[1].kind, 'gap')
})

test('keeps every team, in input order, within its level', () => {
  const teams = EARLY_SEASON.map((points, i) => ({ points, rank: i + 1 }))
  const layout = fitted(teams, 800)

  const ranks = layout.rows.flatMap((row) => row.teams.map((team) => team.rank))
  assert.deepEqual(ranks, teams.map((team) => team.rank))
})

test('late season spread fits a normal viewport and stays proportional', () => {
  const layout = fitted(table(...LATE_SEASON), 900)

  assert.equal(layout.rows.length, 20)
  assert.equal(layout.gaps.length, 19)
  assert.ok(layout.height <= 900)

  // The 19 point drop from the champion to second is the story of this table,
  // and it has to read as the tallest thing on the axis by some distance.
  const dominant = layout.gaps[0]
  assert.equal(dominant.size, 19)
  assert.ok(
    dominant.height > layout.rowHeight * 1.5,
    `the dominant gap should dwarf a row, got ${dominant.height}px against ${layout.rowHeight}px rows`,
  )
  for (const gap of layout.gaps.slice(1)) {
    assert.ok(dominant.height > gap.height * 3, `a ${gap.size} pt gap came within a third of 19 pts`)
  }
  assert.ok(dominant.showLabel)

  // 900px is tight for a 75 point spread, so the 1 and 2 point gaps sit on the
  // 8px floor while everything above it stays exactly proportional. That is the
  // intended trade: small gaps keep their air, big gaps keep their meaning.
  const free = layout.gaps.filter((gap) => gap.height > layout.tier.minGapHeight)
  const perPoint = dominant.height / dominant.size
  for (const gap of free) {
    assert.ok(Math.abs(gap.height / gap.size - perPoint) < 1e-9)
  }
  for (const gap of layout.gaps) {
    if (gap.size <= 2) assert.equal(gap.height, layout.tier.minGapHeight)
  }
})

test('one dominant gap does not distort the small gaps around it', () => {
  // 19, 3, 2, 5: nothing here is anywhere near a cap or a minimum at 900px, so
  // the ratios have to be exact.
  const layout = fitted(table(97, 78, 75, 73, 68), 900)
  const [big, three, two, five] = layout.gaps

  const perPoint = big.height / big.size
  for (const gap of [three, two, five]) {
    assert.ok(
      Math.abs(gap.height / gap.size - perPoint) < 1e-9,
      `${gap.size} pt gap is ${gap.height / gap.size}px per point against ${perPoint}px`,
    )
  }
  assert.ok(Math.abs(three.height / two.height - 1.5) < 1e-9, '3 pts is 1.5 times 2 pts')
  assert.ok(Math.abs(big.height / three.height - 19 / 3) < 1e-9)
})

test('gaps never fall below the tier minimum, however lopsided the table', () => {
  // A 40 point runaway leader against a pack separated by single points, on a
  // short screen: the small gaps are the ones at risk of being squeezed away.
  const layout = fitted(table(70, 30, 29, 28, 27, 26), 320)

  for (const gap of layout.gaps) {
    assert.ok(
      gap.height >= layout.tier.minGapHeight - 1e-9,
      `${gap.size} pt gap collapsed to ${gap.height}px, below the ${layout.tier.minGapHeight}px floor`,
    )
  }
  assert.ok(layout.height <= 320)
})

test('a tall screen early in the season caps gaps and top aligns instead of stretching', () => {
  const layout = fitted(table(...EARLY_SEASON), 1400)

  assert.equal(layout.tier.id, COMFORTABLE.id)
  assert.equal(layout.rowHeight, COMFORTABLE.maxRowHeight, 'rows take the surplus first, up to their max')
  for (const gap of layout.gaps) {
    assert.equal(gap.height, MAX_PIXELS_PER_POINT * gap.size, 'a 1 pt gap never grows past its cap')
    assert.ok(!gap.showLabel, '14px of air needs no caption')
  }

  // 6 rows at 56 plus 5 gaps at 14 is 406px, so the table stays compact and
  // leaves the rest of the screen empty rather than inflating a 5 point table.
  assert.equal(layout.height, 6 * COMFORTABLE.maxRowHeight + 5 * MAX_PIXELS_PER_POINT)
  assert.ok(layout.surplus > 900)
})

test('rows only grow once the gaps have taken everything they can use', () => {
  const teams = table(...LATE_SEASON)

  // 900px is nowhere near enough for 75 points of gap at the cap, so rows sit
  // at the tier minimum and every spare pixel goes to the axis.
  const tight = fitted(teams, 900)
  assert.equal(tight.rowHeight, COMFORTABLE.minRowHeight)
  assert.equal(tight.surplus, 0)

  // 20 rows at 56 plus 75 points at 14 is 2170px, the point where both are
  // satisfied at once.
  const generous = fitted(teams, 2170)
  assert.equal(generous.rowHeight, COMFORTABLE.maxRowHeight)
  assert.equal(generous.surplus, 0)
})

test('steps down the tier ladder as the viewport shrinks', () => {
  const teams = table(...LATE_SEASON)
  const tierAt = (height: number) => fitted(teams, height).tier.id

  // Each tier's floor is 20 rows plus 19 gap minimums.
  assert.equal(tierAt(20 * COMFORTABLE.minRowHeight + 19 * COMFORTABLE.minGapHeight), 'comfortable')
  assert.equal(tierAt(20 * COMFORTABLE.minRowHeight + 19 * COMFORTABLE.minGapHeight - 1), 'compact')
  assert.equal(tierAt(20 * COMPACT.minRowHeight + 19 * COMPACT.minGapHeight - 1), 'dense')
  assert.equal(tierAt(20 * DENSE.minRowHeight + 19 * DENSE.minGapHeight - 1), 'micro')
})

test('the micro floor is the last layout, one pixel less is the fallback panel', () => {
  const teams = table(...LATE_SEASON)
  const floor = 20 * MICRO.minRowHeight + 19 * MICRO.minGapHeight

  assert.equal(minimumViableHeight(teams), floor)

  const smallest = fitted(teams, floor)
  assert.equal(smallest.tier.id, 'micro')
  assert.equal(smallest.rowHeight, MICRO.minRowHeight)
  assert.equal(smallest.height, floor)
  for (const gap of smallest.gaps) assert.equal(gap.height, MICRO.minGapHeight)

  const tooSmall = computeLayout(teams, floor - 1)
  assert.equal(tooSmall.fits, false)
  assert.ok(!tooSmall.fits && tooSmall.requiredHeight === floor)
  assert.ok(!tooSmall.fits && tooSmall.levelCount === 20)
})

test('the too small threshold follows the data rather than a constant', () => {
  // Shared totals mean fewer rows, so a table that looks identical in team
  // count can still fit where another cannot.
  const spread = table(...LATE_SEASON)
  const shared = table(...EARLY_SEASON)

  assert.ok(minimumViableHeight(shared) < minimumViableHeight(spread))
  assert.equal(minimumViableHeight(shared), 6 * MICRO.minRowHeight + 5 * MICRO.minGapHeight)
  assert.equal(computeLayout(shared, minimumViableHeight(spread) - 1).fits, true)
})

test('every team level renders one row with no gaps at all', () => {
  const layout = fitted(table(...new Array(20).fill(1)), 800)

  assert.equal(layout.rows.length, 1)
  assert.equal(layout.gaps.length, 0)
  assert.equal(layout.items.length, 1)
  assert.equal(layout.rows[0].teams.length, 20)
  assert.equal(layout.rows[0].points, 1)
  assert.equal(layout.rows[0].top, 0)
  // Nothing to distribute, so the single row takes its maximum and the table
  // sits at the top of an otherwise empty axis.
  assert.equal(layout.rowHeight, COMFORTABLE.maxRowHeight)
  assert.equal(layout.surplus, 800 - COMFORTABLE.maxRowHeight)

  // A single row never triggers the fallback, however short the screen.
  assert.equal(computeLayout(table(1, 1, 1), MICRO.minRowHeight).fits, true)
})

test('labels only appear on gaps tall enough to carry them', () => {
  const layout = fitted(table(97, 78, 77, 76), 700)

  const [big, ...small] = layout.gaps
  assert.ok(big.height >= GAP_LABEL_MIN_HEIGHT && big.showLabel)
  for (const gap of small) {
    assert.equal(gap.showLabel, gap.height >= GAP_LABEL_MIN_HEIGHT)
  }
})

test('items are stacked without overlap or holes', () => {
  const layout = fitted(table(...LATE_SEASON), 760)

  let expected = 0
  for (const item of layout.items) {
    assert.ok(Math.abs(item.top - expected) < 1e-9, `item at ${item.top}px, expected ${expected}px`)
    expected += item.height
  }
  assert.ok(Math.abs(layout.height - expected) < 1e-9)
})

test('an empty table lays out to nothing rather than throwing', () => {
  const layout = fitted([], 800)
  assert.deepEqual(layout.items, [])
  assert.equal(layout.height, 0)
  assert.equal(minimumViableHeight([]), 0)
})

test('no snapshot at any viewport height ever overflows', () => {
  const files = readdirSync(mockDir).filter((f) => f.endsWith('.json') && f !== 'index.json')
  assert.ok(files.length === 25, `expected 25 snapshots, found ${files.length}`)

  for (const file of files) {
    const data = JSON.parse(readFileSync(join(mockDir, file), 'utf8')) as StandingsFile
    const where = (height: number) => `${file} at ${height}px`

    // From a phone in landscape with a keyboard up, to a portrait 4K panel.
    for (let height = 120; height <= 2400; height += 1) {
      const layout = computeLayout(data.teams, height)
      if (!layout.fits) {
        assert.ok(height < layout.requiredHeight, `${where(height)} refused a height that fits`)
        continue
      }

      assert.ok(layout.height <= height + 1e-9, `${where(height)} overflows by ${layout.height - height}`)
      assert.ok(layout.rows.length <= data.teams.length, `${where(height)} has more rows than teams`)
      assert.ok(layout.rowHeight >= layout.tier.minRowHeight - 1e-9, `${where(height)} row too short`)
      assert.ok(layout.rowHeight <= layout.tier.maxRowHeight + 1e-9, `${where(height)} row too tall`)

      for (const gap of layout.gaps) {
        assert.ok(gap.height >= layout.tier.minGapHeight - 1e-9, `${where(height)} gap below minimum`)
        assert.ok(
          gap.height <= MAX_PIXELS_PER_POINT * gap.size + 1e-9,
          `${where(height)} gap above its per point cap`,
        )
      }

      // Proportionality, stated as an ordering: a larger gap is never shorter
      // than a smaller one, at any height, in any snapshot.
      for (const a of layout.gaps) {
        for (const b of layout.gaps) {
          if (a.size > b.size) {
            assert.ok(a.height >= b.height - 1e-9, `${where(height)} inverted a ${a.size} and ${b.size} pt gap`)
          }
        }
      }
    }
  }
})
