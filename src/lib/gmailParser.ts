/**
 * Gmail Parser for Subscription Trial Detection
 *
 * This module handles parsing Gmail emails to detect subscription trials
 * and extract trial end dates, service names, and pricing information.
 */

export interface ParsedTrialEmail {
  serviceName: string
  amount?: number
  currency?: string
  trialEndDate?: string
  nextChargeDate?: string
  frequency?: 'monthly' | 'yearly'
  category?: string
  status: 'trial' | 'active'
  confidence: number // 0-1, how confident we are in the parsing
}

export interface EmailMessage {
  id: string
  subject: string
  body: string
  from: string
  date: string
}

// Common trial-related keywords and patterns
const TRIAL_KEYWORDS = [
  'free trial',
  'trial period',
  'trial expires',
  'trial ends',
  'trial ending',
  'trial subscription',
  'start your trial',
  'your trial',
  'trial version',
  'premium trial',
]

const BILLING_KEYWORDS = [
  'subscription',
  'billing',
  'payment',
  'charge',
  'invoice',
  'receipt',
  'renewal',
  'auto-renewal',
  'recurring',
]

const SERVICE_PATTERNS = {
  Netflix: {
    domains: ['netflix.com', 'netflix.ca'],
    patterns: [/netflix/i],
    category: 'Entertainment',
  },
  Spotify: {
    domains: ['spotify.com'],
    patterns: [/spotify/i, /premium/i],
    category: 'Music',
  },
  'Adobe Creative Cloud': {
    domains: ['adobe.com'],
    patterns: [/adobe/i, /creative cloud/i, /photoshop/i],
    category: 'Productivity',
  },
  Notion: {
    domains: ['notion.so'],
    patterns: [/notion/i],
    category: 'Productivity',
  },
  Figma: {
    domains: ['figma.com'],
    patterns: [/figma/i],
    category: 'Design',
  },
  GitHub: {
    domains: ['github.com'],
    patterns: [/github/i, /copilot/i],
    category: 'Development',
  },
  OpenAI: {
    domains: ['openai.com'],
    patterns: [/openai/i, /chatgpt/i, /gpt/i],
    category: 'AI Tools',
  },
  Slack: {
    domains: ['slack.com'],
    patterns: [/slack/i, /workspace/i],
    category: 'Communication',
  },
  Zoom: {
    domains: ['zoom.us'],
    patterns: [/zoom/i, /meeting/i],
    category: 'Communication',
  },
  Dropbox: {
    domains: ['dropbox.com'],
    patterns: [/dropbox/i],
    category: 'Storage',
  },
  'Microsoft 365': {
    domains: ['microsoft.com', 'office.com'],
    patterns: [/office 365/i, /microsoft 365/i],
    category: 'Productivity',
  },
  'Disney+': {
    domains: ['disneyplus.com', 'disney.com'],
    patterns: [/disney/i, /disney plus/i, /disney\+/i],
    category: 'Entertainment',
  },
  Hulu: {
    domains: ['hulu.com'],
    patterns: [/hulu/i],
    category: 'Entertainment',
  },
  'Prime Video': {
    domains: ['amazon.com', 'primevideo.com'],
    patterns: [/prime video/i, /amazon prime/i],
    category: 'Entertainment',
  },
  'Apple Music': {
    domains: ['apple.com'],
    patterns: [/apple music/i],
    category: 'Music',
  },
  'YouTube Premium': {
    domains: ['youtube.com', 'google.com'],
    patterns: [/youtube premium/i, /youtube music/i],
    category: 'Entertainment',
  },
  Canva: {
    domains: ['canva.com'],
    patterns: [/canva/i],
    category: 'Design',
  },
  Grammarly: {
    domains: ['grammarly.com'],
    patterns: [/grammarly/i],
    category: 'Productivity',
  },
  Trello: {
    domains: ['trello.com', 'atlassian.com'],
    patterns: [/trello/i],
    category: 'Productivity',
  },
  Linear: {
    domains: ['linear.app'],
    patterns: [/linear/i],
    category: 'Productivity',
  },
}

