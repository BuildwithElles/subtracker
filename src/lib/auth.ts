import { supabase } from './supabase'
import type { User, Session, AuthError as SupabaseAuthError } from '@supabase/supabase-js'

export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export interface AuthResult {
  user?: User | null
  session?: Session | null
  error?: string
}

/**
 * Sign up a new user with email and password
 */
export async function signUp(email: string, password: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/email-confirmation`
      }
    })
    
    if (error) {
      throw new AuthError(error.message, error.message)
    }
    
    return {
      user: data.user,
      session: data.session
    }
  } catch (error) {
    console.error('Sign up error:', error)
    
    if (error instanceof AuthError) {
      return { error: error.message }
    }
    
    return { error: 'Failed to create account. Please try again.' }
  }
}

/**
 * Sign in user with email and password
 */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      throw new AuthError(error.message, error.message)
    }
    
    return {
      user: data.user,
      session: data.session
    }
  } catch (error) {
    console.error('Sign in error:', error)
    
    if (error instanceof AuthError) {
      return { error: error.message }
    }
    
    return { error: 'Failed to sign in. Please check your credentials and try again.' }
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      throw new AuthError(error.message, error.message)
    }
    
    return {}
  } catch (error) {
    console.error('Sign out error:', error)
    
    if (error instanceof AuthError) {
      return { error: error.message }
    }
    
    return { error: 'Failed to sign out. Please try again.' }
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/password-reset?mode=confirm`,
    })
    
    if (error) {
      throw new AuthError(error.message, error.message)
    }
    
    return {}
  } catch (error) {
    console.error('Password reset error:', error)
    
    if (error instanceof AuthError) {
      return { error: error.message }
    }
    
    return { error: 'Failed to send password reset email. Please try again.' }
  }
}

/**
 * Update user password (when user is authenticated)
 */
export async function updatePassword(password: string): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.auth.updateUser({ password })
    
    if (error) {
      throw new AuthError(error.message, error.message)
    }
    
    return {}
  } catch (error) {
    console.error('Password update error:', error)
    
    if (error instanceof AuthError) {
      return { error: error.message }
    }
    
    return { error: 'Failed to update password. Please try again.' }
  }
}

/**
 * Get current session
 */
export async function getCurrentSession(): Promise<Session | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Get session error:', error)
      return null
    }
    
    return session
  } catch (error) {
    console.error('Get session error:', error)
    return null
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Get user error:', error)
      return null
    }
    
    return user
  } catch (error) {
    console.error('Get user error:', error)
    return null
  }
}

/**
 * Resend email confirmation
 */
export async function resendConfirmation(email: string): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/email-confirmation`
      }
    })
    
    if (error) {
      throw new AuthError(error.message, error.message)
    }
    
    return {}
  } catch (error) {
    console.error('Resend confirmation error:', error)
    
    if (error instanceof AuthError) {
      return { error: error.message }
    }
    
    return { error: 'Failed to resend confirmation email. Please try again.' }
  }
}

/**
 * Verify email confirmation token
 */
export async function verifyEmailToken(token: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'email'
    })
    
    if (error) {
      throw new AuthError(error.message, error.message)
    }
    
    return {
      user: data.user,
      session: data.session
    }
  } catch (error) {
    console.error('Email verification error:', error)
    
    if (error instanceof AuthError) {
      return { error: error.message }
    }
    
    return { error: 'Failed to verify email. The link may be expired or invalid.' }
  }
}

/**
 * Check if Supabase client is properly configured
 */
export function isSupabaseConfigured(): boolean {
  try {
    return !!(supabase && supabase.auth)
  } catch (error) {
    console.error('Supabase configuration check failed:', error)
    return false
  }
}

/**
 * Test Supabase connection
 */
export async function testSupabaseConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.auth.getSession()
    
    if (error && error.message.includes('Invalid API key')) {
      return {
        connected: false,
        error: 'Invalid Supabase API key. Please check your environment variables.'
      }
    }
    
    return { connected: true }
  } catch (error) {
    console.error('Supabase connection test failed:', error)
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown connection error'
    }
  }
}
