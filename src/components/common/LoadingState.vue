/**
 * Loading state component
 */
<template>
  <div>
    <!-- Loading State -->
    <template v-if="loading">
      <slot name="loading">
        <div class="d-flex align-center justify-center" :style="style">
          <v-progress-circular
            :size="size"
            :width="width"
            indeterminate
            color="primary"
          >
            <span v-if="progress" class="text-caption">
              {{ progress }}%
            </span>
          </v-progress-circular>
          
          <div v-if="message" class="text-body-2 ml-4">
            {{ message }}
          </div>
        </div>
      </slot>
    </template>

    <!-- Error State -->
    <template v-else-if="error">
      <slot name="error" :retry="retry">
        <v-alert
          type="error"
          :text="error"
          class="mb-4"
        >
          <template v-slot:append>
            <v-btn
              v-if="canRetry"
              variant="text"
              @click="retry"
              :loading="retrying"
            >
              Retry
            </v-btn>
          </template>
        </v-alert>
      </slot>
    </template>

    <!-- Content -->
    <template v-else>
      <slot></slot>
    </template>

    <!-- Overlay -->
    <v-overlay
      v-if="overlay && loading"
      :model-value="true"
      class="align-center justify-center"
    >
      <v-progress-circular
        :size="size"
        :width="width"
        indeterminate
        color="primary"
      ></v-progress-circular>
    </v-overlay>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  loading?: boolean
  error?: string | null
  message?: string
  progress?: number
  size?: number
  width?: number
  height?: string | number
  overlay?: boolean
  canRetry?: boolean
  retrying?: boolean
}>(), {
  loading: false,
  error: null,
  size: 32,
  width: 4,
  height: '200px',
  overlay: false,
  canRetry: true,
  retrying: false
})

const emit = defineEmits<{
  retry: []
}>()

// Computed
const style = computed(() => ({
  height: typeof props.height === 'number'
    ? `${props.height}px`
    : props.height
}))

// Methods
const retry = () => {
  emit('retry')
}
</script>