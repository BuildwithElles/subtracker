import { test, expect } from '@playwright/test'

// Test with authenticated user - requires user to be logged in
test.describe('Authenticated Onboarding Flow', () => {
  test.skip('Full onboarding flow with authenticated user', async ({ page }) => {
    // This test requires authentication setup
    // For now we'll skip it until we have proper auth helpers
    
    // Navigate to onboarding
    await page.goto('/onboarding')
    
    // Should not redirect to signup since user is authenticated
    await page.waitForLoadState('domcontentloaded')
    expect(page.url()).toContain('/onboarding')
    
    // Check that the onboarding page loads with proper content
    await expect(page.locator('h1')).toContainText('Welcome to SubTracker')
    
    // Verify all three steps are present
    await expect(page.locator('[data-testid="step-1"]')).toBeVisible()
    await expect(page.locator('[data-testid="step-2"]')).toBeVisible()
    await expect(page.locator('[data-testid="step-3"]')).toBeVisible()
    
    // Check step 1 is active initially
    await expect(page.locator('[data-testid="step-1"]')).toHaveClass(/bg-blue-600/)
    
    // Step 1: Gmail Integration
    await expect(page.locator('text=Connect Your Gmail')).toBeVisible()
    await expect(page.locator('text=Active subscriptions and recurring payments')).toBeVisible()
    
    // Navigate to step 2 using Next button
    await page.locator('button:has-text("Next")').click()
    await expect(page.locator('[data-testid="step-2"]')).toHaveClass(/bg-blue-600/)
    
    // Step 2: Budget Setup
    await expect(page.locator('text=Set Your Monthly Budget')).toBeVisible()
    
    // Navigate to step 3
    await page.locator('button:has-text("Next")').click()
    await expect(page.locator('[data-testid="step-3"]')).toHaveClass(/bg-blue-600/)
    
    // Step 3: Completion
    await expect(page.locator('text=You\'re all set!')).toBeVisible()
    
    // Go back to step 2
    await page.locator('button:has-text("Back")').click()
    await expect(page.locator('[data-testid="step-2"]')).toHaveClass(/bg-blue-600/)
    
    // Go back to step 1
    await page.locator('button:has-text("Back")').click()
    await expect(page.locator('[data-testid="step-1"]')).toHaveClass(/bg-blue-600/)
  })

  test.skip('Gmail connection flow works', async ({ page }) => {
    await page.goto('/onboarding')
    
    // Click Connect Gmail button
    await page.locator('button:has-text("Connect Gmail")').click()
    
    // Should show loading state
    await expect(page.locator('text=Connecting')).toBeVisible()
    
    // Wait for completion and move to next step
    await page.waitForTimeout(3000)
    await expect(page.locator('[data-testid="step-2"]')).toHaveClass(/bg-blue-600/)
  })

  test.skip('Skip Gmail flow works', async ({ page }) => {
    await page.goto('/onboarding')
    
    // Click Skip for now
    await page.locator('text=Skip for now').click()
    
    // Should move to step 2
    await expect(page.locator('[data-testid="step-2"]')).toHaveClass(/bg-blue-600/)
    await expect(page.locator('text=Set Your Monthly Budget')).toBeVisible()
  })

  test.skip('Budget setup flow works', async ({ page }) => {
    await page.goto('/onboarding?step=2')
    
    // Click Set Up My Budget
    await page.locator('button:has-text("Set Up My Budget")').click()
    
    // Should navigate to budget page
    await expect(page).toHaveURL(/.*\/budget/)
  })

  test.skip('Skip budget flow works', async ({ page }) => {
    await page.goto('/onboarding?step=2')
    
    // Click Skip budget setup
    await page.locator('text=Skip budget setup').click()
    
    // Should navigate to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/)
  })

  test.skip('Complete onboarding flow works', async ({ page }) => {
    await page.goto('/onboarding?step=3')
    
    // Click Go to Dashboard
    await page.locator('button:has-text("Go to Dashboard")').click()
    
    // Should navigate to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/)
  })
})
