# Add Authentication State Management and Route Protection

## 🧪 Test Failure Description

**Test Name:** Authentication state and redirect tests
**Test File:** `tests/auth-onboarding-e2e.spec.ts`
**Failure Type:** Missing Authentication Integration

## 🔍 Current Issue

Tests are failing because:
1. Authentication doesn't properly redirect after login/signup
2. Dashboard is accessible without authentication
3. No session persistence across page refreshes
4. Supabase auth integration is incomplete

**Error Messages:**
```
Error: Timed out 5000ms waiting for expect(page).toHaveURL(expected)
Expected pattern: /\/dashboard|\/app|\/home/
Received string: "http://localhost:3000/login"
```

## ✅ Expected Behavior

Authentication should:
1. Redirect authenticated users to dashboard
2. Protect dashboard route from unauthenticated access
3. Maintain auth state across page refreshes
4. Handle auth state changes properly

## 🛠️ Proposed Solution

### 1. Implement Authentication Context
```tsx
// src/contexts/AuthContext.tsx
export const AuthContext = createContext<{
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}>()

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Implementation details...
}
```

### 2. Create Protected Route Component
```tsx
// src/components/ProtectedRoute.tsx
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) return <LoadingSpinner />
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}
```

### 3. Update Routing with Protection
```tsx
// src/App.tsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/signup" element={<SignUp />} />
  <Route 
    path="/dashboard" 
    element={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    } 
  />
</Routes>
```

### 4. Implement Authentication Functions
```tsx
// src/lib/auth.ts
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  
  if (error) throw error
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) throw error
  return data
}
```

### 5. Add Redirect Logic After Authentication
```tsx
// In SignUp/Login components
const handleSubmit = async (e: FormEvent) => {
  try {
    await signUp(email, password)
    // Redirect to dashboard or email confirmation
    navigate('/email-confirmation')
  } catch (error) {
    setError(error.message)
  }
}
```

### 6. Implement Session Persistence
```tsx
// Check for existing session on app start
useEffect(() => {
  const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setUser(session?.user ?? null)
    setLoading(false)
  }
  
  getSession()
}, [])
```

## 📋 Acceptance Criteria

- [ ] Users redirect to dashboard after successful login
- [ ] Dashboard is protected from unauthenticated access
- [ ] Authentication state persists across page refreshes
- [ ] Auth state changes are handled properly
- [ ] Loading states show during auth state checks
- [ ] Logout functionality works correctly
- [ ] Email confirmation flow integrated
- [ ] Tests pass for authentication flow scenarios

## 🔗 Related Files

- New: `src/contexts/AuthContext.tsx`
- New: `src/components/ProtectedRoute.tsx`
- New: `src/lib/auth.ts`
- Update: `src/App.tsx`
- Update: `src/pages/SignUp.tsx`
- Update: `src/pages/Login.tsx`
- Update: `src/pages/Dashboard.tsx`
- Test Files: `tests/auth-onboarding-e2e.spec.ts`

## 📊 Priority

**HIGH** - Core authentication functionality, blocks user onboarding and security
