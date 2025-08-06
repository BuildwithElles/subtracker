/**
 * Enhanced Gmail Integration with Real API Calls
 * Uses the credentials from .env file and Google OAuth
 */

import { GmailSubscriptionParser, ParsedTrialEmail, EmailMessage } from './gmailParser'
import { googleAuthService } from './googleAuth'

// Gmail API types
interface GmailApiResponse {
  messages?: Array<{ id: string; threadId: string }>
  nextPageToken?: string
}

interface GmailPayload {
  body?: {
    data?: string
    size?: number
  }
  parts?: GmailPayload[]
  mimeType?: string
  headers?: Array<{
    name: string
    value: string
  }>
}

interface GmailMessage {
  id: string
  threadId: string
  payload: GmailPayload
  snippet?: string
}

export class RealGmailIntegration {
  private parser = new GmailSubscriptionParser()
  private baseUrl = 'https://gmail.googleapis.com/gmail/v1'

  /**
   * Fetch subscription emails using Gmail API with real authentication
   */
  async fetchAndParseSubscriptions(accessToken: string): Promise<ParsedTrialEmail[]> {
    try {
      console.log('🔍 Scanning Gmail for subscription emails...')

      // Validate token first
      const isValid = await googleAuthService.validateToken(accessToken)
      if (!isValid) {
        throw new Error('Gmail access token is invalid or expired')
      }

      // Comprehensive search queries for subscription-related emails
      const searchQueries = [
        // Trial-specific searches
        'subject:(trial OR "free trial" OR "trial period") -from:me',
        'body:("trial expires" OR "trial ending" OR "trial will end") -from:me',

        // Subscription billing searches
        'subject:(subscription OR billing OR invoice OR receipt) -from:me',
        'body:("subscription" OR "auto-renewal" OR "recurring") -from:me',

        // Service-specific searches
        'from:(netflix.com OR spotify.com OR adobe.com OR notion.so OR figma.com) (trial OR subscription OR billing)',
        'from:(github.com OR openai.com OR slack.com OR zoom.us OR dropbox.com) (trial OR subscription OR billing)',

        // Payment-related searches
        'subject:("payment confirmation" OR "payment received" OR "your payment") -from:me',
        'subject:("monthly charge" OR "annual charge" OR "subscription renewal") -from:me',

        // Common subscription domains
        'from:(noreply@ OR no-reply@ OR billing@ OR support@) (subscription OR trial OR billing)',

        // Service categories
        'from:(*adobe* OR *microsoft* OR *google* OR *apple*) (subscription OR renewal)',
        'from:(*netflix* OR *spotify* OR *hulu* OR *disney*) (billing OR subscription)',
      ]

      const allEmails: EmailMessage[] = []
      const processedIds = new Set<string>()

      for (const query of searchQueries) {
        try {
          // Use debug logging only in development
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔎 Searching: "${query.substring(0, 50)}..."`)
          }

          const searchUrl = `${this.baseUrl}/users/me/messages?q=${encodeURIComponent(query)}&maxResults=20`

          const searchResponse = await fetch(searchUrl, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json',
            },
          })

          if (!searchResponse.ok) {
            if (searchResponse.status === 401) {
              throw new Error('Gmail authentication expired. Please reconnect your Gmail account.')
            }
            console.warn(`Search failed for query: ${searchResponse.statusText}`)
            continue
          }

          const searchData: GmailApiResponse = await searchResponse.json()

          if (searchData.messages) {
            if (process.env.NODE_ENV === 'development') {
              console.log(`📧 Found ${searchData.messages.length} emails for this query`)
            }

            // Fetch email details for each message (avoid duplicates)
            for (const message of searchData.messages) {
              if (processedIds.has(message.id)) {
                continue // Skip if already processed
              }

              try {
                const emailData = await this.fetchEmailDetails(message.id, accessToken)
                if (emailData) {
                  allEmails.push(emailData)
                  processedIds.add(message.id)
                }
              } catch (err) {
                console.warn(`Failed to fetch email ${message.id}:`, err)
                continue
              }
            }
          }
        } catch (err) {
          console.warn(`Query failed:`, err)
          continue
        }
      }

      console.log(`📧 Total unique emails found: ${allEmails.length}`)

      // Parse for subscription information
      const subscriptions = this.parser.parseEmails(allEmails)
      console.log(`✅ Successfully parsed ${subscriptions.length} subscriptions`)

      // Log found subscriptions for debugging (only in development)
      if (process.env.NODE_ENV === 'development') {
        subscriptions.forEach((sub, index) => {
          console.log(
            `${index + 1}. ${sub.serviceName} - ${sub.amount ? `${sub.currency}${sub.amount}` : 'No price'} (${sub.status})`
          )
        })
      }

      return subscriptions
    } catch (error) {
      console.error('Gmail API error:', error)

      if (error instanceof Error) {
        if (error.message.includes('expired') || error.message.includes('invalid')) {
          throw new Error('Gmail access has expired. Please reconnect your Gmail account.')
        }
        throw error
      }

      throw new Error('Failed to access Gmail. Please check your connection and try again.')
    }
  }

  /**
   * Fetch detailed email content
   */
  private async fetchEmailDetails(
    messageId: string,
    accessToken: string
  ): Promise<EmailMessage | null> {
    try {
      const url = `${this.baseUrl}/users/me/messages/${messageId}?format=full`

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        return null
      }

      const message: GmailMessage = await response.json()
      return this.parseGmailMessage(message)
    } catch (err) {
      console.warn(`Failed to fetch message ${messageId}:`, err)
      return null
    }
  }

  /**
   * Parse Gmail API message to our EmailMessage format
   */
  private parseGmailMessage(gmailMessage: GmailMessage): EmailMessage | null {
    try {
      const headers = gmailMessage.payload.headers || []
      const subject = headers.find(h => h.name === 'Subject')?.value || ''
      const from = headers.find(h => h.name === 'From')?.value || ''
      const date = headers.find(h => h.name === 'Date')?.value || ''

      // Extract email body
      const body = this.extractEmailBody(gmailMessage.payload)

      if (!subject && !body) {
        return null
      }

      return {
        id: gmailMessage.id,
        subject,
        body,
        from,
        date: new Date(date).toISOString().split('T')[0],
      }
    } catch (err) {
      console.warn('Failed to parse Gmail message:', err)
      return null
    }
  }

  /**
   * Extract email body from Gmail payload
   */
  private extractEmailBody(payload: GmailPayload): string {
    let body = ''

    if (payload.body?.data) {
      // Direct body content
      body = this.decodeBase64(payload.body.data)
    } else if (payload.parts) {
      // Multipart email - look for text content
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          body += this.decodeBase64(part.body.data)
        } else if (part.mimeType === 'text/html' && part.body?.data && !body) {
          // Use HTML as fallback
          const htmlBody = this.decodeBase64(part.body.data)
          body = this.stripHtml(htmlBody)
        }
      }
    }

    return body.trim()
  }

  /**
   * Decode base64url encoded content from Gmail API
   */
  private decodeBase64(data: string): string {
    try {
      // Gmail uses base64url encoding (- and _ instead of + and /)
      const base64 = data.replace(/-/g, '+').replace(/_/g, '/')
      return atob(base64)
    } catch (err) {
      console.warn('Failed to decode base64 data:', err)
      return ''
    }
  }

  /**
   * Remove HTML tags from email content
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }
}

// Export the real Gmail integration
export const fetchGmailIntegration = new RealGmailIntegration()
