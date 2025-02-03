/**
 * API handlers for Daikin device control
 */
import type { DeviceState, ControlCommand, DeviceCapabilities } from './deviceTypes'
import { DaikinStateManager } from './state'

export class DaikinApiHandler {
  private stateManager: DaikinStateManager
  private apiEndpoint: string
  private websocketEndpoint: string

  constructor(
    apiEndpoint: string,
    websocketEndpoint: string,
    stateManager: DaikinStateManager
  ) {
    this.apiEndpoint = apiEndpoint
    this.websocketEndpoint = websocketEndpoint
    this.stateManager = stateManager
  }

  /**
   * Get device state
   */
  async getDeviceState(deviceId: string): Promise<DeviceState> {
    const response = await fetch(`${this.apiEndpoint}/devices/${deviceId}/state`, {
      headers: this.getHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to get device state: ${response.statusText}`)
    }

    const state = await response.json()
    await this.stateManager.updateState(deviceId, state)
    return state
  }

  /**
   * Send control command to device
   */
  async controlDevice(deviceId: string, command: ControlCommand): Promise<void> {
    await this.stateManager.queueControl(deviceId, command)
  }

  /**
   * Get device capabilities
   */
  async getDeviceCapabilities(deviceId: string): Promise<DeviceCapabilities> {
    const response = await fetch(`${this.apiEndpoint}/devices/${deviceId}/capabilities`, {
      headers: this.getHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to get device capabilities: ${response.statusText}`)
    }

    return await response.json()
  }

  private getHeaders(): HeadersInit {
    // Add auth headers and other required headers
    return {
      'Authorization': `Bearer ${this.getAccessToken()}`,
      'Content-Type': 'application/json'
    }
  }

  private getAccessToken(): string {
    // Get token from secure storage
    return localStorage.getItem('daikin_access_token') || ''
  }
}