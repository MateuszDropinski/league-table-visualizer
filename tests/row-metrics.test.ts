/*
  Unit tests for what a row puts inside itself, which like the engine is pure
  arithmetic and needs no browser to check.

  The interesting behaviour here is wrapping: a shared total spreads over
  several lines when the row is tall, and the promise is that the lines it asks
  for are lines the row can actually paint.
*/

import assert from 'node:assert/strict'
import test from 'node:test'

import { MIN_ROW_HEIGHT } from '../src/lib/layout-engine.ts'
import { chipLayout, rowMetrics } from '../src/lib/row-metrics.ts'

/** The axis on a typical desktop, points column and padding already taken off. */
const CONTENT_WIDTH = 620

test('a row at the floor still has room for a crest and a name', () => {
  const metrics = rowMetrics(MIN_ROW_HEIGHT)

  assert.ok(metrics.logoSize >= 12, `crest came to ${metrics.logoSize}px`)
  assert.ok(metrics.nameFontSize >= 9, `name came to ${metrics.nameFontSize}px`)
  assert.ok(metrics.chipHeight <= MIN_ROW_HEIGHT, 'content is taller than the row it sits in')
})

test('a short row never wraps, however many teams share it', () => {
  const metrics = rowMetrics(MIN_ROW_HEIGHT)

  for (const teams of [2, 4, 8, 20]) {
    const layout = chipLayout(metrics, teams, CONTENT_WIDTH, MIN_ROW_HEIGHT)
    assert.equal(layout.lines, 1, `${teams} teams wrapped in a floor height row`)
    assert.equal(layout.perLine, teams)
  }
})

test('one team on a total keeps the whole line to itself', () => {
  const metrics = rowMetrics(40)
  const layout = chipLayout(metrics, 1, CONTENT_WIDTH, 40)

  assert.deepEqual(layout, { mode: 'full', perLine: 1, lines: 1, showRank: true })
})

test('the position goes only when the teams are too crowded to spare it', () => {
  const metrics = rowMetrics(24)

  // Three teams level on a phone still have room for a position each.
  assert.equal(chipLayout(metrics, 3, 290, 24).showRank, true)

  // Eight of them do not, and the name is what identifies a team.
  assert.equal(chipLayout(metrics, 8, 290, 24).showRank, false)

  // Nor do eight on a desktop: a seventieth of that row is a crest and three
  // letters, and the position would be taking one of the letters.
  assert.equal(chipLayout(metrics, 8, CONTENT_WIDTH, 24).showRank, false)

  // Five on a desktop have room to spare.
  assert.equal(chipLayout(metrics, 5, CONTENT_WIDTH, 24).showRank, true)

  // And eight on a row tall enough to wrap them keep it, since wrapping is
  // what buys the width back.
  assert.equal(chipLayout(rowMetrics(120), 8, CONTENT_WIDTH, 120).showRank, true)
})

test('two teams on a wide row stay on one line with their full names', () => {
  const metrics = rowMetrics(40)
  const layout = chipLayout(metrics, 2, CONTENT_WIDTH, 40)

  assert.equal(layout.lines, 1)
  assert.equal(layout.mode, 'full')
})

test('a tall row spends its height on lines rather than truncating names', () => {
  // Six teams level, on a row tall enough to hold three lines of them.
  const rowHeight = 140
  const metrics = rowMetrics(rowHeight)

  const layout = chipLayout(metrics, 6, CONTENT_WIDTH, rowHeight)

  assert.ok(layout.lines > 1, 'a tall row still crammed six teams onto one line')
  assert.equal(layout.mode, 'full', 'wrapped and still did not fit a full name')
  assert.equal(layout.perLine * layout.lines >= 6, true)
})

test('a league where everybody is level gives every team its own line', () => {
  // The single row case: 20 teams on one total, the row being the whole screen.
  const rowHeight = 900
  const metrics = rowMetrics(rowHeight)

  const layout = chipLayout(metrics, 20, CONTENT_WIDTH, rowHeight)

  assert.equal(layout.perLine, 1)
  assert.equal(layout.lines, 20)
  assert.equal(layout.mode, 'full')
})

test('wrapping never asks for more lines than the row can paint', () => {
  for (let rowHeight = MIN_ROW_HEIGHT; rowHeight <= 1200; rowHeight += 1) {
    const metrics = rowMetrics(rowHeight)

    for (const teams of [2, 3, 5, 6, 8, 10, 20]) {
      for (const width of [180, 320, 620, 900]) {
        const layout = chipLayout(metrics, teams, width, rowHeight)
        const where = `${teams} teams, ${width}px wide, ${rowHeight}px tall`

        assert.ok(layout.perLine >= 1, `${where} put nothing on a line`)
        assert.ok(layout.perLine <= teams, `${where} claimed room for teams that do not exist`)
        assert.equal(layout.lines, Math.ceil(teams / layout.perLine), `${where} line count`)

        const painted =
          layout.lines * metrics.chipHeight + (layout.lines - 1) * metrics.chipRowGap
        assert.ok(
          painted <= rowHeight - metrics.cellPadding * 2 + 1e-9,
          `${where} wants ${painted.toFixed(1)}px of content`,
        )
      }
    }
  }
})
