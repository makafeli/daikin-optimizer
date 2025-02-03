/**
 * Error boundary component for handling component errors
 */
<template>
  <div>
    <!-- Error Fallback -->
    <template v-if="error">
      <v-card
        variant="outlined"
        color="error"
        class="pa-4"
      >
        <div class="d-flex align-center mb-4">
          <v-icon
            icon="mdi-alert-circle"
            color="error"
            size="large"
            class="mr-4"
          ></v-icon>
          <div>
            <div class="text-h6">Component Error</div>
            <div class="text-body-2 mt-1">
              {{ error.message }}
            </div>
          </div>
        </div>

        <div class="d-flex justify-end">
          <v-btn
            color="error"
            @click="reset"
          >
            Reset Component
          </v-btn>
        </div>
      </v-card>
    </template>

    <!-- Content -->
    <template v-else>
      <slot></slot>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import { useErrorHandler } from '@/error'

const props = defineProps<{
  name?: string
}>()

// Error handling
const { handleError } = useErrorHandler()
const error = ref<Error | null>(null)

// Handle component errors
onErrorCaptured((err, instance, info) => {
  error.value = err as Error

  // Log error with component info
  handleError(err, 'COMPONENT_ERROR', 'error')

  // Prevent error from propagating
  return false
})

// Reset component state
const reset = () => {
  error.value = null
}
</script>