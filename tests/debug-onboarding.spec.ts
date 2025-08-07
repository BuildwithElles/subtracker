import { test, expect } from '@playwright/test'
import { AuthHelper } from './auth-helper'

test.describe('🔍 Debug Onboarding Page Structure', () => {
  test('should inspect onboarding page elements and test IDs', async ({ page }) => {
    const authHelper = new AuthHelper(page)
    await authHelper.authenticateTestUser()
    
    await page.goto('/onboarding')
    
    // Wait for page to load
    await expect(page.locator('[data-testid="onboarding-container"]')).toBeVisible()
    
    console.log('🧭 Current URL:', await page.url())
    
    // Get all elements with data-testid
    const testIds = await page.locator('[data-testid]').evaluateAll(elements => {
      return elements.map(el => ({
        testid: el.getAttribute('data-testid'),
        tagName: el.tagName,
        visible: (el as HTMLElement).offsetParent !== null,
        text: el.textContent?.slice(0, 50)
      }))
    })
    
    console.log('📋 All test IDs found on step 1:')
    testIds.forEach(item => {
      console.log(`  - [data-testid="${item.testid}"] ${item.tagName} ${item.visible ? '👁️' : '🚫'} "${item.text}"`)
    })
    
    // Try clicking next to go to step 2
    console.log('🔄 Clicking next to go to step 2...')
    await page.click('[data-testid="next-step-button"]')
    
    // Wait a moment and get step 2 test IDs
    await page.waitForTimeout(1000)
    
    const step2TestIds = await page.locator('[data-testid]').evaluateAll(elements => {
      return elements.map(el => ({
        testid: el.getAttribute('data-testid'),
        tagName: el.tagName,
        visible: (el as HTMLElement).offsetParent !== null,
        text: el.textContent?.slice(0, 50)
      }))
    })
    
    console.log('📋 All test IDs found on step 2:')
    step2TestIds.forEach(item => {
      console.log(`  - [data-testid="${item.testid}"] ${item.tagName} ${item.visible ? '👁️' : '🚫'} "${item.text}"`)
    })
    
    // Check for budget-related elements
    const budgetSelectors = [
      '[data-testid="budget-setup-step"]',
      '[data-testid="income-input"]',
      '[data-testid="housing-input"]',
      '[data-testid="food-input"]',
      '[data-testid="transportation-input"]',
      '[data-testid="entertainment-input"]',
      '[data-testid="savings-input"]',
      '[data-testid="currency-select"]'
    ]
    
    console.log('� Budget selector check:')
    for (const selector of budgetSelectors) {
      const count = await page.locator(selector).count()
      console.log(`  ${selector}: ${count > 0 ? '✅' : '❌'} (${count} found)`)
    }
  })
})
