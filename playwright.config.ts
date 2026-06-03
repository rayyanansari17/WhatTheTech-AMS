import { defineConfig, devices } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'

// Load .env.test so PLAYWRIGHT_TEST_MODE and secrets are available
const envTestPath = path.join(__dirname, '.env.test')
if (fs.existsSync(envTestPath)) {
  dotenv.config({ path: envTestPath })
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // run sequentially to avoid DB conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 30_000,

  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 10_000,
  },

  projects: [
    // ── Auth setup runs first — saves login state for all other tests
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },

    // ── E2E tests (use saved login state)
    {
      name: 'e2e-chromium',
      testMatch: /e2e\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/fixtures/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // ── Visual tests (no login needed for public pages)
    {
      name: 'visual-chromium',
      testMatch: /visual\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    // ── Mobile viewport visual tests
    {
      name: 'visual-mobile',
      testMatch: /visual\/.*\.spec\.ts/,
      use: {
        ...devices['iPhone 13'],
      },
    },
  ],

  // Start Next.js dev server with PLAYWRIGHT_TEST_MODE enabled
  webServer: {
    command: 'PLAYWRIGHT_TEST_MODE=true npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      PLAYWRIGHT_TEST_MODE: 'true',
    },
  },
})
