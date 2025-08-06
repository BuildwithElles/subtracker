# Fix E2E Test Strict Mode Violations with Multiple Password Fields

## 🧪 Test Failure Description

**Test Name:** Multiple tests failing with password field selection
**Test File:** `tests/auth-basic-e2e.spec.ts`
**Failure Type:** Strict Mode Violation

## 🔍 Current Issue

Tests are failing because the signup form has two password fields (password and confirm password), causing Playwright's strict mode to throw errors when using generic selectors like `input[type="password"]`.

**Error Message:**
```
Error: strict mode violation: locator('input[type="password"]') resolved to 2 elements:
1) <input required="" id="password" name="password" type="password".../>
2) <input value="" required="" type="password" id="confirmPassword" name="confirmPassword".../>
```

## ✅ Expected Behavior

Tests should be able to interact with specific password fields without strict mode violations.

## 🛠️ Proposed Solution

1. **Update test selectors to be more specific:**
   - Use `#password` for main password field
   - Use `#confirmPassword` for password confirmation field
   - Use `.first()` method when generic selection is needed

2. **Add data-testid attributes to form elements:**
   ```tsx
   <input 
     data-testid="password-input"
     id="password" 
     name="password" 
     type="password" 
   />
   <input 
     data-testid="confirm-password-input"
     id="confirmPassword" 
     name="confirmPassword" 
     type="password" 
   />
   ```

3. **Update test code:**
   ```typescript
   // Instead of: page.locator('input[type="password"]')
   // Use: page.locator('#password')
   // Or: page.locator('[data-testid="password-input"]')
   ```

## 📋 Acceptance Criteria

- [ ] All password field interactions use specific selectors
- [ ] Tests pass without strict mode violations
- [ ] Both password fields can be tested independently
- [ ] Test documentation updated with selector patterns

## 🔗 Related Files

- Test File: `tests/auth-basic-e2e.spec.ts`
- Test File: `tests/auth-onboarding-e2e.spec.ts`
- Component Files: `src/pages/SignUp.tsx`
- Component Files: `src/components/*` (any auth forms)

## 📊 Priority

**HIGH** - Blocking multiple critical authentication tests from passing
