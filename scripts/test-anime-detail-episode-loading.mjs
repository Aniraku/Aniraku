import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(
  new URL('../src/pages/AnimeDetail.jsx', import.meta.url),
  'utf8'
)

assert.match(source, /EPISODE_BACKEND_GRACE_MS/)
assert.match(source, /getEpisodeBackendAttemptPlan/)
assert.match(source, /const \[episodesLoading, setEpisodesLoading\] = useState\(false\)/)
assert.match(source, /Loading the verified episode list from Aniraku’s backend/)
assert.match(source, /Aniraku will not create a guessed episode list/)
assert.match(source, /remainingGraceMs/)
assert.match(source, /Episode API returned no episodes/)
assert.doesNotMatch(source, /Array\.from\(\{ length: count \}/)

console.log('Anime Detail episode-loading tests passed')
