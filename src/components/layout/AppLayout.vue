/**
 * Main application layout component
 */
<template>
  <v-app :theme="theme">
    <!-- App Bar -->
    <v-app-bar
      :elevation="2"
      :class="{ 
        'px-2': isMobile,
        'px-4': !isMobile 
      }"
    >
      <!-- Navigation Menu (Mobile) -->
      <v-app-bar-nav-icon
        v-if="isMobile"
        @click="drawer = !drawer"
        aria-label="Toggle navigation menu"
      ></v-app-bar-nav-icon>

      <!-- App Title -->
      <v-app-bar-title class="text-truncate">
        {{ title }}
      </v-app-bar-title>

      <v-spacer></v-spacer>

      <!-- Main Actions -->
      <template v-if="!isMobile">
        <v-btn
          v-for="action in mainActions"
          :key="action.key"
          :prepend-icon="action.icon"
          :color="action.color"
          :disabled="action.disabled"
          :loading="action.loading"
          @click="action.action"
          :aria-label="action.label"
        >
          {{ action.label }}
        </v-btn>
      </template>

      <!-- Settings Menu -->
      <v-menu location="bottom end">
        <template v-slot:activator="{ props }">
          <v-btn
            icon="mdi-cog"
            v-bind="props"
            aria-label="Settings menu"
          ></v-btn>
        </template>

        <v-list>
          <!-- Theme Toggle -->
          <v-list-item>
            <v-switch
              v-model="isDarkTheme"
              :prepend-icon="isDarkTheme ? 'mdi-weather-night' : 'mdi-weather-sunny'"
              label="Dark Theme"
              hide-details
              density="compact"
            ></v-switch>
          </v-list-item>

          <v-divider></v-divider>

          <!-- Settings Items -->
          <v-list-item
            v-for="item in settingsItems"
            :key="item.key"
            :value="item.key"
            :prepend-icon="item.icon"
            @click="item.action"
          >
            <v-list-item-title>{{ item.label }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <!-- User Menu -->
      <v-menu location="bottom end">
        <template v-slot:activator="{ props }">
          <v-btn
            icon="mdi-account-circle"
            v-bind="props"
            class="ml-2"
            aria-label="User menu"
          ></v-btn>
        </template>

        <v-list>
          <v-list-item
            v-for="item in userMenuItems"
            :key="item.key"
            :value="item.key"
            :prepend-icon="item.icon"
            @click="item.action"
          >
            <v-list-item-title>{{ item.label }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Navigation Drawer (Mobile) -->
    <v-navigation-drawer
      v-if="isMobile"
      v-model="drawer"
      temporary
    >
      <v-list>
        <!-- Mobile Actions -->
        <v-list-item
          v-for="action in mainActions"
          :key="action.key"
          :value="action.key"
          :prepend-icon="action.icon"
          :disabled="action.disabled"
          @click="action.action"
        >
          <v-list-item-title>{{ action.label }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main>
      <div :class="contentClasses">
        <!-- Page Header -->
        <div v-if="showHeader" class="mb-4">
          <h1 class="text-h4 mb-2">{{ pageTitle }}</h1>
          <div class="text-subtitle-1 text-medium-emphasis">
            {{ pageDescription }}
          </div>
        </div>

        <!-- Page Content -->
        <slot></slot>
      </div>
    </v-main>

    <!-- Error Notifications -->
    <error-notifications
      :notifications="notifications"
      :current-error="currentError"
      :has-unread-notifications="hasUnreadNotifications"
      @dismiss="dismissNotification"
      @mark-as-read="markNotificationAsRead"
      @retry="retryError"
    />

    <!-- Loading Overlay -->
    <loading-overlay
      v-if="loading"
      :message="loadingMessage"
      :progress="loadingProgress"
    />
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDisplay } from 'vuetify'
import { useTheme } from 'vuetify'
import { useErrorHandler } from '@/error'
import ErrorNotifications from '@/components/error/ErrorNotifications.vue'
import LoadingOverlay from '@/components/common/LoadingState.vue'

const props = withDefaults(defineProps<{
  title?: string
  pageTitle?: string
  pageDescription?: string
  showHeader?: boolean
  loading?: boolean
  loadingMessage?: string
  loadingProgress?: number
  mainActions?: Array<{
    key: string
    label: string
    icon: string
    action: () => void
    color?: string
    disabled?: boolean
    loading?: boolean
  }>
}>(), {
  title: 'Daikin Optimizer',
  showHeader: true,
  loading: false
})

// Theme
const theme = useTheme()
const isDarkTheme = computed({
  get: () => theme.global.current.value.dark,
  set: v => theme.global.name.value = v ? 'dark' : 'light'
})

// Responsive
const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)
const drawer = ref(false)

// Error Handling
const {
  notifications,
  currentError,
  hasUnreadNotifications,
  markNotificationAsRead,
  dismissNotification
} = useErrorHandler()

// Content Classes
const contentClasses = computed(() => ({
  'pa-2': isMobile.value,
  'pa-6': !isMobile.value
}))

// Settings Menu Items
const settingsItems = [
  {
    key: 'preferences',
    label: 'Preferences',
    icon: 'mdi-cog-outline',
    action: () => { /* Open preferences */ }
  },
  {
    key: 'devices',
    label: 'Manage Devices',
    icon: 'mdi-devices',
    action: () => { /* Open device manager */ }
  }
]

// User Menu Items
const userMenuItems = [
  {
    key: 'profile',
    label: 'Profile',
    icon: 'mdi-account-outline',
    action: () => { /* Open profile */ }
  },
  {
    key: 'logout',
    label: 'Logout',
    icon: 'mdi-logout',
    action: () => { /* Handle logout */ }
  }
]

// Error Handling
const retryError = async (error: any) => {
  if (error.retry) {
    await error.retry()
  }
}

// Expose for parent component
defineExpose({
  isDarkTheme,
  isMobile
})
</script>

<style>
/* Accessibility */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Focus styles */
:focus-visible {
  outline: 2px solid var(--v-primary-base);
  outline-offset: 2px;
}

/* Touch targets */
@media (pointer: coarse) {
  .v-btn {
    min-height: 44px;
  }

  .v-list-item {
    min-height: 44px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
</style>