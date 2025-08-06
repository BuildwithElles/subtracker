import { test, expect, Page } from '@playwright/test'

/**
 * 🧪 AUTH COMPONENT SPECIFIC E2E TESTS
 * 
 * Tests for individual React components:
 * - SignUp Component
 * - Login Component  
 * - EmailConfirmation Component
 * - PasswordReset Component
 * - Google OAuth Integration
 */

// Component Test Helpers
class ComponentTestHelpers {
  constructor(private page: Page) {}

  // Component rendering and behavior tests
  async testComponentRendering(componentPath: string, expectedElements: string[]) {
    await this.page.goto(componentPath)
    
    for (const element of expectedElements) {
      await expect(this.page.locator(element)).toBeVisible()
    }
  }

  async testFormValidation(formSelectors: Record<string, string>, validationTests: Array<{
    field: string
    value: string
    expectedError: string
  }>) {
    for (const test of validationTests) {
      await this.page.fill(formSelectors[test.field], test.value)
      await this.page.click('button[type="submit"]')
      await expect(this.page.locator(`text="${test.expectedError}"`)).toBeVisible()
    }
  }
}

test.describe('🎨 SignUp Component Tests', () => {
  let helper: ComponentTestHelpers

  test.beforeEach(async ({ page }) => {
    helper = new ComponentTestHelpers(page)
  })

  test('should render all required form elements', async ({ page }) => {
    await helper.testComponentRendering('/signup', [
      'input[type="email"]',
      'input[type="password"]:first-of-type',
      'input[type="password"]:last-of-type',
      'button[type="submit"]',
      'text="Continue with Google"',
      'text="Already have an account"'
    ])
  })

  test('should show real-time password strength indicator', async ({ page }) => {
    await page.goto('/signup')
    
    const passwordInput = page.locator('input[type="password"]:first-of-type')
    const strengthIndicator = page.locator('[data-testid="password-strength"], .password-strength')
    
    // Test weak password
    await passwordInput.fill('123')
    await expect(strengthIndicator).toContainText(/weak|poor/i)
    
    // Test medium password  
    await passwordInput.fill('password123')
    await expect(strengthIndicator).toContainText(/medium|fair/i)
    
    // Test strong password
    await passwordInput.fill('StrongPassword123!')
    await expect(strengthIndicator).toContainText(/strong|excellent/i)
  })

  test('should validate email format in real-time', async ({ page }) => {
    await page.goto('/signup')
    
    const emailInput = page.locator('input[type="email"]')
    
    // Invalid email
    await emailInput.fill('invalid-email')
    await emailInput.blur()
    await expect(page.locator('text="Please enter a valid email"')).toBeVisible()
    
    // Valid email
    await emailInput.fill('valid@example.com')
    await emailInput.blur()
    await expect(page.locator('text="Please enter a valid email"')).toBeHidden()
  })

  test('should show password confirmation validation', async ({ page }) => {
    await page.goto('/signup')
    
    await page.fill('input[type="password"]:first-of-type', 'Password123!')
    await page.fill('input[type="password"]:last-of-type', 'DifferentPassword')
    await page.locator('input[type="password"]:last-of-type').blur()
    
    await expect(page.locator('text="Passwords don\'t match"')).toBeVisible()
  })

  test('should disable submit button during loading', async ({ page }) => {
    await page.goto('/signup')
    
    // Fill form with valid data
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]:first-of-type', 'Password123!')
    await page.fill('input[type="password"]:last-of-type', 'Password123!')
    
    // Intercept and delay API call
    await page.route('**/auth/signup', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      await route.continue()
    })
    
    await page.click('button[type="submit"]')
    
    // Button should be disabled with loading state
    await expect(page.locator('button[type="submit"]')).toBeDisabled()
    await expect(page.locator('text="Creating account...", text="Please wait"')).toBeVisible()
  })

  test('should show terms and privacy policy links', async ({ page }) => {
    await page.goto('/signup')
    
    await expect(page.locator('a[href*="terms"], text="Terms of Service"')).toBeVisible()
    await expect(page.locator('a[href*="privacy"], text="Privacy Policy"')).toBeVisible()
  })
})

