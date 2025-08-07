import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute'
import { testSupabaseConnection } from './lib/auth'
import { supabase } from './lib/supabase'
import LandingPage from './pages/LandingPage'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import AuthCallback from './pages/AuthCallback'
import PasswordReset from './pages/PasswordReset'
import EmailConfirmation from './pages/EmailConfirmation'
import Dashboard from './pages/Dashboard'
import Budget from './pages/Budget'
import Settings from './pages/Settings'

function AppContent() {
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean
    error?: string
    loading: boolean
  }>({ connected: false, loading: true })

  useEffect(() => {
    checkSupabaseConnection()
    
    // Ensure Supabase client is available globally for testing
    if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
      (window as any).supabase = supabase
    }
  }, [])

  const checkSupabaseConnection = async () => {
    try {
      const result = await testSupabaseConnection()
      setConnectionStatus({
        connected: result.connected,
        error: result.error,
        loading: false
      })
      
      if (result.connected) {
        console.log('✅ Supabase connection established successfully')
      } else {
        console.error('❌ Supabase connection failed:', result.error)
      }
    } catch (error) {
      console.error('Failed to test Supabase connection:', error)
      setConnectionStatus({
        connected: false,
        error: 'Failed to initialize authentication service',
        loading: false
      })
    }
  }

  // Show loading state while checking connection
  if (connectionStatus.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing SubTracker...</p>
        </div>
      </div>
    )
  }

  // Show error state if connection failed
  if (!connectionStatus.connected && connectionStatus.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center p-6 bg-white rounded-lg shadow-lg">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Configuration Error</h2>
          <p className="text-gray-600 mb-4">{connectionStatus.error}</p>
          <p className="text-sm text-gray-500 mb-4">
            Please check your environment variables and try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/" 
        element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/signup" 
        element={
          <PublicRoute>
            <SignUp />
          </PublicRoute>
        } 
      />
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      <Route 
        path="/password-reset" 
        element={
          <PublicRoute>
            <PasswordReset />
          </PublicRoute>
        } 
      />
      <Route 
        path="/email-confirmation" 
        element={
          <PublicRoute>
            <EmailConfirmation />
          </PublicRoute>
        } 
      />
      
      {/* Auth callback route */}
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      {/* Protected routes */}
      <Route 
        path="/onboarding" 
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/budget" 
        element={
          <ProtectedRoute>
            <Budget />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } 
      />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App
