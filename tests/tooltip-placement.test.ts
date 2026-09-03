import assert from 'node:assert/strict'
import test from 'node:test'

import { tooltipPlacement } from '../src/lib/tooltip-placement.ts'

test('a card prefers the space above its team', () => {
  assert.deepEqual(
    tooltipPlacement({ left: 200, top: 400, bottom: 422, width: 100 }, { width: 268, height: 200 }, { width: 800, height: 600 }),
    { left: 116, top: 190 },
  )
})

test('a team at the top opens its card below', () => {
  const position = tooltipPlacement({ left: 10, top: 0, bottom: 22, width: 100 }, { width: 268, height: 200 }, { width: 800, height: 600 })
  assert.deepEqual(position, { left: 8, top: 32 })
})

test('a short viewport clamps a card that fits on neither side of its team', () => {
  const position = tooltipPlacement({ left: 200, top: 100, bottom: 122, width: 100 }, { width: 268, height: 240 }, { width: 320, height: 280 })
  assert.deepEqual(position, { left: 44, top: 32 })
})

test('a card sized to a narrow viewport stays within both horizontal margins', () => {
  for (const left of [-50, 0, 150, 240]) {
    const position = tooltipPlacement({ left, top: 20, bottom: 42, width: 100 }, { width: 224, height: 200 }, { width: 240, height: 320 })
    assert.equal(position.left, 8)
    assert.ok(position.top >= 8 && position.top + 200 <= 312)
  }
})
