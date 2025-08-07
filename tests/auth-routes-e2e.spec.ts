import { test, expect } from '@playwright/test'

test.describe('🔐 Authentication Routes Tests', () => {
  test('should load password reset page successfully', async ({ page }) => {
    await page.goto('/password-reset')

    // Check that the page loads with correct title and content
    await expect(page.locator('h1')).toContainText(/reset.*password/i)
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="submit-button"]')).toBeVisible()
    await expect(page.locator('text="Send reset link"')).toBeVisible()
  })

  test('should load email confirmation page successfully', async ({ page }) => {
    await page.goto('/email-confirmation')

    // Check that the page loads with correct content
    await expect(page.locator('h1')).toContainText(/check.*email/i)
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="resend-button"]')).toBeVisible()
    await expect(page.locator('text="Resend confirmation email"')).toBeVisible()
  })

  test('should show forgot password link on login page', async ({ page }) => {
    await page.goto('/login')

    // Check that the forgot password link is visible on login page
    await expect(page.locator('text="Forgot your password?"')).toBeVisible()
    
    // Click the link and verify navigation
    await page.click('text="Forgot your password?"')
    await expect(page).toHaveURL(/\/password-reset/)
  })

  test('should handle password reset form submission', async ({ page }) => {
    await page.goto('/password-reset')

    // Fill in email and submit
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.click('[data-testid="submit-button"]')

    // Should show success message (even if email doesn't exist for security)
    await expect(page.locator('text=/.*receive.*password reset.*link/i')).toBeVisible({ timeout: 10000 })
  })

  test('should handle password reset with token', async ({ page }) => {
    await page.goto('/password-reset?token=test-reset-token')

    // Should show password reset form for token
    await expect(page.locator('h1')).toContainText(/set.*new.*password/i)
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="confirm-password-input"]')).toBeVisible()
    await expect(page.locator('text="Update password"')).toBeVisible()
  })

  test('should handle email confirmation with token', async ({ page }) => {
    await page.goto('/email-confirmation?token=test-confirmation-token')

    // Should show loading state initially, then success
    await expect(page.locator('h1')).toContainText(/confirming.*email|email.*confirm/i)
    
    // Wait for success state to appear
    await expect(page.locator('text="Email confirmed successfully!"')).toBeVisible({ timeout: 3000 })
  })

  test('should navigate between auth pages correctly', async ({ page }) => {
    // Start on login page
    await page.goto('/login')
    await expect(page.locator('text="Sign in to your account"')).toBeVisible()

    // Navigate to password reset
    await page.click('text="Forgot your password?"')
    await expect(page).toHaveURL(/\/password-reset/)
    await expect(page.locator('h1')).toContainText(/reset.*password/i)

    // Navigate back to login
    await page.click('text="Back to login"')
    await expect(page).toHaveURL(/\/login/)

    // Navigate to signup
    await page.goto('/signup')
    await expect(page.locator('text="Create your account"')).toBeVisible()
  })

  test('should have proper accessibility attributes', async ({ page }) => {
    await page.goto('/password-reset')

    // Check ARIA labels and accessibility
    await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute('type', 'email')
    await expect(page.locator('[data-testid="submit-button"]')).toHaveAttribute('type', 'submit')
    
    // Clear the email field and submit empty form to trigger validation
    await page.fill('[data-testid="email-input"]', '')
    await page.click('[data-testid="submit-button"]')
    
    // Wait a moment for any async validation or error state
    await page.waitForTimeout(500)
    
    // Check that error messages appear using the error message container
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Email is required')
  })

  test('should validate email confirmation resend functionality', async ({ page }) => {
    await page.goto('/email-confirmation')

    // Fill in email and click resend
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.click('[data-testid="resend-button"]')

    // Wait for the async operation to complete and message to appear
    await page.waitForTimeout(1000)
    
    // Should show confirmation message (more flexible matching)
    await expect(page.locator('text=confirmation email')).toBeVisible({ timeout: 5000 })
  })
})
