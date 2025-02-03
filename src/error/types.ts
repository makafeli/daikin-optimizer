/**
 * Types for error handling system
 */
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical'

export type ErrorCode = 
  | 'AUTH_ERROR'
  | 'CONNECTION_ERROR'
  | 'API_ERROR'
  | 'SYNC_ERROR'
  | 'VALIDATION_ERROR'
  | 'DEVICE_ERROR'
  | 'UNKNOWN_ERROR'

export interface AppError {
  code: ErrorCode
  message: string
  severity: ErrorSeverity
  timestamp: number
  details?: unknown
  handled?: boolean
  retry?: () => Promise<void>
}

export interface ErrorNotification extends AppError {
  id: string
  read: boolean
  dismissed?: boolean
}

export interface ErrorHandlerConfig {
  maxRetries: number
  retryDelay: number
  notificationDuration: number
  logErrors: boolean
  reportErrors: boolean
}

export interface ErrorState {
  currentError?: AppError
  recentErrors: AppError[]
  notifications: ErrorNotification[]
  hasUnreadNotifications: boolean
}