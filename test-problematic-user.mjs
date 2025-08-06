// Specific test for the problematic user ID
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function testProblematicUser() {
  console.log('🔍 Testing the problematic user ID...')

  const problematicUserId = 'ad953355-7223-4a37-9407-77f4bbf30f09'

  try {
    // Check current session
    const {
      data: { session },
    } = await supabase.auth.getSession()
    console.log('Current session user ID:', session?.user?.id)
    console.log('Matches problematic ID:', session?.user?.id === problematicUserId)

    if (session?.user?.id === problematicUserId) {
      console.log('⚠️  Found the problematic session!')

      // Try to access profiles table
      console.log('Testing profiles table access...')
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', problematicUserId)
        .maybeSingle()

      console.log('Profile test:', {
        data: profileData,
        error: profileError?.message,
        errorCode: profileError?.code,
      })

      // Try to access budget_profiles table
      console.log('Testing budget_profiles table access...')
      const { data: budgetData, error: budgetError } = await supabase
        .from('budget_profiles')
        .select('user_id')
        .eq('user_id', problematicUserId)
        .maybeSingle()

      console.log('Budget test:', {
        data: budgetData,
        error: budgetError?.message,
        errorCode: budgetError?.code,
      })

      // Try to insert a minimal profile
      console.log('Testing profile creation...')
      const { data: insertData, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: problematicUserId,
          email: 'support@millionnerds.com',
        })
        .select()

      console.log('Profile insert test:', {
        data: insertData,
        error: insertError?.message,
        errorCode: insertError?.code,
      })

      // Recommend sign out
      console.log('\n🚨 RECOMMENDATION: This session should be cleared completely.')
      console.log('Use the "Clear Session & Go Home" button in the UI.')
    } else {
      console.log('✅ Current session is not the problematic one.')
    }
  } catch (err) {
    console.log('💥 Exception:', err.message)
  }
}

testProblematicUser()
