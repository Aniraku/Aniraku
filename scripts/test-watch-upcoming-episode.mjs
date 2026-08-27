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
    episodeNumber: 2,
    episodes: Array.from({ length: 12 }, (_, index) => ({ number: index + 1 })),
    status: 'NOT_YET_RELEASED',
    hasConfirmedEpisodeList: true,
  }),
  true
)
assert.equal(
  isConfirmedUpcomingEpisode({
    episodeNumber: 1,
    status: 'NOT_YET_RELEASED',
    isMovie: true,
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
assert.equal(
  isConfirmedUpcomingEpisode({
    episodeNumber: 1,
    nextAiringEpisode: { episode: 1 },
    isMovie: true,
  }),
  true
)
assert.equal(
  isConfirmedUpcomingEpisode({
    episodeNumber: 1,
    status: 'FINISHED',
    isMovie: true,
  }),
  false
)
assert.match(UPCOMING_EPISODE_MESSAGE, /Time travel still has not been invented/)

const source = readFileSync(new URL('../src/pages/Watch.jsx', import.meta.url), 'utf8')
assert.match(source, /effectiveEpisodeAvailability !== 'available'/)
assert.match(source, /effectiveEpisodeAvailability !== 'upcoming'/)
assert.match(source, /setErrorType\('upcoming'\)/)
assert.match(source, /setError\(UPCOMING_EPISODE_MESSAGE\)/)
assert.match(source, /errorType !== 'upcoming'/)
assert.match(source, /confirmedUnreleasedAnimeIdsRef/)
assert.match(source, /confirmedUnreleasedAnimeIdsRef\.current\.add\(String\(animeId\)\)/)
assert.match(source, /effectiveEpisodeAvailability === 'upcoming'\s*\? UPCOMING_EPISODE_MESSAGE/)
assert.ok(
  source.indexOf("confirmedUnreleasedAnimeIdsRef.current.add(String(animeId))") < source.indexOf('await enrichEpisodesWithTmdb'),
  'Future availability must be confirmed before optional TMDB display enrichment can settle.'
)
assert.ok(
  source.indexOf('setEpisodeAvailability(\n          isConfirmedUpcomingEpisode') < source.indexOf('await enrichEpisodesWithTmdb'),
  'Provider discovery must receive the availability decision before optional display enrichment.'
)
assert.match(source, /enrichEpisodesWithTmdb\(animeId, normalizedEpisodes, \{[\s\S]*?\}\)\.catch\(\(\) => normalizedEpisodes\)/)
assert.match(source, /confirmedUnreleasedAnimeIdsRef\.current\.has\(String\(animeId\)\)\s*\? 'upcoming'\s*:\s*'available'/)
assert.match(source, /effectiveEpisodeAvailability !== 'upcoming' && streamLoading/)
assert.match(source, /effectiveEpisodeAvailability !== 'upcoming' && buffering/)

console.log('Watch upcoming-episode guard tests passed')
