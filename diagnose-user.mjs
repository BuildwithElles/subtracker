// Diagnostic script to check user authentication status
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function diagnoseUser() {
  console.log('🔍 Diagnosing user authentication...')

  try {
    // Check current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()
    console.log('Session check:', {
      hasSession: !!session,
      sessionError: sessionError?.message,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
    })

    // Check current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    console.log('User check:', {
      hasUser: !!user,
      userError: userError?.message,
      userId: user?.id,
      userEmail: user?.email,
    })

    if (user) {
      // Test if we can access profiles table
      console.log('\nTesting profiles table access...')
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)

      console.log('Profile check:', {
        profileData,
        profileError: profileError?.message,
        errorCode: profileError?.code,
      })

      // Test if we can access budget_profiles table
      console.log('\nTesting budget_profiles table access...')
      const { data: budgetData, error: budgetError } = await supabase
        .from('budget_profiles')
        .select('*')
        .eq('user_id', user.id)

      console.log('Budget check:', {
        budgetData,
        budgetError: budgetError?.message,
        errorCode: budgetError?.code,
      })
    }

    // Check if we can list auth users (this won't work with anon key but worth trying)
    console.log('\nTesting auth status...')
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
    console.log('Auth admin check:', {
      canAccessAuthAdmin: !authError,
      authError: authError?.message,
    })
  } catch (err) {
    console.log('💥 Exception:', err.message)
  }
}

diagnoseUser()
