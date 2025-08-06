// Check database schema and tables
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

// Use service role key if available for admin operations
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
)

async function checkSchema() {
  console.log('🔍 Checking database schema...')

  try {
    // Check if budget_profiles table exists and what columns it has
    console.log('Checking budget_profiles table...')

    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'budget_profiles')

    if (tablesError) {
      console.log('❌ Cannot access table information:', tablesError.message)
    } else {
      console.log('✅ Table check result:', tables)
    }

    // Try to describe the budget_profiles table structure
    console.log('\nChecking table columns...')
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'budget_profiles')

    if (columnsError) {
      console.log('❌ Cannot access column information:', columnsError.message)
    } else {
      console.log('✅ Budget profiles columns:', columns)
    }

    // Check foreign key constraints
    console.log('\nChecking foreign key constraints...')
    const { data: constraints, error: constraintsError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, constraint_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'budget_profiles')
      .eq('constraint_type', 'FOREIGN KEY')

    if (constraintsError) {
      console.log('❌ Cannot access constraint information:', constraintsError.message)
    } else {
      console.log('✅ Foreign key constraints:', constraints)
    }

    // Test a simple query
    console.log('\nTesting simple query...')
    const { data: simpleData, error: simpleError } = await supabase
      .from('budget_profiles')
      .select('user_id')
      .limit(1)

    if (simpleError) {
      console.log('❌ Simple query failed:', simpleError.message)
    } else {
      console.log('✅ Simple query works, found records:', simpleData?.length || 0)
    }
  } catch (err) {
    console.log('💥 Exception:', err.message)
  }
}

checkSchema()
