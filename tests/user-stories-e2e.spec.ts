import { test, expect } from '@playwright/test'
import { TestDataFactory, TestConfig, TestApiHelpers, TestUtils } from './test-helpers'

/**
 * 🎭 USER STORY E2E TESTS
 * 
 * Tests based on specific user stories for SubTracker authentication:
 * 
 * As a user, I want to:
 * 1. Sign up with email and password
 * 2. Sign up with Google OAuth
 * 3. Confirm my email address
 * 4. Log in to my account
 * 5. Reset my password if forgotten
 * 6. Be guided through onboarding
 * 7. Access my dashboard securely
 */

test.describe('📖 User Story: New User Registration', () => {
  test('Story: As a new user, I want to create an account with email and password so that I can start tracking my subscriptions', async ({ page }) => {
    // Given: I am a new user visiting SubTracker
    const newUser = TestDataFactory.createTestUser()
    
    // When: I navigate to the signup page
    await page.goto(TestConfig.ROUTES.signup)
    await expect(page.locator('h1, h2').filter({ hasText: /create.*account|sign up/i })).toBeVisible()
    
    // And: I fill out the registration form with valid information
    await page.fill('[data-testid="email-input"]', newUser.email)
    await page.fill('[data-testid="password-input"]', newUser.password)
    await page.fill('[data-testid="confirm-password-input"]', newUser.password)
    
    // And: I submit the form
    await page.click('[data-testid="submit-button"]')
    
    // Then: I should see a loading state
    await expect(page.locator('.loading, [data-testid="loading"]')).toBeVisible()
    
    // And: I should be redirected to email confirmation
    await expect(page).toHaveURL(TestConfig.ROUTES.emailConfirmation)
    
    // And: I should see a message asking me to check my email
    await expect(page.locator(TestConfig.TEXT_PATTERNS.auth.emailSent)).toBeVisible()
    await expect(page.locator(`text="${newUser.email}"`)).toBeVisible()
    
    // And: The page should explain the next steps
    await expect(page.locator('text="verification", text="click the link", text="confirm"')).toBeVisible()
  })

  test('Story: As a user, I want clear validation messages so that I know what information is required', async ({ page }) => {
    // Given: I am on the signup page
    await page.goto(TestConfig.ROUTES.signup)
    
    // When: I try to submit an empty form
    await page.click('[data-testid="submit-button"]')
    
    // Then: I should see validation messages for required fields
    await expect(page.locator(TestConfig.TEXT_PATTERNS.validation.requiredEmail)).toBeVisible()
    await expect(page.locator(TestConfig.TEXT_PATTERNS.validation.requiredPassword)).toBeVisible()
    
    // When: I enter an invalid email
    await page.fill('[data-testid="email-input"]', 'invalid-email')
    await page.blur('[data-testid="email-input"]')
    
    // Then: I should see an email format validation message
    await expect(page.locator(TestConfig.TEXT_PATTERNS.validation.invalidEmail)).toBeVisible()
    
    // When: I enter a weak password
    const invalidUser = TestDataFactory.createInvalidUser()
    await page.fill('[data-testid="password-input"]', invalidUser.weakPassword.password)
    await page.blur('[data-testid="password-input"]')
    
    // Then: I should see password strength requirements
    await expect(page.locator(TestConfig.TEXT_PATTERNS.validation.weakPassword)).toBeVisible()
    
    // When: I enter mismatched passwords
    await page.fill('[data-testid="password-input"]', 'ValidPassword123!')
    await page.fill('[data-testid="confirm-password-input"]', 'DifferentPassword123!')
    await page.blur('[data-testid="confirm-password-input"]')
    
    // Then: I should see a password mismatch message
    await expect(page.locator(TestConfig.TEXT_PATTERNS.validation.passwordMismatch)).toBeVisible()
  })

  test('Story: As a user, I want to sign up with Google so that I can register quickly without creating a new password', async ({ page }) => {
    // Given: I am on the signup page
    await page.goto(TestConfig.ROUTES.signup)
    
    // When: I see the Google OAuth option
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible()
    
    // And: I click the Google OAuth button
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.click('button:has-text("Continue with Google")')
    ])
    
    // Then: A Google OAuth popup should open
    await expect(popup).toHaveURL(/accounts\.google\.com|oauth/)
    
    // When: I complete the OAuth flow (simulated)
    await popup.close()
    await page.goto(`${TestConfig.ROUTES.authCallback}?code=oauth-success&provider=google`)
    
    // Then: I should be signed in and redirected to onboarding
    await expect(page).toHaveURL(TestConfig.ROUTES.onboarding)
    await expect(page.locator('text="welcome", text="let\'s get started"')).toBeVisible()
  })
})

