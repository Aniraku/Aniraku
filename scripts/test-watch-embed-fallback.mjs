import assert from 'node:assert/strict'
import { chooseBrowserPlayableEmbed } from '../src/lib/watchEmbedFallback.js'

const isBrowserPlayableEmbed = (source) => source.type === 'embed' && !source.url.includes('kwik.cx')

assert.equal(chooseBrowserPlayableEmbed([
  { type: 'embed', url: 'https://mp4upload.com/embed-dead.html' },
  { type: 'embed', url: 'https://bysekoze.com/e/ally-working' },
], isBrowserPlayableEmbed)?.url, 'https://bysekoze.com/e/ally-working')

assert.equal(chooseBrowserPlayableEmbed([
  { type: 'embed', url: 'https://kwik.cx/e/not-frameable' },
  { type: 'hls', url: 'https://vault-02.uwucdn.top/stream/kiwi.m3u8' },
], isBrowserPlayableEmbed), null)

assert.equal(chooseBrowserPlayableEmbed([
  { type: 'embed', url: 'https://mp4upload.com/embed-only.html' },
], isBrowserPlayableEmbed)?.url, 'https://mp4upload.com/embed-only.html')

console.log('watch embed fallback tests passed')
