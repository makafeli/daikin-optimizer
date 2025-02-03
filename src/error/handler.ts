/**
 * Error handler for managing application errors
 */
import { nanoid } from 'nanoid'
import type {
  AppError,
  ErrorNotification,
  ErrorHandlerConfig,
  ErrorState,
  ErrorCode,
  ErrorSeverity
} from './types'

const DEFAULT_CONFIG: ErrorHandlerConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  notificationDuration: 5000,
  logErrors: true,
  reportErrors: true
}

export class ErrorHandler {
  private config: ErrorHandlerConfig
  private state: ErrorState = {
    recentErrors: [],
    notifications: [],
    hasUnreadNotifications: false
  }
  private listeners: Set<(error: AppError) => void> = new Set()

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Handle an error
   */
  public async handleError(
    error: Error | string,
    code: ErrorCode = 'UNKNOWN_ERROR',
    severity: ErrorSeverity = 'error'
  ): Promise<void> {
    const appError = this.createAppError(error, code, severity)
    
    // Log error if configured
    if (this.config.logErrors) {
      this.logError(appError)
    }

    // Report error if configured
    if (this.config.reportErrors) {
      await this.reportError(appError)
    }

    // Update state
    this.updateState(appError)

    // Create notification
    this.createNotification(appError)

    // Notify listeners
    this.notifyListeners(appError)

    // Handle based on severity
    await this.handleBySeverity(appError)
  }

  /**
   * Add error listener
   */
  public addListener(listener: (error: AppError) => void): void {
    this.listeners.add(listener)
  }

  /**
   * Remove error listener
   */
  public removeListener(listener: (error: AppError) => void): void {
    this.listeners.delete(listener)
  }

  /**
   * Get current error state
   */
  public getState(): ErrorState {
    return { ...this.state }
  }

  /**
   * Clear all notifications
   */
  public clearNotifications(): void {
    this.state.notifications = []
    this.state.hasUnreadNotifications = false
  }

  /**
   * Mark notification as read
   */
  public markNotificationAsRead(id: string): void {
    const notification = this.state.notifications.find(n => n.id === id)
    if (notification) {
      notification.read = true
      this.updateUnreadStatus()
    }
  }

  /**
   * Dismiss notification
   */
  public dismissNotification(id: string): void {
    const index = this.state.notifications.findIndex(n => n.id === id)
    if (index !== -1) {
      this.state.notifications[index].dismissed = true
      setTimeout(() => {
        this.state.notifications = this.state.notifications.filter(
          n => n.id !== id
        )
        this.updateUnreadStatus()
      }, 300) // Allow for animation
    }
  }

  // Private methods
  private createAppError(
    error: Error | string,
    code: ErrorCode,
    severity: ErrorSeverity
  ): AppError {
    return {
      code,
      message: error instanceof Error ? error.message : error,
      severity,
      timestamp: Date.now(),
      details: error instanceof Error ? error : undefined,
      handled: false
    }
  }

  private logError(error: AppError): void {
    const { code, message, severity, timestamp, details } = error
    console.error(
      `[${new Date(timestamp).toISOString()}] ${severity.toUpperCase()}: ${code}`,
      message,
      details
    )
  }

  private async reportError(error: AppError): Promise<void> {
    // Here you would typically send the error to an error reporting service
    // like Sentry, LogRocket, etc.
    console.log('Error reported:', error)
  }

  private updateState(error: AppError): void {
    this.state.currentError = error
    this.state.recentErrors = [
      error,
      ...this.state.recentErrors
    ].slice(0, 10) // Keep last 10 errors
  }

  private createNotification(error: AppError): void {
    const notification: ErrorNotification = {
      ...error,
      id: nanoid(),
      read: false
    }

    this.state.notifications.unshift(notification)
    this.state.hasUnreadNotifications = true

    // Auto-dismiss non-critical notifications
    if (error.severity !== 'critical') {
      setTimeout(() => {
        this.dismissNotification(notification.id)
      }, this.config.notificationDuration)
    }
  }

  private notifyListeners(error: AppError): void {
    this.listeners.forEach(listener => {
      try {
        listener(error)
      } catch (err) {
        console.error('Error in error listener:', err)
      }
    })
  }

  private async handleBySeverity(error: AppError): Promise<void> {
    switch (error.severity) {
      case 'critical':
        // For critical errors, we might want to:
        // - Save application state
        // - Show a full-screen error message
        // - Prevent further interactions
        break

      case 'error':
        // For regular errors, we might want to:
        // - Attempt retry if possible
        // - Show error notification
        if (error.retry) {
          await this.attemptRetry(error)
        }
        break

      case 'warning':
        // For warnings, we might want to:
        // - Show warning notification
        // - Log for monitoring
        break

      case 'info':
        // For info messages, we might want to:
        // - Show temporary notification
        break
    }
  }

  private async attemptRetry(
    error: AppError,
    attempt = 1
  ): Promise<void> {
    if (!error.retry || attempt > this.config.maxRetries) {
      return
    }

    try {
      await error.retry()
      error.handled = true
    } catch (retryError) {
      // Exponential backoff
      const delay = this.config.retryDelay * Math.pow(2, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, delay))
      await this.attemptRetry(error, attempt + 1)
    }
  }

  private updateUnreadStatus(): void {
    this.state.hasUnreadNotifications = this.state.notifications.some(
      n => !n.read && !n.dismissed
    )
  }
}