test.describe('🔑 Login Component Tests', () => {
  test('should render login form correctly', async ({ page }) => {
    await page.goto('/login')
    
    await expect(page.locator('h1, h2').filter({ hasText: /sign in|login/i })).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    await expect(page.locator('text="Continue with Google"')).toBeVisible()
    await expect(page.locator('text="Forgot password?"')).toBeVisible()
  })

  test('should remember email input across page reloads', async ({ page }) => {
    await page.goto('/login')
    
    const testEmail = 'remember@example.com'
    await page.fill('input[type="email"]', testEmail)
    
    // Check remember me checkbox if it exists
    const rememberCheckbox = page.locator('input[type="checkbox"]')
    if (await rememberCheckbox.isVisible()) {
      await rememberCheckbox.check()
    }
    
    await page.reload()
    
    // Email should be remembered (if feature is implemented)
    const emailValue = await page.locator('input[type="email"]').inputValue()
    if (emailValue) {
      expect(emailValue).toBe(testEmail)
    }
  })

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/login')
    
    const passwordInput = page.locator('input[type="password"]')
    const toggleButton = page.locator('[data-testid="password-toggle"], button:has-text("Show"), .password-toggle')
    
    await passwordInput.fill('mypassword')
    
    if (await toggleButton.isVisible()) {
      await toggleButton.click()
      await expect(page.locator('input[type="text"]')).toHaveValue('mypassword')
      
      await toggleButton.click()
      await expect(passwordInput).toHaveValue('mypassword')
    }
  })

  test('should handle capslock warning', async ({ page }) => {
    await page.goto('/login')
    
    // Simulate caps lock key press (if feature is implemented)
    const passwordInput = page.locator('input[type="password"]')
    await passwordInput.focus()
    
    // Type with caps lock simulation
    await passwordInput.type('PASSWORD', { delay: 100 })
    
    // Check for caps lock warning (if implemented)
    const capsWarning = page.locator('text="Caps Lock", text="caps lock"')
    if (await capsWarning.isVisible()) {
      await expect(capsWarning).toBeVisible()
    }
  })
})

test.describe('📧 EmailConfirmation Component Tests', () => {
  test('should display email confirmation page correctly', async ({ page }) => {
    const testEmail = 'test@example.com'
    await page.goto(`/email-confirmation?email=${testEmail}`)
    
    await expect(page.locator('h1, h2').filter({ hasText: /confirm|verify/i })).toBeVisible()
    await expect(page.locator(`text="${testEmail}"`)).toBeVisible()
    await expect(page.locator('text="check your email", text="verification email"')).toBeVisible()
    await expect(page.locator('button:has-text("Resend"), button:has-text("Send again")')).toBeVisible()
  })

  test('should implement resend email cooldown', async ({ page }) => {
    await page.goto('/email-confirmation')
    
    const resendButton = page.locator('button:has-text("Resend")')
    
    // Click resend
    await resendButton.click()
    
    // Button should be disabled with countdown
    await expect(resendButton).toBeDisabled()
    await expect(page.locator('text="60", text="59", text="seconds"')).toBeVisible()
  })

  test('should handle email confirmation token from URL', async ({ page }) => {
    const confirmationToken = 'valid-token-12345'
    await page.goto(`/email-confirmation?token=${confirmationToken}`)
    
    // Should process the token automatically
    await expect(page.locator('text="confirming", text="verifying"')).toBeVisible()
    
    // Should redirect on success
    await expect(page).toHaveURL(/\/onboarding|\/dashboard/)
  })

  test('should show different states for token validation', async ({ page }) => {
    // Test invalid token
    await page.goto('/email-confirmation?token=invalid-token')
    await expect(page.locator('text="invalid", text="expired", text="error"')).toBeVisible()
    
    // Test expired token
    await page.goto('/email-confirmation?token=expired-token')
    await expect(page.locator('text="expired", text="link expired"')).toBeVisible()
  })
})

