# 🧪 Authentication & Onboarding E2E Test Suite

## 📖 Overview

This comprehensive E2E test suite covers the complete User Authentication & Onboarding Flow for SubTracker, including:

- **User Registration** (Email/Password & Google OAuth)
- **Email Confirmation** Flow
- **User Login** & Session Management
- **Password Reset** Flow  
- **Form Validation** & Error Handling
- **Loading States** & UX Patterns
- **Complete Onboarding** Journey
- **Security** & Accessibility Testing

## 🎯 User Stories Covered

### 📝 Registration Flow
```
As a new user, I want to:
- Create an account with email and password
- Sign up with Google OAuth for quick registration
- Receive clear validation messages for form errors
- See loading states during account creation
- Be guided to email confirmation after signup
```

### 📧 Email Confirmation
```
As a user, I want to:
- Confirm my email address to verify my identity
- Resend confirmation emails if needed
- See helpful error messages for invalid/expired links
- Be redirected to onboarding after confirmation
```

### 🔑 Login & Authentication
```
As a returning user, I want to:
- Log in with my email and password
- Stay logged in across browser sessions (remember me)
- See helpful error messages for incorrect credentials
- Be reminded to confirm email if unverified
- Access my dashboard after successful login
```

### 🔄 Password Reset
```
As a user who forgot my password, I want to:
- Request a password reset email
- Create a new secure password
- See password requirements clearly
- Be able to log in with my new password
```

### 🚀 Onboarding Experience
```
As a new user, I want to:
- Be guided through account setup
- Have the option to skip onboarding if preferred
- Understand how to start using SubTracker
```

## 📁 Test File Structure

```
tests/
├── auth-onboarding-e2e.spec.ts     # Complete authentication flow tests
├── auth-components-e2e.spec.ts     # Individual component tests
├── user-stories-e2e.spec.ts        # User story-based tests
├── test-helpers.ts                 # Test utilities and data factories
├── auth-setup.spec.ts              # Test environment setup
├── auth-cleanup.spec.ts            # Test environment cleanup
├── global-setup.ts                 # Global test configuration
└── global-teardown.ts              # Global test cleanup
```

## 🔧 Test Configuration

### Main Config: `playwright-auth.config.ts`
- **Multi-browser testing** (Chrome, Firefox, Safari, Edge)
- **Mobile testing** (iOS Safari, Android Chrome)
- **Parallel execution** with proper dependencies
- **Comprehensive reporting** (HTML, JSON, JUnit)
- **Video recording** and screenshots on failure
- **Automatic retry** on CI environments

### Environment Variables
```bash
# Application URLs
BASE_URL=http://localhost:3000
API_URL=http://localhost:3000/api

# Supabase Configuration
VITE_PUBLIC_SUPABASE_URL=your_supabase_url
VITE_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Test Configuration
NODE_ENV=test
CI=true                    # Enables CI-specific behavior
HEADLESS=true             # Run tests in headless mode
TEST_GREP=auth            # Filter tests by pattern
ARCHIVE_RESULTS=true      # Archive test results
```

## 🚀 Running the Tests

### Quick Start
```bash
# Install dependencies
npm install

# Run all authentication E2E tests
npm run test:e2e:auth

# Run with visual test runner
npm run test:e2e:auth:ui

# Run in headed mode (see browser)
npm run test:e2e:auth:headed

# Debug specific test
npm run test:e2e:auth:debug
```

### Targeted Testing
```bash
# Test specific components
npm run test:e2e:components

# Test user stories
npm run test:e2e:stories

# Test complete authentication flow
npm run test:e2e:full

# Test specific browser
npm run test:e2e:auth:chromium
npm run test:e2e:auth:firefox

# Test mobile experience
npm run test:e2e:auth:mobile
```

### CI/CD Integration
```bash
# Production-ready test run
npx playwright test --config=playwright-auth.config.ts --reporter=github

# With test sharding for parallel execution
npx playwright test --config=playwright-auth.config.ts --shard=1/4
```

## 📊 Test Coverage

### 🔍 **Authentication Components** (45+ tests)
- **SignUp Form**: Rendering, validation, submission, loading states
- **Login Form**: Authentication, error handling, remember me
- **EmailConfirmation**: Token validation, resend functionality
- **PasswordReset**: Email request, password update, validation
- **OAuth Integration**: Google login, popup handling, callbacks

### 🎭 **User Scenarios** (30+ tests)
- **New User Journey**: Signup → Confirmation → Onboarding
- **Returning User**: Login → Dashboard access
- **Error Recovery**: Network issues, invalid data, expired tokens
- **Security**: CSRF protection, XSS prevention, rate limiting

