import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  isTerminalProviderHttpStatus,
  isProviderProbeUsable,
  shouldHideProviderAfterFailure,
} from '../src/lib/watchProviderVisibility.js'

assert.equal(isTerminalProviderHttpStatus(404), true)
assert.equal(isTerminalProviderHttpStatus(502), true)
assert.equal(isTerminalProviderHttpStatus(200), false)
assert.equal(isTerminalProviderHttpStatus(undefined), false)

assert.equal(isProviderProbeUsable({ status: 404 }), false, 'A stream-endpoint 404 must remove the provider before controls render.')
assert.equal(isProviderProbeUsable({ status: 502 }), false, 'A stream-endpoint 502 must remove the provider before controls render.')
assert.equal(isProviderProbeUsable({ status: 200, payload: { error: 'No video source found' } }), false, 'An explicit resolver error payload must remove the provider before controls render.')
assert.equal(isProviderProbeUsable({ status: 200, payload: { sources: [{ url: 'https://cdn.example/stream.m3u8' }] } }), true, 'A resolver response with a real media URL must retain the provider.')
assert.equal(isProviderProbeUsable({ transportFailed: true }), true, 'A timeout or browser transport failure must not hide a provider without a confirmed stream status.')

assert.equal(shouldHideProviderAfterFailure({
  status: 404,
  mediaUrls: [],
}), true, 'A confirmed 404 stream response must hide its provider row.')

assert.equal(shouldHideProviderAfterFailure({
  status: 502,
  mediaUrls: [],
}), true, 'A confirmed 502 stream response must hide its provider row.')

assert.equal(shouldHideProviderAfterFailure({
  status: 502,
  mediaUrls: ['https://cdn.example/alternate.m3u8'],
}), true, 'A confirmed 502 must immediately hide the affected provider even if it advertised another source.')

assert.equal(shouldHideProviderAfterFailure({
  status: 402,
  mediaUrls: ['https://cdn.example/alternate.m3u8'],
}), true, 'A confirmed 402 must immediately hide the affected provider even if it advertised another source.')

assert.equal(shouldHideProviderAfterFailure({
  reason: 'hls-terminal-before-playback',
  failedUrl: 'https://cdn.example/auto.m3u8',
  mediaUrls: ['https://cdn.example/auto.m3u8', 'https://cdn.example/720.m3u8'],
}), false, 'A provider must remain visible while another real quality URL remains.')

assert.equal(shouldHideProviderAfterFailure({
  reason: 'hls-terminal-before-playback',
  failedUrl: 'https://cdn.example/auto.m3u8',
  mediaUrls: ['https://cdn.example/auto.m3u8'],
}), true, 'A provider with no remaining media URL must be hidden after terminal failure.')

assert.equal(shouldHideProviderAfterFailure({
  reason: 'network',
  mediaUrls: [],
}), false, 'A transient network failure must not hide a provider row.')

const watchSource = await readFile(resolve('src/pages/Watch.jsx'), 'utf8')
assert.match(watchSource, /isProviderProbeUsable\(\{ status: response\.status, payload \}\)/, 'Controls must preflight providers through the existing stream resolver.')
assert.match(watchSource, /setHiddenProviderIds\(\(previous\) => new Set\(\[\.\.\.previous, source\.id\]\)\)/, 'A confirmed failed resolver response must hide the provider row.')
assert.match(watchSource, /const VISIBLE_SOURCES = useMemo/, 'Provider controls must derive from terminal-filtered rows.')
assert.match(watchSource, /const selectedMediaFailure = !failedRequestUrl/, 'Ancillary HLS subresource failures must remain distinct from selected-media failures.')
assert.match(watchSource, /const terminalHttpStatus = Number\(data\?\.response\?\.code \?\? data\?\.response\?\.status \?\? 0\)/, 'HLS direct/proxy HTTP failures must preserve their status for provider filtering.')
assert.match(watchSource, /status: selectedMediaFailure && isTerminalProviderHttpStatus\(terminalHttpStatus\)/, 'Only terminal selected-media HTTP failures may remove a provider immediately.')
assert.match(watchSource, /shouldRetainAllyBesideBonk/, 'Ally must remain protected as the manual fallback when Bonk is the only alternative.')
assert.match(watchSource, /!isProviderProbeUsable\(\{ status: response\.status, payload \}\) && !isProtectedAllyFallback\(source\)/, 'A resolver 404/502 must hide the affected provider unless it is the protected Bonk-only Ally fallback.')

console.log('Watch provider visibility removes only confirmed terminal provider failures.')
