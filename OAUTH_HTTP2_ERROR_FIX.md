# 🚨 OAuth HTTP2 Protocol Error - Quick Fixes

## 🔍 Error Analysis

`net::ERR_HTTP2_PROTOCOL_ERROR auth:1` - This is a Chrome networking issue during OAuth.

## ✅ Immediate Solutions (Try in Order)

### 1. **Use Different Browser**

- **Firefox**: Often works when Chrome fails
- **Edge**: Alternative Chromium browser
- **Safari** (if on Mac)

### 2. **Chrome Incognito Mode**

- Press `Ctrl+Shift+N`
- Try OAuth flow in incognito window
- This disables extensions that might interfere

### 3. **Chrome with Flags**

Launch Chrome with network flags:

```bash
# Windows
chrome.exe --disable-http2 --disable-features=VizNetwork

# Or try
chrome.exe --disable-web-security --user-data-dir="c:/temp/chrome"
```

### 4. **Reset Chrome Network**

1. Go to: `chrome://net-internals/#sockets`
2. Click "Flush socket pools"
3. Go to: `chrome://net-internals/#dns`
4. Click "Clear host cache"

### 5. **Alternative: Manual OAuth Test**

Copy this URL and paste directly in browser:

```
https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_GOOGLE_CLIENT_ID&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback&response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.readonly&access_type=offline&prompt=consent
```

## 🎯 Temporary Workaround

While fixing OAuth, you can test with mock data:

1. **Temporarily disable OAuth** in onboarding
2. **Use mock Gmail tokens** for testing
3. **Test Gmail parser** with sample data
4. **Fix OAuth separately**

## 📋 Common Causes & Solutions

| Cause              | Solution                      |
| ------------------ | ----------------------------- |
| Browser extensions | Incognito mode                |
| Chrome HTTP/2 bug  | Use Firefox or disable HTTP/2 |
| Network proxy      | Disable proxy temporarily     |
| Antivirus software | Disable temporarily           |
| Chrome cache       | Clear all browsing data       |

## 🔧 Quick Test Command

Run this in browser console to test OAuth URL generation:

```javascript
console.log(
  'OAuth URL:',
  'https://accounts.google.com/o/oauth2/v2/auth?' +
    'client_id=YOUR_GOOGLE_CLIENT_ID&' +
    'redirect_uri=http://localhost:3000/auth/callback&' +
    'response_type=code&' +
    'scope=https://www.googleapis.com/auth/gmail.readonly&' +
    'access_type=offline&prompt=consent'
)
```

If this URL works manually → Problem is in your app
If this URL fails → Problem is in Google Cloud Console setup
