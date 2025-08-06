import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { googleAuthService } from '../lib/googleAuth'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const error = searchParams.get('error')

        if (error) {
          throw new Error(`OAuth error: ${error}`)
        }

        if (!code) {
          throw new Error('Authorization code not found')
        }

        setStatus('processing')

        // Exchange code for access token
        console.log('Exchanging code for token...')
        const tokenData = await googleAuthService.exchangeCodeForToken(code)

        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          throw new Error('User not authenticated')
        }

        // Store tokens in user profile
        console.log('Storing Gmail tokens in profile...')
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email,
          gmail_access_token: tokenData.access_token,
          gmail_refresh_token: tokenData.refresh_token,
          gmail_sync_enabled: true,
          updated_at: new Date().toISOString(),
        })

        if (profileError) {
          console.error('Profile update error:', profileError)
          throw new Error('Failed to store Gmail credentials')
        }

        // Update user metadata
        await supabase.auth.updateUser({
          data: {
            gmail_connected: true,
            onboarding_step: 2,
          },
        })

        setStatus('success')

        // Redirect to onboarding with success
        setTimeout(() => {
          navigate('/onboarding?step=2&gmail_connected=true')
        }, 2000)
      } catch (error) {
        console.error('OAuth callback error:', error)
        setStatus('error')
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred')

        // Redirect to onboarding with error after delay
        setTimeout(() => {
          navigate('/onboarding?error=gmail_auth_failed')
        }, 3000)
      }
    }

    handleCallback()
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {status === 'processing' && (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">Connecting to Gmail...</h2>
                <p className="text-sm text-gray-600">
                  Please wait while we set up your Gmail integration.
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="rounded-full h-12 w-12 bg-green-100 mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-green-600"
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
                </div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">
                  Gmail Connected Successfully!
                </h2>
                <p className="text-sm text-gray-600">
                  Redirecting you back to complete your setup...
                </p>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="rounded-full h-12 w-12 bg-red-100 mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">Connection Failed</h2>
                <p className="text-sm text-gray-600 mb-4">{errorMessage}</p>
                <button
                  onClick={() => navigate('/onboarding')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Try Again
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