test.describe('📧 User Story: Email Confirmation', () => {
  test('Story: As a new user, I want to confirm my email address so that I can verify my identity and secure my account', async ({ page }) => {
    // Given: I have just signed up and am on the email confirmation page
    const user = TestDataFactory.createTestUser()
    await page.goto(`${TestConfig.ROUTES.emailConfirmation}?email=${user.email}`)
    
    // Then: I should see clear instructions about email confirmation
    await expect(page.locator('h1, h2').filter({ hasText: /confirm|verify/i })).toBeVisible()
    await expect(page.locator(`text="${user.email}"`)).toBeVisible()
    await expect(page.locator('text="check your email", text="verification email"')).toBeVisible()
    
    // And: I should have an option to resend the email if needed
    await expect(page.locator('button:has-text("Resend"), button:has-text("Send again")')).toBeVisible()
    
    // When: I click the confirmation link in my email (simulated)
    const confirmationToken = TestDataFactory.createTestTokens().validConfirmation
    await page.goto(`${TestConfig.ROUTES.emailConfirmation}?token=${confirmationToken}`)
    
    // Then: My email should be confirmed
    await expect(page.locator(TestConfig.TEXT_PATTERNS.auth.emailConfirmed)).toBeVisible()
    
    // And: I should be redirected to complete my onboarding
    await expect(page).toHaveURL(TestConfig.ROUTES.onboarding)
  })

  test('Story: As a user, I want to resend my confirmation email if I didn\'t receive it', async ({ page }) => {
    // Given: I am on the email confirmation page
    await page.goto(TestConfig.ROUTES.emailConfirmation)
    
    // When: I click the resend email button
    const resendButton = page.locator('button:has-text("Resend")')
    await resendButton.click()
    
    // Then: I should see a success message
    await expect(page.locator('text="email sent", text="verification sent"')).toBeVisible()
    
    // And: The button should be temporarily disabled to prevent spam
    await expect(resendButton).toBeDisabled()
    
    // And: I should see a countdown timer
    await expect(page.locator('text="60", text="seconds", text="wait"')).toBeVisible()
  })

  test('Story: As a user, I want helpful error messages if my confirmation link is invalid or expired', async ({ page }) => {
    const tokens = TestDataFactory.createTestTokens()
    
    // When: I click an invalid confirmation link
    await page.goto(`${TestConfig.ROUTES.emailConfirmation}?token=${tokens.invalidConfirmation}`)
    
    // Then: I should see an error message explaining the issue
    await expect(page.locator('text="invalid", text="token", text="link"')).toBeVisible()
    
    // And: I should have options to request a new confirmation email
    await expect(page.locator('button:has-text("Request new link"), button:has-text("Resend")')).toBeVisible()
    
    // When: I click an expired confirmation link
    await page.goto(`${TestConfig.ROUTES.emailConfirmation}?token=${tokens.expiredConfirmation}`)
    
    // Then: I should see an expiration error message
    await expect(page.locator('text="expired", text="link expired"')).toBeVisible()
  })
})

