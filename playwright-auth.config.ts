import { defineConfig, devices } from '@playwright/test'

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  
  /* Test file patterns for different test types */
  testMatch: [
    '**/auth-onboarding-e2e.spec.ts',
    '**/auth-components-e2e.spec.ts', 
    '**/user-stories-e2e.spec.ts',
    '**/*.spec.ts'
  ],

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ...(process.env.CI ? [['github'] as const] : [['list'] as const])
  ],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Screenshot on failure for better debugging */
    screenshot: 'only-on-failure',

    /* Video recording for failed tests */
    video: 'retain-on-failure',

    /* Timeout for each action (e.g., click, fill) */
    actionTimeout: 10000,

    /* Timeout for navigation actions */
    navigationTimeout: 30000,

    /* Extra headers for all requests */
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9'
    }
  },

  /* Global test timeout */
  timeout: 60000,

  /* Expect timeout for assertions */
  expect: {
    timeout: 10000
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'auth-setup',
      testMatch: '**/auth-setup.spec.ts',
      teardown: 'auth-cleanup'
    },
    
    {
      name: 'auth-cleanup', 
      testMatch: '**/auth-cleanup.spec.ts'
    },

    /* Desktop browsers */
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
      dependencies: ['auth-setup']
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 }
      },
      dependencies: ['auth-setup']
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 }
      },
      dependencies: ['auth-setup']
    },

    /* Mobile browsers */
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5']
      },
      dependencies: ['auth-setup']
    },

    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12']
      },
      dependencies: ['auth-setup']
    },

    /* Branded browsers */
    {
      name: 'Microsoft Edge',
      use: { 
        ...devices['Desktop Edge'],
        channel: 'msedge'
      },
      dependencies: ['auth-setup']
    },

    {
      name: 'Google Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome'
      },
      dependencies: ['auth-setup']
    }
  ],

  /* Test grouping and organization */
  grep: process.env.TEST_GREP ? new RegExp(process.env.TEST_GREP) : undefined,
  grepInvert: process.env.TEST_GREP_INVERT ? new RegExp(process.env.TEST_GREP_INVERT) : undefined,

  /* Run your local dev server before starting the tests */
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      NODE_ENV: 'test'
    }
  },

  /* Global setup and teardown */
  globalSetup: './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',

  /* Test metadata for reporting */
  metadata: {
    testType: 'E2E Authentication & Onboarding',
    environment: process.env.NODE_ENV || 'development',
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    browser: 'multi-browser',
    platform: process.platform
  }
})
