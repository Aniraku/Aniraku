import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { ANDROID_APP_INTENT, ANDROID_APP_RELEASE_URL } from '../src/lib/androidAppFallback.js'

const baseUrl = process.env.ANIRAKU_TEST_URL || 'http://127.0.0.1:4173/'
const androidUserAgent = 'Mozilla/5.0 (Linux; Android 15; SM-A145F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36'

const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true })

try {
  const androidContext = await browser.newContext({
    userAgent: androidUserAgent,
    viewport: { width: 412, height: 915 },
    isMobile: true,
    hasTouch: true,
  })
  const androidPage = await androidContext.newPage()
  await androidPage.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await androidPage.getByRole('dialog', { name: /Use the Aniraku app/i }).waitFor({ timeout: 8_000 })
  const appOpenLink = androidPage.getByRole('link', { name: /USE ANIRAKU APP/i })
  assert.equal(await appOpenLink.getAttribute('href'), ANDROID_APP_INTENT)
  const downloadLink = androidPage.getByRole('link', { name: /V4\.5 NOTES/i })
  assert.equal(await downloadLink.count(), 1)
  assert.equal(await downloadLink.getAttribute('href'), ANDROID_APP_RELEASE_URL)
  assert.equal(await androidPage.getByText(/Bonk now appears only with direct or proxy media/i).count(), 1)
  assert.equal(await androidPage.getByRole('button', { name: /CONTINUE ON WEB/i }).count(), 1)
  if (process.env.ANIRAKU_FALLBACK_SCREENSHOT) {
    await androidPage.screenshot({ path: process.env.ANIRAKU_FALLBACK_SCREENSHOT, fullPage: false })
  }
  await androidPage.getByRole('button', { name: /CONTINUE ON WEB/i }).click()
  await androidPage.getByRole('dialog').waitFor({ state: 'hidden' })
  await androidPage.reload({ waitUntil: 'domcontentloaded', timeout: 45_000 })
  await androidPage.waitForTimeout(1_000)
  assert.equal(await androidPage.getByRole('dialog').count(), 0)
  await androidContext.close()

  const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const desktopPage = await desktopContext.newPage()
  await desktopPage.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await desktopPage.waitForTimeout(1_000)
  assert.equal(await desktopPage.getByRole('dialog').count(), 0)
  await desktopContext.close()

  const legacyAndroidContext = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Linux; Android 8.1; Pixel) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36',
    viewport: { width: 412, height: 915 },
    isMobile: true,
    hasTouch: true,
  })
  const legacyAndroidPage = await legacyAndroidContext.newPage()
  await legacyAndroidPage.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await legacyAndroidPage.waitForTimeout(1_000)
  assert.equal(await legacyAndroidPage.getByRole('dialog').count(), 0)
  await legacyAndroidContext.close()

  console.log('Android fallback browser checks passed.')
} finally {
  await browser.close()
}
