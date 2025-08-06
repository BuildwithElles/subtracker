/**
 * 🧪 E2E TEST DATA FACTORY
 * 
 * Provides test data generation and management for authentication E2E tests
 */

export interface TestUser {
  email: string
  password: string
  firstName: string
  lastName: string
  displayName: string
  id?: string
}

export interface TestCredentials {
  email: string
  password: string
}

export class TestDataFactory {
  private static userCounter = 0

  /**
   * Generate a unique test user with valid data
   */
  static createTestUser(overrides?: Partial<TestUser>): TestUser {
    this.userCounter++
    const timestamp = Date.now()
    
    return {
      email: `test.user.${this.userCounter}.${timestamp}@subtracker-test.com`,
      password: 'TestPassword123!',
      firstName: `TestFirst${this.userCounter}`,
      lastName: `TestLast${this.userCounter}`,
      displayName: `Test User ${this.userCounter}`,
      ...overrides
    }
  }

  /**
   * Generate invalid test data for validation testing
   */
  static createInvalidUser(): {
    invalidEmail: TestUser
    weakPassword: TestUser
    shortPassword: TestUser
    noUppercase: TestUser
    noNumber: TestUser
    noSpecialChar: TestUser
  } {
    const baseUser = this.createTestUser()
    
    return {
      invalidEmail: { ...baseUser, email: 'invalid-email-format' },
      weakPassword: { ...baseUser, password: '123' },
      shortPassword: { ...baseUser, password: 'Short1!' },
      noUppercase: { ...baseUser, password: 'lowercase123!' },
      noNumber: { ...baseUser, password: 'NoNumbers!' },
      noSpecialChar: { ...baseUser, password: 'NoSpecialChar123' }
    }
  }

  /**
   * Create existing user credentials for login tests
   */
  static createExistingUser(): TestCredentials {
    return {
      email: 'existing.user@subtracker-test.com',
      password: 'ExistingUserPass123!'
    }
  }

  /**
   * Create confirmed user for dashboard access tests
   */
  static createConfirmedUser(): TestCredentials {
    return {
      email: 'confirmed.user@subtracker-test.com',
      password: 'ConfirmedUserPass123!'
    }
  }

  /**
   * Create unconfirmed user for email verification tests
   */
  static createUnconfirmedUser(): TestCredentials {
    return {
      email: 'unconfirmed.user@subtracker-test.com',
      password: 'UnconfirmedUserPass123!'
    }
  }

  /**
   * Generate OAuth test data
   */
  static createOAuthTestData() {
    return {
      googleUser: {
        email: 'google.test@gmail.com',
        name: 'Google Test User',
        picture: 'https://example.com/avatar.jpg'
      },
      authCode: 'mock-oauth-authorization-code',
      accessToken: 'mock-oauth-access-token',
      refreshToken: 'mock-oauth-refresh-token'
    }
  }

  /**
   * Generate test tokens
   */
  static createTestTokens() {
    return {
      validConfirmation: 'valid-confirmation-token-12345',
      expiredConfirmation: 'expired-confirmation-token-67890',
      invalidConfirmation: 'invalid-confirmation-token-xxxxx',
      validPasswordReset: 'valid-reset-token-abcde',
      expiredPasswordReset: 'expired-reset-token-fghij',
      invalidPasswordReset: 'invalid-reset-token-zzzzz'
    }
  }

  /**
   * Create batch of test users for performance testing
   */
  static createTestUserBatch(count: number): TestUser[] {
    return Array.from({ length: count }, () => this.createTestUser())
  }

  /**
   * Clean up test data (for use in afterAll hooks)
   */
  static getCleanupData() {
    return {
      testEmailPattern: '@subtracker-test.com',
      testUserPrefix: 'test.user.',
      createdAfter: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    }
  }
}

/**
 * Test Environment Configuration
 */
export class TestConfig {
  static readonly BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
  static readonly API_URL = process.env.API_URL || 'http://localhost:3000/api'
  static readonly SUPABASE_URL = process.env.VITE_PUBLIC_SUPABASE_URL || 'https://test.supabase.co'
  static readonly SUPABASE_ANON_KEY = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key'
  
