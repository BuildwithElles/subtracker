// Test the fixed budget functionality
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function testBudgetFix() {
  console.log('🧪 Testing budget functionality...')

  try {
    // First create a test user
    const testEmail = `budget-test-${Date.now()}@gmail.com`
    const testPassword = 'TestPassword123!'

    console.log('Creating test user...')
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
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

    // Test minimal budget profile creation
    console.log('\nTesting minimal budget profile...')
    const { data: budgetData, error: budgetError } = await supabase
      .from('budget_profiles')
      .upsert(
        {
          user_id: user.id,
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
      console.log('✅ Minimal budget profile created:', budgetData)
    }

    // Test with income field
    console.log('\nTesting budget with income...')
    const { data: incomeData, error: incomeError } = await supabase
      .from('budget_profiles')
      .update({
        monthly_income: 5000.0,
      })
      .eq('user_id', user.id)
      .select()

    if (incomeError) {
      console.log('❌ Income update error:', incomeError.message)
    } else {
      console.log('✅ Income update successful:', incomeData)
    }

    // Clean up - delete test user budget profile
    await supabase.from('budget_profiles').delete().eq('user_id', user.id)

    console.log('✅ Test cleanup completed')
  } catch (err) {
    console.log('💥 Exception:', err.message)
  }
}

testBudgetFix()
