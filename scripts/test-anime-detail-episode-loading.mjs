import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(
  new URL('../src/pages/AnimeDetail.jsx', import.meta.url),
  'utf8'
)

assert.match(source, /const \[episodesLoading, setEpisodesLoading\] = useState\(false\)/)
assert.match(source, /https:\/\/miruro-api-v3\.onrender\.com\/episodes/)
assert.match(source, /Object\.values\(payload\?\.providers \|\| \{\}\)/)
assert.match(source, /Miruro episode API returned no episodes/)
assert.match(source, /Miruro’s episode list is unavailable right now/)
assert.match(source, /Aniraku will not create a guessed episode list/)
assert.match(source, /AnimeDetailSkeleton/)
assert.doesNotMatch(source, /Loading the verified episode list from Aniraku’s backend/)
assert.doesNotMatch(source, /EPISODE_BACKEND_GRACE_MS/)
assert.doesNotMatch(source, /getEpisodeBackendAttemptPlan/)
assert.doesNotMatch(source, /Array\.from\(\{ length: count \}/)

console.log('Anime Detail episode-loading tests passed')
