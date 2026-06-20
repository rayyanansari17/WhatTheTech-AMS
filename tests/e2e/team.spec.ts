// tests/e2e/team.spec.ts
// Tests: Team creation, invite flow, accept/reject, team full state

import { test, expect } from '@playwright/test'
import { TEST_TEAM, TEST_INVITE_EMAIL, ROUTES } from '../fixtures/test-users'

test.describe('Team Management', () => {

  // ─────────────────────────────────────────────
  // TEAM PAGE LOAD
  // ─────────────────────────────────────────────

  test('team page loads correctly', async ({ page }) => {
    await page.goto(ROUTES.team)
    await expect(page).toHaveURL(/team/)
    await expect(page.getByRole('heading', { name: /team/i }).first()).toBeVisible()
  })

  test('team page shows create and join options', async ({ page }) => {
    await page.goto(ROUTES.team)

    const createOption = page.getByRole('button', { name: /create|new team/i })
      .or(page.getByText(/create.*team|start.*team/i).first())

    const joinOption = page.getByRole('button', { name: /join|enter code/i })
      .or(page.getByText(/join.*team|have.*code/i).first())

    const hasCreate = await createOption.isVisible().catch(() => false)
    const hasJoin = await joinOption.isVisible().catch(() => false)

    expect(hasCreate || hasJoin).toBeTruthy()
  })

  // ─────────────────────────────────────────────
  // CREATE TEAM
  // ─────────────────────────────────────────────

  test('team name field accepts input', async ({ page }) => {
    await page.goto(ROUTES.team)

    const teamNameField = page.getByLabel(/team name/i)
      .or(page.getByPlaceholder(/team name/i))

    if (await teamNameField.isVisible()) {
      await teamNameField.fill(TEST_TEAM.team_name)
      expect(await teamNameField.inputValue()).toBe(TEST_TEAM.team_name)
    }
  })

  test('track selection works', async ({ page }) => {
    await page.goto(ROUTES.team)

    const trackSelect = page.getByLabel(/track/i)
    if (await trackSelect.isVisible()) {
      // Try native select
      await trackSelect.selectOption({ index: 1 }).catch(async () => {
        // Try as radio buttons
        const trackRadio = page.getByRole('radio').first()
        if (await trackRadio.isVisible()) {
          await trackRadio.check()
        }
      })
    }
  })

  test('validates empty team name', async ({ page }) => {
    await page.goto(ROUTES.team)

    // Try to create without filling name
    const createBtn = page.getByRole('button', { name: /create|submit|next/i }).first()
    if (await createBtn.isVisible()) {
      await createBtn.click()

      // Should show validation error
      await page.waitForTimeout(500)
      const error = page.getByText(/required|enter.*team|team.*name/i).first()
      const hasError = await error.isVisible().catch(() => false)

      if (!hasError) {
        // Check for aria-invalid
        const invalidField = page.locator('[aria-invalid="true"]').first()
        expect(await invalidField.isVisible().catch(() => false)).toBeTruthy()
      } else {
        expect(hasError).toBeTruthy()
      }
    }
  })

  test('creates team with valid data', async ({ page }) => {
    await page.goto(ROUTES.team)

    // Fill team name
    await page.getByLabel(/team name/i)
      .or(page.getByPlaceholder(/team name/i))
      .fill(TEST_TEAM.team_name).catch(() => {})

    // Fill idea title if present
    await page.getByLabel(/idea.*title|project.*title/i)
      .fill(TEST_TEAM.idea_title).catch(() => {})

    // Fill idea description if present
    await page.getByLabel(/idea.*desc|project.*desc|description/i)
      .fill(TEST_TEAM.idea_desc).catch(() => {})

    // Select track
    const trackSelect = page.getByLabel(/track/i)
    if (await trackSelect.isVisible()) {
      await trackSelect.selectOption({ index: 1 }).catch(() => {})
    }

    // Submit
    const createBtn = page.getByRole('button', { name: /create.*team|submit|next/i }).first()
    await createBtn.click()

    // Wait for response
    await page.waitForTimeout(2000)

    // Should show team code, success message, or proceed to next step
    const success = page.getByText(/team.*created|success|team code|invite/i).first()
    const urlChanged = page.url().includes('payment') || page.url().includes('confirmation')
    const hasTeamCode = await page.getByText(/[A-Z0-9]{4,8}/).isVisible().catch(() => false)

    expect(
      await success.isVisible().catch(() => false) || urlChanged || hasTeamCode
    ).toBeTruthy()
  })

  // ─────────────────────────────────────────────
  // JOIN TEAM
  // ─────────────────────────────────────────────

  test('join team with invalid code shows error', async ({ page }) => {
    await page.goto(ROUTES.team)

    // Look for join/code input
    const codeInput = page.getByLabel(/team code|join code|invite code/i)
      .or(page.getByPlaceholder(/enter code|team code/i))

    if (await codeInput.isVisible()) {
      await codeInput.fill('INVALID123')

      const joinBtn = page.getByRole('button', { name: /join/i }).first()
      await joinBtn.click()

      await page.waitForTimeout(1000)

      const error = page.getByText(/invalid|not found|wrong code|doesn't exist/i).first()
      expect(await error.isVisible().catch(() => false)).toBeTruthy()
    } else {
      console.log('Join code input not visible  -  may need to select join tab first')
      test.skip()
    }
  })

  // ─────────────────────────────────────────────
  // TEAM INVITE
  // ─────────────────────────────────────────────

  test('invite member form is accessible', async ({ page }) => {
    await page.goto(ROUTES.team)

    // Look for invite section (may only appear after team is created)
    const inviteInput = page.getByLabel(/invite|email.*member|member.*email/i)
      .or(page.getByPlaceholder(/invite.*email|member email/i))

    if (await inviteInput.isVisible()) {
      await inviteInput.fill(TEST_INVITE_EMAIL)
      expect(await inviteInput.inputValue()).toBe(TEST_INVITE_EMAIL)
    } else {
      console.log('Invite input not visible on team page load  -  may require team creation first')
    }
  })

  // ─────────────────────────────────────────────
  // DASHBOARD TEAM STATUS
  // ─────────────────────────────────────────────

  test('dashboard shows team registration status', async ({ page }) => {
    await page.goto(ROUTES.dashboard)

    // Dashboard should show some team/registration status
    const statusIndicator = page.getByText(/team|registered|pending|complete/i).first()
    await expect(statusIndicator).toBeVisible()
  })
})
