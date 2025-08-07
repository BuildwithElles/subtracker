import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { TEST_IDS } from '../utils/testIds'

interface ProtectedRouteProps {
  children: ReactNode
}

interface PublicRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()

  // Check if we're in test mode (for E2E tests)
  const isTestMode = typeof window !== 'undefined' && 
    (localStorage.getItem('TEST_MODE') === 'true' || 
     localStorage.getItem('TEST_AUTHENTICATED') === 'true')

  // In test mode, bypass authentication checks
  if (isTestMode) {
    return <>{children}</>
  }

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-gray-50"
        data-testid={TEST_IDS.LOADING.PROTECTED_ROUTE}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  // Check if user needs email confirmation
  if (user && !user.email_confirmed_at) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-gray-50"
        data-testid={TEST_IDS.AUTH.EMAIL_CONFIRMATION_REQUIRED}
      >
        <div className="max-w-md mx-auto text-center p-6 bg-white rounded-lg shadow-lg">
          <div className="text-yellow-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Email Confirmation Required</h2>
          <p className="text-gray-600 mb-4">
            Please check your email and click the confirmation link to access your account.
          </p>
          <p className="text-sm text-gray-500">
            Didn't receive the email? Check your spam folder or contact support.
          </p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  // Check if we're in test mode (for E2E tests)
  const isTestMode = typeof window !== 'undefined' && 
    (localStorage.getItem('TEST_MODE') === 'true' || 
     localStorage.getItem('TEST_AUTHENTICATED') === 'true')

  // Show loading spinner while checking auth state
  if (loading && !isTestMode) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-gray-50"
        data-testid={TEST_IDS.LOADING.PUBLIC_ROUTE}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading SubTracker...</p>
        </div>
      </div>
    )
  }

  // In test mode, always show the public route content
  if (isTestMode) {
    return <>{children}</>
  }

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    // Get the intended destination from state, or default to dashboard
    const from = (location.state as any)?.from?.pathname || '/dashboard'
    return <Navigate to={from} replace />
  }

  return <>{children}</>
}
