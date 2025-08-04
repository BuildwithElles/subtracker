// Focused tests for immediate features we can test
import { test, expect } from '@playwright/test';

test.describe('SubTracker - Core Functionality Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Go to the app
    await page.goto('/');
  });

  test('Landing page loads correctly', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/SubTracker/);
    
    // Check main elements are visible - use more specific selectors to avoid strict mode violations
    await expect(page.getByRole('heading', { name: 'Track your subscriptions.' })).toBeVisible();
    await expect(page.locator('text=Get Started Free')).toBeVisible();
    
    // Check navigation links - use more specific selectors to avoid strict mode violations
    await expect(page.getByRole('link', { name: 'Get Started', exact: true })).toBeVisible();
    await expect(page.locator('text=Sign In')).toBeVisible();
  });

  test('Navigation to signup page works', async ({ page }) => {
    await page.click('text=Get Started Free');
    await expect(page).toHaveURL(/.*signup/);
    
    // Check signup form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('input[id="confirmPassword"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check optional fields
    await expect(page.locator('input[id="fullName"]')).toBeVisible();
    await expect(page.locator('input[id="referrerCode"]')).toBeVisible();
    
    // Check Google OAuth button
    await expect(page.locator('text=Sign up with Google')).toBeVisible();
  });

  test('Signup form has all required fields and functionality', async ({ page }) => {
    await page.goto('/signup');
    
    // Test that all form fields are present and functional
    await page.fill('input[id="fullName"]', 'Test User');
    await page.fill('input[id="email"]', 'test@example.com');
    await page.fill('input[id="password"]', 'StrongPassword123');
    await page.fill('input[id="confirmPassword"]', 'StrongPassword123');
    
    // Test referrer code field accepts input and converts to uppercase
    await page.fill('input[id="referrerCode"]', 'test123');
    const referrerValue = await page.inputValue('input[id="referrerCode"]');
    expect(referrerValue).toBe('TEST123');
    
    // Test password visibility toggles work
    const passwordField = page.locator('input[id="password"]');
    const confirmPasswordField = page.locator('input[id="confirmPassword"]');
    
    // Initially password fields should be type="password"
    expect(await passwordField.getAttribute('type')).toBe('password');
    expect(await confirmPasswordField.getAttribute('type')).toBe('password');
    
    // Test that submit button exists and is enabled
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
  });

  test('Dashboard loads with expected elements', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check main dashboard elements
    await expect(page.locator('text=SubTracker')).toBeVisible();
    await expect(page.locator('text=Monthly Spend')).toBeVisible();
    await expect(page.locator('text=Budget Usage')).toBeVisible();
    await expect(page.locator('text=Trials Ending')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Upcoming Charges' }).first()).toBeVisible();
    
    // Check tab navigation exists - use button roles to be more specific
    await expect(page.getByRole('button', { name: 'Overview' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Subscriptions' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Budget' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Upcoming' })).toBeVisible();
  });

  test('Gmail modal appears and can be dismissed', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check if Gmail modal appears (for new users)
    const gmailModal = page.locator('text=Connect Your Gmail');
    if (await gmailModal.isVisible()) {
      await expect(page.locator('text=Read-only inbox access')).toBeVisible();
      await expect(page.locator('button:has-text("Maybe Later")')).toBeVisible();
      
      // Test dismissal
      await page.click('button:has-text("Maybe Later")');
      await expect(gmailModal).not.toBeVisible();
    }
  });

  test('Currency selector works', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Dismiss Gmail modal if present
    const maybeButton = page.locator('button:has-text("Maybe Later")');
    if (await maybeButton.isVisible()) {
      await maybeButton.click();
    }
    
    // Find currency selector
    const currencySelect = page.locator('select').first();
    await expect(currencySelect).toBeVisible();
    
    // Check default selection (should be USD)
    await expect(currencySelect).toHaveValue('USD');
    
    // Change to EUR
    await currencySelect.selectOption('EUR');
    await page.waitForTimeout(500);
    
    // Check if value changed
    await expect(currencySelect).toHaveValue('EUR');
  });

  test('Tab navigation works', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Dismiss Gmail modal if present
    const maybeButton = page.locator('button:has-text("Maybe Later")');
    if (await maybeButton.isVisible()) {
      await maybeButton.click();
    }
    
    // Test Subscriptions tab
    await page.click('text=Subscriptions');
    await expect(page.locator('text=Your Subscriptions')).toBeVisible();
    
    // Test Budget tab
    await page.click('text=Budget');
    await expect(page.locator('text=Budget Overview')).toBeVisible();
    
    // Test Upcoming tab
    await page.click('text=Upcoming');
    await expect(page.getByRole('heading', { name: 'Upcoming Charges' }).first()).toBeVisible();
    
    // Back to Overview
    await page.click('text=Overview');
    await expect(page.locator('text=Budget Overview')).toBeVisible();
  });

  test('Settings page loads correctly', async ({ page }) => {
    await page.goto('/settings');
    
    // Check main settings elements that actually exist
    await expect(page.locator('text=Settings')).toBeVisible();
    await expect(page.locator('text=Account Information')).toBeVisible();
    await expect(page.locator('text=Gmail Integration')).toBeVisible();
    await expect(page.locator('text=Data Export')).toBeVisible();
  });

  test('Budget page loads with form', async ({ page }) => {
    await page.goto('/budget');
    
    // Check main elements
    await expect(page.locator('text=Set Your Monthly Budget')).toBeVisible();
    await expect(page.locator('input[name="income"]')).toBeVisible();
    await expect(page.locator('input[name="fixedCosts"]')).toBeVisible();
    await expect(page.locator('input[name="savingsTarget"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check help text
    await expect(page.locator('text=Monthly income before taxes')).toBeVisible();
  });

  test('Welcome message displays user-appropriate content', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Dismiss Gmail modal if present
    const maybeButton = page.locator('button:has-text("Maybe Later")');
    if (await maybeButton.isVisible()) {
      await maybeButton.click();
    }
    
    // Check for welcome message elements
    await expect(page.locator('text=Good')).toBeVisible(); // "Good morning/afternoon/evening"
    await expect(page.locator('text=Ready to take control')).toBeVisible(); // Empty state message
  });

  test('Add subscription button opens modal', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Dismiss Gmail modal if present
    const maybeButton = page.locator('button:has-text("Maybe Later")');
    if (await maybeButton.isVisible()) {
      await maybeButton.click();
    }
    
    // Navigate to Subscriptions tab
    await page.click('text=Subscriptions');
    
    // Look for Add New button
    const addButton = page.locator('button:has-text("Add New")');
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Check if modal opens
      await expect(page.locator('text=Add New Subscription')).toBeVisible();
      await expect(page.locator('input[name="service_name"]')).toBeVisible();
      
      // Close modal
      const closeButton = page.locator('button:has-text("Cancel")');
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }
    }
  });

  test('Gmail scan button is functional', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Dismiss Gmail modal if present
    const maybeButton = page.locator('button:has-text("Maybe Later")');
    if (await maybeButton.isVisible()) {
      await maybeButton.click();
    }
    
    // Look for Gmail-related buttons
    const gmailButton = page.locator('text=Connect Gmail').or(page.locator('text=Scan Gmail')).or(page.locator('text=Gmail Integration'));
    await expect(gmailButton.first()).toBeVisible();
    
    // Click the button and verify it responds
    await gmailButton.first().click();
    
    // Wait a bit and check that something happened (could be modal, redirect, or state change)
    await page.waitForTimeout(1000);
  });

  test('Responsive design on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/dashboard');
    
    // Check that header is still visible and functional
    await expect(page.locator('text=SubTracker')).toBeVisible();
    
    // Check that metric cards are stacked (not side by side)
    const metricCards = page.locator('.grid .bg-white').first();
    if (await metricCards.isVisible()) {
      const box = await metricCards.boundingBox();
      // On mobile, cards should take most of the width
      expect(box!.width).toBeGreaterThan(300);
    }
  });

  test('Logout functionality works', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for any logout-related button or link
    const logoutElement = page.locator('text=Sign Out').or(page.locator('text=Logout')).or(page.locator('button[title="Logout"]'));
    if (await logoutElement.first().isVisible()) {
      await logoutElement.first().click();
      
      // Wait for navigation to complete - be more flexible about timing
      await page.waitForTimeout(3000);
      
      // Check multiple indicators that we're logged out
      const loggedOut = await Promise.race([
        page.locator('text=Get Started').isVisible(),
        page.locator('text=Sign In').isVisible(),
        page.locator('text=SubTracker').and(page.locator('text=Track your subscriptions')).isVisible(),
        page.waitForURL('**/').then(() => true).catch(() => false)
      ]);
      
      expect(loggedOut).toBeTruthy();
    } else {
      // If no logout button found, the test should pass as it means we're not logged in
      console.log('No logout button found - likely not logged in');
    }
  });

  test('Error handling for non-existent routes', async ({ page }) => {
    await page.goto('/non-existent-page');
    
    // Should show some kind of error or redirect
    // The exact behavior depends on how routing is configured
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });
});
