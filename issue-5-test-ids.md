# Add Data Test IDs and Improve Test Selectors

## 🧪 Test Failure Description

**Test Name:** Branding and UI element tests
**Test File:** `tests/auth-basic-e2e.spec.ts`
**Failure Type:** Missing Test Identifiers

## 🔍 Current Issue

Tests are failing because UI elements don't have proper test identifiers:
1. No "SubTracker" branding text visible on pages
2. Missing data-testid attributes for reliable testing
3. Generic selectors are fragile and cause strict mode violations

**Error Messages:**
```
Error: expect(received).toBeGreaterThan(expected)
Expected: > 0
Received: 0
// No branding elements found
```

## ✅ Expected Behavior

Application should have:
1. Consistent branding visible on all pages
2. Reliable test identifiers (data-testid attributes)
3. Stable selectors that don't break with UI changes

## 🛠️ Proposed Solution

### 1. Add SubTracker Branding Elements
```tsx
// Add to SignUp, Login, and other auth pages
<div className="text-center">
  <h1 className="text-2xl font-bold" data-testid="app-title">
    SubTracker
  </h1>
  <p className="text-gray-600">Manage your subscriptions</p>
</div>

// Or add logo
<img 
  src="/logo.png" 
  alt="SubTracker Logo" 
  data-testid="app-logo"
  className="h-8 w-auto"
/>
```

### 2. Add Comprehensive Data Test IDs
```tsx
// Authentication forms
<form data-testid="signup-form">
  <input 
    type="email"
    data-testid="email-input"
    placeholder="Email"
  />
  <input 
    type="password"
    data-testid="password-input"
    placeholder="Password"
  />
  <input 
    type="password"
    data-testid="confirm-password-input"
    placeholder="Confirm Password"
  />
  <button 
    type="submit"
    data-testid="submit-button"
  >
    Create Account
  </button>
</form>

// OAuth buttons
<button data-testid="google-oauth-button">
  Sign up with Google
</button>

// Error messages
<div 
  data-testid="error-message"
  role="alert"
  className="text-red-500"
>
  {errorMessage}
</div>

// Loading states
<div data-testid="loading-spinner">
  Loading...
</div>
```

### 3. Update Navigation Elements
```tsx
// Navigation links
<a 
  href="/login" 
  data-testid="login-link"
>
  Sign In
</a>

<a 
  href="/signup" 
  data-testid="signup-link"
>
  Sign Up
</a>

// Dashboard elements
<div data-testid="dashboard-content">
  <h1 data-testid="dashboard-title">Dashboard</h1>
  <button data-testid="user-menu">User Menu</button>
</div>
```

### 4. Update Test Files to Use Data Test IDs
```typescript
// Updated test selectors
test('should have consistent branding', async ({ page }) => {
  await page.goto('/signup')
  
  // Check for branding elements
  await expect(page.locator('[data-testid="app-title"]')).toBeVisible()
  // OR
  await expect(page.locator('[data-testid="app-logo"]')).toBeVisible()
})

test('should handle form input correctly', async ({ page }) => {
  await page.goto('/signup')
  
  // Use specific test IDs
  await page.fill('[data-testid="email-input"]', 'test@example.com')
  await page.fill('[data-testid="password-input"]', 'TestPassword123!')
  await page.fill('[data-testid="confirm-password-input"]', 'TestPassword123!')
  
  await expect(page.locator('[data-testid="email-input"]')).toHaveValue('test@example.com')
})
```

### 5. Create Test ID Guidelines
```typescript
// src/utils/testIds.ts
export const TEST_IDS = {
  // Forms
  SIGNUP_FORM: 'signup-form',
  LOGIN_FORM: 'login-form',
  EMAIL_INPUT: 'email-input',
  PASSWORD_INPUT: 'password-input',
  CONFIRM_PASSWORD_INPUT: 'confirm-password-input',
  SUBMIT_BUTTON: 'submit-button',
  
  // Branding
  APP_TITLE: 'app-title',
  APP_LOGO: 'app-logo',
  
  // OAuth
  GOOGLE_OAUTH_BUTTON: 'google-oauth-button',
  
  // States
  ERROR_MESSAGE: 'error-message',
  LOADING_SPINNER: 'loading-spinner',
  SUCCESS_MESSAGE: 'success-message',
  
  // Navigation
  LOGIN_LINK: 'login-link',
  SIGNUP_LINK: 'signup-link',
  DASHBOARD_LINK: 'dashboard-link',
  
  // Dashboard
  DASHBOARD_CONTENT: 'dashboard-content',
  USER_MENU: 'user-menu',
} as const
```

## 📋 Acceptance Criteria

- [ ] SubTracker branding visible on all auth pages
- [ ] All form elements have data-testid attributes
- [ ] Navigation elements have test identifiers
- [ ] Error and loading states have test IDs
- [ ] OAuth buttons have proper test identifiers
- [ ] Tests updated to use data-testid selectors
- [ ] Test ID constants file created
- [ ] Branding test passes consistently

## 🔗 Related Files

- Update: `src/pages/SignUp.tsx`
- Update: `src/pages/Login.tsx`
- Update: `src/pages/Dashboard.tsx`
- Update: `src/components/*` (all components)
- New: `src/utils/testIds.ts`
- Update: `tests/auth-basic-e2e.spec.ts`
- Update: `tests/auth-onboarding-e2e.spec.ts`

## 📊 Priority

**MEDIUM** - Improves test reliability and user experience, but doesn't block core functionality
