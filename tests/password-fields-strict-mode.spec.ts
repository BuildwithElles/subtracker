import { test, expect } from '@playwright/test'

test.describe('Password Fields Strict Mode Compliance', () => {
  test('Can interact with password fields without strict mode violations', async ({ page }) => {
    await page.goto('/signup')

    // Verify that we can specifically target each password field
    const passwordField = page.locator('[data-testid="password-input"]')
    const confirmPasswordField = page.locator('[data-testid="confirm-password-input"]')

    // These should be unique selectors that don't trigger strict mode violations
    await expect(passwordField).toBeVisible()
    await expect(confirmPasswordField).toBeVisible()

    // Test that we can fill each field independently
    await passwordField.fill('TestPassword123!')
    await confirmPasswordField.fill('TestPassword123!')

    // Verify the values are set correctly
    expect(await passwordField.inputValue()).toBe('TestPassword123!')
    expect(await confirmPasswordField.inputValue()).toBe('TestPassword123!')

    // Test that the fields are indeed different elements
    const passwordFieldType = await passwordField.getAttribute('type')
    const confirmPasswordFieldType = await confirmPasswordField.getAttribute('type')
    expect(passwordFieldType).toBe('password')
    expect(confirmPasswordFieldType).toBe('password')

    // Verify IDs are different
    const passwordFieldId = await passwordField.getAttribute('id')
    const confirmPasswordFieldId = await confirmPasswordField.getAttribute('id')
    expect(passwordFieldId).toBe('password')
    expect(confirmPasswordFieldId).toBe('confirmPassword')
  })

  test('Generic password selector would cause strict mode violation (demonstration)', async ({ page }) => {
    await page.goto('/signup')

    // This test demonstrates the problem that was fixed
    // Using a generic selector like 'input[type="password"]' would find multiple elements
    const passwordInputs = page.locator('input[type="password"]')
    const count = await passwordInputs.count()
    
    // This should show there are 2 password fields, which would cause strict mode violations
    expect(count).toBe(2)

    // Our specific selectors should each find exactly 1 element
    const specificPasswordInput = page.locator('[data-testid="password-input"]')
    const specificConfirmPasswordInput = page.locator('[data-testid="confirm-password-input"]')
    
    expect(await specificPasswordInput.count()).toBe(1)
    expect(await specificConfirmPasswordInput.count()).toBe(1)
  })

  test('All form fields have unique data-testid selectors', async ({ page }) => {
    await page.goto('/signup')

    // Verify each form field has a unique data-testid and can be selected without ambiguity
    const formFields = [
      '[data-testid="full-name-input"]',
      '[data-testid="email-input"]', 
      '[data-testid="password-input"]',
      '[data-testid="confirm-password-input"]',
      '[data-testid="referrer-code-input"]',
      '[data-testid="submit-button"]',
      '[data-testid="google-signup-button"]'
    ]

    for (const selector of formFields) {
      const element = page.locator(selector)
      expect(await element.count()).toBe(1)
      await expect(element).toBeVisible()
    }
  })
})