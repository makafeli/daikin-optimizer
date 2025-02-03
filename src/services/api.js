// API service for communicating with Daikin Altherma 3 heat pump

// API response status codes
export const ApiStatus = {
  SUCCESS: 'success',
  ERROR: 'error',
  VALIDATION_ERROR: 'validation_error',
  CONNECTION_ERROR: 'connection_error',
  TIMEOUT: 'timeout'
}

// API configuration
const API_CONFIG = {
  baseUrl: 'http://localhost:3000/api',
  timeout: 5000,
  retryAttempts: 3,
  retryDelay: 1000
}

class ApiError extends Error {
  constructor(message, code, details = null) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.details = details
  }
}

export class DaikinApi {
  constructor(config = API_CONFIG) {
    this.config = config
    this.authToken = null
  }

  // Core request handling
  async sendRequest(endpoint, options = {}) {
    const url = this.config.baseUrl + endpoint
    const headers = {
      'Content-Type': 'application/json',
      ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
      ...options.headers
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
        body: options.body ? JSON.stringify(options.body) : undefined
      })

      if (!response.ok) {
        throw new ApiError('API request failed', response.status)
      }

      return await response.json()
    } finally {
      clearTimeout(timeoutId)
    }
  }

  // Authentication
  async authenticate(credentials) {
    try {
      const response = await this.sendRequest('/auth', {
        method: 'POST',
        body: credentials
      })
      
      if (response.token) {
        this.authToken = response.token
        return { status: ApiStatus.SUCCESS, data: response }
      }
      throw new Error('Authentication failed')
    } catch (error) {
      throw new ApiError('Authentication failed', ApiStatus.ERROR, error)
    }
  }

  // Settings Management
  async readSettings() {
    try {
      const response = await this.sendRequest('/settings')
      return { status: ApiStatus.SUCCESS, data: response }
    } catch (error) {
      throw new ApiError('Failed to read settings', ApiStatus.ERROR, error)
    }
  }

  async writeSettings(settings) {
    try {
      const response = await this.sendRequest('/settings', {
        method: 'POST',
        body: settings
      })
      return { status: ApiStatus.SUCCESS, data: response }
    } catch (error) {
      throw new ApiError('Failed to write settings', ApiStatus.ERROR, error)
    }
  }

  // Status and Monitoring
  async getSystemStatus() {
    try {
      const response = await this.sendRequest('/status')
      return { status: ApiStatus.SUCCESS, data: response }
    } catch (error) {
      throw new ApiError('Failed to get system status', ApiStatus.ERROR, error)
    }
  }

  async getPerformanceHistory(params) {
    try {
      const queryString = new URLSearchParams(params).toString()
      const response = await this.sendRequest(`/history?${queryString}`)
      return { status: ApiStatus.SUCCESS, data: response }
    } catch (error) {
      throw new ApiError('Failed to get performance history', ApiStatus.ERROR, error)
    }
  }

  // Error Handling
  async handleApiError(error) {
    console.error('API Error:', error)
    if (error instanceof ApiError) {
      return {
        status: error.code,
        error: error.message,
        details: error.details
      }
    }
    return {
      status: ApiStatus.ERROR,
      error: 'Unknown error occurred',
      details: error.message
    }
  }
}

// Create and export singleton instance
export const daikinApi = new DaikinApi()