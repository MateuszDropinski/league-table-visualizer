import assert from 'node:assert/strict'
import test from 'node:test'
import { computeGrid, MIN_ROW_HEIGHT } from '../src/lib/layout-engine.ts'
import { chipLayout, lineWidth, MIN_FONT_SIZE, rowLineBudget, rowMetrics, tableWidth, TOUCH_TABLE_WIDTH, type ChipWidths } from '../src/lib/row-metrics.ts'
import { readSnapshot, snapshotFiles } from './snapshots.ts'

const chips = (count: number): ChipWidths[] => Array.from({ length: count }, () => ({ full: 144, abbreviated: 72, crest: 44 }))

test('desktop type stays readable and positions are as large as names', () => {
  for (let height = 22; height <= 1200; height++) {
    const metrics = rowMetrics(height)
    assert.ok(metrics.nameFontSize >= MIN_FONT_SIZE)
    assert.ok(metrics.pointsFontSize >= MIN_FONT_SIZE)
    assert.equal(metrics.rankFontSize, metrics.nameFontSize)
  }
})

test('each row chooses the richest single-line state independently', () => {
  const metrics = rowMetrics(80, true)
  assert.equal(chipLayout(metrics, chips(2), 300, 1).mode, 'full')
  assert.equal(chipLayout(metrics, chips(3), 300, 1).mode, 'abbreviated')
  assert.equal(chipLayout(metrics, chips(4), 300, 1).mode, 'crest')
  for (const count of [2, 3, 4]) assert.equal(chipLayout(metrics, chips(count), 300, 1).lines.length, 1)
})

test('existing row height is used for rich labels before shortening them', () => {
  const metrics = rowMetrics(80, true)
  const layout = chipLayout(metrics, chips(4), 300, 2)
  assert.equal(layout.mode, 'full')
  assert.equal(layout.lines.length, 2)
  assert.deepEqual(layout.lines, [[0, 1], [2, 3]])
})

test('actual name widths decide fit instead of equal minimum-width slots', () => {
  const metrics = rowMetrics(50)
  const widths = [{ full: 220, abbreviated: 80, crest: 48 }, { full: 90, abbreviated: 80, crest: 48 }]
  assert.equal(chipLayout(metrics, widths, 326, 1).mode, 'full')
  assert.equal(chipLayout(metrics, widths, 324, 1).mode, 'abbreviated')
})

test('desktop uses free width before shortening or wrapping names', () => {
  const metrics = rowMetrics(80)
  const widths = chips(7)
  const inset = metrics.pointsColumnWidth + metrics.cellPadding * 2 + 2
  const required = lineWidth(widths.map(chip => chip.full), metrics.chipGap) + inset + 1
  const expanded = tableWidth(1200, required)
  assert.ok(expanded > 864)
  assert.ok(expanded <= 1200)
  assert.equal(chipLayout(metrics, widths, expanded - inset, 2).mode, 'full')
  assert.equal(chipLayout(metrics, widths, expanded - inset, 2).lines.length, 1)
  assert.equal(tableWidth(1100, 600), 864)
  assert.equal(tableWidth(1000, 1400), 1000)
  assert.equal(tableWidth(320, 600), 320)
})

test('wrapping uses existing space only after no single-line state fits', () => {
  const metrics = rowMetrics(80, true)
  const layout = chipLayout(metrics, chips(7), 300, rowLineBudget(metrics, 80, false))
  assert.equal(layout.mode, 'abbreviated')
  assert.equal(layout.lines.length, 3)
  assert.deepEqual(layout.lines.flat(), [0, 1, 2, 3, 4, 5, 6])
  assert.equal(layout.overflow, false)
})

test('a tall row can wrap full names without changing the axis height', () => {
  const grid = computeGrid(Array.from({ length: 20 }, () => ({ points: 0 })), 600)
  const metrics = rowMetrics(grid.rowHeight, true)
  const layout = chipLayout(metrics, chips(20), 300, rowLineBudget(metrics, grid.rowHeight, grid.scrolls))
  assert.equal(layout.mode, 'full')
  assert.equal(layout.lines.length, 10)
  assert.equal(grid.height, 600)
  assert.equal(grid.scrolls, false)
})

