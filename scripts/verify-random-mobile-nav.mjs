import { chromium } from 'playwright'
import { writeFile } from 'node:fs/promises'

const baseUrl = process.env.MAIN_SITE_BASE_URL || 'http://127.0.0.1:4175'
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({
  viewport: { width: 360, height: 800 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 1,
})

try {
  await page.goto(`${baseUrl}/home`, { waitUntil: 'domcontentloaded', timeout: 30_000 })
  const nav = page.locator('nav[aria-label="Mobile navigation"]')
  await nav.waitFor({ state: 'visible', timeout: 10_000 })

  const beforeClick = await nav.evaluate((element) => ({
    labels: Array.from(element.querySelectorAll('button')).map((button) => button.textContent?.trim()),
    searchButtonCount: element.querySelectorAll('[aria-label="Search"]').length,
    randomButtonCount: element.querySelectorAll('[aria-label="Open Random Anime Pick"]').length,
  }))

  if (beforeClick.searchButtonCount !== 0) throw new Error('The obsolete Search navigation item is still present.')
  if (beforeClick.randomButtonCount !== 1) throw new Error('The Random Anime Pick navigation item is missing or duplicated.')
  if (beforeClick.labels.join('|') !== 'Home|Catalog|Schedule|Random|Profile') throw new Error(`Unexpected mobile navigation order: ${beforeClick.labels.join('|')}`)

  await page.getByRole('button', { name: 'Open Random Anime Pick' }).click()
  await page.waitForURL(/\/random$/, { timeout: 10_000 })
  await page.locator('h1').filter({ hasText: 'WHAT' }).waitFor({ state: 'visible', timeout: 10_000 })

  const afterClick = {
    url: page.url(),
    title: await page.title(),
    randomHeading: (await page.locator('h1').innerText()).replace(/\s+/g, ' ').trim(),
  }

  await page.screenshot({ path: '/home/ubuntu/aniraku-main-website/random-mobile-nav-preview.png', fullPage: true })
  await writeFile(
    '/home/ubuntu/aniraku-main-website/.tmp-random-mobile-nav-verification.json',
    JSON.stringify({ baseUrl, beforeClick, afterClick }, null, 2),
  )

  console.log(JSON.stringify({ beforeClick, afterClick }, null, 2))
} finally {
  await browser.close()
}