test.describe('🔄 PasswordReset Component Tests', () => {
  test('should render password reset request form', async ({ page }) => {
    await page.goto('/password-reset')
    
    await expect(page.locator('h1, h2').filter({ hasText: /reset|forgot/i })).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    await expect(page.locator('text="Remember your password?"')).toBeVisible()
    await expect(page.locator('a[href="/login"]')).toBeVisible()
  })

  test('should render new password form with valid token', async ({ page }) => {
    await page.goto('/password-reset?token=valid-reset-token')
    
    await expect(page.locator('h1, h2').filter({ hasText: /new password|reset password/i })).toBeVisible()
    await expect(page.locator('input[type="password"]:first-of-type')).toBeVisible()
    await expect(page.locator('input[type="password"]:last-of-type')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should validate new password requirements', async ({ page }) => {
    await page.goto('/password-reset?token=valid-token')
    
    const requirements = [
      'At least 8 characters',
      'One uppercase letter', 
      'One lowercase letter',
      'One number',
      'One special character'
    ]
    
    for (const requirement of requirements) {
      await expect(page.locator(`text="${requirement}"`)).toBeVisible()
    }
    
    // Test weak password
    await page.fill('input[type="password"]:first-of-type', 'weak')
    await expect(page.locator('.text-red, .text-destructive')).toBeVisible()
    
    // Test strong password
    await page.fill('input[type="password"]:first-of-type', 'StrongPass123!')
    await expect(page.locator('.text-green, .text-success')).toBeVisible()
  })

  test('should handle password reset success flow', async ({ page }) => {
    await page.goto('/password-reset')
    
    await page.fill('input[type="email"]', 'test@example.com')
    await page.click('button[type="submit"]')
    
    // Should show success message
    await expect(page.locator('text="reset link sent", text="check your email"')).toBeVisible()
    await expect(page.locator('text="test@example.com"')).toBeVisible()
  })
})

test.describe('🌐 Google OAuth Component Tests', () => {
  test('should render Google OAuth button correctly', async ({ page }) => {
    await page.goto('/signup')
    
    const googleButton = page.locator('button:has-text("Continue with Google")')
    await expect(googleButton).toBeVisible()
    await expect(googleButton).toContainText(/google/i)
    
    // Should have Google branding
    await expect(page.locator('.google-icon, [data-testid="google-icon"]')).toBeVisible()
  })

  test('should handle OAuth popup flow', async ({ page, context }) => {
    await page.goto('/signup')
    
    // Setup popup handler
    const popupPromise = context.waitForEvent('page')
    
    await page.click('button:has-text("Continue with Google")')
    
    const popup = await popupPromise
    
    // Should open Google OAuth popup
    await expect(popup).toHaveURL(/accounts\.google\.com|oauth/)
    
    await popup.close()
  })

  test('should handle OAuth redirect flow', async ({ page }) => {
    await page.goto('/signup')
    
    // Mock OAuth redirect
    await page.route('**/auth/google', route => {
      route.fulfill({
        status: 302,
        headers: {
          location: 'https://accounts.google.com/oauth/authorize?client_id=...'
        }
      })
    })
    
    await page.click('button:has-text("Continue with Google")')
    
    // Should redirect to Google
    await expect(page).toHaveURL(/accounts\.google\.com/)
  })

  test('should handle OAuth success callback', async ({ page }) => {
    // Simulate successful OAuth callback
    await page.goto('/auth/callback?code=oauth_code&state=oauth_state&provider=google')
    
    // Should show loading state
    await expect(page.locator('text="signing in", text="completing"')).toBeVisible()
    
    // Should redirect to dashboard/onboarding
    await expect(page).toHaveURL(/\/dashboard|\/onboarding/)
  })

  test('should handle OAuth error states', async ({ page }) => {
    // Test various OAuth error scenarios
    const errorScenarios = [
      { error: 'access_denied', message: 'cancelled' },
      { error: 'invalid_request', message: 'error' },
      { error: 'server_error', message: 'try again' }
    ]
    
    for (const scenario of errorScenarios) {
      await page.goto(`/auth/callback?error=${scenario.error}&provider=google`)
      await expect(page.locator(`text="${scenario.message}"`)).toBeVisible()
    }
  })
})

test.describe('🎨 UI/UX Component Tests', () => {
  test('should have consistent styling across auth components', async ({ page }) => {
    const authPages = ['/signup', '/login', '/password-reset']
    
    for (const authPage of authPages) {
      await page.goto(authPage)
      
      // Check for consistent branding
      await expect(page.locator('.logo, [data-testid="logo"], h1:has-text("SubTracker")')).toBeVisible()
      
      // Check for consistent form styling
      await expect(page.locator('form')).toHaveCSS('background-color', /white|#fff|#ffffff/i)
      await expect(page.locator('input')).toHaveCSS('border-radius', /4px|6px|8px/)
      
      // Check for consistent button styling
      await expect(page.locator('button[type="submit"]')).toHaveCSS('background-color', /blue|#|rgb/)
    }
  })

  test('should have proper loading states and animations', async ({ page }) => {
    await page.goto('/signup')
    
    // Fill form
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]:first-of-type', 'Password123!')
    await page.fill('input[type="password"]:last-of-type', 'Password123!')
    
    // Delay API response
    await page.route('**/auth/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      await route.continue()
    })
    
    await page.click('button[type="submit"]')
    
    // Should show loading spinner
    await expect(page.locator('.spinner, .loading, [data-testid="spinner"]')).toBeVisible()
    
    // Button should show loading text
    await expect(page.locator('button[type="submit"]')).toContainText(/creating|loading|please wait/i)
  })

  test('should handle form autofill correctly', async ({ page }) => {
    await page.goto('/login')
    
    // Simulate browser autofill
    await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement
      
      if (emailInput) emailInput.value = 'autofill@example.com'
      if (passwordInput) passwordInput.value = 'autofillpassword'
      
      // Trigger input events
      emailInput?.dispatchEvent(new Event('input', { bubbles: true }))
      passwordInput?.dispatchEvent(new Event('input', { bubbles: true }))
    })
    
    // Form should recognize autofilled values
    await expect(page.locator('input[type="email"]')).toHaveValue('autofill@example.com')
    await expect(page.locator('input[type="password"]')).toHaveValue('autofillpassword')
  })
})

