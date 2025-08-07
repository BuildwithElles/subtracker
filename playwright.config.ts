import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  // Global setup for Supabase configuration and test data
  globalSetup: './global-setup.ts',
  
  use: {
    // Use Vite dev server for testing (default port 5173)
    baseURL: process.env.VITE_APP_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    // Add screenshot on failure for better debugging
    screenshot: 'only-on-failure',
    // Enable video recording for failed tests
    video: 'retain-on-failure',
    // Set custom test ID attribute for Playwright
    testIdAttribute: 'data-testid',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
})