test('a line that would exceed the height budget triggers a denser state', () => {
  const metrics = rowMetrics(54, true)
  assert.equal(rowLineBudget(metrics, 54, false), 2)
  const layout = chipLayout(metrics, chips(9), 300, 2)
  assert.equal(layout.mode, 'crest')
  assert.equal(layout.lines.length, 2)
  assert.equal(rowLineBudget(metrics, 52, false), 1)
})

test('wrapping is forbidden when the base points grid already scrolls', () => {
  const grid = computeGrid([{ points: 50 }, { points: 0 }], 600)
  const metrics = rowMetrics(grid.rowHeight, true)
  assert.equal(grid.scrolls, true)
  assert.equal(rowLineBudget(metrics, grid.rowHeight, grid.scrolls), 1)
  assert.equal(chipLayout(metrics, chips(5), 300, 1).mode, 'crest')
  assert.equal(rowLineBudget(rowMetrics(200, true), 200, true), 1)
})

test('impossible density keeps all crest/rank chips reachable without extra height', () => {
  const layout = chipLayout(rowMetrics(22, true), chips(20), 180, 1)
  assert.equal(layout.mode, 'crest')
  assert.equal(layout.lines.length, 1)
  assert.equal(layout.lines.flat().length, 20)
  assert.equal(layout.overflow, true)
})

test('fractional width boundaries cannot accidentally add a flex line', () => {
  const metrics = rowMetrics(22, true)
  assert.equal(chipLayout(metrics, chips(2), 294.9, 1).mode, 'abbreviated')
  assert.equal(chipLayout(metrics, chips(2), 295, 1).mode, 'full')
})

test('padding and line boxes fit even the shortest rows on desktop and mobile', () => {
  for (const compact of [false, true]) {
    for (let height = MIN_ROW_HEIGHT; height <= 200; height += 0.25) {
      const metrics = rowMetrics(height, compact)
      const budget = rowLineBudget(metrics, height, false)
      const painted = budget * metrics.chipHeight + (budget - 1) * metrics.chipRowGap
      assert.ok(painted + metrics.cellPadding * 2 + 1 <= height + 1e-9)
      assert.equal(metrics.rankFontSize, metrics.nameFontSize)
    }
  }
})

test('all six snapshots retain equal points spacing and fit their row budgets at every size', () => {
  for (const file of snapshotFiles()) {
    const teams = readSnapshot(file).teams
    for (const width of [200, 240, 300, 344, 374, 414, 620, 640, 864, 1200]) {
      for (const height of [320, 600, 844, 1200]) {
        const grid = computeGrid(teams, height)
        const metrics = rowMetrics(grid.rowHeight, width < TOUCH_TABLE_WIDTH)
        const contentWidth = width - metrics.pointsColumnWidth - metrics.cellPadding * 2 - 2
        const budget = rowLineBudget(metrics, grid.rowHeight, grid.scrolls)
        assert.equal(grid.rows.length, grid.spread + 1)
        assert.equal(grid.height, grid.rowHeight * grid.rows.length)
        assert.ok(grid.rowHeight >= MIN_ROW_HEIGHT)
        for (const row of grid.rows) {
          // Deliberately generous name widths exercise the planner, independently
          // of the browser's actual font measurements used by the UI.
          const widths = row.teams.map(team => ({
            full: 70 + team.name.length * metrics.nameFontSize,
            abbreviated: 70 + metrics.nameFontSize * 3,
            crest: 55,
          }))
          const layout = chipLayout(metrics, widths, contentWidth, budget)
          assert.ok(layout.lines.length <= budget, `${file}: ${width}x${height}, ${row.points} points`)
          assert.deepEqual(layout.lines.flat(), row.teams.map((_, index) => index))
          for (const line of layout.lines) {
            if (!layout.overflow) assert.ok(lineWidth(line.map(index => widths[index][layout.mode]), metrics.chipGap) <= contentWidth)
          }
          if (grid.scrolls) assert.ok(layout.lines.length <= 1)
        }
      }
    }
  }
})
