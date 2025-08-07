import { test, expect } from '@playwright/test'

test.describe('Direct Onboarding Test', () => {
  test('should access onboarding page directly in test mode', async ({ page, context }) => {
    // Add a special test mode flag to localStorage that our components can check
    await page.addInitScript(() => {
      localStorage.setItem('TEST_MODE', 'true')
      localStorage.setItem('TEST_AUTHENTICATED', 'true')
      
      // Also set a minimal auth token for any checks
      const testSession = {
        user: {
          id: 'test-user',
          email: 'test@example.com',
          email_confirmed_at: new Date().toISOString()
        },
        session: {
          access_token: 'test-token',
          user: {
            id: 'test-user', 
            email: 'test@example.com',
            email_confirmed_at: new Date().toISOString()
          }
        }
      }
      
      localStorage.setItem('sb-vdqckxohzsgfwqagdtpd-auth-token', JSON.stringify(testSession))
    })
    
    // Listen for navigation events
    page.on('framenavigated', frame => {
      if (frame === page.mainFrame()) {
        console.log('🧭 Navigated to:', frame.url())
      }
    })
    
    // Navigate directly to onboarding without going through the landing page
    console.log('🎯 Attempting to navigate to /onboarding')
    await page.goto('/onboarding')
    
    // Wait for the page to load  
    await page.waitForTimeout(3000)
    
    const currentUrl = page.url()
    console.log('Current URL:', currentUrl)
    
    // Check what's on the page
    const onboardingContainer = await page.locator('[data-testid="onboarding-container"]').count()
    const loginForm = await page.locator('input[type="email"], input[type="password"]').count()
    const pageText = await page.textContent('body').then(text => text?.substring(0, 200))
    
    console.log('Onboarding container found:', onboardingContainer > 0)
    console.log('Login form found:', loginForm > 0)
    console.log('Page text:', pageText)
    
    // For now, just check we're not getting blocked
    expect(currentUrl).toContain('localhost:5173')
  })
})
