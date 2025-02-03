/**
 * Daikin cloud API client
 */
import type {
  DaikinAuthConfig,
  DaikinDeviceCredentials,
  DaikinDeviceInfo,
  DaikinEvent,
  DaikinApiResponse
} from './types'

export class DaikinCloudApi {
  private static readonly BASE_URL = 'https://api.prod.onecta.daikin.eu'
  private static readonly TOKEN_URL = 'https://cognito-idp.eu-west-1.amazonaws.com'

  private config: DaikinAuthConfig
  private credentials: DaikinDeviceCredentials | null = null
  private ws: WebSocket | null = null
  private eventHandlers: Map<string, ((event: DaikinEvent) => void)[]> = new Map()
  private reconnectAttempts = 0
  private readonly MAX_RECONNECT_ATTEMPTS = 5

  constructor(config: DaikinAuthConfig) {
    this.config = config
  }

  /**
   * Initialize the API connection
   */
  async initialize(): Promise<void> {
    try {        
      await this.authenticate()
      await this.connectWebSocket()
    } catch (error) {
      throw new Error(`Failed to initialize Daikin API: ${error}`)
    }
  }

  /**
   * Authenticate with the Daikin cloud
   */
  private async authenticate(): Promise<void> {
    try {
      const response = await fetch(`${DaikinCloudApi.TOKEN_URL}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          scope: this.config.scope.join(' ')
        })
      })

      if (!response.ok) {
        throw new Error('Authentication failed')
      }

      this.credentials = await response.json()
    } catch (error) {
      throw new Error(`Authentication error: ${error}`)
    }
  }

  /**
   * Set up WebSocket connection for real-time updates
   */
  private async connectWebSocket(): Promise<void> {
    if (!this.credentials) {
      throw new Error('Not authenticated')
    }

    try {
      this.ws = new WebSocket(`${DaikinCloudApi.BASE_URL}/v1/ws`)
      
      this.ws.onopen = () => {
        this.reconnectAttempts = 0
        this.sendAuthentication()
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleWebSocketMessage(data)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.ws.onclose = () => {
        this.handleWebSocketClose()
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.handleWebSocketClose()
      }
    } catch (error) {
      throw new Error(`WebSocket connection failed: ${error}`)
    }
  }

  /**
   * Send authentication message over WebSocket
   */
  private sendAuthentication(): void {
    if (!this.ws || !this.credentials) return

    this.ws.send(JSON.stringify({
      type: 'authenticate',
      token: this.credentials.accessToken
    }))
  }

  /**
   * Handle WebSocket messages
   */
  private handleWebSocketMessage(data: any): void {
    if (data.type === 'error') {
      console.error('WebSocket error:', data.error)
      return
    }

    const event: DaikinEvent = {
      type: data.type,
      deviceId: data.deviceId,
      timestamp: new Date(data.timestamp),
      data: data.data
    }

    // Notify event listeners
    const handlers = this.eventHandlers.get(event.type) || []
    handlers.forEach(handler => handler(event))
  }

  /**
   * Handle WebSocket connection close
   */
  private async handleWebSocketClose(): Promise<void> {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)
    await new Promise(resolve => setTimeout(resolve, delay))
    
    this.connectWebSocket()
  }

  /**
   * Register event handler
   */
  on(eventType: DaikinEvent['type'], handler: (event: DaikinEvent) => void): void {
    const handlers = this.eventHandlers.get(eventType) || []
    handlers.push(handler)
    this.eventHandlers.set(eventType, handlers)
  }

  /**
   * Remove event handler
   */
  off(eventType: DaikinEvent['type'], handler: (event: DaikinEvent) => void): void {
    const handlers = this.eventHandlers.get(eventType) || []
    const index = handlers.indexOf(handler)
    if (index !== -1) {
      handlers.splice(index, 1)
      this.eventHandlers.set(eventType, handlers)
    }
  }

  /**
   * Get list of available devices
   */
  async getDevices(): Promise<DaikinDeviceInfo[]> {
    return this.request<DaikinDeviceInfo[]>('/v1/devices')
  }

  /**
   * Get device information
   */
  async getDevice(deviceId: string): Promise<DaikinDeviceInfo> {
    return this.request<DaikinDeviceInfo>(`/v1/devices/${deviceId}`)
  }

  /**
   * Get device settings
   */
  async getDeviceSettings(deviceId: string): Promise<Record<string, string>> {
    return this.request<Record<string, string>>(`/v1/devices/${deviceId}/settings`)
  }

  /**
   * Update device settings
   */
  async updateDeviceSettings(
    deviceId: string,
    settings: Record<string, string>
  ): Promise<void> {
    await this.request(
      `/v1/devices/${deviceId}/settings`,
      'PUT',
      settings
    )
  }

  /**
   * Generic request method
   */
  private async request<T>(
    endpoint: string,
    method: string = 'GET',
    body?: unknown
  ): Promise<T> {
    if (!this.credentials) {
      throw new Error('Not authenticated')
    }

    try {
      const response = await fetch(`${DaikinCloudApi.BASE_URL}${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${this.credentials.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
      })

      if (!response.ok) {
        throw new Error(`Request failed: ${response.statusText}`)
      }

      const data: DaikinApiResponse<T> = await response.json()
      
      if (!data.success) {
        throw new Error(data.error?.message || 'Request failed')
      }

      return data.data as T
    } catch (error) {
      throw new Error(`API request failed: ${error}`)
    }
  }

  /**
   * Close the connection
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.credentials = null
  }
}