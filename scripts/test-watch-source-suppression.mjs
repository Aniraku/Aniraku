import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const source = await readFile(resolve('src/pages/Watch.jsx'), 'utf8')
const requireText = (needle, message) => {
  if (!source.includes(needle)) throw new Error(message)
}
const forbidText = (needle, message) => {
  if (source.includes(needle)) throw new Error(message)
}

requireText('function buildQualityList(sources, suppressedUrls = new Set())', 'Quality entries must support session-scoped exact URL suppression.')
requireText('!entry.expiredToken && !suppressedUrls.has(entry.url)', 'Expired and previously terminal-failed URLs must be excluded from quality controls.')
requireText("reason === 'hls-terminal-before-manifest'", 'Only terminal pre-start HLS failures may suppress a selected URL.')
requireText("reason === 'csp-blocked'", 'Confirmed CSP blocks must suppress only the affected selected URL.')
requireText("{ streamUrl: url }", 'Terminal callbacks must identify the exact failed source URL.')
requireText("blockedUrl === selectedUrl", 'CSP suppression must require an exact selected-media URL match.')
requireText('{SOURCES[lang].map((source) => {', 'Provider controls must continue to render from all provider sources.')
forbidText('suppressedSourceIds', 'A failed quality URL must not remove an entire provider control.')

console.log('Watch source suppression remains exact-URL-only and preserves provider controls.')
