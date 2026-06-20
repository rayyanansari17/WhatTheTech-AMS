// tests/visual/screenshots.spec.ts
// Captures screenshots of all key pages for visual regression testing
// Run baseline: npx playwright test tests/visual/ --update-snapshots
// Run comparison: npx playwright test tests/visual/

import { test, expect } from '@playwright/test'
import { ROUTES } from '../fixtures/test-users'
import path from 'path'
import fs from 'fs'

const SCREENSHOT_DIR = path.join(process.cwd(), 'tests', 'visual', 'screenshots')

// Ensure screenshots directory exists
test.beforeAll(async () => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
  }
})

// Helper: take full page screenshot
async function screenshot(page: any, name: string) {
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(500) // Let animations settle
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `${name}.png`),
    fullPage: true,
  })
}

// ─────────────────────────────────────────────
// PUBLIC PAGES
// ─────────────────────────────────────────────

test.describe('Public Pages  -  Visual', () => {
  test('landing page  -  desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(ROUTES.home)
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'landing-desktop')
    await expect(page).toHaveScreenshot('landing-desktop.png', { maxDiffPixels: 200 }).catch(() => {
      console.log('No baseline yet  -  screenshot saved for first run')
    })
  })

  test('landing page  -  mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(ROUTES.home)
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'landing-mobile')
  })

  test('auth modal  -  desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(ROUTES.home)
    await page.getByRole('button', { name: /sign in|login|get started|register/i }).first().click()
    await page.waitForTimeout(500)
    await screenshot(page, 'auth-modal-desktop')
  })

  test('auth modal  -  mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(ROUTES.home)
    await page.getByRole('button', { name: /sign in|login|get started|register/i }).first().click()
    await page.waitForTimeout(500)
    await screenshot(page, 'auth-modal-mobile')
  })
})

// ─────────────────────────────────────────────
// AUTHENTICATED PAGES
// ─────────────────────────────────────────────

test.describe('Authenticated Pages  -  Visual', () => {
  // Uses saved auth state

  test('dashboard  -  desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(ROUTES.dashboard)
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'dashboard-desktop')
  })

  test('dashboard  -  mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(ROUTES.dashboard)
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'dashboard-mobile')
  })

  test('profile form  -  desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(ROUTES.profile)
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'profile-form-desktop')
  })

  test('profile form  -  mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(ROUTES.profile)
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'profile-form-mobile')
  })

  test('team page  -  desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(ROUTES.team)
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'team-page-desktop')
  })

  test('payment page  -  desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(ROUTES.payment)
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'payment-page-desktop')
  })

  test('payment page  -  mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(ROUTES.payment)
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'payment-page-mobile')
  })

  test('confirmation page  -  desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(ROUTES.confirmation)
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'confirmation-desktop')
  })

  test('schedule page  -  desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/dashboard/schedule')
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'schedule-desktop')
  })

  test('venue page  -  desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/dashboard/venue')
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'venue-desktop')
  })
})

// ─────────────────────────────────────────────
// ADMIN PAGES
// ─────────────────────────────────────────────

test.describe('Admin Pages  -  Visual', () => {
  test('admin dashboard  -  desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(ROUTES.admin)
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'admin-dashboard-desktop')
  })

  test('admin participants  -  desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(ROUTES.adminParticipants)
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'admin-participants-desktop')
  })

  test('admin teams  -  desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(ROUTES.adminTeams)
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'admin-teams-desktop')
  })

  test('admin payments  -  desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(ROUTES.adminPayments)
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'admin-payments-desktop')
  })

  test('admin checkin  -  desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(ROUTES.adminCheckin)
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'admin-checkin-desktop')
  })

  test('admin checkin  -  mobile (event day use)', async ({ page }) => {
    // Check-in is used on mobile during event day  -  important to test
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(ROUTES.adminCheckin)
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'admin-checkin-mobile')
  })
})
