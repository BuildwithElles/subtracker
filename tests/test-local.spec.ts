// Local test version
import { test, expect } from '@playwright/test'

test.describe('Subtracker App - Local', () => {
  test('Landing page loads', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await expect(page).toHaveTitle(/SubTracker/i)
    await expect(page.locator('text=Get Started Free')).toBeVisible()
  })

  test('Signup page loads with form', async ({ page }) => {
    await page.goto('http://localhost:3000/signup')
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="submit-button"]')).toBeVisible()
  })

  test('Dashboard loads', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard')
    await expect(page.locator('text=Dashboard')).toBeVisible()
    await expect(page.locator('text=Total Spend')).toBeVisible()
    await expect(page.locator('[data-test=subscriptions-list]')).toBeVisible()
  })

  test('Budget page loads with form', async ({ page }) => {
    await page.goto('http://localhost:3000/budget')
    await expect(page.locator('input[name="income"]')).toBeVisible()
    await expect(page.locator('input[name="fixed"]')).toBeVisible()
    await expect(page.locator('input[name="savings"]')).toBeVisible()
    await expect(page.locator('button:has-text("Submit")')).toBeVisible()
  })

  test('Settings page loads', async ({ page }) => {
    await page.goto('http://localhost:3000/settings')
    await expect(page.locator('text=Settings')).toBeVisible()
    await expect(page.locator('button:has-text("Export")')).toBeVisible()
    await expect(page.locator('text=Disconnect Gmail')).toBeVisible()
  })
})
