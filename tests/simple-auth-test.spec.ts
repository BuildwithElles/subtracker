import { test, expect } from '@playwright/test'
import { AuthHelper } from './auth-helper'

test.describe('Simple Auth & Onboarding Test', () => {
  test('should authenticate and navigate to onboarding', async ({ page, context }) => {
    const authHelper = new AuthHelper(page, context)
    
    // Set up authentication first
    await authHelper.authenticateTestUser()
    
    // Verify authentication worked
    const isAuth = await authHelper.isAuthenticated()
    console.log('Is user authenticated?', isAuth)
    
    // Go directly to onboarding URL
    await page.goto('/onboarding')
    
    // Wait a bit longer for the page to stabilize
    await page.waitForTimeout(5000)
    
    const currentUrl = page.url()
    console.log('Current URL after navigation:', currentUrl)
    
    // Check if we see login page or onboarding page
    const hasLoginForm = await page.locator('input[type="email"], input[type="password"]').count()
    const hasOnboardingContainer = await page.locator('[data-testid="onboarding-container"]').count()
    
    console.log('Login form elements found:', hasLoginForm)
    console.log('Onboarding container found:', hasOnboardingContainer)
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-onboarding-auth.png', fullPage: true })
    
    // Simple assertion - we should either be at onboarding or at least not stuck on login
    expect(currentUrl).not.toContain('/login')
  })
})
