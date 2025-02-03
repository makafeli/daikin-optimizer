/**
 * Daikin auth handler component
 */
<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" sm="8" md="6">
        <v-card v-if="loading">
          <v-card-text class="text-center pa-6">
            <v-progress-circular
              indeterminate
              size="64"
              color="primary"
            ></v-progress-circular>
            <div class="text-h6 mt-4">
              Completing Authentication...
            </div>
            <div class="text-body-2 text-medium-emphasis mt-2">
              Connecting to your Daikin devices
            </div>
          </v-card-text>
        </v-card>

        <v-card v-else-if="error" color="error">
          <v-card-text class="text-center pa-6">
            <v-icon icon="mdi-alert-circle" size="64"></v-icon>
            <div class="text-h6 mt-4">
              Authentication Failed
            </div>
            <div class="text-body-2 mt-2">
              {{ error }}
            </div>
            <v-btn
              color="white"
              class="mt-4"
              @click="retryAuthentication"
            >
              Try Again
            </v-btn>
          </v-card-text>
        </v-card>

        <v-card v-else-if="success" color="success">
          <v-card-text class="text-center pa-6">
            <v-icon icon="mdi-check-circle" size="64"></v-icon>
            <div class="text-h6 mt-4">
              Authentication Successful
            </div>
            <div class="text-body-2 mt-2">
              Your Daikin devices are now connected
            </div>
            <v-btn
              color="white"
              class="mt-4"
              @click="goToDashboard"
            >
              Continue to Dashboard
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDaikinStore } from '@/store/daikinStore'

// Router
const router = useRouter()

// Store
const daikinStore = useDaikinStore()

// State
const loading = ref(true)
const error = ref<string | null>(null)
const success = ref(false)

// Methods
const handleCallback = async () => {
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')
  const state = urlParams.get('state')

  if (!code) {
    error.value = 'No authorization code received'
    loading.value = false
    return
  }

  try {
    // Complete OAuth flow
    await daikinStore.completeAuthentication(code, state)
    
    // Initialize connection
    await daikinStore.initializeConnection()
    
    success.value = true
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Authentication failed'
  } finally {
    loading.value = false
  }
}

const retryAuthentication = () => {
  window.location.href = daikinStore.getAuthUrl()
}

const goToDashboard = () => {
  router.push('/dashboard')
}

// Lifecycle
onMounted(() => {
  handleCallback()
})
</script>