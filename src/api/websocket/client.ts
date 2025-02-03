/**
 * WebSocket client for real-time communication
 */
import { nanoid } from 'nanoid'
import type {
  WebSocketConfig,
  WebSocketMessage,
  WebSocketStatus,
  SubscriptionOptions,
  MessageHandler,
  WebSocketSubscription
} from './types'

export class WebSocketClient {
  private ws: WebSocket | null = null
  private status: WebSocketStatus = {
    connected: false,
    connecting: false
  }
  private subscriptions = new Map<string, WebSocketSubscription>()
  private pingInterval: number
  private reconnectAttempts: number
  private reconnectDelay: number
  private pingTimer: number | null = null
  private reconnectTimer: number | null = null
  private messageQueue: WebSocketMessage[] = []
  private url: string

  constructor(config: WebSocketConfig) {
    this.url = config.url
    this.pingInterval = config.pingInterval || 30000 // 30 seconds
    this.reconnectAttempts = config.reconnectAttempts || 5
    this.reconnectDelay = config.reconnectDelay || 5000 // 5 seconds
  }

  /**
   * Connect to the WebSocket server
   */
  public async connect(): Promise<void> {
    if (this.status.connected || this.status.connecting) return

    this.status.connecting = true
    this.status.error = undefined

    try {
      await this.createConnection()
    } catch (error) {
      this.handleError('CONNECTION_ERROR', error)
      throw error
    }
  }

  /**
   * Subscribe to WebSocket messages
   */
  public subscribe(options: SubscriptionOptions, handler: MessageHandler): string {
    const id = nanoid()
    this.subscriptions.set(id, { id, options, handler })
    return id
  }

  /**
   * Unsubscribe from messages
   */
  public unsubscribe(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId)
  }

  /**
   * Send a message to the server
   */
  public send(message: WebSocketMessage): void {
    if (!this.status.connected) {
      this.messageQueue.push(message)
      return
    }

    this.sendMessage(message)
  }

  /**
   * Get current connection status
   */
  public getStatus(): WebSocketStatus {
    return { ...this.status }
  }

  /**
   * Close the connection
   */
  public disconnect(): void {
    this.cleanup()
  }

  // Private methods
  private async createConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url)

        this.ws.onopen = () => {
          this.handleOpen()
          resolve()
        }

        this.ws.onclose = () => {
          this.handleClose()
        }

        this.ws.onerror = (error) => {
          this.handleError('WEBSOCKET_ERROR', error)
          reject(error)
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  private handleOpen(): void {
    this.status.connected = true
    this.status.connecting = false
    this.status.error = undefined
    this.status.reconnectAttempt = undefined

    // Start ping interval
    this.startPingInterval()

    // Send queued messages
    this.flushMessageQueue()
  }

  private handleClose(): void {
    this.status.connected = false
    this.cleanup()

    // Attempt to reconnect
    if (this.shouldReconnect()) {
      this.scheduleReconnect()
    }
  }

  private handleError(code: string, error: unknown): void {
    this.status.error = `${code}: ${error instanceof Error ? error.message : 'Unknown error'}`
    console.error('WebSocket error:', code, error)
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)
      this.status.lastMessage = Date.now()

      // Notify subscribers
      this.notifySubscribers(message)
    } catch (error) {
      this.handleError('MESSAGE_PARSE_ERROR', error)
    }
  }

  private notifySubscribers(message: WebSocketMessage): void {
    this.subscriptions.forEach(subscription => {
      const { options, handler } = subscription

      // Check if subscriber is interested in this message
      if (this.shouldNotifySubscriber(message, options)) {
        try {
          handler(message)
        } catch (error) {
          console.error('Error in message handler:', error)
        }
      }
    })
  }

  private shouldNotifySubscriber(
    message: WebSocketMessage,
    options: SubscriptionOptions
  ): boolean {
    // Check device ID filter
    if (options.deviceId && message.deviceId !== options.deviceId) {
      return false
    }

    // Check message type filter
    if (options.messageTypes?.length && !options.messageTypes.includes(message.type)) {
      return false
    }

    return true
  }

  private sendMessage(message: WebSocketMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.messageQueue.push(message)
      return
    }

    try {
      this.ws.send(JSON.stringify(message))
    } catch (error) {
      this.handleError('SEND_ERROR', error)
      this.messageQueue.push(message)
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      if (message) {
        this.sendMessage(message)
      }
    }
  }

  private startPingInterval(): void {
    this.stopPingInterval()
    this.pingTimer = window.setInterval(() => {
      this.send({ type: 'ping', data: null, timestamp: Date.now() })
    }, this.pingInterval)
  }

  private stopPingInterval(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer)
      this.pingTimer = null
    }
  }

  private shouldReconnect(): boolean {
    return (
      !this.status.reconnectAttempt ||
      this.status.reconnectAttempt < this.reconnectAttempts
    )
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return

    const attempt = (this.status.reconnectAttempt || 0) + 1
    const delay = this.reconnectDelay * Math.pow(2, attempt - 1) // Exponential backoff

    this.status.reconnectAttempt = attempt
    console.log(`Scheduling reconnect attempt ${attempt} in ${delay}ms`)

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, delay)
  }

  private cleanup(): void {
    this.stopPingInterval()

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.status.connected = false
    this.status.connecting = false
  }
}