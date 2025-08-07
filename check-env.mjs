import { config } from 'dotenv'

// Load environment variables from .env file
config()

console.log('Environment Variables Check:')
console.log('============================')

const envVars = [
  'VITE_PUBLIC_SUPABASE_URL',
  'VITE_PUBLIC_SUPABASE_ANON_KEY',
  'VITE_SUPABASE_URL', // Legacy
  'VITE_SUPABASE_ANON_KEY' // Legacy
]

envVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`)
  } else {
    console.log(`❌ ${varName}: Not found`)
  }
})

console.log('\nChecking .env file content...')

import { readFileSync } from 'fs'
import { join } from 'path'

try {
  const envContent = readFileSync(join(process.cwd(), '.env'), 'utf8')
  console.log('📄 .env file contents:')
  console.log(envContent.split('\n').filter(line => line.includes('SUPABASE')).join('\n'))
} catch (error) {
  console.log('❌ Could not read .env file:', error.message)
}
