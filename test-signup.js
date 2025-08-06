// Test signup script
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function testSignup() {
  console.log('🧪 Testing Supabase signup...')

  const testEmail = `test-${Date.now()}@gmail.com`
  const testPassword = 'TestPassword123!'

  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User',
        },
      },
    })

    console.log('📧 Test email:', testEmail)
    console.log('✅ Signup result:', { data: !!data, error: error?.message })

    if (data?.user) {
      console.log('👤 User created with ID:', data.user.id)
      console.log('📩 Email confirmed:', !!data.user.email_confirmed_at)
      console.log('🔗 Confirmation sent:', !!data.user.confirmation_sent_at)
    }

    if (error) {
      console.log('❌ Error details:', error)
    }
  } catch (err) {
    console.log('💥 Exception:', err.message)
  }
}

testSignup()
