// Test individual budget fields to see what works
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function testBudgetFields() {
  console.log('🧪 Testing individual budget fields...')

  try {
    // Use an existing user if we have one
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log('❌ No authenticated user. Please login first.')
      return
    }

    console.log('✅ Using authenticated user:', user.id)

    // Test each field individually
    const fieldsToTest = [
      { monthly_income: 5000.0 },
      { fixed_costs: 1500.0 },
      { savings_target: 1000.0 },
      { discretionary_budget: 2500.0 },
      { spending_limit_alerts: true },
    ]

    for (const field of fieldsToTest) {
      const fieldName = Object.keys(field)[0]
      console.log(`\nTesting field: ${fieldName}`)

      const { data, error } = await supabase
        .from('budget_profiles')
        .upsert(
          {
            user_id: user.id,
            ...field,
          },
          {
            onConflict: 'user_id',
          }
        )
        .select()

      if (error) {
        console.log(`❌ ${fieldName} failed:`, error.message)
      } else {
        console.log(`✅ ${fieldName} works:`, data)
      }
    }
  } catch (err) {
    console.log('💥 Exception:', err.message)
  }
}

testBudgetFields()
