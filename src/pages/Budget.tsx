import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface BudgetProfile {
  id?: string
  user_id: string
  monthly_income: number
  fixed_expenses: number
  savings_goal: number
  discretionary_budget: number
}

export default function Budget() {
  const [income, setIncome] = useState('')
  const [fixed, setFixed] = useState('')
  const [savings, setSavings] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)

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
        setIncome(data.monthly_income.toString())
        setFixed(data.fixed_expenses.toString())
        setSavings(data.savings_goal.toString())
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
    const fixedNum = parseFloat(fixed)
    const savingsNum = parseFloat(savings)

    if (!incomeNum || !fixedNum || !savingsNum) {
      setError('Please fill in all fields with valid numbers')
      setLoading(false)
      return
    }

    const discretionary = incomeNum - fixedNum - savingsNum

    if (discretionary < 0) {
      setError('Your fixed expenses and savings exceed your income')
      setLoading(false)
      return
    }

    try {
      const budgetData: BudgetProfile = {
        user_id: user?.id || 'anonymous',
        monthly_income: incomeNum,
        fixed_expenses: fixedNum,
        savings_goal: savingsNum,
        discretionary_budget: discretionary
      }

      const { error } = await supabase
        .from('budget_profiles')
        .upsert(budgetData)

      if (error) throw error

      setSuccess(true)
      setTimeout(() => setSuccess(false), 5000)
    } catch (error: any) {
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

  const discretionary = parseFloat(income || '0') - parseFloat(fixed || '0') - parseFloat(savings || '0')

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
              Enter your monthly income and expenses to calculate your available discretionary spending.
            </p>
          </div>

          {success && (
            <div className="mb-6 rounded-md bg-green-50 p-4">
              <div className="text-sm text-green-700">
                Budget saved successfully! 🎉
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
                Monthly Income
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
                  className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="4000.00"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="fixed" className="block text-sm font-medium text-gray-700 mb-2">
                Fixed Expenses (rent, utilities, insurance, etc.)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  id="fixed"
                  name="fixed"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="1200.00"
                  value={fixed}
                  onChange={(e) => setFixed(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="savings" className="block text-sm font-medium text-gray-700 mb-2">
                Savings Goal
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  id="savings"
                  name="savings"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="500.00"
                  value={savings}
                  onChange={(e) => setSavings(e.target.value)}
                />
              </div>
            </div>

            {/* Budget Summary */}
            {income && fixed && savings && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Budget Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Income:</span>
                    <span className="font-medium">{formatCurrency(parseFloat(income))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fixed Expenses:</span>
                    <span className="font-medium">-{formatCurrency(parseFloat(fixed))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Savings Goal:</span>
                    <span className="font-medium">-{formatCurrency(parseFloat(savings))}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-900 font-medium">Discretionary Budget:</span>
                      <span className={`font-bold ${discretionary >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(discretionary)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Available for subscriptions and variable expenses
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <Link
                to="/dashboard"
                className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
