import { test, expect } from '@playwright/test'
import { EnhancedAuthHelper } from './enhanced-auth-helper'

test.describe('Enhanced Auth Test', () => {
  test('should authenticate and access onboarding consistently', async ({ page, context }) => {
    const authHelper = new EnhancedAuthHelper(page, context)
    
    // Set up authentication
    await authHelper.authenticateTestUser()
    
    // Verify authentication
    const isAuth = await authHelper.isAuthenticated()
    console.log('Is user authenticated?', isAuth)
    
    // Navigate to onboarding
    await page.goto('/onboarding')
    
    // Wait for page to stabilize
    await page.waitForTimeout(3000)
    
    const currentUrl = page.url()
    console.log('Final URL:', currentUrl)
    
    // Check what we have on the page
    const hasOnboardingContainer = await page.locator('[data-testid="onboarding-container"]').count()
    const hasLoginForm = await page.locator('input[type="email"], input[type="password"]').count()
    
    console.log('Onboarding container found:', hasOnboardingContainer > 0)
    console.log('Login form found:', hasLoginForm > 0)
    
    // Verify we're actually on the onboarding page
    expect(currentUrl).toContain('/onboarding')
    expect(hasOnboardingContainer).toBeGreaterThan(0)
    expect(hasLoginForm).toBe(0)
  })
})
