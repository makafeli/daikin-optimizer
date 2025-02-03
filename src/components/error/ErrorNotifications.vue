/**
 * Error notification component for displaying errors
 */
<template>
  <div class="error-notifications">
    <!-- Floating Notifications -->
    <v-fade-transition group>
      <v-alert
        v-for="notification in activeNotifications"
        :key="notification.id"
        :type="getSeverityType(notification.severity)"
        :icon="getSeverityIcon(notification.severity)"
        class="error-notification mb-2"
        closable
        @click:close="dismissNotification(notification.id)"
      >
        <div class="d-flex align-center justify-space-between">
          <div>
            <div class="text-subtitle-2">
              {{ notification.message }}
            </div>
            <div 
              v-if="notification.details"
              class="text-caption text-medium-emphasis mt-1"
            >
              {{ getErrorDetails(notification) }}
            </div>
          </div>
          
          <div class="d-flex align-center">
            <v-btn
              v-if="notification.retry"
              variant="text"
              size="small"
              prepend-icon="mdi-refresh"
              @click="retryError(notification)"
            >
              Retry
            </v-btn>
          </div>
        </div>
      </v-alert>
    </v-fade-transition>

    <!-- Notification Badge -->
    <v-badge
      v-if="hasUnreadNotifications"
      :content="unreadCount"
      color="error"
      location="bottom end"
      offset-x="16"
      offset-y="16"
    >
      <v-btn
        icon="mdi-bell"
        color="grey-darken-1"
        @click="showNotificationDrawer = true"
      ></v-btn>
    </v-badge>

    <!-- Notification Drawer -->
    <v-navigation-drawer
      v-model="showNotificationDrawer"
      location="right"
      temporary
      width="400"
    >
      <v-toolbar
        color="error"
        dark
      >
        <v-toolbar-title>Error Notifications</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn
          icon="mdi-check-all"
          variant="text"
          @click="markAllAsRead"
        ></v-btn>
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="showNotificationDrawer = false"
        ></v-btn>
      </v-toolbar>

      <v-list>
        <v-list-subheader>
          Recent Notifications
        </v-list-subheader>

        <template v-if="notifications.length">
          <v-list-item
            v-for="notification in notifications"
            :key="notification.id"
            :active="!notification.read"
            @click="markAsRead(notification.id)"
          >
            <template v-slot:prepend>
              <v-icon :icon="getSeverityIcon(notification.severity)"></v-icon>
            </template>

            <v-list-item-title>
              {{ notification.message }}
            </v-list-item-title>

            <v-list-item-subtitle>
              {{ formatTimestamp(notification.timestamp) }}
            </v-list-item-subtitle>

            <template v-slot:append>
              <v-btn
                icon="mdi-close"
                variant="text"
                size="small"
                @click.stop="dismissNotification(notification.id)"
              ></v-btn>
            </template>
          </v-list-item>
        </template>

        <v-list-item v-else>
          <v-list-item-title class="text-medium-emphasis">
            No notifications
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Critical Error Dialog -->
    <v-dialog
      v-model="showCriticalError"
      persistent
      max-width="500"
    >
      <v-card>
        <v-card-title class="bg-error text-white">
          Critical Error
        </v-card-title>

        <v-card-text class="pa-4">
          <div class="d-flex align-center mb-4">
            <v-icon
              icon="mdi-alert-circle"
              color="error"
              size="large"
              class="mr-4"
            ></v-icon>
            <div>
              <div class="text-h6">
                {{ currentError?.message }}
              </div>
              <div 
                v-if="currentError?.details"
                class="text-body-2 mt-2"
              >
                {{ getErrorDetails(currentError) }}
              </div>
            </div>
          </div>

          <v-alert
            type="warning"
            variant="tonal"
            border="start"
          >
            Please save any unsaved work and reload the application.
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="error"
            @click="reloadApplication"
          >
            Reload Application
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatDistanceToNow } from 'date-fns'
import type { ErrorNotification, AppError, ErrorSeverity } from '@/error/types'

const props = defineProps<{
  notifications: ErrorNotification[]
  currentError?: AppError
  hasUnreadNotifications: boolean
}>()

const emit = defineEmits<{
  dismiss: [id: string]
  markAsRead: [id: string]
  retry: [notification: ErrorNotification]
}>()

// State
const showNotificationDrawer = ref(false)
const showCriticalError = computed(() => 
  props.currentError?.severity === 'critical'
)

// Computed
const activeNotifications = computed(() => 
  props.notifications
    .filter(n => !n.dismissed && !n.read)
    .slice(0, 3)
)

const unreadCount = computed(() =>
  props.notifications.filter(n => !n.read && !n.dismissed).length
)

// Methods
const getSeverityType = (severity: ErrorSeverity) => {
  switch (severity) {
    case 'critical': return 'error'
    case 'error': return 'error'
    case 'warning': return 'warning'
    case 'info': return 'info'
    default: return 'error'
  }
}

const getSeverityIcon = (severity: ErrorSeverity) => {
  switch (severity) {
    case 'critical': return 'mdi-alert-circle'
    case 'error': return 'mdi-alert'
    case 'warning': return 'mdi-alert-octagon'
    case 'info': return 'mdi-information'
    default: return 'mdi-alert'
  }
}

const getErrorDetails = (error: AppError) => {
  if (error.details instanceof Error) {
    return error.details.message
  }
  return typeof error.details === 'string' 
    ? error.details
    : JSON.stringify(error.details)
}

const formatTimestamp = (timestamp: number) => {
  return formatDistanceToNow(timestamp, { addSuffix: true })
}

const dismissNotification = (id: string) => {
  emit('dismiss', id)
}

const markAsRead = (id: string) => {
  emit('markAsRead', id)
}

const markAllAsRead = () => {
  props.notifications
    .filter(n => !n.read)
    .forEach(n => markAsRead(n.id))
  showNotificationDrawer.value = false
}

const retryError = (notification: ErrorNotification) => {
  emit('retry', notification)
}

const reloadApplication = () => {
  window.location.reload()
}
</script>

<style scoped>
.error-notifications {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 1000;
  max-width: 400px;
}

.error-notification {
  pointer-events: auto;
  margin-bottom: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>