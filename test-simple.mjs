// Simple test to see what fields exist in budget_profiles
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
)

async function simpleTest() {
  console.log('🔍 Testing basic fields...')

  try {
    // Test just the basic fields that are likely to exist
    const testUserId = '00000000-0000-0000-0000-000000000000'

    const { data, error } = await supabase
      .from('budget_profiles')
      .insert({
        user_id: testUserId,
      })
      .select()

    if (error) {
      console.log('❌ Error:', error.message)
      console.log('Error code:', error.code)
      console.log('Error details:', error.details)
    } else {
      console.log('✅ Success:', data)
    }
  } catch (err) {
    console.log('💥 Exception:', err.message)
  }
}

simpleTest()
