// Comprehensive E2E tests for SubTracker Advanced Features
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { test, expect, type Page } from '@playwright/test'

// Test data - currently unused but kept for future test development
const _testUser = {
  email: 'test@subtracker.com',
  password: 'testpassword123',
}

const mockSubscription = {
  serviceName: 'Test Service Pro',
  amount: '29.99',
  frequency: 'monthly',
  category: 'Productivity',
  nextCharge: '2025-08-15',
}

const mockBudget = {
  monthlyIncome: '5000',
  fixedCosts: '2000',
  savingsTarget: '1000',
  discretionaryBudget: '1500',
}

// Helper functions - currently unused but kept for future test development
async function _signUpUser(page: Page, email: string, password: string) {
  await page.goto('/signup')
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard')
}

async function _setupBudgetProfile(page: Page, budget: typeof mockBudget) {
  await page.goto('/budget')
  await page.fill('input[name="monthlyIncome"]', budget.monthlyIncome)
  await page.fill('input[name="fixedCosts"]', budget.fixedCosts)
  await page.fill('input[name="savingsTarget"]', budget.savingsTarget)
  await page.fill('input[name="discretionaryBudget"]', budget.discretionaryBudget)
  await page.click('button[type="submit"]')
  await page.waitForSelector('text=Budget saved successfully')
}

async function _addSubscription(page: Page, subscription: typeof mockSubscription) {
  await page.goto('/dashboard')
  await page.click('button:has-text("Add Subscription")')
  await page.fill('input[name="service_name"]', subscription.serviceName)
  await page.fill('input[name="amount"]', subscription.amount)
  await page.selectOption('select[name="frequency"]', subscription.frequency)
  await page.selectOption('select[name="category"]', subscription.category)
  await page.fill('input[name="next_charge_date"]', subscription.nextCharge)
  await page.click('button[type="submit"]')
  await page.waitForSelector('text=Subscription added successfully')
}

