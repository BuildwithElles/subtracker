// Alert System for Trial Management and Budget Notifications
import { supabase } from './supabase'

export interface TrialAlert {
  id: string
  user_id: string
  subscription_id: string
  service_name: string
  trial_end_date: string
  amount: number
  currency: string
  alert_type: '7-day' | '3-day' | '1-day' | 'expired'
  sent_at?: string
  acknowledged?: boolean
  created_at: string
}

export interface BudgetAlert {
  id: string
  user_id: string
  alert_type: 'approaching_limit' | 'exceeded_limit' | 'weekly_summary'
  current_spending: number
  budget_limit: number
  percentage_used: number
  sent_at?: string
  acknowledged?: boolean
  created_at: string
}

class AlertSystem {
  private static instance: AlertSystem
  private alertCheckInterval: NodeJS.Timeout | null = null

  private constructor() {}

  static getInstance(): AlertSystem {
    if (!AlertSystem.instance) {
      AlertSystem.instance = new AlertSystem()
    }
    return AlertSystem.instance
  }

  // Initialize the alert system
  initialize() {
    this.startAlertMonitoring()
    console.log('Alert system initialized')
  }

  // Start monitoring for alerts every hour
  private startAlertMonitoring() {
    // Check alerts immediately
    this.checkTrialAlerts()
    this.checkBudgetAlerts()

    // Set up recurring checks every hour
    this.alertCheckInterval = setInterval(
      () => {
        this.checkTrialAlerts()
        this.checkBudgetAlerts()
      },
      60 * 60 * 1000
    ) // 1 hour
  }

  // Stop alert monitoring
  stopAlertMonitoring() {
    if (this.alertCheckInterval) {
      clearInterval(this.alertCheckInterval)
      this.alertCheckInterval = null
    }
  }

