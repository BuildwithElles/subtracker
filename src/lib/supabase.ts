import { createClient } from '@supabase/supabase-js'
import { validateEnvironment, logEnvironmentStatus } from './env-validation'

// Validate environment configuration
const envValidation = validateEnvironment()

if (!envValidation.isValid) {
  console.error('❌ Supabase environment configuration errors:')
  envValidation.errors.forEach(error => console.error('  -', error))
}

// Log environment status in development
if (import.meta.env.DEV) {
  logEnvironmentStatus()
}

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  })
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file for VITE_PUBLIC_SUPABASE_URL and VITE_PUBLIC_SUPABASE_ANON_KEY'
  )
}

// Validate URL format
try {
  new URL(supabaseUrl)
} catch (error) {
  throw new Error(`Invalid Supabase URL format: ${supabaseUrl}`)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Make available globally for testing and debugging (development only)
if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
  (window as any).supabase = supabase
  console.log('Supabase client initialized in development/test mode')
}

// Auth helper functions
export const authHelpers = {
  // Send password reset email
  sendPasswordReset: async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/password-reset`,
    })
  },

  // Update user password
  updatePassword: async (password: string) => {
    return await supabase.auth.updateUser({ password })
  },

  // Resend email confirmation
  resendConfirmation: async (email: string) => {
    return await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/email-confirmation`
      }
    })
  },

  // Verify email confirmation token
  verifyEmailToken: async (token: string) => {
    return await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'email'
    })
  },

  // Get current session
  getCurrentSession: async () => {
    return await supabase.auth.getSession()
  },

  // Get current user
  getCurrentUser: async () => {
    return await supabase.auth.getUser()
  },

  // Sign out
  signOut: async () => {
    return await supabase.auth.signOut()
  }
}

export type Subscription = {
  id: string
  user_id: string
  service_name: string
  amount: number
  frequency: string
  last_charge_date: string
  next_charge_date: string
  status: string
  source_email_id?: string
}

export type BudgetProfile = {
  user_id: string
  monthly_income: number
  fixed_expenses: number
  savings_target: number
}
