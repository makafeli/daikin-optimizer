/**
 * Real-time state management for Daikin devices
 */
import type { 
  DeviceState, 
  StateUpdate, 
  DeviceControl, 
  DeviceEvent,
  ControlCommand
} from './types'

export class DaikinStateManager {
  private deviceStates: Map<string, DeviceState> = new Map()
  private controlQueue: Map<string, ControlCommand[]> = new Map()
  private updateCallbacks: ((update: StateUpdate) => void)[] = []
  private errorCallbacks: ((error: Error) => void)[] = []
  private retryDelays = [1000, 2000, 5000, 10000] // Exponential backoff

  /**
   * Update device state and notify subscribers
   */
  async updateState(deviceId: string, update: Partial<DeviceState>): Promise<void> {
    try {
      const currentState = this.deviceStates.get(deviceId) || {}
      const newState = { ...currentState, ...update }
      this.deviceStates.set(deviceId, newState)

      // Notify subscribers
      this.notifyUpdate({
        deviceId,
        type: 'state',
        data: newState,
        timestamp: Date.now()
      })

      // Process any queued controls
      await this.processControlQueue(deviceId)
    } catch (error) {
      this.handleError(error as Error)
    }
  }

  /**
   * Queue control command for a device
   */
  async queueControl(deviceId: string, command: ControlCommand): Promise<void> {
    if (!this.controlQueue.has(deviceId)) {
      this.controlQueue.set(deviceId, [])
    }
    
    this.controlQueue.get(deviceId)?.push(command)
    await this.processControlQueue(deviceId)
  }

  /**
   * Process queued control commands
   */
  private async processControlQueue(deviceId: string): Promise<void> {
    const queue = this.controlQueue.get(deviceId)
    if (!queue?.length) return

    const currentState = this.deviceStates.get(deviceId)
    if (!currentState) {
      console.warn(`No state found for device ${deviceId}`)
      return
    }

    while (queue.length > 0) {
      const command = queue[0]
      
      try {
        await this.executeControl(deviceId, command)
        queue.shift() // Remove processed command
      } catch (error) {
        const retryCount = command.retryCount || 0
        if (retryCount < this.retryDelays.length) {
          // Schedule retry with exponential backoff
          command.retryCount = retryCount + 1
          setTimeout(() => {
            this.processControlQueue(deviceId)
          }, this.retryDelays[retryCount])
          break // Stop processing queue
        } else {
          // Command failed after all retries
          queue.shift()
          this.handleError(error as Error)
        }
      }
    }
  }

  /**
   * Execute a control command on a device
   */
  private async executeControl(deviceId: string, command: ControlCommand): Promise<void> {
    const state = this.deviceStates.get(deviceId)
    if (!state) throw new Error(`No state found for device ${deviceId}`)

    // Validate command
    this.validateCommand(command, state)

    // Execute command
    const update = await this.sendControlCommand(deviceId, command)
    
    // Update state
    await this.updateState(deviceId, update)

    // Notify of successful control
    this.notifyUpdate({
      deviceId,
      type: 'control',
      data: command,
      timestamp: Date.now()
    })
  }

  /**
   * Validate control command against device state
   */
  private validateCommand(command: ControlCommand, state: DeviceState): void {
    switch (command.type) {
      case 'temperature':
        if (command.value < state.minTemp || command.value > state.maxTemp) {
          throw new Error(`Temperature ${command.value} out of range (${state.minTemp}-${state.maxTemp})`)
        }
        break
      case 'mode':
        if (!state.supportedModes.includes(command.value)) {
          throw new Error(`Mode ${command.value} not supported`)
        }
        break
      case 'fanSpeed':
        if (!state.supportedFanSpeeds.includes(command.value)) {
          throw new Error(`Fan speed ${command.value} not supported`)
        }
        break
    }
  }

  /**
   * Send control command to device
   */
  private async sendControlCommand(deviceId: string, command: ControlCommand): Promise<Partial<DeviceState>> {
    // Implementation will depend on the actual API
    // This is a placeholder that returns the expected state change
    switch (command.type) {
      case 'temperature':
        return { targetTemperature: command.value }
      case 'mode':
        return { mode: command.value }
      case 'fanSpeed':
        return { fanSpeed: command.value }
      case 'power':
        return { power: command.value }
      default:
        throw new Error(`Unknown command type: ${command.type}`)
    }
  }

  /**
   * Subscribe to state updates
   */
  onUpdate(callback: (update: StateUpdate) => void): void {
    this.updateCallbacks.push(callback)
  }

  /**
   * Subscribe to errors
   */
  onError(callback: (error: Error) => void): void {
    this.errorCallbacks.push(callback)
  }

  /**
   * Notify subscribers of updates
   */
  private notifyUpdate(update: StateUpdate): void {
    this.updateCallbacks.forEach(callback => {
      try {
        callback(update)
      } catch (error) {
        console.error('Error in update callback:', error)
      }
    })
  }

  /**
   * Handle and notify errors
   */
  private handleError(error: Error): void {
    console.error('Device control error:', error)
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error)
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError)
      }
    })
  }

  /**
   * Get current state for a device
   */
  getState(deviceId: string): DeviceState | undefined {
    return this.deviceStates.get(deviceId)
  }

  /**
   * Get states for all devices
   */
  getAllStates(): Map<string, DeviceState> {
    return new Map(this.deviceStates)
  }

  /**
   * Clear state and queues for a device
   */
  clearDevice(deviceId: string): void {
    this.deviceStates.delete(deviceId)
    this.controlQueue.delete(deviceId)
  }

  /**
   * Clear all state and queues
   */
  clearAll(): void {
    this.deviceStates.clear()
    this.controlQueue.clear()
  }
}