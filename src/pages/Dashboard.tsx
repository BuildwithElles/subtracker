import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { gmailIntegration, ParsedTrialEmail } from '../lib/gmailParser'

interface Subscription {
  id: string
  service_name: string
  amount: number
  currency: string // Add currency field
  frequency: string
  next_charge_date: string
  status: string
  category?: string
  trial_end_date?: string
}

interface BudgetProfile {
  id?: string
  user_id: string
  monthly_budget: number
  currency: string
  spending_limit_alerts: boolean
}

interface ExchangeRates {
  [key: string]: number
}

interface UserMetadata {
  gmail_connected?: boolean
  preferred_currency?: string
}

type Currency = 'USD' | 'EUR' | 'GBP' | 'INR'

// Static exchange rates (in practice, fetch from API)
const EXCHANGE_RATES: ExchangeRates = {
  'USD_EUR': 0.91,
  'USD_GBP': 0.79,
  'USD_INR': 83.25,
  'EUR_USD': 1.10,
  'EUR_GBP': 0.87,
  'EUR_INR': 91.52,
  'GBP_USD': 1.27,
  'GBP_EUR': 1.15,
  'GBP_INR': 105.72,
  'INR_USD': 0.012,
  'INR_EUR': 0.011,
  'INR_GBP': 0.0095,
}

// Dummy data for initial design
const dummySubscriptions: Subscription[] = [
  { id: '1', service_name: 'Netflix', amount: 15.99, currency: 'USD', frequency: 'monthly', next_charge_date: '2025-08-05', status: 'active', category: 'Entertainment' },
  { id: '2', service_name: 'Spotify Premium', amount: 9.99, currency: 'EUR', frequency: 'monthly', next_charge_date: '2025-08-08', status: 'active', category: 'Music' },
  { id: '3', service_name: 'Adobe Creative Cloud', amount: 52.99, currency: 'USD', frequency: 'monthly', next_charge_date: '2025-08-20', status: 'active', category: 'Productivity' },
  { id: '4', service_name: 'Notion Pro', amount: 6.50, currency: 'GBP', frequency: 'monthly', next_charge_date: '2025-08-05', status: 'trial', category: 'Productivity', trial_end_date: '2025-08-05' },
  { id: '5', service_name: 'AWS', amount: 1950.00, currency: 'INR', frequency: 'monthly', next_charge_date: '2025-12-08', status: 'active', category: 'Development' },
  { id: '6', service_name: 'Figma Pro', amount: 12.00, currency: 'USD', frequency: 'monthly', next_charge_date: '2025-08-06', status: 'trial', category: 'Design', trial_end_date: '2025-08-06' },
  { id: '7', service_name: 'ChatGPT Plus', amount: 20.00, currency: 'USD', frequency: 'monthly', next_charge_date: '2025-08-07', status: 'trial', category: 'AI Tools', trial_end_date: '2025-08-07' },
  { id: '8', service_name: 'GitHub Copilot', amount: 10.00, currency: 'USD', frequency: 'monthly', next_charge_date: '2025-08-10', status: 'trial', category: 'Development', trial_end_date: '2025-08-10' }
]

