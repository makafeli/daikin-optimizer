/**
 * Composable for state synchronization
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { SyncManager } from '@/sync/manager'
import type { SyncState, SyncStatus, SyncConfig, PendingChange } from '@/sync/types'

// Default configuration
const DEFAULT_CONFIG: SyncConfig = {
  syncInterval: 30000, // 30 seconds
  maxRetries: 5,
  retryDelay: 5000, // 5 seconds
  batchSize: 10,
  persistenceKey: 'sync_state'
}

export function useSync(config: Partial<SyncConfig> = {}) {
  const manager = new SyncManager({
    ...DEFAULT_CONFIG,
    ...config
  })

  // State
  const state = ref<SyncState>(manager.getState())
  const error = ref<string | undefined>()
  const initialized = ref(false)

  // Computed
  const status = computed<SyncStatus>(() => manager.getStatus())
  const hasPendingChanges = computed(() => state.value.pendingChanges > 0)
  const isSyncing = computed(() => state.value.syncInProgress)

  // Methods
  const initialize = async () => {
    if (initialized.value) return

    try {
      await manager.start()
      initialized.value = true
      error.value = undefined
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to initialize sync'
      console.error('Sync initialization error:', err)
    }
  }

  const queueChange = async (change: Omit<PendingChange, 'id' | 'timestamp' | 'retryCount'>) => {
    try {
      await manager.queueChange(change)
      state.value = manager.getState()
      error.value = undefined
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to queue change'
      throw err
    }
  }

  // Event handlers
  const handleStateChange = () => {
    state.value = manager.getState()
    error.value = state.value.error
  }

  // Lifecycle
  onMounted(() => {
    initialize()
  })

  onBeforeUnmount(() => {
    manager.stop()
  })

  return {
    // State
    state,
    status,
    error,
    initialized,
    hasPendingChanges,
    isSyncing,

    // Methods
    queueChange,
    initialize
  }
}