import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { performLogout, emergencyLogout } from '../lib/logout'
import type { User } from '../types'

interface BudgetProfile {
  id?: string
  user_id: string
  monthly_income?: number
  fixed_costs?: number
  savings_target?: number
  discretionary_budget?: number
  spending_limit_alerts?: boolean
}

export default function Budget() {
  const [income, setIncome] = useState('')
  const [fixedCosts, setFixedCosts] = useState('')
  const [savingsTarget, setSavingsTarget] = useState('')
  const [loading, setLoading] = useState(false)
  const [userLoading, setUserLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      setUserLoading(true)
      setError('')

      // Get current session and user
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      console.log('Authentication check:', {
        hasSession: !!session,
        hasUser: !!user,
        userId: user?.id,
        userEmail: user?.email,
        sessionUserId: session?.user?.id,
        userError: userError?.message,
      })

      if (userError) {
        console.error('User authentication error:', userError)
        setError('Authentication error. Please sign out and sign in again.')
        return
      }

      if (!session || !user) {
        setError('You must be logged in to access this page. Redirecting to login...')
        setTimeout(() => navigate('/'), 2000)
        return
      }

      // Test if this specific user exists by trying a simple operation that would fail with foreign key error
      try {
        const { data: testData, error: testError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()

        console.log('Profile test result:', { testData, testError })

        if (testError) {
          console.error('Profile test failed:', testError)
          if (
            testError.message.includes('Key is not present in table "users"') ||
            testError.code === '23503'
          ) {
            // Foreign key constraint violation - user doesn't exist in auth.users
            console.error('User does not exist in auth.users table')
            setError('Your account session is corrupted. Please sign out and create a new account.')
            return
          }
        }
      } catch (testErr) {
        console.error('Authentication test failed:', testErr)
        setError('Unable to verify authentication. Please sign out and sign in again.')
        return
      }

      setUser(user)

      // Load existing budget after user is confirmed
      await loadExistingBudget(user.id)
    } catch (error) {
      console.error('Error checking user:', error)
      setError('Authentication error. Please try logging in again.')
    } finally {
      setUserLoading(false)
    }
  }

  const loadExistingBudget = async (userId?: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const targetUserId = userId || user?.id

      if (!targetUserId) return

      const { data }: { data: BudgetProfile | null } = await supabase
        .from('budget_profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .single()

      if (data) {
        // Populate form with existing data
        setIncome(data.monthly_income?.toString() || '')
        setFixedCosts(data.fixed_costs?.toString() || '')
        setSavingsTarget(data.savings_target?.toString() || '')
      }
    } catch (error) {
      // No existing budget profile or error loading
      console.log('No existing budget found or error:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    // Check if user is authenticated
    if (!user?.id) {
      setError('You must be logged in to save budget data. Please refresh and try again.')
      setLoading(false)
      return
    }

    // Verify user exists and is properly authenticated
    console.log('Current user:', user)
    console.log('User ID:', user.id)
    console.log('User email:', user.email)

    const incomeNum = parseFloat(income)
    const fixedNum = parseFloat(fixedCosts)
    const savingsNum = parseFloat(savingsTarget)

    // Validation
    if (!incomeNum || incomeNum <= 0) {
      setError('Please enter a valid income amount')
      setLoading(false)
      return
    }

    if (!fixedNum || fixedNum < 0) {
      setError('Please enter a valid fixed costs amount')
      setLoading(false)
      return
    }

    if (!savingsNum || savingsNum < 0) {
      setError('Please enter a valid savings target amount')
      setLoading(false)
      return
    }

    // Calculate discretionary budget (what's available for subscriptions after fixed costs and savings)
    const discretionaryBudget = incomeNum - fixedNum - savingsNum

    if (discretionaryBudget < 0) {
      setError(
        'Your fixed costs and savings target exceed your income. Please adjust your amounts.'
      )
      setLoading(false)
      return
    }

    try {
      // Verify user exists and is properly authenticated
      console.log('Current user:', user)
      console.log('User ID:', user.id)
      console.log('User email:', user.email)

      // Refresh the session to ensure it's valid
      const { error: refreshError } = await supabase.auth.refreshSession()

      if (refreshError) {
        console.error('Session refresh error:', refreshError)
        throw new Error('Session expired. Please sign out and sign in again.')
      }

      console.log('Session refreshed successfully')

      // First, ensure user has a profile (this should be created automatically)
      const { error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log('Creating user profile...')
        const { error: createProfileError } = await supabase.from('profiles').insert({
          id: user.id,
          email: user.email,
        })

        if (createProfileError) {
          console.error('Failed to create profile:', createProfileError)
          if (createProfileError.message.includes('Key is not present in table "users"')) {
            throw new Error(
              'User authentication is invalid. Please sign out completely and create a new account.'
            )
          }
          throw new Error('Failed to create user profile. Please try again.')
        }
      } else if (profileError) {
        console.error('Profile check error:', profileError)
        if (profileError.message.includes('Key is not present in table "users"')) {
          throw new Error(
            'User authentication is invalid. Please sign out completely and create a new account.'
          )
        }
        throw new Error('Failed to verify user profile. Please try again.')
      }

      // Use only the fields that we know exist and work
      const budgetData = {
        user_id: user.id,
        monthly_income: incomeNum,
      }

      console.log('Attempting to save budget data:', budgetData)

      const { data, error } = await supabase
        .from('budget_profiles')
        .upsert(budgetData, {
          onConflict: 'user_id',
        })
        .select()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Budget save successful:', data)

      setSuccess(true)

      // Show success message for 1.5 seconds, then navigate to dashboard
      setTimeout(() => {
        navigate('/dashboard')
      }, 1500)
    } catch (error: unknown) {
      console.error('Budget save error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (errorMessage.includes('currency')) {
        setError(
          'Database configuration issue with currency field. This has been reported to the developers.'
        )
      } else if (errorMessage.includes('discretionary_budget')) {
        setError(
          'Database configuration issue with budget calculation field. This has been reported to the developers.'
        )
      } else if (errorMessage.includes('row-level security')) {
        setError('Permission error. Please make sure you are logged in properly.')
      } else if (
        errorMessage.includes('foreign key constraint') ||
        errorMessage.includes('user_id_fkey')
      ) {
        setError('User authentication error. Please sign out and sign in again.')
      } else if (
        errorMessage.includes('Key is not present in table "users"') ||
        errorMessage.includes('authentication is invalid')
      ) {
        setError(
          'User account is not properly set up. Please sign out completely and create a new account.'
        )
      } else {
        setError(errorMessage || 'Failed to save budget')
      }
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const discretionaryBudget =
    parseFloat(income || '0') - parseFloat(fixedCosts || '0') - parseFloat(savingsTarget || '0')

  // Show loading state while checking user authentication
  if (userLoading) {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-gray-600 hover:text-gray-900 text-sm">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Budget Setup</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={() =>
                  performLogout({ redirectTo: '/', clearStorage: true, forceReload: false })
                }
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow rounded-lg p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Set Your Monthly Budget</h2>
            <p className="text-gray-600">
              Enter your monthly income, fixed costs, and savings target to calculate your available
              budget for subscriptions and discretionary spending.
            </p>
          </div>

          {success && (
            <div className="mb-6 rounded-md bg-green-50 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-green-700">
                  Budget saved successfully! 🎉 Redirecting to dashboard...
                </div>
                <Link
                  to="/dashboard"
                  className="px-3 py-1 text-xs font-medium text-green-600 bg-green-100 hover:bg-green-200 rounded-md border border-green-200 hover:border-green-300 transition-colors"
                >
                  Go to Dashboard Now
                </Link>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
              <div className="text-sm text-red-700">
                {error}
                {(error.includes('authentication') ||
                  error.includes('sign out') ||
                  error.includes('foreign key') ||
                  error.includes('account is not properly set up') ||
                  error.includes('corrupted')) && (
                  <div className="mt-4 p-3 bg-red-100 rounded border border-red-300">
                    <div className="flex items-center space-x-2 text-xs mb-2">
                      <strong className="text-red-800">🚨 Session Issue Detected</strong>
                    </div>
                    <p className="text-xs text-red-700 mb-3">
                      Your browser session is out of sync with the database. This commonly happens
                      during development or after database resets.
                    </p>
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => emergencyLogout()}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        🔄 Clear Session & Go Home
                      </button>
                      <p className="text-xs text-red-600">
                        After clearing, you'll need to sign up or sign in again.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="income" className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Income <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  id="income"
                  name="income"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="4000.00"
                  value={income}
                  onChange={e => setIncome(e.target.value)}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Your total monthly income before taxes and deductions
              </p>
            </div>

            <div>
              <label htmlFor="fixedCosts" className="block text-sm font-medium text-gray-700 mb-2">
                Fixed Costs <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  id="fixedCosts"
                  name="fixedCosts"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1200.00"
                  value={fixedCosts}
                  onChange={e => setFixedCosts(e.target.value)}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Rent, utilities, insurance, loan payments, etc.
              </p>
            </div>

            <div>
              <label
                htmlFor="savingsTarget"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Savings Target <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  id="savingsTarget"
                  name="savingsTarget"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="500.00"
                  value={savingsTarget}
                  onChange={e => setSavingsTarget(e.target.value)}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">How much you want to save each month</p>
            </div>

            {/* Budget Summary */}
            {income && fixedCosts && savingsTarget && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Budget Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Income:</span>
                    <span className="font-medium">{formatCurrency(parseFloat(income))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fixed Costs:</span>
                    <span className="font-medium">-{formatCurrency(parseFloat(fixedCosts))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Savings Target:</span>
                    <span className="font-medium">
                      -{formatCurrency(parseFloat(savingsTarget))}
                    </span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-900 font-medium">Available Budget:</span>
                      <span
                        className={`font-bold ${discretionaryBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {formatCurrency(discretionaryBudget)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Available for subscriptions and discretionary spending
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <Link
                to="/dashboard"
                className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {loading ? 'Saving...' : 'Save Budget'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
