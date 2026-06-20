// tests/fixtures/auth.setup.ts
import { test as setup, expect } from '@playwright/test'
import path from 'path'

const AUTH_FILE = path.join(__dirname, '.auth/user.json')

setup('authenticate test user', async ({ page, request }) => {
  const email = process.env.TEST_USER_EMAIL || 'playwright.test@gmail.com'
  const secret = process.env.INTERNAL_EMAIL_SECRET || ''

  // ── Get magic link from test login API
  const response = await request.post('/api/test/login', {
    data: { email, secret },
    headers: { 'Content-Type': 'application/json' },
  })

  if (response.ok()) {
    const body = await response.json()
    const actionLink: string = body.action_link

    if (actionLink) {
      // Navigate to Supabase verify URL  -  it redirects back to our app with
      // #access_token=... in the hash. The Supabase browser client picks this up.
      await page.goto(actionLink)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000) // let Supabase client process the hash

      // Extract tokens from the URL hash and inject session via the browser
      const currentUrl = page.url()
      const hashIndex = currentUrl.indexOf('#')
      if (hashIndex !== -1) {
        const hashParams = new URLSearchParams(currentUrl.substring(hashIndex + 1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        if (accessToken && refreshToken) {
          console.log('Injecting session tokens into browser...')
          // Use the Supabase browser client (exposed globally) to set session
          await page.evaluate(
            async ({ at, rt }) => {
              // Find the Supabase client on window or use fetch to set cookies
              const res = await fetch('/api/test/set-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ access_token: at, refresh_token: rt }),
              })
              return res.ok
            },
            { at: accessToken, rt: refreshToken }
          )
          await page.waitForTimeout(1000)
          await page.reload()
          await page.waitForLoadState('networkidle')
        }
      }

      // Navigate to dashboard to verify session is active
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1500)
      console.log('Final URL:', page.url())
    }
  } else {
    // ── Fallback: manual UI login via "Apply For Hackathon" button
    console.log(`Test login API failed (${response.status()}), falling back to UI login...`)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: /apply|sign in|login|get started|register/i }).first().click()

    const emailTab = page.getByRole('tab', { name: /email/i })
    if (await emailTab.isVisible()) await emailTab.click()

    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD || 'TestPassword@123')
    await page.getByRole('button', { name: /sign in|login/i }).click()
    await page.waitForURL(/dashboard|register/, { timeout: 15_000 })
  }

  await page.context().storageState({ path: AUTH_FILE })
  console.log('✅ Auth state saved to', AUTH_FILE)
})
