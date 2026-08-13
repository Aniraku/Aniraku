import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../dist', import.meta.url))
const port = Number(process.env.PORT || 4176)
const host = process.env.HOST || '0.0.0.0'
const maxBodyBytes = 1_000_000

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8',
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(payload))
}

async function proxyAniList(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  let size = 0
  const chunks = []
  for await (const chunk of req) {
    size += chunk.length
    if (size > maxBodyBytes) {
      sendJson(res, 413, { error: 'Request body is too large' })
      req.destroy()
      return
    }
    chunks.push(chunk)
  }

  let payload
  try {
    payload = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON body' })
    return
  }

  if (!payload || typeof payload.query !== 'string' || payload.query.length > 50_000 || (payload.variables && typeof payload.variables !== 'object')) {
    sendJson(res, 400, { error: 'Invalid AniList request' })
    return
  }

  try {
    const upstream = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: payload.query, variables: payload.variables || {} }),
    })
    const body = await upstream.text()
    res.writeHead(upstream.status, {
      'Content-Type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    })
    res.end(body)
  } catch {
    sendJson(res, 502, { error: 'AniList is temporarily unavailable' })
  }
}

function serveStatic(req, res) {
  const rawPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname)
  const safePath = normalize(rawPath).replace(/^([.]{2}[\\/])+/, '')
  const candidate = join(root, safePath === '/' ? 'index.html' : safePath)
  const filePath = existsSync(candidate) && statSync(candidate).isFile() ? candidate : join(root, 'index.html')
  const extension = extname(filePath).toLowerCase()
  const isAsset = filePath.includes(`${join(root, 'assets')}/`)
  res.writeHead(200, {
    'Content-Type': mimeTypes[extension] || 'application/octet-stream',
    'Cache-Control': isAsset ? 'public, max-age=31536000, immutable' : 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  })
  createReadStream(filePath).pipe(res)
}

createServer((req, res) => {
  if (new URL(req.url, `http://${req.headers.host}`).pathname === '/api/v1/anilist') {
    proxyAniList(req, res)
    return
  }
  serveStatic(req, res)
}).listen(port, host, () => {
  console.log(`Aniraku preview server running at http://${host}:${port}`)
})
