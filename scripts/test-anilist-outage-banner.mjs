import { readFileSync } from 'node:fs'
import { strict as assert } from 'node:assert'

const anilistClient = readFileSync(new URL('../src/lib/anilist.js', import.meta.url), 'utf8')
const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')

assert.match(anilistClient, /class AniListUnavailableError/)
assert.match(anilistClient, /temporarily disabled\|severe stability issues/)
assert.match(anilistClient, /anilist circuit open\|rate limited/)
assert.match(anilistClient, /MAL metadata resolver failed; using Aniraku API fallback/)
assert.match(anilistClient, /reportAniListStatus\(true\)/)
assert.match(anilistClient, /reportAniListStatus\(false\)/)
assert.match(app, /AniListAvailabilityBanner/)
assert.match(app, /aniraku:anilist-status/)
assert.match(app, /AniList is temporarily unavailable/)
assert.match(app, /refetchQueries\(\{ type: 'active' \}\)/)

console.log('AniList outage banner regression passed.')
