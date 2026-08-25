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

requireText(transportSource, 'return [proxy, direct]', 'HLS transport must retain proxy-first, direct-second ordering.')
requireText(watchSource, 'hlsTransportIndex + 1 < hlsTransportPlan.length', 'A failed proxy manifest must advance to the direct transport.')
requireText(watchSource, 'hls.loadSource(hlsTransportPlan[hlsTransportIndex].url)', 'The advanced HLS transport must be loaded rather than suppressing immediately.')
requireText(vercelSource, 'https://*.workers.dev', 'CSP must permit direct fallback for verified worker-hosted stream URLs.')

console.log('HLS preserves proxy-first/direct-second fallback and CSP permits worker-hosted direct streams.')
