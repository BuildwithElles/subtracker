// global-setup.ts
import { chromium, FullConfig } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

async function globalSetup(config: FullConfig) {
  // Load test environment variables
  dotenv.config({ path: '.env.test' })

  const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase test configuration. Please check your .env.test file.\n' +
      'Required variables: VITE_PUBLIC_SUPABASE_URL, VITE_PUBLIC_SUPABASE_ANON_KEY'
    )
  }

  // Test Supabase connection
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    const { error } = await supabase.auth.getSession()
    if (error && error.message.includes('Invalid API key')) {
      throw new Error('Invalid Supabase credentials for testing. Please check your .env.test file.')
    }
    console.log('✅ Supabase test connection established')
  } catch (error) {
    console.error('❌ Failed to connect to Supabase for testing:', error)
    throw error
  }

  // Create a test user for E2E tests (optional)
  const testUserEmail = 'test-user@example.com'
  const testUserPassword = 'test-password-123'

  try {
    // Try to sign up test user (will fail if already exists, which is fine)
    await supabase.auth.signUp({
      email: testUserEmail,
      password: testUserPassword,
    })
    console.log(`✅ Test user ${testUserEmail} ready for testing`)
  } catch (error) {
    // User likely already exists, which is fine
    console.log(`ℹ️ Test user ${testUserEmail} already exists`)
  }

  // Launch browser for state setup if needed
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  // Navigate to app to ensure it loads
  const baseURL = process.env.VITE_APP_URL || 'http://localhost:5173'
  try {
    await page.goto(baseURL)
    await page.waitForSelector('body', { timeout: 5000 })
    console.log('✅ App successfully loads at', baseURL)
  } catch (error) {
    console.warn('⚠️ Could not verify app is running at', baseURL)
    console.warn('Make sure to start the dev server before running tests')
  }

  await browser.close()

  console.log('🚀 Global test setup completed')
}

export default globalSetup
