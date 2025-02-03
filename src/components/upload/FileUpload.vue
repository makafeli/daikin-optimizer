<template>
  <v-card class="mb-4">
    <v-card-title>Upload Settings</v-card-title>
    
    <v-card-text>
      <!-- Drag and drop zone -->
      <v-sheet
        class="d-flex align-center justify-center upload-zone"
        :class="{ 'dragover': isDragOver }"
        height="200"
        border
        rounded
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
      >
        <div class="text-center">
          <v-progress-circular
            v-if="isProcessing"
            indeterminate
            color="primary"
            size="48"
            class="mb-2"
          />
          <template v-else>
            <v-icon size="48" class="mb-2">mdi-upload</v-icon>
            <div>Drag and drop MMI export files here</div>
            <div>or</div>
            <v-btn
              color="primary"
              class="mt-2"
              @click="triggerFileInput"
              :disabled="isProcessing"
            >
              Browse Files
            </v-btn>
          </template>
          <input
            ref="fileInput"
            type="file"
            accept=".txt,.csv,.json"
            class="d-none"
            @change="handleFileSelect"
          >
        </div>
      </v-sheet>

      <!-- Text area for direct input -->
      <v-textarea
        v-model="matrixInput"
        label="Or paste matrix data directly"
        rows="4"
        class="mt-4"
        placeholder="Paste your matrix data here..."
        :disabled="isProcessing"
        :error="hasError"
        @input="validateInput"
      ></v-textarea>

      <!-- Error display -->
      <v-alert
        v-if="error"
        type="error"
        class="mt-2"
        density="compact"
        variant="tonal"
        closable
        @click:close="error = null"
      >
        {{ error.message }}
      </v-alert>

      <!-- Actions -->
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="error"
          variant="text"
          :disabled="!matrixInput && !hasError"
          @click="clearInput"
        >
          Clear
        </v-btn>
        <v-btn
          color="primary"
          :disabled="!isValid || isProcessing"
          :loading="isProcessing"
          @click="validateInput"
        >
          Process Input
        </v-btn>
      </v-card-actions>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.upload-zone {
  border: 2px dashed rgba(var(--v-theme-on-surface), 0.1);
  transition: all 0.3s ease;
}

.upload-zone.dragover {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.v-textarea :deep(textarea) {
  font-family: monospace;
}
</style>