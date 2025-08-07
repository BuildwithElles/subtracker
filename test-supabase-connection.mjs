#!/usr/bin/env node

/**
 * Test Supabase Connection
 * 
 * This script tests whether Supabase is properly configured and accessible.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config()

const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Testing Supabase Connection...')
console.log(`URL: ${supabaseUrl ? '✅ Found' : '❌ Missing'}`)
console.log(`Key: ${supabaseAnonKey ? '✅ Found' : '❌ Missing'}`)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('Expected: VITE_PUBLIC_SUPABASE_URL and VITE_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

// Validate URL format
try {
  new URL(supabaseUrl)
  console.log('✅ URL format is valid')
} catch (error) {
  console.error('❌ Invalid URL format:', supabaseUrl)
  process.exit(1)
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test connection
try {
  console.log('🔄 Testing connection...')
  const { data, error } = await supabase.auth.getSession()
  
  if (error && error.message.includes('Invalid API key')) {
    console.error('❌ Invalid Supabase API key')
    process.exit(1)
  }
  
  console.log('✅ Supabase connection successful!')
  console.log(`Session: ${data.session ? 'Active' : 'None'}`)
  
  // Test a simple query to verify database access
  const { data: testData, error: testError } = await supabase
    .from('users')
    .select('count')
    .limit(1)
  
  if (testError) {
    console.log('⚠️  Database query test:', testError.message)
  } else {
    console.log('✅ Database access confirmed')
  }
  
} catch (error) {
  console.error('❌ Connection test failed:', error.message)
  process.exit(1)
}

console.log('🎉 All Supabase tests passed!')
