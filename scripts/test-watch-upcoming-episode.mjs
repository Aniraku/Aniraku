import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  isConfirmedUpcomingEpisode,
  UPCOMING_EPISODE_MESSAGE,
} from '../src/lib/watchEpisodeAvailability.js'

const episodeRows = [{ number: 1 }, { number: 2 }, { number: 3 }]

assert.equal(
  isConfirmedUpcomingEpisode({
    episodeNumber: 4,
    episodes: episodeRows,
    status: 'RELEASING',
    hasConfirmedEpisodeList: true,
  }),
  true
)
assert.equal(
  isConfirmedUpcomingEpisode({
    episodeNumber: 3,
    episodes: episodeRows,
    status: 'RELEASING',
    hasConfirmedEpisodeList: true,
  }),
  false
)
assert.equal(
  isConfirmedUpcomingEpisode({
    episodeNumber: 4,
    episodes: episodeRows,
    status: 'FINISHED',
    hasConfirmedEpisodeList: true,
  }),
  false
)
assert.equal(
  isConfirmedUpcomingEpisode({
    episodeNumber: 1,
    status: 'NOT_YET_RELEASED',
  }),
  true
)
assert.equal(
  isConfirmedUpcomingEpisode({
    episodeNumber: 3,
    nextAiringEpisode: { episode: 3 },
  }),
  true
)
assert.match(UPCOMING_EPISODE_MESSAGE, /Time travel still has not been invented/)

const source = readFileSync(new URL('../src/pages/Watch.jsx', import.meta.url), 'utf8')
assert.match(source, /effectiveEpisodeAvailability !== 'available'/)
assert.match(source, /effectiveEpisodeAvailability !== 'upcoming'/)
assert.match(source, /setErrorType\('upcoming'\)/)
assert.match(source, /setError\(UPCOMING_EPISODE_MESSAGE\)/)
assert.match(source, /errorType !== 'upcoming'/)

console.log('Watch upcoming-episode guard tests passed')
