// Weekly Digest System for Subscription Management
import { supabase } from './supabase'
import type { Subscription } from '../types'
import type { BudgetProfile } from './budgetAnalytics'

export interface WeeklyDigest {
  id: string
  user_id: string
  week_start: string
  week_end: string
  total_charges: number
  new_subscriptions: number
  cancelled_subscriptions: number
  trial_conversions: number
  budget_usage_percentage: number
  top_categories: Array<{ category: string; amount: number }>
  upcoming_trials_ending: number
  upcoming_charges: number
  recommendations: string[]
  generated_at: string
  sent_at?: string
  viewed_at?: string
}

export interface DigestStats {
  weeklySpending: number
  newSubscriptions: number
  cancelledSubscriptions: number
  trialConversions: number
  budgetUsage: number
  topCategory: string
  trialsEndingSoon: number
  upcomingCharges: number
}

class WeeklyDigestSystem {
  private static instance: WeeklyDigestSystem
  private digestInterval: NodeJS.Timeout | null = null

  private constructor() {}

  static getInstance(): WeeklyDigestSystem {
    if (!WeeklyDigestSystem.instance) {
      WeeklyDigestSystem.instance = new WeeklyDigestSystem()
    }
    return WeeklyDigestSystem.instance
  }

  // Initialize the digest system
  initialize() {
    this.scheduleWeeklyDigest()
    console.log('Weekly digest system initialized')
  }

  // Schedule weekly digest generation (every Sunday at 9 AM)
  private scheduleWeeklyDigest() {
    const now = new Date()
    const nextSunday = new Date(now)
    nextSunday.setDate(now.getDate() + ((7 - now.getDay()) % 7))
    nextSunday.setHours(9, 0, 0, 0)

    // If it's already past 9 AM on Sunday, schedule for next week
    if (now.getDay() === 0 && now.getHours() >= 9) {
      nextSunday.setDate(nextSunday.getDate() + 7)
    }

    const timeUntilNextDigest = nextSunday.getTime() - now.getTime()

    // Schedule the first digest
    setTimeout(() => {
      this.generateWeeklyDigests()

      // Then schedule recurring digests every week
      this.digestInterval = setInterval(
        () => {
          this.generateWeeklyDigests()
        },
        7 * 24 * 60 * 60 * 1000
      ) // 7 days
    }, timeUntilNextDigest)

    console.log(`Next weekly digest scheduled for: ${nextSunday.toLocaleString()}`)
  }

  // Stop digest scheduling
  stopDigestSystem() {
    if (this.digestInterval) {
      clearInterval(this.digestInterval)
      this.digestInterval = null
    }
  }

  // Generate weekly digests for all users
  async generateWeeklyDigests() {
    try {
      console.log('Generating weekly digests...')

      // Get all users who have subscriptions
      const { data: users, error: usersError } = await supabase
        .from('subscriptions')
        .select('user_id')
        .not('user_id', 'is', null)

      if (usersError) {
        console.error('Error fetching users:', usersError)
        return
      }

      // Get unique user IDs
      const uniqueUserIds = [...new Set(users.map(u => u.user_id))]

      // Generate digest for each user
      for (const userId of uniqueUserIds) {
        await this.generateUserWeeklyDigest(userId)
      }

      console.log(`Generated weekly digests for ${uniqueUserIds.length} users`)
    } catch (error) {
      console.error('Error generating weekly digests:', error)
    }
  }