### 📱 **Cross-Platform** (20+ tests)
- **Desktop Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Devices**: iOS Safari, Android Chrome
- **Responsive Design**: Form layouts, touch interactions
- **Accessibility**: Keyboard navigation, screen readers

### 🔒 **Security & Performance** (15+ tests)
- **Input Sanitization**: XSS prevention, SQL injection
- **Session Management**: Timeout, secure logout
- **Rate Limiting**: Authentication attempts, email sending
- **Loading Performance**: Response times, perceived performance

## 🛠️ Test Utilities

### TestDataFactory
```typescript
// Generate realistic test users
const user = TestDataFactory.createTestUser()
const invalidUser = TestDataFactory.createInvalidUser()

// OAuth test data
const oauthData = TestDataFactory.createOAuthTestData()

// Test tokens for various scenarios
const tokens = TestDataFactory.createTestTokens()
```

### AuthPageHelpers
```typescript
// Page navigation and interaction helpers
await authHelper.goToSignUp()
await authHelper.fillSignUpForm(userData)
await authHelper.expectRedirectToDashboard()
await authHelper.expectValidationError('email')
```

### TestApiHelpers
```typescript
// Mock API responses for testing
TestApiHelpers.mockSuccessfulAuth(page)
TestApiHelpers.mockAuthErrors(page)
TestApiHelpers.mockSlowApi(page, 3000)
TestApiHelpers.mockNetworkError(page)
```

## 📈 Test Reports

### HTML Report
```bash
# Generate and view detailed HTML report
npm run test:e2e:report
```

### CI Integration
- **GitHub Actions**: Automatic test execution on PRs
- **Test Results**: Published as CI artifacts
- **Failure Screenshots**: Attached to failed test reports
- **Performance Metrics**: Response times, load performance

## 🔍 Debugging Tests

### Local Debugging
```bash
# Run in debug mode with breakpoints
npm run test:e2e:auth:debug

# Run specific test file
npx playwright test tests/auth-onboarding-e2e.spec.ts --debug

# Run with trace recording
npx playwright test --trace on
```

### Visual Debugging
```bash
# Open Playwright Inspector
npx playwright test --ui

# Record new tests interactively
npx playwright codegen localhost:3000
```

### Test Data Inspection
```bash
# View test database state
npm run test:db:inspect

# Clean up test data manually
npm run test:cleanup
```

## 📋 Test Maintenance

### Adding New Tests
1. **Create test file** in appropriate category
2. **Use test helpers** for consistent patterns
3. **Follow naming conventions**: `feature-type-e2e.spec.ts`
4. **Add to CI pipeline** via GitHub Actions

### Updating Test Data
1. **Modify TestDataFactory** for new scenarios
2. **Update mock responses** in TestApiHelpers
3. **Regenerate test fixtures** as needed

### Performance Optimization
- **Parallel execution** for independent tests
- **Test dependency management** for setup/teardown
- **Smart waiting strategies** to reduce flakiness
- **Resource cleanup** to prevent memory leaks

## 🚨 Troubleshooting

### Common Issues

**Test Timeouts**
```bash
# Increase timeout for slow operations
npx playwright test --timeout=60000
```

**Flaky Tests**
```bash
# Run with retries
npx playwright test --retries=3
```

**Environment Issues**
```bash
# Check environment variables
npm run test:env:check

# Reset test environment
npm run test:env:reset
```

### CI/CD Issues

**GitHub Actions Failures**
- Check environment secrets are configured
- Verify Supabase connection in CI
- Review test logs in Actions tab

**Performance Issues**
- Monitor test execution times
- Optimize slow selectors
- Use proper waiting strategies

## 🎯 Future Enhancements

### Planned Improvements
- [ ] **Visual Regression Testing** with Percy/Chromatic
- [ ] **API Testing** with dedicated endpoint tests
- [ ] **Performance Testing** with Lighthouse CI
- [ ] **Load Testing** for authentication endpoints
- [ ] **A11y Testing** with axe-playwright
- [ ] **Multi-tenant Testing** for different user types

### Integration Opportunities
- [ ] **Storybook Integration** for component testing
- [ ] **Cypress Migration** for comparison testing
- [ ] **Monitoring Integration** with real user monitoring
- [ ] **Test Analytics** with test result tracking

---

## 📞 Support

For questions about the test suite:
- **Documentation**: Check this README and inline comments
- **Issues**: Create GitHub issues for bugs or improvements
- **Discussions**: Use GitHub Discussions for questions

**Happy Testing! 🧪✨**
