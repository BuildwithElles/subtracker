// Apply database schema to Supabase
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import dotenv from 'dotenv'

dotenv.config()

// Note: For schema changes, you typically need the service role key, not the anon key
// But let's first try to create just the profiles table with the anon key

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function checkTables() {
  console.log('🔍 Checking existing tables...')

  try {
    // Try to query the profiles table to see if it exists
    const { data, error } = await supabase.from('profiles').select('*').limit(1)

    if (error) {
      console.log('❌ Profiles table does not exist or is inaccessible:', error.message)
      console.log('💡 You need to apply the database schema in your Supabase dashboard.')
      console.log('📋 Go to: https://supabase.com/dashboard/project/bsuasgdxxmygegbzjpdt/sql')
      console.log('📝 Copy the contents of database-schema.sql and run it in the SQL Editor')
    } else {
      console.log('✅ Profiles table exists and is accessible')
      console.log('📊 Current profiles count:', data?.length || 0)
    }
  } catch (err) {
    console.log('💥 Error checking profiles table:', err.message)
  }

  // Also check subscriptions table
  try {
    const { data, error } = await supabase.from('subscriptions').select('*').limit(1)

    if (error) {
      console.log('❌ Subscriptions table does not exist or is inaccessible:', error.message)
    } else {
      console.log('✅ Subscriptions table exists and is accessible')
      console.log('📊 Current subscriptions count:', data?.length || 0)
    }
  } catch (err) {
    console.log('💥 Error checking subscriptions table:', err.message)
  }
}

checkTables()
