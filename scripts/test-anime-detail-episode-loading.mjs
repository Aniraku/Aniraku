import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(
  new URL('../src/pages/AnimeDetail.jsx', import.meta.url),
  'utf8'
)

assert.match(source, /const \[episodesLoading, setEpisodesLoading\] = useState\(false\)/)
assert.match(source, /\$\{API_BASE\}\/api\/v1\/anime\/\$\{encodeURIComponent\(id\)\}\/episodes/)
assert.match(source, /Array\.isArray\(payload\) \? payload : payload\?\.episodes/)
assert.match(source, /Aniraku episode API returned no episodes/)
assert.match(source, /const EPISODE_RETRY_BASE_MS = 1_500/)
assert.match(source, /const EPISODE_RETRY_MAX_MS = 15_000/)
assert.match(source, /retryTimer = window\.setTimeout\(loadEpisodes, delay\)/)
assert.match(source, /if \(retryTimer\) window\.clearTimeout\(retryTimer\)/)
assert.doesNotMatch(source, /MIRURO_EPISODES_BASE/)
assert.doesNotMatch(source, /payload\?\.providers/)
assert.doesNotMatch(source, /episodesFallback/)
assert.doesNotMatch(source, /episode list is unavailable right now/)
assert.doesNotMatch(source, /Aniraku will not create a guessed episode list/)
assert.match(source, /AnimeDetailSkeleton/)
assert.doesNotMatch(source, /Loading the verified episode list from Aniraku’s backend/)
assert.doesNotMatch(source, /EPISODE_BACKEND_GRACE_MS/)
assert.doesNotMatch(source, /getEpisodeBackendAttemptPlan/)
assert.doesNotMatch(source, /Array\.from\(\{ length: count \}/)
assert.match(source, /<EpThumbPlaceholder aria-hidden="true">EP<\/EpThumbPlaceholder>/)
assert.match(source, /ep\.title \|\| `Episode \$\{num\}`/)
assert.doesNotMatch(source, /src=\{ep\.thumbnail \|\| ''\}/)

console.log('Anime Detail episode-loading tests passed')
