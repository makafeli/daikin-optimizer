/**
 * Types for Daikin Onecta authentication and configuration
 */
export interface DaikinAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scope: string[]
}

export interface DaikinDeviceCredentials {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  scope: string[]
}

export interface DaikinDeviceInfo {
  id: string
  name: string
  model: string
  firmwareVersion: string
  serialNumber: string
  macAddress: string
  deviceType: string
  owner: string
}

export interface DaikinSetupConfig {
  applicationName: string
  authStrategy: 'Onecta OIDC' // Fixed value
  redirectUrl: string
  description: string
}

export interface DaikinConnectionStatus {
  connected: boolean
  lastConnected?: Date
  error?: string
  deviceCount: number
}

// Events that can be received from the Daikin API
export type DaikinEventType = 
  | 'device.connected'
  | 'device.disconnected'
  | 'device.updated'
  | 'settings.changed'
  | 'error'

export interface DaikinEvent {
  type: DaikinEventType
  deviceId: string
  timestamp: Date
  data: unknown
}

// API Response types
export interface DaikinApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
}