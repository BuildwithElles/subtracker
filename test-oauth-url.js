// Test OAuth URL generation
// Run this in browser console to debug

console.log('🔍 Testing OAuth Configuration...')

// Environment variables
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI
const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET

console.log('📝 Environment Variables:')
console.log('Client ID:', clientId)
console.log('Redirect URI:', redirectUri)
console.log('Client Secret:', clientSecret ? '✅ Set' : '❌ Missing')

// Generate OAuth URL
const scope = 'https://www.googleapis.com/auth/gmail.readonly'
const authUrl =
  `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${clientId}&` +
  `redirect_uri=${encodeURIComponent(redirectUri)}&` +
  `response_type=code&` +
  `scope=${encodeURIComponent(scope)}&` +
  `access_type=offline&` +
  `prompt=consent`

console.log('🔗 Generated OAuth URL:')
console.log(authUrl)

// Check for issues
if (!clientId) {
  console.error('❌ Missing VITE_GOOGLE_CLIENT_ID')
}
if (!redirectUri) {
  console.error('❌ Missing VITE_GOOGLE_REDIRECT_URI')
}
if (redirectUri && !redirectUri.includes('localhost:3000')) {
  console.warn('⚠️ Redirect URI is not using port 3000:', redirectUri)
}

console.log('🎯 To test manually, copy the OAuth URL above and paste it in a new tab')