export default function Dashboard() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(dummySubscriptions)
  const [budgetProfile, setBudgetProfile] = useState<BudgetProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [_user, _setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('USD')
  const [_userMetadata, setUserMetadata] = useState<UserMetadata>({})
  const [showGmailModal, setShowGmailModal] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  useEffect(() => {
    checkUser()
    loadUserPreferences()
    loadBudgetProfile()
    // fetchDashboardData() // Will implement later

    // Reload budget data when window gains focus (user returns from budget page)
    const handleFocus = () => {
      loadBudgetProfile()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    _setUser(user)
    
    if (user?.user_metadata) {
      setUserMetadata(user.user_metadata)
      if (!user.user_metadata.gmail_connected) {
        setShowGmailModal(true)
      }
      if (user.user_metadata.preferred_currency) {
        setSelectedCurrency(user.user_metadata.preferred_currency)
      }
    } else if (user) {
      // First time user, show Gmail modal
      setShowGmailModal(true)
    }
  }

  const loadUserPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.user_metadata?.preferred_currency) {
      setSelectedCurrency(user.user_metadata.preferred_currency)
    }
  }

  const loadBudgetProfile = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data, error } = await supabase
          .from('budget_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading budget profile:', error)
        } else if (data) {
          setBudgetProfile(data)
        }
      }
    } catch (error) {
      console.error('Failed to load budget profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) return amount
    
    const rate = EXCHANGE_RATES[`${fromCurrency}_${toCurrency}`]
    return rate ? amount * rate : amount
  }

  const formatCurrencyWithConversion = (amount: number, originalCurrency: string): string => {
    if (originalCurrency === selectedCurrency) {
      return formatCurrency(amount)
    }
    
    const convertedAmount = convertCurrency(amount, originalCurrency, selectedCurrency)
    const originalFormatted = formatCurrency(amount, originalCurrency)
    const convertedFormatted = formatCurrency(convertedAmount, selectedCurrency)
    
    return `${originalFormatted} → ${convertedFormatted}`
  }

  const updateCurrencyPreference = async (currency: Currency) => {
    setSelectedCurrency(currency)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.auth.updateUser({
        data: { preferred_currency: currency }
      })
    }
  }

  const handleGmailConnect = async () => {
    // In a real implementation, this would trigger Google OAuth
    // For now, we'll simulate the connection
    setShowGmailModal(false)
    setIsScanning(true)
    
    try {
      // Simulate Gmail scanning
      const parsedTrials: ParsedTrialEmail[] = await gmailIntegration.fetchAndParseSubscriptions('mock-access-token')
      
      console.log('Parsed trials from Gmail:', parsedTrials)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.auth.updateUser({
          data: { gmail_connected: true }
        })
        setUserMetadata(prev => ({ ...prev, gmail_connected: true }))
      }
      
      // Show success message with found trials
      const foundTrials = parsedTrials.length
      alert(`Gmail connected successfully! Found ${foundTrials} trial subscription${foundTrials !== 1 ? 's' : ''} in your inbox.`)
      
    } catch (error) {
      console.error('Gmail connection error:', error)
      alert('Error connecting to Gmail. Please try again.')
    } finally {
      setIsScanning(false)
    }
  }

  const handleTrialAction = (trialId: string, action: 'review' | 'cancel') => {
    if (action === 'review') {
      // In a real app, this would open a detailed subscription view
      alert(`Reviewing trial subscription: ${trialId}`)
    } else if (action === 'cancel') {
      // In a real app, this would trigger cancellation flow
      const confirmed = confirm('Are you sure you want to cancel this trial?')
      if (confirmed) {
        alert(`Trial cancelled: ${trialId}`)
      }
    }
  }

  const handleGmailScan = async () => {
    setIsScanning(true)
    
    try {
      const parsedTrials: ParsedTrialEmail[] = await gmailIntegration.fetchAndParseSubscriptions('mock-access-token')
      
      console.log('Parsed trials from Gmail:', parsedTrials)
      
      // Show success message with found trials
      const foundTrials = parsedTrials.length
      alert(`Scan complete! Found ${foundTrials} trial subscription${foundTrials !== 1 ? 's' : ''} in your Gmail.`)
      
    } catch (error) {
      console.error('Gmail scan error:', error)
      alert('Error scanning Gmail. Please try again.')
    } finally {
      setIsScanning(false)
    }
  }

  // Subscription Management Functions
  const handleAddSubscription = async (subscriptionData: Omit<Subscription, 'id'>) => {
    try {
      const newSubscription: Subscription = {
        ...subscriptionData,
        id: `new-${Date.now()}` // Generate temporary ID, in real app use Supabase auto-generated ID
      }
      
      // In real implementation, save to Supabase
      // const { data, error } = await supabase.from('subscriptions').insert(newSubscription)
      
      setSubscriptions(prev => [...prev, newSubscription])
      setShowAddModal(false)
      alert('Subscription added successfully!')
    } catch (error) {
      console.error('Error adding subscription:', error)
      alert('Failed to add subscription. Please try again.')
    }
  }

  const handleEditSubscription = async (subscriptionData: Subscription) => {
    try {
      // In real implementation, update in Supabase
      // const { error } = await supabase.from('subscriptions').update(subscriptionData).eq('id', subscriptionData.id)
      
      setSubscriptions(prev => 
        prev.map(sub => sub.id === subscriptionData.id ? subscriptionData : sub)
      )
      setShowEditModal(false)
      setEditingSubscription(null)
      alert('Subscription updated successfully!')
    } catch (error) {
      console.error('Error updating subscription:', error)
      alert('Failed to update subscription. Please try again.')
    }
  }

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return
    
    try {
      setSubscriptions(prev => 
        prev.map(sub => 
          sub.id === subscriptionId ? { ...sub, status: 'cancelled' } : sub
        )
      )
      alert('Subscription cancelled successfully!')
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      alert('Failed to cancel subscription. Please try again.')
    }
  }

  const handleDuplicateSubscription = (subscription: Subscription) => {
    setEditingSubscription({
      ...subscription,
      id: '', // Clear ID for new subscription
      service_name: `${subscription.service_name} (Copy)`
    })
    setShowAddModal(true)
  }

  const handleDeleteSubscription = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to delete this subscription? This action cannot be undone.')) return
    
    try {
      // In real implementation, delete from Supabase
      // const { error } = await supabase.from('subscriptions').delete().eq('id', subscriptionId)
      
      setSubscriptions(prev => prev.filter(sub => sub.id !== subscriptionId))
      alert('Subscription deleted successfully!')
    } catch (error) {
      console.error('Error deleting subscription:', error)
      alert('Failed to delete subscription. Please try again.')
    }
  }

  const openEditModal = (subscription: Subscription) => {
    setEditingSubscription(subscription)
    setShowEditModal(true)
    setOpenMenuId(null)
  }

  // Calculate metrics
  const calculateTotalSpend = () => {
    return subscriptions.reduce((total, sub) => {
      const monthlyAmount = sub.frequency === 'yearly' ? sub.amount / 12 : sub.amount
      return total + monthlyAmount
    }, 0)
  }

  const getTrialsEnding = () => {
    const today = new Date()
    const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)
    return subscriptions.filter(sub => 
      sub.status === 'trial' && 
      sub.trial_end_date && 
      new Date(sub.trial_end_date) >= today &&
      new Date(sub.trial_end_date) <= threeDaysFromNow
    )
  }

  const getUpcomingCharges = () => {
    const today = new Date()
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    return subscriptions.filter(sub => {
      const chargeDate = new Date(sub.next_charge_date)
      return chargeDate >= today && chargeDate <= sevenDaysFromNow
    })
  }

  const getBudgetUsage = () => {
    if (!budgetProfile) return 0
    const totalSpend = calculateTotalSpend()
    return Math.min((totalSpend / budgetProfile.monthly_budget) * 100, 100)
  }

  const getSpendingByCategory = () => {
    const categorySpend: { [key: string]: number } = {}
    subscriptions.forEach(sub => {
      const category = sub.category || 'Other'
      const monthlyAmount = sub.frequency === 'yearly' ? sub.amount / 12 : sub.amount
      categorySpend[category] = (categorySpend[category] || 0) + monthlyAmount
    })
    return Object.entries(categorySpend).map(([category, amount]) => ({ category, amount }))
  }

  const formatCurrency = (amount: number, currency: string = selectedCurrency) => {
    const currencyLocales: { [key: string]: string } = {
      'USD': 'en-US',
      'EUR': 'de-DE',
      'GBP': 'en-GB',
      'INR': 'en-IN'
    }
    
    return new Intl.NumberFormat(currencyLocales[currency] || 'en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays < 7) return `In ${diffDays} days`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const trialsEnding = getTrialsEnding()
  const upcomingCharges = getUpcomingCharges()
  const budgetUsage = getBudgetUsage()
  const spendingByCategory = getSpendingByCategory()

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
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">SubTracker</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Gmail Scan Button */}
              <button 
                onClick={handleGmailScan}
                disabled={isScanning}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{isScanning ? 'Scanning...' : 'Scan Gmail'}</span>
              </button>

              {/* Currency Selector */}
              <div className="relative">
                <select 
                  value={selectedCurrency} 
                  onChange={(e) => updateCurrencyPreference(e.target.value as Currency)}
                  className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              <Link 
                to="/settings"
                className="p-2 text-gray-400 hover:text-gray-600 relative group"
                title="Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {/* Tooltip */}
                <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  Settings
                </div>
              </Link>

              <button 
                onClick={() => supabase.auth.signOut()}
                className="p-2 text-gray-400 hover:text-red-600 relative group"
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {/* Tooltip */}
                <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  Logout
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Trial Alert Banner */}
        {trialsEnding.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {trialsEnding.length} trial{trialsEnding.length > 1 ? 's' : ''} ending in the next 3 days
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <div className="space-y-1">
                    {trialsEnding.map((trial: Subscription) => (
                      <div key={trial.id} className="flex items-center justify-between">
                        <span>
                          <strong>{trial.service_name}</strong> - {formatCurrencyWithConversion(trial.amount, trial.currency)} on {formatDate(trial.trial_end_date || '')}
                        </span>
                        <button 
                          className="ml-4 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-medium"
                          onClick={() => handleTrialAction(trial.id, 'review')}
                        >
                          Review
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Monthly Spend */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Monthly Spend</h3>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(calculateTotalSpend())}</div>
            <p className="text-xs text-gray-500 mt-1">{subscriptions.length} active subscriptions</p>
          </div>

          {/* Budget Usage */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-medium text-gray-600">Budget Usage</h3>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <Link
                to="/budget"
                className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 hover:border-blue-300 transition-colors"
              >
                Set Your Budget
              </Link>
            </div>
            {budgetProfile ? (
              <>
                <div className="text-2xl font-bold text-gray-900">{Math.round(budgetUsage)}%</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full ${budgetUsage > 80 ? 'bg-red-500' : budgetUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${budgetUsage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{formatCurrency(budgetProfile.monthly_budget)} limit</p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-400">--</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="h-2 rounded-full bg-gray-300" style={{ width: '0%' }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Set up your budget to track usage</p>
              </>
            )}
          </div>

          {/* Trials Ending */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Trials Ending</h3>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-gray-900">{trialsEnding.length}</div>
              {trialsEnding.length > 0 && (
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Notion Pro</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Next 7 days</p>
          </div>

          {/* Upcoming Charges */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Upcoming Charges</h3>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-gray-900">{upcomingCharges.length}</div>
            <p className="text-xs text-gray-500 mt-1">Next 7 days</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'overview', name: 'Overview' },
                { id: 'subscriptions', name: 'Subscriptions' },
                { id: 'budget', name: 'Budget' },
                { id: 'upcoming', name: 'Upcoming' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <OverviewTab 
                budgetProfile={budgetProfile}
                subscriptions={subscriptions}
                trialsEnding={trialsEnding}
                upcomingCharges={upcomingCharges}
                spendingByCategory={spendingByCategory}
                formatCurrency={formatCurrency}
                formatCurrencyWithConversion={formatCurrencyWithConversion}
                formatDate={formatDate}
                handleTrialAction={handleTrialAction}
              />
            )}
            {activeTab === 'subscriptions' && (
              <SubscriptionsTab 
                subscriptions={subscriptions}
                formatCurrencyWithConversion={formatCurrencyWithConversion}
                formatDate={formatDate}
                onEdit={openEditModal}
                onCancel={handleCancelSubscription}
                onDuplicate={handleDuplicateSubscription}
                onDelete={handleDeleteSubscription}
                onAddNew={() => setShowAddModal(true)}
                openMenuId={openMenuId}
                setOpenMenuId={setOpenMenuId}
              />
            )}
            {activeTab === 'budget' && (
              <BudgetTab 
                budgetProfile={budgetProfile}
                totalSpend={calculateTotalSpend()}
                spendingByCategory={spendingByCategory}
                formatCurrency={formatCurrency}
              />
            )}
            {activeTab === 'upcoming' && (
              <UpcomingTab 
                upcomingCharges={upcomingCharges}
                formatCurrency={formatCurrency}
                formatCurrencyWithConversion={formatCurrencyWithConversion}
                formatDate={formatDate}
              />
            )}
          </div>
        </div>
      </main>

      {/* Gmail Consent Modal */}
      {showGmailModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center mb-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Gmail</h3>
                <p className="text-sm text-gray-500 mb-4">
                  We use limited access to your Gmail to detect billing-related subscriptions and receipts only.
                </p>
                <ul className="text-left text-sm text-gray-600 mb-6 space-y-2">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Read-only inbox access
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Only scans emails with keywords like "receipt", "invoice", "subscription"
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    You can disconnect at any time
                  </li>
                </ul>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowGmailModal(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Maybe Later
                  </button>
                  <button
                    onClick={handleGmailConnect}
                    disabled={isScanning}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isScanning ? 'Connecting...' : 'Continue with Gmail'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Subscription Modal */}
      {showAddModal && (
        <AddSubscriptionModal 
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false)
            setEditingSubscription(null)
          }}
          onSubmit={handleAddSubscription}
          initialData={editingSubscription}
        />
      )}

      {/* Edit Subscription Modal */}
      {showEditModal && editingSubscription && (
        <EditSubscriptionModal 
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setEditingSubscription(null)
          }}
          onSubmit={handleEditSubscription}
          subscription={editingSubscription}
        />
      )}
    </div>
  )
}

// Tab Components
function OverviewTab({ budgetProfile, subscriptions, trialsEnding, upcomingCharges, spendingByCategory, formatCurrency, formatCurrencyWithConversion, formatDate, handleTrialAction }: any) {
  const totalSpend = subscriptions.reduce((total: number, sub: Subscription) => {
    const monthlyAmount = sub.frequency === 'yearly' ? sub.amount / 12 : sub.amount
    return total + monthlyAmount
  }, 0)

  const remainingBudget = (budgetProfile?.discretionary_budget || 0) - totalSpend
  const dailyAllowance = remainingBudget / 30

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Budget Overview */}
      <div className="lg:col-span-1">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Budget Overview</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Monthly Income</span>
            <span className="font-medium">{formatCurrency(budgetProfile?.monthly_income || 0)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Fixed Expenses</span>
            <span className="font-medium">-{formatCurrency(budgetProfile?.fixed_expenses || 0)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Subscriptions</span>
            <span className="font-medium">-{formatCurrency(totalSpend)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Discretionary</span>
            <span className="font-medium">{formatCurrency(budgetProfile?.discretionary_budget || 0)}</span>
          </div>
          <div className="flex justify-between items-center py-2 pt-4 border-t-2">
            <span className="text-gray-900 font-medium">Remaining Budget</span>
            <span className={`font-bold ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(remainingBudget)}
            </span>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-sm text-green-800">Daily Allowance</div>
            <div className="text-lg font-bold text-green-900">{formatCurrency(dailyAllowance)}</div>
          </div>
        </div>

        {/* Spending by Category Pie Chart */}
        <div className="mt-8">
          <h4 className="text-md font-medium text-gray-900 mb-4">Spending by Category</h4>
          <div className="space-y-2">
            {spendingByCategory.map((item: any, index: number) => {
              const colors = ['bg-green-500', 'bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-purple-500']
              return (
                <div key={item.category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                    <span className="text-sm text-gray-700">{item.category}</span>
                  </div>
                  <span className="text-sm font-medium">{formatCurrency(item.amount)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right: Trials and Upcoming */}
      <div className="lg:col-span-2 space-y-6">
        {/* Trial Ending Soon */}
        {trialsEnding.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h4 className="text-red-900 font-medium">Trial Ending Soon</h4>
            </div>
            {trialsEnding.map((trial: Subscription) => (
              <div key={trial.id} className="flex items-center justify-between mb-3 last:mb-0">
                <div className="flex-1">
                  <div className="font-medium text-red-900">{trial.service_name}</div>
                  <div className="text-sm text-red-700">
                    Will charge {formatCurrencyWithConversion(trial.amount, trial.currency)} on {formatDate(trial.trial_end_date || '')}
                  </div>
                  <div className="text-xs text-red-600 mt-1">
                    Trial ends {formatDate(trial.trial_end_date || '')} • {trial.category}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                    onClick={() => handleTrialAction(trial.id, 'review')}
                  >
                    Review
                  </button>
                  <button 
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                    onClick={() => handleTrialAction(trial.id, 'cancel')}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upcoming Charges */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Upcoming Charges</h4>
          <div className="space-y-3">
            {upcomingCharges.slice(0, 5).map((charge: Subscription) => (
              <div key={charge.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-medium text-sm">{charge.service_name[0]}</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{charge.service_name}</div>
                    <div className="text-sm text-gray-500">{charge.category}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">{formatCurrency(charge.amount)}</div>
                  <div className="text-sm text-gray-500">{formatDate(charge.next_charge_date)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function SubscriptionsTab({ subscriptions, formatCurrencyWithConversion, formatDate, onEdit, onCancel, onDuplicate, onDelete, onAddNew, openMenuId, setOpenMenuId }: any) {
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const categories = ['all', ...Array.from(new Set(subscriptions.map((sub: Subscription) => sub.category || 'Other')))] as string[]

  const filteredSubscriptions = subscriptions.filter((sub: Subscription) => {
    const categoryMatch = filterCategory === 'all' || sub.category === filterCategory
    const statusMatch = filterStatus === 'all' || sub.status === filterStatus
    return categoryMatch && statusMatch
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Your Subscriptions</h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={onAddNew}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Subscription</span>
          </button>
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="all">All Categories</option>
            {categories.slice(1).map((cat: string) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredSubscriptions.map((sub: Subscription) => (
          <div key={sub.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-white rounded-lg border flex items-center justify-center">
                <span className="font-medium text-gray-700">{sub.service_name[0]}</span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{sub.service_name}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    sub.status === 'trial' ? 'bg-yellow-100 text-yellow-800' : 
                    sub.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {sub.status === 'trial' ? 'Trial' : sub.status === 'cancelled' ? 'Cancelled' : 'Active'}
                  </span>
                </div>
                <div className="text-sm text-gray-500">{sub.category}</div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="font-medium text-gray-900">{formatCurrencyWithConversion(sub.amount, sub.currency)}</div>
                <div className="text-sm text-gray-500 capitalize">{sub.frequency}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-900">{formatDate(sub.next_charge_date)}</div>
                <div className="text-xs text-gray-500">Next charge</div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => onEdit(sub)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Edit subscription"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setOpenMenuId(openMenuId === sub.id ? null : sub.id)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="More actions"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                  {openMenuId === sub.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            onEdit(sub)
                            setOpenMenuId(null)
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Edit</span>
                          </div>
                        </button>
                        {sub.status !== 'cancelled' && (
                          <button
                            onClick={() => {
                              onCancel(sub.id)
                              setOpenMenuId(null)
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Cancel Subscription</span>
                            </div>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            onDuplicate(sub)
                            setOpenMenuId(null)
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>Duplicate</span>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            onDelete(sub.id)
                            setOpenMenuId(null)
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                        >
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Delete</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BudgetTab({ budgetProfile, totalSpend, spendingByCategory, formatCurrency }: any) {
  const budgetUsage = budgetProfile ? (totalSpend / budgetProfile.discretionary_budget) * 100 : 0
  const remainingBudget = (budgetProfile?.discretionary_budget || 0) - totalSpend
  const dailyAllowance = remainingBudget / 30

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: Budget Details */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-6">Monthly Budget</h3>
        
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Monthly Income</div>
            <div className="text-2xl font-bold text-blue-900">{formatCurrency(budgetProfile?.monthly_income || 0)}</div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-700">Fixed Expenses</span>
              <span className="font-medium text-red-600">{formatCurrency(budgetProfile?.fixed_expenses || 0)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-700">Subscriptions</span>
              <span className="font-medium text-red-600">{formatCurrency(totalSpend)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-700">Discretionary</span>
              <span className="font-medium text-green-600">{formatCurrency(budgetProfile?.discretionary_budget || 0)}</span>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border-t-4 border-green-500">
            <div className="text-sm text-green-600 font-medium">Remaining Budget</div>
            <div className={`text-2xl font-bold ${remainingBudget >= 0 ? 'text-green-900' : 'text-red-900'}`}>
              {formatCurrency(remainingBudget)}
            </div>
            <div className="text-sm text-green-600 mt-1">
              {formatCurrency(dailyAllowance)} per day
            </div>
          </div>
        </div>

        {/* Subscription Budget Usage */}
        <div className="mt-8">
          <h4 className="text-md font-medium text-gray-900 mb-4">Subscription Budget Usage</h4>
          <div className="bg-gray-200 rounded-full h-4">
            <div 
              className={`h-4 rounded-full ${budgetUsage > 80 ? 'bg-red-500' : budgetUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(budgetUsage, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>Current Spend: {formatCurrency(totalSpend)}</span>
            <span>{Math.round(budgetUsage)}% of recommended limit</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {formatCurrency(budgetProfile?.monthly_budget || 0)} limit
          </div>
        </div>
      </div>

      {/* Right: Spending Breakdown */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-6">Spending by Category</h3>
        
        <div className="space-y-4">
          {spendingByCategory.map((item: any, index: number) => {
            const colors = ['bg-green-500', 'bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-purple-500']
            const percentage = totalSpend > 0 ? (item.amount / totalSpend) * 100 : 0
            
            return (
              <div key={item.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded ${colors[index % colors.length]}`}></div>
                    <span className="text-gray-700">{item.category}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(item.amount)}</div>
                    <div className="text-xs text-gray-500">{Math.round(percentage)}%</div>
                  </div>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${colors[index % colors.length]}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Daily Allowance Breakdown */}
        <div className="mt-8 bg-gray-50 p-4 rounded-lg">
          <h4 className="text-md font-medium text-gray-900 mb-3">Daily Allowance</h4>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(dailyAllowance)}</div>
          <div className="text-sm text-gray-600 mt-1">
            Available for daily discretionary spending
          </div>
        </div>
      </div>
    </div>
  )
}

function UpcomingTab({ upcomingCharges, formatCurrency, formatCurrencyWithConversion, formatDate }: any) {
  const groupedCharges = upcomingCharges.reduce((acc: any, charge: Subscription) => {
    const date = charge.next_charge_date
    if (!acc[date]) acc[date] = []
    acc[date].push(charge)
    return acc
  }, {})

  const sortedDates = Object.keys(groupedCharges).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  )

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">Upcoming Charges</h3>
        <p className="text-gray-600">Subscriptions with charges due in the next 7 days</p>
      </div>

      {sortedDates.length > 0 ? (
        <div className="space-y-6">
          {sortedDates.map(date => (
            <div key={date}>
              <div className="mb-3">
                <h4 className="text-md font-medium text-gray-900">{formatDate(date)}</h4>
                <div className="text-sm text-gray-500">
                  {groupedCharges[date].length} charge{groupedCharges[date].length !== 1 ? 's' : ''}
                </div>
              </div>
              
              <div className="space-y-3">
                {groupedCharges[date].map((charge: Subscription) => (
                  <div key={charge.id} className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="font-medium text-gray-700">{charge.service_name[0]}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{charge.service_name}</div>
                        <div className="text-sm text-gray-500">{charge.category}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-medium text-gray-900">{formatCurrencyWithConversion(charge.amount, charge.currency)}</div>
                        <div className="text-sm text-gray-500 capitalize">{charge.frequency}</div>
                      </div>
                      
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        formatDate(charge.next_charge_date) === 'Today' ? 'bg-red-100 text-red-800' :
                        formatDate(charge.next_charge_date) === 'Tomorrow' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {formatDate(charge.next_charge_date)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-800">
              <strong>Total this week:</strong> {formatCurrency(
                upcomingCharges.reduce((total: number, charge: Subscription) => total + charge.amount, 0)
              )} <span className="text-xs">(USD equivalent)</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming charges</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have any subscription charges due in the next 7 days.
          </p>
        </div>
      )}
    </div>
  )
}

// Add Subscription Modal Component
function AddSubscriptionModal({ isOpen, onClose, onSubmit, initialData }: any) {
  const [formData, setFormData] = useState({
    service_name: initialData?.service_name || '',
    amount: initialData?.amount || '',
    currency: initialData?.currency || 'USD',
    frequency: initialData?.frequency || 'monthly',
    next_charge_date: initialData?.next_charge_date || '',
    category: initialData?.category || '',
    status: initialData?.status || 'active'
  })

  const categories = ['Entertainment', 'Music', 'Productivity', 'Development', 'Design', 'AI Tools', 'Other']

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.service_name || !formData.amount || !formData.next_charge_date) {
      alert('Please fill in all required fields (Service Name, Amount, Next Charge Date)')
      return
    }

    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount)
    })
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {initialData?.id ? 'Duplicate Subscription' : 'Add New Subscription'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Name *
              </label>
              <input
                type="text"
                value={formData.service_name}
                onChange={(e) => handleChange('service_name', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Netflix, Spotify"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="9.99"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="INR">INR</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Billing Frequency
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => handleChange('frequency', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="weekly">Weekly</option>
                <option value="one-time">One-time</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Next Charge Date *
              </label>
              <input
                type="date"
                value={formData.next_charge_date}
                onChange={(e) => handleChange('next_charge_date', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {initialData?.id ? 'Duplicate' : 'Add Subscription'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Edit Subscription Modal Component
function EditSubscriptionModal({ isOpen, onClose, onSubmit, subscription }: any) {
  const [formData, setFormData] = useState({
    id: subscription?.id || '',
    service_name: subscription?.service_name || '',
    amount: subscription?.amount?.toString() || '',
    currency: subscription?.currency || 'USD',
    frequency: subscription?.frequency || 'monthly',
    next_charge_date: subscription?.next_charge_date || '',
    category: subscription?.category || '',
    status: subscription?.status || 'active'
  })

  const categories = ['Entertainment', 'Music', 'Productivity', 'Development', 'Design', 'AI Tools', 'Other']

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.service_name || !formData.amount || !formData.next_charge_date) {
      alert('Please fill in all required fields (Service Name, Amount, Next Charge Date)')
      return
    }

    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount)
    })
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Edit Subscription</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Name *
              </label>
              <input
                type="text"
                value={formData.service_name}
                onChange={(e) => handleChange('service_name', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Netflix, Spotify"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="9.99"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="INR">INR</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Billing Frequency
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => handleChange('frequency', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="weekly">Weekly</option>
                <option value="one-time">One-time</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Next Charge Date *
              </label>
              <input
                type="date"
                value={formData.next_charge_date}
                onChange={(e) => handleChange('next_charge_date', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
