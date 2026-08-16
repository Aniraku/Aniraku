const PROVIDER_ORIGIN = 'https://kwik.cx/'
const PROVIDER_HOST = 'kwik.cx'
const ALLOWED_MEDIA_HOST = /(?:^|\.)(?:owocdn|uwucdn)\.(?:top|net|com)$/i
const ANIRAKU_PROXY = 'https://api.aniraku.tech/api/v1/proxy'
const PROVIDER_HEADERS = {
  Referer: PROVIDER_ORIGIN,
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

function baseIndex(value, base) {
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  return [...value].reduce((total, char) => total * base + alphabet.indexOf(char), 0)
}

function unpackKiwiConfiguration(html) {
  const tokenTable = [...html.matchAll(/'([^']*)'\.split\('\|'/g)].at(-1)?.[1]
  const packedBlock = [...html.matchAll(/eval\(function\([\s\S]*?\.split\('\|'\),0,\{\}\)\)/g)].at(-1)?.[0]
  if (!tokenTable || !packedBlock) return ''

  const tokens = tokenTable.split('|')
  return packedBlock.replace(/\b[0-9A-Za-z]+\b/g, (word) => {
    const index = baseIndex(word, 62)
    return Number.isInteger(index) && index >= 0 && index < tokens.length && tokens[index] ? tokens[index] : word
  })
}

function extractKiwiHls(html) {
  const unpacked = unpackKiwiConfiguration(html)
  const match = unpacked.match(/https:\/\/[^'"\s<>\\]+\.m3u8(?:\?[^'"\s<>\\]+)?/i)
  if (!match) return ''
  try {
    const target = new URL(match[0].replace(/\\$/, ''))
    return ALLOWED_MEDIA_HOST.test(target.hostname) ? target.toString() : ''
  } catch {
    return ''
  }
}

function requestTarget(rawURL) {
  try {
    const target = new URL(rawURL)
    const pathParts = target.pathname.split('/').filter(Boolean)
    const isEmbed = target.protocol === 'https:' && target.hostname === PROVIDER_HOST && pathParts.length === 2 && pathParts[0] === 'e' && /^[A-Za-z0-9_-]{6,128}$/.test(pathParts[1])
    return isEmbed ? target : null
  } catch {
    return null
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const target = requestTarget(req.query?.url)
  if (!target) return res.status(400).json({ error: 'invalid_kiwi_embed' })

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8_000)
  try {
    const proxyURL = new URL(ANIRAKU_PROXY)
    proxyURL.searchParams.set('url', target.toString())
    proxyURL.searchParams.set('headers', JSON.stringify(PROVIDER_HEADERS))
    const upstream = await fetch(proxyURL, {
      signal: controller.signal,
      redirect: 'error',
      headers: { Accept: 'text/html,application/xhtml+xml' },
    })
    if (!upstream.ok) return res.status(502).json({ error: 'kiwi_upstream_unavailable' })

    const html = await upstream.text()
    if (html.length > 300_000) return res.status(502).json({ error: 'kiwi_response_too_large' })
    const hlsURL = extractKiwiHls(html)
    if (!hlsURL) return res.status(502).json({ error: 'kiwi_hls_unavailable' })

    res.setHeader('Cache-Control', 'no-store, private')
    return res.status(200).json({
      source: { url: hlsURL, type: 'hls', verification: 'proxy' },
      headers: { Referer: PROVIDER_ORIGIN },
    })
  } catch {
    return res.status(502).json({ error: 'kiwi_resolution_failed' })
  } finally {
    clearTimeout(timeout)
  }
}
