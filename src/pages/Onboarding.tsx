import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { gmailIntegration, ParsedTrialEmail } from '../lib/gmailParser'

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [foundSubscriptions, setFoundSubscriptions] = useState<ParsedTrialEmail[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      navigate('/signup')
      return
    }
    setCurrentUser(user)

    // Check if user has already completed onboarding
    if (user.user_metadata?.onboarding_completed) {
      navigate('/dashboard')
      return
    }
  }

  const handleGmailConnect = async () => {
    setLoading(true)

    try {
      // In a real implementation, this would trigger Google OAuth
      const mockAccessToken = 'mock-gmail-access-token-' + Date.now()
      
      // Store the access token in the user's profile
      if (currentUser) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: currentUser.id,
            gmail_access_token: mockAccessToken,
            updated_at: new Date().toISOString()
          })

        if (profileError) {
          console.error('Error storing Gmail token:', profileError)
          alert('Failed to store Gmail access token')
          setLoading(false)
          return
        }

        // Update user metadata
        await supabase.auth.updateUser({
          data: { 
            gmail_connected: true,
            onboarding_step: 2
          }
        })
      }
      
      setIsScanning(true)
      
      // Simulate Gmail scanning
      const parsedTrials: ParsedTrialEmail[] = await gmailIntegration.fetchAndParseSubscriptions(mockAccessToken)
      setFoundSubscriptions(parsedTrials)
      
      console.log('Parsed trials from Gmail:', parsedTrials)
      setCurrentStep(2)
      
    } catch (error) {
      console.error('Gmail connection error:', error)
      alert('Failed to connect Gmail')
    } finally {
      setLoading(false)
      setIsScanning(false)
    }
  }

  const handleSkipGmail = async () => {
    // Mark Gmail as skipped but continue onboarding
    await supabase.auth.updateUser({
      data: { 
        gmail_connected: false,
        onboarding_step: 2
      }
    })
    setCurrentStep(2)
  }

  const handleCompleteBudgetSetup = () => {
    navigate('/budget?onboarding=true')
  }

  const handleSkipBudget = async () => {
    // Mark onboarding as completed
    await supabase.auth.updateUser({
      data: { 
        onboarding_completed: true,
        onboarding_step: 3
      }
    })
    navigate('/dashboard')
  }

  const handleCompleteOnboarding = async () => {
    // Mark onboarding as completed
    await supabase.auth.updateUser({
      data: { 
        onboarding_completed: true,
        onboarding_step: 3
      }
    })
    navigate('/dashboard')
  }

  // Generate user name from email
  const userName = currentUser?.email?.split('@')[0]?.replace(/[^a-zA-Z]/g, '') || 'there'
  const displayName = currentUser ? userName.charAt(0).toUpperCase() + userName.slice(1) : 'there'

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">SubTracker</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  1
                </div>
                <div className={`w-8 h-0.5 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  2
                </div>
                <div className={`w-8 h-0.5 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  3
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Step 1: Gmail Integration */}
        {currentStep === 1 && (
          <div className="text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome to SubTracker, {displayName}! 👋
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Let's get you set up in just a few quick steps
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-8 max-w-2xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Connect Your Gmail
                </h2>
                <p className="text-gray-600">
                  We'll automatically scan your inbox to find existing subscriptions and trials. 
                  This saves you time and ensures you don't miss anything important.
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-blue-900 mb-3">What we'll scan for:</h3>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Active subscriptions and recurring payments
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Free trials that are ending soon
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Billing receipts and invoices
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleGmailConnect}
                  disabled={loading || isScanning}
                  className="w-full inline-flex justify-center items-center py-3 px-6 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
                >
                  {loading || isScanning ? (
                    <div className="flex items-center">
                      <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isScanning ? 'Scanning your Gmail...' : 'Connecting...'}
                    </div>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Connect Gmail & Scan for Subscriptions
                    </>
                  )}
                </button>

                <button
                  onClick={handleSkipGmail}
                  disabled={loading || isScanning}
                  className="w-full py-2 px-4 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Skip for now (you can connect later)
                </button>
              </div>

              <div className="mt-6 text-xs text-gray-500">
                <p>
                  🔒 We only access your email to find subscription-related messages. 
                  Your privacy is protected and you can disconnect at any time.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Found Subscriptions / Budget Setup */}
        {currentStep === 2 && (
          <div className="text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {foundSubscriptions.length > 0 ? 'Great! We found your subscriptions' : 'Perfect! Now let\'s set your budget'}
              </h1>
              <p className="text-lg text-gray-600">
                {foundSubscriptions.length > 0 
                  ? `We discovered ${foundSubscriptions.length} subscription${foundSubscriptions.length !== 1 ? 's' : ''} in your Gmail`
                  : 'Setting a budget helps you track spending and get alerts before you overspend'
                }
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-8 max-w-2xl mx-auto">
              {foundSubscriptions.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Found Subscriptions:
                  </h3>
                  <div className="space-y-2 text-left">
                    {foundSubscriptions.slice(0, 5).map((sub, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{sub.serviceName}</span>
                        <span className="text-green-600 font-semibold">${sub.amount}/month</span>
                      </div>
                    ))}
                    {foundSubscriptions.length > 5 && (
                      <p className="text-sm text-gray-500 text-center">
                        + {foundSubscriptions.length - 5} more subscriptions found
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Set Your Monthly Budget
                </h2>
                <p className="text-gray-600">
                  This helps us track your spending and send you alerts when you're approaching your limits.
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleCompleteBudgetSetup}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 transition duration-150 ease-in-out"
                >
                  Set Up My Budget
                </button>

                <button
                  onClick={handleSkipBudget}
                  className="w-full py-2 px-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  Skip budget setup (you can set it up later)
                </button>
              </div>

              <div className="mt-6 text-xs text-gray-500">
                <p>
                  💡 Users with budgets save an average of 23% on their monthly subscription costs
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Welcome to Dashboard */}
        {currentStep === 3 && (
          <div className="text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🎉 You're all set!
              </h1>
              <p className="text-lg text-gray-600">
                Welcome to your SubTracker dashboard. Here's what you can do:
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-8 max-w-2xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="text-left p-4 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Track Subscriptions</h3>
                  <p className="text-sm text-gray-600">Monitor all your recurring payments in one place</p>
                </div>

                <div className="text-left p-4 bg-green-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Budget Insights</h3>
                  <p className="text-sm text-gray-600">Get smart alerts and spending recommendations</p>
                </div>

                <div className="text-left p-4 bg-yellow-50 rounded-lg">
                  <div className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Trial Alerts</h3>
                  <p className="text-sm text-gray-600">Never get charged for forgotten free trials</p>
                </div>

                <div className="text-left p-4 bg-purple-50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 002 2h2a2 2 0 012-2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 00-2 2h-2a2 2 0 00-2 2v6a2 2 0 01-2 2H9z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Weekly Reports</h3>
                  <p className="text-sm text-gray-600">Get detailed insights on your spending patterns</p>
                </div>
              </div>

              <button
                onClick={handleCompleteOnboarding}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 transition duration-150 ease-in-out"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
