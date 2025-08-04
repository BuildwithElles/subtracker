import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Settings() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const handleExport = async () => {
    setExportLoading(true)
    try {
      // Fetch user's subscription data
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('*')

      const { data: budget } = await supabase
        .from('budget_profiles')
        .select('*')
        .single()

      // Create export data
      const exportData = {
        user: {
          email: user?.email,
          id: user?.id
        },
        subscriptions: subscriptions || [],
        budget: budget || null,
        exportDate: new Date().toISOString()
      }

      // Create and download JSON file
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `subtracker-export-${new Date().toISOString().split('T')[0]}.json`
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

    setLoading(true)
    try {
      // Delete user data
      await supabase.from('subscriptions').delete().eq('user_id', user?.id)
      await supabase.from('budget_profiles').delete().eq('user_id', user?.id)
      
      // Sign out
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Account deletion failed:', error)
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
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Gmail Connection</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage your Gmail integration for automatic subscription detection
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
                  <h3 className="text-sm font-medium text-gray-900">Export Your Data</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Download all your subscription and budget data as a JSON file
                  </p>
                </div>
                <button
                  onClick={handleExport}
                  disabled={exportLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {exportLoading ? 'Exporting...' : 'Export'}
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
