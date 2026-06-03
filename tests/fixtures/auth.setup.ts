// tests/fixtures/auth.setup.ts
// Creates a saved login session so all e2e tests skip the login step
// Uses a test-only API route to inject a Supabase session directly

import { test as setup, expect } from '@playwright/test'
import path from 'path'

const AUTH_FILE = path.join(__dirname, '.auth/user.json')

setup('authenticate test user', async ({ page, request }) => {
  // ── Option 1: Use test login API route (recommended)
  // This route only works when PLAYWRIGHT_TEST_MODE=true in .env
  // It bypasses Google OAuth by directly creating a Supabase session
  
  const response = await request.post('/api/test/login', {
    data: {
      email: process.env.TEST_USER_EMAIL || 'playwright.test@gmail.com',
      secret: process.env.INTERNAL_EMAIL_SECRET,
    },
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (response.ok()) {
    // Session injected via API — now navigate to dashboard to confirm
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/dashboard/)
  } else {
    // ── Option 2: Fallback — manual email/password login
    // Only works if you have a test user with email/password in Supabase
    console.log('Test login API not available, falling back to manual login...')
    
    await page.goto('/')
    
    // Open auth modal
    await page.getByRole('button', { name: /sign in|login|get started/i }).first().click()
    
    // Switch to email login if modal has tabs
    const emailTab = page.getByRole('tab', { name: /email/i })
    if (await emailTab.isVisible()) {
      await emailTab.click()
    }
    
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL || 'playwright.test@gmail.com')
    await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD || 'TestPassword@123')
    await page.getByRole('button', { name: /sign in|login/i }).click()
    
    await page.waitForURL(/dashboard/, { timeout: 15_000 })
  }

  // Save session state to file — reused by all e2e tests
  await page.context().storageState({ path: AUTH_FILE })
  console.log('✅ Auth state saved to', AUTH_FILE)
})
