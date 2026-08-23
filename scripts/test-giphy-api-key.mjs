import assert from 'node:assert/strict'

const key = process.env.VITE_GIPHY_API_KEY
assert.ok(key, 'VITE_GIPHY_API_KEY must be set before GIF picker validation')

const endpoint = new URL('https://api.giphy.com/v1/gifs/trending')
endpoint.searchParams.set('api_key', key)
endpoint.searchParams.set('limit', '1')
endpoint.searchParams.set('rating', 'g')

const response = await fetch(endpoint)
assert.equal(response.ok, true, `GIPHY validation returned ${response.status}`)
const payload = await response.json()
assert.ok(Array.isArray(payload?.data), 'GIPHY validation returned no GIF data array')

console.log('GIPHY API key validation passed.')
