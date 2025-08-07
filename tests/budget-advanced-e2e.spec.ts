import { test, expect } from '@playwright/test'

/**
 * Budget Setup E2E Tests - Advanced Financial Scenarios
 * 
 * This file covers complex budget scenarios, calculations,
 * and financial planning features in the onboarding flow.
 */

test.describe('💰 Advanced Budget Setup E2E Tests', () => {

  test.describe('🧮 Budget Calculations & Validations', () => {
    test('should calculate budget percentages and provide recommendations', async ({ page }) => {
      await page.goto('/onboarding?step=2')
      
      // Set up a typical budget scenario
      await page.fill('[data-testid="income-input"]', '5000')
      await page.fill('[data-testid="housing-input"]', '2000') // 40% - high but reasonable
      await page.fill('[data-testid="food-input"]', '500')     // 10% - good
      await page.fill('[data-testid="transportation-input"]', '400') // 8% - good
      await page.fill('[data-testid="entertainment-input"]', '300')  // 6% - good
      await page.fill('[data-testid="savings-input"]', '800')        // 16% - excellent
      
      // Should show percentage breakdown
      await expect(page.locator('[data-testid="housing-percentage"]')).toContainText('40%')
      await expect(page.locator('[data-testid="savings-percentage"]')).toContainText('16%')
      
      // Should provide category-specific feedback
      await expect(page.locator('[data-testid="housing-feedback"]')).toContainText('warning')
      await expect(page.locator('[data-testid="savings-feedback"]')).toContainText('excellent')
      
      // Should show recommended ranges
      await expect(page.locator('[data-testid="housing-recommendation"]')).toContainText('25-30%')
      await expect(page.locator('[data-testid="savings-recommendation"]')).toContainText('20%')
    })

    test('should handle complex multi-currency scenarios', async ({ page }) => {
      await page.goto('/onboarding?step=2')
      
      // Test EUR currency
      await page.selectOption('[data-testid="currency-select"]', 'EUR')
      await page.fill('[data-testid="income-input"]', '4000')
      
      // Should update all currency displays
      await expect(page.locator('[data-testid="income-display"]')).toContainText('€4,000')
      
      // Test conversion warnings for unusual amounts
      await page.fill('[data-testid="income-input"]', '100') // Very low income
      await expect(page.locator('[data-testid="currency-warning"]')).toBeVisible()
      await expect(page.locator('[data-testid="currency-warning"]')).toContainText('unusually low')
      
      // Test different currency formatting
      await page.selectOption('[data-testid="currency-select"]', 'JPY')
      await page.fill('[data-testid="income-input"]', '500000') // Typical JPY amount
      await expect(page.locator('[data-testid="income-display"]')).toContainText('¥500,000')
    })

    test('should provide intelligent budget suggestions based on income level', async ({ page }) => {
      await page.goto('/onboarding?step=2')
      
      // Test low income scenario
      await page.fill('[data-testid="income-input"]', '2000')
      await page.click('[data-testid="suggest-budget-button"]')
      
      // Should suggest appropriate amounts for low income
      await expect(page.locator('[data-testid="suggested-housing"]')).toHaveValue('600') // 30%
      await expect(page.locator('[data-testid="suggested-food"]')).toHaveValue('300')    // 15%
      await expect(page.locator('[data-testid="suggested-savings"]')).toHaveValue('200') // 10%
      
      // Test high income scenario
      await page.fill('[data-testid="income-input"]', '10000')
      await page.click('[data-testid="suggest-budget-button"]')
      
      // Should suggest higher savings for high income
      await expect(page.locator('[data-testid="suggested-savings"]')).toHaveValue('2000') // 20%
      await expect(page.locator('[data-testid="suggested-housing"]')).toHaveValue('2500') // 25%
    })

    test('should handle budget adjustments with real-time feedback', async ({ page }) => {
      await page.goto('/onboarding?step=2')
      
      await page.fill('[data-testid="income-input"]', '4000')
      await page.fill('[data-testid="housing-input"]', '2000')
      
      // Should show immediate overspending warning
      await expect(page.locator('[data-testid="housing-warning"]')).toBeVisible()
      await expect(page.locator('[data-testid="housing-warning"]')).toContainText('50%')
      
      // Adjust housing down
      await page.fill('[data-testid="housing-input"]', '1200')
      
      // Warning should disappear
      await expect(page.locator('[data-testid="housing-warning"]')).not.toBeVisible()
      await expect(page.locator('[data-testid="housing-feedback"]')).toContainText('good')
      
      // Should update total calculations instantly
      await expect(page.locator('[data-testid="total-expenses"]')).toContainText('1200')
      await expect(page.locator('[data-testid="remaining-budget"]')).toContainText('2800')
    })

    test('should validate extreme budget scenarios', async ({ page }) => {
      await page.goto('/onboarding?step=2')
      
      // Test extremely high income
      await page.fill('[data-testid="income-input"]', '1000000')
      await expect(page.locator('[data-testid="income-verification"]')).toBeVisible()
      await expect(page.locator('[data-testid="income-verification"]')).toContainText('confirm this amount')
      
      // Test zero income
      await page.fill('[data-testid="income-input"]', '0')
      await expect(page.locator('[data-testid="income-error"]')).toContainText('greater than zero')
      
      // Test negative expenses
      await page.fill('[data-testid="housing-input"]', '-500')
      await expect(page.locator('[data-testid="housing-error"]')).toContainText('positive amount')
      
      // Test unrealistic ratios
      await page.fill('[data-testid="income-input"]', '1000')
      await page.fill('[data-testid="housing-input"]', '5000') // 500% of income
      await expect(page.locator('[data-testid="ratio-error"]')).toContainText('exceeds your income')
    })
  })

  test.describe('📊 Budget Analytics & Insights', () => {
    test('should provide subscription budget allocation insights', async ({ page }) => {
      await page.goto('/onboarding?step=2')
      
      await page.fill('[data-testid="income-input"]', '5000')
      await page.fill('[data-testid="entertainment-input"]', '200')
      
      // Should calculate subscription budget allocation
      await expect(page.locator('[data-testid="subscription-allocation"]')).toBeVisible()
      await expect(page.locator('[data-testid="recommended-subscription-budget"]')).toContainText('50') // 25% of entertainment
      
      // Should show comparison with typical users
      await expect(page.locator('[data-testid="subscription-comparison"]')).toContainText('Similar users spend')
      
      // Should warn about subscription creep
      await page.fill('[data-testid="entertainment-input"]', '50') // Very low entertainment budget
      await expect(page.locator('[data-testid="subscription-warning"]')).toContainText('room for subscriptions')
    })

    test('should calculate financial health score', async ({ page }) => {
      await page.goto('/onboarding?step=2')
      
      // Excellent budget scenario
      await page.fill('[data-testid="income-input"]', '5000')
      await page.fill('[data-testid="housing-input"]', '1250')     // 25%
      await page.fill('[data-testid="food-input"]', '500')        // 10%
      await page.fill('[data-testid="transportation-input"]', '300') // 6%
      await page.fill('[data-testid="entertainment-input"]', '200')  // 4%
      await page.fill('[data-testid="savings-input"]', '1000')       // 20%
      
      // Should calculate high health score
      await expect(page.locator('[data-testid="financial-health-score"]')).toBeVisible()
      await expect(page.locator('[data-testid="health-score-value"]')).toContainText(/[8-9][0-9]|100/) // 80-100
      await expect(page.locator('[data-testid="health-score-label"]')).toContainText('Excellent')
      
      // Should provide specific strengths
      await expect(page.locator('[data-testid="budget-strengths"]')).toContainText('High savings rate')
      await expect(page.locator('[data-testid="budget-strengths"]')).toContainText('Reasonable housing costs')
      
      // Poor budget scenario
      await page.fill('[data-testid="housing-input"]', '2500')     // 50%
      await page.fill('[data-testid="savings-input"]', '0')        // 0%
      
      // Should calculate low health score
      await expect(page.locator('[data-testid="health-score-value"]')).toContainText(/[1-4][0-9]/) // 10-49
      await expect(page.locator('[data-testid="health-score-label"]')).toContainText('Needs Improvement')
      
      // Should provide specific recommendations
      await expect(page.locator('[data-testid="budget-recommendations"]')).toContainText('Reduce housing costs')
      await expect(page.locator('[data-testid="budget-recommendations"]')).toContainText('Increase savings')
    })

    test('should provide emergency fund recommendations', async ({ page }) => {
      await page.goto('/onboarding?step=2')
      
      await page.fill('[data-testid="income-input"]', '4000')
      await page.fill('[data-testid="housing-input"]', '1200')
      await page.fill('[data-testid="food-input"]', '400')
      await page.fill('[data-testid="transportation-input"]', '300')
      
      // Should calculate monthly expenses
      const monthlyExpenses = 1200 + 400 + 300 // 1900
      
      // Should recommend 3-6 months emergency fund
      await expect(page.locator('[data-testid="emergency-fund-recommendation"]')).toBeVisible()
      await expect(page.locator('[data-testid="emergency-fund-min"]')).toContainText('5,700') // 3 months
      await expect(page.locator('[data-testid="emergency-fund-ideal"]')).toContainText('11,400') // 6 months
      
      // Should show how long to build emergency fund
      await page.fill('[data-testid="savings-input"]', '400')
      await expect(page.locator('[data-testid="emergency-fund-timeline"]')).toContainText('14 months') // 5700/400
      
      // Should provide acceleration tips
      await expect(page.locator('[data-testid="emergency-fund-tips"]')).toContainText('automatic transfers')
    })

    test('should calculate subscription affordability', async ({ page }) => {
      await page.goto('/onboarding?step=2')
      
      await page.fill('[data-testid="income-input"]', '3000')
      await page.fill('[data-testid="housing-input"]', '900')
      await page.fill('[data-testid="food-input"]', '400')
      await page.fill('[data-testid="transportation-input"]', '300')
      await page.fill('[data-testid="savings-input"]', '300')
      
      // Should calculate available subscription budget
      const remainingBudget = 3000 - 900 - 400 - 300 - 300 // 1100
      
      await expect(page.locator('[data-testid="subscription-budget-available"]')).toContainText('1100')
      
      // Should recommend subscription limit
      await expect(page.locator('[data-testid="recommended-subscription-limit"]')).toContainText('220') // 20% of remaining
      
      // Should warn about subscription limits
      await expect(page.locator('[data-testid="subscription-guidance"]')).toContainText('maximum recommended')
      
      // Should suggest subscription categories
      await expect(page.locator('[data-testid="subscription-categories"]')).toContainText('Streaming')
      await expect(page.locator('[data-testid="subscription-categories"]')).toContainText('Productivity')
    })
  })

  test.describe('💾 Budget Persistence & Recovery', () => {
    test('should save partial budget progress', async ({ page }) => {
      await page.goto('/onboarding?step=2')
      
      // Fill partial budget
      await page.fill('[data-testid="income-input"]', '4500')
      await page.fill('[data-testid="housing-input"]', '1350')
      await page.selectOption('[data-testid="currency-select"]', 'CAD')
      
      // Mock auto-save
      await page.route('**/api/budget/draft', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ 
            success: true, 
            draft_id: 'draft_456',
            saved_at: new Date().toISOString()
          })
        })
      })
      
      // Should auto-save after delay
      await page.waitForTimeout(2000)
      await expect(page.locator('[data-testid="auto-save-indicator"]')).toContainText('Saved')
      
      // Refresh page
      await page.reload()
      
      // Should restore values
      await expect(page.locator('[data-testid="income-input"]')).toHaveValue('4500')
      await expect(page.locator('[data-testid="housing-input"]')).toHaveValue('1350')
      await expect(page.locator('[data-testid="currency-select"]')).toHaveValue('CAD')
    })

    test('should handle budget save failures gracefully', async ({ page }) => {
      await page.goto('/onboarding?step=2')
      
      // Fill complete budget
      await page.fill('[data-testid="income-input"]', '4000')
      await page.fill('[data-testid="housing-input"]', '1000')
      await page.fill('[data-testid="savings-input"]', '400')
      
      // Mock save failure
      await page.route('**/api/budget', route => {
        route.fulfill({
          status: 503,
          body: JSON.stringify({ 
            error: 'Service temporarily unavailable',
            retry_after: 30
          })
        })
      })
      
      await page.click('[data-testid="finish-onboarding-button"]')
      
      // Should show retry message
      await expect(page.locator('[data-testid="save-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="save-error"]')).toContainText('temporarily unavailable')
      
      // Should offer to retry in 30 seconds
      await expect(page.locator('[data-testid="retry-countdown"]')).toContainText('30')
      
      // Should preserve all form data
      await expect(page.locator('[data-testid="income-input"]')).toHaveValue('4000')
      await expect(page.locator('[data-testid="housing-input"]')).toHaveValue('1000')
      
      // Should enable local storage backup
      await expect(page.locator('[data-testid="local-backup-notice"]')).toContainText('saved locally')
    })

    test('should validate budget data integrity', async ({ page }) => {
      await page.goto('/onboarding?step=2')
      
      // Fill budget with specific values
      await page.fill('[data-testid="income-input"]', '5000')
      await page.fill('[data-testid="housing-input"]', '1500')
      await page.fill('[data-testid="food-input"]', '600')
      await page.fill('[data-testid="transportation-input"]', '400')
      await page.fill('[data-testid="entertainment-input"]', '300')
      await page.fill('[data-testid="savings-input"]', '800')
      await page.selectOption('[data-testid="currency-select"]', 'USD')
      
      // Mock successful save with returned data
      await page.route('**/api/budget', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ 
            success: true,
            budget: {
              id: 'budget_789',
              income: 5000,
              housing: 1500,
              food: 600,
              transportation: 400,
              entertainment: 300,
              savings: 800,
              currency: 'USD',
              total_expenses: 3600,
              remaining: 1400
            }
          })
        })
      })
      
      await page.click('[data-testid="finish-onboarding-button"]')
      
      // Should validate calculations match server
      await expect(page.locator('[data-testid="budget-confirmation"]')).toBeVisible()
      await expect(page.locator('[data-testid="confirmed-total-expenses"]')).toContainText('$3,600')
      await expect(page.locator('[data-testid="confirmed-remaining"]')).toContainText('$1,400')
      
      // Should show budget ID for reference
      await expect(page.locator('[data-testid="budget-id"]')).toContainText('budget_789')
    })

    test('should handle concurrent budget editing', async ({ page, context }) => {
      // Simulate user editing budget in two tabs
      const page2 = await context.newPage()
      
      await page.goto('/onboarding?step=2')
      await page2.goto('/onboarding?step=2')
      
      // Fill different values in each tab
      await page.fill('[data-testid="income-input"]', '4000')
      await page2.fill('[data-testid="income-input"]', '4500')
      
      // Save from first tab
      await page.route('**/api/budget', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true, version: 1 })
        })
      })
      
      await page.click('[data-testid="finish-onboarding-button"]')
      
      // Try to save from second tab
      await page2.route('**/api/budget', route => {
        route.fulfill({
          status: 409,
          body: JSON.stringify({ 
            error: 'Budget was modified by another session',
            current_version: 1
          })
        })
      })
      
      await page2.click('[data-testid="finish-onboarding-button"]')
      
      // Should show conflict resolution
      await expect(page2.locator('[data-testid="conflict-resolution"]')).toBeVisible()
      await expect(page2.locator('[data-testid="conflict-message"]')).toContainText('modified in another window')
      
      // Should offer to reload and retry
      await expect(page2.locator('[data-testid="reload-and-retry-button"]')).toBeVisible()
    })
  })

  test.describe('🎯 Integration with Subscription Detection', () => {
    test('should prepare budget for subscription analysis', async ({ page }) => {
      await page.goto('/onboarding?step=2')
      
      // Complete budget setup
      await page.fill('[data-testid="income-input"]', '4000')
      await page.fill('[data-testid="entertainment-input"]', '200')
      await page.fill('[data-testid="housing-input"]', '1200')
      await page.fill('[data-testid="savings-input"]', '600')
      
      // Mock budget save with subscription analysis prep
      await page.route('**/api/budget', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ 
            success: true,
            budget_id: 'budget_123',
            subscription_analysis_ready: true,
            recommended_subscription_categories: ['streaming', 'productivity', 'news']
          })
        })
      })
      
      await page.click('[data-testid="finish-onboarding-button"]')
      
      // Should show subscription analysis preview
      await expect(page.locator('[data-testid="subscription-preview"]')).toBeVisible()
      await expect(page.locator('[data-testid="subscription-categories"]')).toContainText('streaming')
      
      // Should show next steps
      await expect(page.locator('[data-testid="next-steps"]')).toContainText('scan for subscriptions')
      
      // Should navigate to dashboard with budget context
      await expect(page).toHaveURL(/\/dashboard/)
      await expect(page.locator('[data-testid="budget-context-banner"]')).toBeVisible()
    })

    test('should integrate Gmail subscription detection with budget', async ({ page }) => {
      // Assume Gmail was connected in step 1
      await page.goto('/onboarding?step=2')
      
      // Complete budget
      await page.fill('[data-testid="income-input"]', '3500')
      await page.fill('[data-testid="entertainment-input"]', '150')
      
      // Mock save with Gmail subscription detection
      await page.route('**/api/budget', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ 
            success: true,
            gmail_connected: true,
            detected_subscriptions: [
              { name: 'Netflix', amount: 15.99, category: 'streaming' },
              { name: 'Spotify', amount: 9.99, category: 'music' },
              { name: 'Adobe Creative', amount: 52.99, category: 'productivity' }
            ],
            total_detected: 78.97
          })
        })
      })
      
      await page.click('[data-testid="finish-onboarding-button"]')
      
      // Should show detected subscriptions summary
      await expect(page.locator('[data-testid="detected-subscriptions"]')).toBeVisible()
      await expect(page.locator('[data-testid="detected-total"]')).toContainText('$78.97')
      
      // Should compare with entertainment budget
      await expect(page.locator('[data-testid="budget-comparison"]')).toContainText('52% of entertainment budget')
      
      // Should show impact on budget
      await expect(page.locator('[data-testid="budget-impact"]')).toBeVisible()
      await expect(page.locator('[data-testid="remaining-entertainment"]')).toContainText('$71.03')
    })
  })
})
