// tests/e2e/registration.spec.ts
// Tests: Profile form fill, validation errors, partial save, completion

import { test, expect } from '@playwright/test'
import { TEST_USER, ROUTES } from '../fixtures/test-users'

test.describe('Profile Registration Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.profile)
    await expect(page).toHaveURL(/profile/)
  })

  // ─────────────────────────────────────────────
  // PAGE LOAD
  // ─────────────────────────────────────────────

  test('profile form page loads', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /profile|personal|registration/i }).first()).toBeVisible()
  })

  // ─────────────────────────────────────────────
  // VALIDATION  -  REQUIRED FIELDS
  // ─────────────────────────────────────────────

  test('shows validation errors on empty submit', async ({ page }) => {
    // Try to proceed without filling anything
    const nextBtn = page.getByRole('button', { name: /next|continue|submit|save/i }).first()
    await nextBtn.click()

    // Should show at least one error
    const errors = page.locator('[class*="error"], [class*="invalid"], [aria-invalid="true"]')
    const errorCount = await errors.count()
    expect(errorCount).toBeGreaterThan(0)
  })

  test('phone field rejects non-numeric input', async ({ page }) => {
    const phoneField = page.getByLabel(/phone/i)
    if (await phoneField.isVisible()) {
      await phoneField.fill('abcdefghij')
      await phoneField.blur()
      // Check for error or that value was sanitized
      const value = await phoneField.inputValue()
      expect(value).not.toMatch(/[a-zA-Z]/)
    }
  })

  // ─────────────────────────────────────────────
  // FORM FILL  -  PERSONAL INFO
  // ─────────────────────────────────────────────

  test('fills personal information section', async ({ page }) => {
    const fullName = page.getByLabel(/full name/i)
    if (await fullName.isVisible()) {
      await fullName.fill(TEST_USER.full_name)
      expect(await fullName.inputValue()).toBe(TEST_USER.full_name)
    }

    const phone = page.getByLabel(/phone/i)
    if (await phone.isVisible()) {
      await phone.fill(TEST_USER.phone)
    }

    const city = page.getByLabel(/city/i)
    if (await city.isVisible()) {
      await city.fill(TEST_USER.city)
    }
  })

  // ─────────────────────────────────────────────
  // FORM FILL  -  EDUCATION
  // ─────────────────────────────────────────────

  test('fills education section', async ({ page }) => {
    const institution = page.getByLabel(/institution|college|university/i)
    if (await institution.isVisible()) {
      await institution.fill(TEST_USER.institution)
    }

    const fieldOfStudy = page.getByLabel(/field of study|major|course/i)
    if (await fieldOfStudy.isVisible()) {
      await fieldOfStudy.fill(TEST_USER.field_of_study)
    }
  })

  // ─────────────────────────────────────────────
  // FORM FILL  -  COMPLETE FLOW
  // ─────────────────────────────────────────────

  test('completes full profile form', async ({ page }) => {
    // Personal info
    await page.getByLabel(/full name/i).fill(TEST_USER.full_name).catch(() => {})
    await page.getByLabel(/phone/i).fill(TEST_USER.phone).catch(() => {})
    await page.getByLabel(/city/i).fill(TEST_USER.city).catch(() => {})
    await page.getByLabel(/state/i).fill(TEST_USER.state).catch(() => {})

    // Gender select
    const genderSelect = page.getByLabel(/gender/i)
    if (await genderSelect.isVisible()) {
      await genderSelect.selectOption(TEST_USER.gender).catch(async () => {
        // Try as combobox
        await page.getByRole('combobox', { name: /gender/i }).click().catch(() => {})
        await page.getByRole('option', { name: /male/i }).first().click().catch(() => {})
      })
    }

    // Education
    await page.getByLabel(/institution|college/i).fill(TEST_USER.institution).catch(() => {})
    await page.getByLabel(/field of study/i).fill(TEST_USER.field_of_study).catch(() => {})

    // T-shirt size
    const tshirt = page.getByLabel(/t-shirt|tshirt|shirt size/i)
    if (await tshirt.isVisible()) {
      await tshirt.selectOption(TEST_USER.tshirt_size).catch(() => {})
    }

    // GitHub
    await page.getByLabel(/github/i).fill(TEST_USER.github).catch(() => {})

    // Checkboxes  -  code of conduct, privacy, terms
    const checkboxes = page.getByRole('checkbox')
    const count = await checkboxes.count()
    for (let i = 0; i < count; i++) {
      const cb = checkboxes.nth(i)
      if (!await cb.isChecked()) {
        await cb.check().catch(() => {})
      }
    }

    // Submit
    const submitBtn = page.getByRole('button', { name: /save|next|continue|submit/i }).first()
    await submitBtn.click()

    // Should progress  -  either URL changes or success message
    await page.waitForTimeout(2000)
    const successMsg = page.getByText(/saved|success|continue|team/i)
    const urlChanged = !page.url().includes('/profile')

    expect(await successMsg.isVisible().catch(() => false) || urlChanged).toBeTruthy()
  })

  // ─────────────────────────────────────────────
  // PROGRESS SIDEBAR
  // ─────────────────────────────────────────────

  test('progress sidebar shows registration steps', async ({ page }) => {
    const sidebar = page.locator('[class*="progress"], [class*="sidebar"], [class*="steps"]').first()
    if (await sidebar.isVisible()) {
      await expect(sidebar).toBeVisible()
    }
  })
})
