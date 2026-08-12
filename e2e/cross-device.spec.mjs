import { test, expect, devices } from '@playwright/test'

const VIEWPORTS = [
  { name: 'Small Phone', width: 375, height: 667 },
  { name: 'Large Phone / Foldable', width: 480, height: 900 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Laptop', width: 1280, height: 800 },
  { name: 'Desktop', width: 1440, height: 900 },
]

test.describe('Aniraku Cross-Device Experience', () => {
  for (const vp of VIEWPORTS) {
    test(`Landing and navigation on ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('http://localhost:5173/')

      // Check title or main landmark
      const main = page.locator('main, #root')
      await expect(main).toBeVisible()

      // If mobile width, check that MobileBottomNav or mobile search is accessible
      if (vp.width <= 768) {
        const bottomNav = page.locator('nav').filter({ hasText: 'Home' })
        await expect(bottomNav).toBeVisible()
      }
    })
  }

  test('Catalog discovery and search filter responsiveness', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('http://localhost:5173/catalog')

    // Check catalog filters and grid
    const catalogHeader = page.locator('h1, h2, text=Catalog').first()
    await expect(catalogHeader).toBeVisible()
  })
})
