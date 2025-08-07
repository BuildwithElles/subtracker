import { test, expect } from '@playwright/test'

/**
 * Authentication Components E2E Tests
 * 
 * This file tests the authentication UI components and form interactions.
 */

test.describe('🔧 Authentication Components Tests', () => {
  test('should render password reset page', async ({ page }) => {
    await page.goto('/password-reset')
    
    // Check that the page loads
    await expect(page).toHaveTitle(/SubTracker/i)
    
    // Check for form elements
    await expect(page.locator('h1, h2').filter({ hasText: /reset.*password|forgot.*password/i })).toBeVisible()
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="submit-button"]')).toBeVisible()
  })

  test('should render email confirmation page', async ({ page }) => {
    await page.goto('/email-confirmation')
    
    // Check that the page loads
    await expect(page).toHaveTitle(/SubTracker/i)
    
    // Check for confirmation content
    await expect(page.locator('h1, h2').filter({ hasText: /check.*email|email.*confirmation|confirm/i })).toBeVisible()
  })

  test('should render email confirmation page with token', async ({ page }) => {
    await page.goto('/email-confirmation?token=test-token')
    
    // Check that the page loads
    await expect(page).toHaveTitle(/SubTracker/i)
    
    // Should show loading or confirmation status
    await expect(page.locator('h1, h2')).toBeVisible()
  })

  test('should render password reset confirmation page', async ({ page }) => {
    await page.goto('/password-reset?token=test-token')
    
    // Check that the page loads
    await expect(page).toHaveTitle(/SubTracker/i)
    
    // Should show new password form
    await expect(page.locator('h1, h2').filter({ hasText: /new.*password|set.*password/i })).toBeVisible()
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="confirm-password-input"]')).toBeVisible()
  })

  test('should show forgot password link on login page', async ({ page }) => {
    await page.goto('/login')
    
    // Check for forgot password link
    await expect(page.locator('a:has-text("Forgot"), a:has-text("forgot")')).toBeVisible()
  })

  test('should navigate from login to password reset', async ({ page }) => {
    await page.goto('/login')
    
    // Click forgot password link
    await page.locator('a:has-text("Forgot"), a:has-text("forgot")').click()
    
    // Should navigate to password reset page
    await expect(page).toHaveURL(/\/password-reset/)
    await expect(page.locator('h1, h2').filter({ hasText: /reset.*password|forgot.*password/i })).toBeVisible()
  })

  test('should handle auth callback route', async ({ page }) => {
    await page.goto('/auth/callback')
    
    // Check that the page loads (may show error or processing state)
    await expect(page).toHaveTitle(/SubTracker/i)
  })

  test('should render all form elements on signup', async ({ page }) => {
    await page.goto('/signup')
    
    // Check all required form elements exist
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="confirm-password-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="submit-button"]')).toBeVisible()
  })

  test('should render all form elements on login', async ({ page }) => {
    await page.goto('/login')
    
    // Check required login form elements exist
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="submit-button"]')).toBeVisible()
    
    // Should NOT have confirm password field
    await expect(page.locator('[data-testid="confirm-password-input"]')).toBeHidden()
  })
})
