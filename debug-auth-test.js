import { chromium } from 'playwright';

async function debugAuth() {
  console.log('🔍 Starting authentication debug...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to app
    console.log('📍 Navigating to app...');
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(2000);
    
    // Set up mock authentication
    console.log('🔐 Setting up mock authentication...');
    const mockEmail = 'testuser@testdomain.example';
    const mockUserId = `test-user-${Date.now()}`;
    
    await page.evaluate(({ email, userId }) => {
      const mockSession = {
        access_token: `mock-token-${Date.now()}`,
        refresh_token: `mock-refresh-${Date.now()}`,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: userId,
          aud: 'authenticated',
          email: email,
          email_confirmed_at: new Date().toISOString(),
          phone: '',
          confirmation_sent_at: new Date().toISOString(),
          confirmed_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
          app_metadata: {
            provider: 'email',
            providers: ['email']
          },
          user_metadata: {
            onboarding_completed: false,
            onboarding_step: 1,
            gmail_connected: false
          },
          identities: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
      
      // Store session in localStorage
      const authKey = `sb-${window.location.hostname.replace(/\./g, '-')}-auth-token`
      localStorage.setItem(authKey, JSON.stringify({
        user: mockSession.user,
        session: mockSession
      }))
      
      localStorage.setItem('sb-auth-token', JSON.stringify({
        user: mockSession.user,
        session: mockSession
      }))
      
      // Mock Supabase auth methods
      if (window.supabase?.auth) {
        const supabaseAuth = window.supabase.auth
        
        supabaseAuth.getSession = async () => ({
          data: { session: mockSession },
          error: null
        })
        
        supabaseAuth.getUser = async () => ({
          data: { user: mockSession.user },
          error: null
        })
        
        supabaseAuth.refreshSession = async () => ({
          data: { session: mockSession },
          error: null
        })
        
        // Trigger auth state change
        const originalOnAuthStateChange = supabaseAuth.onAuthStateChange
        supabaseAuth.onAuthStateChange = (callback) => {
          setTimeout(() => {
            callback('SIGNED_IN', mockSession)
          }, 100)
          
          return {
            data: {
              subscription: {
                unsubscribe: () => {}
              }
            }
          }
        }
      }
      
      console.log('Mock auth setup complete:', { email, userId })
    }, { email: mockEmail, userId: mockUserId });
    
    console.log('✅ Mock authentication completed');
    await page.waitForTimeout(2000);
    
    // Check current URL and page content
    console.log('🔍 Current URL:', page.url());
    
    // Check if we can see any content
    const bodyText = await page.textContent('body');
    console.log('📄 Page content (first 500 chars):', bodyText.substring(0, 500));
    
    // Try to navigate to onboarding
    console.log('🎯 Navigating to /onboarding...');
    await page.goto('http://localhost:5173/onboarding');
    await page.waitForTimeout(3000);
    
    // Check final URL and content
    console.log('🔍 Final URL:', page.url());
    const finalBodyText = await page.textContent('body');
    console.log('📄 Final page content (first 500 chars):', finalBodyText.substring(0, 500));
    
    // Check for specific elements
    const onboardingContainer = await page.locator('[data-testid="onboarding-container"]').count();
    console.log('🎯 Onboarding container found:', onboardingContainer);
    
    const loginForm = await page.locator('[data-testid="email-input"]').count();
    console.log('🔐 Login form found:', loginForm);
    
    console.log('✅ Debug complete - check the browser window');
    await page.waitForTimeout(10000); // Keep browser open for manual inspection
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await browser.close();
  }
}

debugAuth();
