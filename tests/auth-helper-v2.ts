/**
 * Authentication Helper for E2E Tests - Version 2
 * Uses Playwright route interception to mock Supabase API calls
 */

import { Page, BrowserContext } from '@playwright/test'

export class AuthHelper {
  constructor(private page: Page, private context: BrowserContext) {}

  /**
   * Mock all Supabase authentication and API calls
   */
  async authenticateTestUser() {
    console.log('🔐 Starting mock authentication for testing...')
    
    const mockEmail = 'testuser@testdomain.example'
    const mockUserId = `test-user-${Date.now()}`
    
    const mockUser = {
      id: mockUserId,
      aud: 'authenticated',
      email: mockEmail,
      email_confirmed_at: new Date().toISOString(),
      phone: '',
      confirmation_sent_at: new Date().toISOString(),
      confirmed_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      app_metadata: {
        provider: 'email',
        providers: ['email']
      },
      user_metadata: {
        onboarding_completed: false,
        onboarding_step: 1,
        gmail_connected: false
      },
      identities: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const mockSession = {
      access_token: `mock-token-${Date.now()}`,
      refresh_token: `mock-refresh-${Date.now()}`,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      expires_in: 3600,
      token_type: 'bearer',
      user: mockUser
    }
    
    // Intercept all Supabase API calls
    await this.context.route('**/auth/v1/token**', async route => {
      console.log('🔄 Intercepting Supabase auth token request')
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(mockSession)
      })
    })
    
    await this.context.route('**/auth/v1/user**', async route => {
      console.log('🔄 Intercepting Supabase user request')
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(mockUser)
      })
    })
    
    await this.context.route('**/rest/v1/**', async route => {
      console.log('🔄 Intercepting Supabase database request')
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify([])
      })
    })
    
    // Set up localStorage with the mock session before navigating
    await this.page.addInitScript((session) => {
      console.log('🔧 Setting up localStorage with mock session')
      
      // Store session in localStorage with the correct key format
      const authKey = 'sb-vdqckxohzsgfwqagdtpd-auth-token'
      localStorage.setItem(authKey, JSON.stringify({
        user: session.user,
        session: session
      }))
      
      console.log('✅ Mock localStorage setup completed')
    }, mockSession)
    
    // Override Supabase client methods directly
    await this.page.addInitScript((session) => {
      console.log('🔧 Overriding Supabase client methods')
      
      // Wait for Supabase to be available and override its methods
      const waitForSupabase = () => {
        if ((window as any).supabase?.auth) {
          const supabase = (window as any).supabase
          
          console.log('🎯 Found Supabase client, applying mocks')
          
          // Mock auth methods
          supabase.auth.getSession = async () => {
            console.log('📞 Mock getSession called')
            return {
              data: { session },
              error: null
            }
          }
          
          supabase.auth.getUser = async () => {
            console.log('📞 Mock getUser called')
            return {
              data: { user: session.user },
              error: null
            }
          }
          
          const originalOnAuthStateChange = supabase.auth.onAuthStateChange
          supabase.auth.onAuthStateChange = (callback: any) => {
            console.log('📞 Mock onAuthStateChange called')
            
            // Immediately trigger SIGNED_IN event
            setTimeout(() => {
              console.log('🚀 Triggering SIGNED_IN event with mock session')
              callback('SIGNED_IN', session)
            }, 100)
            
            return {
              data: {
                subscription: {
                  unsubscribe: () => console.log('📞 Mock subscription unsubscribed')
                }
              }
            }
          }
          
          supabase.auth.signOut = async () => {
            console.log('📞 Mock signOut called')
            return { error: null }
          }
          
          console.log('✅ Supabase client methods mocked successfully')
          return true
        }
        return false
      }
      
      // Try immediately
      if (!waitForSupabase()) {
        // Keep checking until Supabase is available
        const checkInterval = setInterval(() => {
          if (waitForSupabase()) {
            clearInterval(checkInterval)
          }
        }, 100)
        
        // Fallback timeout
        setTimeout(() => {
          clearInterval(checkInterval)
          console.log('⚠️ Timeout waiting for Supabase client')
        }, 10000)
      }
    }, mockSession)
    
    // Navigate to the app
    await this.page.goto('/')
    
    // Wait for the app to initialize and auth context to process our mock
    await this.page.waitForTimeout(3000)
    
    console.log('✅ Mock authentication completed')
  }
  
  /**
   * Sign out the current user
   */
  async signOut() {
    await this.page.evaluate(async () => {
      // Clear all auth-related storage
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
      const token = localStorage.getItem('sb-vdqckxohzsgfwqagdtpd-auth-token')
      if (token) {
        try {
          const parsed = JSON.parse(token)
          return !!(parsed?.user?.email)
        } catch {
          return false
        }
      }
      
      return false
    })
  }
}
