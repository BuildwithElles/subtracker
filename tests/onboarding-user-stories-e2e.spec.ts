import { test, expect } from '@playwright/test'

/**
 * User Stories E2E Tests for Onboarding & Budget Setup
 * 
 * This file maps specific user stories to E2E test scenarios
 * covering the complete onboarding and budget setup experience.
 */

test.describe('📖 User Stories: Onboarding & Budget Setup', () => {

  test.describe('🎯 User Story: First-Time User Onboarding', () => {
    test('Story: As a new user, I want to be guided through setting up my account so I can start tracking subscriptions effectively', async ({ page }) => {
      // Arrange: New user lands on onboarding
      await page.goto('/onboarding')
      
      // Act & Assert: Should see welcoming onboarding experience
      await expect(page.locator('[data-testid="onboarding-welcome"]')).toBeVisible()
      await expect(page.locator('h1, h2').filter({ hasText: /welcome|get.*started/i })).toBeVisible()
      
      // Should see clear progress indication
      await expect(page.locator('[data-testid="progress-indicator"]')).toBeVisible()
      await expect(page.locator('[data-testid="step-counter"]')).toContainText('1 of 2')
      
      // Should see step descriptions
      await expect(page.locator('[data-testid="step-description"]')).toContainText('Connect your Gmail')
      
      // Should have skip options for flexibility
      await expect(page.locator('[data-testid="skip-gmail-button"]')).toBeVisible()
    })

    test('Story: As a user, I want to understand what each onboarding step will do before proceeding', async ({ page }) => {
      await page.goto('/onboarding')
      
      // Should see step explanations
      await expect(page.locator('[data-testid="gmail-step-explanation"]')).toBeVisible()
      await expect(page.locator('[data-testid="gmail-step-explanation"]')).toContainText('automatically scan')
      
      // Should see benefits clearly explained
      await expect(page.locator('[data-testid="gmail-benefits"]')).toBeVisible()
      await expect(page.locator('text="Find subscriptions automatically"')).toBeVisible()
      await expect(page.locator('text="Track recurring payments"')).toBeVisible()
      
      // Should see what permissions are needed
      await expect(page.locator('[data-testid="permissions-info"]')).toBeVisible()
    })
  })

  test.describe('📧 User Story: Gmail Integration', () => {
    test('Story: As a user, I want to connect my Gmail so SubTracker can find my subscriptions automatically', async ({ page }) => {
      await page.goto('/onboarding')
      
      // Should see Gmail connection option prominently
      await expect(page.locator('[data-testid="gmail-connect-button"]')).toBeVisible()
      await expect(page.locator('[data-testid="gmail-connect-button"]')).toContainText(/connect.*gmail/i)
      
      // Mock successful OAuth flow
      await page.route('**/auth/v1/authorize**', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ 
            access_token: 'mock_token',
            provider: 'google',
            user: { email: 'user@gmail.com' }
          })
        })
      })

      // Click connect
      await page.click('[data-testid="gmail-connect-button"]')
      
      // Should show loading state
      await expect(page.locator('[data-testid="gmail-connecting"]')).toBeVisible()
      
      // Should show success state
      await expect(page.locator('[data-testid="gmail-connected-status"]')).toBeVisible()
      await expect(page.locator('text="Gmail connected successfully"')).toBeVisible()
      
      // Should show connected email
      await expect(page.locator('[data-testid="connected-email"]')).toContainText('user@gmail.com')
    })

    test('Story: As a user, I want to understand what happens if Gmail connection fails', async ({ page }) => {
      await page.goto('/onboarding')
      
      // Mock OAuth failure
      await page.route('**/auth/v1/authorize**', route => {
        route.fulfill({
          status: 400,
          body: JSON.stringify({ error: 'access_denied', error_description: 'User denied access' })
        })
      })

      await page.click('[data-testid="gmail-connect-button"]')
      
      // Should show clear error message
      await expect(page.locator('[data-testid="gmail-error-message"]')).toBeVisible()
      await expect(page.locator('[data-testid="gmail-error-message"]')).toContainText('connection failed')
      
      // Should offer helpful next steps
      await expect(page.locator('[data-testid="retry-gmail-button"]')).toBeVisible()
      await expect(page.locator('[data-testid="skip-gmail-button"]')).toBeVisible()
      
      // Should explain consequences of skipping
      await expect(page.locator('[data-testid="skip-explanation"]')).toContainText('manual entry')
    })

    test('Story: As a privacy-conscious user, I want to skip Gmail connection and add subscriptions manually', async ({ page }) => {
      await page.goto('/onboarding')
      
      // Should clearly see skip option
      await expect(page.locator('[data-testid="skip-gmail-button"]')).toBeVisible()
      
      // Click skip
      await page.click('[data-testid="skip-gmail-button"]')
      
      // Should confirm the choice
      await expect(page.locator('[data-testid="skip-confirmation"]')).toBeVisible()
      await page.click('[data-testid="confirm-skip-button"]')
      
      // Should proceed to next step
      await expect(page.locator('[data-testid="budget-setup-step"]')).toBeVisible()
      
      // Should remember this choice for later
      await page.reload()
      await expect(page.locator('[data-testid="gmail-skipped-status"]')).toBeVisible()
    })
  })

  test.describe('💰 User Story: Budget Setup', () => {
    test('Story: As a user, I want to set up my budget so I can see how subscriptions fit into my finances', async ({ page }) => {
      await page.goto('/onboarding?step=2')
      
      // Should see comprehensive budget form
      await expect(page.locator('[data-testid="budget-setup-form"]')).toBeVisible()
      
      // Should have all major budget categories
      const categories = ['income', 'housing', 'food', 'transportation', 'entertainment', 'savings']
      for (const category of categories) {
        await expect(page.locator(`[data-testid="${category}-input"]`)).toBeVisible()
        await expect(page.locator(`label[for="${category}"]`)).toBeVisible()
      }
      
      // Should have currency selection
      await expect(page.locator('[data-testid="currency-select"]')).toBeVisible()
      
      // Fill budget with realistic values
      await page.fill('[data-testid="income-input"]', '5000')
      await page.fill('[data-testid="housing-input"]', '1500')
      await page.fill('[data-testid="food-input"]', '600')
      await page.fill('[data-testid="transportation-input"]', '400')
      await page.fill('[data-testid="entertainment-input"]', '300')
      await page.fill('[data-testid="savings-input"]', '800')
      await page.selectOption('[data-testid="currency-select"]', 'USD')
      
      // Should show real-time budget summary
      await expect(page.locator('[data-testid="budget-summary"]')).toBeVisible()
      await expect(page.locator('[data-testid="total-expenses"]')).toContainText('2800')
      await expect(page.locator('[data-testid="remaining-budget"]')).toContainText('1400')
    })

    test('Story: As a user, I want to see how my budget categories add up so I know if I\'m overspending', async ({ page }) => {
      await page.goto('/onboarding?step=2')
      
      // Set income
      await page.fill('[data-testid="income-input"]', '3000')
      
      // Add expenses that exceed income
      await page.fill('[data-testid="housing-input"]', '2000')
      await page.fill('[data-testid="food-input"]', '800')
      await page.fill('[data-testid="transportation-input"]', '500')
      
      // Should show budget warning
      await expect(page.locator('[data-testid="budget-warning"]')).toBeVisible()
      await expect(page.locator('[data-testid="budget-warning"]')).toHaveClass(/warning|alert|danger/)
      
      // Should show overspending amount
      await expect(page.locator('[data-testid="overspending-amount"]')).toContainText('300') // 3300 - 3000
      
      // Should suggest adjustments
      await expect(page.locator('[data-testid="budget-suggestions"]')).toBeVisible()
      await expect(page.locator('text="reduce", text="adjust"')).toBeVisible()
    })

    test('Story: As a user, I want helpful validation so I don\'t enter invalid budget amounts', async ({ page }) => {
      await page.goto('/onboarding?step=2')
      
      // Try invalid inputs
      await page.fill('[data-testid="income-input"]', '-500') // Negative income
      await page.fill('[data-testid="housing-input"]', 'abc') // Non-numeric
      await page.fill('[data-testid="food-input"]', '999999999') // Unrealistic amount
      
      // Try to submit
      await page.click('[data-testid="finish-onboarding-button"]')
      
      // Should show validation errors
      await expect(page.locator('[data-testid="income-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="income-error"]')).toContainText('positive')
      
      await expect(page.locator('[data-testid="housing-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="housing-error"]')).toContainText('number')
      
      await expect(page.locator('[data-testid="food-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="food-error"]')).toContainText('realistic')
      
      // Should not proceed with invalid data
      await expect(page).toHaveURL(/onboarding/)
    })

    test('Story: As an international user, I want to select my local currency for accurate budget tracking', async ({ page }) => {
      await page.goto('/onboarding?step=2')
      
      // Should have comprehensive currency options
      await page.click('[data-testid="currency-select"]')
      
      const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF']
      for (const currency of currencies) {
        await expect(page.locator(`option[value="${currency}"]`)).toBeVisible()
      }
      
      // Test currency selection
      await page.selectOption('[data-testid="currency-select"]', 'EUR')
      
      // Should update currency symbols throughout form
      await expect(page.locator('[data-testid="income-input"]')).toHaveAttribute('placeholder', /€|EUR/)
      await expect(page.locator('[data-testid="currency-symbol"]')).toContainText('€')
      
      // Should save currency preference
      await page.fill('[data-testid="income-input"]', '4000')
      await page.click('[data-testid="finish-onboarding-button"]')
      
      // Should persist currency choice
      await page.goto('/dashboard')
      await expect(page.locator('[data-testid="budget-display"]')).toContainText('€')
    })
  })

  test.describe('🎯 User Story: Onboarding Completion', () => {
    test('Story: As a user, I want to see my progress through onboarding so I know how much is left', async ({ page }) => {
      await page.goto('/onboarding')
      
      // Should show step 1 of 2
      await expect(page.locator('[data-testid="progress-indicator"]')).toBeVisible()
      await expect(page.locator('[data-testid="current-step"]')).toHaveText('1')
      await expect(page.locator('[data-testid="total-steps"]')).toHaveText('2')
      
      // Progress bar should show 50%
      await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute('aria-valuenow', '50')
      
      // Move to step 2
      await page.click('[data-testid="next-step-button"]')
      
      // Should show step 2 of 2
      await expect(page.locator('[data-testid="current-step"]')).toHaveText('2')
      await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute('aria-valuenow', '100')
    })

    test('Story: As a user, I want to complete onboarding and see my dashboard so I can start using SubTracker', async ({ page }) => {
      await page.goto('/onboarding?step=2')
      
      // Complete budget setup
      await page.fill('[data-testid="income-input"]', '4000')
      await page.fill('[data-testid="housing-input"]', '1200')
      await page.fill('[data-testid="savings-input"]', '800')
      await page.selectOption('[data-testid="currency-select"]', 'USD')
      
      // Mock successful save
      await page.route('**/api/budget', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ 
            success: true, 
            budget_id: 'budget_123',
            message: 'Budget saved successfully'
          })
        })
      })
      
      // Finish onboarding
      await page.click('[data-testid="finish-onboarding-button"]')
      
      // Should show completion success
      await expect(page.locator('[data-testid="onboarding-success"]')).toBeVisible()
      await expect(page.locator('text="Welcome to SubTracker!", text="Setup complete"')).toBeVisible()
      
      // Should redirect to dashboard
      await expect(page).toHaveURL(/\/dashboard/)
      
      // Should show budget summary on dashboard
      await expect(page.locator('[data-testid="budget-overview"]')).toBeVisible()
      await expect(page.locator('[data-testid="monthly-income"]')).toContainText('$4,000')
    })

    test('Story: As a user, I want to be able to modify my choices later if I change my mind', async ({ page }) => {
      // Complete onboarding
      await page.goto('/onboarding?step=2')
      await page.fill('[data-testid="income-input"]', '3000')
      await page.selectOption('[data-testid="currency-select"]', 'USD')
      
      await page.route('**/api/budget', route => {
        route.fulfill({ status: 200, body: JSON.stringify({ success: true }) })
      })
      
      await page.click('[data-testid="finish-onboarding-button"]')
      await expect(page).toHaveURL(/\/dashboard/)
      
      // Should be able to return to budget settings
      await page.click('[data-testid="budget-settings-link"]')
      await expect(page).toHaveURL(/\/budget|\/settings/)
      
      // Should show current budget values
      await expect(page.locator('[data-testid="income-input"]')).toHaveValue('3000')
      
      // Should be able to update
      await page.fill('[data-testid="income-input"]', '3500')
      await page.click('[data-testid="save-budget-button"]')
      
      await expect(page.locator('[data-testid="budget-updated-message"]')).toBeVisible()
    })
  })

  test.describe('🔄 User Story: Error Recovery & Help', () => {
    test('Story: As a user experiencing issues, I want clear error messages and recovery options', async ({ page }) => {
      await page.goto('/onboarding?step=2')
      
      // Mock server error
      await page.route('**/api/budget', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ 
            error: 'Database temporarily unavailable',
            code: 'DB_ERROR'
          })
        })
      })
      
      // Try to complete onboarding
      await page.fill('[data-testid="income-input"]', '4000')
      await page.click('[data-testid="finish-onboarding-button"]')
      
      // Should show user-friendly error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
      await expect(page.locator('[data-testid="error-message"]')).toContainText('temporarily unavailable')
      
      // Should not show technical error codes to user
      await expect(page.locator('[data-testid="error-message"]')).not.toContainText('DB_ERROR')
      
      // Should offer retry option
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()
      
      // Should offer help/support option
      await expect(page.locator('[data-testid="get-help-button"]')).toBeVisible()
      
      // Should preserve user's data
      await expect(page.locator('[data-testid="income-input"]')).toHaveValue('4000')
    })

    test('Story: As a user, I want to get help if I\'m confused about onboarding steps', async ({ page }) => {
      await page.goto('/onboarding')
      
      // Should have help options available
      await expect(page.locator('[data-testid="help-button"]')).toBeVisible()
      
      // Click help
      await page.click('[data-testid="help-button"]')
      
      // Should show contextual help
      await expect(page.locator('[data-testid="help-panel"]')).toBeVisible()
      await expect(page.locator('[data-testid="step-help-content"]')).toContainText('Gmail connection')
      
      // Should have different help for each step
      await page.click('[data-testid="next-step-button"]')
      await page.click('[data-testid="help-button"]')
      await expect(page.locator('[data-testid="step-help-content"]')).toContainText('budget setup')
      
      // Should have contact support option
      await expect(page.locator('[data-testid="contact-support"]')).toBeVisible()
    })

    test('Story: As a user on a slow connection, I want to see loading states so I know the app is working', async ({ page }) => {
      await page.goto('/onboarding?step=2')
      
      // Mock slow API
      await page.route('**/api/budget', route => {
        setTimeout(() => {
          route.fulfill({
            status: 200,
            body: JSON.stringify({ success: true })
          })
        }, 3000)
      })
      
      await page.fill('[data-testid="income-input"]', '4000')
      await page.click('[data-testid="finish-onboarding-button"]')
      
      // Should show loading state immediately
      await expect(page.locator('[data-testid="saving-budget-spinner"]')).toBeVisible()
      await expect(page.locator('[data-testid="saving-message"]')).toContainText('Saving your budget')
      
      // Button should be disabled during save
      await expect(page.locator('[data-testid="finish-onboarding-button"]')).toBeDisabled()
      
      // Should show progress indicator
      await expect(page.locator('[data-testid="save-progress"]')).toBeVisible()
    })
  })

  test.describe('♿ User Story: Accessibility & Inclusive Design', () => {
    test('Story: As a user with disabilities, I want onboarding to be accessible with screen readers and keyboard navigation', async ({ page }) => {
      await page.goto('/onboarding')
      
      // Should have proper heading structure
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator('h1')).toHaveAttribute('aria-level', '1')
      
      // Progress indicator should be accessible
      await expect(page.locator('[data-testid="progress-indicator"]')).toHaveAttribute('role', 'progressbar')
      await expect(page.locator('[data-testid="progress-indicator"]')).toHaveAttribute('aria-label', /step.*of/)
      
      // Should be keyboard navigable
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter') // Should activate button
      
      // Form fields should have proper labels
      await page.goto('/onboarding?step=2')
      await expect(page.locator('[data-testid="income-input"]')).toHaveAttribute('aria-label')
      
      // Error messages should be announced
      await page.fill('[data-testid="income-input"]', '-100')
      await page.click('[data-testid="finish-onboarding-button"]')
      await expect(page.locator('[data-testid="income-error"]')).toHaveAttribute('role', 'alert')
    })

    test('Story: As a mobile user, I want onboarding to work well on my touch device', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/onboarding')
      
      // Progress indicator should be mobile-friendly
      await expect(page.locator('[data-testid="progress-indicator"]')).toBeVisible()
      
      // Buttons should be touch-friendly (minimum 44px)
      const nextButton = page.locator('[data-testid="next-step-button"]')
      const box = await nextButton.boundingBox()
      expect(box?.height).toBeGreaterThan(44)
      expect(box?.width).toBeGreaterThan(44)
      
      // Form should be mobile responsive
      await page.goto('/onboarding?step=2')
      await expect(page.locator('[data-testid="budget-form"]')).toBeVisible()
      
      // Input fields should be appropriately sized
      const incomeInput = page.locator('[data-testid="income-input"]')
      const inputBox = await incomeInput.boundingBox()
      expect(inputBox?.height).toBeGreaterThan(40)
      
      // Should handle mobile keyboard
      await incomeInput.click()
      await expect(incomeInput).toBeFocused()
    })
  })
})
