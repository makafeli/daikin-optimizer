/**
 * Sync status component for displaying synchronization state
 */
<template>
  <div>
    <!-- Sync Status -->
    <v-alert
      v-if="showStatus"
      :type="statusType"
      :icon="statusIcon"
      :title="statusTitle"
      class="mb-4"
      variant="tonal"
      closable
    >
      <div class="d-flex align-center justify-space-between">
        <div>
          <div v-if="error" class="text-caption text-error mt-1">
            {{ error }}
          </div>
          <div v-else-if="hasPendingChanges" class="text-caption mt-1">
            {{ pendingChangesMessage }}
          </div>
        </div>
        
        <v-btn
          v-if="showRetry"
          color="primary"
          size="small"
          prepend-icon="mdi-sync"
          @click="initialize"
          :loading="isSyncing"
        >
          Retry Sync
        </v-btn>
      </div>
    </v-alert>

    <!-- Sync Details Dialog -->
    <v-dialog v-model="showDetails" max-width="500px">
      <template v-slot:activator="{ props }">
        <v-btn
          v-if="hasPendingChanges"
          v-bind="props"
          variant="text"
          size="small"
          prepend-icon="mdi-information"
        >
          View Pending Changes
        </v-btn>
      </template>

      <v-card>
        <v-card-title>Pending Changes</v-card-title>
        
        <v-card-text>
          <v-list>
            <v-list-subheader>
              {{ pendingChangesMessage }}
            </v-list-subheader>

            <v-list-item
              v-for="change in state.offlineChanges"
              :key="change.id"
              :subtitle="formatTimestamp(change.timestamp)"
            >
              <template v-slot:prepend>
                <v-icon :icon="getChangeIcon(change)"></v-icon>
              </template>

              <v-list-item-title>
                {{ formatChange(change) }}
              </v-list-item-title>

              <template v-slot:append>
                <v-chip
                  size="small"
                  :color="change.error ? 'error' : 'grey'"
                  variant="outlined"
                >
                  {{ change.retryCount }} {{ change.retryCount === 1 ? 'retry' : 'retries' }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            text
            @click="showDetails = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { format } from 'date-fns'
import type { PendingChange, SyncState } from '@/sync/types'

const props = defineProps<{
  state: SyncState
  status: string
  error?: string
  initialized: boolean
  hasPendingChanges: boolean
  isSyncing: boolean
}>()

const emit = defineEmits<{
  initialize: []
}>()

// State
const showDetails = ref(false)

// Computed
const showStatus = computed(() => 
  !props.initialized || props.error || props.hasPendingChanges
)

const showRetry = computed(() => 
  props.error || (props.hasPendingChanges && !props.isSyncing)
)

const statusType = computed(() => {
  if (props.error) return 'error'
  if (props.isSyncing) return 'info'
  if (props.hasPendingChanges) return 'warning'
  return 'success'
})

const statusIcon = computed(() => {
  if (props.error) return 'mdi-alert-circle'
  if (props.isSyncing) return 'mdi-sync'
  if (props.hasPendingChanges) return 'mdi-clock-outline'
  return 'mdi-check-circle'
})

const statusTitle = computed(() => {
  if (!props.initialized) return 'Initializing Sync...'
  if (props.error) return 'Sync Error'
  if (props.isSyncing) return 'Syncing Changes...'
  if (props.hasPendingChanges) return 'Pending Changes'
  return 'All Changes Synced'
})

const pendingChangesMessage = computed(() => {
  const count = props.state.pendingChanges
  return `${count} pending ${count === 1 ? 'change' : 'changes'}`
})

// Methods
const initialize = () => {
  emit('initialize')
}

const formatTimestamp = (timestamp: number) => {
  return format(timestamp, 'MMM d, HH:mm:ss')
}

const getChangeIcon = (change: PendingChange) => {
  switch (change.type) {
    case 'setting': return 'mdi-cog'
    case 'schedule': return 'mdi-calendar'
    case 'profile': return 'mdi-account-cog'
    default: return 'mdi-circle'
  }
}

const formatChange = (change: PendingChange) => {
  switch (change.type) {
    case 'setting':
      return `Setting update for device ${change.deviceId}`
    case 'schedule':
      return `Schedule change for device ${change.deviceId}`
    case 'profile':
      return `Profile update for device ${change.deviceId}`
    default:
      return `Unknown change type for device ${change.deviceId}`
  }
}
</script>