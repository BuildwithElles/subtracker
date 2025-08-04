import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface BudgetProfile {
  id?: string
  user_id: string
  monthly_budget: number
  currency: string
  spending_limit_alerts: boolean
}

export default function Budget() {
  const [income, setIncome] = useState('')
  const [fixedCosts, setFixedCosts] = useState('')
  const [savingsTarget, setSavingsTarget] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  const navigate = useNavigate()

  useEffect(() => {
    checkUser()
    loadExistingBudget()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadExistingBudget = async () => {
    try {
      const { data } = await supabase
        .from('budget_profiles')
        .select('*')
        .single()

      if (data) {
        // For now, we'll leave the form empty if there's existing data
        // since the schema doesn't have separate income/fixed/savings fields
        // The monthly_budget field represents the total discretionary budget
      }
    } catch (error) {
      // No existing budget profile
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

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

    // Calculate monthly budget (discretionary spending after fixed costs and savings)
    const monthlyBudget = incomeNum - fixedNum - savingsNum

    if (monthlyBudget < 0) {
      setError('Your fixed costs and savings target exceed your income. Please adjust your amounts.')
      setLoading(false)
      return
    }

    try {
      if (!user?.id) {
        setError('You must be logged in to save budget data')
        setLoading(false)
        return
      }

      const budgetData: BudgetProfile = {
        user_id: user.id,
        monthly_budget: monthlyBudget,
        currency: 'USD',
        spending_limit_alerts: true
      }

      const { error } = await supabase
        .from('budget_profiles')
        .upsert(budgetData, {
          onConflict: 'user_id'
        })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      setSuccess(true)
      
      // Show success message for 1.5 seconds, then navigate to dashboard
      setTimeout(() => {
        navigate('/dashboard')
      }, 1500)

    } catch (error: any) {
      console.error('Budget save error:', error)
      setError(error.message || 'Failed to save budget')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const monthlyBudget = parseFloat(income || '0') - parseFloat(fixedCosts || '0') - parseFloat(savingsTarget || '0')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link 
                to="/dashboard"
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Budget Setup</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.email}
              </span>
              <button
                onClick={() => supabase.auth.signOut()}
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
              Enter your monthly income, fixed costs, and savings target to calculate your available budget for subscriptions and discretionary spending.
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
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
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
                  onChange={(e) => setIncome(e.target.value)}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Your total monthly income before taxes and deductions</p>
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
                  onChange={(e) => setFixedCosts(e.target.value)}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Rent, utilities, insurance, loan payments, etc.</p>
            </div>

            <div>
              <label htmlFor="savingsTarget" className="block text-sm font-medium text-gray-700 mb-2">
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
                  onChange={(e) => setSavingsTarget(e.target.value)}
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
                    <span className="font-medium">-{formatCurrency(parseFloat(savingsTarget))}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-900 font-medium">Available Budget:</span>
                      <span className={`font-bold ${monthlyBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(monthlyBudget)}
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
