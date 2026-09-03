import { readFileSync, readdirSync } from 'node:fs'
import { leagues } from '../src/data/leagues.ts'
import { validateStandings } from '../src/data/validate-standings.ts'

const directory = new URL('../public/data/', import.meta.url)
const expectedFiles = leagues.map((league) => `${league.slug}.json`).sort()
const actualFiles = readdirSync(directory).filter((file) => file.endsWith('.json')).sort()
if (JSON.stringify(actualFiles) !== JSON.stringify(expectedFiles)) throw new Error('Data files do not match the six configured leagues')
let clubs = 0
for (const league of leagues) {
  const data: unknown = JSON.parse(readFileSync(new URL(`${league.slug}.json`, directory), 'utf8'))
  validateStandings(data, league)
  clubs += data.teams.length
  console.log(`OK: ${league.name}, ${data.teams.length} clubs, checked ${data.checkedAt}`)
}
console.log(`Validated ${clubs} clubs across ${leagues.length} leagues, including league-wide accounting.`)
