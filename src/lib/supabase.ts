import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Subscription = {
  id: string
  user_id: string
  service_name: string
  amount: number
  frequency: string
  last_charge_date: string
  next_charge_date: string
  status: string
  source_email_id?: string
}

export type BudgetProfile = {
  user_id: string
  monthly_income: number
  fixed_expenses: number
  savings_target: number
}
