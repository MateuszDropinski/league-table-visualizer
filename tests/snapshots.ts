/*
  Access to the 25 generated mock snapshots, shared by the suites that sweep
  them. Not a test file itself, so the runner's `*.test.ts` glob skips it.

  The snapshots are the closest thing this project has to real data: they were
  generated to cover the table shapes the app has to survive, so a rule that
  holds across all 25 is a rule that holds.
*/

import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { StandingsFile } from '../src/types/standings.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const mockDir = join(root, 'public', 'data', 'mock')

/** Every snapshot file name, index.json excluded. */
export function snapshotFiles(): string[] {
  return readdirSync(mockDir).filter((f) => f.endsWith('.json') && f !== 'index.json')
}

export function readSnapshot(file: string): StandingsFile {
  return JSON.parse(readFileSync(join(mockDir, file), 'utf8')) as StandingsFile
}
