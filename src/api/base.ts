/**
 * Base API client implementation
 */
import axios, { AxiosInstance, AxiosError } from 'axios'
import type { ApiConfig, ApiResponse, ApiError, ApiClient, AuthCredentials, AuthResponse } from './types'

export class BaseApiClient implements ApiClient {
  private client: AxiosInstance
  private config: ApiConfig
  private authToken: string | null = null

  constructor(config: ApiConfig) {
    this.config = {
      timeout: 5000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config,
    }

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
    })

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`
        }
        return config
      },
      (error) => Promise.reject(this.handleError(error))
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        // Handle retry logic
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          this.config.retryAttempts! > 0
        ) {
          originalRequest._retry = true
          try {
            // Implement token refresh logic here
            // await this.refreshToken()
            return this.client(originalRequest)
          } catch (refreshError) {
            return Promise.reject(this.handleError(refreshError))
          }
        }

        return Promise.reject(this.handleError(error))
      }
    )
  }

  private handleError(error: AxiosError): ApiError {
    const apiError: ApiError = new Error(error.message) as ApiError
    apiError.code = error.response?.status?.toString() || 'UNKNOWN'
    apiError.details = error.response?.data

    return apiError
  }

  async initialize(): Promise<void> {
    try {
      await this.client.get('/system/info')
    } catch (error) {
      throw this.handleError(error as AxiosError)
    }
  }

  async authenticate(credentials: AuthCredentials): Promise<AuthResponse> {
    try {
      const response = await this.client.post<ApiResponse<AuthResponse>>('/auth', credentials)
      if (response.data.status === 'success' && response.data.data) {
        this.setAuthToken(response.data.data.token)
        return response.data.data
      }
      throw new Error('Authentication failed')
    } catch (error) {
      throw this.handleError(error as AxiosError)
    }
  }

  setAuthToken(token: string): void {
    this.authToken = token
  }

  clearAuthToken(): void {
    this.authToken = null
  }

  getInstance(): AxiosInstance {
    return this.client
  }

  protected async get<T>(url: string): Promise<T> {
    try {
      const response = await this.client.get<ApiResponse<T>>(url)
      if (response.data.status === 'success' && response.data.data) {
        return response.data.data
      }
      throw new Error('Invalid response')
    } catch (error) {
      throw this.handleError(error as AxiosError)
    }
  }

  protected async post<T>(url: string, data?: unknown): Promise<T> {
    try {
      const response = await this.client.post<ApiResponse<T>>(url, data)
      if (response.data.status === 'success' && response.data.data) {
        return response.data.data
      }
      throw new Error('Invalid response')
    } catch (error) {
      throw this.handleError(error as AxiosError)
    }
  }

  protected async put<T>(url: string, data: unknown): Promise<T> {
    try {
      const response = await this.client.put<ApiResponse<T>>(url, data)
      if (response.data.status === 'success' && response.data.data) {
        return response.data.data
      }
      throw new Error('Invalid response')
    } catch (error) {
      throw this.handleError(error as AxiosError)
    }
  }

  protected async delete<T>(url: string): Promise<T> {
    try {
      const response = await this.client.delete<ApiResponse<T>>(url)
      if (response.data.status === 'success' && response.data.data) {
        return response.data.data
      }
      throw new Error('Invalid response')
    } catch (error) {
      throw this.handleError(error as AxiosError)
    }
  }
}