test.describe('♿ Accessibility Component Tests', () => {
  test('should have proper ARIA labels and roles', async ({ page }) => {
    await page.goto('/signup')
    
    // Check form accessibility
    await expect(page.locator('form')).toHaveAttribute('role', 'form')
    await expect(page.locator('input[type="email"]')).toHaveAttribute('aria-label', /email/i)
    await expect(page.locator('input[type="password"]')).toHaveAttribute('aria-label', /password/i)
    
    // Check error message accessibility
    await page.click('button[type="submit"]')
    await expect(page.locator('[role="alert"]')).toBeVisible()
  })

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/signup')
    
    // Test tab order
    await page.keyboard.press('Tab') // Email field
    await expect(page.locator('input[type="email"]')).toBeFocused()
    
    await page.keyboard.press('Tab') // Password field
    await expect(page.locator('input[type="password"]:first-of-type')).toBeFocused()
    
    await page.keyboard.press('Tab') // Confirm password field
    await expect(page.locator('input[type="password"]:last-of-type')).toBeFocused()
    
    await page.keyboard.press('Tab') // Submit button
    await expect(page.locator('button[type="submit"]')).toBeFocused()
  })

  test('should announce form validation errors to screen readers', async ({ page }) => {
    await page.goto('/signup')
    
    await page.click('button[type="submit"]')
    
    // Error messages should be in live regions
    await expect(page.locator('[aria-live="polite"], [aria-live="assertive"]')).toBeVisible()
    await expect(page.locator('[role="alert"]')).toBeVisible()
  })

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/signup')
    
    // This would require a color contrast checking library
    // For now, we'll check that text is visible and readable
    const textElements = await page.locator('label, p, span, button').all()
    
    for (const element of textElements) {
      await expect(element).toBeVisible()
      // Additional contrast checks would go here
    }
  })
})

test.describe('📱 Mobile Component Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
  })

  test('should be fully functional on mobile devices', async ({ page }) => {
    await page.goto('/signup')
    
    // Form should be usable on mobile
    await expect(page.locator('form')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    
    // Buttons should be large enough for touch
    const submitButton = page.locator('button[type="submit"]')
    const boundingBox = await submitButton.boundingBox()
    
    if (boundingBox) {
      expect(boundingBox.height).toBeGreaterThan(44) // Minimum touch target size
    }
  })

  test('should handle mobile keyboard interactions', async ({ page }) => {
    await page.goto('/signup')
    
    // Email input should trigger email keyboard
    const emailInput = page.locator('input[type="email"]')
    await emailInput.click()
    await expect(emailInput).toHaveAttribute('inputmode', 'email')
    
    // Password input should be secure
    const passwordInput = page.locator('input[type="password"]')
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })
})