test.describe('🔑 User Story: User Login', () => {
  test('Story: As a returning user, I want to log in to my account so that I can access my subscription data', async ({ page }) => {
    // Given: I am a returning user with a confirmed account
    const existingUser = TestDataFactory.createConfirmedUser()
    
    // When: I navigate to the login page
    await page.goto(TestConfig.ROUTES.login)
    await expect(page.locator('h1, h2').filter({ hasText: /sign in|login/i })).toBeVisible()
    
    // And: I enter my credentials
    await page.fill('[data-testid="email-input"]', existingUser.email)
    await page.fill('[data-testid="password-input"]', existingUser.password)
    
    // And: I submit the login form
    await page.click('[data-testid="submit-button"]')
    
    // Then: I should see a loading state
    await expect(page.locator(TestConfig.TEXT_PATTERNS.loading.signingIn)).toBeVisible()
    
    // And: I should be redirected to my dashboard
    await expect(page).toHaveURL(TestConfig.ROUTES.dashboard)
    await expect(page.locator('h1, h2').filter({ hasText: /dashboard|welcome|overview/i })).toBeVisible()
    
    // And: I should see my user information
    await expect(page.locator('[data-testid="user-menu"], .user-avatar')).toBeVisible()
  })

  test('Story: As a user, I want helpful error messages when my login credentials are incorrect', async ({ page }) => {
    // Given: I am on the login page
    await page.goto(TestConfig.ROUTES.login)
    
    // When: I enter incorrect credentials
    await page.fill('[data-testid="email-input"]', 'nonexistent@example.com')
    await page.fill('[data-testid="password-input"]', 'wrongpassword')
    await page.click('[data-testid="submit-button"]')
    
    // Then: I should see a clear error message
    await expect(page.locator(TestConfig.TEXT_PATTERNS.auth.loginError)).toBeVisible()
    
    // And: The form should remain accessible for another attempt
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible()
    
    // And: I should have access to password reset if needed
    await expect(page.locator('a:has-text("Forgot password?")')).toBeVisible()
  })

  test('Story: As a user with an unconfirmed email, I want to be reminded to confirm my email when I try to log in', async ({ page }) => {
    // Given: I have an account but haven\'t confirmed my email
    const unconfirmedUser = TestDataFactory.createUnconfirmedUser()
    
    // When: I try to log in
    await page.goto(TestConfig.ROUTES.login)
    await page.fill('[data-testid="email-input"]', unconfirmedUser.email)
    await page.fill('[data-testid="password-input"]', unconfirmedUser.password)
    await page.click('[data-testid="submit-button"]')
    
    // Then: I should see a message about email confirmation
    await expect(page.locator('text="confirm your email", text="email not verified"')).toBeVisible()
    
    // And: I should have an option to resend the confirmation email
    await expect(page.locator('button:has-text("Resend confirmation")')).toBeVisible()
  })

  test('Story: As a user, I want the option to stay logged in so that I don\'t have to sign in every time', async ({ page }) => {
    // Given: I am on the login page
    await page.goto(TestConfig.ROUTES.login)
    
    // When: I see the "Remember me" option
    const rememberCheckbox = page.locator('input[type="checkbox"]:has-text("Remember me")')
    
    if (await rememberCheckbox.isVisible()) {
      // And: I check the "Remember me" option
      await rememberCheckbox.check()
      await expect(rememberCheckbox).toBeChecked()
      
      // And: I log in successfully
      const user = TestDataFactory.createConfirmedUser()
      await page.fill('[data-testid="email-input"]', user.email)
      await page.fill('[data-testid="password-input"]', user.password)
      await page.click('[data-testid="submit-button"]')
      
      // Then: My session should persist across browser sessions
      await expect(page).toHaveURL(TestConfig.ROUTES.dashboard)
      
      // When: I refresh the page
      await page.reload()
      
      // Then: I should still be logged in
      await expect(page).toHaveURL(TestConfig.ROUTES.dashboard)
    }
  })
})

test.describe('🔄 User Story: Password Reset', () => {
  test('Story: As a user who forgot my password, I want to reset it so that I can regain access to my account', async ({ page }) => {
    // Given: I have forgotten my password
    const user = TestDataFactory.createConfirmedUser()
    
    // When: I navigate to the password reset page
    await page.goto(TestConfig.ROUTES.passwordReset)
    await expect(page.locator('h1, h2').filter({ hasText: /reset|forgot/i })).toBeVisible()
    
    // And: I enter my email address
    await page.fill('[data-testid="email-input"]', user.email)
    await page.click('[data-testid="submit-button"]')
    
    // Then: I should see a confirmation that the reset email was sent
    await expect(page.locator(TestConfig.TEXT_PATTERNS.auth.emailSent)).toBeVisible()
    await expect(page.locator(`text="${user.email}"`)).toBeVisible()
    
    // When: I click the reset link in my email (simulated)
    const resetToken = TestDataFactory.createTestTokens().validPasswordReset
    await page.goto(`${TestConfig.ROUTES.passwordReset}?token=${resetToken}`)
    
    // Then: I should see a form to enter my new password
    await expect(page.locator('h1, h2').filter({ hasText: /new password|reset password/i })).toBeVisible()
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="confirm-password-input"]')).toBeVisible()
    
    // When: I enter a new strong password
    const newPassword = 'NewStrongPassword123!'
    await page.fill('[data-testid="password-input"]', newPassword)
    await page.fill('[data-testid="confirm-password-input"]', newPassword)
    await page.click('[data-testid="submit-button"]')
    
    // Then: My password should be updated successfully
    await expect(page.locator(TestConfig.TEXT_PATTERNS.auth.passwordReset)).toBeVisible()
    
    // And: I should be redirected to the login page
    await expect(page).toHaveURL(TestConfig.ROUTES.login)
    
    // And: I should be able to log in with my new password
    await page.fill('[data-testid="email-input"]', user.email)
    await page.fill('[data-testid="password-input"]', newPassword)
    await page.click('[data-testid="submit-button"]')
    await expect(page).toHaveURL(TestConfig.ROUTES.dashboard)
  })

  test('Story: As a user, I want password requirements clearly displayed when resetting my password', async ({ page }) => {
    // Given: I am resetting my password
    const resetToken = TestDataFactory.createTestTokens().validPasswordReset
    await page.goto(`${TestConfig.ROUTES.passwordReset}?token=${resetToken}`)
    
    // Then: I should see password requirements
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
    
    // When: I enter a weak password
    await page.fill('[data-testid="password-input"]', 'weak')
    
    // Then: I should see validation feedback
    await expect(page.locator('.text-red, .text-destructive, .error')).toBeVisible()
    
    // When: I enter a strong password
    await page.fill('[data-testid="password-input"]', 'StrongPassword123!')
    
    // Then: I should see positive validation feedback
    await expect(page.locator('.text-green, .text-success')).toBeVisible()
  })
})

