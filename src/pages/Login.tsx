import { useState, FormEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { validateEmail, validatePassword } from '../utils/validation'
import { ErrorMessage } from '../components/ErrorMessage'
import { Branding } from '../components/Branding'
import { TEST_IDS } from '../utils/testIds'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, loading: authLoading } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // Get the intended destination from navigation state
  const from = location.state?.from?.pathname || '/dashboard'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validate fields
    const emailValidation = validateEmail(email)
    const passwordValidation = validatePassword(password)

    setErrors({
      email: emailValidation.isValid ? '' : emailValidation.message,
      password: passwordValidation.isValid ? '' : passwordValidation.message
    })

    if (!emailValidation.isValid || !passwordValidation.isValid) {
      setIsLoading(false)
      return
    }

    try {
      const { user, error } = await signIn(email, password)
      
      if (error) {
        setError(error)
        return
      }

      if (user) {
        // Redirect to intended destination or dashboard
        navigate(from, { replace: true })
      }
    } catch (error) {
      console.error('Login error:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: 'email' | 'password', value: string) => {
    if (field === 'email') {
      setEmail(value)
    } else {
      setPassword(value)
    }

    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }

    // Clear general error when user starts typing
    if (error) {
      setError('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Branding */}
        <Branding size="large" />
        
        <div>
          <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        
        <form 
          className="mt-8 space-y-6" 
          onSubmit={handleSubmit}
          data-testid={TEST_IDS.LOGIN_FORM}
        >
          {/* General Error */}
          <ErrorMessage 
            message={error} 
            data-testid={TEST_IDS.GENERAL_ERROR}
          />

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                placeholder="Enter your email"
                data-testid={TEST_IDS.EMAIL_INPUT}
              />
              <ErrorMessage 
                message={errors.email} 
                data-testid={TEST_IDS.EMAIL_ERROR}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`appearance-once relative block w-full px-3 py-2 border ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                placeholder="Enter your password"
                data-testid={TEST_IDS.PASSWORD_INPUT}
              />
              <ErrorMessage 
                message={errors.password} 
                data-testid={TEST_IDS.PASSWORD_ERROR}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || authLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out ${
                (isLoading || authLoading) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              data-testid={TEST_IDS.SUBMIT_BUTTON}
            >
              {isLoading || authLoading ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    data-testid={TEST_IDS.LOADING_SPINNER}
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </div>

          <div className="text-center space-y-2">
            <Link
              to="/password-reset"
              className="text-sm text-blue-600 hover:text-blue-500"
              data-testid={TEST_IDS.FORGOT_PASSWORD_LINK}
            >
              Forgot your password?
            </Link>
            
            <div className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link 
                to="/signup" 
                className="text-blue-600 hover:text-blue-500"
                data-testid={TEST_IDS.SIGNUP_LINK}
              >
                Sign up
              </Link>
            </div>
          </div>

          {/* Google OAuth */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition duration-150 ease-in-out"
                data-testid={TEST_IDS.GOOGLE_OAUTH_BUTTON}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
