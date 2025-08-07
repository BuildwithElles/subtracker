/**
 * Enhanced Authentication Helper for E2E Tests
 * Provides bulletproof authentication by intercepting ALL Supabase calls
 */

import { Page, BrowserContext } from '@playwright/test'

export class EnhancedAuthHelper {
  constructor(private page: Page, private context: BrowserContext) {}

  async authenticateTestUser() {
    console.log('🔐 Starting enhanced mock authentication...')
    
    const mockEmail = `testuser-${Date.now()}@testdomain.example`
    const mockUserId = `test-user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    
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

    // Intercept ALL Supabase API calls with specific responses
    await this.context.route('**/auth/v1/token**', async route => {
      console.log('🔄 Intercepted auth token request')
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSession)
      })
    })

    await this.context.route('**/auth/v1/user**', async route => {
      console.log('🔄 Intercepted auth user request')
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUser)
      })
    })

    await this.context.route('**/auth/v1/logout**', async route => {
      console.log('🔄 Intercepted logout request')
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({})
      })
    })

    // Intercept ANY other auth related calls
    await this.context.route('**/auth/v1/**', async route => {
      const url = route.request().url()
      console.log('🔄 Intercepted generic auth request:', url)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: mockSession, error: null })
      })
    })

    // Intercept database calls
    await this.context.route('**/rest/v1/**', async route => {
      console.log('🔄 Intercepted database request')
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      })
    })

    // Set up the client-side environment BEFORE anything loads
    await this.page.addInitScript((session) => {
      console.log('🔧 Setting up complete mock environment...')
      
      // Set localStorage first
      const authKey = 'sb-vdqckxohzsgfwqagdtpd-auth-token'
      localStorage.setItem(authKey, JSON.stringify(session))
      
      // Completely replace the Supabase client creation
      // This runs before any modules load
      const originalCreateClient = (window as any).createClient
      ;(window as any).createSupabaseClient = () => {
        console.log('🎯 Creating mocked Supabase client')
        return {
          auth: {
            getSession: async () => {
              console.log('📞 Mock getSession returning session')
              return {
                data: { session },
                error: null
              }
            },
            
            getUser: async () => {
              console.log('📞 Mock getUser returning user')
              return {
                data: { user: session.user },
                error: null
              }
            },
            
            onAuthStateChange: (callback: any) => {
              console.log('📞 Mock onAuthStateChange - triggering SIGNED_IN immediately')
              // Trigger immediately and after a small delay for safety
              callback('SIGNED_IN', session)
              setTimeout(() => {
                console.log('📞 Mock onAuthStateChange - triggering SIGNED_IN again')
                callback('SIGNED_IN', session)
              }, 100)
              
              return {
                data: {
                  subscription: {
                    unsubscribe: () => console.log('📞 Mock subscription unsubscribed')
                  }
                }
              }
            },
            
            refreshSession: async () => {
              console.log('📞 Mock refreshSession')
              return {
                data: { session },
                error: null
              }
            },
            
            signOut: async () => {
              console.log('📞 Mock signOut')
              return { error: null }
            }
          },
          
          from: () => ({
            select: () => Promise.resolve({ data: [], error: null }),
            insert: () => Promise.resolve({ data: [], error: null }),
            update: () => Promise.resolve({ data: [], error: null }),
            delete: () => Promise.resolve({ data: [], error: null }),
            upsert: () => Promise.resolve({ data: [], error: null })
          })
        }
      }
      
      // Replace any existing supabase instance immediately
      ;(window as any).supabase = (window as any).createSupabaseClient()
      
      console.log('✅ Complete mock environment ready')
    }, mockSession)

    // Navigate and wait for initialization
    await this.page.goto('/')
    
    // Give extra time for all initialization to complete
    await this.page.waitForTimeout(4000)
    
    console.log('✅ Enhanced mock authentication completed')
  }
  
  async isAuthenticated(): Promise<boolean> {
    return await this.page.evaluate(async () => {
      const token = localStorage.getItem('sb-vdqckxohzsgfwqagdtpd-auth-token')
      return !!token
    })
  }
}
