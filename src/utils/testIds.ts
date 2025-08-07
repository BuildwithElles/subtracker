/**
 * Test ID constants for reliable test selectors
 * Use these constants to ensure consistency across components and tests
 */

export const TEST_IDS = {
  // Branding
  APP_TITLE: 'app-title',
  APP_LOGO: 'app-logo',
  APP_TAGLINE: 'app-tagline',
  
  // Forms
  SIGNUP_FORM: 'signup-form',
  LOGIN_FORM: 'login-form',
  PASSWORD_RESET_FORM: 'password-reset-form',
  EMAIL_CONFIRMATION_FORM: 'email-confirmation-form',
  
  // Form Inputs
  EMAIL_INPUT: 'email-input',
  PASSWORD_INPUT: 'password-input',
  CONFIRM_PASSWORD_INPUT: 'confirm-password-input',
  FULLNAME_INPUT: 'fullname-input',
  NAME_INPUT: 'name-input',
  REFERRER_CODE_INPUT: 'referrer-code-input',
  
  // Buttons
  SUBMIT_BUTTON: 'submit-button',
  LOGIN_BUTTON: 'login-button',
  SIGNUP_BUTTON: 'signup-button',
  LOGOUT_BUTTON: 'logout-button',
  BACK_BUTTON: 'back-button',
  RESEND_BUTTON: 'resend-button',
  
  // OAuth
  GOOGLE_OAUTH_BUTTON: 'google-oauth-button',
  GITHUB_OAUTH_BUTTON: 'github-oauth-button',
  
  // Navigation
  LOGIN_LINK: 'login-link',
  SIGNUP_LINK: 'signup-link',
  DASHBOARD_LINK: 'dashboard-link',
  FORGOT_PASSWORD_LINK: 'forgot-password-link',
  HOME_LINK: 'home-link',
  
  // States
  ERROR_MESSAGE: 'error-message',
  SUCCESS_MESSAGE: 'success-message',
  LOADING_SPINNER: 'loading-spinner',
  AUTH_LOADING: 'auth-loading',
  GENERAL_ERROR: 'general-error',
  
  // Specific Field Errors
  EMAIL_ERROR: 'email-error',
  PASSWORD_ERROR: 'password-error',
  CONFIRM_PASSWORD_ERROR: 'confirm-password-error',
  FULLNAME_ERROR: 'fullname-error',
  NAME_ERROR: 'name-error',
  
  // Success Messages
  PASSWORDS_MATCH_SUCCESS: 'passwords-match-success',
  EMAIL_SENT_SUCCESS: 'email-sent-success',
  
  // Dashboard
  DASHBOARD_CONTENT: 'dashboard-content',
  DASHBOARD_TITLE: 'dashboard-title',
  USER_MENU: 'user-menu',
  SUBSCRIPTION_LIST: 'subscription-list',
  
  // Layout
  HEADER: 'header',
  FOOTER: 'footer',
  MAIN_CONTENT: 'main-content',
  SIDEBAR: 'sidebar',
  
  // Authentication Pages
  PASSWORD_RESET_CONTENT: 'password-reset-content',
  EMAIL_CONFIRMATION_CONTENT: 'email-confirmation-content',
  
  // Modals and Overlays
  MODAL: 'modal',
  OVERLAY: 'overlay',
  CLOSE_BUTTON: 'close-button',
  
  // Loading and Auth States
  LOADING: {
    PROTECTED_ROUTE: 'loading-protected-route',
    PUBLIC_ROUTE: 'loading-public-route',
    GENERAL: 'loading-general',
  },
  
  AUTH: {
    EMAIL_CONFIRMATION_REQUIRED: 'auth-email-confirmation-required',
    REDIRECT: 'auth-redirect',
  },
} as const

// Type for test IDs to ensure type safety
export type TestId = typeof TEST_IDS[keyof typeof TEST_IDS]

// Helper function to get test ID
export const getTestId = (id: TestId): string => id

// Helper function to create test ID selector
export const testIdSelector = (id: TestId): string => `[data-testid="${id}"]`
