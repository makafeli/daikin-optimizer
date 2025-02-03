/**
 * WebSocket connection status component
 */
<template>
  <div>
    <!-- Connection Status -->
    <v-alert
      v-if="!connected"
      type="warning"
      border="start"
      class="mb-4"
      closable
    >
      <template v-slot:prepend>
        <v-icon
          :icon="connecting ? 'mdi-reload' : 'mdi-wifi-off'"
          :class="{ 'rotating': connecting }"
        ></v-icon>
      </template>
      <div class="d-flex align-center justify-space-between">
        <div>
          <div class="text-subtitle-2">
            {{ statusMessage }}
          </div>
          <div v-if="error" class="text-caption text-error">
            {{ error }}
          </div>
        </div>
        <v-btn
          v-if="!connecting"
          color="warning"
          @click="$emit('reconnect')"
        >
          Reconnect
        </v-btn>
      </div>
    </v-alert>

    <!-- Real-time Updates -->
    <v-slide-y-transition>
      <v-alert
        v-if="showUpdateNotification"
        type="info"
        border="start"
        class="mb-4"
        closable
        @click:close="hideUpdateNotification"
      >
        <template v-slot:prepend>
          <v-icon icon="mdi-refresh"></v-icon>
        </template>
        <div class="text-subtitle-2">
          {{ lastUpdate }}
        </div>
      </v-alert>
    </v-slide-y-transition>

    <!-- Status Details Dialog -->
    <v-dialog v-model="showDetails" max-width="400px">
      <template v-slot:activator="{ props }">
        <v-btn
          v-if="connected"
          v-bind="props"
          variant="text"
          size="small"
          prepend-icon="mdi-information"
          @click="showDetails = true"
        >
          Connection Details
        </v-btn>
      </template>

      <v-card>
        <v-card-title>Connection Status</v-card-title>
        <v-card-text>
          <v-list density="compact">
            <!-- Connection State -->
            <v-list-item>
              <template v-slot:prepend>
                <v-icon
                  :icon="connected ? 'mdi-check-circle' : 'mdi-alert-circle'"
                  :color="connected ? 'success' : 'error'"
                ></v-icon>
              </template>
              <v-list-item-title>Connection State</v-list-item-title>
              <v-list-item-subtitle>
                {{ connected ? 'Connected' : 'Disconnected' }}
              </v-list-item-subtitle>
            </v-list-item>

            <!-- Last Message -->
            <v-list-item>
              <template v-slot:prepend>
                <v-icon icon="mdi-clock-outline"></v-icon>
              </template>
              <v-list-item-title>Last Message</v-list-item-title>
              <v-list-item-subtitle>
                {{ lastMessageTime || 'Never' }}
              </v-list-item-subtitle>
            </v-list-item>

            <!-- Reconnection Attempts -->
            <v-list-item v-if="reconnectAttempt">
              <template v-slot:prepend>
                <v-icon icon="mdi-reload"></v-icon>
              </template>
              <v-list-item-title>Reconnection Attempts</v-list-item-title>
              <v-list-item-subtitle>
                Attempt {{ reconnectAttempt }}
              </v-list-item-subtitle>
            </v-list-item>

            <!-- Error Details -->
            <v-list-item v-if="error">
              <template v-slot:prepend>
                <v-icon icon="mdi-alert" color="error"></v-icon>
              </template>
              <v-list-item-title>Last Error</v-list-item-title>
              <v-list-item-subtitle class="text-error">
                {{ error }}
              </v-list-item-subtitle>
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
import { format, formatDistanceToNow } from 'date-fns'
import type { WebSocketStatus } from '@/api/websocket/types'

const props = defineProps<{
  status: WebSocketStatus
}>()

const emit = defineEmits<{
  reconnect: []
}>()

// State
const showDetails = ref(false)
const showUpdateNotification = ref(false)
const lastUpdate = ref('')

// Computed
const connected = computed(() => props.status.connected)
const connecting = computed(() => props.status.connecting)
const error = computed(() => props.status.error)
const reconnectAttempt = computed(() => props.status.reconnectAttempt)

const statusMessage = computed(() => {
  if (connecting.value) {
    return `Connecting${reconnectAttempt.value ? ` (Attempt ${reconnectAttempt.value})` : ''}...`
  }
  return 'Connection lost. Real-time updates are not available.'
})

const lastMessageTime = computed(() => {
  if (!props.status.lastMessage) return null
  return formatDistanceToNow(props.status.lastMessage, { addSuffix: true })
})

// Methods
const showNotification = (message: string) => {
  lastUpdate.value = message
  showUpdateNotification.value = true
  setTimeout(hideUpdateNotification, 5000) // Hide after 5 seconds
}

const hideUpdateNotification = () => {
  showUpdateNotification.value = false
}

// Update handling
defineExpose({
  showNotification
})
</script>

<style scoped>
.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>