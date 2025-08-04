// Enhanced Budget Profile Integration with Advanced Analytics
import { supabase } from './supabase'

export interface BudgetInsights {
  currentPeriodSpending: number
  projectedMonthlySpending: number
  savingsOnTrack: boolean
  dailySafeSpend: number
  daysUntilOverbudget: number
  categoryBreakdown: Array<{
    category: string
    amount: number
    percentage: number
    trend: 'up' | 'down' | 'stable'
  }>
  recommendations: string[]
  riskLevel: 'low' | 'medium' | 'high'
}

export interface BudgetProfile {
  id?: string
  user_id: string
  monthly_income: number
  fixed_costs: number
  savings_target: number
  discretionary_budget: number
  currency: string
  spending_limit_alerts: boolean
  created_at?: string
  updated_at?: string
}

class BudgetAnalytics {
  private static instance: BudgetAnalytics

  private constructor() {}

  static getInstance(): BudgetAnalytics {
    if (!BudgetAnalytics.instance) {
      BudgetAnalytics.instance = new BudgetAnalytics()
    }
    return BudgetAnalytics.instance
  }

  // Calculate comprehensive budget insights
  async calculateBudgetInsights(userId: string): Promise<BudgetInsights | null> {
    try {
      // Get budget profile
      const { data: budgetProfile, error: budgetError } = await supabase
        .from('budget_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (budgetError || !budgetProfile) {
        console.log('No budget profile found for user')
        return null
      }

      // Get user's subscriptions
      const { data: subscriptions, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')

      if (subError) {
        console.error('Error fetching subscriptions:', subError)
        return null
      }

      // Calculate current period spending
      const currentMonthlySpending = this.calculateMonthlySpending(subscriptions || [])
      
      // Calculate insights
      const insights = this.generateInsights(budgetProfile, subscriptions || [], currentMonthlySpending)
      
      return insights

    } catch (error) {
      console.error('Error calculating budget insights:', error)
      return null
    }
  }

  // Calculate monthly spending from subscriptions
  private calculateMonthlySpending(subscriptions: any[]): number {
    return subscriptions.reduce((total, sub) => {
      const monthlyAmount = sub.frequency === 'yearly' ? sub.amount / 12 : sub.amount
      return total + monthlyAmount
    }, 0)
  }

  // Generate comprehensive insights
  private generateInsights(
    budgetProfile: BudgetProfile, 
    subscriptions: any[], 
    currentSpending: number
  ): BudgetInsights {
    const { discretionary_budget, monthly_income, savings_target, fixed_costs } = budgetProfile

    // Calculate projections
    const projectedMonthlySpending = currentSpending
    const remainingBudget = discretionary_budget - currentSpending
    
    // Calculate daily safe spend
    const today = new Date()
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    const dayOfMonth = today.getDate()
    const daysRemaining = daysInMonth - dayOfMonth + 1
    const dailySafeSpend = Math.max(0, remainingBudget / daysRemaining)

    // Calculate days until overbudget
    const dailyBurnRate = currentSpending / 30 // Approximate daily rate
    const daysUntilOverbudget = dailyBurnRate > 0 
      ? Math.floor(remainingBudget / dailyBurnRate)
      : Infinity

    // Check if savings are on track
    const totalSpending = fixed_costs + currentSpending
    const availableForSavings = monthly_income - totalSpending
    const savingsOnTrack = availableForSavings >= savings_target

    // Calculate category breakdown
    const categoryBreakdown = this.calculateCategoryBreakdown(subscriptions, discretionary_budget)

    // Determine risk level
    const budgetUsagePercentage = (currentSpending / discretionary_budget) * 100
    const riskLevel = this.determineRiskLevel(budgetUsagePercentage, savingsOnTrack, daysUntilOverbudget)

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      budgetProfile,
      currentSpending,
      budgetUsagePercentage,
      savingsOnTrack,
      categoryBreakdown,
      riskLevel
    )

    return {
      currentPeriodSpending: currentSpending,
      projectedMonthlySpending,
      savingsOnTrack,
      dailySafeSpend,
      daysUntilOverbudget: isFinite(daysUntilOverbudget) ? daysUntilOverbudget : 999,
      categoryBreakdown,
      recommendations,
      riskLevel
    }
  }

