/**
 * Daikin API client implementation
 */
import type { Device, Setting, SystemStatus, Schedule, HistoricalDataPoint } from '@/types'
import { BaseApiClient } from './base'
import type { ApiConfig } from './types'

export class DaikinApi extends BaseApiClient {
  constructor(config: ApiConfig) {
    super(config)
  }

  // Device Management
  async getDevice(): Promise<Device> {
    return this.get<Device>('/device')
  }

  // Settings Management
  async getSettings(): Promise<Record<string, Setting>> {
    return this.get<Record<string, Setting>>('/settings')
  }

  async updateSetting(code: string, value: string): Promise<Setting> {
    return this.put<Setting>(`/settings/${code}`, { value })
  }

  async updateSettings(settings: Record<string, string>): Promise<Record<string, Setting>> {
    return this.post<Record<string, Setting>>('/settings', settings)
  }

  // System Status
  async getStatus(): Promise<SystemStatus> {
    return this.get<SystemStatus>('/status')
  }

  // Schedule Management
  async getSchedules(): Promise<Schedule[]> {
    return this.get<Schedule[]>('/schedules')
  }

  async updateSchedule(schedule: Schedule): Promise<Schedule> {
    return this.put<Schedule>(`/schedules/${schedule.id}`, schedule)
  }

  async createSchedule(schedule: Omit<Schedule, 'id'>): Promise<Schedule> {
    return this.post<Schedule>('/schedules', schedule)
  }

  async deleteSchedule(id: string): Promise<void> {
    return this.delete<void>(`/schedules/${id}`)
  }

  // Historical Data
  async getHistoricalData(
    type: string,
    from: number,
    to: number
  ): Promise<HistoricalDataPoint[]> {
    return this.get<HistoricalDataPoint[]>(
      `/history?type=${type}&from=${from}&to=${to}`
    )
  }

  // System Operations
  async setMode(mode: SystemStatus['mode']): Promise<SystemStatus> {
    return this.post<SystemStatus>('/mode', { mode })
  }

  async setActive(active: boolean): Promise<SystemStatus> {
    return this.post<SystemStatus>('/active', { active })
  }
}