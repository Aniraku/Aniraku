import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const source = await readFile(resolve('src/pages/Watch.jsx'), 'utf8')

assert.match(source, /const selectedScore = Math\.round\(Number\(score\)\)/)
assert.match(source, /saveEpisodeRating\(animeId, epNumber, selectedScore\)/)
assert.match(source, /score: selectedScore/)
assert.match(source, /Score \$\{selectedScore\}\/10 synced/)
assert.doesNotMatch(source, /score: avg/)
assert.doesNotMatch(source, /const avg = scores\.length/)

console.log('Selected-rating sync regression passed.')
