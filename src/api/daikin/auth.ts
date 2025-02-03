/**
 * Authentication handler for Daikin API
 */
export class DaikinAuth {
  private tokenEndpoint: string
  private clientId: string
  private clientSecret: string
  private refreshToken: string | null = null
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  constructor(
    tokenEndpoint: string,
    clientId: string,
    clientSecret: string
  ) {
    this.tokenEndpoint = tokenEndpoint
    this.clientId = clientId
    this.clientSecret = clientSecret
  }

  /**
   * Get valid access token
   */
  async getAccessToken(): Promise<string> {
    if (this.isTokenValid()) {
      return this.accessToken!
    }

    if (this.refreshToken) {
      return this.refreshAccessToken()
    }

    return this.authenticate()
  }

  /**
   * Initial authentication
   */
  private async authenticate(): Promise<string> {
    const response = await fetch(this.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: 'openid offline_access'
      })
    })

    if (!response.ok) {
      throw new Error('Authentication failed')
    }

    const data = await response.json()
    this.handleTokenResponse(data)
    return this.accessToken!
  }

  /**
   * Refresh access token
   */
  private async refreshAccessToken(): Promise<string> {
    const response = await fetch(this.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken!,
        client_id: this.clientId,
        client_secret: this.clientSecret
      })
    })

    if (!response.ok) {
      // If refresh fails, try full authentication
      this.refreshToken = null
      return this.authenticate()
    }

    const data = await response.json()
    this.handleTokenResponse(data)
    return this.accessToken!
  }

  /**
   * Handle token response and storage
   */
  private handleTokenResponse(data: any): void {
    this.accessToken = data.access_token
    this.refreshToken = data.refresh_token
    this.tokenExpiry = Date.now() + (data.expires_in * 1000)

    // Store tokens securely
    this.storeTokens()
  }

  /**
   * Check if current token is valid
   */
  private isTokenValid(): boolean {
    return !!(
      this.accessToken &&
      this.tokenExpiry > Date.now() + 60000 // Add 1 minute buffer
    )
  }

  /**
   * Store tokens securely
   */
  private storeTokens(): void {
    // In a real app, use a secure storage solution
    localStorage.setItem('daikin_access_token', this.accessToken!)
    localStorage.setItem('daikin_refresh_token', this.refreshToken!)
    localStorage.setItem('daikin_token_expiry', this.tokenExpiry.toString())
  }

  /**
   * Load stored tokens
   */
  loadStoredTokens(): void {
    this.accessToken = localStorage.getItem('daikin_access_token')
    this.refreshToken = localStorage.getItem('daikin_refresh_token')
    const expiry = localStorage.getItem('daikin_token_expiry')
    this.tokenExpiry = expiry ? parseInt(expiry) : 0
  }

  /**
   * Clear stored tokens
   */
  clearTokens(): void {
    this.accessToken = null
    this.refreshToken = null
    this.tokenExpiry = 0
    localStorage.removeItem('daikin_access_token')
    localStorage.removeItem('daikin_refresh_token')
    localStorage.removeItem('daikin_token_expiry')
  }
}