// Currency patterns
const CURRENCY_PATTERNS = {
  USD: /\$(\d+(?:\.\d{2})?)/g,
  EUR: /€(\d+(?:\.\d{2})?)/g,
  GBP: /£(\d+(?:\.\d{2})?)/g,
  INR: /₹(\d+(?:,\d{3})*(?:\.\d{2})?)/g,
}

// Date patterns for trial end dates
const DATE_PATTERNS = [
  // "Your trial ends on January 15, 2025"
  /trial\s+(?:ends?|expires?)\s+(?:on\s+)?([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
  // "Your trial will end January 15"
  /trial\s+(?:will\s+)?end\s+([A-Za-z]+\s+\d{1,2})/i,
  // "Free trial until 2025-01-15"
  /trial\s+until\s+(\d{4}-\d{2}-\d{2})/i,
  // "Trial expires: Jan 15, 2025"
  /trial\s+expires?:?\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
  // ISO date format
  /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/i,
]

/**
 * Parses Gmail messages to detect subscription trials
 */
export class GmailSubscriptionParser {
  /**
   * Parse a single email message for trial information
   */
  parseEmail(email: EmailMessage): ParsedTrialEmail | null {
    const content = `${email.subject} ${email.body}`.toLowerCase()

    // Check if email contains trial-related keywords
    const hasTrialKeywords = TRIAL_KEYWORDS.some(keyword => content.includes(keyword.toLowerCase()))

    const hasBillingKeywords = BILLING_KEYWORDS.some(keyword =>
      content.includes(keyword.toLowerCase())
    )

    if (!hasTrialKeywords && !hasBillingKeywords) {
      return null
    }

    // Detect service name
    const serviceName = this.detectServiceName(email.from, content)
    if (!serviceName) {
      return null
    }

    // Extract trial end date
    const trialEndDate = this.extractTrialEndDate(content, email.body)

    // Extract pricing information
    const pricing = this.extractPricing(content, email.body)

    // Determine if this is a trial or active subscription
    const isTrialEmail = hasTrialKeywords || content.includes('trial')

    // Calculate confidence score
    const confidence = this.calculateConfidence(email, {
      hasTrialKeywords,
      hasBillingKeywords,
      hasServiceName: !!serviceName,
      hasTrialEndDate: !!trialEndDate,
      hasPricing: !!pricing.amount,
    })

    if (confidence < 0.5) {
      return null // Low confidence, skip
    }

    return {
      serviceName,
      amount: pricing.amount,
      currency: pricing.currency,
      trialEndDate: trialEndDate || undefined,
      nextChargeDate: trialEndDate || undefined, // For trials, next charge = trial end
      frequency: this.detectFrequency(content),
      category: this.getServiceCategory(serviceName),
      status: isTrialEmail ? 'trial' : 'active',
      confidence,
    }
  }

  /**
   * Parse multiple emails and return unique subscriptions
   */
  parseEmails(emails: EmailMessage[]): ParsedTrialEmail[] {
    const parsed = emails
      .map(email => this.parseEmail(email))
      .filter(result => result !== null) as ParsedTrialEmail[]

    // Deduplicate by service name, keeping the highest confidence result
    const uniqueServices = new Map<string, ParsedTrialEmail>()

    parsed.forEach(trial => {
      const existing = uniqueServices.get(trial.serviceName)
      if (!existing || trial.confidence > existing.confidence) {
        uniqueServices.set(trial.serviceName, trial)
      }
    })

    return Array.from(uniqueServices.values())
  }

  /**
   * Detect service name from email sender and content
   */
  private detectServiceName(from: string, content: string): string | null {
    // Check domain patterns
    for (const [serviceName, config] of Object.entries(SERVICE_PATTERNS)) {
      // Check sender domain
      if (config.domains.some(domain => from.includes(domain))) {
        return serviceName
      }

      // Check content patterns
      if (config.patterns.some(pattern => pattern.test(content))) {
        return serviceName
      }
    }

    return null
  }

  /**
   * Extract trial end date from email content
   */
  private extractTrialEndDate(content: string, fullBody: string): string | null {
    for (const pattern of DATE_PATTERNS) {
      const match = content.match(pattern) || fullBody.match(pattern)
      if (match) {
        try {
          const dateStr = match[1]
          const date = new Date(dateStr)
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0] // Return YYYY-MM-DD format
          }
        } catch (e) {
          continue
        }
      }
    }

    return null
  }

  /**
   * Extract pricing information
   */
  private extractPricing(
    content: string,
    fullBody: string
  ): { amount?: number; currency?: string } {
    for (const [currency, pattern] of Object.entries(CURRENCY_PATTERNS)) {
      const match = content.match(pattern) || fullBody.match(pattern)
      if (match) {
        const amount = parseFloat(match[1]?.replace(/,/g, '') || '0')
        if (amount > 0) {
          return { amount, currency }
        }
      }
    }

    return {}
  }

  /**
   * Detect billing frequency
   */
  private detectFrequency(content: string): 'monthly' | 'yearly' {
    if (content.includes('yearly') || content.includes('annual') || content.includes('per year')) {
      return 'yearly'
    }
    return 'monthly' // Default to monthly
  }

  /**
   * Get service category
   */
  private getServiceCategory(serviceName: string): string {
    const service = SERVICE_PATTERNS[serviceName as keyof typeof SERVICE_PATTERNS]
    return service?.category || 'Other'
  }

  /**
   * Calculate confidence score based on various factors
   */
  private calculateConfidence(
    _email: EmailMessage,
    factors: {
      hasTrialKeywords: boolean
      hasBillingKeywords: boolean
      hasServiceName: boolean
      hasTrialEndDate: boolean
      hasPricing: boolean
    }
  ): number {
    let score = 0

    // Base score for having keywords
    if (factors.hasTrialKeywords) score += 0.3
    if (factors.hasBillingKeywords) score += 0.2

    // Service identification
    if (factors.hasServiceName) score += 0.3

    // Data extraction success
    if (factors.hasTrialEndDate) score += 0.15
    if (factors.hasPricing) score += 0.05

    return Math.min(score, 1.0)
  }
}