  // Calculate category breakdown with trends
  private calculateCategoryBreakdown(subscriptions: any[], totalBudget: number): BudgetInsights['categoryBreakdown'] {
    const categorySpending: { [key: string]: number } = {}
    
    // Calculate current spending by category
    subscriptions.forEach(sub => {
      const category = sub.category || 'Other'
      const monthlyAmount = sub.frequency === 'yearly' ? sub.amount / 12 : sub.amount
      categorySpending[category] = (categorySpending[category] || 0) + monthlyAmount
    })

    // Convert to array with percentages and trends
    const categoryArray = Object.entries(categorySpending)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalBudget) * 100,
        trend: 'stable' as 'up' | 'down' | 'stable' // Would need historical data for real trends
      }))
      .sort((a, b) => b.amount - a.amount)

    return categoryArray
  }

  // Determine risk level based on multiple factors
  private determineRiskLevel(
    budgetUsagePercentage: number,
    savingsOnTrack: boolean,
    daysUntilOverbudget: number
  ): 'low' | 'medium' | 'high' {
    if (budgetUsagePercentage > 90 || !savingsOnTrack || daysUntilOverbudget < 7) {
      return 'high'
    } else if (budgetUsagePercentage > 70 || daysUntilOverbudget < 15) {
      return 'medium'
    } else {
      return 'low'
    }
  }

  // Generate personalized recommendations
  private generateRecommendations(
    budgetProfile: BudgetProfile,
    currentSpending: number,
    budgetUsagePercentage: number,
    savingsOnTrack: boolean,
    categoryBreakdown: BudgetInsights['categoryBreakdown'],
    riskLevel: 'low' | 'medium' | 'high'
  ): string[] {
    const recommendations: string[] = []

    // Budget usage recommendations
    if (budgetUsagePercentage > 100) {
      recommendations.push('🚨 You\'ve exceeded your discretionary budget. Consider cancelling unused subscriptions immediately.')
    } else if (budgetUsagePercentage > 85) {
      recommendations.push('⚠️ You\'re close to your budget limit. Review your subscriptions to avoid overspending.')
    } else if (budgetUsagePercentage < 50) {
      recommendations.push('✅ Great budget control! You have room for additional services if needed.')
    }

    // Savings recommendations
    if (!savingsOnTrack) {
      const shortfall = budgetProfile.savings_target - (budgetProfile.monthly_income - budgetProfile.fixed_costs - currentSpending)
      recommendations.push(`💰 You're ${this.formatCurrency(shortfall)} short of your savings goal. Consider reducing subscription spending.`)
    }

    // Category-specific recommendations
    if (categoryBreakdown.length > 0) {
      const topCategory = categoryBreakdown[0]
      if (topCategory.percentage > 40) {
        recommendations.push(`📊 ${topCategory.category} accounts for ${topCategory.percentage.toFixed(0)}% of your budget. Consider consolidating services in this category.`)
      }
    }

    // High-risk specific recommendations
    if (riskLevel === 'high') {
      recommendations.push('🎯 Priority: Focus on your top 3 most essential subscriptions and cancel the rest temporarily.')
    }

    // Income optimization recommendations
    const remainingAfterEssentials = budgetProfile.monthly_income - budgetProfile.fixed_costs - budgetProfile.savings_target
    if (currentSpending > remainingAfterEssentials) {
      recommendations.push('💡 Consider increasing your income or adjusting your savings target to accommodate your subscription lifestyle.')
    }

    return recommendations.slice(0, 4) // Limit to 4 recommendations
  }

  // Create or update budget profile with validation
  async saveBudgetProfile(budgetData: Omit<BudgetProfile, 'id' | 'created_at' | 'updated_at'>): Promise<BudgetProfile | null> {
    try {
      // Validate budget data
      const validation = this.validateBudgetProfile(budgetData)
      if (!validation.isValid) {
        throw new Error(`Budget validation failed: ${validation.errors.join(', ')}`)
      }

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('budget_profiles')
        .select('*')
        .eq('user_id', budgetData.user_id)
        .single()

      let result
      if (existingProfile) {
        // Update existing profile
        const { data, error } = await supabase
          .from('budget_profiles')
          .update({
            ...budgetData,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', budgetData.user_id)
          .select()
          .single()

        result = { data, error }
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from('budget_profiles')
          .insert(budgetData)
          .select()
          .single()

        result = { data, error }
      }

      if (result.error) {
        console.error('Error saving budget profile:', result.error)
        return null
      }

      return result.data
    } catch (error) {
      console.error('Error in saveBudgetProfile:', error)
      return null
    }
  }

  // Validate budget profile data
  private validateBudgetProfile(budgetData: Omit<BudgetProfile, 'id' | 'created_at' | 'updated_at'>): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    // Required fields
    if (!budgetData.user_id) errors.push('User ID is required')
    if (budgetData.monthly_income <= 0) errors.push('Monthly income must be greater than 0')
    if (budgetData.fixed_costs < 0) errors.push('Fixed costs cannot be negative')
    if (budgetData.savings_target < 0) errors.push('Savings target cannot be negative')
    if (budgetData.discretionary_budget < 0) errors.push('Discretionary budget cannot be negative')

    // Logical validations
    const totalAllocated = budgetData.fixed_costs + budgetData.savings_target + budgetData.discretionary_budget
    if (totalAllocated > budgetData.monthly_income) {
      errors.push('Total allocated budget exceeds monthly income')
    }

    // Currency validation
    const validCurrencies = ['USD', 'EUR', 'GBP', 'INR']
    if (!validCurrencies.includes(budgetData.currency)) {
      errors.push('Invalid currency')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Get budget summary for dashboard
  async getBudgetSummary(userId: string): Promise<{
    hasProfile: boolean
    budgetUsage: number
    riskLevel: 'low' | 'medium' | 'high'
    nextAction: string
  }> {
    const insights = await this.calculateBudgetInsights(userId)
    
    if (!insights) {
      return {
        hasProfile: false,
        budgetUsage: 0,
        riskLevel: 'low',
        nextAction: 'Set up your budget profile to track spending'
      }
    }

    const budgetUsage = (insights.currentPeriodSpending / insights.projectedMonthlySpending) * 100
    
    let nextAction = 'Your budget is on track'
    if (insights.riskLevel === 'high') {
      nextAction = 'Review and reduce subscriptions immediately'
    } else if (insights.riskLevel === 'medium') {
      nextAction = 'Monitor spending closely this month'
    } else if (!insights.savingsOnTrack) {
      nextAction = 'Adjust spending to meet savings goal'
    }

    return {
      hasProfile: true,
      budgetUsage,
      riskLevel: insights.riskLevel,
      nextAction
    }
  }

  // Helper method to format currency
  private formatCurrency(amount: number, currency: string = 'USD'): string {
    const currencyLocales: { [key: string]: string } = {
      'USD': 'en-US',
      'EUR': 'de-DE',
      'GBP': 'en-GB',
      'INR': 'en-IN'
    }
    
    return new Intl.NumberFormat(currencyLocales[currency] || 'en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }
}

// Export singleton instance
export const budgetAnalytics = BudgetAnalytics.getInstance()