  // Generate digest for a specific user
  async generateUserWeeklyDigest(userId: string): Promise<WeeklyDigest | null> {
    try {
      const weekEnd = new Date()
      const weekStart = new Date(weekEnd)
      weekStart.setDate(weekEnd.getDate() - 7)

      // Check if digest already exists for this week
      const { data: existingDigest } = await supabase
        .from('weekly_digests')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start', weekStart.toISOString().split('T')[0])
        .maybeSingle()

      if (existingDigest) {
        console.log(
          `Digest already exists for user ${userId} for week ${weekStart.toISOString().split('T')[0]}`
        )
        return existingDigest
      }

      // Get user's subscriptions
      const { data: subscriptions, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)

      if (subError || !subscriptions) {
        console.error('Error fetching user subscriptions:', subError)
        return null
      }

      // Get user's budget profile
      const { data: budgetProfile } = await supabase
        .from('budget_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      // Calculate digest statistics
      const stats = await this.calculateDigestStats(
        userId,
        subscriptions,
        weekStart,
        weekEnd,
        budgetProfile
      )

      // Generate recommendations
      const recommendations = this.generateRecommendations(stats, subscriptions)

      // Create digest object
      const digest: Omit<WeeklyDigest, 'id'> = {
        user_id: userId,
        week_start: weekStart.toISOString().split('T')[0],
        week_end: weekEnd.toISOString().split('T')[0],
        total_charges: stats.weeklySpending,
        new_subscriptions: stats.newSubscriptions,
        cancelled_subscriptions: stats.cancelledSubscriptions,
        trial_conversions: stats.trialConversions,
        budget_usage_percentage: stats.budgetUsage,
        top_categories: this.getTopCategories(subscriptions),
        upcoming_trials_ending: stats.trialsEndingSoon,
        upcoming_charges: stats.upcomingCharges,
        recommendations,
        generated_at: new Date().toISOString(),
      }

      // Store digest in database
      const { data: savedDigest, error: saveError } = await supabase
        .from('weekly_digests')
        .insert(digest)
        .select()
        .single()

      if (saveError) {
        console.error('Error saving weekly digest:', saveError)
        return null
      }

      // Send digest notification
      await this.sendDigestNotification(savedDigest)

      console.log(`Generated weekly digest for user ${userId}`)
      return savedDigest
    } catch (error) {
      console.error('Error generating user weekly digest:', error)
      return null
    }
  }

  // Calculate digest statistics
  private async calculateDigestStats(
    _userId: string,
    subscriptions: Subscription[],
    weekStart: Date,
    weekEnd: Date,
    budgetProfile: BudgetProfile
  ): Promise<DigestStats> {
    // Calculate weekly spending (charges that occurred this week)
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active')
    const weeklySpending = activeSubscriptions.reduce((total, sub) => {
      const chargeDate = new Date(sub.next_charge_date)
      if (chargeDate >= weekStart && chargeDate <= weekEnd) {
        return total + (sub.frequency === 'yearly' ? sub.amount / 12 : sub.amount)
      }
      return total
    }, 0)

    // Count new subscriptions this week
    const newSubscriptions = subscriptions.filter(sub => {
      if (!sub.created_at) return false
      const createdDate = new Date(sub.created_at)
      return createdDate >= weekStart && createdDate <= weekEnd
    }).length

    // Count cancelled subscriptions this week
    const cancelledSubscriptions = subscriptions.filter(sub => {
      const dateToCheck = sub.updated_at || sub.created_at
      if (!dateToCheck) return false
      const updatedDate = new Date(dateToCheck)
      return sub.status === 'cancelled' && updatedDate >= weekStart && updatedDate <= weekEnd
    }).length

    // Count trial conversions (trials that became active this week)
    const trialConversions = 0 // Would need to track status changes

    // Calculate budget usage
    const totalMonthlySpending = activeSubscriptions.reduce((total, sub) => {
      return total + (sub.frequency === 'yearly' ? sub.amount / 12 : sub.amount)
    }, 0)
    const budgetUsage = budgetProfile
      ? (totalMonthlySpending / budgetProfile.discretionary_budget) * 100
      : 0

    // Get top category
    const categorySpending = this.getTopCategories(subscriptions)
    const topCategory = categorySpending.length > 0 ? categorySpending[0].category : 'Other'

    // Count trials ending soon
    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const trialsEndingSoon = subscriptions.filter(sub => {
      if (sub.status !== 'trial' || !sub.trial_end_date) return false
      const trialEndDate = new Date(sub.trial_end_date)
      return trialEndDate >= now && trialEndDate <= sevenDaysFromNow
    }).length

    // Count upcoming charges
    const upcomingCharges = subscriptions.filter(sub => {
      if (sub.status !== 'active') return false
      const chargeDate = new Date(sub.next_charge_date)
      return chargeDate >= now && chargeDate <= sevenDaysFromNow
    }).length

    return {
      weeklySpending,
      newSubscriptions,
      cancelledSubscriptions,
      trialConversions,
      budgetUsage,
      topCategory,
      trialsEndingSoon,
      upcomingCharges,
    }
  }

  // Get top spending categories
  private getTopCategories(
    subscriptions: Subscription[]
  ): Array<{ category: string; amount: number }> {
    const categorySpending: { [key: string]: number } = {}

    subscriptions
      .filter(sub => sub.status === 'active')
      .forEach(sub => {
        const category = sub.category || 'Other'
        const monthlyAmount = sub.frequency === 'yearly' ? sub.amount / 12 : sub.amount
        categorySpending[category] = (categorySpending[category] || 0) + monthlyAmount
      })

    return Object.entries(categorySpending)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3)
  }