/**
 * Gmail API integration helper functions
 */
export class GmailIntegration {
  private parser = new GmailSubscriptionParser()

  /**
   * Fetch and parse subscription-related emails
   * This would integrate with the Gmail API in a real implementation
   */
  async fetchAndParseSubscriptions(): Promise<ParsedTrialEmail[]> {
    try {
      // In a real implementation, this would:
      // 1. Use Gmail API to search for emails with subscription keywords
      // 2. Fetch email content
      // 3. Parse the emails using our parser

      // For now, return mock data
      console.log('Gmail integration - using mock data for development')

      // Mock Gmail emails data
      const mockEmails: EmailMessage[] = [
        {
          id: 'email1',
          subject: 'Your Notion Pro trial expires tomorrow',
          body: 'Your free trial of Notion Pro expires on August 5, 2025. You will be charged £6.50 monthly after the trial ends.',
          from: 'noreply@notion.so',
          date: '2025-08-04',
        },
        {
          id: 'email2',
          subject: 'Figma Pro Trial Starting',
          body: "Welcome to Figma Pro! Your 14-day trial starts now and will end on August 6, 2025. After that, you'll be charged $12.00 monthly.",
          from: 'team@figma.com',
          date: '2025-07-23',
        },
      ]

      return this.parser.parseEmails(mockEmails)
    } catch (error) {
      console.error('Error fetching Gmail subscriptions:', error)
      return []
    }
  }
}

// Export singleton instance
export const gmailIntegration = new GmailIntegration()
