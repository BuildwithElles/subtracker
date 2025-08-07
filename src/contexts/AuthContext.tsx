import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { 
  signUp as authSignUp, 
  signIn as authSignIn, 
  signOut as authSignOut,
  resetPassword as authResetPassword,
  getCurrentSession,
  getCurrentUser,
  isSupabaseConfigured,
  type AuthResult
} from '../lib/auth'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
  signUp: (email: string, password: string) => Promise<AuthResult>
  signIn: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<{ error?: string }>
  resetPassword: (email: string) => Promise<{ error?: string }>
  refreshSession: () => Promise<void>
  isConfigured: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isConfigured] = useState(() => isSupabaseConfigured())

  useEffect(() => {
    // Initialize auth state
    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      
      setSession(session)
      setUser(session?.user ?? null)
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        console.log('User signed in or token refreshed')
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out')
        setUser(null)
        setSession(null)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const initializeAuth = async () => {
    try {
      setLoading(true)
      
      if (!isConfigured) {
        console.warn('Supabase is not properly configured')
        setLoading(false)
        return
      }

      // Get current session
      const currentSession = await getCurrentSession()
      
      if (currentSession) {
        setSession(currentSession)
        setUser(currentSession.user)
      } else {
        setSession(null)
        setUser(null)
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error)
      setSession(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('Failed to refresh session:', error)
        return
      }
      
      if (data.session) {
        setSession(data.session)
        setUser(data.session.user)
      }
    } catch (error) {
      console.error('Session refresh error:', error)
    }
  }

  const signUp = async (email: string, password: string): Promise<AuthResult> => {
    if (!isConfigured) {
      return { error: 'Authentication is not properly configured. Please check your environment variables.' }
    }
    
    return authSignUp(email, password)
  }

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    if (!isConfigured) {
      return { error: 'Authentication is not properly configured. Please check your environment variables.' }
    }
    
    return authSignIn(email, password)
  }

  const signOut = async (): Promise<{ error?: string }> => {
    if (!isConfigured) {
      return { error: 'Authentication is not properly configured.' }
    }
    
    return authSignOut()
  }

  const resetPassword = async (email: string): Promise<{ error?: string }> => {
    if (!isConfigured) {
      return { error: 'Authentication is not properly configured.' }
    }
    
    return authResetPassword(email)
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    isAuthenticated: !!user && !!session,
    signUp,
    signIn,
    signOut,
    resetPassword,
    refreshSession,
    isConfigured
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export { AuthContext }