  // Generate personalized recommendations
  private generateRecommendations(stats: DigestStats, subscriptions: Subscription[]): string[] {
    const recommendations: string[] = []

    // Budget-based recommendations
    if (stats.budgetUsage > 90) {
      recommendations.push("You're over budget! Consider cancelling unused subscriptions.")
    } else if (stats.budgetUsage > 75) {
      recommendations.push('Approaching budget limit. Review your subscriptions to stay on track.')
    } else if (stats.budgetUsage < 50) {
      recommendations.push('Great budget management! You have room for new services if needed.')
    }

    // Trial-based recommendations
    if (stats.trialsEndingSoon > 0) {
      recommendations.push(
        `${stats.trialsEndingSoon} trial${stats.trialsEndingSoon > 1 ? 's' : ''} ending soon. Decide before they auto-charge!`
      )
    }

    // Subscription management recommendations
    if (stats.newSubscriptions > 2) {
      recommendations.push(
        'You added several new subscriptions this week. Monitor their value to avoid subscription creep.'
      )
    }

    // Category-based recommendations
    if (stats.topCategory && subscriptions.length > 5) {
      const categoryCount = subscriptions.filter(sub => sub.category === stats.topCategory).length
      if (categoryCount > 3) {
        recommendations.push(
          `You have ${categoryCount} ${stats.topCategory} subscriptions. Consider consolidating to save money.`
        )
      }
    }

    // Default helpful tip if no specific recommendations
    if (recommendations.length === 0) {
      recommendations.push(
        'Your subscriptions look well-managed! Regular reviews help maintain control over spending.'
      )
    }

    return recommendations.slice(0, 3) // Limit to 3 recommendations
  }

  // Send digest notification
  private async sendDigestNotification(digest: WeeklyDigest) {
    try {
      // Send browser notification if permission is granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('📊 Weekly Subscription Digest Ready', {
          body: `Your weekly spending report is ready. You spent ${this.formatCurrency(digest.total_charges)} this week.`,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `weekly-digest-${digest.id}`,
          requireInteraction: false,
        })
      }

      // Store notification as budget alert for consistency
      await supabase.from('budget_alerts').insert({
        user_id: digest.user_id,
        alert_type: 'weekly_summary',
        current_spending: digest.total_charges,
        budget_limit: 0,
        percentage_used: digest.budget_usage_percentage,
        sent_at: new Date().toISOString(),
        acknowledged: false,
      })
    } catch (error) {
      console.error('Error sending digest notification:', error)
    }
  }

  // Get user's weekly digests
  async getUserDigests(userId: string, limit: number = 10): Promise<WeeklyDigest[]> {
    const { data, error } = await supabase
      .from('weekly_digests')
      .select('*')
      .eq('user_id', userId)
      .order('week_start', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching user digests:', error)
      return []
    }

    return data || []
  }

  // Mark digest as viewed
  async markDigestAsViewed(digestId: string) {
    const { error } = await supabase
      .from('weekly_digests')
      .update({ viewed_at: new Date().toISOString() })
      .eq('id', digestId)

    if (error) {
      console.error('Error marking digest as viewed:', error)
    }
  }

  // Get digest summary for dashboard
  async getDigestSummary(userId: string): Promise<{
    hasUnviewedDigest: boolean
    latestDigest: WeeklyDigest | null
    weeklyTrend: 'up' | 'down' | 'stable'
  }> {
    const digests = await this.getUserDigests(userId, 2)

    if (digests.length === 0) {
      return {
        hasUnviewedDigest: false,
        latestDigest: null,
        weeklyTrend: 'stable',
      }
    }

    const latestDigest = digests[0]
    const hasUnviewedDigest = !latestDigest.viewed_at

    let weeklyTrend: 'up' | 'down' | 'stable' = 'stable'
    if (digests.length >= 2) {
      const current = digests[0].total_charges
      const previous = digests[1].total_charges
      const change = ((current - previous) / previous) * 100

      if (change > 5) weeklyTrend = 'up'
      else if (change < -5) weeklyTrend = 'down'
    }

    return {
      hasUnviewedDigest,
      latestDigest,
      weeklyTrend,
    }
  }

  // Helper method to format currency
  private formatCurrency(amount: number, currency: string = 'USD'): string {
    const currencyLocales: { [key: string]: string } = {
      USD: 'en-US',
      EUR: 'de-DE',
      GBP: 'en-GB',
      INR: 'en-IN',
    }

    return new Intl.NumberFormat(currencyLocales[currency] || 'en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }
}

// Export singleton instance
export const weeklyDigestSystem = WeeklyDigestSystem.getInstance()
