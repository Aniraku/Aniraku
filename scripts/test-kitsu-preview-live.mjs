import assert from 'node:assert/strict'
import handler from '../api/kitsu.js'

const result = { status: 0, body: null, headers: {} }
const response = {
  setHeader(name, value) { result.headers[String(name).toLowerCase()] = value },
  status(code) { result.status = code; return this },
  json(payload) { result.body = payload; return this },
}

await handler({
  method: 'POST',
  body: {
    query: 'query ($id: Int) { Media(id: $id, type: ANIME) { id title { romaji english native userPreferred } coverImage { extraLarge large medium color } bannerImage format status episodes } }',
    variables: { id: 185874 },
  },
}, response)

assert.equal(result.status, 200, JSON.stringify(result.body))
assert.equal(result.body?.source, 'kitsu')
const media = result.body?.data?.Media
assert.equal(media?.id, 185874)
assert.equal(media?.format, 'TV')
assert.equal(media?.episodes, 10)
assert.match(media?.title?.userPreferred || '', /BLEACH|Bleach/i)
assert.match(media?.coverImage?.large || '', /^https:\/\/media\.kitsu\.app\//)
assert.match(media?.bannerImage || '', /^https:\/\/media\.kitsu\.app\//)
assert.notEqual(media.coverImage.large, media.bannerImage)

const browseResult = { status: 0, body: null, headers: {} }
const browseResponse = {
  setHeader(name, value) { browseResult.headers[String(name).toLowerCase()] = value },
  status(code) { browseResult.status = code; return this },
  json(payload) { browseResult.body = payload; return this },
}
await handler({
  method: 'POST',
  body: {
    query: 'query ($page: Int, $perPage: Int) { Page(page: $page, perPage: $perPage) { pageInfo { total } media(type: ANIME) { id title { english } coverImage { large } bannerImage } } }',
    variables: { page: 1, perPage: 5 },
  },
}, browseResponse)
assert.equal(browseResult.status, 200, JSON.stringify(browseResult.body))
assert.ok(browseResult.body?.data?.Page?.media?.length > 0, 'Expected Kitsu browse media with AniList mappings.')
assert.ok(browseResult.body.data.Page.media.every((item) => Number.isInteger(item.id) && item.id > 0))

console.log(`Preview Kitsu live check passed: ${media.title.userPreferred}; ${browseResult.body.data.Page.media.length} mapped browse records`)
