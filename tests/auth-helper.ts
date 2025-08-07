/**
 * Authentication Helper for E2E Tests
 * Uses test mode flags to bypass authentication in components
 */

import { Page } from '@playwright/test'

export class AuthHelper {
  constructor(private page: Page) {}

  // Use a more realistic test email format to avoid validation issues
  private readonly TEST_EMAILS = [
    'testuser1@testdomain.example',
    'testuser2@testdomain.example', 
    'testuser3@testdomain.example',
    'testuser4@testdomain.example',
    'testuser5@testdomain.example'
  ]

  /**
   * Get a random test email to avoid rate limiting
   */
  private getRandomTestEmail(): string {
    const randomIndex = Math.floor(Math.random() * this.TEST_EMAILS.length)
    return this.TEST_EMAILS[randomIndex]
  }

  /**
   * Authenticate a test user for E2E testing using test mode flags
   * This bypasses complex Supabase mocking by using test mode in components
   */
  async authenticateTestUser() {
    console.log('🔐 Starting mock authentication for testing...')
    
    // Set up test mode flags and basic auth data
    await this.page.addInitScript(() => {
      console.log('� Setting up test mode authentication...')
      
      // Set test mode flags
      localStorage.setItem('TEST_MODE', 'true')
      localStorage.setItem('TEST_AUTHENTICATED', 'true')
      
      // Set a basic auth token for any components that might check it
      const testSession = {
        user: {
          id: 'test-user',
          email: 'test@example.com',
          email_confirmed_at: new Date().toISOString(),
          user_metadata: {
            onboarding_completed: false,
            onboarding_step: 1,
            gmail_connected: false
          }
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
      
      console.log('✅ Test mode authentication setup completed')
    })
    
    console.log('✅ Mock authentication completed')
  }

  /**
   * Sign out the current user
   */
  async signOut() {
    await this.page.evaluate(async () => {
      // Clear all auth-related storage
      localStorage.removeItem('sb-supabase-auth-token')
      localStorage.removeItem('sb-auth-token')
      localStorage.clear()
      sessionStorage.clear()
      
      // If Supabase is available, also sign out properly
      if ((window as any).supabase?.auth?.signOut) {
        try {
          await (window as any).supabase.auth.signOut()
        } catch (error) {
          console.log('Supabase sign out error (expected in tests):', error)
        }
      }
    })
    
    await this.page.waitForTimeout(500)
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    return await this.page.evaluate(async () => {
      // Check localStorage for auth token
      const token = localStorage.getItem('sb-auth-token') || localStorage.getItem('sb-supabase-auth-token')
      if (token) {
        try {
          const parsed = JSON.parse(token)
          return !!(parsed?.user?.email)
        } catch {
          return false
        }
      }
      
      // Also check Supabase if available
      if ((window as any).supabase?.auth?.getSession) {
        try {
          const { data: { session } } = await (window as any).supabase.auth.getSession()
          return !!session
        } catch {
          return false
        }
      }
      
      return false
    })
  }

  /**
   * Reset onboarding state for testing
   */
  async resetOnboardingState() {
    await this.page.evaluate(async () => {
      // Update the mock user data to reset onboarding
      const authTokens = ['sb-auth-token', 'sb-supabase-auth-token']
      
      for (const tokenKey of authTokens) {
        const token = localStorage.getItem(tokenKey)
        if (token) {
          try {
            const parsed = JSON.parse(token)
            if (parsed.user) {
              parsed.user.user_metadata = {
                ...parsed.user.user_metadata,
                onboarding_completed: false,
                onboarding_step: 1,
                gmail_connected: false
              }
              localStorage.setItem(tokenKey, JSON.stringify(parsed))
            }
          } catch (error) {
            console.log('Error resetting onboarding state:', error)
          }
        }
      }
    })
    
    await this.page.waitForTimeout(500)
  }
}
