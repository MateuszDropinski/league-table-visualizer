import assert from 'node:assert/strict'
import test from 'node:test'
import { computeGrid, MIN_ROW_HEIGHT } from '../src/lib/layout-engine.ts'
import { chipLayout, minimumRowHeight, MIN_TEAM_WIDTH, MIN_FONT_SIZE, rowMetrics, TOUCH_TABLE_WIDTH } from '../src/lib/row-metrics.ts'
import { readSnapshot, snapshotFiles } from './snapshots.ts'

test('type stays readable and positions are as large as names', () => {
  for (let height = 1; height <= 1200; height++) {
    const metrics = rowMetrics(height)
    assert.ok(metrics.nameFontSize >= MIN_FONT_SIZE)
    assert.ok(metrics.pointsFontSize >= MIN_FONT_SIZE)
    assert.equal(metrics.rankFontSize, metrics.nameFontSize)
  }
})

test('crowded phone rows wrap before names lose their minimum width', () => {
  const layout = chipLayout(rowMetrics(22), 4, 290)
  assert.equal(layout.perLine, 1)
  assert.equal(layout.lines, 4)
  assert.equal(layout.minWidth, MIN_TEAM_WIDTH)
  assert.equal(layout.showRank, true)
  assert.equal(layout.mode, 'full')
})

test('logos alone are used only when a single readable name cannot fit', () => {
  assert.equal(chipLayout(rowMetrics(80), 6, MIN_TEAM_WIDTH).mode, 'short')
  const narrow = chipLayout(rowMetrics(80), 6, MIN_TEAM_WIDTH - 1)
  assert.equal(narrow.mode, 'crest')
  assert.equal(narrow.showRank, false)
  assert.ok(narrow.minWidth >= 44)
  // Crowding on its own must never force crest-only mode.
  assert.notEqual(chipLayout(rowMetrics(22), 20, 290).mode, 'crest')
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
  const grid = computeGrid(teams, 600, floor)
  assert.ok(grid.scrolls)
  assert.equal(grid.rows.length, 11)
  assert.equal(grid.height, grid.rowHeight * 11)
  assert.equal(grid.rows[1].teams.length, 0)
  assert.ok(grid.rowHeight >= floor)
})

test('all clubs and touch targets fit at phone, tablet, desktop and crest-only widths', () => {
  for (const file of snapshotFiles()) {
    const teams = readSnapshot(file).teams
    const crowded = Math.max(...computeGrid(teams, 0).rows.map((row) => row.teams.length))
    for (const width of [200, 240, 300, 344, 374, 414, 620, 640, 864, 1200]) {
      for (const height of [320, 600, 844, 1200]) {
        const grid = computeGrid(teams, height, minimumRowHeight(crowded, width))
        const metrics = rowMetrics(grid.rowHeight)
        const contentWidth = width - metrics.pointsColumnWidth - metrics.cellPadding * 2 - 2
        for (const row of grid.rows) {
          if (!row.teams.length) continue
          const layout = chipLayout(metrics, row.teams.length, contentWidth)
          const chipHeight = width < TOUCH_TABLE_WIDTH ? Math.max(44, metrics.chipHeight) : metrics.chipHeight
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
  assert.ok(grid.height > 600)
  assert.equal(minimumRowHeight(1, 900), MIN_ROW_HEIGHT)
})
