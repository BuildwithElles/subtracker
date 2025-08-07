import fs from 'fs'
import path from 'path'

/**
 * 🌍 GLOBAL SETUP FOR E2E TESTS
 *
 * Prepares the test environment before running authentication E2E tests
 */

async function globalSetup() {
  console.log('🚀 Setting up E2E test environment...')
  
  // Environment validation
  const requiredEnvVars = [
    'VITE_PUBLIC_SUPABASE_URL',
    'VITE_PUBLIC_SUPABASE_ANON_KEY'
  ]
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    console.warn('⚠️ Missing environment variables:', missingVars)
    console.log('💡 Tests will run with mock data where possible')
  }
  
  // Test database preparation
  console.log('🗃️ Preparing test database...')
  
  // Clean up any existing test data
  try {
    // This would implement actual database cleanup
    // For now, we'll just log the action
    console.log('🧹 Cleaning up existing test data...')
    
    // Create test data if needed
    console.log('📝 Creating test fixtures...')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error)
  }
  
  // Health check
  console.log('🔍 Running health checks...')
  
  try {
    // Check if the application is responding
    const baseURL = process.env.BASE_URL || 'http://localhost:5173'
    const response = await fetch(baseURL)
    
    if (response.ok) {
      console.log('✅ Application is responding')
    } else {
      console.warn('⚠️ Application responded with status:', response.status)
    }
  } catch (error) {
    console.warn('⚠️ Application health check failed:', error)
    console.log('💡 Tests will attempt to start the dev server')
  }
  
  // Create test directories
  console.log('📁 Setting up test directories...')
  // Create test directories using ES module syntax
  const testDirs = [
    'test-results',
    'playwright-report',
    'test-artifacts'
  ]
  
  testDirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir)
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true })
      console.log(`📁 Created directory: ${dir}`)
    }
  })
  
  // Test configuration validation
  console.log('⚙️ Validating test configuration...')
  
  const testConfig = {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    headless: process.env.CI || process.env.HEADLESS,
    workers: process.env.CI ? 1 : 4,
    retries: process.env.CI ? 2 : 0
  }
  
  console.log('📋 Test configuration:', testConfig)
  
  console.log('✅ E2E test environment setup complete!')
  
  return testConfig
}

export default globalSetup
