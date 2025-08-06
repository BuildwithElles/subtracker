# 🚨 Fix OAuth Error 403: access_denied

## 🔍 Current Issue

Error shows: `redirect_uri=http://localhost:3002/auth/callback`
But `.env` is set to: `http://localhost:3000/auth/callback`

This indicates browser cache or Google Cloud Console configuration issues.

## ✅ Complete Fix Steps

### 1. Clear Browser Cache

- **Chrome**: Ctrl+Shift+Delete → Clear all browsing data
- **Or**: Open incognito/private window for testing
- **Or**: Hard refresh: Ctrl+F5

### 2. Update Google Cloud Console

Go to: https://console.cloud.google.com/apis/credentials

**Edit your OAuth 2.0 Client ID:**

- Client ID: `290109963067-jv5okqm9a43bikhu2cpe38vmif9tl4gq`
- **Authorized redirect URIs** - Add ALL of these:
  ```
  http://localhost:3000/auth/callback
  http://localhost:3002/auth/callback
  http://localhost:5173/auth/callback
  ```

### 3. Enable Gmail API

Go to: https://console.cloud.google.com/apis/library

- Search for "Gmail API"
- Click "Gmail API"
- Click "ENABLE"

### 4. Verify App Status

In Google Cloud Console:

- Go to **OAuth consent screen**
- Make sure app is in "Testing" mode
- Add your email to "Test users"

### 5. Restart Everything

```bash
# Kill any running servers
# Then restart
npm run dev
```

### 6. Test in Incognito

- Open incognito/private window
- Go to: http://localhost:3000/onboarding
- Try Gmail connection

## 🎯 Quick Debug Test

Try this URL directly in browser:

```
https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_GOOGLE_CLIENT_ID&redirect_uri=http://localhost:3000/auth/callback&response_type=code&scope=https://www.googleapis.com/auth/gmail.readonly&access_type=offline&prompt=consent
```

If this works → Problem is in your app
If this fails → Problem is in Google Cloud Console

## 🔧 Alternative: Use Port 3002

If you prefer to keep using port 3002:

1. Update vite.config.ts to port 3002
2. Update .env to port 3002
3. Make sure Google Cloud Console has port 3002 configured
