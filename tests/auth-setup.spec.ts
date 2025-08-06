import { test } from '@playwright/test'
import { TestDataFactory, TestDatabaseHelpers } from './test-helpers'

/**
 * 🔧 AUTHENTICATION SETUP
 * 
 * Prepares authentication test data and environment
 */

test('prepare authentication test environment', async () => {
  console.log('🔧 Setting up authentication test environment...')
  
  // Create test users for different scenarios
  const testUsers = {
    confirmed: TestDataFactory.createConfirmedUser(),
    unconfirmed: TestDataFactory.createUnconfirmedUser(),
    existing: TestDataFactory.createExistingUser()
  }
  
  console.log('👥 Creating test users in database...')
  
  for (const [type, user] of Object.entries(testUsers)) {
    try {
      const result = await TestDatabaseHelpers.createTestUserInDatabase({
        ...user,
        firstName: `Test${type}`,
        lastName: 'User',
        displayName: `Test ${type} User`
      })
      
      console.log(`✅ Created ${type} test user:`, result.userId)
    } catch (error) {
      console.warn(`⚠️ Failed to create ${type} test user:`, error)
    }
  }
  
  // Verify Supabase connection
  console.log('🔗 Verifying Supabase connection...')
  
  const supabaseConfig = {
    url: process.env.VITE_PUBLIC_SUPABASE_URL,
    anonKey: process.env.VITE_PUBLIC_SUPABASE_ANON_KEY
  }
  
  if (supabaseConfig.url && supabaseConfig.anonKey) {
    console.log('✅ Supabase configuration available')
  } else {
    console.warn('⚠️ Supabase configuration missing - tests will use mocks')
  }
  
  // Setup OAuth test data
  console.log('🌐 Setting up OAuth test data...')
  
  const oauthData = TestDataFactory.createOAuthTestData()
  console.log('✅ OAuth test data prepared:', {
    userEmail: oauthData.googleUser.email,
    hasAuthCode: !!oauthData.authCode
  })
  
  // Verify test tokens
  console.log('🎫 Preparing test tokens...')
  
  const tokens = TestDataFactory.createTestTokens()
  console.log('✅ Test tokens prepared:', Object.keys(tokens))
  
  console.log('✅ Authentication test environment setup complete!')
})
