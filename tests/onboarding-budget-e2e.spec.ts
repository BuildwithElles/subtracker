import { test, expect } from '@playwright/test'
import { TestDataFactory } from './test-helpers'
import { AuthHelper } from './auth-helper'

/**
 * User Onboarding & Budget Setup E2E Tests
 * 
 * Tests the complete onboarding flow:
 * 1. OnboardingStep1: Gmail Connection with Supabase OAuth
 * 2. OnboardingStep2: Budget Setup with validation
 * 3. Progress indicators and navigation
 * 4. Error handling and recovery
 */

// Test data factory for onboarding flows
const OnboardingTestData = {
  createValidBudget: () => ({
    income: '5000',
    housing: '1500',
    food: '400',
    transportation: '300',
    entertainment: '200',
    savings: '800',
    currency: 'USD'
  }),
  
  createInvalidBudget: () => ({
    income: '-100', // Invalid negative income
    housing: '6000', // Exceeds income
    food: '',       // Empty required field
    transportation: 'abc', // Invalid non-numeric
    entertainment: '50',
    savings: '100',
    currency: ''    // Empty currency
  }),
  
  createPartialBudget: () => ({
    income: '3000',
    housing: '1000',
    food: '300',
    // Missing other fields
    currency: 'EUR'
  })
}

// Page helper class for onboarding interactions
class OnboardingPageHelpers {
  constructor(private page: any) {}

  // Navigation helpers
  async goToOnboarding() {
    await this.page.goto('/onboarding')
    await expect(this.page.locator('[data-testid="onboarding-container"]')).toBeVisible()
  }

  async goToOnboardingStep(step: number) {
    await this.page.goto(`/onboarding?step=${step}`)
    await this.waitForStepToLoad(step)
  }

  async waitForStepToLoad(step: number) {
    await expect(this.page.locator(`[data-testid="onboarding-step-${step}"]`)).toBeVisible()
  }

  // Progress indicator helpers
  async expectProgressStep(currentStep: number, totalSteps: number = 2) {
    // Check progress indicator
    await expect(this.page.locator('[data-testid="progress-indicator"]')).toBeVisible()
    await expect(this.page.locator(`[data-testid="progress-step-${currentStep}"]`)).toBeVisible()
    
    // Check step counter
    await expect(this.page.locator('[data-testid="step-counter"]')).toContainText(`${currentStep} of ${totalSteps}`)
  }

  // Gmail connection helpers (Step 1)
  async expectGmailConnectionStep() {
    await expect(this.page.locator('[data-testid="gmail-connection-step"]')).toBeVisible()
    await expect(this.page.locator('h1, h2').filter({ hasText: /connect.*gmail|gmail.*connection/i })).toBeVisible()
    await expect(this.page.locator('[data-testid="gmail-connect-button"]')).toBeVisible()
  }

  async clickConnectGmail() {
    await this.page.click('[data-testid="gmail-connect-button"]')
  }

  async clickSkipGmail() {
    const skipButton = this.page.locator('[data-testid="skip-gmail-button"]')
    if (await skipButton.count() > 0) {
      await skipButton.click()
    }
  }

  async expectGmailConnectedState() {
    await expect(this.page.locator('[data-testid="gmail-connected-status"]')).toBeVisible()
    await expect(this.page.locator('text="Gmail Connected", text="Successfully connected"')).toBeVisible()
  }

  async expectGmailErrorState() {
    await expect(this.page.locator('[data-testid="gmail-error-message"]')).toBeVisible()
    await expect(this.page.locator('[role="alert"]')).toBeVisible()
  }

  // Budget setup helpers (Step 2)
  async expectBudgetSetupStep() {
    await expect(this.page.locator('[data-testid="budget-setup-step"]')).toBeVisible()
    await expect(this.page.locator('h1').filter({ hasText: /let.*set.*budget|budget.*setup/i }).first()).toBeVisible()
  }

  async fillBudgetForm(budgetData: any) {
    // Fill income
    if (budgetData.income) {
      await this.page.fill('[data-testid="income-input"]', budgetData.income)
    }

    // Fill expense categories
    const categories = ['housing', 'food', 'transportation', 'entertainment', 'savings']
    for (const category of categories) {
      if (budgetData[category]) {
        await this.page.fill(`[data-testid="${category}-input"]`, budgetData[category])
      }
    }

    // Select currency
    if (budgetData.currency) {
      await this.page.selectOption('[data-testid="currency-select"]', budgetData.currency)
    }
  }

