// Check actual budget_profiles table structure
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function checkTableStructure() {
  console.log('🔍 Checking actual table structure...')

  try {
    // Try inserting with minimal required fields first
    const testUserId = '00000000-0000-0000-0000-000000000000'

    console.log('Testing with minimal fields...')
    const { data: minimalData, error: minimalError } = await supabase
      .from('budget_profiles')
      .insert({
        user_id: testUserId,
        monthly_income: 5000,
      })
      .select()

    if (minimalError) {
      console.log('❌ Minimal insert error:', minimalError.message)
    } else {
      console.log('✅ Minimal insert successful')
      console.log('Returned data:', minimalData)

      // Clean up
      await supabase.from('budget_profiles').delete().eq('user_id', testUserId)
    }

    // Try to insert without currency field
    console.log('\nTesting without currency field...')
    const { data: noCurrencyData, error: noCurrencyError } = await supabase
      .from('budget_profiles')
      .insert({
        user_id: testUserId,
        monthly_income: 5000,
        fixed_costs: 1500,
        savings_target: 1000,
        discretionary_budget: 2500,
        spending_limit_alerts: true,
      })
      .select()

    if (noCurrencyError) {
      console.log('❌ No currency insert error:', noCurrencyError.message)
    } else {
      console.log('✅ No currency insert successful')
      console.log('Returned data:', noCurrencyData)

      // Clean up
      await supabase.from('budget_profiles').delete().eq('user_id', testUserId)
    }
  } catch (err) {
    console.log('💥 Exception:', err.message)
  }
}

checkTableStructure()
