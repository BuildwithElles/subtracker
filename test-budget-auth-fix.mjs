// Test the budget fixes with proper user authentication
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function testBudgetWithAuth() {
  console.log('🧪 Testing budget with proper authentication...')

  try {
    // Create a test user with proper signup flow
    const testEmail = `budget-fix-${Date.now()}@gmail.com`
    const testPassword = 'TestPassword123!'

    console.log('Creating and signing in test user...')

    // Sign up
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Budget Test User',
        },
      },
    })

    if (signupError) {
      console.log('❌ Signup error:', signupError.message)
      return
    }

    const user = signupData.user
    if (!user) {
      console.log('❌ No user created')
      return
    }

    console.log('✅ Test user created:', user.id)

    // Create user profile first (this should be automatic but let's ensure it)
    console.log('Creating user profile...')
    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        email: user.email,
      },
      {
        onConflict: 'id',
      }
    )

    if (profileError) {
      console.log('❌ Profile creation error:', profileError.message)
    } else {
      console.log('✅ Profile created/updated')
    }

    // Now try to create budget profile
    console.log('Creating budget profile...')
    const { data: budgetData, error: budgetError } = await supabase
      .from('budget_profiles')
      .upsert(
        {
          user_id: user.id,
          monthly_income: 5000.0,
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()

    if (budgetError) {
      console.log('❌ Budget error:', budgetError.message)
      console.log('Error details:', budgetError)
    } else {
      console.log('✅ Budget profile created:', budgetData)
    }

    // Clean up
    console.log('Cleaning up test data...')
    await supabase.from('budget_profiles').delete().eq('user_id', user.id)
    await supabase.from('profiles').delete().eq('id', user.id)

    console.log('✅ Test completed successfully')
  } catch (err) {
    console.log('💥 Exception:', err.message)
  }
}

testBudgetWithAuth()