  async expectBudgetValidationError(field: string) {
    await expect(this.page.locator(`[data-testid="${field}-error"]`)).toBeVisible()
    await expect(this.page.locator('.error, [role="alert"]').filter({ hasText: new RegExp(field, 'i') })).toBeVisible()
  }

  async expectBudgetSummary(budgetData: any) {
    // Check income display
    await expect(this.page.locator('[data-testid="budget-income-display"]')).toContainText(budgetData.income)
    
    // Check total expenses calculation
    const totalExpenses = (parseInt(budgetData.housing) || 0) + 
                         (parseInt(budgetData.food) || 0) + 
                         (parseInt(budgetData.transportation) || 0) + 
                         (parseInt(budgetData.entertainment) || 0)
    
    await expect(this.page.locator('[data-testid="budget-total-expenses"]')).toContainText(totalExpenses.toString())
    
    // Check remaining budget
    const remaining = parseInt(budgetData.income) - totalExpenses - (parseInt(budgetData.savings) || 0)
    await expect(this.page.locator('[data-testid="budget-remaining"]')).toContainText(remaining.toString())
  }

  // Navigation helpers
  async clickNextStep() {
    await this.page.click('[data-testid="next-step-button"]')
  }

  async clickPreviousStep() {
    await this.page.click('[data-testid="previous-step-button"]')
  }

  async clickFinishOnboarding() {
    await this.page.click('[data-testid="finish-onboarding-button"]')
  }

  // Loading and error states
  async expectLoadingState() {
    await expect(this.page.locator('[data-testid="loading-spinner"], .loading')).toBeVisible()
  }

  async expectSuccessMessage() {
    await expect(this.page.locator('[data-testid="success-message"], [role="alert"]').filter({ hasText: /success|completed/i })).toBeVisible()
  }

  async expectErrorMessage(message?: string) {
    const errorLocator = this.page.locator('[data-testid="error-message"], [role="alert"]')
    await expect(errorLocator).toBeVisible()
    
    if (message) {
      await expect(errorLocator).toContainText(message)
    }
  }
}

