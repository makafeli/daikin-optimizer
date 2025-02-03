/**
 * Error handling for Daikin API
 */

export enum DaikinErrorCode {
  AUTH_FAILED = 'AUTH_FAILED',
  CONNECTION_LOST = 'CONNECTION_LOST',
  DEVICE_OFFLINE = 'DEVICE_OFFLINE',
  INVALID_COMMAND = 'INVALID_COMMAND',
  RATE_LIMIT = 'RATE_LIMIT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN'
}

export class DaikinError extends Error {
  constructor(
    public code: DaikinErrorCode,
    message: string,
    public retryable: boolean = false,
    public deviceId?: string
  ) {
    super(message)
    this.name = 'DaikinError'
  }
}

export class DaikinErrorHandler {
  private errorListeners: ((error: DaikinError) => void)[] = []

  /**
   * Handle API errors
   */
  handleApiError(error: unknown, deviceId?: string): DaikinError {
    if (error instanceof DaikinError) {
      return error
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('network')) {
      return this.createError(
        DaikinErrorCode.NETWORK_ERROR,
        'Network connection failed',
        true,
        deviceId
      )
    }

    // Handle API response errors
    if (error instanceof Response) {
      switch (error.status) {
        case 401:
          return this.createError(
            DaikinErrorCode.AUTH_FAILED,
            'Authentication failed',
            true
          )
        case 429:
          return this.createError(
            DaikinErrorCode.RATE_LIMIT,
            'Rate limit exceeded',
            true
          )
        default:
          return this.createError(
            DaikinErrorCode.UNKNOWN,
            `API error: ${error.statusText}`,
            false
          )
      }
    }

    // Default error
    return this.createError(
      DaikinErrorCode.UNKNOWN,
      'An unknown error occurred',
      false,
      deviceId
    )
  }

  /**
   * Create and notify error
   */
  private createError(
    code: DaikinErrorCode,
    message: string,
    retryable: boolean,
    deviceId?: string
  ): DaikinError {
    const error = new DaikinError(code, message, retryable, deviceId)
    this.notifyError(error)
    return error
  }

  /**
   * Add error listener
   */
  addErrorListener(listener: (error: DaikinError) => void): void {
    this.errorListeners.push(listener)
  }

  /**
   * Remove error listener
   */
  removeErrorListener(listener: (error: DaikinError) => void): void {
    const index = this.errorListeners.indexOf(listener)
    if (index !== -1) {
      this.errorListeners.splice(index, 1)
    }
  }

  /**
   * Notify all error listeners
   */
  private notifyError(error: DaikinError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error)
      } catch (err) {
        console.error('Error in error listener:', err)
      }
    })
  }
}