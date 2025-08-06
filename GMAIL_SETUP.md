# Gmail Agent Setup Guide for SubTracker

## Current State

You have a sophisticated **Gmail subscription parser** that can:

- Detect trial emails from 8+ major services (Netflix, Spotify, Adobe, Notion, Figma, GitHub, OpenAI)
- Extract trial end dates, pricing, and subscription details
- Calculate confidence scores for accuracy
- **Currently using mock data** (Notion £6.50/month, Figma $12.00/month)

## To Implement Real Gmail Agent

### Option 1: Google OAuth + Gmail API (Recommended)

#### Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add your domain to authorized origins

#### Step 2: Add Environment Variables

Add to your `.env` file:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret
VITE_GOOGLE_REDIRECT_URI=http://localhost:3002/auth/callback
```

#### Step 3: Install Dependencies

```bash
npm install googleapis @google-cloud/local-auth
```

#### Step 4: Update Onboarding Flow

Replace the mock Gmail connection with real OAuth:

```typescript
const handleGmailConnect = async () => {
  setLoading(true)

  try {
    // Step 1: Redirect to Google OAuth
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI
    const scope = 'https://www.googleapis.com/auth/gmail.readonly'

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `response_type=code&` +
      `scope=${scope}&` +
      `access_type=offline`

    window.location.href = authUrl
  } catch (error) {
    console.error('Gmail OAuth error:', error)
    setError('Failed to connect Gmail. Please try again.')
    setLoading(false)
  }
}
```

### Option 2: Simple Fetch-Based Integration (No Dependencies)

Use the `fetchGmailIntegration.ts` I created above:

```typescript
// In Onboarding.tsx
import { fetchGmailIntegration } from '../lib/fetchGmailIntegration'

const handleGmailConnect = async () => {
  setLoading(true)

  try {
    // Get OAuth token (you'll need to implement Google OAuth flow)
    const accessToken = await getGoogleAccessToken() // Your OAuth implementation

    // Store token in user profile
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: currentUser.id,
      email: currentUser.email,
      gmail_access_token: accessToken,
      gmail_sync_enabled: true,
      updated_at: new Date().toISOString(),
    })

    if (profileError) {
      setError('Failed to store Gmail access token')
      return
    }

    setIsScanning(true)

    // Use real Gmail integration instead of mock
    const parsedTrials = await fetchGmailIntegration.fetchAndParseSubscriptions(accessToken)
    setFoundSubscriptions(parsedTrials)

    console.log('Real Gmail subscriptions found:', parsedTrials)
    setCurrentStep(2)
  } catch (error) {
    console.error('Gmail connection error:', error)
    setError('Failed to connect Gmail. Please try again.')
  } finally {
    setLoading(false)
    setIsScanning(false)
  }
}
```

### Option 3: Enhanced Service Detection

Your current parser supports these services:

- **Netflix** (entertainment)
- **Spotify** (music)
- **Adobe Creative Cloud** (productivity)
- **Notion** (productivity)
- **Figma** (design)
- **GitHub** (development)
- **OpenAI** (AI tools)

#### Add More Services

```typescript
// Add to SERVICE_PATTERNS in gmailParser.ts
'Slack': {
  domains: ['slack.com'],
  patterns: [/slack/i, /workspace/i],
  category: 'Communication'
},
'Zoom': {
  domains: ['zoom.us'],
  patterns: [/zoom/i, /meeting/i],
  category: 'Communication'
},
'Dropbox': {
  domains: ['dropbox.com'],
  patterns: [/dropbox/i],
  category: 'Storage'
},
'Microsoft 365': {
  domains: ['microsoft.com', 'office.com'],
  patterns: [/office 365/i, /microsoft 365/i],
  category: 'Productivity'
}
```

## OAuth Flow Implementation

### 1. Create OAuth Helper

```typescript
// src/lib/googleAuth.ts
export const getGoogleAuthUrl = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI
  const scope = 'https://www.googleapis.com/auth/gmail.readonly'

  return (
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${redirectUri}&` +
    `response_type=code&` +
    `scope=${scope}&` +
    `access_type=offline&` +
    `prompt=consent`
  )
}

export const exchangeCodeForToken = async (code: string) => {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
      redirect_uri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  })

  return response.json()
}
```

### 2. Add OAuth Callback Route

```typescript
// src/pages/AuthCallback.tsx
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { exchangeCodeForToken } from '../lib/googleAuth'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      if (!code) {
        navigate('/onboarding?error=oauth_failed')
        return
      }

      try {
        const tokenData = await exchangeCodeForToken(code)

        // Store token in user profile
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email,
              gmail_access_token: tokenData.access_token,
              gmail_sync_enabled: true,
              updated_at: new Date().toISOString()
            })
        }

        navigate('/onboarding?step=2&gmail_connected=true')
      } catch (error) {
        console.error('OAuth callback error:', error)
        navigate('/onboarding?error=token_exchange_failed')
      }
    }

    handleCallback()
  }, [searchParams, navigate])

  return <div>Connecting to Gmail...</div>
}
```

## Quick Start (Easiest Path)

1. **Keep mock data for now** - Your current implementation works great for testing
2. **Add more service patterns** to detect more subscriptions
3. **Set up Google OAuth** when ready for production
4. **Use fetchGmailIntegration** for real Gmail API calls

Would you like me to implement any of these approaches for you?
