/** Committed standings shared by the data and layout suites. */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { StandingsFile } from '../src/types/standings.ts'
const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data')
export function snapshotFiles(): string[] {
  return readdirSync(dataDir).filter((file) => file.endsWith('.json'))
}
export function readSnapshot(file: string): StandingsFile {
  return JSON.parse(readFileSync(join(dataDir, file), 'utf8')) as StandingsFile
}
