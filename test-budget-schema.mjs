// Test budget profiles table schema
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function testBudgetSchema() {
  console.log('🧪 Testing budget_profiles table schema...')

  try {
    // Try to select all columns to see what's available
    const { data, error } = await supabase.from('budget_profiles').select('*').limit(1)

    if (error) {
      console.log('❌ Error accessing budget_profiles:', error.message)
      console.log('Full error:', error)

      // Try a simple query to see if table exists
      const { data: simpleData, error: simpleError } = await supabase
        .from('budget_profiles')
        .select('id')
        .limit(1)

      if (simpleError) {
        console.log('❌ Table may not exist:', simpleError.message)
      }
    } else {
      console.log('✅ Successfully accessed budget_profiles table')
      console.log('Data structure:', data)
    }

    // Test inserting a budget profile to see what columns are expected
    console.log('\n🧪 Testing budget profile creation...')

    const testUserId = '00000000-0000-0000-0000-000000000000' // Dummy UUID

    const { data: insertData, error: insertError } = await supabase
      .from('budget_profiles')
      .insert({
        user_id: testUserId,
        monthly_income: 5000,
        fixed_costs: 1500,
        savings_target: 1000,
        discretionary_budget: 2500,
        currency: 'USD',
        spending_limit_alerts: true,
      })
      .select()

    if (insertError) {
      console.log('❌ Insert error:', insertError.message)
      console.log('Error details:', insertError)
    } else {
      console.log('✅ Insert successful:', insertData)

      // Clean up the test record
      await supabase.from('budget_profiles').delete().eq('user_id', testUserId)
    }
  } catch (err) {
    console.log('💥 Exception:', err.message)
  }
}

testBudgetSchema()