  // Test timeouts
  static readonly TIMEOUTS = {
    short: 5000,    // 5 seconds
    medium: 15000,  // 15 seconds
    long: 30000,    // 30 seconds
    api: 10000      // 10 seconds for API calls
  }
  
  // Test retries
  static readonly RETRIES = {
    flaky: 2,       // For flaky tests
    network: 3,     // For network-dependent tests
    none: 0         // For stable tests
  }
  
  // Mock API responses
  static readonly MOCK_RESPONSES = {
    signupSuccess: {
      user: { id: 'mock-user-id', email: 'test@example.com' },
      message: 'Account created successfully'
    },
    signupError: {
      error: 'Email already exists',
      code: 'EMAIL_EXISTS'
    },
    loginSuccess: {
      user: { id: 'mock-user-id', email: 'test@example.com' },
      session: { access_token: 'mock-access-token' }
    },
    loginError: {
      error: 'Invalid credentials',
      code: 'INVALID_CREDENTIALS'
    },
    passwordResetSuccess: {
      message: 'Password reset email sent'
    },
    emailConfirmationSuccess: {
      message: 'Email confirmed successfully'
    }
  }
  
  // Test selectors (data-testid values)
  static readonly SELECTORS = {
    // Form elements
    emailInput: '[data-testid="email-input"]',
    passwordInput: '[data-testid="password-input"]',
    confirmPasswordInput: '[data-testid="confirm-password-input"]',
    submitButton: '[data-testid="submit-button"]',
    
    // Auth buttons
    googleAuthButton: '[data-testid="google-auth-button"]',
    signupButton: '[data-testid="signup-button"]',
    loginButton: '[data-testid="login-button"]',
    
    // Navigation
    signupLink: '[data-testid="signup-link"]',
    loginLink: '[data-testid="login-link"]',
    forgotPasswordLink: '[data-testid="forgot-password-link"]',
    
    // Status elements
    loadingSpinner: '[data-testid="loading-spinner"]',
    errorMessage: '[data-testid="error-message"]',
    successMessage: '[data-testid="success-message"]',
    
    // Password strength
    passwordStrength: '[data-testid="password-strength"]',
    passwordToggle: '[data-testid="password-toggle"]',
    
    // OAuth
    oauthPopup: '[data-testid="oauth-popup"]',
    oauthCallback: '[data-testid="oauth-callback"]',
    
    // User menu
    userMenu: '[data-testid="user-menu"]',
    userAvatar: '[data-testid="user-avatar"]',
    signoutButton: '[data-testid="signout-button"]'
  }
  
  // Test patterns for text matching
  static readonly TEXT_PATTERNS = {
    validation: {
      requiredEmail: /email.*required|please.*enter.*email/i,
      invalidEmail: /invalid.*email|enter.*valid.*email/i,
      requiredPassword: /password.*required|please.*enter.*password/i,
      weakPassword: /password.*weak|password.*must.*contain/i,
      passwordMismatch: /passwords.*don.*match|passwords.*must.*match/i
    },
    auth: {
      accountCreated: /account.*created|signup.*successful|welcome/i,
      loginSuccess: /signed.*in|login.*successful|welcome.*back/i,
      loginError: /invalid.*credentials|incorrect.*email|wrong.*password/i,
      emailSent: /email.*sent|check.*email|verification.*sent/i,
      emailConfirmed: /email.*confirmed|account.*verified|confirmation.*successful/i,
      passwordReset: /password.*reset|password.*updated|reset.*successful/i
    },
    loading: {
      creating: /creating.*account|signing.*up|please.*wait/i,
      signingIn: /signing.*in|logging.*in|authenticating/i,
      loading: /loading|please.*wait|processing/i
    }
  }
  
  // Page URLs
  static readonly ROUTES = {
    home: '/',
    signup: '/signup',
    login: '/login',
    emailConfirmation: '/email-confirmation',
    passwordReset: '/password-reset',
    onboarding: '/onboarding',
    dashboard: '/dashboard',
    authCallback: '/auth/callback'
  }
}

