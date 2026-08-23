import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'))
const globalHeaders = config.headers.find((entry) => entry.source === '/(.*)')?.headers ?? []
const csp = globalHeaders.find((header) => header.key === 'Content-Security-Policy')?.value ?? ''

assert.match(csp, /frame-src 'self' https:/)
assert.match(csp, /frame-ancestors 'none'/)
assert.match(csp, /script-src 'self'/)
assert.match(csp, /connect-src[^;]*https:\/\/miruro-api-v3\.onrender\.com/)
assert.doesNotMatch(csp, /frame-src \*/)

console.log('Embedded-player CSP policy checks passed.')
