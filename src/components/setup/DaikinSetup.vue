/**
 * Daikin Developer Portal setup and configuration component
 */
<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      Daikin Developer Portal Setup
      <v-spacer></v-spacer>
      <v-btn
        icon="mdi-open-in-new"
        variant="text"
        href="https://developer.cloud.daikineurope.com/application/create"
        target="_blank"
      ></v-btn>
    </v-card-title>

    <v-card-text>
      <!-- Instructions -->
      <v-alert
        type="info"
        variant="tonal"
        class="mb-4"
      >
        <template v-slot:prepend>
          <v-icon icon="mdi-information"></v-icon>
        </template>
        To connect to your Daikin devices, you'll need to create an application in the Daikin Developer Portal.
        Follow these steps:
        <ol class="mt-2">
          <li>Visit the <a href="https://developer.cloud.daikineurope.com/application/create" target="_blank">Daikin Developer Portal</a></li>
          <li>Create a new application with the following details:</li>
        </ol>
      </v-alert>

      <!-- Configuration Form -->
      <v-form
        ref="form"
        v-model="isValid"
        @submit.prevent="handleSubmit"
      >
        <!-- Application Name -->
        <v-text-field
          v-model="config.applicationName"
          label="Application Name"
          hint="e.g., My Daikin Optimizer"
          persistent-hint
          :rules="[v => !!v || 'Application name is required']"
          required
        ></v-text-field>

        <!-- Auth Strategy (Fixed) -->
        <v-text-field
          v-model="config.authStrategy"
          label="Auth Strategy"
          disabled
          hint="Fixed to Onecta OIDC"
          persistent-hint
        ></v-text-field>

        <!-- Redirect URL -->
        <v-text-field
          v-model="config.redirectUrl"
          label="Redirect URL"
          hint="The URL where Daikin will redirect after authentication"
          persistent-hint
          :rules="[
            v => !!v || 'Redirect URL is required',
            v => /^https?:\/\/.+/.test(v) || 'Must be a valid URL starting with http:// or https://'
          ]"
          required
        >
          <template v-slot:append>
            <v-btn
              icon="mdi-content-copy"
              variant="text"
              density="compact"
              @click="copyToClipboard(config.redirectUrl)"
            ></v-btn>
          </template>
        </v-text-field>

        <!-- Description -->
        <v-textarea
          v-model="config.description"
          label="Description"
          hint="Describe the purpose of your application"
          persistent-hint
          rows="3"
          :rules="[v => !!v || 'Description is required']"
          required
        ></v-textarea>

        <!-- Application Credentials -->
        <v-expansion-panels class="mt-4">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <div class="d-flex align-center">
                <v-icon icon="mdi-key" class="mr-2"></v-icon>
                Application Credentials
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-text-field
                v-model="credentials.clientId"
                label="Client ID"
                :rules="[v => !!v || 'Client ID is required']"
                required
                :type="showCredentials ? 'text' : 'password'"
              >
                <template v-slot:append>
                  <v-btn
                    :icon="showCredentials ? 'mdi-eye-off' : 'mdi-eye'"
                    variant="text"
                    density="compact"
                    @click="showCredentials = !showCredentials"
                  ></v-btn>
                </template>
              </v-text-field>

              <v-text-field
                v-model="credentials.clientSecret"
                label="Client Secret"
                :rules="[v => !!v || 'Client Secret is required']"
                required
                :type="showCredentials ? 'text' : 'password'"
              >
                <template v-slot:append>
                  <v-btn
                    :icon="showCredentials ? 'mdi-eye-off' : 'mdi-eye'"
                    variant="text"
                    density="compact"
                    @click="showCredentials = !showCredentials"
                  ></v-btn>
                </template>
              </v-text-field>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- Actions -->
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="error"
            variant="text"
            :disabled="!hasCredentials"
            @click="clearConfig"
          >
            Clear Configuration
          </v-btn>
          <v-btn
            color="primary"
            type="submit"
            :loading="loading"
            :disabled="!isValid"
          >
            Save & Connect
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card-text>

    <!-- Success/Error Messages -->
    <v-snackbar
      v-model="showMessage"
      :color="messageType"
      location="top"
    >
      {{ message }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="showMessage = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { DaikinSetupConfig, DaikinAuthConfig } from '../../api/daikin/types'

// State
const form = ref<HTMLFormElement | null>(null)
const isValid = ref(false)
const loading = ref(false)
const showCredentials = ref(false)
const showMessage = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

const config = ref<DaikinSetupConfig>({
  applicationName: '',
  authStrategy: 'Onecta OIDC',
  redirectUrl: `${window.location.origin}/auth/callback`,
  description: ''
})

const credentials = ref<Partial<DaikinAuthConfig>>({
  clientId: '',
  clientSecret: '',
  scope: ['openid', 'offline_access']
})

// Computed
const hasCredentials = computed(() => 
  !!credentials.value.clientId && !!credentials.value.clientSecret
)

// Methods
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    showNotification('Copied to clipboard!', 'success')
  } catch (err) {
    showNotification('Failed to copy', 'error')
  }
}

const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
  message.value = msg
  messageType.value = type
  showMessage.value = true
}

const clearConfig = () => {
  credentials.value = {
    clientId: '',
    clientSecret: '',
    scope: ['openid', 'offline_access']
  }
  showNotification('Configuration cleared', 'success')
}

const handleSubmit = async () => {
  if (!isValid.value) return

  loading.value = true
  try {
    // Here we would typically:
    // 1. Validate the credentials with Daikin
    // 2. Store them securely
    // 3. Initialize the connection
    
    showNotification('Configuration saved successfully!', 'success')
  } catch (error) {
    showNotification(
      'Failed to save configuration. Please check your credentials.',
      'error'
    )
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
a {
  color: inherit;
  text-decoration: underline;
}
</style>