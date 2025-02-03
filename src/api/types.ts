/**
 * API client configuration and types
 */
import type { AxiosInstance, AxiosRequestConfig } from 'axios'

export interface ApiConfig {
  baseURL: string
  timeout?: number
  retryAttempts?: number
  retryDelay?: number
}

export interface ApiResponse<T> {
  status: 'success' | 'error'
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
}

export interface ApiError extends Error {
  code: string
  details?: unknown
}

export interface AuthCredentials {
  username: string
  password: string
}

export interface AuthResponse {
  token: string
  refreshToken: string
  expiresIn: number
}

export interface ApiClient {
  initialize(): Promise<void>
  authenticate(credentials: AuthCredentials): Promise<AuthResponse>
  setAuthToken(token: string): void
  clearAuthToken(): void
  getInstance(): AxiosInstance
}