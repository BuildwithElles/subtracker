/**
 * Google OAuth and Gmail API Integration
 * Uses the credentials from .env file
 */

export interface GoogleAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scope: string
}

export interface GoogleTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
}

export class GoogleAuthService {
  private config: GoogleAuthConfig

  constructor() {
    this.config = {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
      redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
      scope: 'https://www.googleapis.com/auth/gmail.readonly',
    }

    if (!this.config.clientId || !this.config.clientSecret) {
      console.warn('Google OAuth credentials not found in environment variables')
    }
  }

  /**
   * Generate Google OAuth authorization URL
   */
  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scope,
      access_type: 'offline',
      prompt: 'consent', // Forces refresh token generation
    })

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

    // Debug logging
    console.log('🔧 OAuth Configuration Debug:')
    console.log('Client ID:', this.config.clientId)
    console.log('Redirect URI:', this.config.redirectUri)
    console.log('Generated URL:', authUrl)

    return authUrl
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<GoogleTokenResponse> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          redirect_uri: this.config.redirectUri,
          grant_type: 'authorization_code',
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Token exchange failed: ${error}`)
      }

      const tokenData: GoogleTokenResponse = await response.json()

      if (!tokenData.access_token) {
        throw new Error('No access token received from Google')
      }

      return tokenData
    } catch (error) {
      console.error('Google OAuth token exchange error:', error)
      throw new Error('Failed to authenticate with Google. Please try again.')
    }
  }

  /**
   * Refresh an expired access token
   */
  async refreshToken(refreshToken: string): Promise<GoogleTokenResponse> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          refresh_token: refreshToken,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          grant_type: 'refresh_token',
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Token refresh failed: ${error}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Google token refresh error:', error)
      throw new Error('Failed to refresh Google authentication. Please re-authenticate.')
    }
  }

  /**
   * Validate if access token is still valid
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`
      )
      return response.ok
    } catch (error) {
      console.error('Token validation error:', error)
      return false
    }
  }
}

export const googleAuthService = new GoogleAuthService()
