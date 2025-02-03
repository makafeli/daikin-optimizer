/**
 * Types for WebSocket connection and events
 */
export interface WebSocketMessage {
  type: string
  data: unknown
  deviceId?: string
  timestamp: number
}

export interface WebSocketConfig {
  url: string
  pingInterval?: number
  reconnectAttempts?: number
  reconnectDelay?: number
}

export interface WebSocketStatus {
  connected: boolean
  connecting: boolean
  error?: string
  lastMessage?: number
  reconnectAttempt?: number
}

export interface SubscriptionOptions {
  deviceId?: string
  messageTypes?: string[]
}

export type MessageHandler = (message: WebSocketMessage) => void

export interface WebSocketSubscription {
  id: string
  options: SubscriptionOptions
  handler: MessageHandler
}

// Detailed message types for specific events
export interface DeviceStatusMessage extends WebSocketMessage {
  type: 'device.status'
  data: {
    mode: string
    power: boolean
    temperature: number
    fanSpeed: number
    humidity?: number
  }
}

export interface SettingUpdateMessage extends WebSocketMessage {
  type: 'setting.update'
  data: {
    code: string
    value: string
    previousValue?: string
    source: 'user' | 'system' | 'schedule'
  }
}

export interface ErrorMessage extends WebSocketMessage {
  type: 'error'
  data: {
    code: string
    message: string
    details?: unknown
  }
}