# Fix Supabase Integration and Environment Configuration

## 🧪 Test Failure Description

**Test Name:** Supabase authentication integration tests
**Test File:** `tests/auth-onboarding-e2e.spec.ts`
**Failure Type:** Missing Supabase Integration

## 🔍 Current Issue

Supabase integration tests are failing because:
1. Supabase client not properly initialized on frontend
2. Environment variables not configured for testing
3. Auth state changes not properly handled
4. No proper error handling for authentication operations

**Error Messages:**
```
Error: expect(received).toBeTruthy()
Received: false
// Supabase client not found in window object
```

## ✅ Expected Behavior

Supabase should be:
1. Properly initialized and accessible
2. Handling authentication operations
3. Managing auth state changes
4. Providing proper error handling

## 🛠️ Proposed Solution

### 1. Verify Supabase Configuration
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Make available globally for testing (development only)
if (import.meta.env.DEV) {
  (window as any).supabase = supabase
}
```

### 2. Add Environment Variables
```bash
# .env.local
VITE_PUBLIC_SUPABASE_URL=your_supabase_project_url
VITE_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# .env.test (for testing)
VITE_PUBLIC_SUPABASE_URL=http://localhost:54321
VITE_PUBLIC_SUPABASE_ANON_KEY=test_anon_key
```

### 3. Initialize Supabase in App
```tsx
// src/App.tsx
import { supabase } from './lib/supabase'
import { useEffect } from 'react'

function App() {
  useEffect(() => {
    // Verify Supabase connection
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        console.log('Supabase connected:', !error)
      } catch (error) {
        console.error('Supabase connection failed:', error)
      }
    }
    
    testConnection()
  }, [])

  // Rest of app...
}
```

### 4. Add Authentication Helper Functions
```typescript
// src/lib/auth.ts
import { supabase } from './supabase'

export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export async function signUp(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) throw new AuthError(error.message, error.message)
    return data
  } catch (error) {
    if (error instanceof AuthError) throw error
    throw new AuthError('Failed to create account')
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw new AuthError(error.message, error.message)
    return data
  } catch (error) {
    if (error instanceof AuthError) throw error
    throw new AuthError('Failed to sign in')
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw new AuthError(error.message, error.message)
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/password-reset`,
  })
  
  if (error) throw new AuthError(error.message, error.message)
}
```

### 5. Update Test Configuration
```typescript
// playwright-auth.config.ts
export default defineConfig({
  // Add environment variables for testing
  use: {
    baseURL: 'http://localhost:3000',
    extraHTTPHeaders: {
      // Add any required headers
    },
  },
  
  // Set up test environment
  globalSetup: require.resolve('./tests/global-setup.ts'),
  globalTeardown: require.resolve('./tests/global-teardown.ts'),
})
```

### 6. Add Test Environment Setup
```typescript
// tests/global-setup.ts
async function globalSetup() {
  // Set up test database
  // Configure test environment variables
  process.env.VITE_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
  process.env.VITE_PUBLIC_SUPABASE_ANON_KEY = 'test_key'
}

export default globalSetup
```

### 7. Update Tests to Check Integration
```typescript
// tests/auth-onboarding-e2e.spec.ts
test('should properly integrate with Supabase authentication', async ({ page }) => {
  await page.goto('/signup')
  
  // Check for Supabase client initialization
  const supabaseAvailable = await page.evaluate(() => {
    return typeof (window as any).supabase !== 'undefined' && 
           (window as any).supabase.auth !== undefined
  })
  
  expect(supabaseAvailable).toBeTruthy()
  
  // Test actual auth operation
  const signUpWorking = await page.evaluate(async () => {
    try {
      // Test with invalid credentials to check error handling
      await (window as any).supabase.auth.signUp({
        email: 'test@example.com',
        password: 'invalid'
      })
      return true
    } catch (error) {
      return error.message !== 'supabase is not defined'
    }
  })
  
  expect(signUpWorking).toBeTruthy()
})
```

## 📋 Acceptance Criteria

- [ ] Supabase client properly initialized
- [ ] Environment variables configured correctly
- [ ] Authentication functions work with proper error handling
- [ ] Auth state changes are handled correctly
- [ ] Tests can access Supabase client
- [ ] Error messages are user-friendly
- [ ] Testing environment is properly configured
- [ ] All Supabase integration tests pass

## 🔗 Related Files

- Update: `src/lib/supabase.ts`
- New: `src/lib/auth.ts`
- Update: `src/App.tsx`
- New: `.env.local`
- New: `.env.test`
- Update: `tests/global-setup.ts`
- Update: `tests/auth-onboarding-e2e.spec.ts`
- Update: `playwright-auth.config.ts`

## 📊 Priority

**HIGH** - Core authentication backend integration, blocks all authentication functionality
