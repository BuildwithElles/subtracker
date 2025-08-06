# Implement Missing Authentication Routes and Pages

## 🧪 Test Failure Description

**Test Name:** Password reset and email confirmation tests
**Test File:** `tests/auth-onboarding-e2e.spec.ts`
**Failure Type:** Missing Routes/Pages

## 🔍 Current Issue

Several authentication routes are missing or not implemented, causing tests to fail when trying to navigate to:
- `/password-reset` - Returns 404 or redirects
- `/email-confirmation` - Not properly handling confirmation flow
- `/auth/callback` - OAuth callback handling incomplete

**Error Messages:**
```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
Locator: locator('h1, h2').filter({ hasText: /reset.*password|forgot.*password/i })
Expected: visible
Received: <element(s) not found>
```

## ✅ Expected Behavior

Authentication flow should include complete pages for:
1. Password reset request and confirmation
2. Email verification and confirmation
3. OAuth callback handling
4. Proper error states for each flow

## 🛠️ Proposed Solution

### 1. Create Password Reset Pages
```tsx
// src/pages/PasswordReset.tsx
export default function PasswordReset() {
  const [step, setStep] = useState<'request' | 'confirm'>('request')
  // Implementation for password reset flow
}
```

### 2. Create Email Confirmation Page
```tsx
// src/pages/EmailConfirmation.tsx
export default function EmailConfirmation() {
  // Handle email confirmation tokens
  // Show confirmation status
}
```

### 3. Create OAuth Callback Handler
```tsx
// src/pages/AuthCallback.tsx
export default function AuthCallback() {
  // Handle OAuth success/error states
  // Redirect to appropriate page
}
```

### 4. Update Routing Configuration
```tsx
// Add routes to your router
<Route path="/password-reset" element={<PasswordReset />} />
<Route path="/email-confirmation" element={<EmailConfirmation />} />
<Route path="/auth/callback" element={<AuthCallback />} />
```

### 5. Implement Supabase Auth Integration
- Password reset email sending
- Email confirmation handling
- OAuth provider callbacks
- Error state management

## 📋 Acceptance Criteria

- [ ] `/password-reset` route exists and renders properly
- [ ] `/email-confirmation` route handles tokens correctly
- [ ] `/auth/callback` route processes OAuth responses
- [ ] All routes have proper error handling
- [ ] Routes integrate with Supabase Auth
- [ ] Tests pass for all authentication flows
- [ ] User feedback messages are clear and helpful

## 🔗 Related Files

- New Files: `src/pages/PasswordReset.tsx`
- New Files: `src/pages/EmailConfirmation.tsx`
- New Files: `src/pages/AuthCallback.tsx`
- Update: `src/App.tsx` (routing)
- Update: `src/lib/supabase.ts` (auth functions)
- Test Files: `tests/auth-onboarding-e2e.spec.ts`

## 📊 Priority

**HIGH** - Core authentication functionality missing, blocking user registration and login flows
