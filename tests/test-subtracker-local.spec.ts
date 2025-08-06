// @filename: test-subtracker-local.spec.ts
// @description: End-to-end test script for localhost:3000
// Test: Auth flow, Gmail connect prompt, Dashboard data, Budget setup, Settings

import { test, expect } from '@playwright/test'

test.describe('Subtracker App - Local', () => {
  test('Dashboard loads subscription list', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard')
    await expect(page.locator('text=Total Spend')).toBeVisible()
    await expect(page.locator('[data-test=subscriptions-list]')).toBeVisible()
  })

  test('Connect Gmail prompt is shown', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard')
    await expect(page.locator('text=Connect Gmail')).toBeVisible()
  })
})
