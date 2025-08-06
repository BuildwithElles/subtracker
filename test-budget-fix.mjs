// Add missing columns to budget_profiles table
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function addMissingColumns() {
  console.log('🔧 Adding missing columns to budget_profiles...')

  try {
    // Check if columns exist by trying to select them
    console.log('Checking current table structure...')

    const { data, error } = await supabase.from('budget_profiles').select('*').limit(1)

    if (error) {
      console.log('Error:', error.message)
    } else {
      console.log('Current table data sample:', data)
    }

    // Now let's try to determine what fields exist by inserting minimal data
    console.log('\nTesting with basic user_id field...')

    // Use a real authenticated user's ID for testing
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log('❌ No authenticated user found. Please login first.')
      return
    }

    const { data: insertData, error: insertError } = await supabase
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

    if (insertError) {
      console.log('❌ Insert error:', insertError.message)
      console.log('Error details:', insertError)
    } else {
      console.log('✅ Insert successful:', insertData)

      // Now try adding other fields one by one
      console.log('\nTesting additional fields...')

      const { data: updateData, error: updateError } = await supabase
        .from('budget_profiles')
        .update({
          fixed_costs: 1500.0,
          savings_target: 1000.0,
        })
        .eq('user_id', user.id)
        .select()

      if (updateError) {
        console.log('❌ Update error:', updateError.message)
      } else {
        console.log('✅ Update successful:', updateData)
      }
    }
  } catch (err) {
    console.log('💥 Exception:', err.message)
  }
}

addMissingColumns()