/**
 * Test Database Helpers
 */
export class TestDatabaseHelpers {
  /**
   * Clean up test users from database
   */
  static async cleanupTestUsers() {
    // This would implement actual database cleanup
    // For now, it's a placeholder for future implementation
    console.log('🧹 Cleaning up test users...')
    
    const cleanup = TestDataFactory.getCleanupData()
    
    // Example cleanup logic (to be implemented):
    // - Delete users with emails containing cleanup.testEmailPattern
    // - Delete users created after cleanup.createdAfter
    // - Delete users with names starting with cleanup.testUserPrefix
    
    return { cleaned: 0, errors: [] }
  }
  
  /**
   * Create test user in database (for login tests)
   */
  static async createTestUserInDatabase(user: TestUser) {
    console.log(`📝 Creating test user in database: ${user.email}`)
    
    // This would implement actual user creation
    // For now, it's a placeholder
    return { success: true, userId: `test-user-${Date.now()}` }
  }
  
  /**
   * Verify test user exists in database
   */
  static async verifyTestUser(email: string) {
    console.log(`🔍 Verifying test user exists: ${email}`)
    
    // This would implement actual user verification
    return { exists: true, confirmed: true }
  }
}

/**
 * Test API Helpers
 */
export class TestApiHelpers {
  /**
   * Mock successful API responses
   */
  static mockSuccessfulAuth(page: any) {
    return page.route('**/auth/**', (route: any) => {
      const url = route.request().url()
      
      if (url.includes('/signup')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(TestConfig.MOCK_RESPONSES.signupSuccess)
        })
      } else if (url.includes('/login')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(TestConfig.MOCK_RESPONSES.loginSuccess)
        })
      } else if (url.includes('/reset-password')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(TestConfig.MOCK_RESPONSES.passwordResetSuccess)
        })
      } else {
        route.continue()
      }
    })
  }
  
  /**
   * Mock API errors
   */
  static mockAuthErrors(page: any) {
    return page.route('**/auth/**', (route: any) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify(TestConfig.MOCK_RESPONSES.signupError)
      })
    })
  }
  
  /**
   * Mock slow API responses (for loading state tests)
   */
  static mockSlowApi(page: any, delay: number = 2000) {
    return page.route('**/auth/**', async (route: any) => {
      await new Promise(resolve => setTimeout(resolve, delay))
      route.continue()
    })
  }
  
  /**
   * Mock network errors
   */
  static mockNetworkError(page: any) {
    return page.route('**/auth/**', (route: any) => {
      route.abort('failed')
    })
  }
}

/**
 * Test Utilities
 */
export class TestUtils {
  /**
   * Wait for navigation with timeout
   */
  static async waitForNavigation(page: any, expectedUrl: string | RegExp, timeout = TestConfig.TIMEOUTS.medium) {
    await page.waitForURL(expectedUrl, { timeout })
  }
  
  /**
   * Fill form with retry logic
   */
  static async fillFormField(page: any, selector: string, value: string, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        await page.fill(selector, value)
        break
      } catch (error) {
        if (i === retries - 1) throw error
        await page.waitForTimeout(500)
      }
    }
  }
  
  /**
   * Wait for element with retry
   */
  static async waitForElement(page: any, selector: string, timeout = TestConfig.TIMEOUTS.short) {
    return page.waitForSelector(selector, { timeout })
  }
  
  /**
   * Check if element exists without waiting
   */
  static async elementExists(page: any, selector: string) {
    try {
      return await page.locator(selector).isVisible()
    } catch {
      return false
    }
  }
  
  /**
   * Generate random string
   */
  static randomString(length = 8) {
    return Math.random().toString(36).substring(2, length + 2)
  }
  
  /**
   * Generate timestamp-based ID
   */
  static generateId(prefix = 'test') {
    return `${prefix}-${Date.now()}-${this.randomString(4)}`
  }
}

export default {
  TestDataFactory,
  TestConfig,
  TestDatabaseHelpers,
  TestApiHelpers,
  TestUtils
}
