import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const [transportSource, watchSource, vercelSource] = await Promise.all([
  readFile(resolve('src/lib/watchSourceTransport.js'), 'utf8'),
  readFile(resolve('src/pages/Watch.jsx'), 'utf8'),
  readFile(resolve('vercel.json'), 'utf8'),
])

const requireText = (source, needle, message) => {
  if (!source.includes(needle)) throw new Error(message)
}

const forbidText = (source, needle, message) => {
  if (source.includes(needle)) throw new Error(message)
}

requireText(transportSource, 'return [proxy, direct]', 'HLS transport must retain proxy-first, direct-second ordering.')
requireText(watchSource, "video.addEventListener('playing', markPlaybackStarted, { once: true })", 'Direct fallback must wait for real video playback evidence, not manifest parsing.')
requireText(watchSource, '!playbackStarted && hlsTransportIndex + 1 < hlsTransportPlan.length', 'A proxy failure before playback must advance to the direct transport even after a manifest was parsed.')
forbidText(watchSource, 'manifestReady', 'Manifest parsing must not be used as the HLS direct-fallback success gate.')
requireText(watchSource, "showToast('Proxy stream failed before playback — trying direct.'", 'The direct fallback must report its transport handoff truthfully.')
requireText(watchSource, 'hls.loadSource(hlsTransportPlan[hlsTransportIndex].url)', 'The advanced HLS transport must be loaded rather than suppressing immediately.')
requireText(watchSource, 'const terminalHttpStatus = Number(data?.response?.code ?? data?.response?.status ?? 0)', 'HLS must retain confirmed direct/proxy HTTP status for aggressive terminal filtering.')
requireText(watchSource, 'selectedMediaFailure && isTerminalProviderHttpStatus(terminalHttpStatus)', 'Only the selected media URL, not an ancillary HLS request, may trigger immediate terminal provider removal.')
requireText(vercelSource, 'https://*.workers.dev', 'CSP must permit direct fallback for verified worker-hosted stream URLs.')

console.log('HLS preserves proxy-first/direct-second fallback and CSP permits worker-hosted direct streams.')
