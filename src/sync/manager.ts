/**
 * State synchronization manager
 */
import { LocalStorageCache } from '@/cache/storage'
import type {
  SyncState,
  PendingChange,
  SyncConfig,
  SyncResult,
  SyncStatus
} from './types'

export class SyncManager {
  private config: SyncConfig
  private cache: LocalStorageCache
  private syncTimer: number | null = null
  private state: SyncState = {
    lastSync: 0,
    syncInProgress: false,
    pendingChanges: 0,
    offlineChanges: []
  }

  constructor(config: SyncConfig) {
    this.config = config
    this.cache = new LocalStorageCache()
    this.loadState()
  }

  /**
   * Start synchronization process
   */
  public async start(): Promise<void> {
    await this.sync()
    this.startSyncTimer()
  }

  /**
   * Stop synchronization
   */
  public stop(): void {
    if (this.syncTimer) {
      window.clearInterval(this.syncTimer)
      this.syncTimer = null
    }
  }

  /**
   * Queue a change for synchronization
   */
  public async queueChange(change: Omit<PendingChange, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const pendingChange: PendingChange = {
      ...change,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0
    }

    this.state.offlineChanges.push(pendingChange)
    this.state.pendingChanges++
    
    await this.saveState()
    await this.sync()
  }

  /**
   * Get current sync status
   */
  public getStatus(): SyncStatus {
    if (this.state.syncInProgress) return 'syncing'
    if (this.state.error) return 'error'
    if (this.state.pendingChanges > 0) return 'offline'
    return 'idle'
  }

  /**
   * Get current state
   */
  public getState(): SyncState {
    return { ...this.state }
  }

  // Private methods
  private async sync(): Promise<SyncResult> {
    if (this.state.syncInProgress) {
      return { success: false, syncedChanges: 0, failedChanges: 0 }
    }

    this.state.syncInProgress = true
    this.state.error = undefined

    try {
      const changes = this.getChangesToSync()
      if (changes.length === 0) {
        return { success: true, syncedChanges: 0, failedChanges: 0 }
      }

      const results = await this.processBatch(changes)
      await this.handleSyncResults(results)

      return results
    } catch (error) {
      this.handleSyncError(error)
      return {
        success: false,
        syncedChanges: 0,
        failedChanges: this.state.pendingChanges,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    } finally {
      this.state.syncInProgress = false
      this.state.lastSync = Date.now()
      await this.saveState()
    }
  }

  private getChangesToSync(): PendingChange[] {
    return this.state.offlineChanges
      .filter(change => change.retryCount < this.config.maxRetries)
      .slice(0, this.config.batchSize)
  }

  private async processBatch(changes: PendingChange[]): Promise<SyncResult> {
    const results = {
      success: true,
      syncedChanges: 0,
      failedChanges: 0,
      errors: [] as string[]
    }

    for (const change of changes) {
      try {
        await this.processChange(change)
        results.syncedChanges++
      } catch (error) {
        results.failedChanges++
        results.success = false
        results.errors.push(
          error instanceof Error ? error.message : 'Unknown error'
        )
      }
    }

    return results
  }

  private async processChange(change: PendingChange): Promise<void> {
    try {
      // Here we would typically:
      // 1. Send the change to the server
      // 2. Wait for confirmation
      // 3. Update local state
      
      // For now, just simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Remove from pending changes on success
      this.state.offlineChanges = this.state.offlineChanges.filter(
        c => c.id !== change.id
      )
      this.state.pendingChanges--
    } catch (error) {
      change.retryCount++
      change.error = error instanceof Error ? error.message : 'Unknown error'
      throw error
    }
  }

  private handleSyncError(error: unknown): void {
    this.state.error = error instanceof Error ? error.message : 'Sync failed'
    console.error('Sync error:', error)
  }

  private async handleSyncResults(results: SyncResult): Promise<void> {
    if (!results.success && results.errors?.length) {
      this.state.error = results.errors.join(', ')
    }

    if (results.failedChanges > 0) {
      // Schedule retry with exponential backoff
      const delay = this.config.retryDelay * Math.pow(2, this.getMaxRetryCount())
      setTimeout(() => this.sync(), delay)
    }
  }

  private getMaxRetryCount(): number {
    return Math.max(
      0,
      ...this.state.offlineChanges.map(change => change.retryCount)
    )
  }

  private async loadState(): Promise<void> {
    const savedState = await this.cache.get<SyncState>(this.config.persistenceKey)
    if (savedState) {
      this.state = savedState
    }
  }

  private async saveState(): Promise<void> {
    await this.cache.set(this.config.persistenceKey, this.state)
  }

  private startSyncTimer(): void {
    this.stop()
    this.syncTimer = window.setInterval(
      () => this.sync(),
      this.config.syncInterval
    )
  }
}