test.describe('🚀 User Onboarding & Budget Setup E2E Tests', () => {
  let onboardingHelper: OnboardingPageHelpers
  let authHelper: AuthHelper

  test.beforeEach(async ({ page }) => {
    onboardingHelper = new OnboardingPageHelpers(page)
    authHelper = new AuthHelper(page)
    
    // Set up test mode authentication
    await authHelper.authenticateTestUser()
  })

  test.describe('📧 OnboardingStep1: Gmail Connection', () => {
    test('should display Gmail connection step correctly', async ({ page }) => {
      await onboardingHelper.goToOnboarding()
      
      // Should show step 1
      await onboardingHelper.expectProgressStep(1, 2)
      await onboardingHelper.expectGmailConnectionStep()
      
      // Should have connect and skip options
      await expect(page.locator('[data-testid="gmail-connect-button"]')).toBeVisible()
      await expect(page.locator('[data-testid="skip-gmail-button"]')).toBeVisible()
    })

    test('should handle successful Gmail OAuth connection', async ({ page }) => {
      await onboardingHelper.goToOnboarding()
      
      // Mock successful OAuth response
      await page.route('**/auth/v1/authorize**', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ access_token: 'test_token', provider: 'google' })
        })
      })

      // Mock Supabase OAuth success
      await page.addInitScript(() => {
        (window as any).mockGmailSuccess = true
      })

      await onboardingHelper.clickConnectGmail()
      
      // Should show loading state
      await onboardingHelper.expectLoadingState()
      
      // Should show success state
      await onboardingHelper.expectGmailConnectedState()
      
      // Should enable next step
      await expect(page.locator('[data-testid="next-step-button"]')).toBeEnabled()
    })

    test('should handle Gmail OAuth connection failure', async ({ page }) => {
      await onboardingHelper.goToOnboarding()
      
      // Mock OAuth failure
      await page.route('**/auth/v1/authorize**', route => {
        route.fulfill({
          status: 400,
          body: JSON.stringify({ error: 'access_denied' })
        })
      })

      await onboardingHelper.clickConnectGmail()
      
      // Should show error state
      await onboardingHelper.expectGmailErrorState()
      
      // Should offer retry option
      await expect(page.locator('[data-testid="retry-gmail-button"]')).toBeVisible()
      
      // Should still allow skip or continue
      await expect(page.locator('[data-testid="skip-gmail-button"]')).toBeVisible()
    })

    test('should allow skipping Gmail connection', async ({ page }) => {
      await onboardingHelper.goToOnboarding()
      
      await onboardingHelper.clickSkipGmail()
      
      // Should proceed to next step
      await onboardingHelper.waitForStepToLoad(2)
      await onboardingHelper.expectProgressStep(2, 2)
      await onboardingHelper.expectBudgetSetupStep()
    })

    test('should handle Gmail OAuth popup flow', async ({ page, context }) => {
      await onboardingHelper.goToOnboarding()
      
      // Listen for popup
      const [popup] = await Promise.all([
        context.waitForEvent('page'),
        onboardingHelper.clickConnectGmail()
      ])

      // Mock successful OAuth in popup
      await popup.goto('http://localhost:3000/auth/callback?code=success&provider=google')
      await popup.close()

      // Should show success state in main window
      await onboardingHelper.expectGmailConnectedState()
    })

    test('should persist Gmail connection across page refresh', async ({ page }) => {
      await onboardingHelper.goToOnboarding()
      
      // Mock connected state
      await page.addInitScript(() => {
        window.localStorage.setItem('gmail-connected', 'true')
      })

      await page.reload()
      
      // Should maintain connected state
      await onboardingHelper.expectGmailConnectedState()
      await expect(page.locator('[data-testid="next-step-button"]')).toBeEnabled()
    })
  })

  test.describe('💰 OnboardingStep2: Budget Setup', () => {
    test.beforeEach(async ({ page }) => {
      // Start from budget step
      await onboardingHelper.goToOnboardingStep(2)
    })

    test('should display budget setup step correctly', async ({ page }) => {
      await onboardingHelper.expectProgressStep(2, 2)
      await onboardingHelper.expectBudgetSetupStep()
      
      // Should have all required form fields
      await expect(page.locator('[data-testid="income-input"]')).toBeVisible()
      await expect(page.locator('[data-testid="housing-input"]')).toBeVisible()
      await expect(page.locator('[data-testid="food-input"]')).toBeVisible()
      await expect(page.locator('[data-testid="transportation-input"]')).toBeVisible()
      await expect(page.locator('[data-testid="entertainment-input"]')).toBeVisible()
      await expect(page.locator('[data-testid="savings-input"]')).toBeVisible()
      await expect(page.locator('[data-testid="currency-select"]')).toBeVisible()
    })

    test('should handle valid budget setup', async ({ page }) => {
      const validBudget = OnboardingTestData.createValidBudget()
      
      await onboardingHelper.fillBudgetForm(validBudget)
      
      // Should show budget summary
      await onboardingHelper.expectBudgetSummary(validBudget)
      
      // Should enable finish button
      await expect(page.locator('[data-testid="finish-onboarding-button"]')).toBeEnabled()
      
      // Mock successful budget save
      await page.route('**/api/budget', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true, id: 'budget-123' })
        })
      })

      await onboardingHelper.clickFinishOnboarding()
      
      // Should show success and redirect
      await onboardingHelper.expectSuccessMessage()
      await expect(page).toHaveURL(/\/dashboard/)
    })

    test('should validate budget form inputs', async ({ page }) => {
      const invalidBudget = OnboardingTestData.createInvalidBudget()
      
      await onboardingHelper.fillBudgetForm(invalidBudget)
      await onboardingHelper.clickFinishOnboarding()
      
      // Should show validation errors
      await onboardingHelper.expectBudgetValidationError('income')
      await onboardingHelper.expectBudgetValidationError('food')
      await onboardingHelper.expectBudgetValidationError('transportation')
      await onboardingHelper.expectBudgetValidationError('currency')
      
      // Should not proceed
      await expect(page).toHaveURL(/\/onboarding/)
    })

    test('should show real-time budget calculations', async ({ page }) => {
      const budget = OnboardingTestData.createValidBudget()
      
      // Fill income first
      await page.fill('[data-testid="income-input"]', budget.income)
      
      // Add expenses one by one and check calculations
      await page.fill('[data-testid="housing-input"]', budget.housing)
      await expect(page.locator('[data-testid="budget-remaining"]')).toContainText('3500') // 5000 - 1500
      
      await page.fill('[data-testid="food-input"]', budget.food)
      await expect(page.locator('[data-testid="budget-remaining"]')).toContainText('3100') // 5000 - 1500 - 400
      
      // Check percentage indicators
      await expect(page.locator('[data-testid="housing-percentage"]')).toContainText('30%') // 1500/5000
    })

    test('should warn about budget imbalances', async ({ page }) => {
      await page.fill('[data-testid="income-input"]', '2000')
      await page.fill('[data-testid="housing-input"]', '2500') // Exceeds income
      
      // Should show warning
      await expect(page.locator('[data-testid="budget-warning"]')).toBeVisible()
      await expect(page.locator('[role="alert"]').filter({ hasText: /exceeds.*income|over.*budget/i })).toBeVisible()
      
      // Should suggest adjustments
      await expect(page.locator('[data-testid="budget-suggestion"]')).toBeVisible()
    })

    test('should handle currency selection', async ({ page }) => {
      // Test different currencies
      const currencies = ['USD', 'EUR', 'GBP', 'CAD']
      
      for (const currency of currencies) {
        await page.selectOption('[data-testid="currency-select"]', currency)
        await expect(page.locator('[data-testid="currency-display"]')).toContainText(currency)
        
        // Should update currency symbols in form
        await expect(page.locator('[data-testid="income-input"]')).toHaveAttribute('placeholder', new RegExp(currency))
      }
    })

    test('should save budget to Supabase', async ({ page }) => {
      await onboardingHelper.goToOnboardingStep(2)
      
      const validBudget = OnboardingTestData.createValidBudget()
      
      await onboardingHelper.fillBudgetForm(validBudget)
      await onboardingHelper.clickFinishOnboarding()
      
      // Should redirect to dashboard after saving
      await expect(page).toHaveURL(/\/dashboard/)
    })

    test('should handle budget save failure', async ({ page }) => {
      const validBudget = OnboardingTestData.createValidBudget()
      
      // Mock Supabase failure
      await page.route('**/rest/v1/budgets', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Database connection failed' })
        })
      })

      await onboardingHelper.fillBudgetForm(validBudget)
      await onboardingHelper.clickFinishOnboarding()
      
      // Should show error message
      await onboardingHelper.expectErrorMessage('Failed to save budget')
      
      // Should offer retry
      await expect(page.locator('[data-testid="retry-save-button"]')).toBeVisible()
      
      // Should remain on onboarding
      await expect(page).toHaveURL(/\/onboarding/)
    })
  })

  test.describe('🔄 Complete Onboarding Flow', () => {
    test('should complete full onboarding flow with Gmail and budget', async ({ page }) => {
      await onboardingHelper.goToOnboarding()
      
      // Step 1: Gmail Connection
      await onboardingHelper.expectProgressStep(1, 2)
      
      // Mock Gmail success
      await page.addInitScript(() => {
        (window as any).mockGmailSuccess = true
      })
      
      await onboardingHelper.clickConnectGmail()
      await onboardingHelper.expectGmailConnectedState()
      await onboardingHelper.clickNextStep()
      
      // Step 2: Budget Setup
      await onboardingHelper.expectProgressStep(2, 2)
      await onboardingHelper.expectBudgetSetupStep()
      
      const validBudget = OnboardingTestData.createValidBudget()
      await onboardingHelper.fillBudgetForm(validBudget)
      
      // Mock successful save
      await page.route('**/api/budget', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true })
        })
      })
      
      await onboardingHelper.clickFinishOnboarding()
      
      // Should redirect to dashboard
      await expect(page).toHaveURL(/\/dashboard/)
      await onboardingHelper.expectSuccessMessage()
    })

    test('should complete onboarding flow skipping Gmail', async ({ page }) => {
      await onboardingHelper.goToOnboarding()
      
      // Skip Gmail
      await onboardingHelper.clickSkipGmail()
      
      // Go directly to budget
      await onboardingHelper.expectBudgetSetupStep()
      
      const validBudget = OnboardingTestData.createValidBudget()
      await onboardingHelper.fillBudgetForm(validBudget)
      await onboardingHelper.clickFinishOnboarding()
      
      await expect(page).toHaveURL(/\/dashboard/)
    })

    test('should allow navigation between steps', async ({ page }) => {
      await onboardingHelper.goToOnboarding()
      
      // Start at step 1, go to step 2
      await onboardingHelper.clickNextStep()
      await onboardingHelper.expectProgressStep(2, 2)
      
      // Go back to step 1
      await onboardingHelper.clickPreviousStep()
      await onboardingHelper.expectProgressStep(1, 2)
      await onboardingHelper.expectGmailConnectionStep()
    })

    test('should persist progress across browser refresh', async ({ page }) => {
      await onboardingHelper.goToOnboarding()
      
      // Complete step 1
      await page.addInitScript(() => {
        window.localStorage.setItem('onboarding-step', '2')
        window.localStorage.setItem('gmail-connected', 'true')
      })

      await page.reload()
      
      // Should restore to step 2
      await onboardingHelper.expectProgressStep(2, 2)
      await onboardingHelper.expectBudgetSetupStep()
    })

    test('should handle onboarding timeout', async ({ page }) => {
      await onboardingHelper.goToOnboarding()
      
      // Mock slow network
      await page.route('**/api/**', route => {
        setTimeout(() => route.continue(), 10000) // 10 second delay
      })

      const validBudget = OnboardingTestData.createValidBudget()
      await onboardingHelper.fillBudgetForm(validBudget)
      await onboardingHelper.clickFinishOnboarding()
      
      // Should show timeout message
      await expect(page.locator('[data-testid="timeout-message"]')).toBeVisible({ timeout: 15000 })
    })
  })

  test.describe('📱 Responsive Design & Accessibility', () => {
    test('should work correctly on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await onboardingHelper.goToOnboarding()
      
      // Progress indicator should be mobile-friendly
      await expect(page.locator('[data-testid="progress-indicator"]')).toBeVisible()
      
      // Forms should be responsive
      await onboardingHelper.goToOnboardingStep(2)
      await expect(page.locator('[data-testid="budget-form"]')).toBeVisible()
      
      // Buttons should be touch-friendly
      const nextButton = page.locator('[data-testid="next-step-button"]')
      const box = await nextButton.boundingBox()
      expect(box?.height).toBeGreaterThan(40) // Minimum touch target
    })

    test('should be keyboard accessible', async ({ page }) => {
      await onboardingHelper.goToOnboarding()
      
      // Should be able to navigate with tab
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      
      // Should be able to activate buttons with Enter
      await page.keyboard.press('Enter')
      
      // Form fields should be keyboard accessible
      await onboardingHelper.goToOnboardingStep(2)
      await page.keyboard.press('Tab')
      await page.keyboard.type('5000')
      
      await expect(page.locator('[data-testid="income-input"]')).toHaveValue('5000')
    })

    test('should have proper ARIA labels and roles', async ({ page }) => {
      await onboardingHelper.goToOnboarding()
      
      // Progress indicator should have proper ARIA
      await expect(page.locator('[data-testid="progress-indicator"]')).toHaveAttribute('role', 'progressbar')
      
      // Forms should have proper labels
      await onboardingHelper.goToOnboardingStep(2)
      await expect(page.locator('[data-testid="income-input"]')).toHaveAttribute('aria-label')
      
      // Error messages should be announced
      const errorElements = page.locator('[role="alert"]')
      await expect(errorElements.first()).toHaveAttribute('role', 'alert')
    })
  })

  test.describe('🔒 Security & Error Recovery', () => {
    test('should handle network connectivity issues', async ({ page }) => {
      await onboardingHelper.goToOnboarding()
      
      // Simulate network failure
      await page.route('**/*', route => route.abort('failed'))
      
      const validBudget = OnboardingTestData.createValidBudget()
      await onboardingHelper.fillBudgetForm(validBudget)
      await onboardingHelper.clickFinishOnboarding()
      
      // Should show network error
      await onboardingHelper.expectErrorMessage('Network error')
      
      // Should offer retry
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()
    })

    test('should sanitize budget inputs', async ({ page }) => {
      await onboardingHelper.goToOnboardingStep(2)
      
      // Try XSS attack
      await page.fill('[data-testid="income-input"]', '<script>alert("xss")</script>')
      
      // Should sanitize input
      const value = await page.locator('[data-testid="income-input"]').inputValue()
      expect(value).not.toContain('<script>')
    })

    test('should validate user authentication', async ({ page }) => {
      // Clear auth state
      await page.addInitScript(() => {
        window.localStorage.removeItem('auth-state')
      })

      await page.goto('/onboarding')
      
      // Should redirect to login
      await expect(page).toHaveURL(/\/login|\/signin/)
    })
  })
})