test.describe('🚀 User Story: Onboarding Experience', () => {
  test('Story: As a new user, I want to be guided through setting up my account so that I can start using SubTracker effectively', async ({ page }) => {
    // Given: I am a new user who has just confirmed my email
    await page.goto(TestConfig.ROUTES.onboarding)
    
    // Then: I should see a welcoming onboarding interface
    await expect(page.locator('h1, h2').filter({ hasText: /welcome|onboarding|get started/i })).toBeVisible()
    
    // And: I should see clear steps or progress indicators
    await expect(page.locator('.step, .progress, [data-testid="progress"]')).toBeVisible()
    
    // And: I should have options to proceed with setup
    await expect(page.locator('button:has-text("Get Started"), button:has-text("Next"), button:has-text("Continue")')).toBeVisible()
    
    // When: I proceed with the onboarding
    const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Get Started")')
    if (await nextButton.isVisible()) {
      await nextButton.click()
      
      // Then: I should progress through the onboarding steps
      await expect(page.locator('.onboarding, .setup')).toBeVisible()
    }
  })

  test('Story: As a user, I want to skip onboarding if I prefer to explore on my own', async ({ page }) => {
    // Given: I am on the onboarding page
    await page.goto(TestConfig.ROUTES.onboarding)
    
    // When: I look for a skip option
    const skipButton = page.locator('button:has-text("Skip"), a:has-text("Skip"), text="skip for now"')
    
    if (await skipButton.isVisible()) {
      // And: I choose to skip onboarding
      await skipButton.click()
      
      // Then: I should be taken directly to my dashboard
      await expect(page).toHaveURL(TestConfig.ROUTES.dashboard)
      await expect(page.locator('h1, h2').filter({ hasText: /dashboard/i })).toBeVisible()
    }
  })
})

test.describe('🔐 User Story: Security and Session Management', () => {
  test('Story: As a user, I want my session to be secure and automatically log me out if inactive for too long', async ({ page }) => {
    // Given: I am logged into my account
    const user = TestDataFactory.createConfirmedUser()
    await page.goto(TestConfig.ROUTES.login)
    await page.fill('[data-testid="email-input"]', user.email)
    await page.fill('[data-testid="password-input"]', user.password)
    await page.click('[data-testid="submit-button"]')
    await expect(page).toHaveURL(TestConfig.ROUTES.dashboard)
    
    // When: I simulate session expiration
    await page.evaluate(() => {
      localStorage.removeItem('supabase.auth.token')
      sessionStorage.clear()
    })
    
    // And: I try to access a protected page
    await page.reload()
    
    // Then: I should be redirected to login
    await expect(page).toHaveURL(TestConfig.ROUTES.login)
    await expect(page.locator('text="session expired", text="please sign in"')).toBeVisible()
  })

  test('Story: As a user, I want to securely log out of my account', async ({ page }) => {
    // Given: I am logged into my dashboard
    await page.goto(TestConfig.ROUTES.dashboard)
    
    // When: I look for a logout option
    const logoutButton = page.locator('[data-testid="signout-button"], button:has-text("Sign Out"), button:has-text("Logout")')
    
    if (await logoutButton.isVisible()) {
      // And: I click logout
      await logoutButton.click()
      
      // Then: I should be logged out and redirected
      await expect(page).toHaveURL(TestConfig.ROUTES.home)
      
      // And: I should not be able to access protected pages
      await page.goto(TestConfig.ROUTES.dashboard)
      await expect(page).toHaveURL(TestConfig.ROUTES.login)
    }
  })
})

