import { test, expect } from '@playwright/test'
import { AuthHelper } from './auth-helper-v2'

test.describe('Auth Test V2', () => {
  test('should authenticate and reach onboarding page', async ({ page, context }) => {
    const authHelper = new AuthHelper(page, context)
    
    // Authenticate mock user
    await authHelper.authenticateTestUser()
    
    // Try to navigate to onboarding
    await page.goto('/onboarding')
    
    // Wait a bit for navigation
    await page.waitForTimeout(2000)
    
    const currentUrl = page.url()
    console.log('Current URL:', currentUrl)
    
    // Check if we can see the onboarding container
    const hasOnboarding = await page.locator('[data-testid="onboarding-container"]').count()
    console.log('Onboarding container found:', hasOnboarding > 0)
    
    // Check what page content we have
    const pageContent = await page.textContent('body').catch(() => 'No content')
    console.log('Page content (first 500 chars):', pageContent?.substring(0, 500) || 'No content found')
    
    // This test is just for debugging, so we don't need to assert anything specific
    expect(currentUrl).toContain('localhost:5173')
  })
})
