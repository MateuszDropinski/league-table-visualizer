import assert from 'node:assert/strict'
import test from 'node:test'
import { firstThreeLetters } from '../src/lib/team-label.ts'

test('three-letter labels preserve accents and skip spaces and punctuation', () => {
  assert.equal(firstThreeLetters('Manchester City'), 'MAN')
  assert.equal(firstThreeLetters('RB Leipzig'), 'RBL')
  assert.equal(firstThreeLetters('Śląsk Wrocław'), 'ŚLĄ')
  assert.equal(firstThreeLetters('1. FC Union Berlin'), 'FCU')
})
