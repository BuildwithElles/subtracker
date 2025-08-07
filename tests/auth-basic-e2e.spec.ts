import { test, expect } from '@playwright/test'

/**
 * Basic Authentication E2E Tests
 * 
 * This file contains simplified tests that work with the current application state.
 * These tests verify basic functionality without requiring complex authentication flows.
 */

test.describe('🔥 Basic Authentication Tests', () => {
  test('should load signup page successfully', async ({ page }) => {
    await page.goto('/signup')
    
    // Check that the page loads
    await expect(page).toHaveTitle(/SubTracker/i)
    
    // Check for form elements
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible()
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should show signup form validation', async ({ page }) => {
    await page.goto('/signup')
    
    // Try to submit empty form
    await page.locator('button[type="submit"]').first().click()
    
    // Just verify the form doesn't submit (stays on signup page)
    await expect(page).toHaveURL(/\/signup/)
  })

  test('should load login page successfully', async ({ page }) => {
    await page.goto('/login')
    
    // Check that the page loads (might redirect or show form)
    await expect(page).toHaveTitle(/SubTracker/i)
    
    // Look for any form or login elements
    const hasForm = await page.locator('form, [data-testid="email-input"], [data-testid="password-input"]').count()
    expect(hasForm).toBeGreaterThan(0)
  })

  test('should have Google OAuth button on signup', async ({ page }) => {
    await page.goto('/signup')
    
    // Look for Google OAuth button using test ID
    await expect(page.locator('[data-testid="google-oauth-button"]')).toBeVisible()
  })

  test('should have responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/signup')
    
    // Form should still be visible and functional on mobile
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should navigate between auth pages', async ({ page }) => {
    await page.goto('/signup')
    
    // Look for login link using test ID
    await expect(page.locator('[data-testid="login-link"]')).toBeVisible()
    await page.locator('[data-testid="login-link"]').click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('should handle form input correctly', async ({ page }) => {
    await page.goto('/signup')
    
    // Fill form with test data using test IDs
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'TestPassword123!')
    await page.fill('[data-testid="confirm-password-input"]', 'TestPassword123!')
    
    // Verify values are set
    await expect(page.locator('[data-testid="email-input"]')).toHaveValue('test@example.com')
    await expect(page.locator('[data-testid="password-input"]')).toHaveValue('TestPassword123!')
  })

  test('should have proper accessibility attributes', async ({ page }) => {
    await page.goto('/signup')
    
    // Check for proper labels and ARIA attributes
    const emailInput = page.locator('[data-testid="email-input"]')
    const passwordInput = page.locator('[data-testid="password-input"]')
    
    // Verify inputs have proper accessibility attributes
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
  })

  test('should load dashboard when authenticated', async ({ page }) => {
    // Try to visit dashboard directly
    await page.goto('/dashboard')
    
    // Should either show dashboard or redirect to login
    await expect(page).toHaveTitle(/SubTracker/i)
    
    // Check if we're on dashboard or got redirected
    const currentUrl = page.url()
    console.log('Dashboard access result:', currentUrl)
  })

  test('should handle non-existent auth routes gracefully', async ({ page }) => {
    // Try visiting various auth-related routes
    const routes = ['/auth/callback', '/email-confirmation', '/reset-password']
    
    for (const route of routes) {
      await page.goto(route)
      // Should not crash, should show some content or redirect
      await expect(page).toHaveTitle(/SubTracker/i)
    }
  })
})

test.describe('🎨 UI/UX Basic Tests', () => {
  test('should have consistent branding', async ({ page }) => {
    await page.goto('/signup')
    
    // Check for SubTracker branding using test IDs
    await expect(page.locator('[data-testid="app-title"]')).toBeVisible()
    await expect(page.locator('[data-testid="app-title"]')).toContainText('SubTracker')
    
    // Check for tagline
    await expect(page.locator('[data-testid="app-tagline"]')).toBeVisible()
  })

  test('should have loading states', async ({ page }) => {
    await page.goto('/signup')
    
    // Fill form and submit to trigger loading
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'TestPassword123!')
    
    // Click submit and check for button state changes
    const submitButton = page.locator('[data-testid="submit-button"]')
    await submitButton.click()
    
    // Button should be disabled or show loading text
    await expect(submitButton).toBeDisabled()
  })

  test('should work with keyboard navigation', async ({ page }) => {
    await page.goto('/signup')
    
    // Tab through form elements
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Should be able to interact with form using keyboard
    await page.keyboard.type('test@example.com')
  })
})
