import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ParsedTrialEmail } from '../lib/gmailParser'
import { fetchGmailIntegration } from '../lib/fetchGmailIntegration'
import { googleAuthService } from '../lib/googleAuth'

interface BudgetData {
  income: string
  housing: string
  food: string
  transportation: string
  entertainment: string
  savings: string
  currency: string
}

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [foundSubscriptions, setFoundSubscriptions] = useState<ParsedTrialEmail[]>([])
  const [error, setError] = useState<string | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [hasCheckedUser, setHasCheckedUser] = useState(false)
  const [budgetData, setBudgetData] = useState<BudgetData>({
    income: '',
    housing: '',
    food: '',
    transportation: '',
    entertainment: '',
    savings: '',
    currency: 'USD'
  })
  const [budgetErrors, setBudgetErrors] = useState<{[key: string]: string}>({})
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    // Add a small delay to prevent flashing
    const initializeComponent = async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
      checkUser()
    }

    initializeComponent()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setCurrentUser(session.user)
        setHasCheckedUser(true)

        if (!session.user.user_metadata?.onboarding_completed) {
          setInitializing(false)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Separate effect for handling URL step parameter changes
  useEffect(() => {
    const urlStep = searchParams.get('step')
    if (urlStep && !isNaN(parseInt(urlStep))) {
      const step = Math.min(Math.max(parseInt(urlStep), 1), 2)
      setCurrentStep(step)
    }
  }, [searchParams])

  // Separate effect for handling Gmail OAuth callback
  useEffect(() => {
    const gmailConnected = searchParams.get('gmail_connected')
    if (gmailConnected === 'true' && currentUser && !isScanning) {
      handleGmailScan()
    }
  }, [searchParams, currentUser])

  const checkUser = async () => {
    try {
      setInitializing(true)
      setError(null)

      // Check if we're in test mode (for E2E tests)
      const isTestMode = typeof window !== 'undefined' && 
        (localStorage.getItem('TEST_MODE') === 'true' || 
         localStorage.getItem('TEST_AUTHENTICATED') === 'true')

      if (isTestMode) {
        // In test mode, create a mock user
        const mockUser = {
          id: 'test-user',
          email: 'test@example.com',
          user_metadata: {
            onboarding_completed: false,
            onboarding_step: 1,
            gmail_connected: false
          }
        }
        setCurrentUser(mockUser)
        setHasCheckedUser(true)
        setInitializing(false)
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setTimeout(() => {
          navigate('/signup')
        }, 2000)
        return
      }

      setCurrentUser(user)
      setHasCheckedUser(true)

      // Check if user has already completed onboarding
      if (user.user_metadata?.onboarding_completed) {
        navigate('/dashboard')
        return
      }

      // Initialize step from URL or user metadata
      const urlStep = searchParams.get('step')
      const metadataStep = user.user_metadata?.onboarding_step

      if (urlStep && !isNaN(parseInt(urlStep))) {
        const step = Math.min(Math.max(parseInt(urlStep), 1), 2)
        setCurrentStep(step)
      } else if (metadataStep && metadataStep > 1) {
        setCurrentStep(Math.min(metadataStep, 2))
      }

      // Ensure user has a profile
      await ensureUserProfile(user)
    } catch (err) {
      console.error('Error checking user:', err)
      setError('Failed to load user information. Please try refreshing the page.')
    } finally {
      setInitializing(false)
    }
  }

  const ensureUserProfile = async (user: any) => {
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!existingProfile) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: user.id,
          email: user.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (profileError) {
          console.error('Error creating user profile:', profileError)
        }
      }
    } catch (err) {
      console.error('Error ensuring user profile:', err)
    }
  }

  const handleGmailScan = async () => {
    if (!currentUser) return

    try {
      setIsScanning(true)
      setError(null)

      // Get Gmail access token from user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('gmail_access_token')
        .eq('id', currentUser.id)
        .single()

      if (profileError || !profile?.gmail_access_token) {
        throw new Error('Gmail access token not found. Please reconnect Gmail.')
      }

      console.log('🔍 Scanning Gmail for subscriptions...')

      // Use real Gmail integration to scan emails
      const parsedTrials = await fetchGmailIntegration.fetchAndParseSubscriptions(
        profile.gmail_access_token
      )
      setFoundSubscriptions(parsedTrials)

      console.log('✅ Gmail scan complete:', parsedTrials)
      setCurrentStep(2)
    } catch (error) {
      console.error('Gmail scan error:', error)
      setError(error instanceof Error ? error.message : 'Failed to scan Gmail')
    } finally {
      setIsScanning(false)
    }
  }

  const handleGmailConnect = async () => {
    setLoading(true)

    try {
      const authUrl = googleAuthService.getAuthUrl()
      console.log('Redirecting to Google OAuth...')
      window.location.href = authUrl
    } catch (error) {
      console.error('Gmail connection error:', error)
      setError('Failed to connect Gmail. Please try again.')
      setLoading(false)
    }
  }

  const handleSkipGmail = async () => {
    try {
      await supabase.auth.updateUser({
        data: {
          gmail_connected: false,
          onboarding_step: 2,
        },
      })
      setCurrentStep(2)
    } catch (error) {
      console.error('Error skipping Gmail:', error)
      setError('Failed to skip Gmail step. Please try again.')
    }
  }

  const handleCompleteBudgetSetup = async () => {
    try {
      setLoading(true)
      
      // Validate required fields
      if (!budgetData.income) {
        setError('Please enter your monthly income')
        setLoading(false)
        return
      }

      // Save budget to database
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { error: budgetError } = await supabase.from('budget_profiles').upsert({
          user_id: user.id,
          monthly_income: parseFloat(budgetData.income) || 0,
          fixed_costs: (parseFloat(budgetData.housing) || 0) + 
                      (parseFloat(budgetData.food) || 0) + 
                      (parseFloat(budgetData.transportation) || 0) + 
                      (parseFloat(budgetData.entertainment) || 0),
          savings_target: parseFloat(budgetData.savings) || 0,
          currency: budgetData.currency,
          updated_at: new Date().toISOString(),
        })

        if (budgetError) {
          console.error('Error saving budget:', budgetError)
          setError('Failed to save budget. Please try again.')
          setLoading(false)
          return
        }

        // Mark onboarding as completed
        await supabase.auth.updateUser({
          data: {
            onboarding_completed: true,
            onboarding_step: 2,
          },
        })
      }

      // Show success message briefly before navigating
      setSuccess(true)
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
    } catch (error) {
      console.error('Error completing budget setup:', error)
      setError('Failed to complete setup. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBudgetInputChange = (field: keyof BudgetData, value: string) => {
    setBudgetData(prev => ({ ...prev, [field]: value }))
    
    // Clear any existing error for this field
    setBudgetErrors(prev => ({ ...prev, [field]: '' }))
    
    // Validate the input
    validateBudgetField(field, value)
  }

  const validateBudgetField = (field: keyof BudgetData, value: string) => {
    let error = ''
    
    if (field === 'income' && !value) {
      error = 'Monthly income is required'
    } else if (field === 'food' && !value) {
      error = 'Food budget is required'
    } else if (field === 'transportation' && value && !/^\d+(\.\d{1,2})?$/.test(value)) {
      error = 'Please enter a valid number'
    } else if (field === 'currency' && !value) {
      error = 'Please select a currency'
    } else if (['income', 'housing', 'food', 'transportation', 'entertainment', 'savings'].includes(field) && value && parseFloat(value) < 0) {
      error = 'Amount cannot be negative'
    }
    
    if (error) {
      setBudgetErrors(prev => ({ ...prev, [field]: error }))
    }
  }

  // Calculate budget totals for display
  const calculateBudgetTotals = () => {
    const income = parseFloat(budgetData.income) || 0
    const housing = parseFloat(budgetData.housing) || 0
    const food = parseFloat(budgetData.food) || 0
    const transportation = parseFloat(budgetData.transportation) || 0
    const entertainment = parseFloat(budgetData.entertainment) || 0
    const savings = parseFloat(budgetData.savings) || 0
    
    // Total expenses does NOT include savings (savings is not an expense)
    const totalExpenses = housing + food + transportation + entertainment
    const remaining = income - totalExpenses - savings  // Subtract both expenses and savings from income
    
    // Calculate percentages
    const housingPercentage = income > 0 ? Math.round((housing / income) * 100) : 0
    const foodPercentage = income > 0 ? Math.round((food / income) * 100) : 0
    const transportationPercentage = income > 0 ? Math.round((transportation / income) * 100) : 0
    
    return {
      income,
      housing,
      food,
      transportation,
      entertainment,
      savings,
      totalExpenses,
      remaining,
      formattedIncome: income.toFixed(2),
      formattedTotalExpenses: totalExpenses.toFixed(2),
      formattedRemaining: remaining.toFixed(2),
      housingPercentage,
      foodPercentage,
      transportationPercentage
    }
  }

  const handleSkipBudget = async () => {
    try {
      // Mark onboarding as completed without budget
      await supabase.auth.updateUser({
        data: {
          onboarding_completed: true,
          onboarding_step: 2,
        },
      })
      navigate('/dashboard')
    } catch (error) {
      console.error('Error skipping budget:', error)
      setError('Failed to skip budget step. Please try again.')
    }
  }

  // Generate user name from email
  const userName = currentUser?.email?.split('@')[0]?.replace(/[^a-zA-Z]/g, '') || 'there'
  const displayName = currentUser ? userName.charAt(0).toUpperCase() + userName.slice(1) : 'there'

  // Show loading state while initializing or if user hasn't been checked yet
  if (initializing || (!currentUser && !hasCheckedUser)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Setting up your onboarding experience...</p>
        </div>
      </div>
    )
  }

  // If we've checked for user but still don't have one, show loading (redirect will happen)
  if (!currentUser && hasCheckedUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to signup...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 transition-opacity duration-300 ease-in-out opacity-100" data-testid="onboarding-container">
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
              <div className="flex items-center space-x-2 text-sm text-gray-500" data-testid="progress-indicator" role="progressbar">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                  } ${currentStep === 1 ? 'ring-2 ring-blue-200' : ''}`}
                  data-testid="progress-step-1"
                >
                  1
                </div>
                <div
                  className={`w-8 h-0.5 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}
                ></div>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                  } ${currentStep === 2 ? 'ring-2 ring-blue-200' : ''}`}
                  data-testid="progress-step-2"
                >
                  2
                </div>
                <div className="text-xs text-gray-500 ml-2" data-testid="step-counter">
                  {currentStep} of 2
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4" data-testid="gmail-error-message error-message" role="alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="onboarding-container">
        {/* Step 1: Gmail Integration */}
        {currentStep === 1 && (
          <div className="text-center" data-testid="onboarding-step-1">
            <div className="mb-8" data-testid="gmail-connection-step">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome to SubTracker, {displayName}! 👋
              </h1>
              <p className="text-lg text-gray-600 mb-8" data-testid="step-description">
                Let's get you set up in just a few quick steps - Connect your Gmail
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-8 max-w-2xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Connect Your Gmail</h2>
                <p className="text-gray-600" data-testid="gmail-step-explanation">
                  We'll automatically scan your inbox to find existing subscriptions and trials.
                  This saves you time and ensures you don't miss anything important.
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-blue-900 mb-3">What we'll scan for:</h3>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Active subscriptions and recurring payments
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Free trials that are ending soon
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Billing receipts and invoices
                  </li>
                </ul>
              </div>

              {/* Gmail Connection Status */}
              {isScanning && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg" data-testid="loading-spinner">
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-blue-800">Scanning your Gmail...</span>
                  </div>
                </div>
              )}

              {foundSubscriptions.length > 0 && (
                <div className="mb-6 p-4 bg-green-50 rounded-lg" data-testid="gmail-connected-status">
                  <div className="text-green-800 font-medium">Gmail Connected - Found {foundSubscriptions.length} subscriptions!</div>
                </div>
              )}

              <div className="space-y-4">
                <button
                  onClick={handleGmailConnect}
                  disabled={loading || isScanning}
                  className="w-full inline-flex justify-center items-center py-3 px-6 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
                  data-testid="gmail-connect-button"
                >
                  {loading || isScanning ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin h-5 w-5 mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {isScanning ? 'Scanning your Gmail...' : 'Connecting...'}
                    </div>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Connect Gmail & Scan for Subscriptions
                    </>
                  )}
                </button>

                <button
                  onClick={handleSkipGmail}
                  disabled={loading || isScanning}
                  className="w-full py-2 px-4 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="skip-gmail-button"
                >
                  Skip for now (you can connect later)
                </button>
              </div>

              <div className="mt-6 text-xs text-gray-500">
                <p>
                  🔒 We only access your email to find subscription-related messages. Your privacy
                  is protected and you can disconnect at any time.
                </p>
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t">
                <div></div>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  data-testid="next-step-button"
                >
                  Next
                  <svg
                    className="ml-2 -mr-1 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Budget Setup */}
        {currentStep === 2 && (
          <div className="text-center" data-testid="onboarding-step-2">
            <div className="mb-8" data-testid="budget-setup-step">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {foundSubscriptions.length > 0
                  ? 'Great! We found your subscriptions'
                  : "Perfect! Now let's set your budget"}
              </h1>
              <p className="text-lg text-gray-600">
                {foundSubscriptions.length > 0
                  ? `We discovered ${foundSubscriptions.length} subscription${foundSubscriptions.length !== 1 ? 's' : ''} in your Gmail`
                  : 'Setting a budget helps you track spending and get alerts before you overspend'}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-8 max-w-2xl mx-auto">
              {foundSubscriptions.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Found Subscriptions:</h3>
                  <div className="space-y-2 text-left">
                    {foundSubscriptions.slice(0, 5).map((sub, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                      >
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
                  This helps us track your spending and send you alerts when you're approaching your
                  limits.
                </p>
              </div>

              {/* Budget Form */}
              <form data-testid="budget-form" className="space-y-6 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Monthly Income */}
                  <div className="md:col-span-2">
                    <label htmlFor="income" className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Income *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        id="income"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={budgetData.income}
                        onChange={e => handleBudgetInputChange('income', e.target.value)}
                        data-testid="income-input"
                        aria-label="Monthly Income"
                        placeholder={`Enter amount in ${budgetData.currency || 'USD'}`}
                      />
                    </div>
                    {budgetErrors.income && (
                      <p className="mt-1 text-sm text-red-600" data-testid="income-error" role="alert">{budgetErrors.income}</p>
                    )}
                  </div>

                  {/* Housing */}
                  <div>
                    <label htmlFor="housing" className="block text-sm font-medium text-gray-700 mb-2">
                      Housing/Rent
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        id="housing"
                        type="number"
                        step="0.01"
                        min="0"
                        className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={budgetData.housing}
                        onChange={e => handleBudgetInputChange('housing', e.target.value)}
                        data-testid="housing-input"
                        aria-label="Housing Expenses"
                      />
                    </div>
                  </div>

                  {/* Food */}
                  <div>
                    <label htmlFor="food" className="block text-sm font-medium text-gray-700 mb-2">
                      Food & Groceries
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        id="food"
                        type="number"
                        step="0.01"
                        min="0"
                        className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={budgetData.food}
                        onChange={e => handleBudgetInputChange('food', e.target.value)}
                        data-testid="food-input"
                        aria-label="Food Expenses"
                      />
                    </div>
                    {budgetErrors.food && (
                      <p className="mt-1 text-sm text-red-600" data-testid="food-error" role="alert">{budgetErrors.food}</p>
                    )}
                  </div>

                  {/* Transportation */}
                  <div>
                    <label htmlFor="transportation" className="block text-sm font-medium text-gray-700 mb-2">
                      Transportation
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        id="transportation"
                        type="number"
                        step="0.01"
                        min="0"
                        className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={budgetData.transportation}
                        onChange={e => handleBudgetInputChange('transportation', e.target.value)}
                        data-testid="transportation-input"
                        aria-label="Transportation Expenses"
                      />
                    </div>
                    {budgetErrors.transportation && (
                      <p className="mt-1 text-sm text-red-600" data-testid="transportation-error" role="alert">{budgetErrors.transportation}</p>
                    )}
                  </div>

                  {/* Entertainment */}
                  <div>
                    <label htmlFor="entertainment" className="block text-sm font-medium text-gray-700 mb-2">
                      Entertainment
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        id="entertainment"
                        type="number"
                        step="0.01"
                        min="0"
                        className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={budgetData.entertainment}
                        onChange={e => handleBudgetInputChange('entertainment', e.target.value)}
                        data-testid="entertainment-input"
                        aria-label="Entertainment Expenses"
                      />
                    </div>
                  </div>

                  {/* Savings */}
                  <div>
                    <label htmlFor="savings" className="block text-sm font-medium text-gray-700 mb-2">
                      Savings Target
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        id="savings"
                        type="number"
                        step="0.01"
                        min="0"
                        className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={budgetData.savings}
                        onChange={e => handleBudgetInputChange('savings', e.target.value)}
                        data-testid="savings-input"
                        aria-label="Savings Target"
                      />
                    </div>
                  </div>

                  {/* Currency */}
                  <div>
                    <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      id="currency"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      data-testid="currency-select"
                      aria-label="Currency"
                      value={budgetData.currency}
                      onChange={e => handleBudgetInputChange('currency', e.target.value)}
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                    </select>
                    <div className="mt-1 text-xs text-gray-500" data-testid="currency-display">
                      Selected: {budgetData.currency}
                    </div>
                    {budgetErrors.currency && (
                      <p className="mt-1 text-sm text-red-600" data-testid="currency-error" role="alert">{budgetErrors.currency}</p>
                    )}
                  </div>
                </div>

                {/* Budget Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Budget Summary</h3>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Monthly Income:</span>
                      <span data-testid="budget-income-display">${calculateBudgetTotals().formattedIncome}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Housing (<span data-testid="housing-percentage">{calculateBudgetTotals().housingPercentage}%</span>):</span>
                      <span>${calculateBudgetTotals().housing.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Expenses:</span>
                      <span data-testid="budget-total-expenses">${calculateBudgetTotals().formattedTotalExpenses}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Available for Subscriptions:</span>
                      <span data-testid="budget-remaining" className={calculateBudgetTotals().remaining >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ${calculateBudgetTotals().formattedRemaining}
                      </span>
                    </div>
                  </div>
                </div>
              </form>

              <div className="space-y-4 mt-8">
                {/* Budget validation warnings */}
                {calculateBudgetTotals().remaining < 0 && budgetData.income && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4" data-testid="budget-warning" role="alert">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Budget Exceeds Income</h3>
                        <p className="text-sm text-yellow-700 mt-1" data-testid="budget-suggestion">
                          Your expenses and savings target exceed your monthly income. Consider adjusting your amounts.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success message */}
                {success && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4" data-testid="success-message" role="alert">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">Budget Setup Completed!</h3>
                        <p className="text-sm text-green-700 mt-1">
                          Your budget has been successfully saved. Redirecting to dashboard...
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleCompleteBudgetSetup}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="finish-onboarding-button"
                >
                  {loading ? 'Saving...' : 'Complete Setup & Go to Dashboard'}
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

              {/* Navigation */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  data-testid="previous-step-button"
                >
                  <svg
                    className="mr-2 -ml-1 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back
                </button>
                <div></div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
