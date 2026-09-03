import assert from 'node:assert/strict'
import test from 'node:test'
import { computeGrid, MIN_ROW_HEIGHT } from '../src/lib/layout-engine.ts'
import { chipLayout, minimumRowHeight, MIN_FONT_SIZE, rowMetrics, TOUCH_TABLE_WIDTH } from '../src/lib/row-metrics.ts'
import { readSnapshot, snapshotFiles } from './snapshots.ts'

test('type stays readable and positions are as large as names', () => {
  for (let height = 1; height <= 1200; height++) {
    const metrics = rowMetrics(height)
    assert.ok(metrics.nameFontSize >= MIN_FONT_SIZE)
    assert.ok(metrics.pointsFontSize >= MIN_FONT_SIZE)
    assert.equal(metrics.rankFontSize, metrics.nameFontSize)
  }
})

test('mobile switches to three letters exactly when names would need a third line', () => {
  const metrics = rowMetrics(22, true)
  assert.equal(chipLayout(metrics, 4, 300, true).mode, 'full')
  const compact = chipLayout(metrics, 5, 300, true)
  assert.equal(compact.mode, 'abbreviated')
  assert.equal(compact.lines, 2)
  assert.equal(compact.showRank, true)
})

test('mobile switches to crest and rank when abbreviations would need three lines', () => {
  const metrics = rowMetrics(22, true)
  assert.equal(chipLayout(metrics, 6, 260, true).mode, 'abbreviated')
  const compact = chipLayout(metrics, 7, 260, true)
  assert.equal(compact.mode, 'crest')
  assert.equal(compact.lines, 2)
  assert.equal(compact.showRank, true)
})

test('a less crowded row can need more height after another row compacts', () => {
  const two = minimumRowHeight(2, 300)
  const three = minimumRowHeight(3, 300)
  assert.ok(two > three)
  const teams = [{points: 10}, {points: 10}, {points: 0}, {points: 0}, {points: 0}]
  const rows = computeGrid(teams, 0).rows
  const floor = Math.max(...rows.map(row => minimumRowHeight(row.teams.length, 300)))
  assert.equal(floor, two)
})

test('compact metrics reduce type and spacing without hiding positions', () => {
  const mobile = rowMetrics(80, true)
  const desktop = rowMetrics(80)
  assert.equal(mobile.nameFontSize, 11)
  assert.equal(mobile.rankFontSize, mobile.nameFontSize)
  assert.ok(mobile.cellPadding < desktop.cellPadding)
  assert.ok(mobile.chipGap < desktop.chipGap)
  assert.ok(mobile.chipHeight < 44)
})

test('desktop teams share a line when readable labels fit', () => {
  const layout = chipLayout(rowMetrics(50), 3, 620)
  assert.equal(layout.perLine, 3)
  assert.equal(layout.lines, 1)
  assert.equal(layout.showRank, true)
})

test('growing crowded rows preserves equal points spacing and all empty levels', () => {
  const teams = [{ points: 10 }, { points: 10 }, { points: 10 }, { points: 0 }]
  const floor = minimumRowHeight(3, 350)
  const grid = computeGrid(teams, 200, floor)
  assert.ok(grid.scrolls)
  assert.equal(grid.rows.length, 11)
  assert.equal(grid.height, grid.rowHeight * 11)
  assert.equal(grid.rows[1].teams.length, 0)
  assert.ok(grid.rowHeight >= floor)
})

test('all clubs fit at phone, tablet, desktop and crest-only widths', () => {
  for (const file of snapshotFiles()) {
    const teams = readSnapshot(file).teams
    const rows = computeGrid(teams, 0).rows
    for (const width of [200, 240, 300, 344, 374, 414, 620, 640, 864, 1200]) {
      for (const height of [320, 600, 844, 1200]) {
        const grid = computeGrid(teams, height, Math.max(...rows.map(row => minimumRowHeight(row.teams.length, width))))
        const compact = width < TOUCH_TABLE_WIDTH
        const metrics = rowMetrics(grid.rowHeight, compact)
        const contentWidth = width - metrics.pointsColumnWidth - metrics.cellPadding * 2 - 2
        for (const row of grid.rows) {
          if (!row.teams.length) continue
          const layout = chipLayout(metrics, row.teams.length, contentWidth, compact)
          const chipHeight = metrics.chipHeight
          const painted = layout.lines * chipHeight + (layout.lines - 1) * metrics.chipRowGap
          assert.ok(painted + metrics.cellPadding * 2 <= grid.rowHeight, `${file}: ${width}x${height}, ${row.points} points clips`)
          assert.ok(layout.perLine * layout.minWidth + (layout.perLine - 1) * metrics.chipGap <= contentWidth + 0.01)
          assert.ok(grid.rowHeight >= MIN_ROW_HEIGHT)
        }
      }
    }
  }
})

test('an all-level league remains readable and wide tables keep their row floor', () => {
  const teams = Array.from({ length: 20 }, () => ({ points: 0 }))
  const grid = computeGrid(teams, 600, minimumRowHeight(20, 350))
  assert.equal(grid.rows.length, 1)
  assert.equal(grid.height, 600)
  assert.equal(minimumRowHeight(1, 900), MIN_ROW_HEIGHT)
})

test('all six current tables fit a typical phone viewport with compact tiers', () => {
  for (const file of snapshotFiles()) {
    const teams = readSnapshot(file).teams
    const rows = computeGrid(teams, 0).rows
    for (const width of [304, 344, 374]) {
      const floor = Math.max(...rows.map(row => minimumRowHeight(row.teams.length, width)))
      const grid = computeGrid(teams, 700, floor)
      assert.equal(grid.scrolls, false, `${file} at ${width}px`)
      assert.equal(grid.height, 700)
    }
  }
})
