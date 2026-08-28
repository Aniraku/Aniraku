import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../dist', import.meta.url))
const port = Number(process.env.PORT || 4176)
const host = process.env.HOST || '0.0.0.0'

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

createServer(serveStatic).listen(port, host, () => {
  console.log(`Aniraku preview server running at http://${host}:${port}`)
})
