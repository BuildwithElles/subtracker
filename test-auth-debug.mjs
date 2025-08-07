import { chromium } from 'playwright'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function debugAuth() {
  console.log('🔍 Starting authentication debug session...')
  
  const browser = await chromium.launch({ headless: false, slowMo: 1000 })
  const context = await browser.newContext()
  
  // Setup mocks exactly like the AuthHelper
  await context.addInitScript(() => {
    console.log('🔐 Setting up mock authentication...')
    
    // Mock window.supabase
    window.supabase = {
      auth: {
        getSession: () => Promise.resolve({
          data: {
            session: {
              user: {
                id: 'test-user-id',
                email: 'test-user@example.com',
                created_at: new Date().toISOString(),
                aud: 'authenticated',
                role: 'authenticated'
              },
              access_token: 'mock-access-token',
              refresh_token: 'mock-refresh-token',
              expires_at: Date.now() + 3600000
            }
          },
          error: null
        }),
        
        onAuthStateChange: (callback) => {
          console.log('🔄 onAuthStateChange called')
          // Immediately call with authenticated session
          setTimeout(() => {
            console.log('📢 Triggering SIGNED_IN event')
            callback('SIGNED_IN', {
              user: {
                id: 'test-user-id',
                email: 'test-user@example.com',
                created_at: new Date().toISOString(),
                aud: 'authenticated',
                role: 'authenticated'
              },
              access_token: 'mock-access-token',
              refresh_token: 'mock-refresh-token',
              expires_at: Date.now() + 3600000
            })
          }, 100)
          
          return { data: { subscription: { unsubscribe: () => {} } } }
        },
        
        signOut: () => Promise.resolve({ error: null })
      }
    }
    
    // Mock localStorage with session
    const mockSession = {
      user: {
        id: 'test-user-id',
        email: 'test-user@example.com',
        created_at: new Date().toISOString(),
        aud: 'authenticated',
        role: 'authenticated'
      },
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_at: Date.now() + 3600000
    }
    
    localStorage.setItem('sb-vdqckxohzsgfwqagdtpd-auth-token', JSON.stringify(mockSession))
    
    console.log('✅ Mock authentication setup completed')
  })
  
  const page = await context.newPage()
  
  // Listen for console messages
  page.on('console', msg => {
    console.log('🌐 Browser Console:', msg.text())
  })
  
  console.log('📄 Loading homepage...')
  await page.goto('http://localhost:5173/')
  
  // Wait a bit for React to initialize
  await page.waitForTimeout(2000)
  
  console.log('🧭 Attempting to navigate to /onboarding...')
  await page.goto('http://localhost:5173/onboarding')
  
  // Wait and see what loads
  await page.waitForTimeout(3000)
  
  const url = page.url()
  console.log('📍 Final URL:', url)
  
  // Check what's actually on the page
  const pageTitle = await page.textContent('h1, h2, .title').catch(() => 'No title found')
  console.log('📝 Page title/heading:', pageTitle)
  
  // Check for specific elements
  const hasOnboardingContainer = await page.locator('[data-testid="onboarding-container"]').count()
  const hasLoginForm = await page.locator('form, input[type="email"], input[type="password"]').count()
  
  console.log('🎯 Onboarding container found:', hasOnboardingContainer > 0)
  console.log('🔑 Login form elements found:', hasLoginForm > 0)
  
  // Check localStorage in browser
  const authState = await page.evaluate(() => {
    const token = localStorage.getItem('sb-vdqckxohzsgfwqagdtpd-auth-token')
    return token ? JSON.parse(token) : null
  })
  
  console.log('💾 Auth state in localStorage:', authState ? 'Present' : 'Missing')
  
  // Keep browser open for inspection
  console.log('🔍 Browser will stay open for inspection. Press Ctrl+C to close.')
  await page.waitForTimeout(60000)
  
  await browser.close()
}

debugAuth().catch(console.error)
