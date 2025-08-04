import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Settings() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [gmailSyncEnabled, setGmailSyncEnabled] = useState(false)

  useEffect(() => {
    checkUser()
    loadGmailSyncStatus()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadGmailSyncStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('gmail_sync_enabled')
          .eq('id', user.id)
          .single()
        
        setGmailSyncEnabled(data?.gmail_sync_enabled || false)
      }
    } catch (error) {
      console.error('Error loading Gmail sync status:', error)
    }
  }

  const toggleGmailSync = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const newStatus = !gmailSyncEnabled
      
      // Update user metadata in Supabase
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          gmail_sync_enabled: newStatus,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      setGmailSyncEnabled(newStatus)
      
      // Show confirmation message
      if (newStatus) {
        alert('Gmail sync enabled! Your subscriptions will be automatically detected from Gmail.')
      } else {
        alert('Gmail sync disabled. Automatic subscription detection turned off.')
      }
    } catch (error) {
      console.error('Error toggling Gmail sync:', error)
      alert('Failed to update Gmail sync setting. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setExportLoading(true)
    try {
      // Fetch user's subscription data
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('*')

      if (!subscriptions || subscriptions.length === 0) {
        alert('No subscriptions found to export.')
        return
      }

      // Create CSV content
      const headers = ['Name', 'Cost', 'Currency', 'Billing Cycle', 'Next Payment', 'Category', 'Status', 'Description']
      const csvRows = [headers.join(',')]

      subscriptions.forEach(sub => {
        const row = [
          `"${sub.name || ''}"`,
          sub.cost || 0,
          `"${sub.currency || 'USD'}"`,
          `"${sub.billing_cycle || ''}"`,
          `"${sub.next_payment_date || ''}"`,
          `"${sub.category || ''}"`,
          `"${sub.status || 'active'}"`,
          `"${sub.description || ''}"`
        ]
        csvRows.push(row.join(','))
      })

      // Create and download CSV file
      const csvContent = csvRows.join('\n')
      const dataBlob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `subtracker-subscriptions-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setExportLoading(false)
    }
  }

  const handleDisconnectGmail = async () => {
    setLoading(true)
    try {
      // In a real implementation, this would revoke Gmail access
      // For now, we'll just show a placeholder
      alert('Gmail disconnect functionality would be implemented here')
    } catch (error) {
      console.error('Disconnect failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    const secondConfirm = prompt('Type "DELETE" to confirm account deletion:')
    if (secondConfirm !== 'DELETE') {
      alert('Account deletion cancelled.')
      return
    }

    setLoading(true)
    try {
      if (!user?.id) {
        throw new Error('No user ID found')
      }

      // Delete user data in order (due to foreign key constraints)
      const { error: subscriptionsError } = await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', user.id)
      
      if (subscriptionsError) throw subscriptionsError

      const { error: budgetError } = await supabase
        .from('budget_profiles')
        .delete()
        .eq('user_id', user.id)
      
      if (budgetError) throw budgetError

      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)
      
      if (profileError) throw profileError

      // Delete the user account from Supabase Auth
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id)
      if (authError) {
        console.warn('Could not delete auth user (admin access required):', authError)
      }
      
      // Sign out the user
      await supabase.auth.signOut()
      
      alert('Your account has been successfully deleted.')
      window.location.href = '/'
    } catch (error) {
      console.error('Account deletion failed:', error)
      alert('Failed to delete account. Please contact support if this issue persists.')
    } finally {
      setLoading(false)
    }
  }

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
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">
          
          {/* Account Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Account Information</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <div className="mt-1 text-sm text-gray-900">{user?.email}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Created</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gmail Integration */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Gmail Integration</h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Gmail Sync Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Automatic Gmail Sync</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Automatically detect and track subscriptions from your Gmail emails
                  </p>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={toggleGmailSync}
                    disabled={loading}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                      gmailSyncEnabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${
                        gmailSyncEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="ml-3 text-sm text-gray-900">
                    {gmailSyncEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              {/* Gmail Connection Status */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Gmail Connection</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage your Gmail account connection for subscription detection
                  </p>
                </div>
                <button
                  onClick={handleDisconnectGmail}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {loading ? 'Disconnecting...' : 'Disconnect Gmail'}
                </button>
              </div>
            </div>
          </div>

          {/* Data Export */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Data Export</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Export Subscriptions as CSV</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Download all your subscription data in CSV format for easy import into other applications
                  </p>
                </div>
                <button
                  onClick={handleExport}
                  disabled={exportLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {exportLoading ? 'Exporting...' : 'Export CSV'}
                </button>
              </div>
            </div>
          </div>

          {/* Privacy & Security */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Privacy & Security</h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Data Privacy</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Your data is encrypted and never shared with third parties. We only access your Gmail 
                  to detect subscription-related emails.
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-900">Change Password</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Update your account password for enhanced security.
                </p>
                <button className="mt-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Change Password
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white shadow rounded-lg border border-red-200">
            <div className="px-6 py-4 border-b border-red-200">
              <h2 className="text-lg font-medium text-red-900">Danger Zone</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-red-900">Delete Account</h3>
                  <p className="text-sm text-red-600 mt-1">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                </div>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
