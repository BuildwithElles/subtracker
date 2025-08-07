import { test, expect } from '@playwright/test'
import { EnhancedAuthHelper } from './enhanced-auth-helper'

test.describe('Debug Auth Context', () => {
  test('should debug auth context state', async ({ page, context }) => {
    const authHelper = new EnhancedAuthHelper(page, context)
    
    // Set up more comprehensive console logging
    page.on('console', msg => {
      console.log(`🌐 [${msg.type()}] ${msg.text()}`)
    })
    
    // Set up authentication
    await authHelper.authenticateTestUser()
    
    // Navigate to onboarding and wait
    await page.goto('/onboarding')
    await page.waitForTimeout(5000)
    
    // Check the AuthContext state
    const authState = await page.evaluate(() => {
      // Check if we can access the auth context from the window
      return {
        localStorage: localStorage.getItem('sb-vdqckxohzsgfwqagdtpd-auth-token'),
        windowSupabase: !!(window as any).supabase,
        url: window.location.href
      }
    })
    
    console.log('🔍 Auth state debug:', authState)
    
    // Wait a bit more and check again
    await page.waitForTimeout(3000)
    
    const finalUrl = page.url()
    console.log('🎯 Final URL:', finalUrl)
    
    // Just verify we can reach this point - the key is to see the console logs
    expect(finalUrl).toContain('localhost:5173')
  })
})
