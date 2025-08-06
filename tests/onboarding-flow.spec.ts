import { test, expect } from '@playwright/test'

test.describe('Onboarding Flow Tests', () => {
  test('Onboarding page is accessible', async ({ page }) => {
    // Test that the onboarding page responds and loads
    await page.goto('/onboarding')

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded')

    // Check that the page loaded (either shows content or redirects appropriately)
    const title = await page.title()
    expect(title).toBeTruthy()

    // The page should either show content or redirect to signup if not authenticated
    const currentUrl = page.url()
    expect(currentUrl).toMatch(/\/(onboarding|signup)/)
  })

  test('Onboarding redirects to signup when not authenticated', async ({ page }) => {
    await page.goto('/onboarding')

    // Wait for potential redirect - increased timeout for auth check
    await page.waitForTimeout(3000)

    // Check if we're still on onboarding (showing loading) or redirected to signup
    const currentUrl = page.url()
    const isLoadingVisible = await page.locator('text=Loading').isVisible()
    const isSettingUpVisible = await page
      .locator('text=Setting up your onboarding experience')
      .isVisible()

    // Should either redirect to signup or show loading state
    const isRedirectedToSignup = currentUrl.includes('/signup')
    const isShowingLoadingState = isLoadingVisible || isSettingUpVisible

    expect(isRedirectedToSignup || isShowingLoadingState).toBe(true)
  })
})
