import { chromium } from '@playwright/test'

const baseURL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000'
const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] })
const page = await browser.newPage()
const requests = []

page.on('request', (request) => {
  const url = request.url()
  if (/anilist|api\/v1\/anilist|graphql/i.test(url)) {
    requests.push({ method: request.method(), url })
  }
})

page.on('console', (message) => {
  if (message.type() === 'error') console.error(`[browser] ${message.text()}`)
})

await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(8000)

const result = requests.map((request) => ({
  ...request,
  classification: /graphql\.anilist\.co/i.test(request.url)
    ? 'direct-anilist'
    : /api\.aniraku\.tech|\/api\/v1\/anilist/i.test(request.url)
      ? 'aniraku-backend'
      : 'other-anilist-like',
}))

console.log(JSON.stringify({ baseURL, requests: result }, null, 2))
await browser.close()

if (!result.length) process.exitCode = 2
if (result.some((request) => request.classification === 'aniraku-backend')) process.exitCode = 1
