/**
 * Types for Daikin device state and control
 */

export type DeviceMode = 'auto' | 'heat' | 'cool' | 'fan' | 'dry'
export type FanSpeed = 'auto' | 'low' | 'medium' | 'high'
export type PowerState = 'on' | 'off' | 'standby'

export interface DeviceState {
  id: string
  connected: boolean
  power: PowerState
  mode: DeviceMode
  currentTemperature: number
  targetTemperature: number
  fanSpeed: FanSpeed
  humidity?: number
  minTemp: number
  maxTemp: number
  supportedModes: DeviceMode[]
  supportedFanSpeeds: FanSpeed[]
  lastUpdated: number
}

export interface ControlCommand {
  type: 'temperature' | 'mode' | 'fanSpeed' | 'power'
  value: string | number | boolean
  retryCount?: number
}

export interface StateUpdate {
  deviceId: string
  type: 'state' | 'control' | 'error'
  data: any
  timestamp: number
}

export interface DeviceError {
  code: string
  message: string
  deviceId: string
  timestamp: number
  recoverable: boolean
}

export interface DeviceCapabilities {
  hasHumidity: boolean
  hasFanControl: boolean
  minSetPoint: number
  maxSetPoint: number
  temperatureStep: number
  supportedModes: DeviceMode[]
  supportedFanSpeeds: FanSpeed[]
}