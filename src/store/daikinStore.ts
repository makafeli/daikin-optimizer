/**
 * Daikin store for managing authentication and devices
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import { DaikinCloudApi } from '@/api/daikin/client'
import type {
  DaikinAuthConfig,
  DaikinDeviceCredentials,
  DaikinDeviceInfo,
  DaikinConnectionStatus
} from '@/api/daikin/types'

export const useDaikinStore = defineStore('daikin', () => {
  // State
  const config = ref<DaikinAuthConfig | null>(null)
  const credentials = ref<DaikinDeviceCredentials | null>(null)
  const devices = ref<DaikinDeviceInfo[]>([])
  const selectedDeviceId = ref<string | null>(null)
  const connectionStatus = ref<DaikinConnectionStatus>({
    connected: false,
    deviceCount: 0
  })
  const api: Ref<DaikinCloudApi | null> = ref(null)

  // Computed
  const isAuthenticated = computed(() => !!credentials.value)
  const selectedDevice = computed(() => 
    devices.value.find(d => d.id === selectedDeviceId.value)
  )
  const isConnected = computed(() => connectionStatus.value.connected)

  // Actions
  const initialize = async (authConfig: DaikinAuthConfig) => {
    config.value = authConfig
    api.value = new DaikinCloudApi(authConfig)
    
    try {
      await api.value.initialize()
      updateConnectionStatus(true)
    } catch (error) {
      handleConnectionError(error)
      throw error
    }
  }

  const getAuthUrl = () => {
    if (!config.value) throw new Error('Not configured')
    
    const params = new URLSearchParams({
      client_id: config.value.clientId,
      redirect_uri: config.value.redirectUri,
      response_type: 'code',
      scope: config.value.scope.join(' '),
      state: generateState()
    })

    return `https://api.prod.onecta.daikin.eu/oauth2/authorize?${params}`
  }

  const completeAuthentication = async (code: string, state: string) => {
    if (!api.value) throw new Error('API not initialized')
    
    // Verify state
    verifyState(state)

    try {
      const authResponse = await api.value.authenticate(code)
      credentials.value = authResponse
      
      // Load initial devices
      await loadDevices()
    } catch (error) {
      handleAuthError(error)
      throw error
    }
  }

  const loadDevices = async () => {
    if (!api.value) throw new Error('API not initialized')
    
    try {
      const deviceList = await api.value.getDevices()
      devices.value = deviceList
      connectionStatus.value.deviceCount = deviceList.length
      
      // Auto-select first device if none selected
      if (!selectedDeviceId.value && deviceList.length > 0) {
        selectedDeviceId.value = deviceList[0].id
      }
    } catch (error) {
      console.error('Failed to load devices:', error)
      throw error
    }
  }

  const selectDevice = (deviceId: string) => {
    const device = devices.value.find(d => d.id === deviceId)
    if (!device) throw new Error('Device not found')
    selectedDeviceId.value = deviceId
  }

  const refreshDeviceInfo = async (deviceId: string) => {
    if (!api.value) throw new Error('API not initialized')
    
    try {
      const deviceInfo = await api.value.getDevice(deviceId)
      const index = devices.value.findIndex(d => d.id === deviceId)
      if (index !== -1) {
        devices.value[index] = deviceInfo
      }
    } catch (error) {
      console.error('Failed to refresh device info:', error)
      throw error
    }
  }

  const updateConnectionStatus = (connected: boolean, error?: string) => {
    connectionStatus.value = {
      ...connectionStatus.value,
      connected,
      lastConnected: connected ? new Date() : connectionStatus.value.lastConnected,
      error: error
    }
  }

  const handleConnectionError = (error: unknown) => {
    const message = error instanceof Error ? error.message : 'Connection failed'
    updateConnectionStatus(false, message)
  }

  const handleAuthError = (error: unknown) => {
    console.error('Authentication error:', error)
    credentials.value = null
  }

  const clearAuth = () => {
    credentials.value = null
    selectedDeviceId.value = null
    devices.value = []
    updateConnectionStatus(false)
  }

  // Utility functions
  const generateState = () => {
    const bytes = new Uint8Array(32)
    crypto.getRandomValues(bytes)
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  const verifyState = (state: string) => {
    // Implement state verification logic
    // This should verify the state parameter to prevent CSRF attacks
    return true
  }

  // WebSocket event handlers
  const setupEventHandlers = () => {
    if (!api.value) return

    api.value.on('device.connected', (event) => {
      console.log('Device connected:', event)
      loadDevices()
    })

    api.value.on('device.disconnected', (event) => {
      console.log('Device disconnected:', event)
      loadDevices()
    })

    api.value.on('device.updated', (event) => {
      console.log('Device updated:', event)
      refreshDeviceInfo(event.deviceId)
    })

    api.value.on('settings.changed', (event) => {
      console.log('Settings changed:', event)
      refreshDeviceInfo(event.deviceId)
    })

    api.value.on('error', (event) => {
      console.error('Device error:', event)
      handleConnectionError(event.data)
    })
  }

  return {
    // State
    config,
    credentials,
    devices,
    selectedDeviceId,
    connectionStatus,
    
    // Computed
    isAuthenticated,
    selectedDevice,
    isConnected,
    
    // Actions
    initialize,
    getAuthUrl,
    completeAuthentication,
    loadDevices,
    selectDevice,
    refreshDeviceInfo,
    clearAuth,
    setupEventHandlers
  }
})