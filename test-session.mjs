// Test with signed-in user session
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function testWithSession() {
  console.log('🧪 Testing with authenticated session...')

  try {
    // Check if there's already a session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session?.user) {
      console.log('✅ Found existing session for user:', session.user.id)

      // Test budget profile creation with authenticated user
      const { data: budgetData, error: budgetError } = await supabase
        .from('budget_profiles')
        .upsert(
          {
            user_id: session.user.id,
            monthly_income: 5000.0,
          },
          {
            onConflict: 'user_id',
          }
        )
        .select()

      if (budgetError) {
        console.log('❌ Budget error:', budgetError.message)
        console.log('Error code:', budgetError.code)
      } else {
        console.log('✅ Budget profile works:', budgetData)
      }
    } else {
      console.log('❌ No authenticated session found')
      console.log('You need to be signed in through the web app first')
    }
  } catch (err) {
    console.log('💥 Exception:', err.message)
  }
}

testWithSession()
