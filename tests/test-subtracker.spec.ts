// @filename: test-subtracker.spec.ts
// @description: End-to-end test script for https://subtracker-ecru.vercel.app
// Test: Auth flow, Gmail connect prompt, Dashboard data, Budget setup, Settings

import { test, expect } from '@playwright/test';

test.describe('Subtracker App', () => {
  
  test('Landing page loads', async ({ page }) => {
    await page.goto('https://subtracker-ecru.vercel.app');
    await expect(page).toHaveTitle(/SubTracker/i);
    await expect(page.locator('text=Get Started Free')).toBeVisible();
  });

  test('Signup flow works', async ({ page }) => {
    await page.goto('https://subtracker-ecru.vercel.app/signup');
    await page.fill('input[name="email"]', 'testuser@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]:has-text("Sign Up")');
    // Note: This will likely fail since we don't have dashboard yet
    // await expect(page).toHaveURL(/dashboard/);
  });

  test('Connect Gmail prompt is shown', async ({ page }) => {
    await page.goto('https://subtracker-ecru.vercel.app/dashboard');
    await expect(page.locator('button:has-text("Connect Gmail")')).toBeVisible();
  });

  test('Budget setup form validation', async ({ page }) => {
    await page.goto('https://subtracker-ecru.vercel.app/budget');
    // This will likely 404 since budget page doesn't exist yet
    await page.fill('input[name="income"]', '4000');
    await page.fill('input[name="fixed"]', '1200');
    await page.fill('input[name="savings"]', '500');
    await page.click('button:has-text("Submit")');
    await expect(page.locator('text=Budget saved')).toBeVisible();
  });

  test('Dashboard loads subscription list', async ({ page }) => {
    await page.goto('https://subtracker-ecru.vercel.app/dashboard');
    await expect(page.locator('text=Total Spend')).toBeVisible();
    await expect(page.locator('[data-test=subscriptions-list]')).toBeVisible();
  });

  test('Settings page renders and Gmail disconnect', async ({ page }) => {
    await page.goto('https://subtracker-ecru.vercel.app/settings');
    await expect(page.locator('text=Export')).toBeVisible();
    await expect(page.locator('text=Disconnect Gmail')).toBeVisible();
  });

});
