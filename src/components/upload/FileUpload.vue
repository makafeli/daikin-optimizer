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
          <v-icon size="48" class="mb-2">mdi-upload</v-icon>
          <div>Drag and drop MMI export files here</div>
          <div>or</div>
          <v-btn
            color="primary"
            class="mt-2"
            @click="triggerFileInput"
          >
            Browse Files
          </v-btn>
          <input
            ref="fileInput"
            type="file"
            accept=".txt,.csv"
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
        @input="validateInput"
      ></v-textarea>

      <!-- Error display -->
      <v-alert
        v-if="error"
        type="error"
        class="mt-2"
        density="compact"
      >
        {{ error }}
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref } from 'vue'

const isDragOver = ref(false)
const matrixInput = ref('')
const error = ref('')
const fileInput = ref(null)

const handleDragOver = (event) => {
  isDragOver.value = true
}

const handleDragLeave = (event) => {
  isDragOver.value = false
}

const handleDrop = (event) => {
  isDragOver.value = false
  const files = event.dataTransfer.files
  if (files.length) {
    processFile(files[0])
  }
}

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileSelect = (event) => {
  const files = event.target.files
  if (files.length) {
    processFile(files[0])
  }
}

const processFile = async (file) => {
  try {
    const content = await file.text()
    validateFileContent(content)
    matrixInput.value = content
  } catch (err) {
    error.value = 'Error reading file: ' + err.message
  }
}

const validateInput = (event) => {
  // Basic validation - can be expanded based on specific requirements
  if (matrixInput.value.trim() === '') {
    error.value = ''
    return
  }
  
  try {
    validateFileContent(matrixInput.value)
    error.value = ''
  } catch (err) {
    error.value = err.message
  }
}

const validateFileContent = (content) => {
  // Add your validation logic here
  // This is a placeholder validation
  if (!content.match(/^[0-9A-F\s]+$/)) {
    throw new Error('Invalid format: File should contain only hexadecimal characters (0-9, A-F)')
  }
}
</script>

<style scoped>
.upload-zone {
  border: 2px dashed #ccc;
  transition: all 0.3s ease;
}

.upload-zone.dragover {
  border-color: primary;
  background-color: rgba(var(--v-theme-primary), 0.1);
}
</style>