/**
 * Daikin API composable
 */
import { ref } from 'vue'
import type { Ref } from 'vue'
import type { ApiError } from './types'
import type { Device, Setting, SystemStatus, Schedule, HistoricalDataPoint } from '@/types'
import { DaikinApi } from './daikin'

export function useDaikinApi(api: DaikinApi) {
  const loading = ref(false)
  const error: Ref<ApiError | null> = ref(null)

  const execute = async <T>(operation: () => Promise<T>): Promise<T | null> => {
    loading.value = true
    error.value = null

    try {
      return await operation()
    } catch (err) {
      error.value = err as ApiError
      return null
    } finally {
      loading.value = false
    }
  }

  // Device Management
  const getDevice = () => execute(() => api.getDevice())

  // Settings Management
  const getSettings = () => execute(() => api.getSettings())
  
  const updateSetting = (code: string, value: string) =>
    execute(() => api.updateSetting(code, value))
  
  const updateSettings = (settings: Record<string, string>) =>
    execute(() => api.updateSettings(settings))

  // System Status
  const getStatus = () => execute(() => api.getStatus())
  
  const setMode = (mode: SystemStatus['mode']) =>
    execute(() => api.setMode(mode))
  
  const setActive = (active: boolean) =>
    execute(() => api.setActive(active))

  // Schedule Management
  const getSchedules = () => execute(() => api.getSchedules())
  
  const updateSchedule = (schedule: Schedule) =>
    execute(() => api.updateSchedule(schedule))
  
  const createSchedule = (schedule: Omit<Schedule, 'id'>) =>
    execute(() => api.createSchedule(schedule))
  
  const deleteSchedule = (id: string) =>
    execute(() => api.deleteSchedule(id))

  // Historical Data
  const getHistoricalData = (type: string, from: number, to: number) =>
    execute(() => api.getHistoricalData(type, from, to))

  return {
    loading,
    error,
    // Device
    getDevice,
    // Settings
    getSettings,
    updateSetting,
    updateSettings,
    // Status
    getStatus,
    setMode,
    setActive,
    // Schedules
    getSchedules,
    updateSchedule,
    createSchedule,
    deleteSchedule,
    // History
    getHistoricalData,
  }
}