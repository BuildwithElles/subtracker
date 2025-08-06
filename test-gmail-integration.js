/**
 * Test script for real Gmail integration
 * Run this after connecting Gmail through OAuth
 */

import { googleAuthService } from './src/lib/googleAuth.js'

console.log('🚀 Testing Gmail Integration Setup...')

// Test 1: Check environment variables
console.log('\n1. Environment Variables:')
console.log('VITE_GOOGLE_CLIENT_ID:', process.env.VITE_GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing')
console.log(
  'VITE_GOOGLE_CLIENT_SECRET:',
  process.env.VITE_GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing'
)
console.log(
  'VITE_GOOGLE_REDIRECT_URI:',
  process.env.VITE_GOOGLE_REDIRECT_URI ? '✅ Set' : '❌ Missing'
)

// Test 2: Generate OAuth URL
console.log('\n2. OAuth URL Generation:')
try {
  const authUrl = googleAuthService.getAuthUrl()
  console.log('✅ OAuth URL generated successfully')
  console.log('URL:', authUrl.substring(0, 100) + '...')
} catch (error) {
  console.log('❌ Failed to generate OAuth URL:', error.message)
}

// Test 3: Instructions
console.log('\n3. Next Steps:')
console.log('📝 To test the full integration:')
console.log('   1. Start your dev server: npm run dev')
console.log('   2. Go to /onboarding and click "Connect Gmail"')
console.log('   3. Complete Google OAuth flow')
console.log('   4. Check console for real Gmail scanning results')

console.log('\n🎯 Expected Flow:')
console.log('   Onboarding → Google OAuth → AuthCallback → Gmail Scan → Results')

console.log('\n📊 Service Detection Capabilities:')
const services = [
  'Netflix',
  'Spotify',
  'Adobe Creative Cloud',
  'Notion',
  'Figma',
  'GitHub',
  'OpenAI',
  'Slack',
  'Zoom',
  'Dropbox',
  'Microsoft 365',
  'Disney+',
  'Hulu',
  'Prime Video',
  'Apple Music',
  'YouTube Premium',
  'Canva',
  'Grammarly',
  'Trello',
  'Linear',
]
console.log('✅ Can detect:', services.join(', '))
