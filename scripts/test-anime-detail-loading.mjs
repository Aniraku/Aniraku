import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const source = await readFile(resolve('src/pages/AnimeDetail.jsx'), 'utf8')
const relationsStart = source.indexOf('const loadRelations = async () =>')
const episodesStart = source.indexOf('const loadEpisodes = async () =>')
const relationsEnd = source.indexOf('const toggleBookmark = () =>')

if (relationsStart < 0 || episodesStart < 0 || relationsEnd < 0) {
  throw new Error('Anime Detail supplemental loading effects could not be located.')
}

const relationsEffect = source.slice(source.lastIndexOf('React.useEffect(() => {', relationsStart), episodesStart)
const episodesEffect = source.slice(source.lastIndexOf('React.useEffect(() => {', episodesStart), relationsEnd)

for (const [name, effect] of [['relations', relationsEffect], ['episodes', episodesEffect]]) {
  if (!effect.includes('if (!id) return undefined')) {
    throw new Error(`${name} loading must begin from the route ID without waiting for metadata.`)
  }
  if (effect.includes('if (!anime || !id)')) {
    throw new Error(`${name} loading is still incorrectly serialized behind metadata.`)
  }
  if (!effect.includes('}, [id])')) {
    throw new Error(`${name} loading must depend only on the stable route ID.`)
  }
}

console.log('Anime Detail supplemental requests start from the route ID without metadata serialization.')