  // Check for trial alerts
  async checkTrialAlerts() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Get all active trials
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'trial')
        .not('trial_end_date', 'is', null)

      if (error) {
        console.error('Error fetching trial subscriptions:', error)
        return
      }

      if (!subscriptions || subscriptions.length === 0) return

      const now = new Date()
      const alerts: TrialAlert[] = []

      for (const subscription of subscriptions) {
        const trialEndDate = new Date(subscription.trial_end_date)
        const timeDiff = trialEndDate.getTime() - now.getTime()
        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))

        let alertType: TrialAlert['alert_type'] | null = null

        if (daysDiff <= 0) {
          alertType = 'expired'
        } else if (daysDiff <= 1) {
          alertType = '1-day'
        } else if (daysDiff <= 3) {
          alertType = '3-day'
        } else if (daysDiff <= 7) {
          alertType = '7-day'
        }

        if (alertType) {
          // Check if we've already sent this alert
          const { data: existingAlert } = await supabase
            .from('trial_alerts')
            .select('*')
            .eq('user_id', user.id)
            .eq('subscription_id', subscription.id)
            .eq('alert_type', alertType)
            .maybeSingle()

          if (!existingAlert) {
            const alert: Omit<TrialAlert, 'id' | 'created_at'> = {
              user_id: user.id,
              subscription_id: subscription.id,
              service_name: subscription.service_name,
              trial_end_date: subscription.trial_end_date,
              amount: subscription.amount,
              currency: subscription.currency,
              alert_type: alertType,
              acknowledged: false,
            }

            alerts.push(alert as TrialAlert)
          }
        }
      }

      // Send and store new alerts
      for (const alert of alerts) {
        await this.sendTrialAlert(alert)
      }
    } catch (error) {
      console.error('Error checking trial alerts:', error)
    }
  }

  // Send trial alert notification
  private async sendTrialAlert(alert: Omit<TrialAlert, 'id' | 'created_at'>) {
    try {
      // Store alert in database
      const { error } = await supabase.from('trial_alerts').insert({
        ...alert,
        sent_at: new Date().toISOString(),
      })

      if (error) {
        console.error('Error storing trial alert:', error)
        return
      }

      // Send notification (browser notification, email, etc.)
      await this.showTrialNotification(alert)

      console.log(`Trial alert sent for ${alert.service_name}: ${alert.alert_type}`)
    } catch (error) {
      console.error('Error sending trial alert:', error)
    }
  }

  // Show browser notification for trial alert
  private async showTrialNotification(alert: Omit<TrialAlert, 'id' | 'created_at'>) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const messages = {
        '7-day': `${alert.service_name} trial ends in 7 days`,
        '3-day': `⚠️ ${alert.service_name} trial ends in 3 days!`,
        '1-day': `🚨 ${alert.service_name} trial ends tomorrow!`,
        expired: `💳 ${alert.service_name} trial has expired - charges may apply`,
      }

      const bodies = {
        '7-day': `Your ${alert.service_name} trial will end soon. Decide if you want to continue or cancel.`,
        '3-day': `Only 3 days left! Will charge ${this.formatCurrency(alert.amount, alert.currency)} if not cancelled.`,
        '1-day': `Last chance! Trial ends tomorrow and will charge ${this.formatCurrency(alert.amount, alert.currency)}.`,
        expired: `Your trial has ended. Check if charges have been applied to your account.`,
      }

      new Notification(messages[alert.alert_type], {
        body: bodies[alert.alert_type],
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `trial-${alert.subscription_id}`,
        requireInteraction: alert.alert_type === '1-day' || alert.alert_type === 'expired',
      })
    }
  }

  // Check for budget alerts
  async checkBudgetAlerts() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Get budget profile
      const { data: budgetProfile, error: budgetError } = await supabase
        .from('budget_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (budgetError || !budgetProfile) return

      // Calculate current spending
      const { data: subscriptions, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (subError || !subscriptions) return

      const currentSpending = subscriptions.reduce((total, sub) => {
        const monthlyAmount = sub.frequency === 'yearly' ? sub.amount / 12 : sub.amount
        return total + monthlyAmount
      }, 0)

      const percentageUsed = (currentSpending / budgetProfile.discretionary_budget) * 100

      // Check for budget alerts
      let alertType: BudgetAlert['alert_type'] | null = null

      if (percentageUsed >= 100) {
        alertType = 'exceeded_limit'
      } else if (percentageUsed >= 85) {
        alertType = 'approaching_limit'
      }

      if (alertType) {
        // Check if we've already sent this alert today
        const today = new Date().toISOString().split('T')[0]
        const { data: existingAlert } = await supabase
          .from('budget_alerts')
          .select('*')
          .eq('user_id', user.id)
          .eq('alert_type', alertType)
          .gte('sent_at', today)
          .maybeSingle()

        if (!existingAlert) {
          await this.sendBudgetAlert({
            user_id: user.id,
            alert_type: alertType,
            current_spending: currentSpending,
            budget_limit: budgetProfile.discretionary_budget,
            percentage_used: percentageUsed,
            acknowledged: false,
          } as Omit<BudgetAlert, 'id' | 'created_at'>)
        }
      }
    } catch (error) {
      console.error('Error checking budget alerts:', error)
    }
  }

  // Send budget alert notification
  private async sendBudgetAlert(alert: Omit<BudgetAlert, 'id' | 'created_at'>) {
    try {
      // Store alert in database
      const { error } = await supabase.from('budget_alerts').insert({
        ...alert,
        sent_at: new Date().toISOString(),
      })

      if (error) {
        console.error('Error storing budget alert:', error)
        return
      }

      // Send notification
      await this.showBudgetNotification(alert)

      console.log(`Budget alert sent: ${alert.alert_type}`)
    } catch (error) {
      console.error('Error sending budget alert:', error)
    }
  }

  // Show browser notification for budget alert
  private async showBudgetNotification(alert: Omit<BudgetAlert, 'id' | 'created_at'>) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const messages = {
        approaching_limit: '⚠️ Budget Alert: Approaching Limit',
        exceeded_limit: '🚨 Budget Alert: Limit Exceeded!',
        weekly_summary: '📊 Weekly Spending Summary',
      }

      const bodies = {
        approaching_limit: `You've used ${Math.round(alert.percentage_used)}% of your monthly budget (${this.formatCurrency(alert.current_spending)} of ${this.formatCurrency(alert.budget_limit)})`,
        exceeded_limit: `You've exceeded your monthly budget! Current spending: ${this.formatCurrency(alert.current_spending)} (${Math.round(alert.percentage_used)}%)`,
        weekly_summary: `This week's subscription spending summary is ready to view.`,
      }

      new Notification(messages[alert.alert_type], {
        body: bodies[alert.alert_type],
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `budget-${alert.alert_type}`,
        requireInteraction: alert.alert_type === 'exceeded_limit',
      })
    }
  }

  // Get pending alerts for user
  async getPendingAlerts(userId: string) {
    const { data: trialAlerts } = await supabase
      .from('trial_alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('acknowledged', false)
      .order('created_at', { ascending: false })

    const { data: budgetAlerts } = await supabase
      .from('budget_alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('acknowledged', false)
      .order('created_at', { ascending: false })

    return {
      trialAlerts: trialAlerts || [],
      budgetAlerts: budgetAlerts || [],
    }
  }

  // Acknowledge alert
  async acknowledgeAlert(alertId: string, type: 'trial' | 'budget') {
    const table = type === 'trial' ? 'trial_alerts' : 'budget_alerts'

    const { error } = await supabase.from(table).update({ acknowledged: true }).eq('id', alertId)

    if (error) {
      console.error(`Error acknowledging ${type} alert:`, error)
    }
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
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
export const alertSystem = AlertSystem.getInstance()
