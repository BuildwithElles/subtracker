// Update database schema by running the SQL
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
)

async function updateSchema() {
  console.log('🔧 Updating database schema...')

  try {
    // Read the schema file
    const schema = readFileSync('./database-schema.sql', 'utf8')

    // Split into individual statements (basic split on semicolons outside of function definitions)
    const statements = schema.split(/;\s*\n/).filter(stmt => stmt.trim().length > 0)

    console.log(`Found ${statements.length} SQL statements`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim() + ';'

      if (statement.startsWith('--') || statement === ';') {
        continue // Skip comments and empty statements
      }

      console.log(`\n${i + 1}. Executing: ${statement.substring(0, 60)}...`)

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })

        if (error) {
          console.log(`❌ Error: ${error.message}`)
          // Continue with other statements
        } else {
          console.log(`✅ Success`)
        }
      } catch (err) {
        console.log(`❌ Exception: ${err.message}`)
        // Continue with other statements
      }
    }

    console.log('\n🎉 Schema update complete!')
  } catch (err) {
    console.log('💥 Failed to read schema file:', err.message)
  }
}

updateSchema()
