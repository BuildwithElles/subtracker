# Implement Form Validation and Error Handling

## 🧪 Test Failure Description

**Test Name:** Form validation and error message tests
**Test File:** `tests/auth-basic-e2e.spec.ts`, `tests/auth-onboarding-e2e.spec.ts`
**Failure Type:** Missing Validation Feedback

## 🔍 Current Issue

Form validation tests are failing because:
1. No visible error messages are shown for invalid inputs
2. Form submission doesn't provide user feedback
3. Loading states are not properly implemented
4. No validation for email format, password strength, etc.

**Error Messages:**
```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
Locator: locator('.error, [role="alert"], .text-red-500, .text-destructive').filter({ hasText: /email.*required|invalid.*email|email.*error/i })
Expected: visible
Received: <element(s) not found>
```

## ✅ Expected Behavior

Forms should provide clear, immediate feedback to users:
1. Real-time validation as user types
2. Clear error messages for invalid inputs
3. Loading states during form submission
4. Success/failure feedback after submission

## 🛠️ Proposed Solution

### 1. Add Form Validation Logic
```tsx
// src/components/SignUpForm.tsx
const [errors, setErrors] = useState<Record<string, string>>({})
const [isLoading, setIsLoading] = useState(false)

const validateEmail = (email: string) => {
  if (!email) return "Email is required"
  if (!/\S+@\S+\.\S+/.test(email)) return "Invalid email format"
  return ""
}

const validatePassword = (password: string) => {
  if (!password) return "Password is required"
  if (password.length < 8) return "Password must be at least 8 characters"
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return "Password must contain uppercase, lowercase, and number"
  }
  return ""
}
```

### 2. Add Error Display Components
```tsx
// Error message component
{errors.email && (
  <div 
    className="text-red-500 text-sm mt-1 error" 
    role="alert"
    data-testid="email-error"
  >
    {errors.email}
  </div>
)}
```

### 3. Implement Loading States
```tsx
// Submit button with loading state
<button 
  type="submit" 
  disabled={isLoading}
  className={`... ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
>
  {isLoading ? 'Creating Account...' : 'Create Account'}
</button>
```

### 4. Add Real-time Validation
```tsx
// Input with validation
<input
  type="email"
  value={email}
  onChange={(e) => {
    setEmail(e.target.value)
    const error = validateEmail(e.target.value)
    setErrors(prev => ({ ...prev, email: error }))
  }}
  className={`... ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
/>
```

### 5. Implement Submission Feedback
```tsx
// Toast notifications or inline messages
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault()
  setIsLoading(true)
  
  try {
    await signUp(email, password)
    // Show success message
    toast.success("Account created! Check your email for verification.")
  } catch (error) {
    // Show error message
    setErrors({ submit: error.message })
  } finally {
    setIsLoading(false)
  }
}
```

## 📋 Acceptance Criteria

- [ ] Email validation shows real-time feedback
- [ ] Password strength validation implemented
- [ ] Password confirmation matching validation
- [ ] Error messages have proper ARIA roles
- [ ] Loading states disable form during submission
- [ ] Success/error feedback after form submission
- [ ] All validation errors are visible to screen readers
- [ ] Tests pass for form validation scenarios

## 🔗 Related Files

- Update: `src/pages/SignUp.tsx`
- Update: `src/pages/Login.tsx` (if exists)
- Update: `src/components/*` (form components)
- New: `src/utils/validation.ts`
- New: `src/components/ErrorMessage.tsx`
- Test Files: `tests/auth-basic-e2e.spec.ts`
- Test Files: `tests/auth-onboarding-e2e.spec.ts`

## 📊 Priority

**MEDIUM** - Important for user experience and test coverage, but doesn't block core functionality
