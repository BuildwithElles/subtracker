import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabaseTables() {
  try {
    console.log('Testing database tables...')

    // Test if we can select from profiles table
    console.log('Testing profiles table...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)

    if (profilesError) {
      console.error('Profiles table error:', profilesError)
    } else {
      console.log('✅ Profiles table exists and accessible')
      console.log('Sample profiles data:', profiles)
    }

    // Test if we can select from subscriptions table
    console.log('\nTesting subscriptions table...')
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1)

    if (subscriptionsError) {
      console.error('Subscriptions table error:', subscriptionsError)
    } else {
      console.log('✅ Subscriptions table exists and accessible')
    }

    // Test if we can select from budget_profiles table
    console.log('\nTesting budget_profiles table...')
    const { data: budgets, error: budgetsError } = await supabase
      .from('budget_profiles')
      .select('*')
      .limit(1)

    if (budgetsError) {
      console.error('Budget_profiles table error:', budgetsError)
    } else {
      console.log('✅ Budget_profiles table exists and accessible')
    }

    // Get current user
    console.log('\nTesting current user...')
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error('User error:', userError)
    } else if (user) {
      console.log('✅ Current user:', user.id, user.email)

      // Test upsert on profiles table with current user
      console.log('\nTesting profiles upsert...')
      const { data: upsertData, error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          gmail_access_token: 'test-token-' + Date.now(),
          updated_at: new Date().toISOString(),
        })
        .select()

      if (upsertError) {
        console.error('❌ Profiles upsert error:', upsertError)
      } else {
        console.log('✅ Profiles upsert successful:', upsertData)
      }
    } else {
      console.log('❌ No current user found')
    }
  } catch (error) {
    console.error('Test error:', error)
  }
}

testDatabaseTables()
