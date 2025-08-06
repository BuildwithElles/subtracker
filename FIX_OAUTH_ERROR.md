# 🔧 Fix Google OAuth Redirect URI Error

## 🚨 Current Error

```
redirect_uri_mismatch: http://localhost:3000/auth/callback
```

## ✅ Steps to Fix

### 1. Go to Google Cloud Console

- URL: https://console.cloud.google.com/
- Navigate to **APIs & Services** → **Credentials**

### 2. Find Your OAuth Client

- Look for Client ID: `290109963067-jv5okqm9a43bikhu2cpe38vmif9tl4gq`
- Click the **pencil icon** to edit

### 3. Add Redirect URI

In the **Authorized redirect URIs** section, add:

```
http://localhost:3000/auth/callback
```

### 4. Save Changes

- Click **Save**
- Changes take effect immediately

### 5. Test the Fix

1. Restart your dev server:
   ```bash
   npm run dev
   ```
2. Go to: `http://localhost:3000/onboarding`
3. Click "Connect Gmail"
4. Should now work without redirect URI error

## 🎯 What's Configured Now

- **Dev Server**: `http://localhost:3000`
- **OAuth Redirect**: `http://localhost:3000/auth/callback`
- **Client ID**: `290109963067-jv5okqm9a43bikhu2cpe38vmif9tl4gq`

## 📝 Alternative: Add Both URLs

You can add multiple redirect URIs for flexibility:

```
http://localhost:3000/auth/callback
http://localhost:3002/auth/callback
http://localhost:5173/auth/callback  (Vite default)
```

This way you can use any port during development.
