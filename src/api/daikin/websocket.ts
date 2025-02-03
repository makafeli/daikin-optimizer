/**
 * WebSocket handler for real-time Daikin device updates
 */
export class DaikinWebSocket {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 5000 // 5 seconds
  private pingInterval = 30000 // 30 seconds
  private pingTimer: number | null = null

  constructor(
    private url: string,
    private onMessage: (data: any) => void,
    private onError: (error: Error) => void
  ) {}

  /**
   * Connect to WebSocket server
   */
  public async connect(): Promise<void> {
    try {
      this.ws = new WebSocket(this.url)
      
      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.reconnectAttempts = 0
        this.startPing()
      }

      this.ws.onclose = () => {
        console.log('WebSocket closed')
        this.cleanup()
        this.scheduleReconnect()
      }

      this.ws.onerror = (event) => {
        console.error('WebSocket error:', event)
        this.onError(new Error('WebSocket connection error'))
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.onMessage(data)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }
    } catch (error) {
      this.onError(error as Error)
      this.scheduleReconnect()
    }
  }

  /**
   * Send data through WebSocket
   */
  public send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket not connected, message not sent')
    }
  }

  /**
   * Close WebSocket connection
   */
  public disconnect(): void {
    this.cleanup()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  private cleanup(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer)
      this.pingTimer = null
    }
  }

  private startPing(): void {
    this.pingTimer = window.setInterval(() => {
      this.send({ type: 'ping' })
    }, this.pingInterval)
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.onError(new Error('Max reconnection attempts reached'))
      return
    }

    this.reconnectAttempts++
    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts})...`)
      this.connect()
    }, this.reconnectDelay * this.reconnectAttempts)
  }
}