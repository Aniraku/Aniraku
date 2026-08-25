import { generateSlug, titleText } from '../src/lib/slug.js'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const expectEqual = (actual, expected, message) => {
  if (actual !== expected) throw new Error(`${message}\nExpected: ${expected}\nReceived: ${actual}`)
}

expectEqual(titleText('Attack on Titan'), 'Attack on Titan', 'Plain-text titles must be preserved.')
expectEqual(titleText({ english: 'Attack on Titan', romaji: 'Shingeki no Kyojin' }), 'Attack on Titan', 'Object-shaped titles must prefer readable English text.')
expectEqual(titleText({ romaji: 'Shingeki no Kyojin' }), 'Shingeki no Kyojin', 'Object-shaped titles must fall back to romaji text.')
expectEqual(titleText(['not', 'a', 'title']), '', 'Array values must not be coerced into malformed visible titles.')
expectEqual(generateSlug({ romaji: 'Shingeki no Kyojin' }), 'shingeki-no-kyojin', 'Slug generation must accept an AniList-style title object without calling lowercase on the object.')

const profileSource = await readFile(resolve('src/pages/Profile.jsx'), 'utf8')
if (!profileSource.includes('const bookmarkTitle = titleText(b?.title)')) throw new Error('Profile bookmarks must normalize persisted title values before rendering and routing.')
if (!profileSource.includes('const historyTitle = titleText(h?.title)')) throw new Error('Profile history must normalize persisted title values before rendering and routing.')

console.log('Profile title rendering safely handles persisted object-shaped title values.')