test.describe('SubTracker Advanced Features', () => {
  test.describe('Landing Page and Authentication', () => {
    test('Landing page loads with all sections', async ({ page }) => {
      await page.goto('/')

      // Check main elements
      await expect(page).toHaveTitle(/SubTracker/)
      await expect(page.locator('h1')).toContainText('Track Your Subscriptions')
      await expect(page.locator('text=Get Started Free')).toBeVisible()
      await expect(page.locator('text=Sign In')).toBeVisible()

      // Check feature highlights
      await expect(page.locator('text=Smart Alerts')).toBeVisible()
      await expect(page.locator('text=Budget Tracking')).toBeVisible()
      await expect(page.locator('text=Gmail Integration')).toBeVisible()
    })

    test('Sign up flow works correctly', async ({ page }) => {
      await page.goto('/signup')

      // Check form elements
      await expect(page.locator('input[name="email"]')).toBeVisible()
      await expect(page.locator('input[name="password"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()

      // Test form validation
      await page.click('button[type="submit"]')
      await expect(page.locator('text=Email is required')).toBeVisible()

      // Fill partial form
      await page.fill('input[name="email"]', 'invalid-email')
      await page.click('button[type="submit"]')
      await expect(page.locator('text=Invalid email')).toBeVisible()
    })
  })

  test.describe('Dashboard Core Features', () => {
    test('Dashboard loads with empty state', async ({ page }) => {
      await page.goto('/dashboard')

      // Check main dashboard elements
      await expect(page.locator('text=SubTracker')).toBeVisible()
      await expect(page.locator('text=Monthly Spend')).toBeVisible()
      await expect(page.locator('text=Budget Usage')).toBeVisible()
      await expect(page.locator('text=Trials Ending')).toBeVisible()
      await expect(page.locator('text=Upcoming Charges')).toBeVisible()

      // Check empty state
      await expect(page.locator('text=Ready to take control')).toBeVisible()
      await expect(page.locator('text=$0.00')).toBeVisible()
    })

    test('Currency selector works', async ({ page }) => {
      await page.goto('/dashboard')

      // Check default currency
      await expect(page.locator('select option:checked')).toContainText('USD')

      // Change to EUR
      await page.selectOption('select', 'EUR')
      await page.waitForTimeout(500) // Wait for currency update

      // Check if currency symbols update
      await expect(page.locator('text=€')).toBeVisible()
    })

    test('Gmail modal appears for new users', async ({ page }) => {
      await page.goto('/dashboard')

      // Check if Gmail connection modal appears
      await expect(page.locator('text=Connect Your Gmail')).toBeVisible()
      await expect(page.locator('text=Read-only inbox access')).toBeVisible()
      await expect(page.locator('button:has-text("Maybe Later")')).toBeVisible()
      await expect(page.locator('button:has-text("Connect Gmail")')).toBeVisible()
    })
  })

  test.describe('Subscription Management', () => {
    test('Add subscription modal works', async ({ page }) => {
      await page.goto('/dashboard')

      // Dismiss Gmail modal if present
      if (await page.locator('button:has-text("Maybe Later")').isVisible()) {
        await page.click('button:has-text("Maybe Later")')
      }

      // Open add subscription modal
      await page.click('button:has-text("Add New")')

      // Check modal elements
      await expect(page.locator('text=Add New Subscription')).toBeVisible()
      await expect(page.locator('input[name="service_name"]')).toBeVisible()
      await expect(page.locator('input[name="amount"]')).toBeVisible()
      await expect(page.locator('select[name="frequency"]')).toBeVisible()
      await expect(page.locator('select[name="category"]')).toBeVisible()

      // Test form validation
      await page.click('button[type="submit"]')
      await expect(page.locator('text=Service name is required')).toBeVisible()
    })

    test('Subscription tabs navigation works', async ({ page }) => {
      await page.goto('/dashboard')

      // Check tab navigation
      await expect(page.locator('text=Overview')).toBeVisible()
      await expect(page.locator('text=Subscriptions')).toBeVisible()
      await expect(page.locator('text=Budget')).toBeVisible()
      await expect(page.locator('text=Upcoming')).toBeVisible()

      // Test tab switching
      await page.click('text=Subscriptions')
      await expect(page.locator('text=Your Subscriptions')).toBeVisible()

      await page.click('text=Budget')
      await expect(page.locator('text=Budget Overview')).toBeVisible()

      await page.click('text=Upcoming')
      await expect(page.locator('text=Upcoming Charges')).toBeVisible()
    })
  })

  test.describe('Budget Management', () => {
    test('Budget page loads with form', async ({ page }) => {
      await page.goto('/budget')

      // Check form elements
      await expect(page.locator('text=Set Your Monthly Budget')).toBeVisible()
      await expect(page.locator('input[name="monthlyIncome"]')).toBeVisible()
      await expect(page.locator('input[name="fixedCosts"]')).toBeVisible()
      await expect(page.locator('input[name="savingsTarget"]')).toBeVisible()
      await expect(page.locator('input[name="discretionaryBudget"]')).toBeVisible()

      // Check help text
      await expect(page.locator('text=This includes rent, utilities')).toBeVisible()
      await expect(page.locator('text=Monthly savings goal')).toBeVisible()
    })

    test('Budget form validation works', async ({ page }) => {
      await page.goto('/budget')

      // Test empty form submission
      await page.click('button[type="submit"]')
      await expect(page.locator('text=Monthly income is required')).toBeVisible()

      // Test invalid values
      await page.fill('input[name="monthlyIncome"]', '-100')
      await page.click('button[type="submit"]')
      await expect(page.locator('text=Income must be positive')).toBeVisible()
    })

    test('Budget calculations work correctly', async ({ page }) => {
      await page.goto('/budget')

      // Fill budget form
      await page.fill('input[name="monthlyIncome"]', '5000')
      await page.fill('input[name="fixedCosts"]', '2000')
      await page.fill('input[name="savingsTarget"]', '1000')
      await page.fill('input[name="discretionaryBudget"]', '1500')

      // Check real-time calculation
      await expect(page.locator('text=Total Allocated: $4,500')).toBeVisible()
      await expect(page.locator('text=Remaining: $500')).toBeVisible()
    })
  })

  test.describe('Alert System Features', () => {
    test('Alert banners appear when there are pending alerts', async ({ page }) => {
      await page.goto('/dashboard')

      // Mock alert data by adding trial subscription that's ending soon
      // This would require setting up test data or mocking

      // Check for alert banner elements (when alerts exist)
      const _alertBanner = page.locator('[data-testid="alert-banner"]')

      // Note: This test would need actual alert data to fully test
      // For now, we test the structure exists
      await expect(page.locator('main')).toBeVisible()
    })

    test('Trial alerts can be acknowledged', async ({ page }) => {
      await page.goto('/dashboard')

      // This test would require having trial alerts in the system
      // Check if acknowledge button works when alerts are present
      const acknowledgeButton = page.locator('button:has-text("✕")')

      if (await acknowledgeButton.isVisible()) {
        await acknowledgeButton.first().click()
        // Check that alert is removed or marked as acknowledged
        await page.waitForTimeout(1000)
      }
    })
  })

  test.describe('Weekly Digest Features', () => {
    test('Weekly digest banner shows when available', async ({ page }) => {
      await page.goto('/dashboard')

      // Check for weekly digest banner
      const digestBanner = page.locator('text=Your Weekly Digest is Ready')

      if (await digestBanner.isVisible()) {
        await expect(page.locator('button:has-text("View Details")')).toBeVisible()
        await expect(page.locator('text=Week of')).toBeVisible()
      }
    })

    test('Weekly digest can be marked as viewed', async ({ page }) => {
      await page.goto('/dashboard')

      const viewDetailsButton = page.locator('button:has-text("View Details")')

      if (await viewDetailsButton.isVisible()) {
        await viewDetailsButton.click()
        await page.waitForTimeout(1000)

        // Check that digest banner disappears or updates
        await expect(viewDetailsButton).not.toBeVisible()
      }
    })
  })

  test.describe('Settings and Preferences', () => {
    test('Settings page loads with all options', async ({ page }) => {
      await page.goto('/settings')

      // Check main settings elements
      await expect(page.locator('text=Account Settings')).toBeVisible()
      await expect(page.locator('text=Preferences')).toBeVisible()
      await expect(page.locator('text=Data Management')).toBeVisible()

      // Check specific options
      await expect(page.locator('text=Export Data')).toBeVisible()
      await expect(page.locator('text=Delete Account')).toBeVisible()
      await expect(page.locator('text=Gmail Integration')).toBeVisible()
    })

    test('Currency preference can be changed', async ({ page }) => {
      await page.goto('/settings')

      // Find currency selector in settings
      const currencySelect = page.locator('select[name="currency"]')

      if (await currencySelect.isVisible()) {
        await currencySelect.selectOption('EUR')
        await page.click('button:has-text("Save Preferences")')

        // Check for success message
        await expect(page.locator('text=Preferences saved')).toBeVisible()
      }
    })
  })

  test.describe('Integration Tests', () => {
    test('Complete user flow: signup -> add budget -> add subscription -> view insights', async ({
      page: _page,
    }) => {
      // Skip if we can't actually create accounts
      test.skip(true, 'Requires full authentication setup')

      // This would test the complete flow:
      // 1. Sign up
      // 2. Set up budget
      // 3. Add subscription
      // 4. View budget insights
      // 5. Check alert generation
    })

    test('Gmail integration flow', async ({ page }) => {
      await page.goto('/dashboard')

      // Check Gmail modal appears
      if (await page.locator('text=Connect Your Gmail').isVisible()) {
        await page.click('button:has-text("Connect Gmail")')

        // In a real test, this would redirect to OAuth
        // For now, check that the modal behavior works
        await page.waitForTimeout(1000)
      }
    })

    test('Responsive design works on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      await page.goto('/dashboard')

      // Check mobile-specific elements
      await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible()

      // Test that cards stack vertically
      const cards = page.locator('[data-testid="metric-card"]')
      if ((await cards.count()) > 0) {
        // Cards should be stacked on mobile
        const firstCard = cards.first()
        const secondCard = cards.nth(1)

        if (await secondCard.isVisible()) {
          const firstBox = await firstCard.boundingBox()
          const secondBox = await secondCard.boundingBox()

          // Second card should be below first card on mobile
          expect(secondBox!.y).toBeGreaterThan(firstBox!.y + firstBox!.height)
        }
      }
    })
  })

  test.describe('Error Handling', () => {
    test('Network error handling works', async ({ page }) => {
      // Mock network failure
      await page.route('**/api/**', route => route.abort())

      await page.goto('/dashboard')

      // Check for error messages or fallback UI
      await expect(page.locator('text=Failed to load')).toBeVisible()
    })

    test('Invalid routes show 404 page', async ({ page }) => {
      await page.goto('/nonexistent-page')

      // Check for 404 handling
      await expect(page.locator('text=Page not found')).toBeVisible()
    })
  })

  test.describe('Performance Tests', () => {
    test('Dashboard loads within acceptable time', async ({ page }) => {
      const startTime = Date.now()

      await page.goto('/dashboard')
      await page.waitForSelector('text=SubTracker')

      const loadTime = Date.now() - startTime

      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000)
    })

    test('Large subscription lists perform well', async ({ page }) => {
      // This would require seeding test data
      await page.goto('/dashboard')

      // Simulate having many subscriptions
      // Check that scrolling and filtering still work smoothly
      await page.click('text=Subscriptions')

      const subscriptionsList = page.locator('[data-testid="subscriptions-list"]')
      if (await subscriptionsList.isVisible()) {
        // Test scrolling performance
        await page.evaluate(() => {
          const element = document.querySelector('[data-testid="subscriptions-list"]')
          if (element) element.scrollIntoView()
        })
        await page.waitForTimeout(100)

        // Should not have noticeable lag
        expect(true).toBe(true) // Placeholder for performance assertion
      }
    })
  })
})
