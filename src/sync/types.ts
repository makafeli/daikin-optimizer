/**
 * Types for state synchronization
 */
export interface SyncState {
  lastSync: number
  syncInProgress: boolean
  error?: string
  pendingChanges: number
  offlineChanges: PendingChange[]
}

export interface PendingChange {
  id: string
  timestamp: number
  type: 'setting' | 'schedule' | 'profile'
  deviceId: string
  data: unknown
  retryCount: number
  error?: string
}

export interface SyncConfig {
  syncInterval: number
  maxRetries: number
  retryDelay: number
  batchSize: number
  persistenceKey: string
}

export interface SyncStorage {
  save(key: string, data: unknown): Promise<void>
  load(key: string): Promise<unknown>
  clear(key: string): Promise<void>
}

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline'

export interface SyncResult {
  success: boolean
  syncedChanges: number
  failedChanges: number
  errors?: string[]
}