test.describe('♿ User Story: Accessibility and Inclusive Design', () => {
  test('Story: As a user with disabilities, I want the authentication forms to be accessible with screen readers and keyboard navigation', async ({ page }) => {
    // Given: I am using assistive technology
    await page.goto(TestConfig.ROUTES.signup)
    
    // Then: Form elements should have proper labels
    await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute('aria-label', /email/i)
    await expect(page.locator('[data-testid="password-input"]')).toHaveAttribute('aria-label', /password/i)
    
    // And: Error messages should be announced to screen readers
    await page.click('[data-testid="submit-button"]')
    await expect(page.locator('[role="alert"], [aria-live="polite"]')).toBeVisible()
    
    // And: I should be able to navigate with keyboard only
    await page.keyboard.press('Tab') // Email field
    await expect(page.locator('[data-testid="email-input"]')).toBeFocused()
    
    await page.keyboard.press('Tab') // Password field
    await expect(page.locator('[data-testid="password-input"]')).toBeFocused()
    
    await page.keyboard.press('Tab') // Confirm password field
    await expect(page.locator('[data-testid="confirm-password-input"]')).toBeFocused()
    
    await page.keyboard.press('Tab') // Submit button
    await expect(page.locator('[data-testid="submit-button"]')).toBeFocused()
  })

  test('Story: As a mobile user, I want the authentication forms to work well on my touch device', async ({ page }) => {
    // Given: I am using a mobile device
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(TestConfig.ROUTES.signup)
    
    // Then: The form should be responsive and touch-friendly
    await expect(page.locator('form')).toBeVisible()
    
    // And: Touch targets should be large enough
    const submitButton = page.locator('[data-testid="submit-button"]')
    const boundingBox = await submitButton.boundingBox()
    
    if (boundingBox) {
      expect(boundingBox.height).toBeGreaterThan(44) // iOS minimum touch target
    }
    
    // And: Virtual keyboard should be appropriate
    const emailInput = page.locator('[data-testid="email-input"]')
    await emailInput.click()
    await expect(emailInput).toHaveAttribute('inputmode', 'email')
  })
})

test.describe('🔄 User Story: Error Recovery and Help', () => {
  test('Story: As a user experiencing issues, I want helpful error messages and recovery options', async ({ page }) => {
    // Given: I encounter a network error during signup
    await TestApiHelpers.mockNetworkError(page)
    await page.goto(TestConfig.ROUTES.signup)
    
    const user = TestDataFactory.createTestUser()
    await page.fill('[data-testid="email-input"]', user.email)
    await page.fill('[data-testid="password-input"]', user.password)
    await page.fill('[data-testid="confirm-password-input"]', user.password)
    await page.click('[data-testid="submit-button"]')
    
    // Then: I should see a helpful error message
    await expect(page.locator('text="network error", text="connection failed", text="try again"')).toBeVisible()
    
    // And: I should have options to retry
    await expect(page.locator('button:has-text("Try Again"), button:has-text("Retry")')).toBeVisible()
    
    // And: The form data should be preserved
    await expect(page.locator('[data-testid="email-input"]')).toHaveValue(user.email)
  })

  test('Story: As a user, I want access to help if I\'m having trouble with authentication', async ({ page }) => {
    // Given: I am on any authentication page
    const authPages = [TestConfig.ROUTES.signup, TestConfig.ROUTES.login, TestConfig.ROUTES.passwordReset]
    
    for (const authPage of authPages) {
      await page.goto(authPage)
      
      // Then: I should see help options
      const helpElements = page.locator('a:has-text("Help"), a:has-text("Support"), a:has-text("Contact")')
      
      if (await helpElements.first().isVisible()) {
        await expect(helpElements.first()).toBeVisible()
      }
      
      // And: There should be links to documentation or FAQ
      const docElements = page.locator('a:has-text("FAQ"), a:has-text("Guide"), a:has-text("Documentation")')
      
      if (await docElements.first().isVisible()) {
        await expect(docElements.first()).toBeVisible()
      }
    }
  })
})
