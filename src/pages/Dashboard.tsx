import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface Subscription {
  id: string
  service_name: string
  amount: number
  frequency: string
  next_charge_date: string
  status: string
}

interface BudgetProfile {
  id: string
  monthly_income: number
  fixed_expenses: number
  savings_goal: number
  discretionary_budget: number
}

export default function Dashboard() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [budgetProfile, setBudgetProfile] = useState<BudgetProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkUser()
    fetchDashboardData()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // Fetch subscriptions
      const { data: subs } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('status', 'active')

      // Fetch budget profile
      const { data: budget } = await supabase
        .from('budget_profiles')
        .select('*')
        .single()

      setSubscriptions(subs || [])
      setBudgetProfile(budget)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotalSpend = () => {
    return subscriptions.reduce((total, sub) => {
      const monthlyAmount = sub.frequency === 'yearly' ? sub.amount / 12 : sub.amount
      return total + monthlyAmount
    }, 0)
  }

  const calculateSafeToSpend = () => {
    if (!budgetProfile) return 0
    const totalSpend = calculateTotalSpend()
    const remaining = budgetProfile.discretionary_budget - totalSpend
    return Math.max(0, remaining / 30) // Daily safe to spend
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome back, {user?.email}
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Spend Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Total Spend</h3>
            <p className="text-3xl font-bold text-red-600">
              {formatCurrency(calculateTotalSpend())}
            </p>
            <p className="text-sm text-gray-600 mt-1">Monthly recurring</p>
          </div>

          {/* Safe to Spend Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Safe to Spend</h3>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(calculateSafeToSpend())}
            </p>
            <p className="text-sm text-gray-600 mt-1">Per day</p>
          </div>

          {/* Active Subscriptions Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Active Subscriptions</h3>
            <p className="text-3xl font-bold text-blue-600">
              {subscriptions.length}
            </p>
            <p className="text-sm text-gray-600 mt-1">Services</p>
          </div>
        </div>

        {/* Connect Gmail CTA */}
        {subscriptions.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-medium text-blue-900">Connect Gmail</h3>
                <p className="text-blue-700 mt-1">
                  Connect your Gmail account to automatically track subscription emails and charges.
                </p>
                <button className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                  Connect Gmail
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Subscriptions List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Your Subscriptions</h2>
          </div>
          <div className="overflow-hidden" data-test="subscriptions-list">
            {subscriptions.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Frequency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Next Charge
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {sub.service_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(sub.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">
                          {sub.frequency}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(sub.next_charge_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {sub.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No subscriptions found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Connect Gmail to automatically discover your subscriptions.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* AI Insights Placeholder */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">AI Insights</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-600 text-sm">
              💡 AI-powered insights about your spending patterns will appear here once you have subscription data.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
