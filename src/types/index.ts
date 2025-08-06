/**
 * Shared TypeScript interfaces and types for SubTracker
 */

// Core subscription interface
export interface Subscription {
  id: string
  service_name: string
  amount: number
  currency: string
  frequency: 'monthly' | 'yearly' | 'weekly'
  next_charge_date: string
  status: 'active' | 'cancelled' | 'trial' | 'pending'
  category?: string
  trial_end_date?: string | null
  user_id?: string
  created_at?: string
  updated_at?: string
}

// Budget profile interface
export interface BudgetProfile {
  id?: string
  user_id: string
  monthly_income: number
  fixed_costs: number
  savings_target: number
  discretionary_budget: number
  spending_limit_alerts: boolean
  created_at?: string
  updated_at?: string
}

// Budget insights interface
export interface BudgetInsights {
  totalSpending: number
  budgetUsage: number
  savingsProjection: number
  categoryBreakdown: CategoryBreakdown[]
  recommendations: string[]
  trends: {
    spendingTrend: 'up' | 'down' | 'stable'
    budgetHealth: 'good' | 'warning' | 'critical'
  }
  riskLevel: 'low' | 'medium' | 'high'
}

// Category breakdown for budget analysis
export interface CategoryBreakdown {
  category: string
  amount: number
  percentage: number
  trend: 'up' | 'down' | 'stable'
  subscriptionCount: number
}

// Alert interfaces
export interface TrialAlert {
  id: string
  user_id: string
  subscription_id: string
  service_name: string
  trial_end_date: string
  days_remaining: number
  alert_type: 'trial_ending'
  status: 'pending' | 'acknowledged' | 'dismissed'
  created_at: string
}

export interface BudgetAlert {
  id: string
  user_id: string
  alert_type: 'budget_warning' | 'budget_exceeded'
  message: string
  budget_usage: number
  status: 'pending' | 'acknowledged' | 'dismissed'
  created_at: string
}

// Weekly digest interface
export interface WeeklyDigest {
  id: string
  user_id: string
  week_start_date: string
  week_end_date: string
  total_spending: number
  new_subscriptions_count: number
  cancelled_subscriptions_count: number
  trials_ending_count: number
  budget_usage_percentage: number
  recommendations: string[]
  created_at: string
}

// Gmail integration types
export interface ParsedTrialEmail {
  serviceName: string
  trialEndDate: string
  emailSubject: string
  emailDate: string
  amount?: number
  frequency?: string
}

// Currency type
export type Currency = 'USD' | 'EUR' | 'GBP' | 'INR'

// User metadata interface
export interface UserMetadata {
  gmail_connected?: boolean
  preferred_currency?: Currency
  notification_preferences?: {
    trial_alerts: boolean
    budget_alerts: boolean
    weekly_digest: boolean
  }
}

// API response types
export interface ApiResponse<T = unknown> {
  data?: T
  error?: {
    message: string
    code?: string
  }
  success: boolean
}

// Supabase user type extension
export interface User {
  id: string
  email?: string
  user_metadata?: UserMetadata
  app_metadata?: Record<string, unknown>
}

// Exchange rates interface
export interface ExchangeRates {
  [key: string]: number
}

// Subscription frequency mapping
export type SubscriptionFrequency = 'monthly' | 'yearly' | 'weekly'

// Subscription status mapping
export type SubscriptionStatus = 'active' | 'cancelled' | 'trial' | 'pending'

// Alert status mapping
export type AlertStatus = 'pending' | 'acknowledged' | 'dismissed'

// Budget health levels
export type BudgetHealth = 'good' | 'warning' | 'critical'

// Risk levels
export type RiskLevel = 'low' | 'medium' | 'high'

// Trend directions
export type TrendDirection = 'up' | 'down' | 'stable'
