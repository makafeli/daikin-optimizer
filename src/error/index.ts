/**
 * Composable for error handling
 */
import { ref, computed } from 'vue'
import { ErrorHandler } from './handler'
import type {
  AppError,
  ErrorNotification,
  ErrorState,
  ErrorCode,
  ErrorSeverity,
  ErrorHandlerConfig
} from './types'

// Default error messages
const DEFAULT_MESSAGES: Record<ErrorCode, string> = {
  AUTH_ERROR: 'Authentication failed. Please check your credentials and try again.',
  CONNECTION_ERROR: 'Unable to connect to the server. Please check your internet connection.',
  API_ERROR: 'An error occurred while communicating with the server.',
  SYNC_ERROR: 'Failed to synchronize changes with the server.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  DEVICE_ERROR: 'An error occurred with your device.',
  UNKNOWN_ERROR: 'An unexpected error occurred.'
}

export function useErrorHandler(config?: Partial<ErrorHandlerConfig>) {
  const handler = new ErrorHandler(config)
  const state = ref<ErrorState>(handler.getState())

  // Computed properties
  const currentError = computed(() => state.value.currentError)
  const notifications = computed(() => state.value.notifications)
  const hasUnreadNotifications = computed(() => state.value.hasUnreadNotifications)
  const recentErrors = computed(() => state.value.recentErrors)

  // Methods
  const handleError = async (
    error: Error | string,
    code: ErrorCode = 'UNKNOWN_ERROR',
    severity: ErrorSeverity = 'error',
    retry?: () => Promise<void>
  ) => {
    // Use default message if string is empty
    const message = typeof error === 'string' && !error.trim()
      ? DEFAULT_MESSAGES[code]
      : error

    await handler.handleError(message, code, severity)
    state.value = handler.getState()
  }

  const markNotificationAsRead = (id: string) => {
    handler.markNotificationAsRead(id)
    state.value = handler.getState()
  }

  const dismissNotification = (id: string) => {
    handler.dismissNotification(id)
    state.value = handler.getState()
  }

  const clearNotifications = () => {
    handler.clearNotifications()
    state.value = handler.getState()
  }

  // Event listener setup
  handler.addListener(() => {
    state.value = handler.getState()
  })

  return {
    // State
    currentError,
    notifications,
    hasUnreadNotifications,
    recentErrors,

    // Methods
    handleError,
    markNotificationAsRead,
    dismissNotification,
    clearNotifications
  }
}

// Helper function to wrap async functions with error handling
export function withErrorHandling<T>(
  fn: () => Promise<T>,
  options: {
    code?: ErrorCode
    severity?: ErrorSeverity
    message?: string
  } = {}
): () => Promise<T> {
  return async () => {
    try {
      return await fn()
    } catch (error) {
      const { code = 'UNKNOWN_ERROR', severity = 'error', message } = options
      
      // Re-throw error after handling
      await handler.handleError(
        message || error,
        code,
        severity
      )
      throw error
    }
  }
}